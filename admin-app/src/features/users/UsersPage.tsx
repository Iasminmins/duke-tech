import { FormEvent, useEffect, useState } from 'react';
import { useToast } from '../../components/ui/ToastProvider';
import { supabase } from '../../lib/supabase';
import { canDeactivateProfile, canManageUsers, permissionsByRole, roleLabels, type Role } from './userUtils';

type Profile = { id: string; full_name: string; role: Role; active: boolean; created_at: string };
const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase() || '').join('') || '?';
const lastAccessLabel = (value: string | null | undefined) => value ? new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : 'Nunca acessou';

export function UsersPage() {
  const toast = useToast();
  const [rows, setRows] = useState<Profile[]>([]);
  const [lastSignIn, setLastSignIn] = useState<Record<string, string | null>>({});
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('employee');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    if (!supabase) { setLoading(false); return; }
    const [result, accessResult] = await Promise.all([
      supabase.from('profiles').select('id,full_name,role,active,created_at').order('created_at'),
      supabase.rpc('get_team_last_sign_in'),
    ]);
    if (result.error) setError('Não foi possível carregar a equipe.');
    setRows((result.data || []) as Profile[]);
    if (accessResult.data) setLastSignIn(Object.fromEntries((accessResult.data as { id: string; last_sign_in_at: string | null }[]).map(row => [row.id, row.last_sign_in_at])));
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  async function submit(e: FormEvent) {
    e.preventDefault(); if (!supabase || !name.trim()) { setError('Informe o nome do membro.'); return; }
    setError('');
    const result = await supabase.from('profiles').insert({ full_name: name.trim(), role, active: true }).select('id,full_name,role,active,created_at').single();
    if (result.error || !result.data) { setError('O perfil precisa estar vinculado a um usuário autenticado antes do cadastro.'); return; }
    setRows(prev => [...prev, result.data as Profile]); setName(''); setRole('employee'); setOpen(false); toast.success('Perfil salvo.');
  }

  async function toggle(row: Profile) {
    if (!supabase) return;
    const admins = rows.filter(item => item.active && item.role === 'admin').length;
    if (row.active && !canDeactivateProfile({ actorRole: 'admin', targetRole: row.role, activeAdmins: admins })) { setError('O último administrador não pode ser desativado.'); return; }
    const result = await supabase.from('profiles').update({ active: !row.active }).eq('id', row.id);
    if (result.error) setError('Não foi possível atualizar o acesso.'); else setRows(prev => prev.map(item => item.id === row.id ? { ...item, active: !item.active } : item));
  }

  const activeCount = rows.filter(row => row.active).length;
  const recentlyActive = rows.filter(row => { const value = lastSignIn[row.id]; if (!value) return false; return Date.now() - new Date(value).getTime() < 7 * 24 * 60 * 60 * 1000; }).length;

  return <section className="content">
    <div className="page-toolbar-top"><span className="page-toolbar-count">{!loading ? `${rows.length} ${rows.length === 1 ? 'membro' : 'membros'}` : ''}</span>{canManageUsers('admin') && <button className="btn primary" onClick={() => setOpen(!open)}>+ Adicionar membro</button>}</div>
    {error && <div className="error" role="alert">{error}</div>}
    {!loading && <div className="module-overview">
      <article className="card module-stat"><span>Equipe cadastrada</span><strong>{rows.length}</strong><small>Perfis no painel</small></article>
      <article className="card module-stat"><span>Acessos ativos</span><strong>{activeCount}</strong><small>Podem entrar no painel</small></article>
      <article className="card module-stat"><span>Ativos nos últimos 7 dias</span><strong>{recentlyActive}</strong><small>Com acesso recente</small></article>
    </div>}
    {open && <form className="form-card" onSubmit={submit}><h3>Novo perfil</h3><div className="form-grid"><div className="field"><label htmlFor="user-name">Nome completo</label><input id="user-name" className="input" value={name} onChange={e => setName(e.target.value)} required /></div><div className="field"><label htmlFor="user-role">Papel</label><select id="user-role" className="select" value={role} onChange={e => setRole(e.target.value as Role)}>{Object.entries(roleLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div></div><div className="actions"><button type="button" className="btn" onClick={() => setOpen(false)}>Cancelar</button><button className="btn primary">Salvar perfil</button></div></form>}
    <section className="panel"><header className="panel-header"><h3>Equipe cadastrada</h3></header>{loading ? <div className="empty">Carregando equipe…</div> : rows.length ? <div className="table-wrap"><table className="table"><thead><tr><th>Nome</th><th>Papel</th><th>Permissões</th><th>Último acesso</th><th>Status</th><th>Ação</th></tr></thead><tbody>{rows.map(row => <tr key={row.id}><td><div className="customer-cell"><span className="avatar customer-avatar">{initials(row.full_name)}</span><strong>{row.full_name}</strong></div></td><td><span className="badge blue">{roleLabels[row.role]}</span></td><td>{permissionsByRole[row.role].length} seções</td><td className="muted">{lastAccessLabel(lastSignIn[row.id])}</td><td><span className={`priority-tag tone-${row.active ? 'green' : 'red'}`}><i className="priority-dot" />{row.active ? 'Ativo' : 'Inativo'}</span></td><td><button className="btn" onClick={() => void toggle(row)}>{row.active ? 'Desativar' : 'Ativar'}</button></td></tr>)}</tbody></table></div> : <div className="empty">Nenhum membro cadastrado.</div>}</section>
  </section>;
}
