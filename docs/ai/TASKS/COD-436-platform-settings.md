# COD-436 — Platform settings collection for non-secret boot config

Branch `cod-436-platform-settings-collection-for-non-secret-boot-config`. Gives non-secret
platform-wide config a home with field validation, version history and a form — and,
more importantly, a rule for which config goes where.

## Status

Done and committed:

| Commit     | What                                                                                                                                |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `9626312f` | Step 1: `domainsField()` factory extracted into `feature/domains`, not `ui/fields` as originally planned — see deviation note below |
| `0686e034` | Step 2: `platform-settings` collection, `ensureSingleRow` hook, registered and typed                                                |
| `fb4554c8` | Step 3: migration `20260817_212656_cod_436_platform_settings`, applied to local dev db                                              |

Deviations from the written plan:

- **Factory lives in `libs/app-cms/feature/domains`, not `libs/app-cms/ui/fields`.** The
  `hostname` field's `validateHostname` validator is `type:feature`; `type:ui` libs may only
  depend on `type:ui`/`type:util` per `eslint.config.mjs`'s `depConstraints`. Exported from
  the existing `@codeware/app-cms/feature/domains` barrel instead — `tenants.collection.ts`
  already imported from there for the other domain hooks.
- **`nx run cms:gen` ran as part of step 2, not deferred to step 3.** `CollectionSlug` and
  `Record<CollectionSlug, …>` (in `slug-icons.ts`) resolve through Payload's `GeneratedTypes`
  module augmentation, so `platformCollectionSlugs` and the collection's own
  `CollectionConfig<'platform-settings'>` typing could not compile until types were
  regenerated. `generate:types` only introspects the config, not the database, so it's safe
  ahead of the migration. `slug-icons.ts` needed a `platform-settings: Cog6ToothIcon` entry
  as a result — its `Record` is exhaustive over the generated slug union.
- Regenerating types also picked up `validationErrors` on `Tenant`/`TenantsSelect`, a field
  already in the domains array that the committed `payload-types.ts` had never reflected —
  pre-existing drift, not something this branch introduced.

Not yet addressed, carried from step 1: `guardDomainConflicts` (in `feature/domains`) checks
for a hostname reused elsewhere only against `collection: 'tenants'`. Once
`platform-settings` has its own `domains` array, the same hostname in both places would go
uncaught. Decide in step 6 (or earlier if it blocks step 4's spec) whether the check should
widen to both collections.

`migrate:create <name>` (positional arg, not `--name`) named the file correctly on the first
try — no manual rename needed, unlike the COD-357-era `--name` quirk noted below.

Next: step 4, boot read.

## Where this plan departs from the ticket

**There is no raw `pg` read to copy.** The ticket says to reuse "the same raw `pg` read and
`NX_RUN_TARGET` guard as the tenant domain read in COD-357". COD-357 planned that and then
abandoned it — `rg "from 'pg'|new Pool"` returns nothing in the workspace. The tenant domain
read happens in `onInit` via `resolveScopedTenant`, because the tenant is identified by an
API key Payload stores encrypted, and raw SQL would have meant reimplementing that
decryption.

That deviation helps here. `apps/cms/src/utils/adopt-tenant-domains.ts` proves Payload reads
`serverURL`, `cors` and `csrf` from the live config **per request** rather than capturing
them at sanitize time — pinned by `adopt-tenant-domains.spec.ts` against the installed
version. The same applies to the host app. No raw `pg` client, no pre-`buildConfig` read, no
new `NX_RUN_TARGET` guard beyond the one already wrapping `onInit`.

If a later setting genuinely has to be known before `buildConfig`, that is when a raw read
earns its place, as a separate ticket. Nothing here needs it.

**`hostCustomUrl` is a `domains` array, not a text field.** The ticket names a plain
hostname. A bare text field has no certificate state, so it would be adopted the moment it
is saved — and a typo moves every generated link, including the password reset that gets a
locked-out editor back in, onto a hostname that fails TLS. COD-357 already decided this for
tenants: adopt only once Fly has issued the certificate and someone marked the row primary.
The host app gets the same shape and the same guarantee.

This is nearly free. `adoptableDomains(domains, app)` is already app-scoped, not
tenant-scoped — it filters on `domain.app === app && domain.certificate?.isConfigured` and
knows nothing about tenants. Passing `platform-settings.domains` and `env.APP_NAME` works
as-is.

**`CUSTOM_URL` is replaced by a boolean, not renamed.** It currently does two unrelated
jobs: _set_ a custom domain (obsolete once domains live in the database) and _suppress_
adoption (still needed). Only the second survives, and it does not need to carry an address
— `EnvSchema` already falls through to `FLY_URL`, which Fly guarantees resolves and holds a
valid certificate. So: `DISABLE_DOMAIN_ADOPTION`, a `coerceBoolean` matching the existing
`DISABLE_DB_PUSH`.

A value-carrying override can itself be set wrong, which gives the recovery lever the same
failure mode as the thing it recovers from. A boolean cannot. The loop closes: flip it →
app serves on its Fly url → log into the admin there → fix the row → unflip.

## What Infisical actually holds (checked 2026-08-17)

`infisical-analysis`, production and preview. Five `CUSTOM_URL` values, in three different
states:

| Env        | App | Tenant       | Value                            | Effect                             |
| ---------- | --- | ------------ | -------------------------------- | ---------------------------------- |
| production | cms | `_default`   | `https://cms.codeware.se`        | Host mode — the ticket's subject   |
| production | cms | `demo`       | `https://demo.codeware.se`       | **Adoption suppressed**            |
| production | cms | `ks-vininfo` | `""`                             | Adoption live                      |
| production | web | `demo`       | `https://demo-remix.codeware.se` | **Dead config** — nothing reads it |
| preview    | cms | `demo`       | `https://pr-test.codeware.se`    | Stored as a _secret_, not env      |

Three things follow.

**`demo`'s adopted domain is decorative.** `adoptTenantDomains` gates only the `serverURL`
assignment on `!process.env['CUSTOM_URL']`; `cors` and `csrf` still take the adopted
origins. So the admin UI shows a validated primary domain, the browser works, and the app's
identity comes from the env var regardless — indistinguishable from outside precisely
because both name `demo.codeware.se`. Clearing the variable is what makes the row real.

**`ks-vininfo` already runs the intended way, by accident of falsiness.** `CUSTOM_URL=""`
is falsy, so adoption applies. That empty string is the existing convention for "don't
override" — `DISABLE_DOMAIN_ADOPTION` just names it.

**`apps/web` never reads `CUSTOM_URL`.** Its schema (`env-resolver/env.schema.ts`) has only
`PAYLOAD_URL`. The production value is baked into the Fly app env and consumed by nothing,
so removing it is a pure delete with no code change.

Before clearing `demo`'s value, confirm its primary domain row in the admin actually names
`demo.codeware.se`. If the row says something else, clearing the variable moves the app's
url rather than preserving it.

## Decisions

**A collection, not a Payload global.** "Global" already means something else here:
`globalCollectionSlugs` (`navigation`, `site-settings`) are collections the multi-tenant
plugin marks `isGlobal: true`, i.e. one document _per tenant_. Payload's native `globals`
are used nowhere. Introducing them would put a third meaning on the word, skip
`collections.spec.ts` (which reads `*.collection.ts` off disk and enforces the access
invariants that caught COD-425), and sit outside `use-visible-collections.ts`. A collection
follows `platform-labels` exactly: in `platformCollectionSlugs`, absent from
`tenantCollectionSlugs`, `systemUserAccess` on write.

Singleton-ness is ours to enforce, since the plugin's `isGlobal` is unavailable to a
collection with no `tenant` field. A `beforeValidate` hook refusing a second row is enough —
same shape as `platform-labels/hooks/ensure-unique-label.ts`.

**Every boot-read value degrades to a default.** A missing row or a failed query logs and
carries on, matching `adoptTenantDomains`' catch block.

**Restart is still required.** `onInit` runs once; editing the row afterwards changes
nothing until the process restarts. Reuse the `restart-card` from `@codeware/app-cms/ui/domains`.

## Steps

Stop after each for acknowledgement.

### 1. Extract the domains field

- Lift the `domains` array (`tenants.collection.ts:116-197`) into a field factory in
  `libs/app-cms/ui/fields`, following the `iconPickerField({ override })` convention.
- Re-point `tenants.collection.ts` at it. No behaviour change, no migration — this step
  should produce an identical schema.
- `nx test cms -- --testPathIgnorePatterns '/.next/'`.

### 2. Collection scaffold

- `apps/cms/src/collections/platform-settings/platform-settings.collection.ts` — slug
  `platform-settings`, `admin.group: adminGroups.settings`, `hidden` for non-system-users,
  `read: authenticatedAccess`, `create/update/delete: systemUserAccess`, en/sv labels and
  descriptions. Shape follows `platform-labels.collection.ts`.
- The extracted domains field, described for the host app rather than a workspace.
- `hooks/ensure-single-row.ts` — `beforeValidate` refusing a create when a row exists.
- Register in `collections/index.ts`; add the slug to `platformCollectionSlugs`.

### 3. Migration and types

- `nx payload cms migrate:create cod_436_platform_settings` — the target ignores `--name`,
  so rename the file and its `index.ts` entry by hand to
  `YYYYMMDD_HHMMSS_cod_436_platform_settings.ts`.
- `nx payload cms generate:types`, commit the regenerated `payload-types.ts`.

### 4. Boot read

- `apps/cms/src/utils/adopt-platform-domains.ts` — one `find` on `platform-settings`,
  `limit: 1`, `depth: 0`; `adoptableDomains(settings.domains, env.APP_NAME)`; apply
  `serverURL`/`cors`/`csrf` exactly as `adoptTenantDomains` does. Host mode only.
- Call from `onInit` before `adoptTenantDomains`, inside the existing build guard.
- Spec covering: no row, no domains, uncertified domain, non-primary domain, tenant mode,
  and `DISABLE_DOMAIN_ADOPTION` set.

### 5. The break-glass flag

- `DISABLE_DOMAIN_ADOPTION` in `EnvSchema` via `coerceBoolean(false)`, next to
  `DISABLE_DB_PUSH`.
- Honour it in both `adoptTenantDomains` and `adopt-platform-domains.ts`, replacing the
  `!process.env['CUSTOM_URL']` check.
- Leave `CUSTOM_URL` in `EnvSchema` for now — removing it is step 7.

### 6. Admin affordances

- Certificate and restart both currently resolve the Fly app from the _tenant's_ domain
  rows (`tenant-domain-certificate.ts`, `tenant-machine-restart.ts:57-63`). Host mode has no
  tenant, so each needs a branch keyed on `env.APP_NAME` — the guard's intent is unchanged,
  only where the allowed app name is read from.
- Reuse `DomainsField` / `restart-card`; new i18n keys in `custom-translations.ts` (en + sv)
  only where the tenant copy does not fit.

### 7. Retire `CUSTOM_URL`

Last, and only once step 4 is deployed and verified. Clearing a value is what activates the
database row behind it, so each one is a cutover, not a tidy-up — do them one at a time and
watch the app come back on the right url.

Order, easiest first:

1. **production `web` / `demo`** — dead config, nothing reads it. Pure delete.
2. **production `cms` / `ks-vininfo`** — already `""`. Delete the empty key.
3. **production `cms` / `demo`** — confirm the admin's primary domain row says
   `demo.codeware.se`, then clear. Adoption takes over on the next restart.
4. **production `cms` / `_default`** — the host cutover, and the ticket's headline case.
   Needs the `platform-settings` row created first with `cms.codeware.se` against the host
   Fly app, a certificate issued through the panel, and the row marked primary. Only then
   clear the variable.
5. **preview `cms` / `demo`** — stored as a _secret_ rather than env, so it is edited in a
   different place from the rest.

Then remove `CUSTOM_URL` from `EnvSchema` and from `APP_MODE.serverURL`'s fallback chain.

- `docs/DEPLOYMENT.md`: drop it from the examples, document `DISABLE_DOMAIN_ADOPTION`, and
  state the boundary rule — secrets and reach-the-deployment config stay in Infisical/env,
  everything else platform-wide goes in the collection. Note `MAINTENANCE_MODE` staying in
  env deliberately: it is read in `proxy.ts` middleware and has to work when the database is
  what is broken.

### 8. Wrap up

- `pnpm nx format:write`, then `nx affected -t lint typecheck` and `nx run cms:build`.
- Commit per step, branch, PR.
- Ask the user to run `nx verify cms` and `nx test-migrate cms` (both interactive/slow).

## Known, not ours

- `nx test cms` fails on a stale `.next/standalone` copy of the specs; work around with
  `-- --testPathIgnorePatterns '/.next/'`.
- A regenerated migration after a preview deploy needs that PR's database dropped.
