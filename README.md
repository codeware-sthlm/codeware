<p align="center">
  <br />
  <img width="200" src="./assets/cdwr-cloud.png" alt="codeware sthlm logo">
  <br />
  <br />
</p>

<h1 align='center'>cdwr</h1>

<p align='center'>
  The Codeware Sthlm platform monorepo — a multi-tenant Payload CMS in production,
  and the Nx tooling that builds and ships it.
  <br />
  <br />
  <a href='https://www.npmjs.com/package/@cdwr/nx-payload'><img src='https://img.shields.io/npm/v/@cdwr/nx-payload?label=%40cdwr%2Fnx-payload' alt='@cdwr/nx-payload npm'></a>
  &nbsp;
  <a href='https://opensource.org/licenses/MIT'><img src='https://img.shields.io/badge/License-MIT-green.svg' alt='MIT'></a>
  <br />
  <br />
</p>

Three things live here, at different levels of maturity:

- **The platform** — a multi-tenant CMS built on [Payload](https://payloadcms.com) v3 and
  Next.js, serving tenant sites and their admin from one app. Custom domains with automated
  certificate issuance, per-tenant content scoping, forms, bookings and a themed admin.
- **[`@cdwr/nx-payload`](packages/nx-payload) and
  [`create-nx-payload`](packages/create-nx-payload)** — published Nx plugins that add Payload
  support to any Nx workspace. Developed here, against the platform that actually uses them.
- **The delivery pipeline** — Nx-affected deploys to [Fly.io](https://fly.io), per-pull-request
  preview environments, and the internal GitHub Actions that drive them.

## Contents <!-- omit in toc -->

- [Packages](#packages)
  - [Nx Plugins](#nx-plugins)
  - [GitHub Actions](#github-actions)
  - [Node Libraries](#node-libraries)
- [Startup Payload multi-tenant in dev mode](#startup-payload-multi-tenant-in-dev-mode)
  - [Terminal 1: Start Postgres and admin UI](#terminal-1-start-postgres-and-admin-ui)
  - [Terminal 2: Start web client](#terminal-2-start-web-client)
  - [Terminal 3: Start reverse proxy to simulate multi-tenancy](#terminal-3-start-reverse-proxy-to-simulate-multi-tenancy)
- [Development Tools \& Services](#development-tools--services)
  - [CLI Tools](#cli-tools)
  - [Infisical Secrets Management](#infisical-secrets-management)
  - [Fly.io Deployment](#flyio-deployment)
  - [Release Management](#release-management)
- [Deployment](#deployment)

## Packages

### Nx Plugins

#### [`nx-payload`](packages/nx-payload) <!-- omit in toc -->

Add support for [Payload](https://payloadcms.com) in your existing [Nx](https://nx.dev) workspace.

```sh
npx add @cdwr/nx-payload
```

##### [`create-nx-payload`](packages/create-nx-payload) <!-- omit in toc -->

Quickly create a new [Nx](https://nx.dev) workspace with a [Payload](https://payloadcms.com) application, using the plugin as a preset.

```sh
npx create-nx-payload
```

### GitHub Actions

> These actions are **internal building blocks** consumed within this repository's own
> workflows via `uses: ./packages/<name>`. They are not published to npm or the GitHub
> Marketplace (a GitHub Action is not installable from npm).

#### Fly.io Deployment Pipeline <!-- omit in toc -->

Six focused actions that together handle the full deployment lifecycle:

| Action                                                    | Purpose                                                             |
| --------------------------------------------------------- | ------------------------------------------------------------------- |
| [`fly-conditions-action`](packages/fly-conditions-action) | Gate the pipeline based on branch rules and the preview label       |
| [`nx-pre-deploy-action`](packages/nx-pre-deploy-action)   | Analyze affected apps, resolve environment, and fetch tenant config |
| [`fly-build-action`](packages/fly-build-action)           | Build Docker images and push to the Fly registry                    |
| [`fly-deployment-action`](packages/fly-deployment-action) | Deploy pre-built images to Fly.io                                   |
| [`fly-destroy-action`](packages/fly-destroy-action)       | Destroy preview apps when a pull request is closed                  |
| [`pr-comment-action`](packages/pr-comment-action)         | Post deployment status to a pull request                            |

#### [`nx-migrate-action`](packages/nx-migrate-action) <!-- omit in toc -->

GitHub action that brings automatic [Nx](https://nx.dev) migrations to your workspace.

### Node Libraries

#### [`fly-node`](packages/fly-node) <!-- omit in toc -->

Fly CLI node wrapper for programmatic deployments to [Fly.io](https://fly.io).

## Startup Payload multi-tenant in dev mode

The Payload suite consists of

- Payload Admin UI (`cms`)
- Web Client (`web`)
- Docker Postgres Database
- Nginx Reverse Proxy to simulate multi-tenancy

> [!IMPORTANT]
> For a better DX you should not connect to Infisical in dev mode, since the development seed has much more data.
>
> Make sure the credentials in the `.env.local` file are not set.

### Terminal 1: Start Postgres and admin UI

#### Start Postgres in Docker <!-- omit in toc -->

```sh
nx dx:postgres cms
```

#### Serve admin UI <!-- omit in toc -->

```sh
nx dev cms
```

> [!NOTE]
> Database is auto-seeded with static data when the admin UI is started.

#### Optional <!-- omit in toc -->

##### Clear database and run migrations <!-- omit in toc -->

```sh
nx payload cms migrate:fresh
```

##### Generate seed data <!-- omit in toc -->

Seed data is stored in environment-specific TypeScript files in

- `libs/shared/util/seed/src/lib/static-data`.

You can remove the existing seed data and keep just an empty object to force the generation of new seed data.

```sh
nx seed cms
```

### Terminal 2: Start web client

> [!NOTE]
> Live-reload is not fully operational.

```sh
nx dev web
```

### Terminal 3: Start reverse proxy to simulate multi-tenancy

```sh
nx payload-proxy:up
```

> [!NOTE]
> You can now access the different web sites as different tenants:
>
> 🌐 `cms.localhost`
>
> :pouting_face: `system@local.dev` @ `dev`

**Optional**

Stop the proxy

```sh
nx payload-proxy:down
```

Communicate with the proxy

```sh
nx payload-proxy [docker compose options]
```

## Development Tools & Services

### CLI Tools

Interactive CLI tools for managing Fly.io apps, databases, and Infisical configurations.

```sh
pnpm cdwr
```

> [!TIP]
> See [tools/README.md](tools/README.md) for available tools and usage options.

### Infisical Secrets Management

The [Infisical](https://infisical.com) secret management tool is used to manage secrets for the Codeware ecosystem.

> [!NOTE] Deployment and multi-tenant configuration
> **See:** [DEPLOYMENT.md](docs/DEPLOYMENT.md) and the [multi-tenant setup guide](packages/nx-pre-deploy-action/README.md#multi-tenant-setup)

1. [Install Infisical CLI](https://infisical.com/docs/cli/overview#installation)

2. Login to access the secrets

   ```sh
   infisical login
   ```

3. List the development secrets

   ```sh
   # all secrets
   infisical secrets --recursive

   # cms application (all secrets and some by tag)
   infisical secrets --recursive --path /cms
   infisical secrets --tag cms

   # web application (all secrets and some by tag)
   infisical secrets --recursive --path /web
   infisical secrets --tag web

   # 'demo' tenant using web application
   infisical secrets --path /web/tenants/demo
   ```

#### Using the secrets <!-- omit in toc -->

Add Infisical creadentials to you local environment.

`apps/cms/.env.local`

```env
# Alt 1: Client credentials
INFISICAL_CLIENT_ID=
INFISICAL_CLIENT_SECRET=

# Alt 2: Service token
INFISICAL_SERVICE_TOKEN=
```

> [!NOTE]
> Secrets can also be injected into `process.env` for any command, but this is not how we normally do it.
>
> ```sh
> infisical run --path [path] -- [command]
> ```

### Fly.io Deployment

The [Fly.io](https://fly.io) platform is used to host the deployed applications and the required services.

> [!NOTE] Configuration, multi-tenant setup, and workflow details
> **See:** [DEPLOYMENT.md](docs/DEPLOYMENT.md)

Deployments are automatic on push events, handled by the [fly-deployment workflow](.github/workflows/fly-deployment.yml).

For local development and troubleshooting, install the Fly CLI:

1. [Install Fly CLI](https://github.com/superfly/flyctl?tab=readme-ov-file#installation)

2. Login to your Fly account

   ```sh
   fly auth login
   ```

3. List the applications (for example)

   ```sh
   fly apps list
   ```

#### Database setup for preview deployments <!-- omit in toc -->

Applications affected by a pull request are deployed to a temporary preview environment. A Fly Postgres cluster `pg-preview` is used to store the temporary databases, with automatic attachment/detachment managed by the deployment workflow.

> [!NOTE] How to configure Postgres attachment in github.json
> **See:** [DEPLOYMENT.md](docs/DEPLOYMENT.md#per-app-configuration-githubjson)

<details>
<summary><strong>Advanced: Postgres cluster commands</strong></summary>

```sh
# Create a Postgres cluster (use only one node to prevent HA issues for unmananged cluser)
fly pg create --name pg-preview --org codeware --region arn --vm-size shared-cpu-2x --volume-size 1 --initial-cluster-size 1

# Detach application from the Postgres cluster
fly pg detach pg-preview -a cdwr-cms-pr-{pr-number}

# Delete application
fly apps destroy cdwr-cms-pr-{pr-number}

# List all Postgres databases
fly pg db list -a pg-preview
```

</details>

<details>
<summary><strong>Database Maintenance & Troubleshooting</strong></summary>

**Cleanup dangling database** (after PR is closed):

```sh
sh scripts/cleanup-db.sh {pr-number} {cluster-password}
```

**Drop database** (to start fresh) or **Restart app machine**:

Use the interactive CLI tool:

```sh
pnpm cdwr
```

Then select `drop-db` or `restart-app` from the menu.

Alternatively, restart manually:

```sh
fly machine stop {machine-id}
fly machine restart {machine-id}
```

**Connect to preview database locally**:

```sh
# Forward port (5433 to avoid conflicts with local Docker Postgres)
fly proxy 5433:5432 -a pg-preview

# Connection string
postgres://postgres:<password>@localhost:5433
```

</details>

### Release Management

The release process is semi-automatic which means:

- Releases are generated from a local machine by a developer
- GitHub action trigger on the tags and publish to NPM

Simply run the following command to start the release process:

```sh
nx release-cli
```

## Deployment

This workspace uses automated GitHub Actions to deploy applications to Fly.io with support for both single-tenant and multi-tenant architectures. The deployment system:

- Automatically detects affected applications using Nx
- Fetches tenant configuration from Infisical
- Deploys to the appropriate environment (preview/production)
- Supports per-app tenant lists for flexible multi-tenancy

For comprehensive deployment documentation, including configuration, multi-tenant setup, and troubleshooting, see [DEPLOYMENT.md](docs/DEPLOYMENT.md).
