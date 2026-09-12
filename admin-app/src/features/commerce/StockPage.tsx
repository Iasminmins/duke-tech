import { FormEvent, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Drawer } from '../../components/ui/Drawer';
import { useToast } from '../../components/ui/ToastProvider';
import { BarChart } from '../../components/ui/charts/BarChart';

type Product = { id: string; name: string; quantity: number; minimum_stock: number; active: boolean };
type Movement = { id: string; product_id: string; movement_type: 'entry' | 'exit' | 'adjustment'; quantity: number; reason: string; created_at: string; products?: { name: string } | { name: string }[] | null };
const labels = { entry: 'Entrada', exit: 'Saída', adjustment: 'Ajuste' };
const dayLabel = (key: string) => new Date(`${key}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

export function StockPage() {
  const toast = useToast();
  const [products, setProducts] = useState<Product[]>([]); const [movements, setMovements] = useState<Movement[]>([]); const [selected, setSelected] = useState<Product | null>(null); const [type, setType] = useState<Movement['movement_type']>('entry'); const [quantity, setQuantity] = useState(''); const [reason, setReason] = useState(''); const [note, setNote] = useState(''); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [error, setError] = useState('');

  async function load() { if (!supabase) { setLoading(false); return; } setLoading(true); const [productResult, movementResult] = await Promise.all([supabase.from('products').select('id,name,quantity,minimum_stock,active').is('archived_at', null).order('name'), supabase.from('stock_movements').select('id,product_id,movement_type,quantity,reason,created_at,products(name)').order('created_at', { ascending: false }).limit(60)]); if (productResult.error || movementResult.error) setError('Não foi possível carregar o estoque.'); setProducts((productResult.data || []) as Product[]); setMovements((movementResult.data || []) as Movement[]); setLoading(false); }
  useEffect(() => { load(); }, []);

  async function submit(event: FormEvent) { event.preventDefault(); if (!supabase || !selected) return; const amount = Number(quantity); if (!amount || amount <= 0 || !reason.trim()) { setError('Informe uma quantidade e um motivo.'); return; } if (type === 'exit' && amount > selected.quantity) { setError('A saída não pode ser maior que o estoque disponível.'); return; } setSaving(true); setError(''); const next = type === 'entry' ? selected.quantity + amount : type === 'exit' ? selected.quantity - amount : amount; const movement = await supabase.from('stock_movements').insert({ product_id: selected.id, movement_type: type, quantity: amount, reason: `${reason.trim()}${note.trim() ? ` — ${note.trim()}` : ''}` }).select('id,product_id,movement_type,quantity,reason,created_at,products(name)').single(); const product = movement.error ? movement : await supabase.from('products').update({ quantity: next }).eq('id', selected.id).select('id,name,quantity,minimum_stock,active').single(); if (movement.error || product.error || !product.data) { setError('Não foi possível salvar a movimentação.'); setSaving(false); return; } setProducts(prev => prev.map(item => item.id === selected.id ? product.data as Product : item)); setMovements(prev => [movement.data as Movement, ...prev]); setSelected(null); setQuantity(''); setReason(''); setNote(''); toast.success('Movimentação registrada com sucesso.'); setSaving(false); }

  const low = products.filter(product => product.active && product.quantity <= product.minimum_stock); const total = products.filter(product => product.active).reduce((sum, product) => sum + product.quantity, 0); const status = (product: Product) => !product.active ? ['red', 'Inativo'] : product.quantity === 0 ? ['red', 'Sem estoque'] : product.quantity <= product.minimum_stock ? ['gold', 'Estoque baixo'] : ['green', 'Ativo'];

  const dailyMovements = useMemo(() => {
    const map = new Map<string, { in: number; out: number }>();
    movements.forEach(movement => { const key = movement.created_at.slice(0, 10); const entry = map.get(key) || { in: 0, out: 0 }; if (movement.movement_type === 'entry') entry.in += movement.quantity; else if (movement.movement_type === 'exit') entry.out += movement.quantity; map.set(key, entry); });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0])).slice(-14).map(([key, value]) => ({ label: dayLabel(key), values: { in: value.in, out: value.out } }));
  }, [movements]);

  return <section className="content">
    <div className="page-toolbar-top"><span className="page-toolbar-count">{!loading ? `${total} unidade(s) em estoque` : ''}</span></div>
    {error && !selected && <div className="error" role="alert">{error}</div>}
    <div className="module-overview">
      <article className="card module-stat"><span>Itens disponíveis</span><strong>{loading ? '—' : total}</strong><small>Unidades ativas</small></article>
      <article className={`card module-stat${low.length ? ' tone-amber' : ''}`}><span>Estoque baixo</span><strong>{loading ? '—' : low.length}</strong><small>Produtos no mínimo</small></article>
      <article className="card module-stat"><span>Movimentações recentes</span><strong>{loading ? '—' : movements.length}</strong><small>Últimos registros</small></article>
    </div>

    {low.length > 0 && <section className="panel" style={{ marginTop: 16, borderLeft: '3px solid var(--amber)' }}>
      <header className="panel-header"><h3>Alertas de estoque crítico</h3></header>
      <div className="report-bars" style={{ marginTop: 16 }}>{low.map(product => <div className="report-bar-row" key={product.id}><span className="report-bar-label">{product.name}</span><div className="report-bar-track"><div className="report-bar-fill is-critical" style={{ width: `${Math.min(100, (product.quantity / Math.max(product.minimum_stock, 1)) * 100)}%` }} /></div><strong className="report-bar-value">{product.quantity}</strong></div>)}</div>
    </section>}

    <section className="panel" style={{ marginTop: 16 }}>
      <header className="panel-header"><h3>Movimentações por dia</h3></header>
      <BarChart data={dailyMovements} series={[{ key: 'in', label: 'Entradas', color: 'var(--green)' }, { key: 'out', label: 'Saídas', color: 'var(--red)' }]} emptyLabel="Nenhuma movimentação registrada." />
    </section>

    <section className="panel" style={{ marginTop: 16 }}><header className="panel-header"><h3>Produtos e saldo atual</h3></header>{products.length ? <div className="table-wrap"><table className="table"><thead><tr><th>Produto</th><th>Quantidade</th><th>Status</th><th>Ação</th></tr></thead><tbody>{products.map(product => { const [tone, label] = status(product); return <tr key={product.id}><td>{product.name}</td><td>{product.quantity}</td><td><span className={`badge ${tone}`}>{label}</span></td><td><button className="btn" onClick={() => { setSelected(product); setType('entry'); setQuantity(''); setReason(''); setNote(''); setError(''); }}>Movimentar</button></td></tr>; })}</tbody></table></div> : <div className="empty">Nenhum produto cadastrado para movimentar.</div>}</section>

    <section className="panel" style={{ marginTop: 16 }}><header className="panel-header"><h3>Movimentações recentes</h3></header>{movements.length ? <div className="table-wrap"><table className="table"><thead><tr><th>Tipo</th><th>Produto</th><th>Quantidade</th><th>Motivo</th><th>Data</th></tr></thead><tbody>{movements.map(movement => <tr key={movement.id}><td>{labels[movement.movement_type]}</td><td>{Array.isArray(movement.products) ? movement.products[0]?.name : movement.products?.name || 'Produto'}</td><td>{movement.quantity}</td><td>{movement.reason}</td><td>{new Date(movement.created_at).toLocaleDateString('pt-BR')}</td></tr>)}</tbody></table></div> : <div className="empty">Nenhuma movimentação registrada.</div>}</section>

    <Drawer open={Boolean(selected)} onClose={() => setSelected(null)} title={selected ? `Movimentar estoque · ${selected.name}` : ''} description="Registre entradas, saídas ou ajustes. O saldo do produto é atualizado automaticamente.">
      <form onSubmit={submit}>
        <div className="form-grid">
          <div className="field"><label htmlFor="stock-type">Tipo <span className="required">*</span></label><select id="stock-type" className="select" value={type} onChange={event => setType(event.target.value as Movement['movement_type'])}>{Object.entries(labels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div>
          <div className="field"><label htmlFor="stock-quantity">Quantidade <span className="required">*</span></label><input id="stock-quantity" className="input" type="number" min="1" value={quantity} onChange={event => setQuantity(event.target.value)} required /></div>
          <div className="field"><label htmlFor="stock-reason">Motivo <span className="required">*</span></label><input id="stock-reason" className="input" value={reason} onChange={event => setReason(event.target.value)} required /></div>
          <div className="field"><label htmlFor="stock-note">Observação</label><input id="stock-note" className="input" value={note} onChange={event => setNote(event.target.value)} /></div>
        </div>
        {selected && <p className="muted" style={{ marginTop: 14 }}>Estoque atual: {selected.quantity} unidades.</p>}
        {error && <div className="error" role="alert" style={{ marginTop: 14 }}>{error}</div>}
        <div className="actions"><button type="button" className="btn" onClick={() => setSelected(null)}>Cancelar</button><button className="btn primary" disabled={saving}>{saving ? 'Salvando…' : 'Registrar movimentação'}</button></div>
      </form>
    </Drawer>
  </section>;
}
