import { supabase } from '../../lib/supabase'; import type { DeviceInput } from './deviceSchema';

/**
 * Nunca inclui access_password na listagem: senha de acesso ao aparelho é
 * informação sensível e só deve trafegar em telas dedicadas de detalhe,
 * restritas por permissão.
 */
export async function listDevices() {
  if (!supabase) return { data: [], error: new Error('Supabase não configurado.') };
  return supabase.from('devices').select('id,customer_id,brand,model,color,imei,serial_number,physical_condition,received_accessories,reported_problem,created_at,customers(full_name),work_orders(id)').is('archived_at', null).order('created_at', { ascending: false });
}

export async function createDevice(input: DeviceInput) {
  if (!supabase) return { data: null, error: new Error('Supabase não configurado.') };
  const payload = {
    customer_id: input.customer_id,
    brand: input.brand,
    model: input.model,
    color: input.color || null,
    imei: input.imei || null,
    serial_number: input.serial_number || null,
    access_password: input.access_password || null,
    physical_condition: input.physical_condition || null,
    received_accessories: input.received_accessories || null,
    reported_problem: input.reported_problem,
  };
  return supabase.from('devices').insert(payload).select().single();
}
