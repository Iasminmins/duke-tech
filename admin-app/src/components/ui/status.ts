import type { BadgeTone } from './Badge';

export const statusLabels: Record<string, string> = { received: 'Recebido', diagnosis: 'Em diagnóstico', quote_sent: 'Orçamento enviado', awaiting_approval: 'Aguardando aprovação', approved: 'Aprovado', rejected: 'Recusado', awaiting_part: 'Aguardando peça', repair: 'Em reparo', testing: 'Em testes', ready: 'Pronto para retirada', delivered: 'Entregue', cancelled: 'Cancelado' };
export const priorityLabels: Record<string, string> = { normal: 'Normal', high: 'Alta', urgent: 'Urgente' };
export const formatMetric = (value: number) => Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }).replace(/ /g, ' ');

/** Fonte unica de verdade para o badge de status de estoque (Produtos e Estoque). */
export function stockStatusTone(product: { active: boolean; quantity: number; minimum_stock: number }): { tone: BadgeTone; label: string } {
  if (!product.active) return { tone: 'danger', label: 'Inativo' };
  if (product.quantity === 0) return { tone: 'danger', label: 'Sem estoque' };
  if (product.quantity <= product.minimum_stock) return { tone: 'warning', label: 'Estoque baixo' };
  return { tone: 'success', label: 'Ativo' };
}
