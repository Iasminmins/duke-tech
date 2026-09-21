export type Theme = 'light' | 'dark';
export const themeStorageKey = 'duke-tech-theme';

/** Escolha manual salva vence; sem escolha, o padrao e o tema claro (o escuro continua disponivel no botao de tema). */
export function getInitialTheme(saved: string | null): Theme {
  if (saved === 'light' || saved === 'dark') return saved;
  return 'light';
}

export function readInitialTheme(): Theme {
  let saved: string | null = null;
  try { saved = typeof window !== 'undefined' ? window.localStorage.getItem(themeStorageKey) : null; } catch { saved = null; }
  return getInitialTheme(saved);
}
