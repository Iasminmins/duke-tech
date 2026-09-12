import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getCustomerDetail, archiveCustomer, type CustomerDetail, type CustomerDevice, type CustomerOrder } from './customerRepository';
import { statusLabels, statusTone } from '../work-orders/workOrderSchema';

const money = (value: number) => Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const dateFmt = (value: string) => new Date(value).toLocaleDateString('pt-BR');

export function CustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [devices, setDevices] = useState<CustomerDevice[]>([]);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function load() {
    if (!id) return;
    setLoading(true); setError('');
    getCustomerDetail(id).then(result => {
      if (result.error || !result.data) { setError('Não foi possível carregar este cliente.'); setLoading(false); return; }
      setCustomer(result.data); setDevices(result.devices); setOrders(result.orders); setLoading(false);
    });
  }
  useEffect(load, [id]);

  async function confirmDelete() {
    if (!id) return;
    if (devices.length > 0 || orders.length > 0) {
      // Exclusão protegida: cliente com histórico não pode ser removido.
      setError('Este cliente possui aparelhos ou comandas vinculadas e não pode ser excluído.');
      setConfirmingDelete(false);
      return;
    }
    setDeleting(true);
    const { error: archiveError } = await archiveCustomer(id);
    setDeleting(false);
    if (archiveError) { setError('Não foi possível excluir este cliente.'); return; }
    navigate('/admin/clientes', { replace: true });
  }

  const totalSpent = orders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + Number(o.final_amount || 0), 0);
  const lastVisit = orders[0]?.created_at;

  if (loading) return <section className="content"><div className="card loading-skeleton" role="status" aria-live="polite"><span /><span /><span /><span /></div></section>;
  if (error && !customer) return <section className="content"><div className="card empty error-state" role="alert"><p>{error}</p><button className="btn primary" onClick={load}>Tentar novamente</button></div></section>;
  if (!customer) return null;

  return <section className="content">
    <div className="page-toolbar-top">
      <span className="page-toolbar-count">Cliente desde {dateFmt(customer.created_at)}</span>
      <div className="heading-actions"><Link className="btn" to="/admin/clientes">← Voltar</Link><button className="btn danger" onClick={() => setConfirmingDelete(true)}>Excluir cliente</button></div>
    </div>
    {error && <div className="error" role="alert" style={{ marginBottom: 16 }}>{error}</div>}
    {confirmingDelete && <div className="form-card" role="alertdialog" aria-label="Confirmar exclusão" style={{ marginBottom: 16 }}>
      <p>Tem certeza que deseja excluir <strong>{customer.full_name}</strong>? Esta ação não pode ser desfeita.</p>
      <div className="actions"><button type="button" className="btn" onClick={() => setConfirmingDelete(false)}>Cancelar</button><button type="button" className="btn primary" disabled={deleting} onClick={confirmDelete}>{deleting ? 'Excluindo…' : 'Confirmar exclusão'}</button></div>
    </div>}

    <div className="module-overview" style={{ marginBottom: 16 }}>
      <article className="card module-stat"><span>Total gasto</span><strong>{money(totalSpent)}</strong><small>Comandas entregues</small></article>
      <article className="card module-stat"><span>Comandas</span><strong>{orders.length}</strong><small>{orders.length ? 'Histórico completo abaixo' : 'Nenhuma comanda ainda'}</small></article>
      <article className="card module-stat"><span>Última visita</span><strong>{lastVisit ? dateFmt(lastVisit) : '—'}</strong><small>{devices.length} aparelho(s) vinculado(s)</small></article>
    </div>

    <div className="detail-grid">
      <div style={{ display: 'grid', gap: 16 }}>
        <section className="panel">
          <header className="panel-header"><h3>Comandas</h3></header>
          {orders.length === 0 ? <div className="empty">Nenhuma comanda registrada para este cliente.</div> : <div className="orders-table" style={{ marginTop: 16 }}>
            {orders.map(order => <Link to={`/admin/comandas/${order.id}`} className="order-row" key={order.id}><strong>#{order.number}</strong><span className={`badge ${statusTone[order.status as keyof typeof statusTone] || 'blue'}`}>{statusLabels[order.status as keyof typeof statusLabels] || order.status}</span><span>{money(order.final_amount)}</span><small>{dateFmt(order.created_at)}</small></Link>)}
          </div>}
        </section>
        <section className="panel">
          <header className="panel-header"><h3>Aparelhos vinculados</h3></header>
          {devices.length === 0 ? <div className="empty">Nenhum aparelho cadastrado para este cliente.</div> : <div className="orders-table" style={{ marginTop: 16 }}>
            {devices.map(device => <div className="order-row" key={device.id}><strong>{device.brand} {device.model}</strong><span>{device.reported_problem}</span><small>{dateFmt(device.received_at)}</small></div>)}
          </div>}
        </section>
      </div>
      <section className="panel">
        <header className="panel-header"><div><span className="section-kicker">Dados de contato</span><h3>{customer.full_name}</h3></div></header>
        <dl className="detail-list">
          <div><dt>Telefone</dt><dd>{customer.phone}</dd></div>
          <div><dt>WhatsApp</dt><dd>{customer.whatsapp || '—'}</dd></div>
          <div><dt>E-mail</dt><dd>{customer.email || '—'}</dd></div>
          <div><dt>CPF/CNPJ</dt><dd>{customer.cpf || '—'}</dd></div>
          <div className="full"><dt>Endereço</dt><dd>{customer.address || '—'}</dd></div>
          <div className="full"><dt>Observações</dt><dd>{customer.notes || '—'}</dd></div>
        </dl>
      </section>
    </div>
  </section>;
}
