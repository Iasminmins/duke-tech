-- Registro atômico de vendas imediatas e a prazo.
alter table public.sales add column customer_name text;

create or replace function public.create_sale(
  p_product_id uuid,
  p_quantity integer,
  p_customer_id uuid default null,
  p_payment_method public.payment_method default null,
  p_customer_name text default null,
  p_due_date date default null
)
returns table (
  id uuid,
  number bigint,
  total numeric,
  payment_method public.payment_method,
  created_at timestamptz,
  customer_id uuid,
  customer_name text
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_product public.products%rowtype;
  v_sale public.sales%rowtype;
  v_total numeric(12,2);
  v_pay_later boolean := p_payment_method is null;
begin
  if auth.uid() is null or public.current_user_role() not in ('admin', 'employee') then
    raise exception 'Apenas a equipe autorizada pode registrar vendas.' using errcode = '42501';
  end if;

  if p_quantity is null or p_quantity < 1 then
    raise exception 'Informe uma quantidade válida.' using errcode = '22023';
  end if;
  if v_pay_later and nullif(btrim(p_customer_name), '') is null then
    raise exception 'Informe o nome do cliente para registrar a venda a prazo.' using errcode = '22023';
  end if;

  select product.* into v_product
  from public.products as product
  where product.id = p_product_id
    and product.active = true
    and product.archived_at is null
  for update;

  if not found then
    raise exception 'Produto indisponível.' using errcode = 'P0002';
  end if;
  if v_product.sale_price <= 0 then
    raise exception 'O produto precisa ter um preço de venda válido.' using errcode = '22023';
  end if;
  if v_product.quantity < p_quantity then
    raise exception 'Estoque insuficiente.' using errcode = '22023';
  end if;

  v_total := round(v_product.sale_price * p_quantity, 2);

  insert into public.sales (customer_id, customer_name, subtotal, total, payment_method, created_by)
  values (case when v_pay_later then null else p_customer_id end,
          case when v_pay_later then btrim(p_customer_name) else null end,
          v_total, v_total, p_payment_method, auth.uid())
  returning * into v_sale;

  insert into public.sale_items (sale_id, product_id, quantity, unit_price)
  values (v_sale.id, v_product.id, p_quantity, v_product.sale_price);

  update public.products
  set quantity = quantity - p_quantity
  where products.id = v_product.id;

  insert into public.stock_movements (product_id, movement_type, quantity, reason, created_by)
  values (v_product.id, 'exit', p_quantity, 'Venda #' || v_sale.number::text, auth.uid());

  insert into public.payments (sale_id, amount, payment_method, paid_at, due_date, created_by)
  values (v_sale.id, v_total, coalesce(p_payment_method, 'other'::public.payment_method),
          case when v_pay_later then null else now() end,
          case when v_pay_later then p_due_date else null end,
          auth.uid());

  return query select v_sale.id, v_sale.number, v_sale.total, v_sale.payment_method,
                      v_sale.created_at, v_sale.customer_id, v_sale.customer_name;
end;
$$;

revoke all on function public.create_sale(uuid, integer, uuid, public.payment_method, text, date) from public, anon;
grant execute on function public.create_sale(uuid, integer, uuid, public.payment_method, text, date) to authenticated;

