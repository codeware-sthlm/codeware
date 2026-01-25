# AI RULES (Non-Negotiable)

These rules must always be followed when modifying or generating code.

---

## Tenancy & Security

- Tenant scoping MUST always be enforced.
- All content access MUST be scoped by `tenant.slug`.
- API keys are credentials, NOT query fields.
- Browser code MUST NEVER receive tenant API keys.
- Authentication semantics must match existing behavior:
  - Valid tenant API key == authenticated service user from `tenants` collection.

---

## Authentication

- Do NOT reimplement authentication logic.
- Always delegate authentication to `payload.auth()`.
- In Next server code:
  - Try incoming request headers first (cookies, editor sessions)
  - Fallback to synthesized Authorization header using `PAYLOAD_API_KEY`.

---

## Deployment & Runtime

- Only **cms-core** deployments may run:
  - migrations
  - background jobs
  - seeders
- Tenant deployments MUST NOT run global side effects.
- Same build artifact MUST support multiple deployments via env config.
- Do NOT introduce build-time tenant configuration (except where unavoidable).

---

## Environment Variables

- `NEXT_*` env vars are build-time and visible to the browser.
- Tenant secrets MUST remain server-only.
- Do NOT introduce new `NEXT_PUBLIC_*` tenant-specific values.

---

## Architecture

- Prefer Payload best practices and official examples.
- Avoid framework-specific quirks from legacy systems (e.g. Remix).
- Shared libraries should remain framework-agnostic where possible.
- Route groups may be reorganized internally without affecting URLs.

---

## Refactoring Discipline

- Do NOT break existing e2e tests without explicit justification.
- Prefer additive changes during migration.
- Large behavior changes must be documented under `docs/ai/TASKS/`.

---

If a change conflicts with these rules, the change is wrong.
