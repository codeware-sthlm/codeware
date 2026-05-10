<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->

## Workspace constraints

- Use pnpm
- Use Node 22
- Entire repository is ESM (`"type": "module"`)

## Working conventions

- Prefer Nx-native generators/executors over ad hoc scripts
- Prefer ESM-compatible implementations
- Match existing local plugin/package conventions before introducing new patterns
- Prefer explicit project targets over inferred tasks unless a natural config file already exists
- Avoid adding new dependencies unless clearly justified
- Do not add CI integration unless explicitly asked
- Before making large structural changes, summarize the conventions found in the repo and the planned approach
- Git commits should follow conventional commit pattern in commitlint.config.cjs
- Commit messages should be short — single line preferred; no multi-paragraph explanations
- Never add `Co-Authored-By` trailers to commits
- Never push directly to main — always create a branch and open a PR

## Nx-generated projects cleanup

- ensure project name reflects the project path for a consistent and unique pattern
- remove auto-generated spec files that hasn't been evolved
- remove redundant project targets that is already inferred by plugins
- remove README.md when it doesn't contain valuable DX focused content

## Common Commands

### Shadcn UI Components

```sh
# Add a new component
nx shadcn:add -- <component>
```

### CMS Development

Ensure Posgres cluster is running.

```sh
# Start Postgres container when needed
nx dx:postgres cms
```

#### CMS Host mode + external web client

Ensure `TENANT_ID` has no value in `apps/cms/.env.local`.

```sh
# Terminal 1: Serve the Payload admin UI (auto-seeds on start)
nx dev cms

# Terminal 2: Serve web client
nx dev web
```

| View            | URL                    | Credentials                |
| --------------- | ---------------------- | -------------------------- |
| Tenant client   | `localhost:4200`       |                            |
| Tenant admin UI | `localhost:3000/admin` | `titan@local.dev` / `dev`  |
| CMS admin UI    | `localhost:3000/admin` | `system@local.dev` / `dev` |

#### CMS Tenant mode

Ensure `TENANT_ID` is set to `'moon'` in `apps/cms/.env.local`.

```sh
# Serve the Payload tenant client and admin UI (auto-seeds on start)
nx dev cms
```

| View            | URL                    | Credentials                |
| --------------- | ---------------------- | -------------------------- |
| Tenant client   | `localhost:3000`       |                            |
| Tenant admin UI | `localhost:3000/admin` | `titan@local.dev` / `dev`  |
| CMS admin UI    | `localhost:3000/admin` | `system@local.dev` / `dev` |

### Database Operations

```sh
# Reset database for a fresh start
nx reset-db cms

# Seed database
nx seed cms
```

### Interactive CLI Tools (Fly.io / Infisical management)

```sh
pnpm cdwr
# Options: drop-db, restart-app, app-info, patch-config, infisical-tenants, infisical-data, infisical-analysis
```

### Release Packages

```sh
# Interactive release process (generates changelog, bumps versions, creates GitHub releases)
nx release-cli
```

### Commits

```sh
# Interactive conventional commit (czg)
pnpm run c
```

## Architecture

### Monorepo Structure

```txt
apps/        # Deployable applications
packages/    # Publishable npm packages (@cdwr/*)
libs/        # Internal shared libraries (@codeware/*)
tools/       # Internal tools and plugins
e2e/         # End-to-end tests
```

### Applications

**`apps/cms`** — Payload CMS v3 admin UI built with Next.js 15. Manages content for the multi-tenant platform. Uses PostgreSQL, S3 storage, Lexical rich text, and Sentry for error tracking.

**`apps/web`** — Customer-facing web app using Remix v2 + Hono. The Hono server wraps the Remix app for a unified Node.js server. Deployed to Fly.io.

### Publishable Packages (`packages/`)

| Package                          | Purpose                                                                       |
| -------------------------------- | ----------------------------------------------------------------------------- |
| `@cdwr/core`                     | Shared utilities: GitHub Actions helpers, release CLI, Zod testing, CLI utils |
| `@cdwr/nx-payload`               | Nx plugin adding Payload CMS generators/executors to any Nx workspace         |
| `@cdwr/create-nx-payload`        | Preset to scaffold a new Nx workspace with Payload                            |
| `@cdwr/nx-migrate-action`        | GitHub Action for automated Nx migrations                                     |
| `@cdwr/nx-fly-deployment-action` | GitHub Action for Nx-aware Fly.io deployments                                 |
| `@cdwr/nx-pre-deploy-action`     | GitHub Action for pre-deployment validation (env, tenancy, secrets)           |
| `@cdwr/deploy-env-action`        | GitHub Action analyzing deployment environment from GitHub events             |
| `@cdwr/fly-node`                 | Programmatic Node.js wrapper for the Fly CLI                                  |

### Internal Libraries (`libs/`)

**`libs/app-cms/`** — CMS-specific code organized in layers:

- `data-access/` — Payload collections and DB schema
- `feature/` — env-loader, seed
- `ui/` — blocks, components, fields, Lexical plugins, tabs
- `util/` — access control, db utils, email, env schema, filters, hooks, plugins

**`libs/shared/ui/`** — React component library (shadcn/Radix UI based): cms-renderer, code highlighting, color-picker, copy-button, file-area, icon-picker, image, primitives, shadcn components, video.

**`libs/shared/util/`** — Utility libraries: `node`, `payload-api`, `payload-types`, `payload-utils`, `pure`, `schemas`, `seed`, `signature`, `tailwind`, `typesafe`, `ui`, `zod`.

**`libs/shared/feature/infisical`** — Infisical SDK integration for secrets management.

**`libs/shared/theme/`** — Theme configuration and providers.

### Path Aliases

TypeScript path aliases are defined in `tsconfig.base.json`:

- `@codeware/*` → internal libs
- `@cdwr/*` → publishable packages
- `@payload-config` → `apps/cms/src/payload.config.ts`

### Multi-Tenant Architecture

The platform is multi-tenant. Tenants are configured via Infisical secrets. The Nginx reverse proxy (`nx payload-proxy:up`) can optionally be used to simulate multi-tenancy in local development by routing hostnames to the appropriate apps.

In production, multi-tenancy is handled automatically by the `nx-pre-deploy-action` and `nx-fly-deployment-action` GitHub Actions, which fetch tenant configs from Infisical and deploy accordingly.

#### Tenancy & Authentication Model

##### Tenants

- The **Tenants collection is an AUTH collection**
- Each tenant acts as a **service user**
- Tenants authenticate using **API keys**

##### Users

- Editor users belong to **one or more tenants**
- Tenant membership controls access to headless content
- System admins do **not** need tenant membership by design

##### Scoping

- Tenant scoping is derived from the authenticated identity (`req.user`)
- All content access is scoped by `tenant.slug`
- External clients authenticate via `Authorization` header
- Payload treats valid tenant API keys as "logged in"

### Test Runners

- **Jest** — used for Node.js libraries and `apps/` server-side tests
- **Vitest** — used for React/browser libraries and pure utility libs
- Both are inferred automatically by Nx plugins; no manual target configuration needed

### CI/CD

GitHub Actions (`.github/workflows/ci.yml`) runs lint/test/build on PRs using Nx affected detection and Nx Cloud caching. On merge/push, the deployment workflow deploys affected apps to Fly.io. Preview environments are created for each PR with temporary Postgres databases from the `pg-preview` cluster.

### Release Process

Packages under `packages/` use independent versioning driven by conventional commits. The `nx release-cli` target runs an interactive CLI (`packages/core`) that calls `nx release` — which bumps versions, generates changelogs, and tags releases. GitHub Actions then publish tagged packages to npm.
