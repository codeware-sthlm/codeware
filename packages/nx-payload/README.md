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
- [Developer Experience (DX)](#developer-experience-dx)
  - [Start Payload and database in Docker](#start-payload-and-database-in-docker)
  - [Start a local database instance of choice](#start-a-local-database-instance-of-choice)
  - [Serve Payload application in development mode](#serve-payload-application-in-development-mode)
  - [Build and run application in Docker](#build-and-run-application-in-docker)
  - [Run Payload commands](#run-payload-commands)
  - [Generate TypeScript types and GraphQL schema](#generate-typescript-types-and-graphql-schema)
  - [Troubleshooting](#troubleshooting)
- [You don't have an Nx workspace?](#you-dont-have-an-nx-workspace)
- [Plugin Generators](#plugin-generators)
- [Plugin Executors](#plugin-executors)
- [Versions Compatibility](#versions-compatibility)

## Prerequisites

- You have already created an Nx workspace
- Node 20+
- Docker

### Optional Nx installed globally <!-- omit in toc -->

The commands in this readme assume that Nx is installed globally.

```sh
nx [...]
```

If you prefer not to, you can use your preferred package manager to prefix the commands like this example for `npm`.

```sh
npx nx [...]
# or
npm run nx [...]
```

## Installation

### Add Payload plugin to an existing workspace

```sh
nx add @cdwr/nx-payload
```

### Inferred tasks

The plugin automatically creates tasks for projects with a `payload.config.ts` configuration file.

- `build`
- `gen`
- `payload`
- `serve`

> [!TIP]
> A couple of targets to improve [Developer Experience (DX)](#developer-experience-dx) are also inferred:
>
> - `dx:docker-build`
> - `dx:docker-run`
> - `dx:mongodb`
> - `dx:postgres`
> - `dx:start`
> - `dx:stop`

### Configuration

```json
// nx.json
{
  "plugins": ["@cdwr/nx-payload/plugin"]
}
```

or use `options` for brevity and to be able to set custom target names

```json
// nx.json
{
  "plugins": [
    {
      "plugin": "@cdwr/nx-payload/plugin",
      "options": {
        "buildTargetName": "build",
        "generateTargetName": "gen",
        "payloadTargetName": "payload",
        "serveTargetName": "serve",
        "dxDockerBuildTargetName": "dx:docker-build",
        "dxDockerRunTargetName": "dx:docker-run",
        "dxMongodbTargetName": "dx:mongodb",
        "dxPostgresTargetName": "dx:postgres",
        "dxStartTargetName": "dx:start",
        "dxStopTargetName": "dx:stop"
      }
    }
  ]
}
```

#### Opt out from automatic inferrence <!-- omit in toc -->

Plugin configuration is created automatically, but you can opt out using one of these two options:

- Set `useInferencePlugins` in `nx.json` to `false`
- Set environment variable `NX_ADD_PLUGINS` to `false`

> [!NOTE]
>
> `useInferencePlugins` has higher priority than `NX_ADD_PLUGINS`
>
> Generated targets will **not** include the DX targets, nor the `gen` target

## Usage

### Generate a Payload application

```sh
nx generate @cdwr/nx-payload:app
```

### MongoDB, Postgres or Supabase?

Payload has official support for database adapters [MongoDB](https://www.mongodb.com/) and [Postgres](https://www.postgresql.org/about/).

This plugin supports setting up either one via the [`database`](#plugin-generators) option.

> [!TIP]
>
> [Supabase](https://supabase.com/docs) could be set up using the Postgres adapter

Changing the adapter for a generated application must be done manually in `payload.config.ts`.

> [!IMPORTANT]
> We don't want to infer opinionated complexity into Payload configuration

Fortunately, changing the database is straightforward, and only a few parts need to be replaced.

```ts
// MongoDB @ payload.config.ts

import { mongooseAdapter } from '@payloadcms/db-mongodb';

export default buildConfig({
  db: mongooseAdapter({
    url: process.env.MONGO_URL
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
    }
  })
});
```

> [!TIP]
> More information can be found on the official [Payload Database](https://payloadcms.com/docs/database/overview) page.

## Developer Experience (DX)

> [!IMPORTANT]
> DX targets are only available when **inference** is enabled

Generated applications come with a set of opinionatedtargets to improve developer experience. These targets are prefixed with `dx:` are optional to use.

> [!TIP]
> Display all the targets with extensive details for an application
>
> ```sh
> nx show project [app-name] --web
> ```

### Start Payload and database in Docker

This is the quickest way to get Payload up and running in no time.

Using docker compose, both MongoDB and Postgres are started in each container, as well as the Payload application.

```sh
nx dx:start [app-name]
```

The app name is optional for the default app specified in `nx.json`. Specify the app name when launching a non-default app.

Open your browser and navigate to <http://localhost:3000> to setup your first user.

> [!NOTE]
> Supabase is not included in this Docker setup.
>
> Instead, start your preferred database manually and run the Payload app in development mode.

#### Stop <!-- omit in toc -->

Shutdown database and Payload containers.

```sh
nx dx:stop [app-name]
```

Database volumes are persistent, hence all data is available on next launch.

### Start a local database instance of choice

It's better to start the preferred database first, to be properly initialized before Payload is served.

#### MongoDB <!-- omit in toc -->

Run MongoDB in Docker

```sh
nx dx:mongodb [app-name]
```

#### Postgres <!-- omit in toc -->

Run Postgres in Docker

```sh
nx dx:postgres [app-name]
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

> [!NOTE]
> The configured database must have been started, see [local database](#start-a-local-database-instance-of-choice)

```sh
nx serve [app-name]
```

Open your browser and navigate to <http://localhost:3000>.

> [!IMPORTANT]
> File changes are detected and the application will restart automatically.  
> However, the browser must currently be refreshed manually.

### Build and run application in Docker

This is commands that could be used as input to a hosting provider supporting `Dockerfile`.

It's also an alternative to the docker compose commands `dx:start` and `dx:stop`, when you have a custom database setup.

```sh
nx dx:docker-build [app-name]
```

Edit application `.env.local` file to match the database setup and start the application

```sh
nx dx:docker-run [app-name]
```

### Run Payload commands

All commands available from Payload can be used by the generated application via target `payload`.

```sh
nx payload [app-name] [payload-command]
```

This is specially useful for managing [migrations](https://payloadcms.com/docs/database/migrations#commands), for example to check database migration status.

```sh
nx payload [app-name] migrate:status
```

### Generate TypeScript types and GraphQL schema

To provide a better developer experience for client development, the plugin can generate TypeScript types and GraphQL schema files from the Payload configuration.

> [!NOTE]
> GraphQL schema will not be generated if `graphQL.disable` is set to `true` in `payload.config.ts`

```sh
nx gen [app-name]
```

The generated files are written to application source `generated` folder.
They can then be distributed to the client developer manually or saved to a shared library in the monorepo.

> [!IMPORTANT]
> The `gen` target is only available when **inference** is enabled.  
> To generate the files manually you can use the versatile `payload` target instead.
>
> ```sh
> nx payload [app-name] generate:types
> nx payload [app-name] generate:graphql
> ```

### Troubleshooting

#### I can't get Payload to start properly with Postgres in prod mode <!-- omit in toc -->

Using Postgres in dev mode (serve) enables automatic migration. But when starting in prod mode it's turned off. So when the database is started without data, Payload will encounter errors once started (e.g. in Docker).

The solution is to run a migration on the database before Payload is started.

```sh
nx payload [app-name] migrate
```

**How do I create a migration file?**

Start Payload in dev mode to seed your collection data. Then create a migration file in a second terminal.

```sh
nx serve [app-name]
```

```sh
nx payload [app-name] migrate:create
```

View migration files

```sh
nx payload [app-name] migrate:status
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

Build the application.

| Option           | Type                      | Required | Inferred                        | Description                                                                                                                    |
| ---------------- | ------------------------- | :------: | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `main`           | string                    |    ✅    | `apps/{name}/src/main.ts`       | The name of the main entry-point. file                                                                                         |
| `outputPath`     | string                    |    ✅    | `dist/apps/{name}`              | The output path of the generated. files                                                                                        |
| `outputFileName` | string                    |    ✅    | `src/main.js`                   | The relative path, from `outputPath`, to the output main file. A webpack property required to make `serve` find the main file. |
| `tsConfig`       | string                    |    ✅    | `apps/{name}/tsconfig.app.json` | The path to the Typescript configuration file.                                                                                 |
| `assets`         | array of object or string |          | `[]`                            | List of static assets.                                                                                                         |
| `clean`          | boolean                   |          | `true`                          | Remove previous output before build.                                                                                           |

## Versions Compatibility

Later versions of Nx or Payload might work as well, but the versions below have been used during tests.

| Plugin version | Nx version | Payload version |
| -------------- | ---------- | --------------- |
| `^1.0.0`       | `20.x`     | `^2.30.3`       |
| `^0.11.0`      | `20.x`     | `^2.30.3`       |
| `^0.10.0`      | `19.x`     | `^2.8.2`        |
| `^0.9.5`       | `^19.5.7`  | `^2.8.2`        |
| `^0.9.0`       | `^19.0.2`  | `^2.8.2`        |
| `^0.8.0`       | `^18.3.4`  | `^2.8.2`        |
| `^0.7.0`       | `~18.2.2`  | `^2.8.2`        |
| `^0.6.0`       | `~18.1.1`  | `^2.8.2`        |
| `^0.5.0`       | `~18.0.3`  | `^2.8.2`        |
| `^0.1.0`       | `^17.0.0`  | `^2.5.0`        |
