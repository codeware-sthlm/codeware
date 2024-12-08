<p align="center">
  <br />
  <img width="200" src="../../assets/cdwr-cloud.png" alt="codeware sthlm logo">
  <br />
  <br />
</p>

<h1 align='center'>Core Utilities</h1>

<p align='center'>
  A set of core utilities developed for the Codeware ecosystem.
  <br />
  <br />
  <a href='https://www.npmjs.com/package/@cdwr/core'><img src='https://img.shields.io/npm/v/@cdwr/core?label=npm%20version' alt='@cdwr/core npm'></a>
  &nbsp;
  <a href='https://opensource.org/licenses/MIT'><img src='https://img.shields.io/badge/License-MIT-green.svg' alt='MIT'></a>
  <br />
  <br />
</p>

## Contents <!-- omit in toc -->

- [Installation](#installation)
- [Usage](#usage)
  - [Actions](#actions)
  - [Release](#release)
  - [Testing](#testing)
  - [Utils](#utils)
  - [Zod](#zod)

## Installation

```sh
npm install -D @cdwr/core
```

## Usage

The core package provides a set of utilities that can be used in any Node.js project depending on the use case.
Development of these utilities are opinionated to the needs of Codeware projects. However, they are designed to be flexible and aims to be easy to use in other projects as well.

> [!TIP]
> The package comes with both ESM and CommonJS support

### Actions

```ts
import { ... } from '@cdwr/core/actions';
```

Utilities to use when developing GitHub Actions.

### Release

```ts
import { release, ... } from '@cdwr/core/release';
```

A programmatic CLI for the Nx release process.

Powered by [clack](https://github.com/bombshell-dev/clack) to provide a guided release process.

#### Example usage <!-- omit in toc -->

```ts
// run-release.ts
import { release } from '@cdwr/core/release';

(async () => {
  process.exit(await release());
})();
```

```sh
npx tsx ./path/to/run-release.ts
```

### Testing

```ts
import { createSchemaTests, ... } from '@cdwr/core/testing';
```

Create an automated test suite for your [Zod](https://zod.dev/) schemas and fixture data.

Verify the correctness of your schema transformations by comparing the output to your API responses or other data sources.

Enable snapshot testing to visually inspect the generated output and catch unintended changes to either your schema or fixture data. The snapshots also serves as reference for the expected output structure.

#### Example usage <!-- omit in toc -->

> [!TIP]
> It's recommended to create a separate file for each schema definition, but it's not required

For each schema you want to test must be registered to the test suite by calling `register` function.

> [!WARNING]
> Schema definition and registration is kept together here but it's only to make it easier to understand.
> In a real project, the schema definition and registration should be kept separate. Otherwise, you risk adding test utilities to the production bundle.
>
> To be on the safe side, add all registrations to test files since they're always kept away from the production bundle.

```ts
// schemas/page.ts
import { SchemaRegistry } from '@cdwr/core/testing';

const PageSchema = z.object({ ... });

// PageSchema expects to have fixture file `__fixtures__/page.json`
SchemaRegistry.register('page', PageSchema, { name: 'PageSchema'});
```

```ts
// equivalent in schemas/user.ts
const UserSchema = z.object({ ... });

// UserSchema expects to have fixture file `__fixtures__/api/user.json`
SchemaRegistry.register('api/user', UserSchema, { name: 'UserSchema'});
```

Create a test file that will run the tests, for example `schemas.spec.ts`.

```ts
// schemas.spec.ts
import { createSchemaTests } from '@cdwr/core/testing';

// Run tests for all registered schemas in the `schemas` directory
createSchemaTests({
  schemaDir: join(__dirname, 'schemas'),
  description: 'Schema validation',
  snapshots: true
});
```

##### Test rules <!-- omit in toc -->

> [!IMPORTANT]
> Dangling fixtures without a matching schema will be reported as failures, hence tests will fail.
>
> Schemas without a fixture will be skipped and reported as warnings, hence tests will pass.

##### Options <!-- omit in toc -->

> [!NOTE]
> Fixtures are expected to be in the same directory as the `schemaDir`, named `__fixtures__`.
> This can be overridden by providing the `fixtureDir` option.
>
> When snapshots are enabled, the output will follow how your test runner is configured.
> For example, if you are using `jest` or `vitest`, the snapshots will be saved in the `__snapshots__` directory.

### Utils

```ts
import { ... } from '@cdwr/core/utils';
```

A set of utility functions for common tasks.

### Zod

```ts
import { withCamelCase, ... } from '@cdwr/core/zod';
```

A set of Zod schemas and opininated transformers.

#### `withCamelCase` <!-- omit in toc -->

Transform data properties from `PascalCase` or `snake_case` to `camelCase`.

```ts
// target.schema.ts
const ServiceSchema = z.object({
  id: z.string(),
  apiKey: z.string(),
  userId: z.string(),
  machines: z.array(
    z.object({
      config: z.object({
        env: z.record(z.string())
      })
    })
  ),
  machineToken: z.string()
});

// Expected API response
const apiResponse = {
  ID: 'random',
  APIKey: 'qwerty',
  UserID: '123',
  Machines: [
    {
      config: {
        env: { NODE_ENV: 'test', IS_CI: 'true' }
      }
    }
  ],
  machine_token: 'abc123'
};
```

Default transformation generates output where we might see some unintended changes to the data.

```ts
withCamelCase(ServiceSchema).parse(apiResponse);

// {
//   id: 'random',
//   aPIKey: 'qwerty',
//   userId: '123',
//   machines: [{
//     config: {
//       env: { nodeEnv: 'test', isCi: 'true' }
//     }
//   }],
//   machineToken: 'abc123'
// }
```

For example, the `APIKey` property is transformed to `aPIKey` and environment variables are treated as normal JSON keys.

- `preserve` - apply dot notation paths to keep certain path values to the original casing.
- `specialCases` - add mappings between the original keys and the target keys.

```ts
withCamelCase(ServiceSchema, {
  preserve: ['machines.config.env'],
  specialCases: { APIKey: 'apiKey' }
}).parse(apiResponse);

// {
//   id: 'random',
//   apiKey: 'qwerty',
//   userId: '123',
//   machines: [{
//     config: {
//       env: { NODE_ENV: 'test', IS_CI: 'true' }
//     }
//   }],
//   machineToken: 'abc123'
// }
```

> [!IMPORTANT]
> These issues are the only ones that can be resolved by providing custom transformation rules.
>
> This transformer has no intention to do more than just the necessary to comply to [Fly.io](https://fly.io) naming conventions.
