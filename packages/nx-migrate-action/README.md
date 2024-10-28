# Nx Migrate GitHub Action

## Description

This GitHub action assures your Nx workspace stays up to date.

When the action runs it will check you local Nx version to see whether there's a new version available.
In that case a migration process is triggered and the changes are tested by your test setup.

A pull request is always created for a new version, which can by auto-merged when all tests have passed.

> As long as the repository is setup to allow auto-merges

## Usage

Using the action is currently limited to this repository since the package isn't deployed.

```yaml
- uses: actions/checkout@v4

# Build the package...

- name: Run Nx migrate
  uses: ./packages/nx-migrate-action
  with:
    token: ${{ secrets.BOT_TOKEN }}
```

### Permissions

#### Pull requests

GitHub Actions must be allowed to create pull requests.  
This feature can be enabled for the repository in **Settings** -> **General** -> **Workflow permissions**.

#### Token

A token is a required input to the action, which needs to be able to both read and write to the repository.

##### Option 1

Use the default `GITHUB_TOKEN` and elevate the permissions in the workflow.

```yml
permissions:
  contents: write
  pull-requests: write
```

_Replace `BOT_TOKEN` with `GITHUB_TOKEN`._

##### Option 2

Generate a [Personal Access Token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens) (PAT).

- Classic PAT should have `repo` and `workflow` scopes
- Fine-grained PAT should have `Contents` and `Pull requests` set to `Read and write`

Add the token to the repository secrets in **Settings** -> **Secrets and variables** -> **Actions**.

## Inputs

See [action.yaml](action.yml).

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

**Important!**

> Setting `INPUT_DRY-RUN=true` in `.env.test` ensures that only action validation and version analyze is run.  
> Hence, nothing gets changed.
