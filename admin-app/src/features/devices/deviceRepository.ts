import { supabase } from '../../lib/supabase'; import type { DeviceInput } from './deviceSchema';
export async function listDevices(){if(!supabase)return {data:[],error:new Error('Supabase não configurado.')};return supabase.from('devices').select('id,customer_id,brand,model,reported_problem,created_at,customers(full_name)').is('archived_at',null).order('created_at',{ascending:false});}
export async function createDevice(input:DeviceInput){if(!supabase)return {data:null,error:new Error('Supabase não configurado.')};return supabase.from('devices').insert(input).select().single();}
