export type PaymentInput = { id: string; total: number; payment_method: string };
export function getSalePayment(sale: PaymentInput) { return { sale_id: sale.id, amount: Number(sale.total), payment_method: sale.payment_method, paid_at: new Date().toISOString() }; }
export const defaultStoreSettings = { companyName: 'Duke Tech | Soluções Tecnológicas', phone: '(24) 99812-4113', whatsapp: '5524998124113', address: 'Belvedere Shopping', whatsappMessage: 'Olá! Aqui é da Duke Tech. Temos uma atualização sobre o seu atendimento.', privacyMessage: 'Utilizamos seus dados apenas para atendimento, contato e registro da operação.', logoUrl: '' };

export type FinanceStatus = 'pending' | 'paid' | 'overdue';
export const financeStatusLabels: Record<FinanceStatus, string> = { pending: 'Pendente', paid: 'Pago', overdue: 'Atrasado' };

export function computeFinanceStatus(dueDate: string | null | undefined, paidAt: string | null | undefined, today = new Date()): FinanceStatus {
  if (paidAt) return 'paid';
  if (dueDate && dueDate < today.toISOString().slice(0, 10)) return 'overdue';
  return 'pending';
}
