import { supabase } from '../../lib/supabase';

export type LeadStatus = 'new' | 'contacted' | 'closed';
export type SiteLead = { id: string; name: string; phone: string | null; subject: string; message: string; status: LeadStatus; created_at: string };

export const leadStatusLabels: Record<LeadStatus, string> = { new: 'Novo', contacted: 'Em contato', closed: 'Encerrado' };

export async function listLeads() {
  if (!supabase) return { data: [] as SiteLead[], error: new Error('Supabase não configurado.') };
  const result = await supabase.from('site_leads').select('id,name,phone,subject,message,status,created_at').order('created_at', { ascending: false }).limit(300);
  return { data: (result.data || []) as SiteLead[], error: result.error };
}

export async function updateLeadStatus(id: string, status: LeadStatus, userId?: string) {
  if (!supabase) return { error: new Error('Supabase não configurado.') };
  return supabase.from('site_leads').update({ status, handled_by: userId ?? null }).eq('id', id);
}

export async function countNewLeads(): Promise<number> {
  if (!supabase) return 0;
  const { count } = await supabase.from('site_leads').select('id', { count: 'exact', head: true }).eq('status', 'new');
  return count || 0;
}
