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

### Outputs

The action will output the following variables:

- `environment`: The environment used for deployment.
- `destroyed`: A list of project names that were destroyed.
- `skipped`: A list of project names that were skipped for some reason.
- `deployed`: JSON object containing the deployed project names and their urls.
