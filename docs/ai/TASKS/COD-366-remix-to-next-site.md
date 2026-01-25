# AI CONTEXT: Payload v3 + Next.js App Router migration (Remix -> Next inside cms)

## Project snapshot

- Payload v3 + Next.js App Router.
- `apps/cms` is the primary app and already contains:
  - `(payload)` route group for Payload Admin
  - `(frontend)` route group currently used as a static welcome page (keep for now to preserve existing e2e stability)
- `apps/web` (Remix/Hono) is to be the secondary choice. It is thin: mostly boilerplate, routing, minimal styling.
- Headless CMS rendering components and Payload utilities already live in shared libraries.
- Repo has strong documentation; start with:
  - README.md
  - docs/DEPLOYMENT.md (Infisical inputs, environment keys, Fly.io workflow, Sentry build-time env)

## Tenancy & auth model (must preserve semantics)

- Multi-tenant setup:
  - Tenants collection is an AUTH collection that acts as a service user.
  - Tenant API key belongs to the Tenants auth collection.
  - Users belong to 1..n tenants to edit headless data.
  - System user does not need to belong to tenants by design.
- Access + scoping:
  - Tenant scoping is derived from the authenticated identity (req.user) and scoped by `tenant.slug`.
  - External clients authenticate via `Authorization` header using the tenant API key; Payload should treat this as "logged in".

## Deployment model (must remain intact)

- Apps can be deployed multiple times with different build-tima and runtime env.
- Environment and tenant relations are resolved via Infisical using env keys:
  - DEPLOY_ENV, TENANT_ID (and related)
- One of the tenant secrets is PAYLOAD_API_KEY.
- `NEXT_*` env is only used where build-time is required (e.g. Sentry). Tenant secrets remain server-only.

## Migration goal (phase 1)

- Move frontend routing/rendering from Remix into `apps/cms` as a new route group `(site)`.
- Keep `(frontend)` static welcome page unchanged initially (avoid breaking existing e2e).
- Implement frontend using Next.js App Router following Payload best practices for URL structure (prefer canonical Payload patterns over Remix quirks).
- Use catch-all routing in `(site)` to port pages incrementally:
  - Prefer `app/(site)/[...slug]/page.tsx` (non-optional catch-all) so it does not match `/`.
- Replace Remix loader/action patterns with:
  - Server Components / layouts for data loading
  - Route Handlers under `app/(site)/api/*` for server actions

## Critical behavior change (how to replace "API key in browser header")

- Browser must NOT send tenant API key.
- Next server code must recreate the same "logged in when API key exists" semantics server-side:
  1. Call `payload.auth({ headers: incomingRequestHeaders })` to support editor sessions (cookies).
  2. If not authenticated, call `payload.auth()` again using a synthesized Authorization header with PAYLOAD_API_KEY from env/Infisical.
- Continue to resolve tenant slug(s) from the authenticated identity and scope content by `tenant.slug`.
- External REST clients using Authorization header remain supported (no breaking change).

## Theme direction (phase 1)

- Keep styling close to current Spotlight Tailwind theme.
- Larger “shell/layout variants” (marketing vs docs) are a follow-up improvement and should be modeled later via CMS-driven layout selection.
