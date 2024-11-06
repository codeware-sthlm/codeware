<p align="center">
  <br />
  <img src="https://raw.githubusercontent.com/nrwl/nx/master/images/nx-logo.png" height="140" />&nbsp;&nbsp;&nbsp;&nbsp;<img src="https://avatars.githubusercontent.com/u/62968818?s=200&v=4" height="150" />
  <br />
  <br />
</p>

<h1 align='center'>@cdwr/nx-payload</h1>

<p align='center'>
  Adding support for <a href='https://payloadcms.com'>Payload</a> in your <a href='https://nx.dev'>Nx</a> workspace.
  <br />
  <br />
  <a href='https://www.npmjs.com/package/@cdwr/nx-payload'><img src='https://img.shields.io/npm/v/@cdwr/nx-payload?label=npm%20version' alt='@cdwr/nx-payload npm'></a>
  &nbsp;
  <a href='https://opensource.org/licenses/MIT'><img src='https://img.shields.io/badge/License-MIT-green.svg' alt='MIT'></a>
  <br />
  <br />
</p>

## Contents <!-- omit in toc -->

- [Prerequisites](#prerequisites)
- [Installation](#installation)
  - [Add Payload plugin to an existing workspace](#add-payload-plugin-to-an-existing-workspace)
  - [Inferred tasks](#inferred-tasks)
  - [Configuration](#configuration)
- [Usage](#usage)
  - [Generate a Payload application](#generate-a-payload-application)
  - [MongoDB, Postgres or Supabase?](#mongodb-postgres-or-supabase)
- [DX](#dx)
  - [Start Payload and database in Docker](#start-payload-and-database-in-docker)
  - [Start a local database instance of choice](#start-a-local-database-instance-of-choice)
  - [Serve Payload application in development mode](#serve-payload-application-in-development-mode)
  - [Build and run application in Docker](#build-and-run-application-in-docker)
  - [Run Payload commands](#run-payload-commands)
  - [Troubleshooting](#troubleshooting)
    - [I can't get Payload to start properly with Postgres in prod mode](#i-cant-get-payload-to-start-properly-with-postgres-in-prod-mode)
- [You don't have an Nx workspace?](#you-dont-have-an-nx-workspace)
- [Plugin Generators](#plugin-generators)
- [Plugin Executors](#plugin-executors)
- [Plugin Migrations](#plugin-migrations)
- [Versions Compatibility](#versions-compatibility)
  - [Payload peer dependencies](#payload-peer-dependencies)

## Prerequisites

- You have already created an Nx workspace
- Node 20+
- Docker

## Installation

### Add Payload plugin to an existing workspace

```sh
npx nx add @cdwr/nx-payload
```

### Inferred tasks

The plugin automatically creates tasks for projects with a `payload.config.ts` configuration file:

- `build`
- `mongodb`
- `payload-build`
- `payload-cli`
- `postgres`
- `serve`
- `start`
- `stop`
- `docker-build`
- `docker-run`

### Configuration

```ts
// nx.json
{
  "plugins": [
    "@cdwr/nx-payload/plugin"
  ]
}
```

or use `options` to assign custom target names

```ts
// nx.json
{
  "plugins": [
    {
      "plugin": "@cdwr/nx-payload/plugin",
      "options": {
        "buildTargetName": "my-build",
        "dockerBuildTargetName": "my-docker-build",
        "dockerRunTargetName": "my-docker-run",
        "mongodbTargetName": "my-mongodb",
        "payloadBuildTargetName": "my-payload-build",
        "payloadCliTargetName": "my-payload-cli",
        "postgresTargetName": "my-postgres",
        "serveTargetName": "my-serve",
        "startTargetName": "my-start",
        "stopTargetName": "my-stop"
      }
    }
  ]
}
```

#### Opt out from automatic inferrence <!-- omit in toc -->

Plugin configuration is created automatically, but you can opt out using one of these two options:

- Set `useInferencePlugins` in `nx.json` to `false`
- Set environment variable `NX_ADD_PLUGINS` to `false`

> `useInferencePlugins` has higher priority than `NX_ADD_PLUGINS`

**Note!** Created targets will be limited to `build`, `payload-build`, `payload-cli` and `serve`.

## Usage

### Generate a Payload application

```sh
npx nx generate @cdwr/nx-payload:app
```

### MongoDB, Postgres or Supabase?

Payload has official support for database adapters [MongoDB](https://www.mongodb.com/) and [Postgres](https://www.postgresql.org/about/).

This plugin supports setting up either one via the [`database`](#plugin-generators) option.

> [Supabase](https://supabase.com/docs) should be set up using the Postgres adapter

Changing the adapter for a generated application must be done manually in `payload.config.ts`.

> We don't want to infer opinionated complexity into Payload configuration

Fortunately, changing the database is straightforward, and only a few parts need to be replaced.

```ts
// MongoDB @ payload.config.ts

import { mongooseAdapter } from '@payloadcms/db-mongodb';

export default buildConfig({
  db: mongooseAdapter({
    url: process.env.MONGO_URL,
    migrationDir: resolve(__dirname, 'migrations')
  })
});
```

```ts
// Postgres/Supabase @ payload.config.ts

import { postgresAdapter } from '@payloadcms/db-postgres';

export default buildConfig({
  db: postgresAdapter({
    pool: {
      connectionString: process.env.POSTGRES_URL
    },
    migrationDir: resolve(__dirname, 'migrations')
  })
});
```

More information can be found on the official [Payload Database](https://payloadcms.com/docs/database/overview) page.

## DX

Generated applications come with a set of Nx targets to help you get started.

### Start Payload and database in Docker

This is the quickest way to get Payload up and running in no time.

Using docker compose, both MongoDB and Postgres are started in each container, as well as the Payload application.

```sh
npx nx start [app-name]
```

The app name is optional for the default app specified in `nx.json`. Specify the app name when launching a non-default app.

Open your browser and navigate to <http://localhost:3000> to setup your first user.

> Supabase is not included in this Docker setup. Instead, start your preferred database manually and run the Payload app in development mode.

#### Stop <!-- omit in toc -->

Shutdown database and Payload containers.

```sh
npx nx stop [app-name]
```

Database volumes are persistent, hence all data is available on next launch.

### Start a local database instance of choice

It's better to start the preferred database first, to be properly initialized before Payload is served.

#### MongoDB <!-- omit in toc -->

Run MongoDB in Docker

```sh
npx nx mongodb
```

#### Postgres <!-- omit in toc -->

Run Postgres in Docker

```sh
npx nx postgres
```

#### Supabase <!-- omit in toc -->

Supabase has its own powerful toolset running [local dev with CLI](https://supabase.com/docs/guides/cli)

```sh
npx supabase init
```

```sh
npx supabase start
```

Edit `POSTGRES_URL` in `.env.local`.

### Serve Payload application in development mode

Payload application is served in watch mode.

> The configured database must have been started, see [local database](#start-a-local-database-instance)

```sh
npx nx serve [app-name]
```

Open your browser and navigate to <http://localhost:3000>.

> **Note!** File changes are detected and the application will restart automatically.  
> However, the browser must currently be refreshed manually.

### Build and run application in Docker

This is commands that could be used as input to a hosting provider supporting `Dockerfile`.

It's also an alternative to the docker compose commands `start` and `stop`, when you have a custom database setup.

```sh
npx nx docker-build [app-name]
```

Edit application `.env.local` file to match the database setup and start the application

```sh
npx nx docker-run [app-name]
```

> **Hint!** Run `nx show project [app-name] --web` to find the docker build command

### Run Payload commands

All commands available from Payload can be used by the generated application via target `payload-cli`.

```sh
npx nx payload-cli [app-name] [payload-command]
```

This is specially useful for managing [migrations](https://payloadcms.com/docs/database/migrations#commands).

### Troubleshooting

#### I can't get Payload to start properly with Postgres in prod mode

Using Postgres in dev mode (serve) enables automatic migration. But when starting in prod mode it's turned off. So when the database is started without data, Payload will encounter errors once started (e.g. in Docker).

The solution is to run a migration on the database before Payload is started.

```sh
npx nx payload-cli [app-name] migrate
```

**How do I create a migration file?**

Start Payload in dev mode to seed your collection data. Then create a migration file in a second terminal.

```sh
npx nx serve [app-name]
```

```sh
npx nx payload-cli [app-name] migrate:create
```

View migration files

```sh
npx nx payload-cli [app-name] migrate:status
```

## You don't have an Nx workspace?

Just use the plugin create package to get started from scratch.

See [`create-nx-payload`](https://github.com/codeware-sthlm/codeware/tree/master/packages/create-nx-payload/README.md) for more details.

## Plugin Generators

### `init` _(internal)_ <!-- omit in toc -->

Initialize the `@cdwr/nx-payload` plugin.

_No options_.

### `application` <!-- omit in toc -->

Alias: `app`

Generate a Payload application served by Express.

| Option           | Type    | Required | Default   | Description                                          |
| ---------------- | ------- | :------: | --------- | ---------------------------------------------------- |
| `name`           | string  |    ✅    |           | The name of the application.                         |
| `directory`      | string  |    ✅    |           | The path of the application files.                   |
| `database`       | string  |          | `mongodb` | Preferred database to setup [`mongodb`, `postgres`]. |
| `tags`           | string  |          | `''`      | Comma separated tags.                                |
| `unitTestRunner` | string  |          | `jest`    | The preferred unit test runner [ `jest`, `none` ].   |
| `linter`         | string  |          | `eslint`  | The tool to use for running lint checks.             |
| `skipE2e`        | boolean |          | `false`   | Skip generating e2e application.                     |

> 💡 `name` can also be provided as the first argument (used in the examples in this readme)

## Plugin Executors

### `build` <!-- omit in toc -->

Build the Express application.

| Option           | Type                      | Required | Inferred                        | Description                                                                                                                    |
| ---------------- | ------------------------- | :------: | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `main`           | string                    |    ✅    | `apps/{name}/src/main.ts`       | The name of the main entry-point. file                                                                                         |
| `outputPath`     | string                    |    ✅    | `dist/apps/{name}`              | The output path of the generated. files                                                                                        |
| `outputFileName` | string                    |    ✅    | `src/main.js`                   | The relative path, from `outputPath`, to the output main file. A webpack property required to make `serve` find the main file. |
| `tsConfig`       | string                    |    ✅    | `apps/{name}/tsconfig.app.json` | The path to the Typescript configuration file.                                                                                 |
| `assets`         | array of object or string |          | `[]`                            | List of static assets.                                                                                                         |
| `clean`          | boolean                   |          | `false`                         | Remove previous output before build.                                                                                           |

### `payload-build` <!-- omit in toc -->

Build Payload admin page.

It's usually not needed to run this target manually since it will always run as part of the `build` target, due to usage of the `dependsOn` property.

_No options_.

### `payload-cli` <!-- omit in toc -->

Run Payload cli commands for an application.

_No options_.

```sh
npx nx payload-cli [app-name] [payload-command]
```

For example to check database migration status

```sh
npx nx payload-cli my-app migrate:status
```

## Plugin Migrations

None.

## Versions Compatibility

Later versions of Nx or Payload might work as well, but the versions below have been used during tests.

| Plugin version | Nx version | Payload version |
| -------------- | ---------- | --------------- |
| `^0.11.0`      | `20.x`     | `^2.30.3`       |
| `^0.10.0`      | `19.x`     | `^2.8.2`        |
| `^0.9.5`       | `^19.5.7`  | `^2.8.2`        |
| `^0.9.0`       | `^19.0.2`  | `^2.8.2`        |
| `^0.8.0`       | `^18.3.4`  | `^2.8.2`        |
| `^0.7.0`       | `~18.2.2`  | `^2.8.2`        |
| `^0.6.0`       | `~18.1.1`  | `^2.8.2`        |
| `^0.5.0`       | `~18.0.3`  | `^2.8.2`        |
| `^0.1.0`       | `^17.0.0`  | `^2.5.0`        |

### Payload peer dependencies

Payload has a couple of peer dependencies which must be respected by the plugin.
It's especially important when the plugin is used in a monorepo.

These peer dependencies are defined as dependencies to the plugin.

| Plugin version | Dependency         | Version   |
| -------------- | ------------------ | --------- |
| `^0.9.x`       | `react`            | `18.2.0`  |
|                | `react-i18next`    | `11.18.6` |
|                | `react-router-dom` | `5.3.4`   |
