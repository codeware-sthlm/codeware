<p align="center">
  <br />
  <img width="200" src="../../assets/cdwr-cloud.png" alt="codeware sthlm logo">
  <br />
  <br />
</p>

<h1 align='center'>Fly Node</h1>

<p align='center'>
  The Fly CLI node wrapper for programmatic deployments to <a href='https://fly.io'>Fly.io</a>.
  <br />
  <br />
  <a href='https://www.npmjs.com/package/@cdwr/fly-node'><img src='https://img.shields.io/npm/v/@cdwr/fly-node?label=npm%20version' alt='@cdwr/fly-node npm'></a>
  &nbsp;
  <a href='https://opensource.org/licenses/MIT'><img src='https://img.shields.io/badge/License-MIT-green.svg' alt='MIT'></a>
  <br />
  <br />
</p>

This library is a lightweight, fully typed Node wrapper for the Fly CLI tool for programmatic deployments to [Fly.io](https://fly.io).

It has only one dependency, [Zod](https://zod.dev/), for validating the responses from the Fly API.

It's built with a configuration-first approach, meaning that you provide a `fly.toml` file and an API token, and let the library handle the necessary boilerplate stuff.

> [!NOTE]
> The library aims to be unopinionated and follow the `flyctl` commands structure as much as possible.
>
> There are tons of CLI commands that could be supported, but since blueprint deployments are the primary use case, this is where the focus lies.
>
> For now the library is built for the needs at Codeware Sthlm, but it aims to be flexible and work for any Fly.io app.

## Contents <!-- omit in toc -->

- [Installation](#installation)
- [Usage](#usage)
  - [Create a Fly instance](#create-a-fly-instance)
    - [Verify that the Fly client is ready](#verify-that-the-fly-client-is-ready)
  - [Deploying apps \& machines](#deploying-apps--machines)
    - [Create an application](#create-an-application)
    - [Destroy an application](#destroy-an-application)
    - [Deploy an application](#deploy-an-application)
    - [Application status](#application-status)
    - [List applications](#list-applications)
  - [Configuration \& scaling](#configuration--scaling)
    - [Add a custom domain](#add-a-custom-domain)
    - [Remove a custom domain](#remove-a-custom-domain)
    - [List certificates](#list-certificates)
    - [Show application configuration](#show-application-configuration)
    - [Add application secrets](#add-application-secrets)
    - [Remove application secrets](#remove-application-secrets)
    - [List secrets](#list-secrets)

## Installation

```bash
npm install @cdwr/fly-node
```

### Fly CLI <!-- omit in toc -->

> [!IMPORTANT]
> It's required to have the Fly CLI installed to use this library.

Instructions to [install manually](https://github.com/superfly/flyctl?tab=readme-ov-file#installation).

For using in GitHub actions it's best to use the [action](https://github.com/superfly/flyctl-actions) provided by the Fly CLI project.

## Usage

The library behaves just like the Fly CLI tool regarding all default values.

For any command you run, your local `flyctl` installation will be verified. If it's not present, the command will abort with exception.

### Create a Fly instance

Fly will try to connect to Fly.io in the following order:

1. A user has already authenticated locally using `flyctl auth login`
2. The library authenticates using the provided Fly API `token`
3. The library authenticates using environment variable `FLY_API_TOKEN`

```ts
import { Fly } from '@cdwr/fly-node';

const fly = new Fly();

// Provide a Fly API token
const fly = new Fly({ token: 'fly-api-token' });
```

> [!TIP]
> Built-in monorepo support!
>
> When you run `flyctl` in your terminal, it will look for a `fly.toml` file in your current working directory. If that's not the case, you have to provide the `app` or `config` option for any command to run.
>
> This is what you have in a monorepo setup, where you probably have the `fly.toml` configuration files in the applications folders.
>
> The library `Fly` class works the same way at its default configuration. However, you can also provide the `app` or `config` options when creating the instance to let the commands know where to run.
>
> So, to create an instance to `my-app`, you can do it like this:
>
> ```ts
> const fly = new Fly({ config: 'apps/my-app/fly.toml' });
> ```
>
> Any command run on this instance will then be executed on `my-app`.
>
> Similarly when you have an application named `your-app` on Fly.io, you can create an instance to it like this:
>
> ```ts
> const fly = new Fly({ app: 'your-app' });
> ```
>
> Any command run on this instance will instead be executed on `your-app`.
>
> One more thing. The commands supported by this library and have `app` or `config` flags, will override the instance application when provided. This gives you the default `flyctl` CLI behaviour but with improved flexibility depending on your repository structure.

**Options**

| Name              | Description                                                                                                                     |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `token`           | Fly API access token.                                                                                                           |
| `app` or `config` | Name of the application or the path to the fly configuration file to run all commands on.                                       |
| `org`             | Target organisation for your created apps. Defaults to your personal organisation.                                              |
| `region`          | Target region for your deployed apps. Defaults to auto-detect the fastest location.                                             |
| `logger`          | Custom logger for the library. Defaults to using `console.log()` and `console.error()`. CLI tracing can be enabled when needed. |

#### Verify that the Fly client is ready

As described in the [installation](#installation) section, the library will verify that the Fly client is ready for any command you run.

However, you can also verify that the Fly client is ready manually, without running any commands.

```ts
const isReady = await fly.isReady(); // true or false

// Or use assertion mode
const isReady = await fly.isReady('assert'); // throws error if false
```

For both modes a message will be logged to console when the Fly client is ready.

Use this command to check if the Fly CLI is installed.

```ts
const isInstalled = await fly.cli.isInstalled(); // true or false
```

### Deploying apps & machines

#### Create an application

This will create an application which is not deployed yet. You can add secrets, domains etc. and deploy later when ready.

> [!TIP]
> Creating an application is not necessary before deploying, the library will do it for you.

```ts
const name = await fly.apps.create(); // 'some-app-name-123'

// Create application 'foo-app' in the instance organisation
const name = await fly.apps.create({ app: 'foo-app' });

// Create application 'bar-app' in organisation 'baz'
const name = await fly.apps.create({ app: 'bar-app', org: 'baz' });
```

#### Destroy an application

```ts
await fly.apps.destroy('foo-app');
await fly.apps.destroy('bar-app', true); // force destroy
```

#### Deploy an application

> [!IMPORTANT]
> Currently there's a small limitation to detecting which configuration to use for deployment. To make sure the correct configuration is used you must provide the configuration file, either globally via instance or in the command options.
>
> Without providing the configuration file, the command will throw an error.

```ts
// deploy the instance application, if provided
const response = await fly.deploy();

// deploy 'foo-app'
const response = await fly.deploy({ config: 'apps/foo-app/fly.toml' });

// deploy 'bar-app' configuration as 'preview-bar-app'
const response = await fly.deploy({
  app: 'preview-bar-app',
  config: 'apps/bar-app/fly.toml'
});

// With all options, could be a pull request preview deployment
const response = await fly.deploy({
  app: 'pr-19-foo-app',
  config: 'apps/foo-app/fly.toml',
  environment: 'preview',
  org: 'baz',
  region: 'arn',
  env: {
    DEPLOY_ID: 'qwerty'
  },
  secrets: {
    LICENCE_KEY: '1234567890'
  }
});

// {
//   app: 'pr-19-foo-app',
//   hostname: 'pr-19-foo-app.fly.dev',
//   url: 'https://pr-19-foo-app.fly.dev'
// }
```

#### Application status

```ts
// Get the status of the instance application
const status = await fly.status();

// Get the status of 'foo-app'
const status = await fly.status({ app: 'foo-app' });
const status = await fly.status({ config: 'apps/foo-app/fly.toml' });

// {
//   name: 'foo-app',
//   hostname: 'foo-app.fly.dev',
//   url: 'https://foo-app.fly.dev',
//   organization: {
//     name: 'personal'
//   },
//   status: 'running',
//   ... more
// }

// Get the status of an application that doesn't exist
const status = await fly.status({ app: 'non-existent-app' }); // null

// There is also an extended status command with more details
const status = await fly.statusExtended();

// {
//   ... same as above
//   domains: [
//     'foo.domain.com'
//   ],
//   secrets: [
//     'FOO',
//     'BAR'
//   ],
//   ... more
// }
```

#### List applications

```ts
// Get all applications
const apps = await fly.apps.list();
```

### Configuration & scaling

#### Add a custom domain

Adding a domain will create a certificate for it with automatic renewal.

> [!TIP]
> Read the guide about how to [add a custom domain for your app](https://fly.io/docs/networking/custom-domain/#add-a-custom-domain-for-your-app).

```ts
// Add a Domain to the instance application
await fly.certs.add('foo.domain.com');

// Add a domain to 'bar-app'
await fly.certs.add('bar.domain.com', { app: 'bar-app' });
await fly.certs.add('baz.domain.com', { config: 'apps/bar-app/fly.toml' });
```

#### Remove a custom domain

```ts
// Remove a domain from the instance application
await fly.certs.remove('foo.domain.com');

// Remove a domain from 'bar-app'
await fly.certs.remove('bar.domain.com', { app: 'bar-app' });
await fly.certs.remove('baz.domain.com', { config: 'apps/bar-app/fly.toml' });
```

#### List certificates

```ts
// List certificates for the instance application
const certs = await fly.certs.list();

// List certificates for 'foo-app'
const certs = await fly.certs.list({ app: 'foo-app' });
const certs = await fly.certs.list({ config: 'apps/foo-app/fly.toml' });

// [
//   {
//     clientStatus: 'Ready',
//     createdAt: '2024-01-01T00:00:00.000Z',
//     hostname: 'foo.domain.com',
//   },
//   ...
// ]

// List certificates for all your applications
const certs = await fly.certs.list('all');

// [
//   {
//     app: 'foo-app',
//     [cert details]
//   },
//   ...
//   {
//     app: 'bar-app',
//     [cert details]
//   },
//   ...
// ]
```

#### Show application configuration

The configuration is always fetched from Fly.io remote configuration, but you can also fetch the local configuration file.

When a configuration cannot be shown, the command will throw an error.

> [!TIP]
> Fetching local configuration is the only option for applications never deployed. It will also assure that the file exists.

```ts
// Show the instance application configuration
const config = await fly.config.show();

// Show 'foo-app' configuration
const config = await fly.config.show({ app: 'foo-app' });
const config = await fly.config.show({ config: 'apps/foo-app/fly.toml' });

// Show local 'new-app' configuration
const config = await fly.config.show({
  config: 'apps/new-app/fly.toml',
  local: true
});
```

#### Add application secrets

Adding secrets to an application will trigger a deployment for machines running the application.

```ts
// Add secrets to the instance application
await fly.secrets.set({
  LICENCE_KEY: '1234567890',
  SOME_SECRET: 'super-secret'
});

// Add secrets to 'foo-app'
await fly.secrets.set({ FOO: 'bar' }, { app: 'foo-app' });
await fly.secrets.set({ BEE: 'baz' }, { config: 'apps/foo-app/fly.toml' });

// Add secrets to 'foo-app' and skip auto-deploy
await fly.secrets.set({ FOO: 'bar' }, { app: 'foo-app', stage: true });
```

#### Remove application secrets

```ts
// Remove secret from the instance application
await fly.secrets.unset('FOO');

// Remove secret from 'foo-app'
await fly.secrets.unset('FOO', { app: 'foo-app' });
await fly.secrets.unset('BEE', { config: 'apps/foo-app/fly.toml' });

// Remove secret from 'foo-app' and skip auto-deploy
await fly.secrets.unset('FOO', { app: 'foo-app', stage: true });
```

#### List secrets

```ts
// List secrets for the instance application
const secrets = await fly.secrets.list();

// List secrets for 'foo-app'
const secrets = await fly.secrets.list({ app: 'foo-app' });
const secrets = await fly.secrets.list({ config: 'apps/foo-app/fly.toml' });

// [
//   {
//     createdAt: '2024-01-01T00:00:00.000Z',
//     digest: '1234567890',
//     name: 'FOO',
//   },
//   ...
// ]

// List secrets for all your applications
const secrets = await fly.secrets.list('all');

// [
//   {
//     app: 'foo-app',
//     [secret details]
//   },
//   ...
//   {
//     app: 'bar-app',
//     [secret details]
//   },
//   ...
// ]
```
