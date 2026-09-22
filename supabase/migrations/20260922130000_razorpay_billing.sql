create table if not exists public.billing_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'razorpay',
  provider_subscription_id text not null unique,
  provider_plan_id text not null,
  provider_customer_id text,
  provider_payment_id text,
  plan_key text not null,
  status text not null default 'created',
  current_start timestamptz,
  current_end timestamptz,
  charge_at timestamptz,
  ended_at timestamptz,
  cancel_at_cycle_end boolean not null default false,
  raw_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists billing_subscriptions_one_open_per_user_idx
  on public.billing_subscriptions(user_id)
  where status in ('created', 'authenticated', 'active', 'pending');

create index if not exists billing_subscriptions_user_id_idx
  on public.billing_subscriptions(user_id, created_at desc);

create table if not exists public.billing_webhook_events (
  event_id text primary key,
  event_type text not null,
  payload_json jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

create trigger billing_subscriptions_updated_at
before update on public.billing_subscriptions
for each row execute procedure public.set_updated_at();

alter table public.billing_subscriptions enable row level security;
alter table public.billing_webhook_events enable row level security;

create policy "billing subscriptions own data"
on public.billing_subscriptions
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());
