alter table public.campaigns add column if not exists lead_limit integer not null default 50;
alter table public.campaigns drop constraint if exists campaigns_lead_limit_check;
alter table public.campaigns add constraint campaigns_lead_limit_check check (lead_limit between 5 and 500);

alter table public.businesses add column if not exists image_url text;
alter table public.businesses add column if not exists photos_json jsonb not null default '[]'::jsonb;
