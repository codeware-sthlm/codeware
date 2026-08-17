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
| `05abdb5d` | Steps 4+5: `adoptPlatformDomains` boot read + `DISABLE_DOMAIN_ADOPTION` flag, built together                                        |
| `1128398a` | Step 6: `platform-domain-certificate` / `platform-machine-restart` endpoints, `PlatformDomainsField` panel                          |
| `1fcd8ff9` | Step 6 follow-up: `guardDomainConflicts` widened across both domain-owning collections, wired onto `platform-settings`              |
| `bca346c8` | Type-safety fixup: removed the `docs as Array<TenantWithDomains>` cast — see deviation note below                                   |
| `ede5b8d2` | Step 7 (docs half only): `DEPLOYMENT.md` boundary rule + `DISABLE_DOMAIN_ADOPTION` documented                                       |
| `23d5e089` | Fix: reordered the migration's down statements — see finding below, found by `nx verify cms`                                        |

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
- `migrate:create <name>` (positional arg, not `--name`) named the file correctly on the
  first try — no manual rename needed, unlike the COD-357-era `--name` quirk noted below.
- **Steps 4 and 5 built together, not sequentially.** Step 5's plan text ("Honour it in
  both `adoptTenantDomains` and `adopt-platform-domains.ts`, replacing the
  `!process.env['CUSTOM_URL']` check") only makes sense once `DISABLE_DOMAIN_ADOPTION`
  exists — writing step 4 first against the old `CUSTOM_URL` check would mean throwaway
  code. `DISABLE_DOMAIN_ADOPTION` (`coerceBoolean(false)`, next to `DISABLE_DB_PUSH`) landed
  in the same commit as both `adopt*Domains` functions. `CUSTOM_URL` itself is untouched —
  still feeding `APP_MODE.serverURL`'s fallback chain, per step 7's sequencing. The flag only
  gates `serverURL`, matching the old `CUSTOM_URL` check's scope exactly; `cors`/`csrf` still
  accept an adopted origin regardless — a deliberate carry-over, not an oversight (an issued
  certificate means the origin really is being served, whatever the identity override says).
- **`adoptPlatformDomains` has no spec, by explicit user decision.** Importing anything from
  `@codeware/app-cms/feature/domains`'s barrel — even the payload-free `adoptableDomains` —
  pulls in `guardDomainConflicts`, which imports `payload` as a value; jest can't parse
  Payload's ESM build, so any spec importing the function fails before a test runs. This is
  the same wall `adoptTenantDomains` already lived behind — its own spec never imports the
  function, only pins Payload source assumptions. Offered a narrow-subpath fix (mirroring
  `@cdwr/fly-node/api`); declined. Verification is `nx verify cms` plus manual admin checks.
  Both functions now carry a comment explaining the gap.
- **Flagged, not fixed: `feature/domains` has outgrown clean separation of concerns.** It
  mixes pure utilities (`adoptableDomains`), Payload-coupled hooks (`guardDomainConflicts`),
  a UI field factory (`domainsField`, added in step 1), and external API integration
  (`getFlyApi`, `findDomainSecrets`). That mixing caused both the step-1 module-boundary
  problem and the step-4 jest wall above. No refactor in this ticket — noted for a future
  one. `domainsField` and `validateHostname` are the two most likely candidates to move.
  Saved to memory (`feedback_feature_lib_soc`) since it's a standing preference, not just
  this ticket's problem.
- **Certificate and restart got their own endpoints, not a branch inside the tenant ones.**
  `platform-domain-certificate.ts` / `platform-machine-restart.ts` mirror
  `tenant-domain-certificate.ts` / `tenant-machine-restart.ts` closely — same guard, same
  response shape — rather than threading a collection discriminator through the existing,
  already-shipped (COD-357) tenant endpoints. Lower risk to a working production path, at
  the cost of near-duplicate control flow; consistent with how `adoptPlatformDomains` already
  mirrors `adoptTenantDomains` rather than sharing a body. `DomainsPanel` itself needed only
  one new prop (`subject: 'tenant' | 'platform'`) to pick which pair of paths to call —
  `useDocumentInfo()`'s `id` is already collection-agnostic, so the same panel component
  renders correctly on `platform-settings` with no other change.
- **Caught before it shipped: `overrideAccess` defaults to `true` in Payload's Local API**,
  not `false`. The new endpoints' first draft read `platform-settings` with no explicit
  `overrideAccess`, silently bypassing access control — unlike the tenant endpoints' explicit
  `overrideAccess: false`. Fixed to match; every read in the new endpoints is now explicit
  about which way it goes, matching the sibling files' existing style.
- **Fixed rather than deferred: `guardDomainConflicts` had no reach into `platform-settings`
  at all, in either direction.** It's now collection-aware via `collection.slug` from its own
  hook args, checks `['tenants', 'platform-settings']` for a hostname clash, and self-exclusion
  is scoped to matching both the id _and_ the collection — ids are not unique across tables,
  so a tenant #1 must never be treated as "self" when saving platform-settings #1. This was
  worse than "the cross-collection case is uncaught": `platform-settings.domains` had _no_
  hooks at all before this — not even `normalizeDomains` or the within-document duplicate/
  two-primaries checks — which directly contradicts the ticket's own pitch for the collection
  ("gives that class of config field validation"). Now attached to `platform-settings` too.
  `domainTaken`'s message changed from `'…the workspace "{{tenant}}"'` to a collection-neutral
  `'…{{owner}}'`, with two new short i18n keys (`domains:ownerWorkspace` / `ownerPlatform`)
  building the phrase in code rather than nesting a translation call inside another.
- **`guardDomainConflicts` rewritten to drop its one remaining `as` cast, on request.** Looping
  `req.payload.find({ collection: slug, ... })` over `DOMAIN_OWNING_COLLECTIONS` (a union of two
  literals) made Payload's generic `find` fall back to an index-signature type for `docs`,
  silently hiding real shape mismatches behind property-access errors that only a cast could
  suppress. Replaced with two explicitly-literal-typed calls (`'tenants'`, `'platform-settings'`,
  run via `Promise.all` — free parallelism, not why it was done) feeding a shared `checkClaims`
  helper typed `ReadonlyArray<TenantWithDomains>`; `Tenant`/`PlatformSetting` are structurally
  compatible with that type by design, so no cast is needed to pass them in. Also added a
  runtime guard: Payload's hook types don't restrict which collection a
  `CollectionBeforeChangeHook` may be attached to, so `DOMAIN_OWNING_COLLECTIONS` (now typed
  `satisfies readonly CollectionSlug[]`, catching a rename at compile time) doubles as a real
  check that the hook is wired up somewhere it actually knows how to handle.
- **Step 7 stopped short of the live cutover.** The plan's own text says the `CUSTOM_URL`
  removal is "last, and only once step 4 is deployed and verified" — nothing has deployed yet,
  this is still a local branch. Removing `CUSTOM_URL` from `EnvSchema`/`APP_MODE.serverURL`'s
  fallback now would break `_default` and `demo` in production the moment it merges, since
  Infisical still sets it for both. Did the safe, code-only half: `docs/DEPLOYMENT.md` now
  documents the boundary rule, `DISABLE_DOMAIN_ADOPTION`, and `CUSTOM_URL`'s retirement —
  worded as in-progress, not already done. The five-secret Infisical cutover (see "What
  Infisical actually holds" above) and the `EnvSchema`/fallback-chain removal are a manual
  follow-up for once this branch is live and the `_default` cutover has been verified working.

**`nx verify cms` caught a real bug in the migration's `down`, and it is not ours alone.**
`DROP TABLE "payload"."platform_settings" CASCADE` auto-drops the FK constraint on
`payload_locked_documents_rels` that references it — Postgres CASCADE reaches across tables,
not just within one. The generated migration then tried to `DROP CONSTRAINT` that same FK
_after_ the CASCADE had already removed it, so the down failed with "constraint … does not
exist." Fixed by reordering: drop the `payload_locked_documents_rels` index, constraint and
column _before_ dropping the `platform_settings` tables, mirroring the up migration's order
in reverse. Verified locally with a real down → up round-trip (schema and FK confirmed
restored via `psql`) before asking for `nx verify cms` again.

This is a **pre-existing bug in Payload/Drizzle's migration codegen**, not something
introduced here — the identical ordering exists in the already-shipped
`20260809_085018_cod_376.ts` (`platform_labels`'s FK on the same
`payload_locked_documents_rels` table, same CASCADE-then-explicit-drop pattern). It never
surfaced there because `verify-last-migration.ts` only exercises the _most recent_ migration;
`cod_436` was simply the first one since to land as "last" while someone ran `verify`. Worth
a small follow-up ticket to check whether other already-shipped migrations facing new
platform/global collections have the same latent issue — not fixed here, since editing an
already-deployed migration is a different risk profile than editing this branch's own,
never-deployed one.

## Handoff

Branch is ready for PR. Everything code-side is committed and passes lint, typecheck (`nx
affected -t lint typecheck` — 29 projects, clean) and `nx run cms:build` (production build,
clean). `nx test cms` (11 tests) and `app-cms-feature-domains` (13 tests, all new) pass.
`nx verify cms` found the migration bug above; after the fix, a manual down/up round-trip
locally confirmed the schema restores correctly.

Two things still need you directly, both interactive/slow by convention on this project:

- Re-run `nx verify cms` to confirm the fix in CI-equivalent conditions, and `nx test-migrate
cms` — ask for both before merging.
- After merge and deploy: the step 7 live cutover above (five Infisical values, in the order
  listed under "What Infisical actually holds"), then the `CUSTOM_URL` code removal as a
  follow-up PR once `_default` is confirmed serving from `platform-settings` correctly.

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
