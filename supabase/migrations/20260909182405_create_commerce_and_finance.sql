create type public.product_condition as enum ('new','used','refurbished');
create type public.stock_movement_type as enum ('entry','exit','adjustment');
create type public.payment_method as enum ('pix','cash','debit','credit','installments','other');

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default timezone('utc', now()),
  archived_at timestamptz
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id),
  name text not null,
  brand text,
  model text,
  color text,
  capacity text,
  condition public.product_condition not null default 'new',
  sale_price numeric(12,2) not null default 0 check (sale_price >= 0),
  cost_price numeric(12,2) not null default 0 check (cost_price >= 0),
  quantity integer not null default 0 check (quantity >= 0),
  minimum_stock integer not null default 0 check (minimum_stock >= 0),
  imei text,
  serial_number text,
  description text,
  is_featured boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  archived_at timestamptz
);
create index products_low_stock_idx on public.products(quantity, minimum_stock) where active = true and archived_at is null;

create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id),
  movement_type public.stock_movement_type not null,
  quantity integer not null check (quantity > 0),
  reason text not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default timezone('utc', now())
);

create table public.sales (
  id uuid primary key default gen_random_uuid(),
  number bigint generated always as identity unique,
  customer_id uuid references public.customers(id),
  subtotal numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  payment_method public.payment_method,
  cancelled_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default timezone('utc', now())
);

create table public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  total numeric(12,2) generated always as (quantity * unit_price) stored
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid references public.sales(id),
  work_order_id uuid references public.work_orders(id),
  amount numeric(12,2) not null check (amount > 0),
  payment_method public.payment_method not null,
  paid_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles(id)
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  description text not null,
  amount numeric(12,2) not null check (amount > 0),
  due_date date,
  paid_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default timezone('utc', now())
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  work_order_id uuid references public.work_orders(id),
  kind text not null,
  message text not null,
  channel text not null default 'whatsapp',
  sent_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default timezone('utc', now())
);

create table public.store_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default timezone('utc', now()),
  updated_by uuid references public.profiles(id)
);

create trigger products_updated_at before update on public.products for each row execute function public.set_updated_at();
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.stock_movements enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.payments enable row level security;
alter table public.expenses enable row level security;
alter table public.notifications enable row level security;
alter table public.store_settings enable row level security;

create policy staff_categories on public.categories for all to authenticated using (public.current_user_role() in ('admin','employee')) with check (public.current_user_role() in ('admin','employee'));
create policy staff_products on public.products for all to authenticated using (public.current_user_role() in ('admin','employee')) with check (public.current_user_role() in ('admin','employee'));
create policy staff_stock on public.stock_movements for all to authenticated using (public.current_user_role() in ('admin','employee')) with check (public.current_user_role() in ('admin','employee'));
create policy staff_sales on public.sales for all to authenticated using (public.current_user_role() in ('admin','employee')) with check (public.current_user_role() in ('admin','employee'));
create policy staff_sale_items on public.sale_items for all to authenticated using (public.current_user_role() in ('admin','employee')) with check (public.current_user_role() in ('admin','employee'));
create policy staff_payments on public.payments for all to authenticated using (public.current_user_role() in ('admin','employee')) with check (public.current_user_role() in ('admin','employee'));
create policy staff_expenses on public.expenses for all to authenticated using (public.current_user_role() = 'admin') with check (public.current_user_role() = 'admin');
create policy staff_notifications on public.notifications for all to authenticated using (public.current_user_role() in ('admin','employee')) with check (public.current_user_role() in ('admin','employee'));
create policy admin_settings on public.store_settings for all to authenticated using (public.current_user_role() = 'admin') with check (public.current_user_role() = 'admin');
