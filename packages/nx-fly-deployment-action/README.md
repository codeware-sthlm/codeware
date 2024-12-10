<p align="center">
  <br />
  <img width="200" src="../../assets/cdwr-cloud.png" alt="codeware sthlm logo">
  <br />
  <br />
</p>

<h1 align='center'>Nx Fly Deployment Action</h1>

<p align='center'>
  GitHub action that brings automatic <a href='https://fly.io'>Fly.io</a> deployments to your <a href='https://nx.dev'>Nx</a>  workspace.
  <br />
  <br />
  <a href='https://www.npmjs.com/package/@cdwr/nx-fly-deployment-action'><img src='https://img.shields.io/npm/v/@cdwr/nx-fly-deployment-action?label=npm%20version' alt='@cdwr/nx-fly-deployment-action npm'></a>
  &nbsp;
  <a href='https://opensource.org/licenses/MIT'><img src='https://img.shields.io/badge/License-MIT-green.svg' alt='MIT'></a>
  <br />
  <br />
</p>

## Description

This action will manage deployments to [Fly.io](https://fly.io) of your [Nx](https://nx.dev) workspace applications.

## Usage

> [!IMPORTANT]
> Using the action is currently limited to cloning this repository since the package isn't deployed according to action best practices.
>
> We have a monorepo and are considering other options to make the action available to other repositories.

```yaml
- uses: actions/checkout@v4
  with:
    fetch-depth: 0

# Install dependencies and tools...
# Build 'fly-deployment-action' package...

# Fly CLI must be installed
- name: Install Fly CLI
  uses: superfly/flyctl-actions/setup-flyctl@master
  with:
    version: 0.3.45

# Let Nx analyze which projects are affected and hence will be deployed
- name: Analyze affected projects to deploy
  uses: nrwl/nx-set-shas@v4
  with:
    set-environment-variables-for-job: true

- name: Run Nx Fly Deployment
  uses: ./packages/nx-fly-deployment-action
  with:
    fly-api-token: ${{ secrets.FLY_API_TOKEN }}
    token: ${{ secrets.GITHUB_TOKEN }}
```

### Determine environment

The environment to deploy to is determined by the event type and branch name.

**Pull requests** are deployed to a **preview** environment.

**Push events** on the `main` branch are deployed to the **production** environment.

> [!TIP]
> The environment is also set in the `DEPLOY_ENV` environment variable for the deployed applications

## Inputs

See [action.yaml](action.yml) for descriptions of the inputs.

### Additional input details

`secrets`

The secrets are passed to the deployed applications as Fly secrets. All secrets are passed to all applications.

Provide the secrets as multiline key/value strings.

```yaml
- uses: ./packages/nx-fly-deployment-action
  with:
    secrets: |
      SECRET_KEY1=secret-value1
      SECRET_KEY2=secret-value2
```

> [!NOTE]
> The same pattern also applies to `env` input.

### Outputs

See [action.yaml](action.yml) for descriptions of the outputs.
