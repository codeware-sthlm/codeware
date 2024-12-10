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

## Packages

### Nx Plugins

#### [`nx-payload`](packages/nx-payload)

Add support for [Payload](https://payloadcms.com) in your existing [Nx](https://nx.dev) workspace.

```sh
npx add @cdwr/nx-payload
```

##### [`create-nx-payload`](packages/create-nx-payload)

Quickly create a new [Nx](https://nx.dev) workspace with a [Payload](https://payloadcms.com) application, using the plugin as a preset.

```sh
npx create-nx-payload
```

### GitHub Actions

#### [`deploy-env-action`](packages/deploy-env-action)

GitHub action that analyzes the environment to deploy to based on the event details.

#### [`nx-fly-deployment-action`](packages/nx-fly-deployment-action)

GitHub action that brings automatic [Fly.io](https://fly.io) deployments to your [Nx](https://nx.dev) workspace.

#### [`nx-migrate-action`](packages/nx-migrate-action)

GitHub action that brings automatic [Nx](https://nx.dev) migrations to your workspace.

### Node Libraries

#### [`fly-node`](packages/fly-node)

Fly CLI node wrapper for programmatic deployments to [Fly.io](https://fly.io).

### Utilities

#### [`core`](packages/core)

A set of core utilities for the [Codeware](https://codeware.se) ecosystem.

## Development

### Infisical Secret Management

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

   # cms application
   infisical secrets --recursive --path /cms

   # web application
   infisical secrets --recursive --path /web
   ```

### Release management

The release process is semi-automatic which means:

- Releases are generated from a local machine by a developer
- GitHub action trigger on the tags and publish to NPM

Simply run the following command to start the release process:

```sh
[pnpm dlx] nx release-cli
```
