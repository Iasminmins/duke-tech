import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type Profile = { id: string; full_name: string; role: 'admin' | 'employee' | 'technician'; active: boolean } | null;
type AuthContextValue = { session: Session | null; profile: Profile; loading: boolean; signIn: (email: string, password: string) => Promise<{ error?: string }>; signOut: () => Promise<void> };
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); if (!data.session) setLoading(false); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => { setSession(next); setLoading(Boolean(next)); });
    return () => listener.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!session || !supabase) { setProfile(null); setLoading(false); return; }
    supabase.from('profiles').select('id,full_name,role,active').eq('id', session.user.id).maybeSingle().then(({ data }) => { setProfile(data as Profile); setLoading(false); });
  }, [session]);
  const value = useMemo<AuthContextValue>(() => ({
    session, profile, loading,
    signIn: async (email, password) => {
      if (!supabase) return { error: 'Configure o Supabase em admin-app/.env.local.' };
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return error ? { error: 'E-mail ou senha inválidos.' } : {};
    },
    signOut: async () => { if (supabase) await supabase.auth.signOut(); setSession(null); setProfile(null); },
  }), [session, profile, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() { const value = useContext(AuthContext); if (!value) throw new Error('useAuth deve ser usado dentro de AuthProvider'); return value; }
