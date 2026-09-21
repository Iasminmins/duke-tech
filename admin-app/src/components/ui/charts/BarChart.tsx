import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';

export type BarSeries = { key: string; label: string; color: string };
export type BarChartDatum = { label: string; sublabel?: string; values: Record<string, number> };
export type ChartMode = 'bar' | 'line' | 'area';

type BarChartProps = {
  data: BarChartDatum[];
  series: BarSeries[];
  height?: number;
  formatValue?: (value: number) => string;
  emptyLabel?: string;
  modes?: ChartMode[];
  defaultMode?: ChartMode;
};

const DEFAULT_WIDTH = 600;
const PAD = { top: 12, right: 12, bottom: 30, left: 46 };
const modeLabels: Record<ChartMode, string> = { bar: 'Barras', line: 'Linha', area: 'Área' };

function niceMax(value: number) {
  if (value <= 0) return 10;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const normalized = value / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

function barTopPath(x: number, y: number, w: number, h: number, r: number) {
  if (h <= 0.5) return `M${x},${y + h} L${x + w},${y + h} Z`;
  const radius = Math.min(r, w / 2, h);
  return `M${x},${y + h} L${x},${y + radius} Q${x},${y} ${x + radius},${y} L${x + w - radius},${y} Q${x + w},${y} ${x + w},${y + radius} L${x + w},${y + h} Z`;
}

type Point = { x: number; y: number };

// Curva suave "monotônica": passa por todos os pontos sem nunca ultrapassar
// o valor mínimo/máximo entre vizinhos. A curva anterior (Catmull-Rom)
// "estourava" para baixo do zero perto de picos de faturamento.
function smoothLine(points: Point[]) {
  const n = points.length;
  if (n === 0) return '';
  if (n === 1) return `M${points[0].x},${points[0].y}`;
  if (n === 2) return `M${points[0].x},${points[0].y} L${points[1].x},${points[1].y}`;
  const dx: number[] = [], slope: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx[i] = points[i + 1].x - points[i].x;
    slope[i] = dx[i] === 0 ? 0 : (points[i + 1].y - points[i].y) / dx[i];
  }
  const m: number[] = new Array(n);
  m[0] = slope[0];
  m[n - 1] = slope[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = slope[i - 1] * slope[i] <= 0 ? 0 : (slope[i - 1] + slope[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (slope[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
    const a = m[i] / slope[i], b = m[i + 1] / slope[i];
    const h = a * a + b * b;
    if (h > 9) { const t = 3 / Math.sqrt(h); m[i] = t * a * slope[i]; m[i + 1] = t * b * slope[i]; }
  }
  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 0; i < n - 1; i++) {
    const p1 = points[i], p2 = points[i + 1];
    d += ` C${p1.x + dx[i] / 3},${p1.y + (m[i] * dx[i]) / 3} ${p2.x - dx[i] / 3},${p2.y - (m[i + 1] * dx[i]) / 3} ${p2.x},${p2.y}`;
  }
  return d;
}

// Rótulos do eixo Y mais curtos: "R$ 1.000,00" vira "R$ 1.000".
const shortTick = (text: string) => text.replace(/,00$/, '');

export function BarChart({ data, series, height = 220, formatValue = value => String(value), emptyLabel = 'Sem dados no período selecionado.', modes = ['bar', 'line', 'area'], defaultMode = 'bar' }: BarChartProps) {
  const chartId = useId();
  const gradientPrefix = chartId.replace(/[^a-zA-Z0-9_-]/g, '');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [tableOpen, setTableOpen] = useState(false);
  const [mode, setMode] = useState<ChartMode>(defaultMode);
  const canvasRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltipLeft, setTooltipLeft] = useState<number | null>(null);
  const [padLeft, setPadLeft] = useState(PAD.left);
  const [width, setWidth] = useState(DEFAULT_WIDTH);

  // O SVG usa a largura real do card (em pixels) em vez de um viewBox fixo
  // esticado. Antes, `preserveAspectRatio="none"` deformava textos e
  // marcadores conforme o tamanho da tela.
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const update = () => { const w = Math.round(el.clientWidth); if (w > 0) setWidth(current => (current === w ? current : Math.max(260, w))); };
    update();
    if (typeof ResizeObserver === 'undefined') { window.addEventListener('resize', update); return () => window.removeEventListener('resize', update); }
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const maxValue = useMemo(() => niceMax(Math.max(1, ...data.flatMap(row => series.map(item => row.values[item.key] || 0)))), [data, series]);
  const pad = { ...PAD, left: padLeft };
  const plotWidth = width - pad.left - PAD.right;
  const plotHeight = height - PAD.top - PAD.bottom;
  const bandWidth = data.length ? plotWidth / data.length : plotWidth;
  const sparse = data.length <= 6;
  const barWidth = series.length >= 2
    ? Math.max(4, Math.min(sparse ? 36 : 18, (bandWidth * 0.7 - 2) / 2))
    : Math.max(4, Math.min(sparse ? 64 : 28, bandWidth * 0.6));
  // Mostra só quantos rótulos do eixo X cabem sem se sobrepor (~64px cada).
  const maxLabels = Math.max(2, Math.floor(plotWidth / 64));
  const labelStep = Math.max(1, Math.ceil(data.length / maxLabels));
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  const baselineY = PAD.top + plotHeight;
  const pointX = (index: number) => pad.left + index * bandWidth + bandWidth / 2;
  const pointY = (value: number) => PAD.top + plotHeight - plotHeight * (value / maxValue);

  // Mede o rótulo mais largo do eixo Y e reserva o espaço necessário à esquerda.
  useLayoutEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;
    let maxWidth = 0;
    svgEl.querySelectorAll('.chartx-tick').forEach(node => {
      try {
        const w = (node as SVGTextElement).getBBox().width;
        if (w > maxWidth) maxWidth = w;
      } catch { /* elemento ainda não mensurável, ignora */ }
    });
    if (maxWidth > 0) {
      const needed = Math.min(150, Math.max(PAD.left, Math.ceil(maxWidth) + 16));
      setPadLeft(current => (current === needed ? current : needed));
    }
  }, [data, series, maxValue, formatValue]);

  // Posiciona o tooltip em pixels e o mantém dentro do card.
  useLayoutEffect(() => {
    if (activeIndex === null) { setTooltipLeft(null); return; }
    const canvasEl = canvasRef.current;
    const tooltipEl = tooltipRef.current;
    if (!canvasEl || !tooltipEl) return;
    const canvasWidth = canvasEl.clientWidth;
    if (!canvasWidth) return;
    const half = tooltipEl.offsetWidth / 2;
    const margin = 8;
    const min = Math.min(half + margin, canvasWidth / 2);
    const max = Math.max(canvasWidth - half - margin, canvasWidth / 2);
    setTooltipLeft(Math.min(max, Math.max(min, pointX(activeIndex))));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, data, series, height, width, padLeft]);

  function move(step: number) {
    if (!data.length) return;
    setActiveIndex(current => { const base = current ?? 0; return Math.min(data.length - 1, Math.max(0, base + step)); });
  }
  function onKeyDown(event: KeyboardEvent<SVGSVGElement>) {
    if (event.key === 'ArrowRight') { event.preventDefault(); move(1); }
    else if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); }
    else if (event.key === 'Escape') { setActiveIndex(null); }
  }

  if (!data.length) return <div className="chartx-empty">{emptyLabel}</div>;

  // Linha/área não fazem sentido com menos de 2 pontos (nada para conectar) — força barras.
  const effectiveModes = data.length < 2 ? (['bar'] as ChartMode[]) : modes;
  const effectiveMode = data.length < 2 ? 'bar' : mode;

  const active = activeIndex !== null ? data[activeIndex] : null;
  const activeX = activeIndex !== null ? pointX(activeIndex) : 0;
  const showAllDots = data.length <= 7;

  return <div className="chartx">
    <div className="chartx-toolbar">
      {series.length > 1 && <div className="chartx-legend" role="list">
        {series.map(item => <span className="chartx-legend-item" role="listitem" key={item.key}><span className="chartx-legend-swatch" style={{ background: item.color }} />{item.label}</span>)}
      </div>}
      {effectiveModes.length > 1 && <div className="view-toggle chartx-mode-toggle" role="group" aria-label="Tipo de gráfico">
        {effectiveModes.map(item => <button key={item} type="button" className={`btn${mode === item ? ' active' : ''}`} aria-pressed={mode === item} onClick={() => setMode(item)}>{modeLabels[item]}</button>)}
      </div>}
    </div>
    <div className="chartx-canvas" ref={canvasRef}>
      <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} className="chartx-svg" style={{ height }} role="img" aria-label="Gráfico" tabIndex={0} ref={svgRef} onKeyDown={onKeyDown} onMouseLeave={() => setActiveIndex(null)} onBlur={() => setActiveIndex(null)}>
        <defs>
          {series.map(item => <linearGradient key={item.key} id={`${gradientPrefix}-${item.key}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={item.color} stopOpacity={effectiveMode === 'area' ? 0.28 : 0.16} />
            <stop offset="100%" stopColor={item.color} stopOpacity={0} />
          </linearGradient>)}
        </defs>
        {ticks.map(tick => { const y = PAD.top + plotHeight * (1 - tick); return <g key={tick}><line x1={pad.left} x2={width - PAD.right} y1={y} y2={y} className={`chartx-grid${tick === 0 ? ' is-base' : ''}`} /><text x={pad.left - 10} y={y} textAnchor="end" dominantBaseline="middle" className="chartx-tick">{shortTick(formatValue(maxValue * tick))}</text></g>; })}

        {effectiveMode === 'bar' && data.map((row, index) => {
          const groupX = pad.left + index * bandWidth;
          const gap = 3;
          const totalBarsWidth = series.length >= 2 ? barWidth * series.length + gap * (series.length - 1) : barWidth;
          const startX = groupX + (bandWidth - totalBarsWidth) / 2;
          const isActive = activeIndex === index;
          return <g key={row.label}>
            {isActive && <rect x={groupX + 2} y={PAD.top} width={Math.max(0, bandWidth - 4)} height={plotHeight} className="chartx-band" />}
            {series.map((item, seriesIndex) => {
              const value = row.values[item.key] || 0;
              const barHeight = plotHeight * (value / maxValue);
              const x = startX + seriesIndex * (barWidth + gap);
              const y = PAD.top + plotHeight - barHeight;
              return <path key={item.key} d={barTopPath(x, y, barWidth, barHeight, 4)} fill={item.color} opacity={activeIndex === null || isActive ? 1 : 0.5} className="chartx-bar" />;
            })}
          </g>;
        })}

        {(effectiveMode === 'line' || effectiveMode === 'area') && series.map(item => {
          const points = data.map((row, index) => ({ x: pointX(index), y: pointY(row.values[item.key] || 0) }));
          const linePath = smoothLine(points);
          const areaPath = `${linePath} L${points[points.length - 1].x},${baselineY} L${points[0].x},${baselineY} Z`;
          return <g key={item.key}>
            {(effectiveMode === 'area' || data.length > 7) && <path d={areaPath} fill={`url(#${gradientPrefix}-${item.key})`} />}
            <path d={linePath} fill="none" stroke={item.color} strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" />
            {points.map((point, index) => (showAllDots || activeIndex === index) && <circle key={index} cx={point.x} cy={point.y} r={activeIndex === index ? 5 : 3.5} fill={activeIndex === index ? item.color : 'var(--panel)'} stroke={item.color} strokeWidth={2} />)}
          </g>;
        })}

        {activeIndex !== null && effectiveMode !== 'bar' && <line x1={activeX} x2={activeX} y1={PAD.top} y2={baselineY} className="chartx-crosshair" />}

        {data.map((row, index) => <g key={`hit-${row.label}`}>
          <rect x={pad.left + index * bandWidth} y={PAD.top} width={bandWidth} height={plotHeight} fill="transparent" onMouseEnter={() => setActiveIndex(index)} onTouchStart={() => setActiveIndex(index)} />
          {(index % labelStep === 0 || (index === data.length - 1 && (data.length - 1) % labelStep >= Math.ceil(labelStep / 2))) && <text x={pad.left + index * bandWidth + bandWidth / 2} y={height - 9} className={`chartx-x-label${activeIndex === index ? ' is-active' : ''}`}>{row.label}</text>}
        </g>)}
      </svg>

      {active && <div
        ref={tooltipRef}
        className="chartx-tooltip"
        style={tooltipLeft !== null ? { left: `${tooltipLeft}px` } : { left: `${Math.max(8, activeX)}px`, visibility: 'hidden' }}
        role="status">
        <strong>{active.label}{active.sublabel ? ` · ${active.sublabel}` : ''}</strong>
        {series.map(item => <div className="chartx-tooltip-row" key={item.key}><span className="chartx-tooltip-key" style={{ background: item.color }} />{series.length > 1 && <span className="chartx-tooltip-label">{item.label}</span>}<span className="chartx-tooltip-value">{formatValue(active.values[item.key] || 0)}</span></div>)}
      </div>}
    </div>

    <details className="chartx-table-toggle" open={tableOpen} onToggle={event => setTableOpen((event.target as HTMLDetailsElement).open)}>
      <summary>Ver dados em tabela</summary>
      <div className="table-wrap" style={{ marginTop: 10 }}>
        <table className="table" id={`${chartId}-table`}>
          <thead><tr><th>Data</th>{series.map(item => <th key={item.key}>{item.label}</th>)}</tr></thead>
          <tbody>{data.map(row => <tr key={row.label}><td>{row.label}</td>{series.map(item => <td key={item.key}>{formatValue(row.values[item.key] || 0)}</td>)}</tr>)}</tbody>
        </table>
      </div>
    </details>
  </div>;
}
