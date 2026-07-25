# COD-405 — `packages/` strategy: value, constraints, lib-refactor candidates, versioning

**Type:** Decision / spike
**Status:** Proposed (awaiting sign-off)
**Related:** COD-403 (TypeScript 6 bump — deferred `node10`/`ignoreDeprecations` work)

> Implementation of the refactors and the `nx.json` release changes below should spin
> off as separate tickets once the direction is agreed (see [Follow-up tickets](#follow-up-tickets)).

---

## TL;DR

- The TS 6 friction (COD-403) comes from exactly **three** packages — the CJS/`node10` Nx
  plugins (`nx-payload`, `create-nx-payload`, `nx-ai`). Every other package uses the
  workspace-default ESM/bundler config and imposes no friction.
- **No app or internal lib consumes any `@cdwr/*` package.** Packages consume _each other_
  through the internal `@codeware/*` source aliases; `@cdwr/*` is purely the **published
  identity**. "Internal consumption of a published package" is therefore an alias artifact,
  not a real coupling.
- **`@cdwr/core` has no external consumer → move it to `libs/` (split along its `exports`
  seams) and deprecate on npm.** This also _solves_ the "forced copies" problem: the copies
  exist because a published library can't cleanly import an unpublished lib, and because `core`
  is a heavy monolith. As a lib it can be shared freely (§3a).
- **The 9 GitHub Action packages should leave the npm release set.** A GitHub Action is never
  consumed from npm — ours are wired only as `uses: ./packages/…` local paths, and their
  `runs.main` points at an **uncommitted `dist/`** artifact, so an external
  `uses: owner/repo/path@ref` cannot work either. Publishing them to npm is dead weight.
- **Recommended versioning: hybrid `release.groups`** over a smaller npm set — a _fixed_ group
  for the Nx-plugin suite, _independent_ for the standalone packages, actions excluded entirely.
- **Version the apps too** (`cms`, `web`) via `nx release` without publishing, so the Sentry
  release becomes a human-readable `name@version+sha` and an "About" UI can surface it — today
  it's a raw commit sha and a `web/todo:version` placeholder (§6).

---

## 1. Value of publishable `packages/`

Keeping `packages/` as a first-class concept (vs. collapsing into `libs/`) is justified — but
only for a subset:

| Value                                                                                                    | Applies to                                                            |
| -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| **External distribution / reuse** — meant to be `npm install`-ed outside this repo                       | `nx-payload`, `create-nx-payload`, `nx-ai`, `fly-node`                |
| **Public-API discipline** — `exports` maps, semver, changelogs, published `.d.ts` force clean boundaries | `core`, `fly-node`, the plugins                                       |
| **Versioned distribution of CI building blocks**                                                         | GitHub Actions — _in principle_ (see §4: not actually achieved today) |

The discipline value is real and worth preserving for the genuinely-external surface. It is
**not** a reason to keep a package publishable when nothing outside the repo consumes it.

## 2. Constraints packages impose on the workspace

| Constraint                                                                                                                                                               | Where it bites                                                                                                                               | Scope today        |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| **CJS + `node10` resolution** — deprecated in TS 6, held with `ignoreDeprecations: "6.0"`; `node16`/`nodenext` needs explicit `.js` extensions + ESM/CJS interop changes | `nx-payload`, `create-nx-payload`, `nx-ai` **only**                                                                                          | 3 packages         |
| **`exports`-map / deep-import friction** — e.g. `apps/cms/payload.config.ts` reaching a plugin internal (fixed in COD-403 via the public `/utilities` subpath)           | `nx-payload`                                                                                                                                 | rare               |
| **tsconfig divergence** — per-package `module`/`moduleResolution`/`esModuleInterop` overrides vs. bundler-first workspace defaults                                       | same 3 plugins carry `module: commonjs` + `moduleResolution: node10`; `core`/`fly-node`/`nx-migrate-action` only add `esModuleInterop: true` | 3 heavy, few light |
| **Release/versioning overhead** — independent versions, per-project changelogs, tags, `preVersionCommand: build-all` gate                                                | all 14 in the release set                                                                                                                    | whole set          |
| **Dependency handling** — `preserveLocalDependencyProtocols: false`, workspace-protocol rewrite on publish, peer-dep expectations                                        | plugins (`@nx/devkit`, `payload`, `next`, `@anthropic-ai/sdk` peers)                                                                         | plugins            |

**Key finding:** the expensive constraints are concentrated in the 3 Nx plugins. The 9 actions
and the 2 clean libs (`core`, `fly-node`) carry only release-bookkeeping overhead — and for the
actions even that is wasted (§4).

## 3. Per-package audit (external-consumption evidence → verdict)

Evidence gathered:

- **Internal source imports:** no `apps/`, `libs/`, or `tools/` file imports any `@cdwr/*`.
  Packages import each other via `@codeware/*` **source aliases** (`tsconfig.base.json` paths →
  `packages/*/src`). Counts: `@codeware/core/*` ≈ 52 imports, `@codeware/fly-node` 8 — all from
  **other action packages**, none from apps/libs.
- **Workflow refs:** every action is `uses: ./packages/…` (local path) in this repo's own
  workflows. No `owner/repo@ref` external consumption anywhere.
- **npm registry (live check):** which `@cdwr/*` actually exist on npm.

| Package                          | Ver (local/npm) | Module         | npm?            | Internal use                                  | External use                          | Verdict                                                                                                                                                                          |
| -------------------------------- | --------------- | -------------- | --------------- | --------------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@cdwr/nx-payload`               | 2.2.1           | **cjs/node10** | ✅              | via `@codeware/*` none                        | **Yes** (Nx plugin)                   | **Keep package.** Migrate `node10`→`node16` (COD-403 follow-up).                                                                                                                 |
| `create-nx-payload`              | 2.0.3           | **cjs/node10** | ✅              | —                                             | **Yes** (preset scaffolds nx-payload) | **Keep package.** Same migration. Couple to nx-payload version.                                                                                                                  |
| `@cdwr/nx-ai`                    | 0.1.0           | **cjs/node10** | ❌ (unreleased) | —                                             | **Intended** (Nx plugin)              | **Keep package.** Same migration before first publish.                                                                                                                           |
| `@cdwr/fly-node`                 | 0.3.0           | esm            | ✅              | `@codeware/fly-node` (fly-\*/destroy actions) | Intended (Fly CLI wrapper)            | **Keep package.** Clean ESM, no friction. Confirm external demand.                                                                                                               |
| `@cdwr/core`                     | 1.4.4           | esm            | ✅              | `@codeware/core/*` (all action pkgs, ~52)     | **None** (confirmed)                  | **Move to `libs/` + deprecate on npm.** No external consumer; it is already the internal `@codeware/core` foundation. Split into focused libs, don't move as one blob (see §3a). |
| `@cdwr/nx-migrate-action`        | 1.4.1           | esm            | ✅              | `uses: ./` in `nx-migrate.yml`                | **No** (npm publish vestigial)        | **Remove from npm set.** Keep as internal action (§4).                                                                                                                           |
| `@cdwr/nx-pre-deploy-action`     | 0.0.2           | esm            | ✅              | `uses: ./` in `fly-deployment.yml`            | No                                    | **Remove from npm set.** Internal action.                                                                                                                                        |
| `@cdwr/fly-deployment-action`    | 0.4.0           | esm            | ❌              | `uses: ./`                                    | No                                    | **Remove from npm set.** Internal action.                                                                                                                                        |
| `@cdwr/fly-build-action`         | 0.1.0           | esm            | ❌              | `uses: ./`                                    | No                                    | **Remove from npm set.** Internal action.                                                                                                                                        |
| `@cdwr/fly-conditions-action`    | 0.1.0           | esm            | ❌              | `uses: ./`                                    | No                                    | **Remove from npm set.** Internal action.                                                                                                                                        |
| `@cdwr/fly-destroy-action`       | 0.1.0           | esm            | ❌              | `uses: ./`                                    | No                                    | **Remove from npm set.** Internal action.                                                                                                                                        |
| `@cdwr/pr-comment-action`        | 0.1.0           | esm            | ❌              | `uses: ./`                                    | No                                    | **Remove from npm set.** Internal action.                                                                                                                                        |
| `@cdwr/nx-fly-deployment-action` | 0.5.0 / 0.4.0   | esm            | ✅              | **not referenced** in any workflow            | No                                    | **Deprecate/remove.** Superseded by granular `fly-*` actions. Deprecate on npm.                                                                                                  |
| `@cdwr/deploy-env-action`        | 0.1.4           | esm            | ✅              | **not referenced** in any workflow            | No                                    | **Deprecate/remove.** Superseded. Deprecate on npm.                                                                                                                              |

**Summary:** the genuinely-external npm surface is **4 packages** (`nx-payload`,
`create-nx-payload`, `nx-ai`, `fly-node`). `core` moves to `libs/` (no external consumer). The
other 9 are GitHub Actions that should not be npm packages, and 2 of those are already dead.

## 3a. The `packages/` → `libs/` import boundary (the "forced copies" problem)

The open question: **can a package import from `libs/`?** Today code has been _copied_ instead
of shared. The evidence shows the constraint is not uniform — it depends on how the package is
consumed, and there are actually **two** distinct forces:

**Force 1 — the published-surface boundary.** A package that ships to npm as a _library_
(`core`, `fly-node`, the plugins: real `.js` + `.d.ts` + `exports` map) cannot cleanly depend on
an unpublished `@codeware/*` lib: the lib's identifiers leak into the published `.d.ts` (and, if
not fully inlined, into runtime), and won't resolve in an external consumer's `node_modules`. By
contrast, the **GitHub Actions bundle** to a single executable `action.cjs` with **no published
type surface**, so they already import libs freely — `@codeware/shared/feature/infisical` (×7),
`@codeware/shared/util/{node,pure,schemas}`. So: **bundled executables can import libs; published
libraries cannot without leaking or fully inlining.**

**Force 2 — `@codeware/core` is a heavy monolith.** `core`'s `dependencies` include the GitHub
Actions toolkit, `nx`, `@nx/devkit`, `docker-cli-js`, `simple-git`, `@clack/prompts`, etc.
Importing _one_ small util from `@codeware/core` drags that whole graph into the consumer's
bundle. This is documented in
[`libs/shared/util/zod/src/lib/with-env-vars.preprocess.ts`](../libs/shared/util/zod/src/lib/with-env-vars.preprocess.ts):
the preprocessor was pulled _out_ of core into a focused lib precisely because
"using something from core makes the bundle bloated with code you don't need."

**Resolution.**

1. **Move `core` into `libs/`, split along its existing `exports` seams** (`actions`, `release`,
   `utils`, `zod`, `testing`, `vitest-testing`) rather than as one blob. Once it is a lib, it is
   no longer published, so Force 1 disappears (libs import libs freely), and splitting kills
   Force 2 (import `…/zod` without dragging in nx/docker/git). This is exactly what the
   `with-env-vars` TODO asks for. Deprecate `@cdwr/core` on npm.
2. **The action packages keep working unchanged** — they bundle, so importing the new
   `@codeware/*` libs is fine (they already import libs today), and they now pull only the split
   lib they need.
3. **Codify the rule for the packages that stay published** (`fly-node`, plugins): a published
   library may depend only on (a) other _published_ packages, or (b) code it fully bundles
   **including types**. Shared code that must reach a published library either lives inside it or
   is itself published — do not copy blindly. `fly-node` only depends on `zod` today, so this is
   not a live problem; the rule is preventive.

## 4. How GitHub Action packages should be bundled/distributed

**The problem, concretely.** Each action's `action.yml` declares
`runs: { using: node24, main: ../../dist/packages/<name>/action.cjs }`. The `dist/` output is
**not committed** (only `src/` is git-tracked). Actions work in CI only because `nx build` runs
_before_ the `uses: ./packages/<name>` step and materialises `dist/` in the same checkout. This
means:

1. **npm publish is meaningless for actions** — `uses:` never reads from the npm registry. The
   4 published action packages (`nx-migrate`, `nx-pre-deploy`, `nx-fly-deployment`, `deploy-env`)
   gain nothing from being on npm.
2. **External `uses: owner/repo/path@ref` cannot work** — an external checkout has no `dist/`,
   and no build runs. This is the ticket's "defeats the purpose" point.
3. **GitHub Marketplace can't list them** — Marketplace requires `action.yml` at a repo root
   with a committed, runnable entrypoint; a monorepo subpath with uncommitted build output is
   ineligible.

**Can you publish a Marketplace action from a monorepo?** Not directly for Marketplace listing —
Marketplace binds to one `action.yml` at the root of a tagged repo. The established patterns are:

- **(A) Internal-only (recommended default).** Accept that these are internal composite building
  blocks. Keep `uses: ./packages/<name>`, **drop them from the `nx release` project set and
  remove `publishConfig`**, and `npm deprecate` the 4 already-published ones. Zero external
  promise, zero release bookkeeping, no committed `dist/`.
- **(B) Split-repo release (deferred — not now).** Pushing each action's built output (with
  `dist/` committed) to a dedicated `cdwr/<action>` repo would make it Marketplace-eligible and
  consumable as `cdwr/<action>@v1`. This is the standard monorepo-action pattern but adds real
  machinery, and there is no external demand today. **Decision: not pursuing split-repos now.**

**Decision:** go with **(A)**. Actions become internal-only building blocks; no external
distribution is promised. Option (B) stays documented only as a future path if demand appears.

## 5. Versioning model

After §3–§4 the npm-published set shrinks to the plugins + libs. That makes a cleaner model
cheap. Current independent versioning produced the sprawl the ticket flags (2.2.1 / 2.0.3 / 0.1.0
across a coupled plugin family).

**Chosen model: Hybrid via Nx `release.groups`.**

- **`nx-plugins` group — fixed relationship:** `nx-payload` + `create-nx-payload`. The preset
  exists to scaffold the plugin; they ship together. One version removes the preset/plugin skew.
  - `nx-ai` stays **independent** while it's pre-1.0 and maturing on a different cadence; fold it
    into the fixed plugin group once it stabilises.
- **`packages` group — independent relationship:** `nx-ai`, `fly-node`. Distinct, low-frequency
  cadences; independent semver stays accurate. (`core` has left the npm set → `libs/`.)
- **Actions:** **excluded from `nx release` entirely** (option 4A). No npm versioning.
- **Apps (`cms`, `web`):** versioned separately for deploy tracking — see §6.

Rationale: fixed-grouping the tightly-coupled plugins kills the version sprawl and simplifies the
"which versions go together" story, while independent libs avoid forced no-op bumps. This beats a
fully-unified model (which would churn unchanged packages) and the status quo (sprawl + wasted
action releases).

### Implied `nx.json` `release` changes (for the follow-up implementation ticket)

```jsonc
"release": {
  "groups": {
    "nx-plugins": {
      "projects": ["nx-payload", "create-nx-payload"],
      "projectsRelationship": "fixed"
    },
    "packages": {
      "projects": ["nx-ai", "fly-node"],
      "projectsRelationship": "independent"
    }
  },
  // core moved to libs/ (deprecated on npm); actions dropped from the release set
  // (was: "projects": ["packages/*"])
  // ...changelog / version / conventionalCommits / releaseTag unchanged
}
```

Also per action package: remove `publishConfig`, remove it from any release group, and
`npm deprecate` the previously-published ones.

## 6. App versioning & "About" UI (`cms`, `web`)

**Today:** neither app has a `package.json` version, and the **Sentry release is the raw commit
sha** for both — `fly-deployment.yml` sets `NEXT_PUBLIC_SENTRY_RELEASE` / `SENTRY_RELEASE` to
`${{ github.sha }}` (cms) and `SENTRY_RELEASE=${{ github.sha }}` (web). The web server even
carries a literal placeholder: `web/todo:version` in the outbound user-agent
([`apps/web/server.js:376`](../apps/web/server.js#L376)). So there is no human-readable version
anywhere — only opaque shas in Sentry.

**Goal:** a real, human-readable version per app for Sentry tracking and an in-app "About"
surface, while keeping the exact-commit mapping the sha gives.

**Approach.**

1. **Version the apps.** Add a `version` to `apps/cms/package.json` and `apps/web/package.json`
   and bring both into `nx release` as a **`apps` independent group** driven by conventional
   commits. Nx can version + changelog + tag a project **without publishing** it (no
   `publishConfig` / npm publish step), so apps get `cms-x.y.z` / `web-x.y.z` tags without going
   to a registry.
2. **Sentry release format = `name@version+sha`.** Compose the release as e.g.
   `cms@1.4.0+ab12cd3` (Sentry's recommended `package@version+build` form) instead of the bare
   sha. Human-readable in the Sentry UI, still pinned to the exact commit. Set it in
   `fly-deployment.yml` from the app's `package.json` version + `github.sha`.
3. **Inject build metadata for the "About" UI.** At build time expose `version`, short `sha`,
   `deployEnv`, and build timestamp:
   - `cms` (Next): `NEXT_PUBLIC_APP_VERSION` / `NEXT_PUBLIC_APP_SHA` env (public, already the
     pattern used for `NEXT_PUBLIC_SENTRY_RELEASE`), rendered in a small `/admin` About panel.
   - `web` (Remix/Hono): inject the same values (env or a generated `version.json` asset),
     replace the `web/todo:version` placeholder, and expose an About view / `GET /version`
     endpoint.
4. **Single source of truth:** derive both the Sentry release and the About UI from the same
   `package.json` version + sha pair, so they never drift.

> Scope note: this is adjacent to the packages strategy (both are "versioning & release
> hygiene") but independent of the package refactors. It can proceed on its own ticket in
> parallel — captured here because the versioning model (§5) and app versioning share the
> `nx release` / conventional-commits machinery.

---

## Deliverables status

- [x] Decision doc: value vs. constraints (§1–§2)
- [x] Per-package audit table with evidence + keep/move/split verdict (§3)
- [x] `packages/` → `libs/` import-boundary rule (§3a)
- [x] Chosen versioning model + implied `nx.json` changes (§5)
- [x] App versioning & About UI direction (§6)
- [x] Follow-up tickets identified (below)

## Follow-up tickets

1. **`node10` → `node16` migration for the Nx plugins** (`nx-payload`, `create-nx-payload`,
   `nx-ai`) — remove `ignoreDeprecations`, add explicit `.js` extensions, resolve ESM/CJS
   interop. (Already flagged by COD-403.)
2. **Migrate `@cdwr/core` → `libs/`, split along `exports` seams** (§3a) — move to focused libs
   (`…/zod`, `…/utils`, `…/actions`, `…/release`, `…/testing`), rewire the action packages'
   imports, collapse the copied utilities (e.g. `with-env-vars`), and `npm deprecate @cdwr/core`.
3. **De-publish GitHub Action packages** — remove from `nx release` set, drop `publishConfig`,
   `npm deprecate` `nx-migrate-action` / `nx-pre-deploy-action` / `nx-fly-deployment-action` /
   `deploy-env-action`. Keep `uses: ./packages/…` wiring. (No split-repos — §4 decision.)
4. **Remove superseded actions** — delete/retire `nx-fly-deployment-action` and
   `deploy-env-action` (no workflow references; replaced by granular `fly-*` actions).
5. **Apply the hybrid `release.groups` config** to `nx.json` (§5) once the above land.
6. **App versioning + About UI** (§6) — version `cms`/`web` via `nx release` (no publish), switch
   the Sentry release to `name@version+sha`, inject build metadata, and add an About surface /
   `GET /version` (replacing the `web/todo:version` placeholder). Can run in parallel.
7. **Revise docs for the new published surface** — update the root `README`, the `CLAUDE.md`
   packages table, and per-package READMEs so they state clearly **what is published from the
   workspace** (`nx-payload`, `create-nx-payload`, `nx-ai`, `fly-node`) vs. **what is
   internal-but-valuable** (the split `core` libs, the internal action building blocks). Fold
   into tickets #2/#3.

## 7. Execution & rollout

**Branch strategy.** These tickets are _not_ uniform in risk, so they are grouped into **three
branches**, not one and not six:

| Branch                 | Tickets                                                                   | Why grouped                                                                                                                                                                                             |
| ---------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`packages-hygiene`** | #2 core→libs, #3 de-publish, #4 remove dead, #5 `release.groups`, #7 docs | All edit the _same_ files (`nx.json` release block, `project.json`s, `package.json`s). Splitting them just forces repeated rebases on shared config. One atomic commit per ticket, in dependency order. |
| **`plugins-node16`**   | #1 `node10`→`node16`                                                      | Higher-risk TS module-resolution change that can break plugin builds/external consumers. Must not block the hygiene cleanup.                                                                            |
| **`app-versioning`**   | #6 app versioning + About UI                                              | Different blast radius (CI/deploy workflow + app runtime + Sentry). Keep deploy-pipeline changes bisectable on their own.                                                                               |

Within `packages-hygiene`, commit order: **#4 (remove dead) → #3 (de-publish config) → #2
(core→libs split) → #5 (release.groups) → #7 (docs)** — each a self-contained, revertible commit.

**`npm deprecate` is a rollout action, not a commit.** Deprecating a published package is a live
registry mutation (`npm deprecate @cdwr/<pkg>@"*" "<message>"`, needs publish auth) — it cannot
live in a branch. It runs at rollout, ideally wired into the publish workflow or executed
manually with the right message. Packages to deprecate and where they point instead:

| Package                          | Deprecation message (draft)                                                        |
| -------------------------------- | ---------------------------------------------------------------------------------- |
| `@cdwr/core`                     | Internalised into the workspace; no longer published. No replacement on npm.       |
| `@cdwr/nx-migrate-action`        | GitHub Action — consumed in-repo via `uses:`; not usable from npm. No replacement. |
| `@cdwr/nx-pre-deploy-action`     | GitHub Action — internal-only; not usable from npm. No replacement.                |
| `@cdwr/nx-fly-deployment-action` | Superseded by the granular `fly-*` actions; internal-only.                         |
| `@cdwr/deploy-env-action`        | Superseded; internal-only.                                                         |

> Do not run `npm deprecate` until the corresponding code change (removal from the release set /
> `core` migration) has shipped, so the registry state and the repo state agree.
