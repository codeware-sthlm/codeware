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

   # cms application (all secrets)
   infisical secrets --recursive --path /cms

   # web application (all secrets)
   infisical secrets --recursive --path /web

   # 'default' tenant using web application
   infisical secrets --path /web/tenants/default
   ```

4. Inject secrets into `process.env` for a command

   ```sh
   infisical run --path [path] -- [command]
   ```

### Fly.io Deployment

The [Fly.io](https://fly.io) platform is used to host the deployed applications and the required services.

Deployments are done automatically by the [nx-fly-deployment-action](packages/nx-fly-deployment-action) GitHub action, but it's still convenient to have the Fly CLI installed locally.

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
To handle the dynamic nature of preview deployments, a Fly Postgres cluster is used to store the temporary databases.

For deployments to preview the applications will be attached to the Postgres cluster, and detached when the pull request is closed.

> [!NOTE]
> The command is for reference and knowledge only
>
> ```sh
> # Create a Postgres development cluster
> fly postgres create --name pg-preview --org codeware --region arn --vm-size shared-cpu-1x --volume-size 1 --initial-cluster-size 1
> ```

### Release Management

The release process is semi-automatic which means:

- Releases are generated from a local machine by a developer
- GitHub action trigger on the tags and publish to NPM

Simply run the following command to start the release process:

```sh
[pnpm dlx] nx release-cli
```
