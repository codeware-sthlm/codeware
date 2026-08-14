# COD-357 — Custom tenant domains

Branch `cod-357-support-custom-tenant-domain`. Lets a workspace be reached on its own
domain instead of only its `.fly.dev` address, with certificates managed from the admin.

## Status

Done and committed:

| Commit                           | What                                                              |
| -------------------------------- | ----------------------------------------------------------------- |
| `150990c8`                       | Guard test: no browser code fetches the cms api cross-origin      |
| `2407861b` `4605b2b4` `206ab501` | `FlyApi` — certificates over Fly GraphQL, fixtures, drift check   |
| `2dd12907`                       | `@cdwr/fly-node/api` subpath entry point                          |
| `70fe0a47`                       | `getIntegrationCredentials` + `getFlyApi`                         |
| `02a5bceb` `baad180c`            | `domains` on the tenants collection, regenerated types            |
| `25e4ed14`                       | Domains panel: request / check / remove, dns instructions         |
| `aac08445`                       | Infisical sync report folded into the check action                |
| `41703ae7`                       | Migration `20260813_224231_cod_357`                               |
| `8273f92b`                       | Boot adoption in `onInit`                                         |
| `f0dbecab`                       | `FlyApi.machines` — list and sequential restart over the REST api |

Remaining:

1. **Restart button in the domains panel.** One button per distinct Fly app that has at
   least one active certificate — _not_ one per domain row, since several domains can
   share an app and two buttons for one restart reads as two different actions. Needs a
   new endpoint action (or endpoint) calling `fly.machines.restart(app)`, system-user
   only like `tenant-domain-certificate`. Copy: a newly validated domain only takes
   effect after the app restarts.
2. **README section** for the machines half of `FlyApi`, under the existing
   "Without the CLI: `FlyApi`" heading in `packages/fly-node/README.md`.

Then: PR, and ask the user to run `nx verify cms` (interactive).

## Decisions that are expensive to re-derive

**Two Fly APIs, deliberately not hidden.** Certificates go over GraphQL
(`api.fly.io/graphql`); machines go over the REST Machines API
(`api.machines.dev/v1`). GraphQL's machine mutations are Nomad-era and no longer apply.
One token authenticates both. The two have different failure shapes — GraphQL returns
HTTP 200 with an `errors` array, REST uses the status code and puts the reason in
`error` — so they have separate request helpers.

**A missing certificate is an answer, not a fault.** Fly reports a hostname with no
certificate as a `NOT_FOUND` GraphQL error alongside a null field, not as a plain null.
`certs.get` translates that to `null`; `FlyApiError.isNotFound` is how, and it checks
the code rather than the message text. This was found by the integration test — the
mocked test asserted a response shape Fly never sends, and passed.

**`@cdwr/fly-node/api` exists because of `node-pty`.** The root barrel reaches
`@codeware/shared/util/misc`, which pulls in a native pty module. Importing it from the
cms would drag that into the Next server build. Verified in the built output: `api.js`
has zero references to `node-pty`/`spawnPty`, `index.js` has three. A
`no-restricted-imports` rule (`flyNodeApiOnly`, exported from the root eslint config and
spread into `apps/cms` and `libs/app-cms/feature/domains`) keeps the barrel out. It has
to live in the _project_ configs — a workspace-relative `files` glob in the root config
never matches, because project lint runs from the project directory.

**The Fly token is never in `process.env`.** It is read on demand from
`/integrations/fly/API_TOKEN` and cached in-process for five minutes. An org-scoped
token can attach a certificate to any app in the organisation; one that never enters
the environment cannot leak through a child process, a crash dump or an env listing.
A missing folder disables the feature rather than failing boot.

**The panel does not call Fly on render.** It shows what was stored at the last check,
with `checked …` next to it. The workspace view then survives a Fly outage and every
call is one somebody asked for. This is why the certificate group on the domain row is
stored at all, and why it is `admin.hidden` — eight read-only inputs per row would bury
the two fields that are actually filled in.

**`isApex` comes from Fly, never from counting labels.** `example.co.uk` is an apex with
three labels. Any heuristic would be wrong for every multi-part public suffix, and an
apex cannot use a CNAME — so getting it wrong sends someone to create a record their
registrar will reject.

**The Infisical check searches by value, not by path.** An Infisical tenant id is not a
Payload tenant slug (`docs/DEPLOYMENT.md` says so explicitly), so there is no mapping to
follow. Searching every `/tenants/**` folder for a secret pointing at the hostname also
surfaces a domain wired up under the _wrong_ workspace. Two reads — one plain, one
filtered by the `cors` tag — because the api's own tag filter is trustworthy and the
SDK's `tags` field is typed `string[]` while the api returns objects. Read-only: it
reports, it never writes.

**Boot adoption happens in `onInit`, and here is why it cannot happen earlier.** The
original plan was a raw SQL read before `buildConfig`. That does not work: the tenant is
identified by its API key, which Payload stores encrypted and decrypts on read, so raw
SQL would mean reimplementing that decryption. Instead `adoptTenantDomains` runs from
`onInit`, after the connection is up and before the first request, using
`resolveScopedTenant`. It works only because Payload reads `cors`, `csrf` and
`serverURL` from the live config **per request** rather than capturing them at sanitize
time — verified in the installed source, pinned by
`apps/cms/src/utils/adopt-tenant-domains.spec.ts`, and confirmed by deliberately
breaking `headersWithCors.js` and watching the guard fail. That spec failing after a
Payload upgrade means adoption needs another way in, not that Payload is broken.

**A domain is adopted only once its certificate is issued**, and only when explicitly
marked primary. Adopting early would move every generated link — including the password
reset that gets a locked-out editor back in — onto a hostname that fails TLS. Adopting
whichever validated first would move an app's url out from under it as a side effect of
adding a second domain. `CUSTOM_URL` still wins if set; a lookup failure logs and leaves
the app on its `.fly.dev` address, which is how support reaches it.

**Restarts are sequential on purpose.** Applying a boot-read setting should not cost the
app its availability. A machine that fails to restart stops the run rather than being
skipped — a half-restarted app runs two configurations at once, and returning "some of
them" invites calling that done.

## Known, not ours

- `nx test cms` fails on a stale `.next/standalone` copy of the specs. Pre-existing;
  work around with `-- --testPathIgnorePatterns '/.next/'`.
- Two `fly-cli` integration tests fail on flyctl version drift — the snapshot pins
  `0.4.33` (commit `34b66373`), local is `0.4.80`. Unrelated to this branch.
- `nx payload cms -- migrate:create --name <x>` ignores `--name`; the file and its
  `index.ts` entry were renamed by hand to match the repo convention.

  > **Correct migration script**
  >
  > ```sh
  > nx payload cms migrate:create <name>
  > ```
