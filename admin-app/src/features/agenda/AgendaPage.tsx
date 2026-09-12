import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../../components/ui/EmptyState';
import { Icon } from '../../components/ui/Icon';
import { supabase } from '../../lib/supabase';
import { statusLabels, statusTone, type WorkOrderStatus } from '../work-orders/workOrderSchema';
import { getAgendaMetrics, type AgendaOrder } from './agendaUtils';

type Row = AgendaOrder & { id: string; number: number; customer: string; device: string };

const today = new Date();
const dateKey = (date: Date) => date.toISOString().slice(0, 10);
const formatDate = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });

export function AgendaPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');
  const [note, setNote] = useState('');
  const [success, setSuccess] = useState('');

  async function loadAgenda() {
    setLoading(true); setError('');
    if (!supabase) { setLoading(false); setError('Banco de dados não configurado.'); return; }
    const request = supabase.from('work_orders')
      .select('id,number,status,estimated_due_date,customers(full_name),devices(brand,model)')
      .is('archived_at', null)
      .order('estimated_due_date', { ascending: true });
    const timeout = new Promise<never>((_, reject) => window.setTimeout(() => reject(new Error('timeout')), 10000));
    let data: any[] | null = null; let queryError: any = null;
    try { ({ data, error: queryError } = await Promise.race([request, timeout]) as any); } catch { queryError = new Error('timeout'); }
    if (queryError) { setError('Não foi possível carregar a agenda.'); setLoading(false); return; }
    setRows((data || []).map((item: any) => ({
          id: item.id,
          number: item.number,
          status: item.status,
          estimated_due_date: item.estimated_due_date,
          customer: Array.isArray(item.customers) ? item.customers[0]?.full_name : item.customers?.full_name,
          device: Array.isArray(item.devices) ? `${item.devices[0]?.brand || ''} ${item.devices[0]?.model || ''}`.trim() : `${item.devices?.brand || ''} ${item.devices?.model || ''}`.trim(),
        })));
    setLoading(false);
  }
  useEffect(() => { loadAgenda(); }, []);

  const metrics = useMemo(() => getAgendaMetrics(rows, today), [rows]);
  const upcoming = rows.filter(row => row.estimated_due_date && row.estimated_due_date >= dateKey(today));

  async function saveAppointment(event: FormEvent) {
    event.preventDefault();
    if (!supabase || !selectedId || !date) { setError('Escolha uma comanda e informe a data.'); return; }
    if (date < dateKey(today)) { setError('A data do compromisso não pode estar no passado.'); return; }
    setSaving(true); setError('');
    const result = await supabase.from('work_orders').update({ estimated_due_date: date, internal_notes: note ? `Compromisso ${time}: ${note}` : null }).eq('id', selectedId).select('id,number,status,estimated_due_date,customers(full_name),devices(brand,model)').single();
    if (result.error || !result.data) { setError('Não foi possível agendar este compromisso.'); setSaving(false); return; }
    const item: any = result.data;
    const updated: Row = { id: item.id, number: item.number, status: item.status, estimated_due_date: item.estimated_due_date, customer: Array.isArray(item.customers) ? item.customers[0]?.full_name : item.customers?.full_name, device: Array.isArray(item.devices) ? `${item.devices[0]?.brand || ''} ${item.devices[0]?.model || ''}`.trim() : `${item.devices?.brand || ''} ${item.devices?.model || ''}`.trim() };
    setRows(prev => [updated, ...prev.filter(row => row.id !== updated.id)].sort((a, b) => (a.estimated_due_date || '').localeCompare(b.estimated_due_date || '')));
    setFormOpen(false); setSelectedId(''); setDate(''); setTime('09:00'); setNote(''); setSuccess('Compromisso agendado com sucesso.'); setSaving(false);
  }

  return <section className="content">
    <div className="page-toolbar-top"><span className="page-toolbar-count">{!loading ? `${upcoming.length} ${upcoming.length === 1 ? 'compromisso' : 'compromissos'}` : ''}</span><button className="btn primary" onClick={() => { setFormOpen(open => !open); setError(''); }}><Icon name="plus" size={16}/> {formOpen ? 'Fechar agendamento' : 'Agendar compromisso'}</button></div>
    {success && <div className="success" role="status">{success}</div>}{formOpen && <form className="form-card agenda-form" onSubmit={saveAppointment}><div className="form-grid"><div className="field full"><label htmlFor="agenda-order">Comanda <span className="required">*</span></label><select id="agenda-order" className="select" value={selectedId} onChange={event => setSelectedId(event.target.value)} required><option value="">Selecione a comanda</option>{rows.map(row => <option value={row.id} key={row.id}>#{row.number} · {row.customer || 'Cliente'} · {row.device || 'Aparelho'}</option>)}</select></div><div className="field"><label htmlFor="agenda-date">Data <span className="required">*</span></label><input id="agenda-date" className="input" type="date" min={dateKey(today)} value={date} onChange={event => setDate(event.target.value)} required/></div><div className="field"><label htmlFor="agenda-time">Horário <span className="muted">(opcional)</span></label><input id="agenda-time" className="input" type="time" value={time} onChange={event => setTime(event.target.value)}/></div><div className="field full"><label htmlFor="agenda-note">Observação</label><input id="agenda-note" className="input" placeholder="Ex.: cliente confirmou pelo WhatsApp" value={note} onChange={event => setNote(event.target.value)}/></div></div>{error && <div className="error" role="alert" style={{ marginTop: 16 }}>{error}</div>}<div className="actions"><button type="button" className="btn" onClick={() => setFormOpen(false)}>Cancelar</button><button className="btn primary" disabled={saving}>{saving ? 'Salvando…' : 'Salvar compromisso'}</button></div></form>}
    <div className="module-overview agenda-overview">
      <article className="card module-stat"><span>Hoje</span><strong>{loading ? '—' : metrics.today}</strong><small>{metrics.today ? 'Entrega ou retirada prevista' : 'Nenhuma entrega prevista'}</small></article>
      <article className="card module-stat"><span>Próximos 7 dias</span><strong>{loading ? '—' : metrics.nextSevenDays}</strong><small>{metrics.nextSevenDays ? 'Compromissos com data definida' : 'Nenhum compromisso próximo'}</small></article>
      <article className={`card module-stat${metrics.awaitingConfirmation ? ' tone-amber' : ''}`}><span>Aguardando confirmação</span><strong>{loading ? '—' : metrics.awaitingConfirmation}</strong><small>{metrics.awaitingConfirmation ? 'Orçamentos aguardando retorno' : 'Tudo em dia'}</small></article>
    </div>
    <section className="panel agenda-panel">
      <header className="panel-header"><h3>Entregas e retiradas</h3><Link to="/admin/comandas" className="panel-link">Ver comandas <Icon name="arrow" size={14}/></Link></header>
      {error && !formOpen ? <div className="empty error-state" role="alert"><p>{error}</p><button className="btn primary" onClick={loadAgenda}>Tentar novamente</button></div> : loading ? <div className="empty" role="status" aria-live="polite">Carregando compromissos…</div> : upcoming.length === 0 ? <EmptyState icon="calendar" title="Nenhum compromisso agendado" description="Agende uma entrega ou retirada usando o botão acima, sem sair desta tela." actionLabel="Agendar compromisso" actionTo="/admin/agenda" example="A Agenda reúne retiradas, entregas e retornos por ordem de data."/> : <div className="agenda-list">{upcoming.map(row => <Link className="agenda-item" to={`/admin/comandas/${row.id}`} key={row.id}><div className="agenda-date"><strong>{formatDate(row.estimated_due_date!)}</strong><small>Comanda #{row.number}</small></div><div className="agenda-main"><strong>{row.customer || 'Cliente não informado'}</strong><span>{row.device || 'Aparelho não informado'}</span></div><span className={`badge ${statusTone[row.status as WorkOrderStatus] || 'blue'}`}>{statusLabels[row.status as WorkOrderStatus] || row.status}</span><Icon name="arrow" size={16}/></Link>)}</div>}
    </section>
  </section>;
}
