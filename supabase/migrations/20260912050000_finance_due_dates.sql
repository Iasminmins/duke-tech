-- Permite registrar uma entrada esperada (a receber) ainda não recebida:
-- paid_at deixa de ser obrigatório e ganha due_date, no mesmo padrão já usado
-- em expenses (due_date + paid_at). O status (pendente/pago/atrasado) é
-- derivado em runtime a partir dessas duas colunas, não armazenado.
alter table public.payments alter column paid_at drop not null;
alter table public.payments alter column paid_at drop default;
alter table public.payments add column due_date date;
