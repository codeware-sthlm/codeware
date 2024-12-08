<p align="center">
  <br />
  <img width="200" src="../../assets/cdwr-cloud.png" alt="codeware sthlm logo">
  <br />
  <br />
</p>

<h1 align='center'>Fly Environment Action</h1>

<p align='center'>
  GitHub action that analyzes which environment to deploy your <a href='https://fly.io'>Fly.io</a> applications to.
  <br />
  <br />
  <a href='https://www.npmjs.com/package/@cdwr/deploy-env-action'><img src='https://img.shields.io/npm/v/@cdwr/deploy-env-action?label=npm%20version' alt='@cdwr/deploy-env-action npm'></a>
  &nbsp;
  <a href='https://opensource.org/licenses/MIT'><img src='https://img.shields.io/badge/License-MIT-green.svg' alt='MIT'></a>
  <br />
  <br />
</p>

## Description

This action will analyze which environment to deploy your <a href='https://fly.io'>Fly.io</a> applications to.

It is intended to be used in a previous job before the [Fly Deployment Action](https://github.com/codeware-sthlm/codeware/tree/master/packages/nx-fly-deployment-action/README.md).

## Usage

Using the action is currently limited to this repository since the package isn't deployed.

```yaml
jobs:
  deploy-env:
    runs-on: ubuntu-latest

    outputs:
      environment: ${{ steps.environment.outputs.environment }}

    steps:
      # Checkout, install dependencies and tools...
      # Build 'deploy-env-action' package...

      - name: Determine environment
        id: environment
        uses: ./packages/deploy-env-action

  fly-deployment:
    needs: deploy-env
    runs-on: ubuntu-latest

    environment:
      name: ${{ needs.deploy-env.outputs.environment }}
      url: https://${{ steps.deployment.outputs.hostname }}

    steps:
      # Checkout, install dependencies and tools...
      # Build 'nx-fly-deployment-action' package...

      - name: Run Deployment to Fly
        uses: ./packages/nx-fly-deployment-action
```
