import { FormEvent, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/ui/ToastProvider';
import { BarChart } from '../../components/ui/charts/BarChart';

type Entry = { id: string; kind: 'Entrada' | 'Saída'; description: string; category: string; amount: number; date: string };
type Period = 'Todos' | 'Últimos 7 dias' | 'Últimos 30 dias' | 'Este mês';
const money = (value: number) => Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const dayKey = (value: string) => value.slice(0, 10);
const dayLabel = (key: string) => new Date(`${key}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
const startFor = (period: Period) => { const now = new Date(); if (period === 'Este mês') return new Date(now.getFullYear(), now.getMonth(), 1); if (period === 'Últimos 7 dias' || period === 'Últimos 30 dias') { const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()); start.setDate(start.getDate() - (period === 'Últimos 7 dias' ? 6 : 29)); return start; } return null; };

export function FinancePage() {
  const toast = useToast();
  const [rows, setRows] = useState<Entry[]>([]); const [open, setOpen] = useState(false); const [kind, setKind] = useState<'entry' | 'exit'>('exit'); const [category, setCategory] = useState('Operação'); const [description, setDescription] = useState(''); const [amount, setAmount] = useState(''); const [dueDate, setDueDate] = useState(''); const [error, setError] = useState(''); const [saving, setSaving] = useState(false);
  const [period, setPeriod] = useState<Period>('Últimos 30 dias'); const [categoryFilter, setCategoryFilter] = useState('Todas');

  useEffect(() => {
    if (!supabase) return;
    Promise.all([
      supabase.from('expenses').select('id,category,description,amount,due_date,created_at').order('created_at', { ascending: false }).limit(60),
      supabase.from('payments').select('id,sale_id,amount,paid_at,sales(number)').order('paid_at', { ascending: false }).limit(60),
    ]).then(([expenses, payments]) => {
      const income = ((payments.data || []) as any[]).map(row => ({ id: row.id, kind: 'Entrada' as const, description: row.sale_id ? 'Venda #' + (Array.isArray(row.sales) ? row.sales[0]?.number || '—' : row.sales?.number || '—') : 'Pagamento recebido', category: 'Vendas', amount: row.amount, date: row.paid_at }));
      const outgoing = ((expenses.data || []) as any[]).map(row => ({ id: row.id, kind: 'Saída' as const, description: row.description, category: row.category, amount: row.amount, date: row.due_date || row.created_at }));
      setRows([...income, ...outgoing]);
    });
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault(); if (!supabase || !description.trim() || Number(amount) <= 0) { setError('Informe descrição e um valor maior que zero.'); return; }
    setSaving(true); setError('');
    const result = kind === 'exit'
      ? await supabase.from('expenses').insert({ category, description: description.trim(), amount: Number(amount), due_date: dueDate || null }).select('id,category,description,amount,due_date,created_at').single()
      : await supabase.from('payments').insert({ amount: Number(amount), payment_method: 'other' }).select('id,amount,paid_at').single();
    if (result.error || !result.data) { setError('Não foi possível salvar a movimentação.'); setSaving(false); return; }
    const row: Entry = kind === 'exit'
      ? { id: (result.data as any).id, kind: 'Saída', description, category, amount: Number(amount), date: dueDate || new Date().toISOString() }
      : { id: (result.data as any).id, kind: 'Entrada', description, category, amount: Number(amount), date: (result.data as any).paid_at };
    setRows(prev => [row, ...prev]); setDescription(''); setAmount(''); setDueDate(''); setOpen(false); toast.success('Movimentação registrada com sucesso.'); setSaving(false);
  }

  const categories = useMemo(() => ['Todas', ...Array.from(new Set(rows.map(row => row.category)))], [rows]);
  const filteredRows = useMemo(() => {
    const start = startFor(period);
    return rows.filter(row => (!start || row.date >= start.toISOString()) && (categoryFilter === 'Todas' || row.category === categoryFilter));
  }, [rows, period, categoryFilter]);

  const totalIn = filteredRows.filter(row => row.kind === 'Entrada').reduce((sum, row) => sum + Number(row.amount), 0);
  const totalOut = filteredRows.filter(row => row.kind === 'Saída').reduce((sum, row) => sum + Number(row.amount), 0);

  const dailyFlow = useMemo(() => {
    const map = new Map<string, { in: number; out: number }>();
    filteredRows.forEach(row => { const key = dayKey(row.date); const entry = map.get(key) || { in: 0, out: 0 }; if (row.kind === 'Entrada') entry.in += Number(row.amount); else entry.out += Number(row.amount); map.set(key, entry); });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([key, value]) => ({ label: dayLabel(key), values: { in: value.in, out: value.out } }));
  }, [filteredRows]);

  return <section className="content">
    <div className="page-toolbar-top">
      <span className="page-toolbar-count">{`${filteredRows.length} ${filteredRows.length === 1 ? 'movimentação' : 'movimentações'}`}</span>
      <button className="btn primary" onClick={() => { setOpen(value => !value); setError(''); }}>+ Adicionar movimentação</button>
    </div>
    <div className="finance-overview">
      <article className={`card module-stat is-balance${totalIn - totalOut < 0 ? ' is-negative' : ''}`}><span>Saldo movimentado</span><strong>{money(totalIn - totalOut)}</strong><small>Entradas menos saídas</small></article>
      <article className="card module-stat"><span>Entradas registradas</span><strong>{money(totalIn)}</strong><small>Pagamentos recebidos</small></article>
      <article className="card module-stat"><span>Saídas registradas</span><strong>{money(totalOut)}</strong><small>Despesas lançadas</small></article>
    </div>

    {open && <form className="form-card" onSubmit={submit}><h3>Nova movimentação</h3><div className="form-grid"><div className="field"><label htmlFor="finance-kind">Tipo <span className="required">*</span></label><select id="finance-kind" className="select" value={kind} onChange={e => setKind(e.target.value as 'entry' | 'exit')}><option value="entry">Entrada</option><option value="exit">Saída</option></select></div><div className="field"><label htmlFor="finance-category">Categoria <span className="required">*</span></label><input id="finance-category" className="input" value={category} onChange={e => setCategory(e.target.value)} required /></div><div className="field"><label htmlFor="finance-description">Descrição <span className="required">*</span></label><input id="finance-description" className="input" value={description} onChange={e => setDescription(e.target.value)} required /></div><div className="field"><label htmlFor="finance-amount">Valor <span className="required">*</span></label><input id="finance-amount" className="input" type="number" min="0.01" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required /></div><div className="field"><label htmlFor="finance-date">Data</label><input id="finance-date" className="input" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} /></div></div>{error && <div className="error" role="alert">{error}</div>}<div className="actions"><button type="button" className="btn" onClick={() => setOpen(false)}>Cancelar</button><button className="btn primary" disabled={saving}>{saving ? 'Salvando…' : 'Salvar movimentação'}</button></div></form>}

    <section className="panel" style={{ marginTop: 16 }}>
      <header className="panel-header"><h3>Fluxo de caixa</h3><div className="toolbar" style={{ marginBottom: 0 }}><select className="period-button" aria-label="Período do fluxo de caixa" value={period} onChange={e => setPeriod(e.target.value as Period)}><option>Todos</option><option>Últimos 7 dias</option><option>Últimos 30 dias</option><option>Este mês</option></select><select className="period-button" aria-label="Categoria" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>{categories.map(item => <option key={item}>{item}</option>)}</select></div></header>
      <BarChart data={dailyFlow} series={[{ key: 'in', label: 'Entradas', color: 'var(--green)' }, { key: 'out', label: 'Saídas', color: 'var(--red)' }]} formatValue={money} emptyLabel="Nenhuma movimentação no período selecionado." />
    </section>

    <section className="panel" style={{ marginTop: 16 }}><header className="panel-header"><h3>Entradas e saídas recentes</h3></header>{filteredRows.length ? <div className="table-wrap"><table className="table"><thead><tr><th>Tipo</th><th>Descrição</th><th>Categoria</th><th>Valor</th><th>Data</th></tr></thead><tbody>{filteredRows.map(row => <tr key={row.id}><td><span className={`badge ${row.kind === 'Entrada' ? 'green' : 'red'}`}>{row.kind}</span></td><td>{row.description}</td><td>{row.category}</td><td>{money(row.amount)}</td><td>{new Date(row.date).toLocaleDateString('pt-BR')}</td></tr>)}</tbody></table></div> : <div className="empty">Nenhuma movimentação registrada.</div>}</section>
  </section>;
}
