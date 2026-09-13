// Paleta compartilhada de gráficos: cada categoria/estado usa sempre a mesma cor,
// em qualquer página ou visualização (barra, linha ou pizza) que a exiba.

export const SERIES_COLORS = ['var(--series-1)', 'var(--series-2)', 'var(--series-3)', 'var(--series-4)'];

/** Formas de pagamento: cor fixa por método, não por posição no ranking. */
export const PAYMENT_METHOD_COLORS: Record<string, string> = {
  pix: 'var(--series-1)',
  credit: 'var(--series-2)',
  cash: 'var(--series-3)',
  debit: 'var(--series-4)',
  installments: 'var(--series-2)',
  other: 'var(--chart-axis)',
};

export const STATUS_SEVERITY_COLORS = {
  good: 'var(--status-good)',
  warning: 'var(--status-warning)',
  serious: 'var(--status-serious)',
  critical: 'var(--status-critical)',
} as const;

/** Gravidade de estoque: 0 unidades é crítico, abaixo do mínimo é apenas atenção. */
export function stockAlertSeverity(quantity: number): keyof typeof STATUS_SEVERITY_COLORS {
  return quantity <= 0 ? 'critical' : 'warning';
}

/** Cor estável por categoria, para casos sem mapeamento fixo (ex.: categorias livres de despesas). */
export function categoryColor(key: string, index: number): string {
  return SERIES_COLORS[index % SERIES_COLORS.length] || 'var(--chart-axis)';
}

/**
 * Rampa ordinal de um único matiz para status que formam um funil com ordem natural
 * (ex.: Recebido → ... → Entregue). `position` é o índice do status na ordem canônica,
 * não a posição de ordenação por contagem — assim a cor de cada status não muda entre períodos.
 */
export function ordinalRampColor(position: number, total: number): string {
  if (total <= 1) return 'color-mix(in srgb, var(--series-1) 100%, var(--chart-surface, var(--panel)))';
  const pct = 35 + Math.round((position / (total - 1)) * 65);
  return `color-mix(in srgb, var(--series-1) ${pct}%, var(--chart-surface, var(--panel)))`;
}
