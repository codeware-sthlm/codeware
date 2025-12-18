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

Fits perfectly with [Nx Pre-deploy Action](https://github.com/codeware-sthlm/codeware/tree/main/packages/nx-pre-deploy-action#readme) for multi-tenant setups.

> [!NOTE] Architecture, multi-tenant setup, and configuration
> **See:** [DEPLOYMENT.md](https://github.com/codeware-sthlm/codeware/blob/main/DEPLOYMENT.md)

## Required Application Setup

Each deployable app requires two configuration files:

1. **`fly.toml`** - Fly.io deployment blueprint (path specified in github.json)
2. **`github.json`** - Deployment configuration (recommended in app root)

Applications without proper configuration will be skipped during deployment.

> [!TIP]
> Use `deploy: false` in `github.json` to temporarily disable deployments for an app.

> [!NOTE] github.json schema, field descriptions, and examples
> **See:** [Per-App Configuration in DEPLOYMENT.md](https://github.com/codeware-sthlm/codeware/blob/main/DEPLOYMENT.md#per-app-configuration-githubjson)

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
# Build packages...

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

### Environment Determination

Environment is determined by the GitHub event:

- Pull requests → `preview`
- Push to main → `production`

Environment variables provided to deployed apps: `DEPLOY_ENV`, `APP_NAME`, `PR_NUMBER`, `TENANT_ID`

> [!NOTE] Environment detection logic and affected apps analysis
>
> **See:** [Nx Pre-deploy Action](https://github.com/codeware-sthlm/codeware/tree/main/packages/nx-pre-deploy-action#features)

## Inputs

See [action.yaml](action.yml) for descriptions of the inputs.

### Additional input details

#### `app-details`

Provide a JSON object that maps app names to their deployment configurations. This supports both multi-tenant deployments and multi-deployment scenarios (e.g., multiple environments). This is typically the output from the [Nx Pre-deploy Action](https://github.com/codeware-sthlm/codeware/tree/main/packages/nx-pre-deploy-action#readme).

> [!NOTE] Setting up multi-tenant configuration in Infisical
> **See:** [Multi-tenant Setup Guide](https://github.com/codeware-sthlm/codeware/tree/main/packages/nx-pre-deploy-action#multi-tenant-setup)

**Structure:**

```json
{
  "web": [
    {
      "tenant": "acme",
      "env": { "PUBLIC_URL": "https://acme.example.com" },
      "secrets": { "API_KEY": "sk_acme_..." }
    },
    {
      "tenant": "globex",
      "env": { "PUBLIC_URL": "https://globex.example.com" },
      "secrets": { "API_KEY": "sk_globex_..." }
    }
  ],
  "cms": [{ "tenant": "acme" }]
}
```

**Behavior:**

- Each app is deployed once per deployment configuration
- Apps get unique names: `<base-app-name>-<tenant-id>` (e.g., `cdwr-web-acme`, `cdwr-web-globex`)
- The `TENANT_ID` environment variable is set for each deployment
- **Config merging**: Global `env`/`secrets` are merged with deployment-specific config (deployment wins)
- If no `app-tenants` provided, apps deploy once with only global config

**Example usage:**

```yaml
- name: Deploy
  uses: ./packages/nx-fly-deployment-action
  with:
    app-details: ${{ needs.pre-deploy.outputs.app-tenants }}
    env: |
      GLOBAL_VAR=shared-value
    secrets: |
      SHARED_SECRET=xyz
```

In this example, `GLOBAL_VAR` and `SHARED_SECRET` are available to all deployments, but deployment-specific values take precedence if they have the same key.

**Note:** The `tenant` field is optional. You can provide `env`/`secrets` without a tenant for multi-deployment scenarios (e.g., different configurations for staging/production).

#### `postgres-preview`

When a Fly Postgres cluster has been created, you can attach the application to a postgres database automatically on deployment to the `preview` environment.

Provide the name of the postgres application. Fly will provide `DATABASE_URL` as a secret to the application to be able to connect to the database.

Before the application gets destroyed, the Postgres cluster will detach the application from the database.

Read more about [attach or detach a Fly app](https://fly.io/docs/postgres/managing/attach-detach/#attach-a-fly-app).

#### `secrets`

Global secrets passed to all deployed applications as Fly secrets. These are merged with deployment-specific secrets from `app-details` (deployment-specific takes precedence).

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
