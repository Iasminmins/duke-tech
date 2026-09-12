import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../../components/ui/EmptyState';
import { Pagination, usePagination } from '../../components/ui/Pagination';
import { listWorkOrders, updateWorkOrderStatus, type WorkOrderListItem } from './workOrderRepository';
import { statuses, statusLabels, statusTone, type WorkOrderStatus } from './workOrderSchema';

const currency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const dateFmt = (value: string) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
const priorityLabels = { normal: 'Normal', high: 'Alta', urgent: 'Urgente' } as const;
const priorityTone = { normal: 'neutral', high: 'amber', urgent: 'red' } as const;
const filters: { label: string; status?: WorkOrderStatus[]; overdue?: boolean; tone?: 'danger' }[] = [
  { label: 'Todos' }, { label: 'Recebido', status: ['received'] }, { label: 'Em diagnóstico', status: ['diagnosis'] }, { label: 'Aguardando aprovação', status: ['awaiting_approval'] }, { label: 'Em reparo', status: ['repair'] }, { label: 'Aguardando peça', status: ['awaiting_part'] }, { label: 'Em teste', status: ['testing'] }, { label: 'Prontos', status: ['ready'] }, { label: 'Entregues', status: ['delivered'] }, { label: 'Canceladas', status: ['cancelled'] }, { label: 'Atrasadas', overdue: true, tone: 'danger' },
];
const ordersCache = new Map<string, WorkOrderListItem[]>();
const matchesQuery = (row: WorkOrderListItem, normalized: string) => {
  if (!normalized) return true;
  const customer = row.customers?.full_name || ''; const device = row.devices ? `${row.devices.brand} ${row.devices.model}` : '';
  return [String(row.number), customer, device, row.customers?.phone || ''].some(value => value.toLocaleLowerCase().includes(normalized));
};

export function WorkOrdersPage() {
  const [view, setView] = useState<'list' | 'kanban'>('list');
  const [filter, setFilter] = useState('Todos'); const [query, setQuery] = useState(''); const [sort, setSort] = useState('recent'); const [rows, setRows] = useState<WorkOrderListItem[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const [dragId, setDragId] = useState(''); const [dragOverStatus, setDragOverStatus] = useState(''); const [movingId, setMovingId] = useState(''); const [moveError, setMoveError] = useState('');
  const selected = filters.find(item => item.label === filter) || filters[0];
  async function load() { const cacheKey = view === 'kanban' ? '__kanban_all__' : filter; const statusParam = view === 'kanban' ? undefined : selected.status; const cached = ordersCache.get(cacheKey); if (cached) { setRows(cached); setLoading(false); } else setLoading(true); setError(''); const request = listWorkOrders(statusParam); const timeout = new Promise<never>((_, reject) => window.setTimeout(() => reject(new Error('timeout')), 10000)); try { const result = await Promise.race([request, timeout]); if (result.error) throw result.error; ordersCache.set(cacheKey, result.data); setRows(result.data); } catch { if (!cached) setError('Não foi possível carregar as comandas.'); } finally { setLoading(false); } }
  useEffect(() => { load(); }, [filter, view]);
  const visibleRows = useMemo(() => { const normalized = query.trim().toLocaleLowerCase(); const today = new Date().toISOString().slice(0, 10); return rows.filter(row => { const matchesOverdue = !selected.overdue || Boolean(row.estimated_due_date && row.estimated_due_date < today && !['delivered', 'cancelled'].includes(row.status)); return matchesQuery(row, normalized) && matchesOverdue; }).sort((a, b) => sort === 'number' ? b.number - a.number : sort === 'value' ? Number(b.final_amount) - Number(a.final_amount) : sort === 'due' ? (a.estimated_due_date || '9999').localeCompare(b.estimated_due_date || '9999') : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); }, [rows, query, sort, selected.overdue]);
  const kanbanRows = useMemo(() => { const normalized = query.trim().toLocaleLowerCase(); return rows.filter(row => matchesQuery(row, normalized)); }, [rows, query]);
  const { page, setPage, pageCount, pageItems } = usePagination(visibleRows, 20);

  async function moveCard(id: string, nextStatus: WorkOrderStatus) {
    const current = rows.find(row => row.id === id);
    if (!current || current.status === nextStatus) return;
    setMovingId(id); setMoveError('');
    const result = await updateWorkOrderStatus(id, nextStatus);
    setMovingId('');
    if (result.error) { setMoveError('Não foi possível mover esta comanda. Tente novamente.'); return; }
    ordersCache.clear();
    setRows(prev => prev.map(row => row.id === id ? { ...row, status: nextStatus } : row));
  }

  return <section className="content">
    <div className="page-toolbar-top">
      <span className="page-toolbar-count">{view === 'list' ? (!loading && !error ? `${visibleRows.length} ${visibleRows.length === 1 ? 'comanda' : 'comandas'}` : '') : `${kanbanRows.length} ${kanbanRows.length === 1 ? 'comanda' : 'comandas'} no pipeline`}</span>
      <div className="heading-actions">
        <div className="view-toggle" role="group" aria-label="Alternar visualização">
          <button type="button" className={`btn${view === 'list' ? ' active' : ''}`} aria-pressed={view === 'list'} onClick={() => setView('list')}>Lista</button>
          <button type="button" className={`btn${view === 'kanban' ? ' active' : ''}`} aria-pressed={view === 'kanban'} onClick={() => setView('kanban')}>Kanban</button>
        </div>
        <Link className="btn primary" to="/admin/comandas/nova">+ Nova comanda</Link>
      </div>
    </div>

    {view === 'list' && <div className="toolbar command-filters" aria-label="Filtros de comandas">{filters.map(item => <button key={item.label} className={`btn${filter === item.label ? ' active' : ''}`} data-tone={item.tone} onClick={() => setFilter(item.label)}>{item.label}</button>)}</div>}
    {!loading && !error && <div className="list-tools"><label className="list-search"><span className="sr-only">Buscar comandas</span><input className="input" placeholder="Buscar por número, cliente, aparelho ou telefone" value={query} onChange={event => setQuery(event.target.value)} /></label>{view === 'list' && <label className="sort-control">Ordenar por <select className="select" value={sort} onChange={event => setSort(event.target.value)}><option value="recent">Mais recentes</option><option value="number">Número</option><option value="due">Prazo de entrega</option><option value="value">Valor</option></select></label>}</div>}

    {loading ? <div className="card loading-skeleton" role="status" aria-live="polite"><span /><span /><span /><span /></div> : error ? <div className="card empty error-state" role="alert"><p>{error}</p><button className="btn primary" onClick={load}>Tentar novamente</button></div> : rows.length === 0 ? <section className="panel module-empty-panel"><EmptyState icon="clipboard" title={query ? 'Nenhuma comanda encontrada' : filter === 'Todos' ? 'Nenhuma comanda aberta — registre um atendimento' : `Nenhuma comanda em “${filter}”`} description="Use a busca ou os filtros para localizar atendimentos. Cada comanda acompanha o reparo do início ao fim." actionLabel="Nova comanda" actionTo="/admin/comandas/nova" /></section> : view === 'list' ? (visibleRows.length === 0 ? <section className="panel module-empty-panel"><EmptyState icon="clipboard" title="Nenhuma comanda encontrada" description="Use a busca ou os filtros para localizar atendimentos." actionLabel="Nova comanda" actionTo="/admin/comandas/nova" /></section> : <><div className="table-wrap command-table-wrap"><table className="table command-table"><thead><tr><th>Nº</th><th>Cliente</th><th>Aparelho</th><th>Status</th><th>Prioridade</th><th>Prazo</th><th>Valor</th><th>Ações</th></tr></thead><tbody>{pageItems.map(row => { const overdue = row.estimated_due_date && row.estimated_due_date < new Date().toISOString().slice(0, 10) && !['delivered', 'cancelled'].includes(row.status); return <tr key={row.id} className={overdue ? 'is-overdue' : ''} onClick={() => window.location.assign(`/admin/comandas/${row.id}`)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); window.location.assign(`/admin/comandas/${row.id}`); } }} tabIndex={0}><td className="muted">#{row.number}</td><td>{row.customers?.full_name || '—'}<small className="table-secondary">{row.customers?.phone || ''}</small></td><td>{row.devices ? `${row.devices.brand} ${row.devices.model}` : '—'}</td><td><span className={`badge ${statusTone[row.status]}`}>{statusLabels[row.status]}</span>{overdue && <span className="badge red overdue-badge">Atrasada</span>}</td><td><span className={`priority-tag tone-${priorityTone[row.priority]}`}><i className="priority-dot" />{priorityLabels[row.priority]}</span></td><td>{row.estimated_due_date ? dateFmt(row.estimated_due_date) : '—'}</td><td>{row.final_amount ? currency(row.final_amount) : '—'}</td><td><Link className="btn" to={`/admin/comandas/${row.id}`} onClick={event => event.stopPropagation()}>Ver detalhes</Link></td></tr>; })}</tbody></table></div><Pagination page={page} pageCount={pageCount} onChange={setPage} totalLabel={`${visibleRows.length} ${visibleRows.length === 1 ? 'comanda' : 'comandas'}`} /></>)
      : <>
        {moveError && <div className="error" role="alert" style={{ marginBottom: 12 }}>{moveError}</div>}
        <p className="kanban-hint muted">Arraste um cartão para outra coluna ou use o seletor de status para mover uma comanda.</p>
        <div className="kanban-board">
          {statuses.map(status => {
            const items = kanbanRows.filter(row => row.status === status);
            return <div key={status} className={`kanban-column${dragOverStatus === status ? ' is-drop-target' : ''}`} onDragOver={event => { event.preventDefault(); setDragOverStatus(status); }} onDragLeave={() => setDragOverStatus(current => current === status ? '' : current)} onDrop={event => { event.preventDefault(); setDragOverStatus(''); if (dragId) moveCard(dragId, status); }}>
              <header className="kanban-column-header"><span className={`badge ${statusTone[status]}`}>{statusLabels[status]}</span><span className="kanban-count">{items.length}</span></header>
              <div className="kanban-column-body">
                {items.length === 0 ? <p className="kanban-empty muted">Nenhuma comanda</p> : items.map(row => <article key={row.id} draggable className={`kanban-card${movingId === row.id ? ' is-moving' : ''}`} onDragStart={() => setDragId(row.id)} onDragEnd={() => setDragId('')} onClick={() => window.location.assign(`/admin/comandas/${row.id}`)}>
                  <div className="kanban-card-top"><strong>#{row.number}</strong><span className={`priority-tag tone-${priorityTone[row.priority]}`}><i className="priority-dot" />{priorityLabels[row.priority]}</span></div>
                  <p className="kanban-card-customer">{row.customers?.full_name || 'Cliente não informado'}</p>
                  <p className="kanban-card-device muted">{row.devices ? `${row.devices.brand} ${row.devices.model}` : 'Aparelho não informado'}</p>
                  <div className="kanban-card-foot"><span className="muted">{row.estimated_due_date ? dateFmt(row.estimated_due_date) : 'Sem prazo'}</span><span>{row.final_amount ? currency(row.final_amount) : '—'}</span></div>
                  <label className="kanban-status-select-label"><span className="sr-only">Mover comanda #{row.number} para outro status</span><select className="select kanban-status-select" value={row.status} disabled={movingId === row.id} onClick={event => event.stopPropagation()} onChange={event => moveCard(row.id, event.target.value as WorkOrderStatus)}>{statuses.map(option => <option key={option} value={option}>{statusLabels[option]}</option>)}</select></label>
                </article>)}
              </div>
            </div>;
          })}
        </div>
      </>}
  </section>;
}
