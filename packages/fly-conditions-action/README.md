<p align="center">
  <br />
  <img width="200" src="../../assets/cdwr-cloud.png" alt="codeware sthlm logo">
  <br />
  <br />
</p>

<h1 align='center'>Fly Conditions Action</h1>

<p align='center'>
  GitHub action that analyzes deployment conditions and decides whether the Fly.io pipeline should run.
  <br />
  <br />
  <a href='https://www.npmjs.com/package/@cdwr/fly-conditions-action'><img src='https://img.shields.io/npm/v/@cdwr/fly-conditions-action?label=npm%20version' alt='@cdwr/fly-conditions-action npm'></a>
  &nbsp;
  <a href='https://opensource.org/licenses/MIT'><img src='https://img.shields.io/badge/License-MIT-green.svg' alt='MIT'></a>
  <br />
  <br />
</p>

## Description

Gate action that runs before the rest of the deployment pipeline. It outputs `skip: 'true'` when deployment should be suppressed, or `skip: 'false'` when the pipeline should proceed.

**Rules applied in order:**

1. `workflow_dispatch` — always continue
2. Blocked branch prefixes (`renovate`, `update-nx-workspace`) — skip
3. Non-`pull_request` events — always continue
4. PR `closed` — continue (triggers cleanup jobs)
5. PR `opened` / `reopened` — add the preview label if absent, then continue
6. All other PR events (`synchronize`, `labeled`, …) — continue only if the preview label is present

## Usage

```yaml
jobs:
  analyze-conditions:
    runs-on: ubuntu-latest
    outputs:
      skip: ${{ steps.conditions.outputs.skip }}

    steps:
      - uses: actions/checkout@v4

      # Install dependencies, build the action...

      - name: Analyze deployment conditions
        id: conditions
        uses: ./packages/fly-conditions-action
        with:
          preview-label: preview-deploy
          token: ${{ secrets.GITHUB_TOKEN }}

  next-job:
    needs: analyze-conditions
    if: needs.analyze-conditions.outputs.skip != 'true'
    ...
```

## Inputs

| Input           | Description                                      | Required |
| --------------- | ------------------------------------------------ | -------- |
| `preview-label` | GitHub label used to gate PR preview deployments | Yes      |
| `token`         | GitHub token for label API access                | Yes      |

## Outputs

| Output | Description                                         |
| ------ | --------------------------------------------------- |
| `skip` | `'true'` to skip the pipeline, `'false'` to proceed |
