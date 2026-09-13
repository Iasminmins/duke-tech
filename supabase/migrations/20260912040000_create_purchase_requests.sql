-- Registro interno de intenção de compra para reposição de estoque.
-- Sem integração externa por enquanto: só documenta fornecedor, quantidade e
-- data prevista para não depender apenas do alerta visual de estoque baixo.
create type public.purchase_request_status as enum ('pending', 'received', 'cancelled');

create table public.purchase_requests (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id),
  supplier_name text not null,
  quantity integer not null check (quantity > 0),
  expected_date date,
  note text,
  status public.purchase_request_status not null default 'pending',
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create index purchase_requests_product_idx on public.purchase_requests(product_id);
create index purchase_requests_status_idx on public.purchase_requests(status);

create trigger purchase_requests_updated_at before update on public.purchase_requests for each row execute function public.set_updated_at();

alter table public.purchase_requests enable row level security;
create policy staff_purchase_requests on public.purchase_requests for all to authenticated using (public.current_user_role() in ('admin','employee')) with check (public.current_user_role() in ('admin','employee'));
