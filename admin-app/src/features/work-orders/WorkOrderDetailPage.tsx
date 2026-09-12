import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Icon } from '../../components/ui/Icon';
import { getWorkOrderDetail, updateWorkOrderStatus, formatWorkOrderNumber, type WorkOrderDetail } from './workOrderRepository';
import { statuses, statusLabels, statusTone, type WorkOrderStatus } from './workOrderSchema';
import { useAuth } from '../../auth/AuthProvider';
import { useToast } from '../../components/ui/ToastProvider';

const formatDate = (value?: string | null) => value ? new Date(`${value.length === 10 ? `${value}T12:00:00` : value}`).toLocaleDateString('pt-BR') : 'Não informada';
const formatDateTime = (value: string) => new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
const priorityLabels = { normal: 'Normal', high: 'Alta', urgent: 'Urgente' };
const priorityTone = { normal: 'neutral', high: 'amber', urgent: 'red' } as const;
const formatHistoryNote = (note: string | null, status?: WorkOrderStatus) => {
  const clean = (note || '').replace(/\s*[—-]?\s*DADOS DEMO/gi, '').trim();
  const match = clean.match(/^Status alterado para\s+([a-z_]+)$/i);
  if (match && statusLabels[match[1] as WorkOrderStatus]) return `Status alterado para ${statusLabels[match[1] as WorkOrderStatus]}`;
  return clean || (status ? `Status atualizado para ${statusLabels[status]}` : 'Atualização registrada.');
};

export function WorkOrderDetailPage() {
  const toast = useToast();
  const { id } = useParams();
  const [order, setOrder] = useState<WorkOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusOpen, setStatusOpen] = useState(false);
  const [nextStatus, setNextStatus] = useState<WorkOrderStatus | ''>('');
  const [savingStatus, setSavingStatus] = useState(false);
  const [trackingOpen, setTrackingOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { profile } = useAuth();

  useEffect(() => {
    if (!id) { setError('Comanda não encontrada.'); setLoading(false); return; }
    getWorkOrderDetail(id).then(result => { if (result.error) setError('Não foi possível carregar esta comanda.'); else if (!result.data) setError('Comanda não encontrada.'); else setOrder(result.data); setLoading(false); });
  }, [id]);

  if (loading) return <section className="content"><div className="page-toolbar-top"><span className="page-toolbar-count">Carregando comanda…</span><Link className="btn" to="/admin/comandas">Voltar</Link></div><section className="panel empty">Carregando dados da comanda…</section></section>;
  if (error || !order) return <section className="content"><div className="page-toolbar-top"><span className="page-toolbar-count">{error || 'O registro solicitado não existe ou foi arquivado.'}</span><Link className="btn primary" to="/admin/comandas">Voltar para comandas</Link></div></section>;

  const currentOrder = order;
  async function saveStatus() { if (!id || !nextStatus || nextStatus === currentOrder.status) { setError('Escolha um status diferente do atual.'); return; } setSavingStatus(true); setError(''); const result = await updateWorkOrderStatus(id, nextStatus); if (result.error || !result.history) { setError('Não foi possível alterar o status.'); setSavingStatus(false); return; } setOrder({ ...currentOrder, status: nextStatus, updated_at: result.data?.updated_at || currentOrder.updated_at, work_order_status_history: [...currentOrder.work_order_status_history, result.history] }); setStatusOpen(false); setNextStatus(''); toast.success('Status atualizado com sucesso.'); setSavingStatus(false); }

  const customer = order.customers;
  const device = order.devices;
  const publicUrl = `${window.location.origin}/acompanhar/${order.public_code}`;
  const whatsappUrl = customer?.phone || customer?.whatsapp ? `https://wa.me/${(customer.phone || customer.whatsapp || '').replace(/\D/g, '')}?text=${encodeURIComponent(`Olá, ${customer.full_name || ''}! Você pode acompanhar o reparo do seu aparelho pelo link: ${publicUrl}`)}` : '';
  async function copyTrackingLink() { try { await navigator.clipboard.writeText(publicUrl); setCopied(true); window.setTimeout(() => setCopied(false), 2500); } catch { setError('Não foi possível copiar o link.'); } }
  return <section className="content"><div className="page-toolbar-top"><span className="page-toolbar-count">Comanda {formatWorkOrderNumber(order.number)} · Código público {order.public_code}</span><Link className="btn" to="/admin/comandas">← Voltar</Link></div>    <div className="detail-grid"><section className="card detail-card"><div className="detail-card-heading"><div><span className={`badge ${statusTone[order.status]}`}>{statusLabels[order.status]}</span><h3>{customer?.full_name || 'Cliente não informado'}</h3></div><span className={`priority-tag tone-${priorityTone[order.priority]}`}><i className="priority-dot"/>{priorityLabels[order.priority]}</span></div><dl className="detail-list"><div><dt>Telefone</dt><dd>{customer?.phone || customer?.whatsapp || 'Não informado'}</dd></div><div><dt>Aparelho</dt><dd>{device ? `${device.brand} ${device.model}` : 'Não informado'}</dd></div><div><dt>Problema relatado</dt><dd>{device?.reported_problem || order.service_requested}</dd></div><div><dt>Data de entrada</dt><dd>{formatDate(order.created_at)}</dd></div><div><dt>Previsão de entrega</dt><dd>{formatDate(order.estimated_due_date)}</dd></div><div><dt>Orçamento</dt><dd>{Number(order.quote || order.final_amount || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</dd></div><div className="full"><dt>Observações</dt><dd>{order.internal_notes || 'Nenhuma observação registrada.'}</dd></div></dl></section><section className="card"><h3>Linha do tempo</h3><div className="timeline">{order.work_order_status_history.length ? order.work_order_status_history.map(item => <div className="timeline-item" key={item.id}><span className="dot"/><div><strong>{statusLabels[item.status] || item.status}</strong><p className="muted">{formatHistoryNote(item.note, item.status)}</p><small className="muted">{formatDateTime(item.created_at)}</small></div></div>) : <p className="muted">Nenhuma atualização registrada.</p>}</div></section></div>
    <section className="card detail-actions"><h3>Ações</h3><div><button className="btn primary" onClick={() => { setStatusOpen(value => !value); setNextStatus(order.status); setError(''); }} aria-expanded={statusOpen}><Icon name="arrow" size={15}/> Alterar status</button><button className="btn" onClick={() => setTrackingOpen(value => !value)} aria-expanded={trackingOpen}><Icon name="arrow" size={15}/> Acompanhamento do cliente</button><button className="btn" disabled title="Upload de fotos será habilitado na próxima etapa">Adicionar foto</button></div>{trackingOpen && <div className="tracking-share" role="region" aria-label="Link de acompanhamento do cliente"><h3>Acompanhe o reparo pelo celular</h3><p className="muted">Envie este endereço para o cliente consultar o status, a previsão e as atualizações da comanda.</p><div className="tracking-link-row"><input className="input" aria-label="Link público da comanda" value={publicUrl} readOnly /><button className="btn primary" onClick={copyTrackingLink}>{copied ? 'Copiado' : 'Copiar link'}</button></div><div className="tracking-share-actions">{whatsappUrl ? <a className="btn" href={whatsappUrl} target="_blank" rel="noreferrer">Enviar pelo WhatsApp</a> : <span className="muted">Cadastre um telefone para habilitar o WhatsApp.</span>}<a className="panel-link" href={publicUrl} target="_blank" rel="noreferrer">Abrir página pública ↗</a></div></div>}{statusOpen && <div className="status-editor" role="region" aria-label="Alteração de status"><p className="status-change-summary">Status atual: <strong>{statusLabels[order.status]}</strong><br />Novo status: <strong>{nextStatus ? statusLabels[nextStatus] : 'selecione'}</strong><br /><span className="muted">Responsável: {profile?.full_name || 'Administrador atual'}</span></p><label htmlFor="next-status">Novo status <span className="required">*</span></label><select id="next-status" className="select" value={nextStatus} onChange={event => setNextStatus(event.target.value as WorkOrderStatus)}>{statuses.map(status => <option value={status} key={status}>{statusLabels[status]}</option>)}</select>{nextStatus && nextStatus !== order.status && <p className="muted">A comanda e os indicadores relacionados serão atualizados após a confirmação.</p>}{error && <div className="error" role="alert">{error}</div>}<div className="actions"><button className="btn" type="button" onClick={() => setStatusOpen(false)}>Cancelar</button><button className="btn primary" type="button" disabled={savingStatus || nextStatus === order.status} onClick={saveStatus}>{savingStatus ? 'Salvando…' : 'Confirmar alteração'}</button></div></div>}</section>
  </section>;
}
