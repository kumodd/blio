alter table public.research_jobs add column if not exists discovered_count integer not null default 0;
alter table public.research_jobs add column if not exists filtered_out_count integer not null default 0;
alter table public.research_jobs add column if not exists diagnostics_json jsonb not null default '[]'::jsonb;
