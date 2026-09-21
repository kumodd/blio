# BLIO first setup

This guide covers local development and a production deployment of BLIO.

BLIO uses:

- Next.js 16 and Node.js
- Supabase Auth, Postgres, and Row Level Security
- Outscraper Google Maps Search for business discovery
- OpenAI Responses API for lead intelligence and outreach drafts

## 1. Prerequisites

Install or create:

- Node.js `20.9.0` or newer
- npm
- A Supabase project
- An Outscraper account and API key
- An OpenAI API project and API key
- A deployment host such as Vercel for production

Check local versions:

```bash
node --version
npm --version
```

The Node.js version must be at least `20.9.0`.

## 2. Install the application

From the project directory:

```bash
npm install
cp .env.example .env.local
```

Never commit `.env.local`; it is excluded by `.gitignore`.

## 3. Demo mode

Demo mode lets you run the UI before creating provider accounts.

In `.env.local`:

```env
BLIO_DEMO_MODE=true
BLIO_DEMO_SEED_DATA=false
```

Start the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Use any email address and OTP `123456`.

Demo campaigns and leads are stored in `.data/demo-store.json` so they remain consistent across Next.js requests and workers. A newly saved campaign automatically starts its first research job. Delete that file to reset demo data. Set `BLIO_DEMO_SEED_DATA=true` only when you want the optional sample campaign and leads. If provider keys are present, demo mode still uses the configured Outscraper and OpenAI integrations; remove those keys to use the local deterministic fallback.

## 4. Configure Supabase

Supabase is required for persistent data and real email OTP authentication.

### 4.1 Create a project

1. Create a project at [supabase.com](https://supabase.com/).
2. Open **Project Settings → API**.
3. Copy the project URL and publishable/anon key.
4. Add them to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

The anon key is protected by RLS. Never put a Supabase service-role key in this application or in a `NEXT_PUBLIC_` variable.

### 4.2 Apply database migrations with the Supabase CLI

Run all schema changes from the project directory. Keep the migration history in source control and do not paste migration files into the SQL editor:

```bash
supabase login
supabase link --project-ref your-project-ref
supabase db push
supabase migration list
```

`supabase db push` applies every migration in `supabase/migrations/` that is not yet recorded on the linked project. The migrations create profiles, campaigns, research jobs, businesses, sources, contacts, leads, drafts, job events, indexes, triggers, RLS policies, campaign search radius, and the sales-pipeline proposal stage.

### 4.3 Configure email OTP

In Supabase:

1. Open **Authentication → Providers → Email**.
2. Enable email authentication.
3. Open the sign-in email template.
4. Make sure it includes:

```text
{{ .Token }}
```

5. Configure custom SMTP for production so OTP delivery is reliable.

Set the local URL in **Authentication → URL Configuration**:

```text
http://localhost:3000
```

Replace it with the deployed HTTPS URL for production.

### 4.4 Disable demo mode

After Supabase is configured:

```env
BLIO_DEMO_MODE=false
```

Restart the development server after changing environment variables.

## 5. Configure Outscraper Google Maps discovery

BLIO uses the [Outscraper Google Maps Search API](https://docs.outscraper.com/endpoints/maps-search/).

### 5.1 Create the key

1. Create an account at [Outscraper](https://outscraper.com/).
2. Add billing/credits as required by your usage.
3. Create or copy an API key.
4. Add it to `.env.local`:

```env
OUTSCRAPER_API_KEY=your-out-scraper-api-key
```

The key is sent server-side using the `X-API-KEY` header and is never sent to browser JavaScript.

### 5.2 Recommended settings

```env
OUTSCRAPER_LIMIT=50
OUTSCRAPER_ENRICH_CONTACTS=false
```

`OUTSCRAPER_LIMIT` controls the maximum number of results requested per target location. Start with `25` or `50`.

Enable contact enrichment after the base search works:

```env
OUTSCRAPER_ENRICH_CONTACTS=true
```

Contact enrichment can increase provider usage and execution time and may add email/social signals from business websites.

### 5.3 India search behavior

BLIO automatically:

- Appends `India` to each location query.
- Sends `region=IN`.
- Sends `language=en`.
- Sends one query per location.
- Requests duplicate removal.
- Uses the campaign's approximate prospect target to cap the final lead list.
- Uses synchronous results for the current research worker.

Use precise locations in campaigns, for example:

```text
Indiranagar, Bengaluru
Koramangala, Bengaluru
HSR Layout, Bengaluru
```

Prefer customer-facing Google Maps categories such as `dental clinic`, `salon`, `cloud kitchen`, or `accounting firm`.

When creating a campaign, choose an approximate prospect target such as `10`, `25`, `50`, `100`, `200`, or `500`. This is a maximum target rather than a guarantee: filters, duplicate removal, provider results, and available public data can produce fewer prospects. When the provider returns image URLs, BLIO stores them with the business record and displays them on prospect cards; otherwise cards use a clean initials fallback.

## 6. Configure OpenAI

BLIO uses OpenAI for:

- Lead-fit scoring
- Evidence-based reasoning
- Opportunity signals
- WhatsApp drafts
- Email drafts
- Phone call scripts

### 6.1 Create the key

1. Create an API project at [platform.openai.com](https://platform.openai.com/).
2. Add billing or usage credits.
3. Create a key at [OpenAI API Keys](https://platform.openai.com/api-keys).
4. Add it to `.env.local`:

```env
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-5-mini
```

`gpt-5-mini` is the default for cost-sensitive, low-latency, high-volume tasks. Change it only to a model available to your project.

The key must remain server-only. Never use `NEXT_PUBLIC_OPENAI_API_KEY`.

### 6.2 Grounding behavior

The application sends the model campaign context, scraped business facts, ratings, reviews, contact paths, and source metadata. Prompts prohibit invented facts, claims, discounts, outcomes, or relationships. If OpenAI is unavailable, BLIO uses a deterministic grounded fallback.

## 7. Complete local environment

For a real local setup, `.env.local` should contain:

```env
BLIO_DEMO_MODE=false
BLIO_DEMO_SEED_DATA=false
NEXT_PUBLIC_APP_URL=http://localhost:3000

NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

OUTSCRAPER_API_KEY=your-out-scraper-api-key
OUTSCRAPER_LIMIT=50
OUTSCRAPER_ENRICH_CONTACTS=false

OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-5-mini
```

Replace all placeholder values with real values.

## 8. Run and verify locally

Start the development server:

```bash
npm run dev
```

Run code verification:

```bash
npm run typecheck
npm run lint
npm run build
npm audit --omit=dev --audit-level=moderate
```

### End-to-end smoke test

1. Sign in with Supabase email OTP.
2. Create a campaign.
3. Use precise Indian target locations.
4. Start research and wait for completion.
5. Verify source URL, phone, website, rating, and review count on a lead.
6. Generate outreach drafts.
7. Confirm drafts are editable before copying/opening an external channel.
8. Change lead status and add notes/tags.
9. Export the campaign CSV.

## 9. Deploy to production

Vercel is the simplest deployment target for this Next.js application.

### 9.1 Create the deployment

1. Push the repository to a private Git repository.
2. Import it into Vercel.
3. Keep the framework preset as Next.js.
4. Use these commands if requested:

```text
Build command: npm run build
Install command: npm ci
```

5. Add production environment variables in Vercel **Project Settings → Environment Variables**.

### 9.2 Production environment variables

```env
BLIO_DEMO_MODE=false
NEXT_PUBLIC_APP_URL=https://your-production-domain.com

NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

OUTSCRAPER_API_KEY=your-out-scraper-api-key
OUTSCRAPER_LIMIT=50
OUTSCRAPER_ENRICH_CONTACTS=false

OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-5-mini
```

Do not add provider keys as `NEXT_PUBLIC_` variables or commit them to the repository.

### 9.3 Update Supabase URLs

After the production domain is known:

1. Set the Supabase **Site URL** to the production HTTPS URL.
2. Add the production URL to allowed redirect URLs if required.
3. Verify the OTP template and SMTP configuration.
4. Redeploy after changing environment variables.

### 9.4 Production smoke test

Verify that:

- Unauthenticated users are redirected to `/login`.
- A user can authenticate with email OTP.
- User A cannot read User B's campaigns or leads.
- Research creates source-backed leads.
- OpenAI drafts contain only supplied facts.
- CSV export contains only the requesting user's permitted leads.

## 10. Alternative Node deployment

For a VPS, container, or managed Node host:

```bash
npm ci
npm run build
npm start
```

Use systemd, Docker, or another process supervisor. Inject production environment variables through the host secret manager.

## 11. Security checklist

- [ ] `.env.local` is not committed.
- [ ] `BLIO_DEMO_MODE=false` in production.
- [ ] No provider key uses a `NEXT_PUBLIC_` prefix.
- [ ] Supabase migration has been applied.
- [ ] Supabase RLS policies are enabled.
- [ ] The Supabase service-role key is not in the application.
- [ ] Outscraper and OpenAI usage limits/billing alerts are configured.
- [ ] Provider terms and applicable privacy/data rules have been reviewed.
- [ ] Outreach remains human-reviewed; BLIO does not send messages automatically.
- [ ] Source URLs and observed timestamps are preserved.
- [ ] Provider keys are rotated immediately if exposed.

## 12. Troubleshooting

### The app always shows demo data

Check:

```env
BLIO_DEMO_MODE=false
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Restart the development server, or rebuild the production bundle, after changing the legacy `NEXT_PUBLIC_DEMO_MODE` variable. `BLIO_DEMO_MODE` is the preferred server-only flag and can be changed without rebuilding a production bundle.

### Email OTP does not arrive

Check that Supabase Email is enabled, the template contains `{{ .Token }}`, SMTP is configured, and the message is not in spam.

### Outscraper returns 401

Check the API key, billing/credits, and that the key is in `OUTSCRAPER_API_KEY`.

### Outscraper returns no useful Indian results

Use a precise location such as `Banjara Hills, Hyderabad, India` and a customer-facing category such as `physiotherapy clinic`. Increase `OUTSCRAPER_LIMIT` gradually.

### Research fails after enabling enrichment

Set:

```env
OUTSCRAPER_ENRICH_CONTACTS=false
```

Run a smaller base search first. Enrichment takes longer and consumes more provider usage.

### Outreach still says `grounded-fallback`

This means `OPENAI_API_KEY` is missing, invalid, the selected model is unavailable, or the response could not be parsed. Check server logs and verify `OPENAI_MODEL`.

### Database relation or table errors

Confirm the intended project is linked, then run `supabase db push` and inspect `supabase migration list`. Keep schema changes in a new migration created with `supabase migration new <name>`; do not edit migrations that have already been applied remotely.

## 13. Useful commands

```bash
npm run dev
npm run build
npm start
npm run typecheck
npm run lint
npm audit --omit=dev --audit-level=moderate
```
