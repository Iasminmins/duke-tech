# Duke Tech Gestão Finalização Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finalizar a área administrativa da Duke Tech Gestão com dados reais, fluxos de criação/edição funcionais, navegação consistente, busca, acessibilidade e responsividade, sem alterar o `index.html` principal.

**Architecture:** Reutilizar o Supabase como fonte única de verdade. Cada módulo terá uma página responsável por carregar, validar e atualizar seus dados, enquanto componentes compartilhados cuidarão de formulários, feedback, busca global, estados vazios e navegação. A Agenda continuará baseada na previsão de entrega das comandas existentes.

**Tech Stack:** React, TypeScript, Vite, React Router, Supabase, Zod, Vitest, CSS existente da área `admin-app`.

**Spec:** Briefing anexado pelo usuário em `C:\Users\letic\.codex\attachments\bcf6f91e-e35f-48a6-840c-92929d837249\pasted-text.txt`.

## Global Constraints

- Alterar somente a aplicação administrativa em `admin-app` e documentação/testes associados.
- Não modificar o `index.html` principal.
- Não criar dados mockados onde existam dados reais no Supabase.
- Preservar todas as rotas atuais e a identidade visual atual.
- Toda ação de criação/edição deve abrir e concluir um fluxo real.
- Todo estado de loading, erro, vazio e sucesso deve ser visível e acessível.

### Task 1: Fonte única e detalhe de comanda

**Files:**
- Modify: `admin-app/src/features/work-orders/workOrderRepository.ts`
- Modify: `admin-app/src/features/work-orders/WorkOrderDetailPage.tsx`
- Modify: `admin-app/src/features/work-orders/WorkOrdersPage.tsx`
- Modify: `admin-app/src/features/agenda/AgendaPage.tsx`
- Test: `admin-app/tests/work-order-detail.test.ts`

- [ ] Escrever testes para o mapeamento de uma comanda carregada, estado 404 e padrão de identificação `#<number>`.
- [ ] Carregar no detalhe cliente, telefone, aparelho, problema, status, prioridade, datas, orçamento, observações e histórico em uma única consulta/repositório.
- [ ] Remover UUID da apresentação e usar links internos por `id`, exibindo sempre número da comanda.
- [ ] Adicionar estado 404 com link para `/admin/comandas`.
- [ ] Validar todos os links da Agenda, dashboard e listagem contra o mesmo `id`.

### Task 2: Componentes compartilhados de formulário, feedback e CTAs

**Files:**
- Create: `admin-app/src/components/ui/Feedback.tsx`
- Create: `admin-app/src/components/ui/FormField.tsx`
- Modify: `admin-app/src/pages/ModulePage.tsx`
- Modify: `admin-app/src/styles/admin-fixes.css`
- Test: `admin-app/tests/cta-routing.test.tsx`

- [ ] Criar helpers de sucesso/erro com `role=status`/`role=alert`, labels e `aria-describedby`.
- [ ] Padronizar estado de envio, cancelamento e mensagens inline.
- [ ] Fazer CTAs de Clientes, Aparelhos e Produtos abrirem o formulário real.
- [ ] Substituir CTAs de módulos vazios por callbacks/rotas de criação reais.
- [ ] Cobrir por teste os destinos e a abertura dos fluxos.

### Task 3: Produtos, estoque e vendas

**Files:**
- Create: `admin-app/src/features/commerce/StockMovementForm.tsx`
- Create: `admin-app/src/features/commerce/SalesPage.tsx`
- Create: `admin-app/src/features/commerce/commerceUtils.ts`
- Modify: `admin-app/src/features/commerce/ProductsPage.tsx`
- Modify: `admin-app/src/app/App.tsx`
- Test: `admin-app/tests/product-actions.test.tsx`
- Test: `admin-app/tests/stock-movement.test.ts`
- Test: `admin-app/tests/sales-flow.test.tsx`

- [ ] Implementar menu `...` com editar, ajustar estoque, desativar e excluir com confirmação.
- [ ] Implementar entrada, saída e ajuste usando `stock_movements`, atualizando quantidade e alertas reais.
- [ ] Criar venda com cliente opcional, produtos/serviços, pagamento e status usando tabelas existentes.
- [ ] Fazer `Nova venda`, `Registrar primeira venda` e `Entrada de estoque` abrirem o fluxo correto.
- [ ] Diferenciar ativo, baixo, zerado e inativo.

### Task 4: Financeiro, usuários e configurações

**Files:**
- Create: `admin-app/src/features/finance/FinanceForm.tsx`
- Create: `admin-app/src/features/users/UsersPage.tsx`
- Create: `admin-app/src/features/settings/SettingsPage.tsx`
- Modify: `admin-app/src/app/App.tsx`
- Modify: `admin-app/src/pages/ModulePage.tsx`
- Test: `admin-app/tests/finance-flow.test.tsx`
- Test: `admin-app/tests/users-settings.test.tsx`

- [ ] Implementar entrada/saída financeira, categoria, valor, data e observação em `expenses`/estruturas existentes.
- [ ] Implementar criação, edição, desativação e permissões de usuários respeitando o último administrador.
- [ ] Implementar carregamento e salvamento de dados reais de `store_settings`.
- [ ] Fazer os CTAs de financeiro, usuários e configurações abrirem os formulários no próprio módulo.

### Task 5: Busca global e dashboard baseada em dados

**Files:**
- Create: `admin-app/src/components/search/GlobalSearch.tsx`
- Create: `admin-app/src/features/dashboard/dashboardRepository.ts`
- Modify: `admin-app/src/pages/AdminLayout.tsx`
- Modify: `admin-app/src/pages/DashboardPage.tsx`
- Test: `admin-app/tests/global-search.test.tsx`
- Test: `admin-app/tests/dashboard-data.test.ts`

- [ ] Buscar clientes, comandas, aparelhos e produtos por nome, telefone, aparelho e número.
- [ ] Exibir dropdown com categoria, loading, vazio, erro e Enter para abrir o resultado.
- [ ] Substituir números divergentes do dashboard por consultas/agregações reais.
- [ ] Implementar Hoje, 7 dias, 30 dias e Este mês com os mesmos dados das listagens.
- [ ] Corrigir links de alertas e CTAs de venda/estoque.

### Task 6: Agenda, acessibilidade e responsividade

**Files:**
- Modify: `admin-app/src/features/agenda/AgendaPage.tsx`
- Modify: `admin-app/src/pages/AdminLayout.tsx`
- Modify: `admin-app/src/styles/tokens.css`
- Modify: `admin-app/src/styles/admin-enhancements.css`
- Modify: `admin-app/src/styles/admin-fixes.css`
- Test: `admin-app/tests/agenda-flow.test.tsx`
- Test: `admin-app/tests/responsive-a11y.test.tsx`

- [ ] Associar erros da Agenda aos campos, validar data passada, anunciar sucesso e sincronizar lista/cards.
- [ ] Corrigir nomes acessíveis, foco ao abrir/fechar formulários e menus e `aria-expanded`.
- [ ] Implementar drawer mobile, rolagem de tabelas, formulário em uma coluna e dropdowns dentro da viewport.
- [ ] Testar rotas em 1440px, 768px e 390px.

### Task 7: Revisão completa e entrega

**Files:**
- Modify: `docs/design/duke-tech-theme-tokens.md` se necessário.
- Test: suíte completa de `admin-app/tests`.

- [ ] Executar testes unitários, build e revisão de cada rota.
- [ ] Conferir console, links, CTAs, teclado, loading, erro, vazio e sucesso.
- [ ] Rebuild do container `duke-tech-admin` e validação no navegador em `/admin` e nas rotas principais.
- [ ] Registrar bloqueios restantes explicitamente, sem afirmar suporte que não foi verificado.
