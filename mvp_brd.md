# Business Lead Intelligence & Outreach | MVP BRD

**Business Requirements Document**

**MVP — Web Application**  
*Next.js + Supabase + Email OTP Authentication*

| Field | Value |
|---|---|
| Document Type | Business Requirements Document (BRD) |
| Release | MVP / Web |
| Client | Next.js web application |
| BaaS | Supabase: Auth, Postgres, Storage, Edge Functions / server integration |
| Authentication | Email + one-time passcode (OTP) |
| Primary Users | Solo founders, salespeople, agencies, lead-generation teams |
| Status | Product definition / implementation-ready MVP scope |

**MVP north star:** Help a user define what they sell and where they want to sell it, discover relevant local businesses, enrich each lead with publicly available business/contact signals, explain why the lead is relevant, and produce a ready-to-review personalized outreach message.

Confidential product planning document

## 1. Executive Summary

The product is a web-based lead intelligence workspace. A user signs in with email OTP, creates a campaign describing their offer and target market, selects business categories and target locations, runs a discovery job, reviews enriched business profiles, and uses AI-generated outreach as a starting point for manual contact. The MVP is intentionally human-in-the-loop: it prepares research and outreach, but does not mass-send messages automatically.

| Area | MVP decision |
|---|---|
| Frontend | Next.js responsive web app |
| Auth | Supabase Auth with email OTP / magic-code flow |
| Database | Supabase Postgres with Row Level Security (RLS) |
| Storage | Supabase Storage only where files/export artifacts are required |
| Async work | Background worker / Edge Function / server job pattern; web request must not block on scraping |
| AI | LLM service for lead relevance, summaries, and outreach generation |
| Lead acquisition | Provider/API + compliant public-source discovery/enrichment adapters |
| Outreach | Copy / deep-link handoff to WhatsApp, email, phone, website, social profile where supported |
| MVP focus | Discovery → enrichment → explanation → personalized first-touch draft |

## 2. Problem Statement

Small sales teams can find lists of businesses, but turning a raw list into usable prospects requires repetitive research: checking websites, phone numbers, social profiles, contact channels, signals of business fit, and then writing a message that does not sound generic. The product should compress that workflow into one web workspace.

**Problem to solve:** The user should move from "I know who I want to sell to" to "I have a researched, actionable lead list with a personalized first message" without maintaining spreadsheets or manually researching each business.

## 3. MVP Goals and Non-Goals

## 3.1 Goals

Allow secure email + OTP sign-in with persistent sessions.

Allow users to create a campaign with business context, target category, target locations, and optional filters.

Find and normalize business records from supported discovery providers/sources.

Enrich each lead with business details and publicly available contact/social links where available.

Generate a transparent lead-relevance summary and opportunity signals from collected data.

Generate channel-specific, business-specific outreach drafts for review.

Allow users to save, filter, tag, and change lead status.

Provide a job/progress view so long-running research does not block the browser.

## 3.2 Non-Goals

Automated mass messaging or autonomous sending of DMs.

A full CRM with complex sales forecasting, team permissions, or billing in the first release.

Guaranteed discovery of every business or every social account.

Private-data acquisition, credential-based scraping, or bypassing access controls.

Native mobile applications in this MVP.

## 4. Target Users and Primary Use Cases

**Persona**

**Need**

**MVP outcome**

**Founder / solo seller**

Find first 50–200 relevant local prospects

Campaign + researched lead list + outreach drafts

**Sales representative**

Research prospects quickly before outreach

Lead cards with evidence, contacts, and draft messages

**Marketing / lead-gen agency**

Repeat prospecting across categories/locations

Reusable campaign templates and saved leads

**Primary user journey**

Sign in with email OTP.

Create a campaign and describe the offer/customer problem.

Select category and one or more target locations.

Configure lightweight filters.

Start discovery/enrichment job.

Review job progress and results.

Open a business lead card.

Review evidence, contacts, signals, and AI explanation.

Review/edit a personalized outreach draft.

Use the appropriate external contact channel and mark the lead status.

## 5. MVP Scope

**Module**

**Included in MVP**

**Deferred**

**Authentication**

Email OTP, session persistence, sign-out, route protection

SSO, MFA, organization accounts

**Campaigns**

Create/edit/archive, context, category, locations, filters

Complex templates, team collaboration

**Discovery**

Run a search job, paginate results, deduplicate basic records

Continuous monitoring, advanced geospatial routing

**Enrichment**

Phone, website, address, rating/review count, social links when available, source references

Deep social analytics, private account data

**Lead intelligence**

Fit summary, opportunity signals, explainable score

Predictive conversion models

**Outreach**

AI draft for WhatsApp/DM/email, copy, open external channel

Automated sending, inbox sync

**Lead management**

Save, tags, notes, status, last-contacted date

Full CRM automation

**Exports**

CSV export of user-owned leads

Scheduled exports, external CRM sync

**Analytics**

Basic counts: discovered, saved, contacted, replied, meetings

Advanced attribution dashboards

## 6. Functional Requirements

## 6.1 Authentication

**ID**

**Requirement**

**FR-AUTH-01**

User can enter email address and request a one-time passcode.

**FR-AUTH-02**

User can enter the OTP and establish a Supabase-authenticated session.

**FR-AUTH-03**

Authenticated routes redirect unauthenticated users to the login page.

**FR-AUTH-04**

User can sign out; server/browser session is invalidated appropriately.

**FR-AUTH-05**

Profile row is created or synchronized for the authenticated user.

## 6.2 Campaign creation

**ID**

**Requirement**

**FR-CAM-01**

User can create a campaign with name, offer/product description, target customer, pain point, value proposition, CTA, and tone.

**FR-CAM-02**

User can select one category and multiple locations.

**FR-CAM-03**

User can set optional filters such as minimum rating, minimum review count, website presence, WhatsApp presence, or social presence.

**FR-CAM-04**

Campaign can be edited, archived, and relaunched.

## 6.3 Discovery and enrichment jobs

**ID**

**Requirement**

**FR-JOB-01**

User can launch a lead research job from a campaign.

**FR-JOB-02**

System records job status: queued, running, partially complete, complete, failed, or cancelled.

**FR-JOB-03**

UI shows progress counts and errors without requiring a page refresh.

**FR-JOB-04**

System normalizes source data into a canonical business record.

**FR-JOB-05**

System attempts basic deduplication using provider IDs and normalized business name/address/phone.

**FR-JOB-06**

Each stored contact/social field keeps a source and verification timestamp where available.

## 6.4 Lead workspace

**ID**

**Requirement**

**FR-LEAD-01**

User can view campaign leads in table/card layout.

**FR-LEAD-02**

User can filter/sort by score, rating, location, category, contactability, social presence, and status.

**FR-LEAD-03**

User can open a detailed lead page with business facts, signals, sources, and outreach.

**FR-LEAD-04**

User can save/tag leads and add notes.

**FR-LEAD-05**

User can change lead status: New, Reviewed, Contacted, Replied, Interested, Meeting, Won, Not a fit.

**FR-LEAD-06**

User can export visible or selected leads to CSV.

## 6.5 AI intelligence and outreach

**ID**

**Requirement**

**FR-AI-01**

System summarizes why the business may fit the campaign context using only collected evidence.

**FR-AI-02**

System generates an explainable opportunity score from defined signals.

**FR-AI-03**

System generates short outreach drafts for WhatsApp/social DM and a longer email draft.

**FR-AI-04**

Generated copy must be editable before user copies or opens an external channel.

**FR-AI-05**

System must not claim facts about a business that are not present in source data.

## 7. Web UX / Page Requirements

**Page**

**Key elements**

**Primary actions**

**Login**

Email input, OTP input, resend, error states

Sign in

**Dashboard**

Campaign list, totals, recent jobs, recent leads

Create campaign, open campaign

**Create Campaign**

Context form, category, locations, filters, CTA

Save and run research

**Job Progress**

Progress bar, counts, stage, errors, cancel

View results / retry

**Leads**

Search, filters, sort, cards/table, bulk select

Open, save, tag, export

**Lead Detail**

Business facts, contacts, sources, signals, score, AI reasoning, outreach

Copy/open channel, status update, note

**Settings**

Profile, sign-out, data/export controls

Update profile, export/delete request

**Key UX principle:** A lead card should answer three questions immediately: What is this business? Why is it relevant to me? How can I contact it?

## 8. Supabase Data Model (MVP)

**Table**

**Purpose**

**Key fields**

**profiles**

App profile linked to auth.users

id, name, company, created_at

**campaigns**

User-defined prospecting campaign

id, user_id, name, context_json, category, locations_json, filters_json, status

**research_jobs**

Async discovery/enrichment job

id, campaign_id, status, progress, total_found, total_processed, error, started_at, completed_at

**businesses**

Canonical business entity

id, canonical_name, category, address, lat, lng, phone, website, rating, review_count

**business_sources**

Provider/source evidence for a business

business_id, provider, provider_id, source_url, raw_snapshot_ref, observed_at

**business_contacts**

Normalized contact/social links

business_id, type, value, verified, source_id, observed_at

**lead_records**

Campaign-specific lead state

id, campaign_id, business_id, score, reasoning_json, status, tags_json, notes, last_contacted_at

**outreach_drafts**

AI-generated drafts

lead_id, channel, body, model, prompt_version, created_at, edited_at

**job_events**

Optional progress/error events for a job

job_id, event_type, payload_json, created_at

## 8.1 Row Level Security

Every user-owned table is keyed through auth.uid() or a secure ownership relationship.

Users can read/write only their own campaigns, jobs, lead_records, drafts, notes, and profile data.

Canonical business data can be shared only if product policy allows it; otherwise expose it through user-owned lead records.

Service-role credentials are never shipped to the browser.

## 9. MVP Technical Architecture

Recommended topology: the browser handles UX and Supabase-authenticated data access; long-running research runs on server/background infrastructure. Supabase is the source of truth for auth and relational data, but scraping/enrichment work should not execute inside a Next.js request handler.

**Layer**

**Technology / responsibility**

**Browser**

Next.js App Router, TypeScript, responsive UI, client-side state, Supabase browser client

**Web server**

Next.js Route Handlers / Server Actions for secure orchestration and server-only operations

**Auth**

Supabase Auth — email OTP, session cookies / token handling

**Data**

Supabase Postgres + RLS

**Async processing**

Supabase Edge Functions and/or external worker service with a job queue pattern

**Discovery providers**

Provider adapters / APIs / compliant public-source collectors

**AI service**

LLM API behind server-only credentials; prompt/version logging

**Observability**

Structured logs, job errors, latency, provider usage metrics

## 10. Security, Privacy, and Data Handling

Use Supabase Auth OTP flow; do not implement passwords in MVP.

Protect server secrets and provider/LLM API keys in server-side environment variables or secret management.

Enforce RLS on user-owned records before exposing CRUD endpoints.

Treat third-party business data as externally sourced and potentially stale; retain source and observed_at fields.

Do not collect or store private credentials, private social data, or data obtained by bypassing access controls.

Provide a way to export/delete the user account data retained by the product, subject to operational retention requirements.

Outreach is human-in-the-loop; the product prepares copy and opens supported external channels rather than autonomously sending messages.

## 11. AI Requirements

**Capability**

**Input**

**Output**

**Acceptance rule**

**Lead relevance**

Campaign context + verified business facts/signals

Fit summary + score + reasons

Every reason traces to available evidence

**Message generation**

Business facts + campaign context + channel

Editable outreach draft

No invented business facts; concise and specific

**Call script**

Same as above

30–60 second call outline

Uses only supported claims

**Regeneration**

Existing draft + tone instruction

Alternative draft

Preserve factual grounding

**AI quality bar:** The model is an assistant, not the data source. Business facts must come from collected source data; the LLM should synthesize, prioritize, and personalize rather than invent.

## 12. Core API / Job Contracts

**Endpoint / action**

**Purpose**

**Result**

**POST /api/campaigns**

Create campaign

campaign id

**POST /api/campaigns/\:id/research**

Start research job

job id

**GET /api/jobs/\:id**

Read progress

job status + counters + error

**GET /api/campaigns/\:id/leads**

List leads

paginated lead list

**GET /api/leads/\:id**

Read lead detail

facts + signals + sources + drafts

**POST /api/leads/\:id/generate-outreach**

Generate draft

draft id + channel drafts

**PATCH /api/leads/\:id**

Update status/tags/notes

updated lead

**GET /api/campaigns/\:id/export**

Export CSV

downloadable CSV

## 13. Non-Functional Requirements

**Requirement**

**MVP target**

**Responsive web**

Usable at desktop and tablet widths; mobile web supported for essential review actions

**Performance**

Initial authenticated dashboard target < 2.5s under normal conditions; paginated lead lists

**Job reliability**

Jobs survive browser close/reopen; failed jobs can be retried

**Security**

RLS enabled before production; secrets never client-exposed

**Auditability**

Store source URLs, observed timestamps, prompt version, and job state

**Accessibility**

Keyboard-friendly controls, readable contrast, labelled forms, semantic headings

**Scalability**

Pagination and async workers from day one; avoid synchronous 100+ business enrichment in a request

## 14. MVP Success Metrics

**Metric**

**Definition**

**Initial product question**

**Activation**

% of new users who complete first campaign

Can users reach value without guidance?

**Research completion**

% of jobs completing successfully

Is discovery/enrichment reliable?

**Lead usability**

% of discovered leads that users save/review

Are results relevant enough to inspect?

**Contactability**

% of leads with at least one usable contact path

Do enriched records support action?

**Draft acceptance**

% of generated drafts copied/edited/opened

Does AI output reduce work?

**Outbound action rate**

% of saved leads moved to Contacted

Does the workflow drive action?

**Reply rate**

Replies / contacted leads, user-reported

Does relevance + personalization help?

## 15. MVP Acceptance Criteria

A new user can sign in using email OTP and access a protected dashboard.

A user can create a campaign with business context, category, and at least one target location.

A research job can be launched and monitored after the browser is refreshed or reopened.

Completed jobs produce normalized lead records with source attribution for available business/contact data.

The leads screen supports search, filters, sorting, and lead detail navigation.

Each lead detail page provides contact actions, evidence, relevance reasoning, and at least one outreach draft when data is sufficient.

Users can edit/copy outreach text and update lead status.

RLS prevents one user from reading another user’s campaign/lead/draft data.

The system records enough provenance to explain where major business/contact fields came from.

No production flow requires secrets or provider API credentials in client-side JavaScript.

## 16. MVP Delivery Plan

**Phase**

**Deliverables**

**P0 — Foundation**

Next.js app shell, Supabase project, email OTP, session handling, RLS baseline, CI/CD

**P1 — Campaigns**

Dashboard, campaign creation/editing, category/location/filter model

**P2 — Discovery**

Research job model, provider adapter, normalization, dedupe basics, progress UI

**P3 — Leads**

Lead list/detail, sources, contacts, tags, status, notes, export

**P4 — AI**

Relevance reasoning, score, message drafts, edit/copy/open actions

**P5 — Hardening**

Security review, error states, accessibility, performance, observability, production checklist

## 17. Critical User Stories

**ID**

**Story**

**US-01**

As a new user, I want to sign in with email OTP so I do not need to remember a password.

**US-02**

As a seller, I want to describe my offer and ideal prospect so research can be personalized.

**US-03**

As a seller, I want to choose categories and locations so I can focus research geographically.

**US-04**

As a seller, I want to see research progress so I know whether the system is still working.

**US-05**

As a seller, I want each business summarized in a lead card so I can decide quickly whether to contact it.

**US-06**

As a seller, I want contact channels and source evidence so I can act with confidence.

**US-07**

As a seller, I want a personalized first message so I spend less time writing repetitive outreach.

**US-08**

As a seller, I want to edit the generated message before sending it so I remain in control.

**US-09**

As a seller, I want to mark lead status and notes so I do not lose track of outreach.

**US-10**

As a user, I want my campaigns and leads isolated from other users so my prospect data stays private.

## 18. Key Risks and Mitigations

**Risk**

**Impact**

**Mitigation**

**Provider/source policy or availability changes**

High

Use provider adapters; keep source abstraction; do not hard-code a single discovery source into domain models

**Stale contact/social data**

High

Store observed_at/source; show verification status; allow refresh

**AI hallucination**

High

Ground prompts in structured facts; log prompt versions; prohibit unsupported claims

**Long-running jobs / timeouts**

High

Async jobs, durable state, retries, idempotency

**Cross-user data leakage**

Critical

Supabase RLS, server-side authorization tests, no service-role client exposure

**Spam / misuse**

High

Human-in-the-loop outreach, usage limits, audit trail, suppression controls

**Cost growth from enrichment/AI**

Medium

Usage quotas, caching, batching, model tiers, job budgets

## 19. Open Product / Engineering Decisions

Which first discovery provider(s) will be supported in production?

Which source types are considered acceptable for contact/social discovery in the target markets?

Which AI provider/model will be used for MVP and what is the per-user research budget?

Will background processing use Supabase Edge Functions, a dedicated worker, or a queue-backed external runtime?

Should canonical businesses be globally shared across users or isolated through campaign-specific lead records?

What user/tenant usage quota should apply to research jobs in MVP?

**Appendix A — Suggested Initial Status Model**

**Lead status:** New → Reviewed → Contacted → Replied → Interested → Meeting → Won / Not a fit

**Appendix B — MVP Definition of Done**

Login/logout/session refresh works in production-like environment.

RLS policies are tested with at least two user accounts.

A full campaign can run from creation to lead review without manual database intervention.

At least one discovery/enrichment provider path is integrated end-to-end.

A failed job produces an understandable error and can be retried safely.

AI output is grounded, editable, and stored with prompt/model metadata.

Lead contact links are normalized and open supported external destinations.

CSV export contains only the requesting user’s permitted lead data.

Production secrets are server-side only and deployment documentation exists.

Core analytics events are captured for activation, job completion, lead review, and outreach actions.

**End of MVP BRD**

Confidential product planning document
