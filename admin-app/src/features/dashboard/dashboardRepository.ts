import { supabase } from '../../lib/supabase';
import type { WorkOrderStatus } from '../work-orders/workOrderSchema';

export type DashboardOrder = { id: string; number: number; status: WorkOrderStatus; final_amount: number; created_at: string; estimated_due_date: string | null; customers: any; devices: any };
export type DashboardData = { orders: DashboardOrder[]; sales: { id: string; total: number; created_at: string }[]; lowStock: { id: string; name: string; quantity: number; minimum_stock: number }[] };
export async function loadDashboardData(): Promise<{ data: DashboardData; error: Error | null }> {
  if (!supabase) return { data: { orders: [], sales: [], lowStock: [] }, error: new Error('Supabase não configurado.') };
  const [orders, sales, products] = await Promise.all([
    supabase.from('work_orders').select('id,number,status,final_amount,created_at,estimated_due_date,customers(full_name),devices(brand,model)').is('archived_at', null).order('created_at', { ascending: false }).limit(100),
    supabase.from('sales').select('id,total,created_at').is('cancelled_at', null).order('created_at', { ascending: false }).limit(100),
    supabase.from('products').select('id,name,quantity,minimum_stock').eq('active', true).is('archived_at', null).order('quantity', { ascending: true }).limit(20),
  ]);
  const error = orders.error || sales.error || products.error;
  return { data: { orders: (orders.data || []) as DashboardOrder[], sales: (sales.data || []) as { id: string; total: number; created_at: string }[], lowStock: ((products.data || []) as any[]).filter(item => item.quantity <= item.minimum_stock) }, error };
}
