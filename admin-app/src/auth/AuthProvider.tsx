import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { withTimeout, TimeoutError } from '../lib/withTimeout';

type Profile = { id: string; full_name: string; role: 'admin' | 'employee' | 'technician'; active: boolean } | null;
type AuthStatus = 'loading' | 'ready' | 'error';

type AuthContextValue = {
  session: Session | null;
  profile: Profile;
  status: AuthStatus;
  /** @deprecated use `status === 'loading'` */
  loading: boolean;
  error: string;
  retry: () => void;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const SESSION_TIMEOUT_MS = 12000;
const FRIENDLY_TIMEOUT_MESSAGE = 'Não foi possível confirmar sua sessão a tempo. Verifique sua conexão e tente novamente.';
const FRIENDLY_ERROR_MESSAGE = 'Não foi possível validar sua sessão. Tente novamente.';

async function fetchProfile(userId: string): Promise<Profile> {
  if (!supabase) return null;
  try {
    const { data } = await withTimeout(
      supabase.from('profiles').select('id,full_name,role,active').eq('id', userId).maybeSingle(),
      SESSION_TIMEOUT_MS,
    );
    return (data as Profile) ?? null;
  } catch {
    // A perfil não carregar não deve travar a aplicação: seguimos sem o
    // perfil (o que degrada permissões, mas nunca prende a tela).
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [error, setError] = useState('');
  // Garante que a checagem inicial de sessão só roda uma vez, mesmo em
  // StrictMode (que monta os efeitos duas vezes em desenvolvimento).
  const initialized = useRef(false);

  const bootstrap = useCallback(async () => {
    setStatus('loading');
    setError('');
    if (!supabase) {
      // Sem Supabase configurado, a aplicação segue para a tela de login
      // (que exibirá a orientação de configuração) em vez de travar.
      setSession(null);
      setProfile(null);
      setStatus('ready');
      return;
    }
    try {
      const { data, error: sessionError } = await withTimeout(supabase.auth.getSession(), SESSION_TIMEOUT_MS);
      if (sessionError) throw sessionError;
      const nextSession = data.session ?? null;
      setSession(nextSession);
      if (nextSession) {
        setProfile(await fetchProfile(nextSession.user.id));
      } else {
        setProfile(null);
      }
      setStatus('ready');
    } catch (err) {
      setSession(null);
      setProfile(null);
      setStatus('error');
      setError(err instanceof TimeoutError ? FRIENDLY_TIMEOUT_MESSAGE : FRIENDLY_ERROR_MESSAGE);
    }
  }, []);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    void bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    if (!supabase) return;
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      // Nunca volta a tela inteira para "carregando": apenas atualiza sessão
      // e perfil em segundo plano, evitando piscadas e loops de redirect.
      setSession(nextSession);
      setStatus('ready');
      setError('');
      if (nextSession) {
        void fetchProfile(nextSession.user.id).then(setProfile);
      } else {
        setProfile(null);
      }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    session,
    profile,
    status,
    loading: status === 'loading',
    error,
    retry: () => { void bootstrap(); },
    signIn: async (email, password) => {
      if (!supabase) return { error: 'Configure o Supabase em admin-app/.env.local.' };
      try {
        const { error: signInError } = await withTimeout(supabase.auth.signInWithPassword({ email, password }), SESSION_TIMEOUT_MS);
        return signInError ? { error: 'E-mail ou senha inválidos.' } : {};
      } catch (err) {
        return { error: err instanceof TimeoutError ? FRIENDLY_TIMEOUT_MESSAGE : 'Não foi possível entrar. Tente novamente.' };
      }
    },
    signOut: async () => {
      if (supabase) {
        try { await withTimeout(supabase.auth.signOut(), SESSION_TIMEOUT_MS); }
        catch { /* mesmo se a chamada de rede falhar, limpamos a sessão local abaixo */ }
      }
      // Limpeza local garantida: o usuário nunca fica "preso" logado por
      // causa de uma falha de rede no signOut.
      setSession(null);
      setProfile(null);
      setStatus('ready');
      setError('');
    },
  }), [session, profile, status, error, bootstrap]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return value;
}
