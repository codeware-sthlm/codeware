<p align="center">
  <br />
  <img width="200" src="../../assets/cdwr-cloud.png" alt="codeware sthlm logo">
  <br />
  <br />
</p>

<h1 align='center'>Nx Migrate</h1>

<p align='center'>
  GitHub action that brings automatic <a href='https://nx.dev'>Nx</a> migrations to your workspace.
  <br />
  <br />
  <a href='https://opensource.org/licenses/MIT'><img src='https://img.shields.io/badge/License-MIT-green.svg' alt='MIT'></a>
  <br />
  <br />
</p>

## Description

This action assures your Nx workspace stays up to date.

When the action runs it will check you local Nx version to see whether there's a new version available.
In that case a migration process is triggered and the changes are tested by your test setup.

A pull request is always created for a new version, which can by auto-merged when all tests have passed.

> As long as the repository is setup to allow auto-merges

## Usage

Using the action is currently limited to this repository since the package isn't deployed.

```yaml
- uses: actions/checkout@v4

# Install dependencies and tools...
# Build the package...

- name: Run Nx migrate
  uses: ./packages/nx-migrate-action
  with:
    token: ${{ secrets.BOT_TOKEN || secrets.GITHUB_TOKEN }}
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
  actions: write
```

The `actions` permission is required when the created pull requests have status checks. Without this permission those checks won't be able to run. It applies only to when using the `GITHUB_TOKEN`.

##### Option 2

Generate a [Personal Access Token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens) (PAT).

- Classic PAT should have `repo` and `workflow` scopes
- Fine-grained PAT should have `Contents` and `Pull requests` set to `Read and write`

Add the token to the repository secrets in **Settings** -> **Secrets and variables** -> **Actions**.

## Inputs

See [action.yaml](action.yml) for descriptions of the inputs.

### Additional input details

`auto-merge`

It will always be `false` when auto merge isn't enabled in the repository settings.

For major version updates this option is ignored. When it's set to `true` a comment will be added to the pull request explaining why auto-merge is disabled.

`check-token`

It's not recommended to use this in production since it might block the workflow from running.

## Development

### Running locally with `act`

GitHub actions can be run locally using [act](https://github.com/nektos/act).

By providing a proper PAT the action will be able to run just like it does in the GitHub Actions runner.

Getting started instructions can be found in [.github/workflows/README.md](.github/workflows/README.md).

#### After `act` has been installed

Verify that the secrets and variables have the desired values:

- `.env.act`
- `.secrets`
- `.vars`

Run the action:

```sh
nx act nx-migrate-action
```
