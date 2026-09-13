import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from '../../components/ui/Avatar';
import { KpiCard } from '../../components/ui/KpiCard';
import { useToast } from '../../components/ui/ToastProvider';
import { Pagination, usePagination } from '../../components/ui/Pagination';
import { withTimeout } from '../../lib/withTimeout';
import { createCustomer, listCustomers } from './customerRepository';
import { customerSchema, type CustomerInput } from './customerSchema';

type CustomerOrder = { status: string; final_amount: number; created_at: string };
type Customer = CustomerInput & { id: string; created_at: string; work_orders?: CustomerOrder[] };
const blank: CustomerInput = { full_name: '', phone: '', whatsapp: '', email: '', cpf: '', address: '', notes: '' };
const money = (value: number) => Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const lastOrder = (orders: CustomerOrder[] = []) => orders.length ? orders.reduce((latest, row) => row.created_at > latest.created_at ? row : latest) : null;
const totalSpent = (orders: CustomerOrder[] = []) => orders.filter(row => row.status === 'delivered').reduce((sum, row) => sum + Number(row.final_amount || 0), 0);

export function CustomersPage() {
  const toast = useToast();
  const [rows, setRows] = useState<Customer[]>([]); const [search, setSearch] = useState(''); const [form, setForm] = useState<CustomerInput>(blank); const [open, setOpen] = useState(false); const [error, setError] = useState(''); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false);
  function load() {
    setLoading(true); setError('');
    withTimeout(listCustomers(search), 10000)
      .then(({ data, error }) => { if (error) setError('Não foi possível carregar os clientes.'); else if (data) setRows(data as Customer[]); })
      .catch(() => setError('A busca demorou demais para responder. Tente novamente.'))
      .finally(() => setLoading(false));
  }
  useEffect(() => { const timer = window.setTimeout(load, 250); return () => window.clearTimeout(timer); }, [search]);
  async function submit(e: FormEvent) { e.preventDefault(); if (saving) return; const parsed = customerSchema.safeParse(form); if (!parsed.success) { setError(parsed.error.issues[0]?.message || 'Revise os campos.'); return; } setSaving(true); setError(''); const result = await createCustomer(parsed.data); setSaving(false); if (result.error) { setError(result.error.message); return; } setForm(blank); setOpen(false); setError(''); toast.success('Cliente cadastrado com sucesso.'); setRows(prev => result.data ? [{ ...(result.data as Customer), work_orders: [] }, ...prev] : prev); }

  const thirtyDaysAgo = useMemo(() => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString(); }, []);
  const stats = useMemo(() => ({
    total: rows.length,
    newThisMonth: rows.filter(row => row.created_at >= thirtyDaysAgo).length,
    withoutOrder: rows.filter(row => !(row.work_orders && row.work_orders.length)).length,
    avgSpent: rows.length ? rows.reduce((sum, row) => sum + totalSpent(row.work_orders), 0) / rows.length : 0,
  }), [rows, thirtyDaysAgo]);
  const { page, setPage, pageCount, pageItems } = usePagination(rows, 20);

  return <section className="content">
    <div className="page-toolbar-top"><span className="page-toolbar-count">{!loading ? `${rows.length} ${rows.length === 1 ? 'cliente' : 'clientes'}` : ''}</span><button className="btn primary" onClick={() => { setOpen(!open); setError(''); }}>+ Novo cliente</button></div>
    {!loading && <div className="module-overview">
      <KpiCard icon="users" tone="blue" label="Clientes cadastrados" value={stats.total} note="Base ativa" />
      <KpiCard icon="plus" tone="green" label="Novos em 30 dias" value={stats.newThisMonth} note="Cadastros recentes" />
      <KpiCard icon="wallet" tone="violet" label="Gasto médio" value={money(stats.avgSpent)} note="Comandas entregues" />
      <KpiCard icon="clipboard" tone="amber" label="Sem comanda ainda" value={stats.withoutOrder} note="Oportunidade de contato" />
    </div>}
    {open && <form className="form-card" onSubmit={submit} noValidate><div className="form-grid">{[['full_name', 'Nome completo'], ['phone', 'Telefone'], ['whatsapp', 'WhatsApp'], ['email', 'E-mail'], ['cpf', 'CPF/CNPJ (opcional)'], ['address', 'Endereço']].map(([key, label]) => <div className="field" key={key}><label htmlFor={`customer-${key}`}>{label}</label><input id={`customer-${key}`} className="input" value={form[key as keyof CustomerInput] || ''} onChange={e => setForm({ ...form, [key]: e.target.value })} disabled={saving} /></div>)}<div className="field full"><label htmlFor="customer-notes">Observações</label><textarea id="customer-notes" className="textarea" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} disabled={saving} /></div></div>{error && <div className="error" role="alert" style={{ marginTop: 16 }}>{error}</div>}<div className="actions"><button type="button" className="btn" onClick={() => setOpen(false)} disabled={saving}>Cancelar</button><button className="btn primary" disabled={saving} aria-busy={saving}>{saving ? 'Salvando…' : 'Salvar cliente'}</button></div></form>}
    <div className="toolbar"><input className="input search" placeholder="Buscar por nome ou telefone" aria-label="Buscar cliente" value={search} onChange={e => setSearch(e.target.value)} /></div>
    {error && !open && <div className="error" role="alert" style={{ marginBottom: 16 }}>{error} <button className="btn" onClick={load} style={{ marginLeft: 8 }}>Tentar novamente</button></div>}
    <div className="table-wrap"><table className="table"><thead><tr><th>Cliente</th><th>Telefone</th><th>Última comanda</th><th>Total gasto</th><th></th></tr></thead><tbody>{loading ? Array.from({ length: 6 }).map((_, index) => <tr key={index} className="table-skeleton-row" aria-hidden="true"><td colSpan={5}><span className="skeleton-row" style={{ width: `${92 - index * 6}%` }} /></td></tr>) : rows.length === 0 ? <tr><td colSpan={5} className="empty">{search ? 'Nenhum cliente encontrado para esta busca.' : 'Nenhum cliente cadastrado.'}</td></tr> : pageItems.map(row => { const last = lastOrder(row.work_orders); const spent = totalSpent(row.work_orders); return <tr key={row.id}><td><div className="customer-cell"><Avatar name={row.full_name} size={32} className="customer-avatar" /><div><strong>{row.full_name}</strong><br /><span className="muted">{row.email || 'Sem e-mail'}</span></div></div></td><td>{row.phone}</td><td>{last ? new Date(last.created_at).toLocaleDateString('pt-BR') : <span className="muted">Nenhuma</span>}</td><td>{spent ? money(spent) : <span className="muted">—</span>}</td><td><Link to={`/admin/clientes/${row.id}`} className="btn">Detalhes</Link></td></tr>; })}</tbody></table></div>
    {!loading && rows.length > 0 && <Pagination page={page} pageCount={pageCount} onChange={setPage} totalLabel={`${rows.length} ${rows.length === 1 ? 'cliente' : 'clientes'}`} />}
  </section>;
}
