-- Contatos enviados pelo formulario do site institucional.
-- O site roda sem login (anon) e NAO tem acesso direto a tabela: a gravacao acontece apenas pela
-- funcao submit_site_lead (SECURITY DEFINER, mesmo padrao de get_public_store_profile), que valida
-- tamanho dos campos, descarta robos (campo isca) e limita a quantidade de envios por minuto.
-- Somente admin e employee leem e atualizam a tabela pelo painel.
create type public.site_lead_status as enum ('new', 'contacted', 'closed');

create table public.site_leads (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  phone text check (phone is null or char_length(phone) <= 30),
  subject text not null check (char_length(subject) between 2 and 80),
  message text not null check (char_length(message) between 3 and 2000),
  source text not null default 'site',
  status public.site_lead_status not null default 'new',
  handled_by uuid references public.profiles(id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create index site_leads_status_created_idx on public.site_leads(status, created_at desc);

create trigger site_leads_updated_at before update on public.site_leads for each row execute function public.set_updated_at();

alter table public.site_leads enable row level security;
create policy staff_site_leads on public.site_leads for all to authenticated
  using (public.current_user_role() in ('admin','employee'))
  with check (public.current_user_role() in ('admin','employee'));

create or replace function public.submit_site_lead(
  p_name text, p_phone text, p_subject text, p_message text, p_website text default null
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_name text := btrim(coalesce(p_name, ''));
  v_phone text := nullif(btrim(coalesce(p_phone, '')), '');
  v_subject text := btrim(coalesce(p_subject, ''));
  v_message text := btrim(coalesce(p_message, ''));
begin
  -- campo isca: humanos nao preenchem; descarta em silencio para nao ensinar o robo
  if coalesce(p_website, '') <> '' then return; end if;
  if char_length(v_name) not between 2 and 120
     or char_length(v_subject) not between 2 and 80
     or char_length(v_message) not between 3 and 2000
     or (v_phone is not null and char_length(v_phone) > 30) then
    raise exception 'invalid_lead';
  end if;
  -- limite simples contra abuso: no maximo 10 envios por minuto no total
  if (select count(*) from public.site_leads where created_at > now() - interval '1 minute') >= 10 then
    raise exception 'too_many_requests';
  end if;
  insert into public.site_leads(name, phone, subject, message) values (v_name, v_phone, v_subject, v_message);
end;
$$;
revoke all on function public.submit_site_lead(text, text, text, text, text) from public;
grant execute on function public.submit_site_lead(text, text, text, text, text) to anon, authenticated;
