-- Expõe o horário de funcionamento (business_hours) na mesma função pública
-- (SECURITY DEFINER) já usada para nome/logo, para exibir na página de
-- acompanhamento sem abrir RLS de store_settings inteira para o anon.
drop function if exists public.get_public_store_profile();

create or replace function public.get_public_store_profile()
returns table(company_name text, logo_url text, business_hours jsonb)
language sql security definer set search_path = public as $$
  select
    (select value->>'companyName' from public.store_settings where key = 'store_profile'),
    (select value->>'logoUrl' from public.store_settings where key = 'store_profile'),
    (select value from public.store_settings where key = 'business_hours');
$$;
revoke all on function public.get_public_store_profile() from public;
grant execute on function public.get_public_store_profile() to anon, authenticated;
