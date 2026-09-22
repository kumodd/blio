
Business Lead Intelligence & Outreach — a human-in-the-loop AI prospecting, outreach, and sales pipeline workspace for selling any service to local businesses.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

With the default `BLIO_DEMO_MODE=true`, sign in with any email and use OTP `123456`. Demo campaigns are stored in the local `.data/` directory so they remain consistent across Next.js requests and workers. New campaigns automatically start their first research job; set `BLIO_DEMO_SEED_DATA=true` only if you want the optional sample campaign. Delete `.data/demo-store.json` to reset demo data.

For production, configure Supabase, link the project with the Supabase CLI, and run `supabase db push`. Set `BLIO_DEMO_MODE=false`; the app then uses Supabase Auth email OTP, Postgres, RLS, Outscraper Google Maps discovery, and OpenAI intelligence. Configure the Supabase Auth email template to render `{{ .Token }}` so users receive a six-digit code rather than only a magic link.

The product flow is: define your offer → choose location, business type, radius, and approximate prospect count → discover and enrich businesses → score opportunities → review highlighted prospect cards → generate editable outreach → move prospects through the sales pipeline. Public website pages are available at `/about`, `/pricing`, `/contact`, `/privacy`, `/terms`, and `/refund-cancellation`.

## Provider setup

1. Create an Outscraper account and copy its API key into `OUTSCRAPER_API_KEY`. QuickLeads calls the Google Maps search endpoint with one query per target location, `region=IN`, `language=en`, deduplication, and `async=false`. `OUTSCRAPER_LIMIT` controls results per location. Start with `OUTSCRAPER_ENRICH_CONTACTS=false`; enable it after the base search works because website contact enrichment increases provider usage and execution time.
2. Create an OpenAI API key and copy it into `OPENAI_API_KEY`. QuickLeads uses the official OpenAI JavaScript SDK and Responses API. `gpt-5-mini` is the default because it supports structured outputs and is intended for cost-sensitive, low-latency, high-volume tasks; change `OPENAI_MODEL` only after verifying the model is available to your account.
3. Keep both provider keys server-side. Do not prefix them with `NEXT_PUBLIC_` or expose them in browser code.

## Verification

```bash
npm run typecheck
npm run lint
npm run build
```

## Production notes

- Supabase is the source of truth when `BLIO_DEMO_MODE=false` and the Supabase URL and anon key are configured.
- Research jobs are durable in Supabase. The run endpoint schedules work after its response; for high-volume workloads, invoke `lib/research/worker.ts` from a queue or worker runtime.
- No outreach is sent automatically. Users review, edit, copy, and open external channels themselves.
- Provider data is stored with source and observation metadata; OpenAI lead intelligence and outreach prompts are grounded in those collected facts.
- Outscraper results are filtered locally by rating/review/contactability and then scored by OpenAI; the fallback scorer still keeps the job usable if OpenAI is temporarily unavailable.

# QuickLeads
