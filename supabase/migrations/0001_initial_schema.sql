create extension if not exists "pgcrypto";

create type public.campaign_status as enum ('active', 'archived');
create type public.job_status as enum ('queued', 'running', 'partially_complete', 'complete', 'failed', 'cancelled');
create type public.lead_status as enum ('new', 'reviewed', 'contacted', 'replied', 'interested', 'meeting', 'won', 'not_fit');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  company text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  context_json jsonb not null default '{}'::jsonb,
  category text not null,
  locations_json jsonb not null default '[]'::jsonb,
  filters_json jsonb not null default '{}'::jsonb,
  status public.campaign_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.research_jobs (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  status public.job_status not null default 'queued',
  progress integer not null default 0 check (progress between 0 and 100),
  total_found integer not null default 0,
  total_processed integer not null default 0,
  error text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  canonical_name text not null,
  category text,
  address text,
  city text,
  lat numeric,
  lng numeric,
  phone text,
  website text,
  rating numeric check (rating is null or rating between 0 and 5),
  review_count integer,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.business_sources (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  provider text not null,
  provider_id text,
  source_url text,
  raw_snapshot_ref text,
  observed_at timestamptz not null default now()
);

create table public.business_contacts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  type text not null,
  value text not null,
  label text,
  verified boolean not null default false,
  source_id uuid references public.business_sources(id) on delete set null,
  observed_at timestamptz not null default now()
);

create table public.lead_records (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  score integer not null default 0 check (score between 0 and 100),
  reasoning_json jsonb not null default '[]'::jsonb,
  signals_json jsonb not null default '[]'::jsonb,
  status public.lead_status not null default 'new',
  tags_json jsonb not null default '[]'::jsonb,
  notes text,
  last_contacted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id, business_id)
);

create table public.outreach_drafts (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.lead_records(id) on delete cascade,
  channel text not null,
  body text not null,
  subject text,
  model text not null,
  prompt_version text not null,
  created_at timestamptz not null default now(),
  edited_at timestamptz
);

create table public.job_events (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.research_jobs(id) on delete cascade,
  event_type text not null,
  payload_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index campaigns_user_id_idx on public.campaigns(user_id, updated_at desc);
create index research_jobs_campaign_id_idx on public.research_jobs(campaign_id, created_at desc);
create index lead_records_campaign_id_idx on public.lead_records(campaign_id, score desc);
create index lead_records_business_id_idx on public.lead_records(business_id);
create index business_contacts_business_id_idx on public.business_contacts(business_id);
create index business_sources_business_id_idx on public.business_sources(business_id);

create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger profiles_updated_at before update on public.profiles for each row execute procedure public.set_updated_at();
create trigger campaigns_updated_at before update on public.campaigns for each row execute procedure public.set_updated_at();
create trigger businesses_updated_at before update on public.businesses for each row execute procedure public.set_updated_at();
create trigger lead_records_updated_at before update on public.lead_records for each row execute procedure public.set_updated_at();

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name) values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))) on conflict (id) do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.campaigns enable row level security;
alter table public.research_jobs enable row level security;
alter table public.businesses enable row level security;
alter table public.business_sources enable row level security;
alter table public.business_contacts enable row level security;
alter table public.lead_records enable row level security;
alter table public.outreach_drafts enable row level security;
alter table public.job_events enable row level security;

create policy "profiles own data" on public.profiles for all using (id = auth.uid()) with check (id = auth.uid());
create policy "campaigns own data" on public.campaigns for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "jobs through campaign" on public.research_jobs for all using (exists (select 1 from public.campaigns c where c.id = campaign_id and c.user_id = auth.uid())) with check (exists (select 1 from public.campaigns c where c.id = campaign_id and c.user_id = auth.uid()));
create policy "leads through campaign" on public.lead_records for all using (exists (select 1 from public.campaigns c where c.id = campaign_id and c.user_id = auth.uid())) with check (exists (select 1 from public.campaigns c where c.id = campaign_id and c.user_id = auth.uid()));
create policy "drafts through lead" on public.outreach_drafts for all using (exists (select 1 from public.lead_records l join public.campaigns c on c.id = l.campaign_id where l.id = lead_id and c.user_id = auth.uid())) with check (exists (select 1 from public.lead_records l join public.campaigns c on c.id = l.campaign_id where l.id = lead_id and c.user_id = auth.uid()));
create policy "events through job" on public.job_events for all using (exists (select 1 from public.research_jobs j join public.campaigns c on c.id = j.campaign_id where j.id = job_id and c.user_id = auth.uid())) with check (exists (select 1 from public.research_jobs j join public.campaigns c on c.id = j.campaign_id where j.id = job_id and c.user_id = auth.uid()));

-- Canonical public business facts can be reused, while user-owned lead state remains isolated.
create policy "authenticated business read" on public.businesses for select to authenticated using (true);
create policy "authenticated business insert" on public.businesses for insert to authenticated with check (true);
create policy "authenticated source read" on public.business_sources for select to authenticated using (true);
create policy "authenticated source insert" on public.business_sources for insert to authenticated with check (true);
create policy "authenticated contact read" on public.business_contacts for select to authenticated using (true);
create policy "authenticated contact insert" on public.business_contacts for insert to authenticated with check (true);
