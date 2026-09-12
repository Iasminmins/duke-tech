import { FormEvent, useEffect, useState } from 'react';
import { EmptyState } from '../../components/ui/EmptyState';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../auth/AuthProvider';
import { createDevice, listDevices } from './deviceRepository';
import { deviceSchema, type DeviceInput } from './deviceSchema';

type Device = { id: string; customer_id: string; brand: string; model: string; color: string | null; imei: string | null; serial_number: string | null; physical_condition: string | null; received_accessories: string | null; reported_problem: string; customers?: { full_name: string } | { full_name: string }[] | null };
type Customer = { id: string; full_name: string };
const customerName = (value: Device['customers']) => Array.isArray(value) ? value[0]?.full_name || '—' : value?.full_name || '—';
const blank: DeviceInput = { customer_id: '', brand: '', model: '', color: '', imei: '', serial_number: '', access_password: '', physical_condition: '', received_accessories: '', reported_problem: '' };

export function DevicesPage() {
  const { profile } = useAuth();
  // Dados sensíveis (IMEI, número de série) só aparecem para quem administra
  // ou atende diretamente o cliente — técnicos veem apenas o essencial do reparo.
  const canSeeSensitiveInfo = profile ? profile.role === 'admin' || profile.role === 'employee' : true;
  const [rows, setRows] = useState<Device[]>([]); const [customers, setCustomers] = useState<Customer[]>([]); const [form, setForm] = useState<DeviceInput>(blank); const [open, setOpen] = useState(false); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [saving, setSaving] = useState(false); const [success, setSuccess] = useState('');
  async function load() { setLoading(true); setError(''); if (!supabase) { setError('Banco de dados não configurado.'); setLoading(false); return; } const [devices, customerResult] = await Promise.all([listDevices(), supabase.from('customers').select('id,full_name').is('archived_at', null).order('full_name')]); if (devices.error || customerResult.error) setError('Não foi possível carregar os aparelhos.'); setRows((devices.data || []) as unknown as Device[]); setCustomers((customerResult.data || []) as Customer[]); setLoading(false); }
  useEffect(() => { load(); }, []);
  async function submit(event: FormEvent) { event.preventDefault(); if (saving) return; const parsed = deviceSchema.safeParse(form); if (!parsed.success) { setError(parsed.error.issues[0]?.message || 'Revise os campos obrigatórios.'); return; } setSaving(true); setError(''); const { data, error: saveError } = await createDevice(parsed.data); if (saveError || !data) { setError(saveError?.message || 'Não foi possível salvar o aparelho.'); setSaving(false); return; } setRows(prev => [data as unknown as Device, ...prev]); setForm(blank); setOpen(false); setSuccess('Aparelho cadastrado com sucesso.'); setSaving(false); }
  return <section className="content"><div className="page-toolbar-top"><span className="page-toolbar-count">{!loading && !error ? `${rows.length} ${rows.length === 1 ? 'aparelho' : 'aparelhos'}` : ''}</span><button className="btn primary" onClick={() => { setOpen(value => !value); setError(''); setSuccess(''); }}>+ Aparelho</button></div>
    {success && <div className="success" role="status">{success}</div>}
    {open && <form className="form-card" onSubmit={submit} noValidate>
      <div className="form-grid">
        <div className="field full"><label htmlFor="device-customer">Cliente <span className="required">*</span></label><select id="device-customer" className="select" value={form.customer_id} onChange={event => setForm({ ...form, customer_id: event.target.value })} required disabled={saving}><option value="">Selecione</option>{customers.map(customer => <option key={customer.id} value={customer.id}>{customer.full_name}</option>)}</select></div>
        <div className="field"><label htmlFor="device-brand">Marca <span className="required">*</span></label><input id="device-brand" className="input" value={form.brand} onChange={event => setForm({ ...form, brand: event.target.value })} required disabled={saving} /></div>
        <div className="field"><label htmlFor="device-model">Modelo <span className="required">*</span></label><input id="device-model" className="input" value={form.model} onChange={event => setForm({ ...form, model: event.target.value })} required disabled={saving} /></div>
        <div className="field"><label htmlFor="device-color">Cor</label><input id="device-color" className="input" value={form.color} onChange={event => setForm({ ...form, color: event.target.value })} disabled={saving} /></div>
        <div className="field"><label htmlFor="device-imei">IMEI</label><input id="device-imei" className="input" value={form.imei} onChange={event => setForm({ ...form, imei: event.target.value })} disabled={saving} /></div>
        <div className="field"><label htmlFor="device-serial">Número de série</label><input id="device-serial" className="input" value={form.serial_number} onChange={event => setForm({ ...form, serial_number: event.target.value })} disabled={saving} /></div>
        <div className="field"><label htmlFor="device-password">Senha do aparelho</label><input id="device-password" className="input" type="password" autoComplete="off" value={form.access_password} onChange={event => setForm({ ...form, access_password: event.target.value })} disabled={saving} /></div>
        <div className="field"><label htmlFor="device-condition">Estado físico</label><input id="device-condition" className="input" placeholder="Ex.: tela trincada, sem marcas" value={form.physical_condition} onChange={event => setForm({ ...form, physical_condition: event.target.value })} disabled={saving} /></div>
        <div className="field"><label htmlFor="device-accessories">Acessórios entregues</label><input id="device-accessories" className="input" placeholder="Ex.: cabo, carregador, capa" value={form.received_accessories} onChange={event => setForm({ ...form, received_accessories: event.target.value })} disabled={saving} /></div>
        <div className="field full"><label htmlFor="device-problem">Problema informado <span className="required">*</span></label><textarea id="device-problem" className="textarea" value={form.reported_problem} onChange={event => setForm({ ...form, reported_problem: event.target.value })} required disabled={saving} /></div>
      </div>
      {error && <div className="error" role="alert">{error}</div>}
      <div className="actions"><button type="button" className="btn" onClick={() => setOpen(false)} disabled={saving}>Cancelar</button><button className="btn primary" disabled={saving} aria-busy={saving}>{saving ? 'Salvando…' : 'Salvar aparelho'}</button></div>
    </form>}
    {error && !open && <div className="card empty error-state" role="alert"><p>{error}</p><button className="btn primary" onClick={load}>Tentar novamente</button></div>}
    {loading ? <div className="card loading-skeleton" role="status" aria-live="polite"><span /><span /><span /><span /></div> : !error && rows.length === 0 ? <section className="panel"><EmptyState icon="device" title="Nenhum aparelho cadastrado" description="Cadastre o aparelho para acompanhar o histórico de reparos do cliente." actionLabel="Cadastrar primeiro aparelho" actionTo="/admin/aparelhos" example="Depois você verá marca, modelo, cliente e problema relatado." /></section> : !error && <div className="table-wrap"><table className="table"><thead><tr><th>Aparelho</th><th>Cliente</th>{canSeeSensitiveInfo && <th>IMEI / série</th>}<th>Problema</th></tr></thead><tbody>{rows.map(row => <tr key={row.id}><td><strong>{row.brand} {row.model}</strong>{row.color && <><br /><span className="muted">{row.color}</span></>}</td><td>{customerName(row.customers)}</td>{canSeeSensitiveInfo && <td className="muted">{row.imei || row.serial_number || '—'}</td>}<td>{row.reported_problem}</td></tr>)}</tbody></table></div>}
  </section>;
}
