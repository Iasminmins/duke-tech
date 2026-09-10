import { getInitialTheme, type Theme } from '../src/theme/theme';

test('prefers the saved theme over the operating system preference', () => {
  expect(getInitialTheme('light', true)).toBe('light');
  expect(getInitialTheme(null, false)).toBe('light');
  expect(getInitialTheme(null, true)).toBe('dark');
});
