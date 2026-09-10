import { FormEvent, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

export function LoginPage() {
  const { session, signIn } = useAuth(); const navigate = useNavigate();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  if (session) return <Navigate to="/admin" replace />;
  async function submit(event: FormEvent) { event.preventDefault(); setBusy(true); setError(''); const result = await signIn(email, password); setBusy(false); if (result.error) setError(result.error); else navigate('/admin'); }
  return <main className="login-page"><section className="login-card"><div className="brand"><div className="brand-mark">D</div><div><strong>Duke Tech</strong><small>Gestão de assistência</small></div></div><h1>Entrar no painel</h1><p>Acesse as operações da loja com segurança.</p>{error && <div className="error">{error}</div>}<form onSubmit={submit}><div className="field"><label htmlFor="email">E-mail</label><input id="email" className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email" /></div><div className="field"><label htmlFor="password">Senha</label><input id="password" className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} required autoComplete="current-password" /></div><button className="btn primary" disabled={busy}>{busy ? 'Entrando…' : 'Entrar'}</button></form><p className="muted" style={{fontSize:12,marginTop:24}}>Acesso restrito à equipe Duke Tech.</p></section></main>;
}
