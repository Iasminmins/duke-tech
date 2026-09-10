import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { readInitialTheme, themeStorageKey, type Theme } from './theme';

type ThemeContextValue = { theme: Theme; toggleTheme: () => void };
const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(readInitialTheme);
  useEffect(() => { document.documentElement.dataset.theme = theme; window.localStorage.setItem(themeStorageKey, theme); }, [theme]);
  const value = useMemo(() => ({ theme, toggleTheme: () => setTheme(current => current === 'dark' ? 'light' : 'dark') }), [theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
export function useTheme() { const value = useContext(ThemeContext); if (!value) throw new Error('useTheme deve ser usado dentro de ThemeProvider'); return value; }
