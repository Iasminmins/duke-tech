export type Theme = 'light' | 'dark';
export const themeStorageKey = 'duke-tech-theme';

export function getInitialTheme(saved: string | null, systemPrefersDark: boolean): Theme {
  if (saved === 'light' || saved === 'dark') return saved;
  return systemPrefersDark ? 'dark' : 'light';
}

export function readInitialTheme(): Theme {
  const saved = typeof window !== 'undefined' ? window.localStorage.getItem(themeStorageKey) : null;
  const prefersDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  return getInitialTheme(saved, prefersDark);
}
