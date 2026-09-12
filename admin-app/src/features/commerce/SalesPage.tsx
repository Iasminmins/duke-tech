import { FormEvent, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { getSalePayment } from '../finance/financeUtils';
import { useToast } from '../../components/ui/ToastProvider';
import { BarChart } from '../../components/ui/charts/BarChart';

type Product = { id: string; name: string; sale_price: number; quantity: number };
type Customer = { id: string; full_name: string };
type Sale = { id: string; number: number; total: number; payment_method: string | null; created_at: string; customers?: any };
const methods = { pix: 'Pix', cash: 'Dinheiro', debit: 'Débito', credit: 'Crédito', installments: 'Parcelado', other: 'Outro' };
const money = (value: number) => Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const dayLabel = (key: string) => new Date(`${key}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

export function SalesPage() {
  const toast = useToast();
  const [rows, setRows] = useState<Sale[]>([]); const [products, setProducts] = useState<Product[]>([]); const [customers, setCustomers] = useState<Customer[]>([]); const [open, setOpen] = useState(false); const [productId, setProductId] = useState(''); const [customerId, setCustomerId] = useState(''); const [quantity, setQuantity] = useState('1'); const [payment, setPayment] = useState('pix'); const [error, setError] = useState(''); const [saving, setSaving] = useState(false);
  useEffect(() => { if (!supabase) return; supabase.from('sales').select('id,number,total,payment_method,created_at,customers(full_name)').is('cancelled_at', null).order('created_at', { ascending: false }).limit(50).then(({ data }) => setRows((data || []) as Sale[])); supabase.from('products').select('id,name,sale_price,quantity').eq('active', true).is('archived_at', null).order('name').then(({ data }) => setProducts((data || []) as Product[])); supabase.from('customers').select('id,full_name').is('archived_at', null).order('full_name').then(({ data }) => setCustomers((data || []) as Customer[])); }, []);
  async function submit(event: FormEvent) { event.preventDefault(); if (!supabase) return; const product = products.find(item => item.id === productId); const amount = Number(quantity); if (!product || amount < 1 || amount > product.quantity) { setError('Selecione um produto e uma quantidade disponível.'); return; } setSaving(true); setError(''); const total = amount * Number(product.sale_price); const sale = await supabase.from('sales').insert({ customer_id: customerId || null, subtotal: total, total, payment_method: payment }).select('id,number,total,payment_method,created_at,customers(full_name)').single(); if (sale.error || !sale.data) { setError('Não foi possível criar a venda.'); setSaving(false); return; } const paymentResult = await supabase.from('payments').insert(getSalePayment({ id: sale.data.id, total: Number(sale.data.total), payment_method: payment })); const item = paymentResult.error ? paymentResult : await supabase.from('sale_items').insert({ sale_id: sale.data.id, product_id: product.id, quantity: amount, unit_price: product.sale_price }); const stock = item.error ? item : await supabase.from('products').update({ quantity: product.quantity - amount }).eq('id', product.id); if (paymentResult.error || item.error || stock.error) { setError('Venda criada, mas não foi possível concluir o pagamento, itens ou estoque.'); setSaving(false); return; } setRows(prev => [sale.data as Sale, ...prev]); setProducts(prev => prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity - amount } : item)); setOpen(false); setProductId(''); setCustomerId(''); setQuantity('1'); toast.success('Venda registrada e lançada no financeiro.'); setSaving(false); }

  const revenue = rows.reduce((sum, row) => sum + Number(row.total), 0);
  const average = rows.length ? revenue / rows.length : 0;
  const byMethod = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach(row => { const key = row.payment_method || 'other'; map.set(key, (map.get(key) || 0) + Number(row.total)); });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [rows]);
  const maxMethod = Math.max(1, ...byMethod.map(([, value]) => value));
  const dailyRevenue = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach(row => { const key = row.created_at.slice(0, 10); map.set(key, (map.get(key) || 0) + Number(row.total)); });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0])).slice(-14).map(([key, value]) => ({ label: dayLabel(key), values: { revenue: value } }));
  }, [rows]);

  return <section className="content">
    <div className="page-toolbar-top"><span className="page-toolbar-count">{`${rows.length} ${rows.length === 1 ? 'venda' : 'vendas'}`}</span><button className="btn primary" onClick={() => { setOpen(value => !value); setError(''); }}>+ Nova venda</button></div>
    <div className="module-overview">
      <article className="card module-stat"><span>Faturamento total</span><strong>{money(revenue)}</strong><small>Últimas {rows.length} venda(s)</small></article>
      <article className="card module-stat"><span>Ticket médio</span><strong>{money(average)}</strong><small>Por venda</small></article>
      <article className="card module-stat"><span>Forma mais usada</span><strong>{byMethod.length ? methods[byMethod[0][0] as keyof typeof methods] || 'Outro' : '—'}</strong><small>{byMethod.length ? money(byMethod[0][1]) : 'Sem dados'}</small></article>
    </div>
    {open && <form className="form-card" onSubmit={submit}><h3>Nova venda</h3><div className="form-grid"><div className="field full"><label htmlFor="sale-product">Produto <span className="required">*</span></label><select id="sale-product" className="select" value={productId} onChange={e => setProductId(e.target.value)} required><option value="">Selecione um produto</option>{products.map(product => <option key={product.id} value={product.id}>{product.name} · {money(product.sale_price)} · {product.quantity} disponíveis</option>)}</select></div><div className="field"><label htmlFor="sale-customer">Cliente</label><select id="sale-customer" className="select" value={customerId} onChange={e => setCustomerId(e.target.value)}><option value="">Venda balcão</option>{customers.map(customer => <option key={customer.id} value={customer.id}>{customer.full_name}</option>)}</select></div><div className="field"><label htmlFor="sale-quantity">Quantidade <span className="required">*</span></label><input id="sale-quantity" className="input" type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} required /></div><div className="field"><label htmlFor="sale-payment">Forma de pagamento</label><select id="sale-payment" className="select" value={payment} onChange={e => setPayment(e.target.value)}>{Object.entries(methods).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></div></div>{error && <div className="error" role="alert">{error}</div>}<div className="actions"><button type="button" className="btn" onClick={() => setOpen(false)}>Cancelar</button><button className="btn primary" disabled={saving}>{saving ? 'Salvando…' : 'Finalizar venda'}</button></div></form>}

    <div className="dashboard-grid secondary-grid">
      <section className="panel">
        <header className="panel-header"><h3>Faturamento recente</h3><span className="panel-total">{money(revenue)}</span></header>
        <BarChart data={dailyRevenue} series={[{ key: 'revenue', label: 'Faturamento', color: 'var(--blue)' }]} formatValue={money} emptyLabel="Nenhuma venda registrada." />
      </section>
      <section className="panel">
        <header className="panel-header"><h3>Formas de pagamento</h3></header>
        {byMethod.length ? <div className="report-bars" style={{ marginTop: 16 }}>{byMethod.map(([method, value]) => <div className="report-bar-row" key={method}><span className="report-bar-label">{methods[method as keyof typeof methods] || 'Outro'}</span><div className="report-bar-track"><div className="report-bar-fill" style={{ width: `${(value / maxMethod) * 100}%` }} /></div><strong className="report-bar-value">{money(value)}</strong></div>)}</div> : <div className="empty">Nenhuma venda registrada.</div>}
      </section>
    </div>

    <section className="panel" style={{ marginTop: 16 }}><header className="panel-header"><h3>Vendas recentes</h3></header>{rows.length ? <div className="table-wrap"><table className="table"><thead><tr><th>Nº</th><th>Cliente</th><th>Total</th><th>Pagamento</th><th>Data</th></tr></thead><tbody>{rows.map(row => <tr key={row.id}><td>#{row.number}</td><td>{Array.isArray(row.customers) ? row.customers[0]?.full_name || 'Venda balcão' : row.customers?.full_name || 'Venda balcão'}</td><td>{money(row.total)}</td><td>{methods[row.payment_method as keyof typeof methods] || 'Pendente'}</td><td>{new Date(row.created_at).toLocaleDateString('pt-BR')}</td></tr>)}</tbody></table></div> : <div className="empty">Nenhuma venda registrada.</div>}</section>
  </section>;
}
