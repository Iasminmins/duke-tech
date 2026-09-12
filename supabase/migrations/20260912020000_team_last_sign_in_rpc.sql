-- A tela "Usuários e permissões" precisa mostrar o último acesso de cada
-- membro da equipe. auth.users não é exposto via PostgREST e não deve ser
-- lido diretamente pelo cliente, então expomos só o necessário (id e
-- last_sign_in_at -- nunca e-mail, senha ou metadados) via uma função
-- SECURITY DEFINER, no mesmo padrão de current_user_role() e
-- get_public_store_profile(). A checagem de admin fica dentro da própria
-- função: quem não for admin recebe zero linhas, sem erro.
create or replace function public.get_team_last_sign_in()
returns table(id uuid, last_sign_in_at timestamptz)
language sql stable security definer set search_path = public as $$
  select u.id, u.last_sign_in_at
  from auth.users u
  join public.profiles p on p.id = u.id
  where public.current_user_role() = 'admin'
$$;
revoke all on function public.get_team_last_sign_in() from public;
revoke execute on function public.get_team_last_sign_in() from anon;
grant execute on function public.get_team_last_sign_in() to authenticated;
