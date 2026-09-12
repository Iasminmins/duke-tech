-- A página pública de acompanhamento (/acompanhar/:codigo) roda sem sessão
-- (anon), e a tabela store_settings é restrita a admin (admin_settings policy).
-- Em vez de abrir RLS de store_settings para o público -- o que exporia
-- whatsapp_messages e privacy junto -- expomos só o necessário via uma
-- função SECURITY DEFINER, no mesmo padrão de get_public_work_order.
create or replace function public.get_public_store_profile()
returns table(company_name text, logo_url text)
language sql security definer set search_path = public as $$
  select value->>'companyName', value->>'logoUrl' from public.store_settings where key = 'store_profile';
$$;
revoke all on function public.get_public_store_profile() from public;
grant execute on function public.get_public_store_profile() to anon, authenticated;
