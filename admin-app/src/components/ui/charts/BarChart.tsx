import { useId, useMemo, useState, type KeyboardEvent } from 'react';

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

const VW = 600;
const PAD = { top: 10, right: 8, bottom: 26, left: 46 };
const modeLabels: Record<ChartMode, string> = { bar: 'Barras', line: 'Linha', area: 'Área' };

function niceMax(value: number) {
  if (value <= 0) return 10;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const normalized = value / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

function barTopPath(x: number, y: number, w: number, h: number, r: number) {
  if (h <= 0.5) return `M${x},${y + h} L${x + w},${y + h} L${x + w},${y + h} L${x},${y + h} Z`;
  const radius = Math.min(r, w / 2, h);
  return `M${x},${y + h} L${x},${y + radius} Q${x},${y} ${x + radius},${y} L${x + w - radius},${y} Q${x + w},${y} ${x + w},${y + radius} L${x + w},${y + h} Z`;
}

type Point = { x: number; y: number };
function smoothLine(points: Point[]) {
  if (points.length === 0) return '';
  if (points.length === 1) return `M${points[0].x},${points[0].y}`;
  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const c1x = p1.x + (p2.x - p0.x) / 6, c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6, c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`;
  }
  return d;
}

export function BarChart({ data, series, height = 220, formatValue = value => String(value), emptyLabel = 'Sem dados no período selecionado.', modes = ['bar', 'line', 'area'], defaultMode = 'bar' }: BarChartProps) {
  const chartId = useId();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [tableOpen, setTableOpen] = useState(false);
  const [mode, setMode] = useState<ChartMode>(defaultMode);

  const maxValue = useMemo(() => niceMax(Math.max(1, ...data.flatMap(row => series.map(item => row.values[item.key] || 0)))), [data, series]);
  const plotWidth = VW - PAD.left - PAD.right;
  const plotHeight = height - PAD.top - PAD.bottom;
  const bandWidth = data.length ? plotWidth / data.length : plotWidth;
  const barWidth = Math.min(22, series.length === 2 ? (bandWidth - 6) / 2 : bandWidth * 0.65);
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  const baselineY = PAD.top + plotHeight;
  const pointX = (index: number) => PAD.left + index * bandWidth + bandWidth / 2;
  const pointY = (value: number) => PAD.top + plotHeight - plotHeight * (value / maxValue);

  function move(step: number) {
    if (!data.length) return;
    setActiveIndex(current => { const base = current ?? 0; const next = Math.min(data.length - 1, Math.max(0, base + step)); return next; });
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

  return <div className="chartx">
    <div className="chartx-toolbar">
      {series.length > 1 && <div className="chartx-legend" role="list">
        {series.map(item => <span className="chartx-legend-item" role="listitem" key={item.key}><span className="chartx-legend-swatch" style={{ background: item.color }} />{item.label}</span>)}
      </div>}
      {effectiveModes.length > 1 && <div className="view-toggle chartx-mode-toggle" role="group" aria-label="Tipo de gráfico">
        {effectiveModes.map(item => <button key={item} type="button" className={`btn${mode === item ? ' active' : ''}`} aria-pressed={mode === item} onClick={() => setMode(item)}>{modeLabels[item]}</button>)}
      </div>}
    </div>
    <div className="chartx-canvas">
      <svg viewBox={`0 0 ${VW} ${height}`} preserveAspectRatio="none" className="chartx-svg" style={{ height }} role="img" aria-label="Gráfico" tabIndex={0} onKeyDown={onKeyDown} onMouseLeave={() => setActiveIndex(null)} onBlur={() => setActiveIndex(null)}>
        {ticks.map(tick => { const y = PAD.top + plotHeight * (1 - tick); return <g key={tick}><line x1={PAD.left} x2={VW - PAD.right} y1={y} y2={y} className="chartx-grid" /><text x={PAD.left - 8} y={y} textAnchor="end" dominantBaseline="middle" className="chartx-tick">{formatValue(maxValue * tick)}</text></g>; })}

        {effectiveMode === 'bar' && data.map((row, index) => {
          const groupX = PAD.left + index * bandWidth;
          const totalBarsWidth = series.length === 2 ? barWidth * 2 + 2 : barWidth;
          const startX = groupX + (bandWidth - totalBarsWidth) / 2;
          return <g key={row.label}>
            {series.map((item, seriesIndex) => {
              const value = row.values[item.key] || 0;
              const barHeight = plotHeight * (value / maxValue);
              const x = series.length === 2 ? startX + seriesIndex * (barWidth + 2) : startX;
              const y = PAD.top + plotHeight - barHeight;
              const isActive = activeIndex === index;
              return <path key={item.key} d={barTopPath(x, y, barWidth, barHeight, 4)} fill={item.color} opacity={activeIndex === null || isActive ? 1 : 0.55} className="chartx-bar" />;
            })}
          </g>;
        })}

        {(effectiveMode === 'line' || effectiveMode === 'area') && series.map(item => {
          const points = data.map((row, index) => ({ x: pointX(index), y: pointY(row.values[item.key] || 0) }));
          const linePath = smoothLine(points);
          const areaPath = effectiveMode === 'area' ? `${linePath} L${points[points.length - 1].x},${baselineY} L${points[0].x},${baselineY} Z` : '';
          return <g key={item.key}>
            {effectiveMode === 'area' && <path d={areaPath} fill={item.color} opacity={0.12} />}
            <path d={linePath} fill="none" stroke={item.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={effectiveMode === 'line' ? '0.1 7.5' : undefined} />
            {points.map((point, index) => <circle key={index} cx={point.x} cy={point.y} r={activeIndex === index ? 5 : 4} fill={item.color} stroke="var(--panel)" strokeWidth={2} opacity={activeIndex === null || activeIndex === index ? 1 : 0.6} />)}
          </g>;
        })}

        {data.map((row, index) => <g key={`hit-${row.label}`}>
          <rect x={PAD.left + index * bandWidth} y={PAD.top} width={bandWidth} height={plotHeight} fill="transparent" onMouseEnter={() => setActiveIndex(index)} onFocus={() => setActiveIndex(index)} tabIndex={-1} />
          <text x={PAD.left + index * bandWidth + bandWidth / 2} y={height - 8} className={`chartx-x-label${activeIndex === index ? ' is-active' : ''}`}>{row.label}</text>
        </g>)}

        {activeIndex !== null && <line x1={activeX} x2={activeX} y1={PAD.top} y2={PAD.top + plotHeight} className="chartx-crosshair" />}
      </svg>

      {active && <div className="chartx-tooltip" style={{ left: `${Math.min(92, Math.max(8, (activeX / VW) * 100))}%` }} role="status">
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
