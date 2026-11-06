import { FormEvent, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { KpiCard } from '../../components/ui/KpiCard';
import { useToast } from '../../components/ui/ToastProvider';
import { BarChart } from '../../components/ui/charts/BarChart';
import { ChartSkeleton } from '../../components/ui/charts/ChartSkeleton';
import { DonutChart } from '../../components/ui/charts/DonutChart';
import { PAYMENT_METHOD_COLORS } from '../../lib/chartColors';
import { localDayKey } from '../../lib/dateUtils';
import { fetchAllPages } from '../../lib/fetchAllPages';

type Product = { id: string; name: string; sale_price: number; quantity: number };
type Customer = { id: string; full_name: string };
type Sale = { id: string; number: number; total: number; payment_method: string | null; customer_name?: string | null; created_at: string; customers?: any };
const methods = { pix: 'Pix', cash: 'Dinheiro', debit: 'Débito', credit: 'Crédito', installments: 'Parcelado', other: 'Outro' };
const money = (value: number) => Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const dayLabel = (key: string) => new Date(`${key}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

export function SalesPage() {
  const toast = useToast();
  const [rows, setRows] = useState<Sale[]>([]); const [products, setProducts] = useState<Product[]>([]); const [customers, setCustomers] = useState<Customer[]>([]); const [open, setOpen] = useState(false); const [productId, setProductId] = useState(''); const [customerId, setCustomerId] = useState(''); const [customerName, setCustomerName] = useState(''); const [dueDate, setDueDate] = useState(''); const [quantity, setQuantity] = useState('1'); const [payment, setPayment] = useState('pix'); const [error, setError] = useState(''); const [saving, setSaving] = useState(false); const [methodView, setMethodView] = useState<'bar' | 'pie'>('bar'); const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!supabase) { setLoading(false); setError('Supabase não está configurado.'); return; }
    let active = true;
    const client = supabase;
    Promise.all([
      fetchAllPages<Sale>((from, to) => client.from('sales').select('id,number,total,payment_method,customer_name,created_at,customers(full_name)').is('cancelled_at', null).order('created_at', { ascending: false }).range(from, to)),
      client.from('products').select('id,name,sale_price,quantity').eq('active', true).is('archived_at', null).order('name'),
      client.from('customers').select('id,full_name').is('archived_at', null).order('full_name'),
    ]).then(([sales, productResult, customerResult]) => {
      if (!active) return;
      if (sales.error || productResult.error || customerResult.error) setError('Não foi possível carregar todos os dados de vendas. Atualize a página para tentar novamente.');
      setRows((sales.error ? [] : sales.data) as Sale[]);
      setProducts((productResult.data || []) as Product[]);
      setCustomers((customerResult.data || []) as Customer[]);
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    const product = products.find(item => item.id === productId);
    const amount = Number(quantity);
    if (!product || !Number.isInteger(amount) || amount < 1 || amount > product.quantity) { setError('Selecione um produto e uma quantidade disponível.'); return; }
    const payLater = payment === 'pay_later';
    if (payLater && !customerName.trim()) { setError('Informe o nome do cliente para registrar a venda a prazo.'); return; }
    setSaving(true); setError('');
    const { data, error: saleError } = await supabase.rpc('create_sale', {
      p_product_id: product.id,
      p_quantity: amount,
      p_customer_id: payLater ? null : customerId || null,
      p_payment_method: payLater ? null : payment,
      p_customer_name: payLater ? customerName.trim() : null,
      p_due_date: payLater ? dueDate || null : null,
    });
    const created = Array.isArray(data) ? data[0] : data;
    if (saleError || !created) {
      const message = saleError?.message || '';
      setError(message.includes('Estoque insuficiente') || message.includes('Produto indisponível') || message.includes('preço válido')
        ? message
        : 'Não foi possível concluir a venda. Nenhuma alteração foi aplicada ao estoque ou ao financeiro.');
      setSaving(false);
      return;
    }
    const customer = customers.find(item => item.id === customerId);
    setRows(prev => [{ ...created, customers: customer || null } as Sale, ...prev]);
    setProducts(prev => prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity - amount } : item));
    setOpen(false); setProductId(''); setCustomerId(''); setCustomerName(''); setDueDate(''); setQuantity('1');
    toast.success(payLater ? 'Venda registrada e cobrança adicionada às contas a vencer.' : 'Venda registrada e lançada no financeiro.');
    setSaving(false);
  }

  const revenue = rows.reduce((sum, row) => sum + Number(row.total), 0);
  const average = rows.length ? revenue / rows.length : 0;
  const byMethod = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach(row => { if (!row.payment_method) return; const key = row.payment_method; map.set(key, (map.get(key) || 0) + Number(row.total)); });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [rows]);
  const maxMethod = Math.max(1, ...byMethod.map(([, value]) => value));
  const dailyRevenue = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach(row => { const key = localDayKey(row.created_at); map.set(key, (map.get(key) || 0) + Number(row.total)); });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0])).slice(-14).map(([key, value]) => ({ label: dayLabel(key), values: { revenue: value } }));
  }, [rows]);

  return <section className="content">
    <div className="page-toolbar-top"><span className="page-toolbar-count">{`${rows.length} ${rows.length === 1 ? 'venda' : 'vendas'}`}</span><button className="btn primary" onClick={() => { setOpen(value => !value); setError(''); }}>+ Nova venda</button></div>
    <div className="module-overview">
      <KpiCard icon="wallet" tone="blue" label="Faturamento total" value={money(revenue)} note={`Últimas ${rows.length} venda(s)`} />
      <KpiCard icon="cart" tone="violet" label="Ticket médio" value={money(average)} note="Por venda" />
      <KpiCard icon="chart" tone="green" label="Forma mais usada" value={byMethod.length ? methods[byMethod[0][0] as keyof typeof methods] || 'Outro' : '—'} note={byMethod.length ? money(byMethod[0][1]) : 'Sem dados'} />
    </div>
    {open && <form className="form-card" onSubmit={submit}><h3>Nova venda</h3><div className="form-grid"><div className="field full"><label htmlFor="sale-product">Produto <span className="required">*</span></label><select id="sale-product" className="select" value={productId} onChange={e => setProductId(e.target.value)} required><option value="">Selecione um produto</option>{products.map(product => <option key={product.id} value={product.id}>{product.name} · {money(product.sale_price)} · {product.quantity} disponíveis</option>)}</select></div><div className="field"><label htmlFor="sale-payment">Forma de pagamento</label><select id="sale-payment" className="select" value={payment} onChange={e => setPayment(e.target.value)}>{Object.entries(methods).map(([key, label]) => <option value={key} key={key}>{label}</option>)}<option value="pay_later">Pagar depois (fiado)</option></select></div><div className="field"><label htmlFor="sale-quantity">Quantidade <span className="required">*</span></label><input id="sale-quantity" className="input" type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} required /></div>{payment === 'pay_later' ? <><div className="field"><label htmlFor="sale-customer-name">Nome do cliente <span className="required">*</span></label><input id="sale-customer-name" className="input" value={customerName} onChange={e => setCustomerName(e.target.value)} maxLength={120} required /></div><div className="field"><label htmlFor="sale-due-date">Data para cobrar</label><input id="sale-due-date" className="input" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} /></div></> : <div className="field"><label htmlFor="sale-customer">Cliente</label><select id="sale-customer" className="select" value={customerId} onChange={e => setCustomerId(e.target.value)}><option value="">Venda balcão</option>{customers.map(customer => <option key={customer.id} value={customer.id}>{customer.full_name}</option>)}</select></div>}</div>{error && <div className="error" role="alert">{error}</div>}<div className="actions"><button type="button" className="btn" onClick={() => setOpen(false)}>Cancelar</button><button className="btn primary" disabled={saving}>{saving ? 'Salvando…' : 'Finalizar venda'}</button></div></form>}

    <div className="dashboard-grid secondary-grid">
      <section className="panel">
        <header className="panel-header"><h3>Faturamento recente</h3><span className="panel-total">{money(revenue)}</span></header>
        {loading ? <ChartSkeleton height={220} /> : <BarChart data={dailyRevenue} series={[{ key: 'revenue', label: 'Faturamento', color: 'var(--series-1)' }]} formatValue={money} modes={['line', 'bar']} defaultMode="line" emptyLabel="Nenhuma venda registrada." />}
      </section>
      <section className="panel">
        <header className="panel-header"><h3>Formas de pagamento</h3><div className="view-toggle chart-view-toggle" role="group" aria-label="Tipo de gráfico"><button type="button" className={`btn${methodView === 'bar' ? ' active' : ''}`} aria-pressed={methodView === 'bar'} onClick={() => setMethodView('bar')}>Barras</button><button type="button" className={`btn${methodView === 'pie' ? ' active' : ''}`} aria-pressed={methodView === 'pie'} onClick={() => setMethodView('pie')}>Pizza</button></div></header>
        {!byMethod.length ? <div className="empty">Nenhuma venda registrada.</div> : methodView === 'bar' ? <div className="report-bars" style={{ marginTop: 16 }}>{byMethod.map(([method, value]) => <div className="report-bar-row" key={method}><span className="report-bar-label">{methods[method as keyof typeof methods] || 'Outro'}</span><div className="report-bar-track"><div className="report-bar-fill" style={{ width: `${(value / maxMethod) * 100}%`, background: PAYMENT_METHOD_COLORS[method] || PAYMENT_METHOD_COLORS.other }} /></div><strong className="report-bar-value">{money(value)}</strong></div>)}</div> : <DonutChart data={byMethod.slice(0, 6).map(([method, value]) => ({ key: method, label: methods[method as keyof typeof methods] || 'Outro', value, color: PAYMENT_METHOD_COLORS[method] || PAYMENT_METHOD_COLORS.other }))} formatValue={money} />}
      </section>
    </div>

    <section className="panel" style={{ marginTop: 16 }}><header className="panel-header"><h3>Vendas recentes</h3></header>{rows.length ? <div className="table-wrap"><table className="table"><thead><tr><th>Nº</th><th>Cliente</th><th>Total</th><th>Pagamento</th><th>Data</th></tr></thead><tbody>{rows.map(row => <tr key={row.id}><td>#{row.number}</td><td>{row.customer_name || (Array.isArray(row.customers) ? row.customers[0]?.full_name || 'Venda balcão' : row.customers?.full_name || 'Venda balcão')}</td><td>{money(row.total)}</td><td>{row.payment_method ? methods[row.payment_method as keyof typeof methods] || 'Outro' : 'Fiado'}</td><td>{new Date(row.created_at).toLocaleDateString('pt-BR')}</td></tr>)}</tbody></table></div> : <div className="empty">Nenhuma venda registrada.</div>}</section>
  </section>;
}
