import { supabase } from '../../lib/supabase'; import { normalizePhone, type CustomerInput } from './customerSchema';

const DUPLICATE_CODE = '23505';
const friendlyDuplicateMessage = 'Já existe um cliente cadastrado com este telefone.';

export async function listCustomers(search = '') {
  if (!supabase) return { data: [], error: new Error('Supabase não configurado.') };
  let query = supabase.from('customers').select('*,work_orders(status,final_amount,created_at)').is('archived_at', null).order('created_at', { ascending: false });
  if (search) {
    const digits = normalizePhone(search);
    // Busca simultânea por nome ou telefone, como pedido em "busca rápida".
    query = digits.length >= 3
      ? query.or(`full_name.ilike.%${search}%,phone.ilike.%${digits}%`)
      : query.ilike('full_name', `%${search}%`);
  }
  return query;
}

export async function createCustomer(input: CustomerInput) {
  if (!supabase) return { data: null, error: new Error('Supabase não configurado.') };
  const result = await supabase.from('customers').insert({ full_name: input.full_name, phone: input.phone, whatsapp: input.whatsapp || null, email: input.email || null, cpf: input.cpf || null, address: input.address || null, notes: input.notes || null }).select().single();
  if (result.error && (result.error as { code?: string }).code === DUPLICATE_CODE) {
    return { data: null, error: new Error(friendlyDuplicateMessage) };
  }
  return result;
}

export async function updateCustomer(id: string, input: CustomerInput) {
  if (!supabase) return { data: null, error: new Error('Supabase não configurado.') };
  const result = await supabase.from('customers').update({ full_name: input.full_name, phone: input.phone, whatsapp: input.whatsapp || null, email: input.email || null, cpf: input.cpf || null, address: input.address || null, notes: input.notes || null }).eq('id', id).select().single();
  if (result.error && (result.error as { code?: string }).code === DUPLICATE_CODE) {
    return { data: null, error: new Error(friendlyDuplicateMessage) };
  }
  return result;
}

export async function archiveCustomer(id: string) {
  if (!supabase) return { error: new Error('Supabase não configurado.') };
  const { error } = await supabase.from('customers').update({ archived_at: new Date().toISOString() }).eq('id', id);
  return { error };
}

export type CustomerDetail = {
  id: string; full_name: string; phone: string; whatsapp: string | null; email: string | null; cpf: string | null; address: string | null; notes: string | null; created_at: string;
};
export type CustomerDevice = { id: string; brand: string; model: string; reported_problem: string; received_at: string };
export type CustomerOrder = { id: string; number: number; status: string; final_amount: number; created_at: string };

export async function getCustomerDetail(id: string) {
  if (!supabase) return { data: null, devices: [], orders: [], error: new Error('Supabase não configurado.') };
  const [customer, devices, orders] = await Promise.all([
    supabase.from('customers').select('id,full_name,phone,whatsapp,email,cpf,address,notes,created_at').eq('id', id).is('archived_at', null).maybeSingle(),
    supabase.from('devices').select('id,brand,model,reported_problem,received_at').eq('customer_id', id).is('archived_at', null).order('received_at', { ascending: false }),
    supabase.from('work_orders').select('id,number,status,final_amount,created_at').eq('customer_id', id).is('archived_at', null).order('created_at', { ascending: false }),
  ]);
  return {
    data: (customer.data as CustomerDetail | null) ?? null,
    devices: (devices.data as CustomerDevice[]) || [],
    orders: (orders.data as CustomerOrder[]) || [],
    error: customer.error || devices.error || orders.error || null,
  };
}
