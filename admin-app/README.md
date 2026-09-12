# Duke Tech Gestão

Aplicação administrativa separada da landing page original. O arquivo raiz `../index.html` não deve ser alterado.

## Desenvolvimento

1. Copie `.env.example` para `.env.local`.
2. Preencha `VITE_SUPABASE_ANON_KEY` com a chave publishable do projeto Duke Tech Gestão.
3. Execute `npm install` e `npm run dev`.

## Rotas

- `/admin/login`: autenticação da equipe.
- `/admin`: painel protegido.
- `/admin/clientes`: clientes.
- `/admin/aparelhos`: aparelhos.
- `/admin/comandas`: assistência.
- `/acompanhar/:codigo`: acompanhamento público sem login.

## Banco

A migração em `../supabase/migrations/20260909180059_create_duke_tech_core.sql` cria o núcleo de clientes, aparelhos, comandas, fotos, histórico e RLS. Ela deve ser aplicada ao projeto `xhyfzgxpouyeroaedeco` antes do uso.

Não coloque chaves secretas ou `service_role` no frontend.

## Docker

Na raiz do repositório, configure `VITE_SUPABASE_ANON_KEY` e execute:

```powershell
docker compose -f docker-compose.duke-tech.yml up --build -d
```

O painel ficará disponível em `http://localhost:5174/admin/login` e o health check em `http://localhost:5174/health`. O compose usa uma porta própria e não toca no stack Supabase local já existente.
# Duke Tech Gestão

Painel administrativo da Duke Tech, construído com Vite, React, TypeScript e Supabase.

## Desenvolvimento

```bash
npm install
npm run dev
```

Configure `admin-app/.env.local` com `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`. Use apenas a chave publishable/anon no navegador; nunca coloque uma service role key no bundle.

## Produção

```bash
npm test
npm run build
```

O diretório `admin-app` deve ser configurado como Root Directory no projeto Vercel. O banco usado é o projeto Supabase `xhyfzgxpouyeroaedeco`.
