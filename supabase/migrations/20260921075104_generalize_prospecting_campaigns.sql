alter table public.campaigns add column if not exists radius_km numeric not null default 10;
alter table public.campaigns drop constraint if exists campaigns_radius_km_check;
alter table public.campaigns add constraint campaigns_radius_km_check check (radius_km between 1 and 100);

alter type public.lead_status add value if not exists 'proposal';
