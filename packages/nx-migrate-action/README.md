# Nx Migrate GitHub Action

## Description

This GitHub action assures your Nx workspace stays up to date.

When the action runs it will check you local Nx version to see whether there's a new version available.
In that case a migration process is run and the changes are tested by invoking targets `build`, `lint`, `test` and `e2e`.

A pull request is created which can by auto-merged when all tests have passed.

> As long as the branch allows auto-merge

## Inputs

See [action.yaml](action.yml).

## Usage

### Workflow

```yaml
Workflow example...
```

### Node

Maybe?

## Development

### Running locally

Install CLI

```sh
npm i -g @github/local-action
```

Invoke action

```sh
local-action packages/nx-migrate-action src/lib/main.ts packages/nx-migrate-action/.env.test
```

> **Important!**  
> Setting `INPUT_DRY-RUN=true` in `.env.test` ensures that only action validation and version analyze is run.  
> Hence, nothing gets changed.

## Codeware dev notes

Testing the workflow

```sh
act schedule -j nx-migrate

# Dry-run only
act schedule -n -j nx-migrate
```
