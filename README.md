<p align="center">
  <br />
  <img width="200" src="./assets/cdwr-cloud.png" alt="codeware sthlm logo">
  <br />
  <br />
</p>

<h1 align='center'>Codeware Playground</h1>

<p align='center'>
  A playground for multi stack and architecture powered by Codeware Sthlm.
  <br />
  <br />
  <a href='https://opensource.org/licenses/MIT'><img src='https://img.shields.io/badge/License-MIT-green.svg' alt='MIT'></a>
  <br />
  <br />
</p>

## Contents <!-- omit in toc -->

- [Packages](#packages)
  - [Nx Plugins](#nx-plugins)
  - [GitHub Actions](#github-actions)
  - [Node Libraries](#node-libraries)
  - [Utilities](#utilities)
- [Startup Payload multi-tenant in dev mode](#startup-payload-multi-tenant-in-dev-mode)
  - [Terminal 1: Start Postgres and admin UI](#terminal-1-start-postgres-and-admin-ui)
  - [Terminal 2: Start web client](#terminal-2-start-web-client)
  - [Terminal 3: Start reverse proxy to simulate multi-tenancy](#terminal-3-start-reverse-proxy-to-simulate-multi-tenancy)
- [Development Tools \& Services](#development-tools--services)
  - [Infisical Secrets Management](#infisical-secrets-management)
  - [Fly.io Deployment](#flyio-deployment)
  - [Release Management](#release-management)

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

#### [`deploy-env-action`](packages/deploy-env-action) <!-- omit in toc -->

GitHub action that analyzes the environment to deploy to based on the event details.

#### [`nx-fly-deployment-action`](packages/nx-fly-deployment-action) <!-- omit in toc -->

GitHub action that brings automatic [Fly.io](https://fly.io) deployments to your [Nx](https://nx.dev) workspace.

#### [`nx-migrate-action`](packages/nx-migrate-action) <!-- omit in toc -->

GitHub action that brings automatic [Nx](https://nx.dev) migrations to your workspace.

### Node Libraries

#### [`fly-node`](packages/fly-node) <!-- omit in toc -->

Fly CLI node wrapper for programmatic deployments to [Fly.io](https://fly.io).

### Utilities

#### [`core`](packages/core) <!-- omit in toc -->

A set of core utilities for the [Codeware](https://codeware.se) ecosystem.

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
nx serve cms
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
nx start web
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

#### Optional <!-- omit in toc -->

##### Stop the proxy <!-- omit in toc -->

```sh
nx payload-proxy:down
```

##### Communicate with the proxy <!-- omit in toc -->

```sh
nx payload-proxy [docker compose options]
```

## Development Tools & Services

### Infisical Secrets Management

The [Infisical](https://infisical.com) secret management tool is used to manage secrets for the Codeware ecosystem.

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

Deployments are automatic on push events, detected by the [nx-fly-deployment-action](packages/nx-fly-deployment-action).

Still it's highly recommended to have the Fly CLI installed locally.

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

Applications affected by a pull request are deployed to a temporary preview environment.
To handle the dynamic nature of preview deployments, a Fly Postgres cluster `pg-preview` is used to store the temporary databases.

Applications deployed to preview will be automatically attached to the Postgres cluster, and detached when the pull request is closed.

> [!NOTE]
> Some commands for reference and knowledge:
>
> ```sh
> # Create a Postgres development cluster
> fly pg create --name pg-preview --org codeware --region arn --vm-size shared-cpu-1x --volume-size 1 --initial-cluster-size 2
>
> # Detach application from the Postgres cluster
> fly pg detach pg-preview -a cdwr_cms_pr_{pr-number}
>
> # Delete application
> fly apps destroy cdwr_cms_pr_{pr-number}
>
> # List all Postgres databases
> fly pg db list -a pg-preview
>
> # Cleanup dangling database and user
> sh scripts/cleanup-db.sh cdwr_cms_pr_{pr-number} {cluster-password}
> ```

##### Connect to the database on local machine <!-- omit in toc -->

Forward server port `5432` to local port `5433` to avoid conflicts with local Postgres running in Docker.

```sh
fly proxy 5433:5432 -a pg-preview
```

Connect with the following connection string:

`postgres://postgres:<password>@localhost:5433`

### Release Management

The release process is semi-automatic which means:

- Releases are generated from a local machine by a developer
- GitHub action trigger on the tags and publish to NPM

Simply run the following command to start the release process:

```sh
nx release-cli
```
