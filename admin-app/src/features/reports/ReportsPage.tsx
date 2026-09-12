import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { statusLabels } from '../../components/ui/status';
import { BarChart } from '../../components/ui/charts/BarChart';
import { DonutChart, type DonutSlice } from '../../components/ui/charts/DonutChart';

const CATEGORY_PALETTE = ['var(--blue)', 'var(--violet)', 'var(--amber)', 'var(--green)', 'var(--red)', '#64748b'];
function toDonutSlices(entries: [string, number][], labelFor: (key: string) => string): DonutSlice[] {
  const sorted = [...entries].sort((a, b) => b[1] - a[1]);
  const head = sorted.slice(0, 5).map(([key, value], index) => ({ key, label: labelFor(key), value, color: CATEGORY_PALETTE[index] }));
  const rest = sorted.slice(5);
  if (rest.length) head.push({ key: '__other__', label: 'Outros', value: rest.reduce((sum, [, value]) => sum + value, 0), color: CATEGORY_PALETTE[5] });
  return head;
}

type Period = 'Hoje' | 'Últimos 7 dias' | 'Últimos 30 dias' | 'Este mês';
const periodDays: Record<Period, number> = { 'Hoje': 1, 'Últimos 7 dias': 7, 'Últimos 30 dias': 30, 'Este mês': 30 };
const startFor = (period: Period) => { const now = new Date(); if (period === 'Hoje') return new Date(now.getFullYear(), now.getMonth(), now.getDate()); if (period === 'Este mês') return new Date(now.getFullYear(), now.getMonth(), 1); const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()); start.setDate(start.getDate() - (period === 'Últimos 7 dias' ? 6 : 29)); return start; };
const money = (value: number) => Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const pct = (current: number, previous: number) => previous === 0 ? (current > 0 ? 100 : 0) : ((current - previous) / previous) * 100;
const dayLabel = (key: string) => new Date(`${key}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

export function ReportsPage() {
  const [data, setData] = useState<{ sales: any[]; orders: any[]; products: any[] }>({ sales: [], orders: [], products: [] });
  const [period, setPeriod] = useState<Period>('Últimos 30 dias');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusView, setStatusView] = useState<'bar' | 'pie'>('bar');

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    Promise.all([
      supabase.from('sales').select('id,total,created_at').is('cancelled_at', null),
      supabase.from('work_orders').select('id,status,created_at').is('archived_at', null),
      supabase.from('products').select('id,name,quantity,minimum_stock').eq('active', true).is('archived_at', null),
    ]).then(([sales, orders, products]) => {
      if (sales.error || orders.error || products.error) setError('Não foi possível carregar todos os relatórios.');
      setData({ sales: sales.data || [], orders: orders.data || [], products: products.data || [] });
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    const start = startFor(period).toISOString();
    return { sales: data.sales.filter(row => row.created_at >= start), orders: data.orders.filter(row => row.created_at >= start) };
  }, [data, period]);

  const previous = useMemo(() => {
    const start = startFor(period);
    const prevStart = new Date(start); prevStart.setDate(prevStart.getDate() - periodDays[period]);
    const prevStartIso = prevStart.toISOString(); const prevEndIso = start.toISOString();
    const sales = data.sales.filter(row => row.created_at >= prevStartIso && row.created_at < prevEndIso);
    const orders = data.orders.filter(row => row.created_at >= prevStartIso && row.created_at < prevEndIso);
    return { revenue: sales.reduce((sum, row) => sum + Number(row.total), 0), count: sales.length, orders: orders.length };
  }, [data, period]);

  const revenue = filtered.sales.reduce((sum, row) => sum + Number(row.total), 0);
  const average = filtered.sales.length ? revenue / filtered.sales.length : 0;
  const lowStock = data.products.filter(row => row.quantity <= row.minimum_stock);
  const statusCounts = filtered.orders.reduce<Record<string, number>>((acc, row) => { acc[row.status] = (acc[row.status] || 0) + 1; return acc; }, {});
  const maxStatusCount = Math.max(1, ...Object.values(statusCounts));

  const dailyRevenue = useMemo(() => {
    const map = new Map<string, number>();
    filtered.sales.forEach(row => { const key = row.created_at.slice(0, 10); map.set(key, (map.get(key) || 0) + Number(row.total)); });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([key, value]) => ({ label: dayLabel(key), values: { revenue: value } }));
  }, [filtered.sales]);

  const revenueTrend = pct(revenue, previous.revenue);
  const averageTrend = pct(average, previous.count ? previous.revenue / previous.count : 0);
  const ordersTrend = pct(filtered.orders.length, previous.orders);

  function exportCsv() {
    const header = 'Data,Valor\n';
    const rows = filtered.sales.map(row => `${new Date(row.created_at).toLocaleDateString('pt-BR')},${Number(row.total).toFixed(2)}`).join('\n');
    const blob = new Blob([`﻿${header}${rows}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = `relatorio-vendas-${period.toLowerCase().replace(/\s+/g, '-')}.csv`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return <section className="content">
    <div className="page-toolbar-top">
      <span className="page-toolbar-count">Indicadores de {period.toLowerCase()} · comparado ao período anterior</span>
      <div className="heading-actions">
        <select className="period-button" aria-label="Período dos relatórios" value={period} onChange={event => setPeriod(event.target.value as Period)}><option>Hoje</option><option>Últimos 7 dias</option><option>Últimos 30 dias</option><option>Este mês</option></select>
        <button type="button" className="btn" disabled={loading || !filtered.sales.length} onClick={exportCsv}>Exportar CSV</button>
      </div>
    </div>
    {error && <div className="error" role="alert">{error}</div>}
    <div className="module-overview">
      <article className="card module-stat"><span>Faturamento</span><strong>{loading ? '—' : money(revenue)}</strong>{!loading && <small className={`trend-line${revenueTrend < 0 ? ' is-negative' : ''}`}>{revenueTrend >= 0 ? '▲' : '▼'} {Math.abs(revenueTrend).toFixed(0)}% vs. período anterior</small>}</article>
      <article className="card module-stat"><span>Ticket médio</span><strong>{loading ? '—' : money(average)}</strong>{!loading && <small className={`trend-line${averageTrend < 0 ? ' is-negative' : ''}`}>{averageTrend >= 0 ? '▲' : '▼'} {Math.abs(averageTrend).toFixed(0)}% · {filtered.sales.length} venda(s)</small>}</article>
      <article className="card module-stat"><span>Comandas</span><strong>{loading ? '—' : filtered.orders.length}</strong>{!loading && <small className={`trend-line${ordersTrend < 0 ? ' is-negative' : ''}`}>{ordersTrend >= 0 ? '▲' : '▼'} {Math.abs(ordersTrend).toFixed(0)}% vs. período anterior</small>}</article>
      <article className={`card module-stat${lowStock.length ? ' tone-amber' : ''}`}><span>Estoque crítico</span><strong>{loading ? '—' : lowStock.length}</strong><small>Produtos abaixo do mínimo</small></article>
    </div>

    <section className="panel" style={{ marginTop: 16 }}>
      <header className="panel-header"><h3>Faturamento por dia</h3><span className="panel-total">{money(revenue)}</span></header>
      <BarChart data={dailyRevenue} series={[{ key: 'revenue', label: 'Faturamento', color: 'var(--blue)' }]} formatValue={money} emptyLabel="Nenhuma venda no período selecionado." />
    </section>

    <div className="dashboard-grid secondary-grid">
      <section className="panel">
        <header className="panel-header"><h3>Comandas por status</h3><div className="view-toggle chart-view-toggle" role="group" aria-label="Tipo de gráfico"><button type="button" className={`btn${statusView === 'bar' ? ' active' : ''}`} aria-pressed={statusView === 'bar'} onClick={() => setStatusView('bar')}>Barras</button><button type="button" className={`btn${statusView === 'pie' ? ' active' : ''}`} aria-pressed={statusView === 'pie'} onClick={() => setStatusView('pie')}>Pizza</button></div></header>
        {!Object.keys(statusCounts).length ? <div className="empty">Nenhuma comanda no período.</div> : statusView === 'bar' ? <div className="report-bars">{Object.entries(statusCounts).sort((a, b) => b[1] - a[1]).map(([status, count]) => <div className="report-bar-row" key={status}><span className="report-bar-label">{statusLabels[status] || status}</span><div className="report-bar-track"><div className="report-bar-fill" style={{ width: `${(count / maxStatusCount) * 100}%` }} /></div><strong className="report-bar-value">{count}</strong></div>)}</div> : <DonutChart data={toDonutSlices(Object.entries(statusCounts), status => statusLabels[status] || status)} />}
      </section>
      <section className="panel">
        <header className="panel-header"><h3>Produtos com estoque baixo</h3></header>
        {lowStock.length ? <div className="report-bars">{lowStock.map(product => <div className="report-bar-row" key={product.id}><span className="report-bar-label">{product.name}</span><div className="report-bar-track"><div className="report-bar-fill is-critical" style={{ width: `${Math.max(4, 100 - (product.quantity / Math.max(product.minimum_stock, 1)) * 100)}%` }} /></div><strong className="report-bar-value">{product.quantity}</strong></div>)}</div> : <div className="empty">Nenhum alerta de estoque.</div>}
      </section>
    </div>
  </section>;
}
