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
- [Development](#development)
- [Releases](#releases)
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

## Development

Local setup, the CMS host/tenant modes, database and seed commands, dev email and the admin
import-map rule are documented in [CLAUDE.md](CLAUDE.md), which is kept current as the
workspace changes. It is the single source for how to run things here — this file deliberately
does not repeat it.

Interactive CLIs for managing deployments and workspace configuration:

```sh
pnpm cdwr
```

## Releases

Releases are cut from a developer's machine; GitHub Actions publishes to npm on the resulting
tags.

```sh
nx release-cli
```

## Deployment

Applications deploy to [Fly.io](https://fly.io) from GitHub Actions, for both single-tenant and
multi-tenant setups. The pipeline detects affected applications with Nx, resolves the target
environment, and deploys production on merge or an isolated preview environment per pull
request.
