import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../auth/AuthProvider';
import { Badge, type BadgeTone } from '../../components/ui/Badge';
import { useToast } from '../../components/ui/ToastProvider';
import { digitsOnly } from '../../lib/format';
import { leadStatusLabels, listLeads, updateLeadStatus, type LeadStatus, type SiteLead } from './leadRepository';

const tones: Record<LeadStatus, BadgeTone> = { new: 'info', contacted: 'warning', closed: 'neutral' };
const filters: { label: string; status?: LeadStatus }[] = [{ label: 'Todos' }, { label: 'Novos', status: 'new' }, { label: 'Em contato', status: 'contacted' }, { label: 'Encerrados', status: 'closed' }];
const when = (value: string) => new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

function whatsappLink(lead: SiteLead) {
  const digits = digitsOnly(lead.phone || '');
  if (digits.length < 10) return '';
  const text = `Olá, ${lead.name}! Aqui é da Duke Tech. Recebemos sua mensagem pelo site sobre "${lead.subject}".`;
  return `https://wa.me/${digits.startsWith('55') ? digits : `55${digits}`}?text=${encodeURIComponent(text)}`;
}

export function LeadsPage() {
  const { session } = useAuth();
  const toast = useToast();
  const [rows, setRows] = useState<SiteLead[]>([]);
  const [filter, setFilter] = useState('Novos');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');

  async function load() {
    setLoading(true); setError('');
    const result = await listLeads();
    if (result.error) setError('Não foi possível carregar os contatos do site.'); else setRows(result.data);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function setStatus(lead: SiteLead, status: LeadStatus) {
    setBusyId(lead.id);
    const result = await updateLeadStatus(lead.id, status, session?.user.id);
    setBusyId('');
    if (result.error) { toast.error('Não foi possível atualizar o contato.'); return; }
    setRows(prev => prev.map(row => row.id === lead.id ? { ...row, status } : row));
    toast.success(`Contato marcado como ${leadStatusLabels[status].toLowerCase()}.`);
  }

  const selected = filters.find(item => item.label === filter) || filters[0];
  const visible = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    return rows.filter(row => (!selected.status || row.status === selected.status) && (!q || [row.name, row.phone || '', row.subject, row.message].some(v => v.toLocaleLowerCase().includes(q))));
  }, [rows, selected.status, query]);
  const newCount = rows.filter(row => row.status === 'new').length;

  return <section className="content">
    <div className="page-heading"><div><div className="eyebrow">Site</div><h2>Contatos do site</h2><p>Mensagens enviadas pelo formulário do site institucional.</p></div></div>
    <div className="list-tools">
      <label className="list-search"><span className="sr-only">Buscar contatos</span><input className="input" placeholder="Buscar por nome, telefone ou mensagem" value={query} onChange={e => setQuery(e.target.value)} /></label>
      <div className="lead-filters" role="group" aria-label="Filtrar por situação">
        {filters.map(item => <button key={item.label} type="button" className="btn" aria-pressed={filter === item.label} onClick={() => setFilter(item.label)}>{item.label}{item.status === 'new' && newCount > 0 ? ` (${newCount})` : ''}</button>)}
      </div>
    </div>
    {error && <div className="error" role="alert">{error} <button type="button" className="btn" onClick={load}>Tentar novamente</button></div>}
    {loading ? <div className="loading-skeleton" role="status" aria-label="Carregando contatos"><span /><span /><span /></div>
      : visible.length === 0 ? <section className="panel state-block">
          <img className="empty-state-mascot" src={`${import.meta.env.BASE_URL}duke-mascote.webp`} alt="" width="64" height="116" loading="lazy" />
          <h3>{rows.length === 0 ? 'Nenhum contato recebido ainda' : 'Nada nesta lista'}</h3>
          <p>{rows.length === 0 ? 'Quando alguém preencher o formulário do site, a mensagem aparece aqui.' : 'Troque o filtro ou a busca para ver outros contatos.'}</p>
        </section>
      : <div className="lead-list">{visible.map(lead => { const wa = whatsappLink(lead); return <article className="lead-card panel" key={lead.id}>
          <header><div><strong>{lead.name}</strong><span className="muted">{lead.phone || 'Sem telefone'}</span></div><div className="lead-meta"><Badge tone={tones[lead.status]}>{leadStatusLabels[lead.status]}</Badge><time className="muted mono" dateTime={lead.created_at}>{when(lead.created_at)}</time></div></header>
          <p className="lead-subject">{lead.subject}</p>
          <p className="lead-message">{lead.message}</p>
          <div className="lead-actions">
            {wa && <a className="btn primary" href={wa} target="_blank" rel="noopener noreferrer" onClick={() => lead.status === 'new' && setStatus(lead, 'contacted')}>Responder no WhatsApp</a>}
            {lead.status === 'new' && <button type="button" className="btn" disabled={busyId === lead.id} onClick={() => setStatus(lead, 'contacted')}>Marcar em contato</button>}
            {lead.status !== 'closed' ? <button type="button" className="btn" disabled={busyId === lead.id} onClick={() => setStatus(lead, 'closed')}>Encerrar</button> : <button type="button" className="btn" disabled={busyId === lead.id} onClick={() => setStatus(lead, 'new')}>Reabrir</button>}
          </div>
        </article>; })}</div>}
  </section>;
}
