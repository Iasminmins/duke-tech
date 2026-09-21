import { getInitialTheme } from '../src/theme/theme';

test('a escolha salva vence; sem escolha o tema padrao e o claro', () => {
  expect(getInitialTheme('light')).toBe('light');
  expect(getInitialTheme('dark')).toBe('dark');
  expect(getInitialTheme(null)).toBe('light');
  expect(getInitialTheme('valor-invalido')).toBe('light');
});
