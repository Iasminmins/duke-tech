create extension if not exists pgcrypto;

create type public.user_role as enum ('admin', 'employee', 'technician');
create type public.work_order_status as enum ('received', 'diagnosis', 'quote_sent', 'awaiting_approval', 'approved', 'rejected', 'awaiting_part', 'repair', 'testing', 'ready', 'delivered', 'cancelled');
create type public.work_order_priority as enum ('normal', 'high', 'urgent');
create type public.photo_category as enum ('entry', 'damage', 'diagnosis', 'repair', 'final');

create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = timezone('utc', now()); return new; end; $$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role public.user_role not null default 'employee',
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (length(trim(full_name)) >= 3),
  phone text not null,
  phone_normalized text generated always as (regexp_replace(phone, '[^0-9]', '', 'g')) stored,
  whatsapp text,
  email text,
  cpf text,
  address text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  archived_at timestamptz
);
create unique index customers_phone_normalized_unique on public.customers(phone_normalized) where archived_at is null;

create table public.devices (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id),
  brand text not null,
  model text not null,
  color text,
  imei text,
  serial_number text,
  access_password text,
  physical_condition text,
  received_accessories text,
  reported_problem text not null,
  notes text,
  received_at timestamptz not null default timezone('utc', now()),
  pickup_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  archived_at timestamptz
);

create table public.work_orders (
  id uuid primary key default gen_random_uuid(),
  number bigint generated always as identity unique,
  public_code text not null unique default encode(gen_random_bytes(12), 'hex'),
  customer_id uuid not null references public.customers(id),
  device_id uuid not null references public.devices(id),
  technician_id uuid references public.profiles(id),
  service_requested text not null,
  diagnosis text,
  quote numeric(12,2) not null default 0 check (quote >= 0),
  discount numeric(12,2) not null default 0 check (discount >= 0),
  final_amount numeric(12,2) generated always as (greatest(quote - discount, 0)) stored,
  status public.work_order_status not null default 'received',
  priority public.work_order_priority not null default 'normal',
  estimated_due_date date,
  internal_notes text,
  public_message text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  archived_at timestamptz
);
create index work_orders_status_idx on public.work_orders(status) where archived_at is null;
create index work_orders_customer_idx on public.work_orders(customer_id);

create table public.work_order_status_history (
  id uuid primary key default gen_random_uuid(),
  work_order_id uuid not null references public.work_orders(id) on delete cascade,
  status public.work_order_status not null,
  note text,
  changed_by uuid references public.profiles(id),
  created_at timestamptz not null default timezone('utc', now())
);

create table public.work_order_photos (
  id uuid primary key default gen_random_uuid(),
  work_order_id uuid not null references public.work_orders(id) on delete cascade,
  storage_path text not null,
  category public.photo_category not null,
  is_public boolean not null default false,
  uploaded_by uuid references public.profiles(id),
  created_at timestamptz not null default timezone('utc', now()),
  archived_at timestamptz
);

create or replace function public.change_work_order_status(p_work_order_id uuid, p_status public.work_order_status, p_note text default null)
returns public.work_orders language plpgsql security invoker set search_path = public as $$
declare updated_order public.work_orders;
begin
  update public.work_orders set status = p_status, updated_at = timezone('utc', now()) where id = p_work_order_id and archived_at is null returning * into updated_order;
  if updated_order.id is null then raise exception 'work order not found'; end if;
  insert into public.work_order_status_history(work_order_id,status,note,changed_by) values (p_work_order_id,p_status,p_note,auth.uid());
  return updated_order;
end; $$;

create or replace function public.get_public_work_order(p_code text)
returns table(number bigint, public_code text, model text, brand text, status public.work_order_status, estimated_due_date date, public_message text, updated_at timestamptz, photos jsonb)
language sql security definer set search_path = public as $$
  select w.number, w.public_code, d.model, d.brand, w.status, w.estimated_due_date, w.public_message, w.updated_at,
    coalesce((select jsonb_agg(jsonb_build_object('path', p.storage_path, 'category', p.category)) from public.work_order_photos p where p.work_order_id = w.id and p.is_public = true and p.archived_at is null), '[]'::jsonb)
  from public.work_orders w join public.devices d on d.id = w.device_id
  where w.public_code = p_code and w.archived_at is null and length(p_code) >= 16;
$$;
revoke all on function public.get_public_work_order(text) from public;
grant execute on function public.get_public_work_order(text) to anon, authenticated;

create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger customers_updated_at before update on public.customers for each row execute function public.set_updated_at();
create trigger devices_updated_at before update on public.devices for each row execute function public.set_updated_at();
create trigger work_orders_updated_at before update on public.work_orders for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.devices enable row level security;
alter table public.work_orders enable row level security;
alter table public.work_order_status_history enable row level security;
alter table public.work_order_photos enable row level security;

create or replace function public.current_user_role() returns public.user_role language sql stable security invoker set search_path = public as $$ select role from public.profiles where id = auth.uid() and active = true $$;

create policy profiles_self_read on public.profiles for select to authenticated using (id = auth.uid() or public.current_user_role() = 'admin');
create policy staff_customers_read on public.customers for select to authenticated using (public.current_user_role() in ('admin','employee','technician'));
create policy staff_customers_write on public.customers for all to authenticated using (public.current_user_role() in ('admin','employee')) with check (public.current_user_role() in ('admin','employee'));
create policy staff_devices_read on public.devices for select to authenticated using (public.current_user_role() in ('admin','employee','technician'));
create policy staff_devices_write on public.devices for all to authenticated using (public.current_user_role() in ('admin','employee')) with check (public.current_user_role() in ('admin','employee'));
create policy staff_orders_read on public.work_orders for select to authenticated using (public.current_user_role() in ('admin','employee') or (public.current_user_role() = 'technician' and technician_id = auth.uid()));
create policy staff_orders_write on public.work_orders for all to authenticated using (public.current_user_role() in ('admin','employee') or (public.current_user_role() = 'technician' and technician_id = auth.uid())) with check (public.current_user_role() in ('admin','employee') or (public.current_user_role() = 'technician' and technician_id = auth.uid()));
create policy staff_history_read on public.work_order_status_history for select to authenticated using (public.current_user_role() in ('admin','employee','technician'));
create policy staff_history_write on public.work_order_status_history for insert to authenticated with check (public.current_user_role() in ('admin','employee','technician'));
create policy staff_photos_read on public.work_order_photos for select to authenticated using (public.current_user_role() in ('admin','employee','technician'));
create policy staff_photos_write on public.work_order_photos for all to authenticated using (public.current_user_role() in ('admin','employee','technician')) with check (public.current_user_role() in ('admin','employee','technician'));

insert into storage.buckets (id, name, public) values ('work-order-photos', 'work-order-photos', false) on conflict (id) do nothing;
