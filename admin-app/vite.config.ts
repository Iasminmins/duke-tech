import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => ({
  plugins: [react()],
  // Em produção o build é publicado dentro de /admin (ver scripts/prepare-vercel.mjs),
  // mas em dev servimos da raiz para que a rota pública /acompanhar/:codigo
  // (fora do /admin) funcione sem precisar digitar o prefixo manualmente.
  base: command === 'build' ? '/admin/' : '/',
  test: {
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    globals: true,
  },
}));
