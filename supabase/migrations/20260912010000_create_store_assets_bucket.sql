-- Bucket público para identidade visual da loja (logo), diferente do
-- bucket 'work-order-photos' (privado, fotos de comandas). O logo precisa
-- ser público porque aparece na página de acompanhamento sem autenticação
-- (/acompanhar/:codigo) e pode ser referenciado em mensagens de WhatsApp.
insert into storage.buckets (id, name, public) values ('store-assets', 'store-assets', true)
on conflict (id) do nothing;

-- Leitura pública (sem policy de RLS aqui, é o próprio bucket público que
-- libera select para anon/authenticated via storage.objects).
create policy store_assets_public_read on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'store-assets');

-- Só admin pode enviar/trocar/remover o logo.
create policy store_assets_admin_write on storage.objects
  for insert to authenticated
  with check (bucket_id = 'store-assets' and public.current_user_role() = 'admin');

create policy store_assets_admin_update on storage.objects
  for update to authenticated
  using (bucket_id = 'store-assets' and public.current_user_role() = 'admin')
  with check (bucket_id = 'store-assets' and public.current_user_role() = 'admin');

create policy store_assets_admin_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'store-assets' and public.current_user_role() = 'admin');
