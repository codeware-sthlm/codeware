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
  - [MongoDB, Postgres, Supabase or SQLite?](#mongodb-postgres-supabase-or-sqlite)
- [Developer Experience (DX)](#developer-experience-dx)
  - [Start Payload and database in Docker](#start-payload-and-database-in-docker)
  - [Start a local database instance of choice](#start-a-local-database-instance-of-choice)
  - [Serve Payload application in development mode](#serve-payload-application-in-development-mode)
  - [Run Payload commands](#run-payload-commands)
  - [Generate TypeScript types and GraphQL schema](#generate-typescript-types-and-graphql-schema)
  - [Troubleshooting](#troubleshooting)
- [You don't have an Nx workspace?](#you-dont-have-an-nx-workspace)
- [Plugin Generators](#plugin-generators)
- [Migrate from Payload v2 to v3](#migrate-from-payload-v2-to-v3)
  - [Preparation](#preparation)
  - [Packages](#packages)
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

> [!IMPORTANT]
> This documentation is aimed for a **Payload v3** setup.
>
> To install **Payload v2** you should use plugin version **1.x**.

_Though it's possible to have applications using Payload v2 and v3 in the same workspace, it's not recommended. Payload v2 supports React 18 and v3 has moved to React 19. But with individual `package.json` files for the applications and some Dockerfiles `sed` magic it's possible to make it work._

### Add Payload plugin to an existing workspace

```sh
nx add @cdwr/nx-payload
```

### Inferred tasks

The plugin automatically generates Payload tasks for projects that has a `payload.config.ts` file somewhere in the project. The default location is in `{projectRoot}/src`.

- `gen`
- `payload`
- `payload-graphql`

> [!TIP]
> A couple of targets to improve [Developer Experience (DX)](#developer-experience-dx) are also generated:
>
> - `dx:mongodb`
> - `dx:postgres`
> - `dx:start`
> - `dx:stop`

### Configuration

Plugin configuration is added to `nx.json` by default.

```json
{
  "plugins": [
    {
      "plugin": "@cdwr/nx-payload/plugin",
      "options": {
        "generateTargetName": "gen",
        "payloadTargetName": "payload",
        "payloadGraphqlTargetName": "payload-graphql",
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

To disable automatic targets generation and write explicit targets to `project.json`, use one of these two options:

- Set `useInferencePlugins` in `nx.json` to `false`
- Set environment variable `NX_ADD_PLUGINS` to `false`

## Usage

### Generate a Payload application

```sh
nx g @cdwr/nx-payload:app
```

### MongoDB, Postgres, Supabase or SQLite?

Payload has official support for database adapters [MongoDB](https://www.mongodb.com/), [Postgres](https://www.postgresql.org/about/) and [SQLite](https://www.sqlite.org).

> [!TIP]
>
> [Supabase](https://supabase.com/docs) is set up using the Postgres adapter

Changing the adapter for a generated application must be done manually in `payload.config.ts`.

> [!IMPORTANT]
> We don't want to infer opinionated complexity into the Payload configuration. A new application is just a working template that you will customize and evolve to your needs.

Fortunately, changing the database is straightforward, and only a few parts need to be replaced.

```ts
// MongoDB @ payload.config.ts

import { mongooseAdapter } from '@payloadcms/db-mongodb';

export default buildConfig({
  db: mongooseAdapter({
    url: process.env.DATABASE_URI
  })
});
```

```ts
// Postgres/Supabase @ payload.config.ts

import { postgresAdapter } from '@payloadcms/db-postgres';

export default buildConfig({
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI
    }
  })
});
```

> [!TIP]
> More information can be found on the official [Payload Database](https://payloadcms.com/docs/database/overview) page.

## Developer Experience (DX)

The application come with a set of opinionatedtargets to improve developer experience. These targets are prefixed with `dx:` are optional to use.

> [!TIP]
> Display all the targets with extensive details for an application
>
> ```sh
> nx show project [app-name]
> ```

### Start Payload and database in Docker

This is the quickest way to get Payload up and running in no time.

Using docker compose, both MongoDB and Postgres are started in each container, as well as the Payload application.

```sh
nx dx:start [app-name]
```

Open your browser and navigate to <http://localhost:3000> to setup your first user.

#### Stop <!-- omit in toc -->

Shutdown database and Payload containers.

```sh
nx dx:stop [app-name]
```

Database volumes are persistent, hence all data is available on next launch.

### Start a local database instance of choice

You can also start the preferred database first, to be properly initialized before Payload is served.

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

Edit `DATABASE_URI` in `.env.local` when needed.

### Serve Payload application in development mode

Payload application is served in watch mode.

> [!NOTE]
> The configured database must have been started, see [local database](#start-a-local-database-instance-of-choice)

```sh
nx dev [app-name]
```

Open your browser and navigate to <http://localhost:3000>.

### Run Payload commands

All commands available from Payload can be used for the application via targets `payload` and `payload-graphql`.

```sh
nx payload [app-name] [payload-command]
```

This is specially useful for managing [migrations](https://payloadcms.com/docs/database/migrations#commands), for example to check database migration status.

```sh
nx payload [app-name] migrate:status
```

### Generate TypeScript types and GraphQL schema

To provide a better developer experience for client development, the plugin can generate TypeScript types and GraphQL schema files from the Payload configuration.

> [!IMPORTANT]
> GraphQL schema will not be generated if `graphQL.disable` is set to `true` in `payload.config.ts`

```sh
nx gen [app-name]
```

The generated files are written to the `generated` folder.
The types can be distributed to the client developer manually or saved to a shared library in the monorepo.

> [!NOTE]
> The `gen` target is actually an alias for the following commands.
>
> ```sh
> nx payload [app-name] generate:types
> nx payload-graphql [app-name] generate:schema
> ```

### Troubleshooting

#### I can't get Payload to start properly with Postgres in prod mode <!-- omit in toc -->

Using Postgres in development mode enables automatic database synchronization with the Payload collections. But when starting in production mode it's turned off and the database is expected to have been setup with the collections. So when Postgres is started without a database, Payload will encounter errors.

The solution is to have an initial migration ready for Payload to load during startup.

##### Create a migration <!-- omit in toc -->

Make sure Postgres is running. Start Payload in development mode to setup your database with the collections.

```sh
nx dev [app-name]
```

Create a migration.

```sh
nx payload [app-name] migrate:create
```

Now Payload will run migrations automatically when starting in production mode.

> [!IMPORTANT]
> The property `db.prodMigrations` in `payload.config.ts` must be set for this to work.

## You don't have an Nx workspace?

Just use the plugin sibling to get started from scratch.

See [`create-nx-payload`](https://github.com/codeware-sthlm/codeware/tree/master/packages/create-nx-payload/README.md) for more details.

## Plugin Generators

### `init` _(internal)_ <!-- omit in toc -->

Initialize the `@cdwr/nx-payload` plugin.

_No options_.

### `application` <!-- omit in toc -->

Alias: `app`

Generate a Payload application powered by Next.js.

| Option           | Type   | Required | Default   | Description                                             |
| ---------------- | ------ | :------: | --------- | ------------------------------------------------------- |
| `name`           | string |    ✅    |           | The name of the application.                            |
| `directory`      | string |    ✅    |           | The path of the application files.                      |
| `database`       | string |          | `mongodb` | Preferred database to setup [`mongodb`, `postgres`].    |
| `tags`           | string |          | `''`      | Comma separated tags.                                   |
| `e2eTestRunner`  | string |          | `none`    | The preferred e2e test runner [ `playwright`, `none` ]. |
| `linter`         | string |          | `eslint`  | The tool to use for running lint checks.                |
| `unitTestRunner` | string |          | `jest`    | The preferred unit test runner [ `jest`, `none` ].      |

> 💡 `name` can also be provided as the first argument (used in the examples in this readme)

## Migrate from Payload v2 to v3

Most of the setup is the same, but there are some breaking changes that you need to be aware of. Besides that, follow the type errors to update the code.

### Preparation

- Nx must have version `20.4.2` or higher.
- React must have version `19.0.0` or higher.
- Install `@nx/next` plugin.
- Install `@nx/eslint` plugin.
  - Convert to flat file configuration.
  - Use `eslint.config.mjs` files.
- Install `graphql` package.

### Packages

Payload now use a common version for its packages.

Install new packages:

- `@payloadcms/next`
- `@payloadcms/graphql` (dev dependency)

Update to latest:

- `payload`
- `@payloadcms/db-mongodb`
- `@payloadcms/db-postgres`
- `@payloadcms/richtext-lexical`

Remove deprecated packages:

- `@payloadcms/bundler-webpack`
- `@payloadcms/richtext-slate`
- `@nx/express` (used elsewhere?)

## Versions Compatibility

Later versions of Nx or Payload might work as well, but the versions below have been used during tests.

| Plugin    | Nx        | Payload   | React     | Next.js   |
| --------- | --------- | --------- | --------- | --------- |
| `^2.0.0`  | `^20.4.2` | `^3.0.0`  | `^19.0.0` | `^15.0.0` |
| `^1.0.0`  | `20.x`    | `^2.30.3` | `^18.0.0` | -         |
| `^0.11.0` | `20.x`    | `^2.30.3` | `^18.0.0` | -         |
| `^0.10.0` | `19.x`    | `^2.8.2`  | -         | -         |
| `^0.9.5`  | `^19.5.7` | `^2.8.2`  | -         | -         |
| `^0.9.0`  | `^19.0.2` | `^2.8.2`  | -         | -         |
| `^0.8.0`  | `^18.3.4` | `^2.8.2`  | -         | -         |
| `^0.7.0`  | `~18.2.2` | `^2.8.2`  | -         | -         |
| `^0.6.0`  | `~18.1.1` | `^2.8.2`  | -         | -         |
| `^0.5.0`  | `~18.0.3` | `^2.8.2`  | -         | -         |
| `^0.1.0`  | `^17.0.0` | `^2.5.0`  | -         | -         |
