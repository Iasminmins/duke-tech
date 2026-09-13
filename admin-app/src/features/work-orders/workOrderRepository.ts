import { supabase } from '../../lib/supabase';
import { defaultStoreSettings } from '../finance/financeUtils';
import { statusLabels, type WorkOrderInput, type WorkOrderStatus } from './workOrderSchema';

export type WorkOrderListItem = { id: string; number: number; status: WorkOrderStatus; priority: 'normal' | 'high' | 'urgent'; estimated_due_date: string | null; final_amount: number; created_at: string; customers: { full_name: string; phone?: string } | null; devices: { brand: string; model: string } | null };
export type WorkOrderHistory = { id: string; status: WorkOrderStatus; note: string | null; created_at: string };
export type WorkOrderDetail = { id: string; number: number; public_code: string; status: WorkOrderStatus; priority: 'normal' | 'high' | 'urgent'; service_requested: string; diagnosis: string | null; quote: number; final_amount: number; internal_notes: string | null; public_message: string | null; estimated_due_date: string | null; created_at: string; updated_at: string; customers: { full_name: string; phone: string | null; whatsapp: string | null } | null; devices: { brand: string; model: string; reported_problem: string; serial_number: string | null } | null; work_order_status_history: WorkOrderHistory[] };

export function formatWorkOrderNumber(number: number) { return `#${number}`; }
export function mapWorkOrderDetail(row: Partial<WorkOrderDetail>) { return { ...row, work_order_status_history: [...(row.work_order_status_history || [])].sort((a, b) => a.created_at.localeCompare(b.created_at)) } as WorkOrderDetail; }

export async function listWorkOrders(statuses?: WorkOrderStatus[]) {
  if (!supabase) return { data: [] as WorkOrderListItem[], error: new Error('Supabase não configurado.') };
  let query = supabase.from('work_orders').select('id,number,status,priority,estimated_due_date,final_amount,created_at,customers(full_name,phone),devices(brand,model)').is('archived_at', null).order('created_at', { ascending: false }).limit(100);
  if (statuses && statuses.length) query = query.in('status', statuses);
  const { data, error } = await query;
  return { data: (data || []) as unknown as WorkOrderListItem[], error };
}

export async function getWorkOrderDetail(id: string) {
  if (!supabase) return { data: null, error: new Error('Supabase não configurado.') };
  const { data, error } = await supabase.from('work_orders').select('id,number,public_code,status,priority,service_requested,diagnosis,quote,final_amount,internal_notes,public_message,estimated_due_date,created_at,updated_at,customers(full_name,phone,whatsapp),devices(brand,model,reported_problem,serial_number)').eq('id', id).is('archived_at', null).maybeSingle();
  if (error || !data) return { data: null, error };
  const historyResult = await supabase.from('work_order_status_history').select('id,status,note,created_at').eq('work_order_id', id).order('created_at', { ascending: true });
  return { data: mapWorkOrderDetail({ ...(data as unknown as WorkOrderDetail), work_order_status_history: (historyResult.data || []) as WorkOrderHistory[] }), error: historyResult.error };
}

export async function createWorkOrder(input: WorkOrderInput) {
  if (!supabase) return { data: null, error: new Error('Supabase não configurado.') };
  const { data, error } = await supabase.from('work_orders').insert({ customer_id: input.customer_id, device_id: input.device_id, service_requested: input.service_requested, priority: input.priority, estimated_due_date: input.estimated_due_date || null, internal_notes: input.internal_notes || null }).select().single();
  if (error || !data) return { data: null, error: error || new Error('Não foi possível criar a comanda.') };
  const history = await supabase.from('work_order_status_history').insert({ work_order_id: data.id, status: 'received', note: 'Comanda criada' });
  return history.error ? { data: null, error: history.error } : { data, error: null };
}

export async function getWhatsappTemplate() {
  if (!supabase) return { whatsappMessage: defaultStoreSettings.whatsappMessage, companyName: defaultStoreSettings.companyName };
  const { data } = await supabase.from('store_settings').select('key,value').in('key', ['whatsapp_messages', 'store_profile']);
  const values: any = Object.fromEntries((data || []).map(item => [item.key, item.value]));
  return {
    whatsappMessage: values.whatsapp_messages?.whatsappMessage || defaultStoreSettings.whatsappMessage,
    companyName: values.store_profile?.companyName || defaultStoreSettings.companyName,
  };
}

export async function updateWorkOrderStatus(id: string, status: WorkOrderStatus) {
  if (!supabase) return { data: null, history: null, error: new Error('Supabase não configurado.') };
  const { data, error } = await supabase.from('work_orders').update({ status }).eq('id', id).is('archived_at', null).select('status,updated_at').single();
  if (error || !data) return { data: null, history: null, error: error || new Error('Comanda não encontrada.') };
  const history = await supabase.from('work_order_status_history').insert({ work_order_id: id, status, note: `Status alterado para ${statusLabels[status]}` }).select('id,status,note,created_at').single();
  return { data, history: history.data as WorkOrderHistory | null, error: history.error };
}
