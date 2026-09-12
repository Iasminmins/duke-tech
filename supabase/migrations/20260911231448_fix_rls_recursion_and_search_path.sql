-- current_user_role() era SECURITY INVOKER e consultava public.profiles,
-- cuja própria política de SELECT chama current_user_role() -- gerando
-- recursão infinita (stack depth limit exceeded) em qualquer consulta que
-- dependa dessa função (praticamente todas as tabelas do sistema).
-- SECURITY DEFINER faz a função rodar com os privilégios do dono, ignorando
-- RLS apenas dentro dela, quebrando o ciclo sem abrir a tabela profiles.
create or replace function public.current_user_role()
returns public.user_role
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid() and active = true
$$;
revoke all on function public.current_user_role() from public;
revoke execute on function public.current_user_role() from anon;
grant execute on function public.current_user_role() to authenticated;

-- Correção do search_path mutável apontada pelo linter de segurança.
create or replace function public.set_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = timezone('utc', now()); return new; end; $$;
