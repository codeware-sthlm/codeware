# AI CONTEXT

## System Overview

This repository contains a **multi-tenant Payload CMS system** built with **Payload v3** and **Next.js App Router**.

The system is designed to:

- Serve many tenants from a shared CMS
- Deploy tenant sites independently
- Preserve strong isolation via configuration, not code duplication
- Use a single build artifact with environment-driven behavior

The primary application lives in `apps/cms`.

---

## Applications & Routing

### apps/cms

- Payload v3 + Next.js App Router
- Route groups:
  - `(payload)` — Payload Admin UI
  - `(app)` — Static welcome page (kept for stability and e2e tests)
  - `(site)` — Tenant-facing frontend (migrated from Remix)

The `(site)` route group is the long-term replacement for the legacy Remix app.

---

## Tenancy & Authentication Model

### Tenants

- The **Tenants collection is an AUTH collection**
- Each tenant acts as a **service user**
- Tenants authenticate using **API keys**

### Users

- Editor users belong to **one or more tenants**
- Tenant membership controls access to headless content
- System admins do **not** need tenant membership by design

### Scoping

- Tenant scoping is derived from the authenticated identity (`req.user`)
- All content access is scoped by `tenant.slug`
- External clients authenticate via `Authorization` header
- Payload treats valid tenant API keys as "logged in"

---

## Deployment Model

- The same build artifact is deployed multiple times
- Runtime behavior is controlled via environment variables
- Secrets and tenant relationships are resolved via **Infisical**

Key env inputs:

- `DEPLOY_ENV`
- `TENANT_ID`
- Tenant secrets include e.g. `PAYLOAD_API_KEY`

`NEXT_*` environment variables are used **only** when required at build-time (e.g. Sentry).
Tenant secrets are server-only.

---

## Frontend Architecture Direction

- Frontend rendering lives in Next.js `(site)` routes
- Data access uses Payload Local API when in-process
- Browser must never send tenant API keys
- Server code recreates authentication semantics using `payload.auth()`

### Server-side auth behavior

1. Attempt authentication using incoming request headers (cookies)
2. If unauthenticated, fall back to tenant service user via API key
3. Continue resolving tenant scope from authenticated identity

---

## Styling & Themes

- Current visual theme is based on Tailwind **Spotlight**
- Headless components and renderers live in shared libraries
- Larger layout/shell variants (e.g. marketing vs docs)
  are a **future improvement**, not part of the initial migration

---

## Documentation

Additional context lives in:

- `README.md` (root)
- `docs/DEPLOYMENT.md` (runtime, infra, Infisical, Sentry)
- `docs/ai/TASKS/*` (task-specific guides)
