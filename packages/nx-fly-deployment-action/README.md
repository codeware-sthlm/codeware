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

## Required Application Setup

To have the choice of deciding which apps to deploy, you need to setup those apps with two opnionated files.

1. The obvious file for Fly deployments is `fly.toml`, which is the blueprint for the deployment.  
   This file location is defined in the `github.json` file.

2. The other file is `github.json`, where the deployment can be customized for the application.
   This file can be saved anywhere in the application, but it's recommended to be in the root path.  
   The JSON schema file can be found [here](https://github.com/codeware-sthlm/codeware/tree/master/packages/nx-fly-deployment-action/src/lib/utils/github-config.schema.json).

When any of these files are missing, or misplaced, the application will be skipped from deployment.

> [!TIP]
> The `github.json` allows for disabling the deployment for the application. This is useful for skipping deployments for applications that are not ready for deployment for any reason.

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
> The environment is provided in environment variable `DEPLOY_ENV` for the deployed applications, together with some opinionated values:
>
> - `APP_NAME` - The name of the app
> - `PR_NUMBER` - The pull request number (otherwise empty)

## Inputs

See [action.yaml](action.yml) for descriptions of the inputs.

### Additional input details

`tenants`

When deploying multi-tenant applications, you can provide a list of tenant IDs. Each affected project will be deployed once per tenant with:

- A unique app name: `<base-app-name>-<tenant-id>` (e.g., `cdwr-web-demo`, `cdwr-web-customer1`)
- The `TENANT_ID` environment variable set to the tenant ID

Provide the tenant IDs as multiline values.

```yaml
- uses: ./packages/nx-fly-deployment-action
  with:
    tenants: |
      demo
      customer1
      customer2
```

If no tenants are provided, the action behaves as before (single deployment per project).

`postgres-preview`

When a Fly Postgres cluser has been created, you can attach the application to a postgres database automatically on deployment to the `preview` environment.

Provide the name of the postgres application. Fly will provide `DATABASE_URL` as a secret to the application to be able to connect to the database.

Before the application gets destroyed, the Postgres cluster will detach the application from the database.

Read more about [attach or detach a Fly app](https://fly.io/docs/postgres/managing/attach-detach/#attach-a-fly-app).

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
