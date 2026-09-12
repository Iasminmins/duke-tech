import { useMemo, useState } from 'react';

export type DonutSlice = { key: string; label: string; value: number; color: string };
type DonutChartProps = { data: DonutSlice[]; formatValue?: (value: number) => string; emptyLabel?: string };

const SIZE = 180;
const CENTER = SIZE / 2;
const RADIUS = 70;
const STROKE = 26;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function DonutChart({ data, formatValue = value => String(value), emptyLabel = 'Sem dados no período selecionado.' }: DonutChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const total = useMemo(() => data.reduce((sum, item) => sum + item.value, 0), [data]);

  if (!data.length || total <= 0) return <div className="chartx-empty">{emptyLabel}</div>;

  let offset = 0;
  const segments = data.map(slice => {
    const fraction = slice.value / total;
    const length = fraction * CIRCUMFERENCE;
    const segment = { ...slice, fraction, dasharray: `${Math.max(0, length - 2)} ${CIRCUMFERENCE - length + 2}`, dashoffset: -offset };
    offset += length;
    return segment;
  });
  const active = activeIndex !== null ? segments[activeIndex] : null;

  return <div className="donut-chart">
    <div className="donut-chart-visual">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label="Gráfico de pizza" className="donut-svg">
        <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="none" stroke="var(--panel-soft)" strokeWidth={STROKE} />
        {segments.map((segment, index) => <circle key={segment.key} cx={CENTER} cy={CENTER} r={RADIUS} fill="none" stroke={segment.color} strokeWidth={STROKE} strokeDasharray={segment.dasharray} strokeDashoffset={segment.dashoffset} transform={`rotate(-90 ${CENTER} ${CENTER})`} opacity={activeIndex === null || activeIndex === index ? 1 : 0.4} className="donut-segment" tabIndex={0} onMouseEnter={() => setActiveIndex(index)} onFocus={() => setActiveIndex(index)} onMouseLeave={() => setActiveIndex(null)} onBlur={() => setActiveIndex(null)} />)}
      </svg>
      <div className="donut-center">
        {active ? <><strong>{formatValue(active.value)}</strong><span>{active.label}</span></> : <><strong>{formatValue(total)}</strong><span>Total</span></>}
      </div>
    </div>
    <ul className="donut-legend">
      {segments.map((segment, index) => <li key={segment.key} className={activeIndex === index ? 'is-active' : ''} onMouseEnter={() => setActiveIndex(index)} onMouseLeave={() => setActiveIndex(null)}>
        <span className="donut-legend-swatch" style={{ background: segment.color }} />
        <span className="donut-legend-label">{segment.label}</span>
        <span className="donut-legend-value">{formatValue(segment.value)}</span>
        <span className="donut-legend-pct muted">{Math.round(segment.fraction * 100)}%</span>
      </li>)}
    </ul>
  </div>;
}
