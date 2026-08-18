# COD-441 — Drop the domains panel's Infisical secrets report

Rides on the [COD-440](https://linear.app/codeware/issue/COD-440) branch
`cod-440-retire-custom_url-cut-infisical-over-to-platform-settings` — same branch, same PR.
The panel bug is COD-357's, but COD-440's cutover is what turns it from an occasional false
positive into a permanent one, so the two must not land apart.

## Status

Done, on the COD-440 branch, not merged.

`nx affected -t lint typecheck` (16 projects), `nx run cms:build`, `cms` tests (11) and
`app-cms-feature-domains` tests (66, down from 83 — exactly the two deleted specs' 17 tests)
all pass. Manual admin verification (healthy domain shows nothing red; pending/needs-restart
cases still surface) is still open — see "What to verify."

| Step | What                               | State |
| ---- | ---------------------------------- | ----- |
| 1    | Remove the feature-lib half        | Done  |
| 2    | Remove the ui half                 | Done  |
| 3    | Unwire the endpoints and the panel | Done  |
| 4    | Drop the translations, wrap up     | Done  |

## The bug

Every domain card shows a red **"Nothing in Infisical points at this domain"** after a
_Check now_, including domains that are fully healthy — active certificate, correct dns,
serving traffic. Observed on tenant `demo` for `demo.codeware.se` (cms) and
`demo-remix.codeware.se` (web), both "Active", both red.

Two destructive-styled messages come out of `SecretsReport`
(`libs/app-cms/ui/domains/src/lib/secrets-report.tsx`): `secretsMissing` when nothing at
all matched, and `corsMissing` when nothing that matched carries the `cors` tag. The
observed one is `secretsMissing`. Behind both is `findDomainSecrets`
(`libs/app-cms/feature/domains/src/lib/find-domain-secrets.ts`), which walks every folder
under `/tenants` in Infisical and matches a secret's _value_ against the hostname.

## What was verified

Read directly, not taken from the earlier summary:

- **No browser calls the cms cross-origin.** `apps/web`'s client code fetches only
  `/form-submission` and `/tour-signup` — relative paths on web's own Hono/Remix server
  (`apps/web/app/root.tsx:225,250`). Those resource routes reach the cms server-side with an
  api key, which is not subject to cors at all. `payloadUrl` reaches the client only for
  asset urls.
- **The property is already guarded.**
  `libs/shared/ui/cms-renderer/src/lib/providers/no-cross-origin-fetch.spec.ts` scans
  `cms-renderer`, `apps/web/app` and `apps/cms/src/app/(site)` and fails on any `fetch()`
  whose url literal is not relative.
- **The cases the earlier analysis had not checked come out the same way.** cms's `(site)`
  pages are rendered by the same Next app that serves `/admin`, so they are same-origin.
  Live preview's url function returns a relative `/api/preview?redirect=…`
  (`apps/cms/src/payload.config.ts:116-128`) and returns `null` outright in host mode — the
  iframe is never cross-origin. Each deployment's admin talks to its own api on its own
  host; a system user browsing the host cms never reaches a tenant deployment's api from the
  browser. No GraphQL playground is enabled.
- **`cors`/`csrf` only ever gate the browser.** `node_modules/payload/dist/utilities/headersWithCors.js`
  sets `Access-Control-*` response headers and nothing else; `extractJWT.js` consults
  `config.csrf` only in its `cookie` strategy. A `Bearer`/api-key call ignores both.
- **A cms domain already gets cors/csrf from the database.** `adoptTenantDomains` /
  `adoptPlatformDomains` extend `config.cors` and `config.csrf` with every issued domain for
  this app (`adoptableDomains` filters on `domain.app === APP_NAME` and
  `certificate.isConfigured`), independent of Infisical.
- **`CORS_URLS` defaults to `'*'`.** It is only narrowed when `loadEnv` actually reaches
  Infisical at boot and finds `cors`-tagged secrets under `/tenants`
  (`libs/app-cms/feature/env-loader/src/lib/load-env.ts:57-72`). When that set is empty the
  value becomes `''`, and `payload.config.ts:155-161` resolves to `[FLY_URL]` plus whatever
  adoption adds — which is the correct set anyway.
- **`matchesDomain` has exactly one consumer**, `findDomainSecrets`, plus its own spec and
  the barrel export. `parseHostname` is used widely and stays.
- **The lib keeps its Infisical dependency** either way — `get-fly-api.ts` uses
  `getIntegrationCredentials`.

## Decisions

**Delete the check rather than soften it.** The report's own docblock states its premise:
"the app has to be _told_ to serve that url, and the cms has to accept it as an origin —
both of which live in Infisical and are edited by hand." Both halves of that are now false.
The url comes from the database (COD-436's `platform-settings.domains`, the tenant row's
`domains`) and is applied at `onInit`; COD-440 deletes the last Infisical value that ever
named a custom domain, after which `secrets.length` is zero for every hostname and the red
warning is unconditional. The `cors` half never had a consumer to begin with: nothing in
this codebase makes a browser-originated cross-origin call to the cms, cms's own domains
already get `cors`/`csrf` from adoption, and the one architectural change that could
reintroduce the need is caught by `no-cross-origin-fetch.spec.ts` — a build-time guard,
which is a better place for it than a warning a system user has to press a button to see.
Worse than useless, the check was actively misleading before the cutover too: the secret it
found for `demo-remix.codeware.se` is `/tenants/demo/apps/web/CUSTOM_URL`, which COD-440's
cutover table documents as dead config, and the panel rendered it with a green check as if
it were the wiring that makes the site work.

**Rejected: keep it but style it as informational.** That trades a false error for a
permanent, unactionable note on every card — the panel would still be telling a system user
to go and edit a secret that must not exist any more. A neutral colour does not make a wrong
statement right.

**Rejected: gate it on a "this domain needs manual cors wiring" case.** There is no such
case to gate on. Every domain the panel can list is one served by a Fly app in our own org,
written down against that app; adoption covers it. An origin that would genuinely need a
hand-written cors entry is by definition not a row in this panel.

**Not touched: `loadEnv`'s `cors`-tag scan.** It is the boot mechanism, separate from the
panel, documented in `DEPLOYMENT.md`, and this change leaves boot behaviour byte-identical.
Retiring it is a decision for another ticket with its own verification.

**Not replaced.** The signal the report reached for — "a certificate is not the same as a
working site" — is already carried twice: Fly's own `check.issues` box, and the restart
button with `restartHint` COD-357 added for exactly the "validated but not picked up yet"
case. A side benefit of the removal is that _Check now_ stops doing two authenticated
Infisical logins and a full walk of `/tenants` per press.

## Steps

Stop after each for acknowledgement.

### 1. Remove the feature-lib half

- Delete `libs/app-cms/feature/domains/src/lib/find-domain-secrets.ts` and its spec.
- Delete `libs/app-cms/feature/domains/src/lib/match-domain-secret.ts` and its spec —
  `findDomainSecrets` is its only consumer.
- Drop `DomainSecret`, `DomainSecretsReport`, `findDomainSecrets` and `matchesDomain` from
  `libs/app-cms/feature/domains/src/index.ts`. Leave `parseHostname` and the `getFlyApi`
  Infisical import alone.

### 2. Remove the ui half

- Delete `libs/app-cms/ui/domains/src/lib/secrets-report.tsx` and its `export *` line in
  `libs/app-cms/ui/domains/src/index.ts`.
- `domain-card.tsx`: drop the `SecretsReport` import, the `secrets` prop, the render block,
  and the `secretCorsTag` / `secretsMissing` / `secretsUnavailable` / `corsMissing` labels.
- `domain-card.stories.tsx`: drop the four `secrets={…}` props and the labels above them.
  `NeedsAttention` loses two cards that existed only to show the missing/untagged states and
  keeps paused / active / pending / unsaved; the `AttentionAdmin*` a11y stories wrap it and
  need no other change.

### 3. Unwire the endpoints and the panel

- `apps/cms/src/endpoints/tenant-domain-certificate.ts` and `platform-domain-certificate.ts`:
  drop `secrets` from `Result`, the `findDomainSecrets` call and its `Promise.all` slot in
  the `check` branch, the two `secrets: null` literals, and the import. The comment above
  the `check` branch in the tenant endpoint ("Both halves in one answer…") goes with it.
- `apps/cms/src/components/admin/domains/DomainsPanel.client.tsx`: drop the `secrets` state
  and its setter, the `secrets` field on `Row` and on the response type, the merge into
  `secrets[hostname]`, the `secrets={row.secrets}` prop and the four label lookups.
- No import-map regeneration needed — no admin component is added, removed or re-pathed.

### 4. Drop the translations, wrap up

- `libs/app-cms/util/i18n/src/lib/custom-translations.ts`: remove `corsMissing`,
  `secretCorsTag`, `secretsMissing` and `secretsUnavailable` from the schema and from both
  the `en` and `sv` blocks.
- `pnpm nx format:write`, then `nx affected -t lint typecheck` and
  `nx test cms -- --testPathIgnorePatterns '/.next/'`.
- `nx run cms:build` — the panel and both endpoints are in the cms build.
- Commit onto the COD-440 branch; the PR covers both tickets.

## What to verify

- `nx affected -t lint typecheck` — catches every dangling import and the `DomainCardProps`
  label object, which is exhaustive.
- `nx test cms -- --testPathIgnorePatterns '/.next/'` plus the `app-cms` lib tests — the two
  deleted specs go with their subjects; nothing else asserts on the report.
- **Manual, in the admin:** on a healthy domain (`demo.codeware.se`), press _Check now_ and
  confirm the card shows status, `checked …` and nothing red.
- **Manual, the still-broken case:** a domain with a pending certificate must still show
  Fly's `check.issues` box and the dns records, and an app with a newly validated domain must
  still show the restart button and `restartHint`. Those are what now carry "issued but not
  yet live" — if either has regressed, the removal went too far.
- `nx verify cms` is the user's to run if anything looks off; nothing here touches the
  database, so `nx test-migrate cms` is not implicated.

## Out of scope

- `loadEnv`'s `cors`-tag scan and the `CORS_URLS` env plumbing — see Decisions.
- COD-357's plan doc records "The Infisical check searches by value, not by path" as a
  decision. It is now superseded by this file rather than edited; the history is worth
  keeping intact.
