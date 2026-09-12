import { FormEvent, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { hasSupabase } from '../lib/env';

export function LoginPage() {
  const { session, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const redirectTo = (location.state as { from?: string } | null)?.from || '/admin';

  if (session) return <Navigate to={redirectTo} replace />;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return; // evita cliques duplicados enquanto a requisição está em andamento
    setBusy(true);
    setError('');
    const result = await signIn(email, password);
    setBusy(false);
    if (result.error) setError(result.error);
    else navigate(redirectTo, { replace: true });
  }

  return <main className="login-page"><section className="login-card">
    <div className="brand"><div className="brand-mark">D</div><div className="brand-copy"><strong>Duke Tech</strong><small>Gestão de assistência</small></div></div>
    <h1>Entrar no painel</h1>
    <p>Acesse as operações da loja com segurança.</p>
    {!hasSupabase && <div className="error" role="alert">Ambiente sem Supabase configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY em admin-app/.env.local.</div>}
    {error && <div className="error" role="alert">{error}</div>}
    <form onSubmit={submit} noValidate>
      <div className="field">
        <label htmlFor="email">E-mail</label>
        <input id="email" className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" autoFocus disabled={busy} />
      </div>
      <div className="field">
        <label htmlFor="password">Senha</label>
        <input id="password" className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" disabled={busy} />
      </div>
      <button className="btn primary" type="submit" disabled={busy} aria-busy={busy}>{busy ? 'Entrando…' : 'Entrar'}</button>
    </form>
    <p className="muted" style={{ fontSize: 12, marginTop: 24 }}>Acesso restrito à equipe Duke Tech.</p>
  </section></main>;
}
