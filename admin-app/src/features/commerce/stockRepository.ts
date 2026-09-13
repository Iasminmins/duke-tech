import { supabase } from '../../lib/supabase';

export type PurchaseRequestStatus = 'pending' | 'received' | 'cancelled';
export type PurchaseRequest = { id: string; product_id: string; supplier_name: string; quantity: number; expected_date: string | null; note: string | null; status: PurchaseRequestStatus; created_at: string; products?: { name: string } | null };
export type PurchaseRequestInput = { product_id: string; supplier_name: string; quantity: number; expected_date: string; note: string };

export function validatePurchaseRequest(input: PurchaseRequestInput) {
  if (!input.product_id) return 'Selecione um produto.';
  if (!input.supplier_name.trim()) return 'Informe o fornecedor.';
  if (!input.quantity || input.quantity <= 0) return 'Informe uma quantidade válida.';
  return '';
}

export async function listPurchaseRequests(status?: PurchaseRequestStatus) {
  if (!supabase) return { data: [] as PurchaseRequest[], error: new Error('Supabase não configurado.') };
  let query = supabase.from('purchase_requests').select('id,product_id,supplier_name,quantity,expected_date,note,status,created_at,products(name)').order('created_at', { ascending: false });
  if (status) query = query.eq('status', status);
  const { data, error } = await query;
  return { data: (data || []) as unknown as PurchaseRequest[], error };
}

export async function createPurchaseRequest(input: PurchaseRequestInput) {
  const validationError = validatePurchaseRequest(input);
  if (validationError) return { data: null, error: new Error(validationError) };
  if (!supabase) return { data: null, error: new Error('Supabase não configurado.') };
  const { data, error } = await supabase.from('purchase_requests').insert({
    product_id: input.product_id,
    supplier_name: input.supplier_name.trim(),
    quantity: input.quantity,
    expected_date: input.expected_date || null,
    note: input.note.trim() || null,
  }).select('id,product_id,supplier_name,quantity,expected_date,note,status,created_at,products(name)').single();
  return { data: data as unknown as PurchaseRequest | null, error };
}

export async function updatePurchaseRequestStatus(id: string, status: PurchaseRequestStatus) {
  if (!supabase) return { data: null, error: new Error('Supabase não configurado.') };
  const { data, error } = await supabase.from('purchase_requests').update({ status }).eq('id', id).select('id,product_id,supplier_name,quantity,expected_date,note,status,created_at,products(name)').single();
  return { data: data as unknown as PurchaseRequest | null, error };
}
