type Props = { height?: number };

/** Placeholder de carregamento para painéis de gráfico: barras de altura variável com shimmer, nunca "carregando..." cru. */
export function ChartSkeleton({ height = 220 }: Props) {
  const bars = [38, 62, 45, 80, 55, 70, 48, 90, 60, 40];
  return (
    <div className="chartx-skeleton" style={{ height }} aria-hidden="true">
      {bars.map((value, index) => (
        <span key={index} className="chartx-skeleton-bar" style={{ height: `${value}%` }} />
      ))}
    </div>
  );
}
