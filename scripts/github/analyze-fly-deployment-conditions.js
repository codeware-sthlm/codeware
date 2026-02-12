// @ts-check

/**
 * @typedef {import('@actions/github/lib/utils').GitHub} GitHub
 * @typedef {import('@actions/github/lib/context').Context} GitHubContext
 * @typedef {typeof import('@actions/core')} Core
 */

/**
 * Analyze Fly deployment conditions and determine whether to skip the deployment process.
 *
 * This function is intended to be used within a GitHub Actions workflow where Fly deployment action ise used.
 *
 * **Rules in order of precedence:**
 *
 * - Skip deployment for branches with specific prefixes (e.g., 'renovate', 'update-nx-workspace')
 * - For non-pull request events, always continue deployment
 * - Continue deployment for 'opened', 'reopened', or 'closed' pull request actions
 *   - Ensure label exists unless pull request is closed
 * - If the label does not for the pull request, skip deployment
 *
 * **Outputs:**
 *
 * - `skip`: `'true'` | `'false'` indicating whether to skip the deployment process
 * - `label`: the preview label used for the deployment to routed from `label` parameter
 *
 * **Usage:**
 *
 * ```yml
 * - uses: actions/github-script@v7
 *   id: preview
 *   env:
 *     PREVIEW_LABEL: ${{ env.FLY_PREVIEW_LABEL  }}
 *   with:
 *     script: |
 *       const { default: analyze } = await import(`${process.env.GITHUB_WORKSPACE}/scripts/github/analyze-fly-deployment-conditions.js`);
 *       await analyze({ github, context, core, label: process.env.PREVIEW_LABEL });
 * ```
 *
 * @param {{ github: InstanceType<GitHub>; context: GitHubContext; core: Core; label: string }} params
 * @returns {Promise<void>}
 */
async function analyzeFlyDeploymentConditions({
  github,
  context,
  core,
  label
}) {
  /** @param {boolean} value */
  const setSkip = (value) => core.setOutput('skip', value ? 'true' : 'false');

  // Set the label output regardless of deployment decision to be used later when needed
  core.setOutput('label', label || '');

  // Skip all checks for manual workflow dispatches
  if (context.eventName === 'workflow_dispatch') {
    core.info('Manual workflow dispatch detected -> continue');
    return setSkip(false);
  }

  // Define branch name prefixes that should block/skip deployment
  const blockedPrefixes = ['renovate', 'update-nx-workspace'];

  /** @type {string} Determine the branch name from the context */
  const branchName =
    context.payload.pull_request?.head?.ref ||
    context.ref?.replace('refs/heads/', '');

  const {
    eventName,
    payload: { action, issue, pull_request }
  } = context;

  const issueNumber = issue?.number;
  const prNumber = pull_request?.number;

  core.info(`Analyzing deployment conditions:
  - Branch name: ${branchName || 'N/A'}
  - Event: ${eventName}
  - Action: ${action || 'N/A'}
  - Issue number: ${issueNumber || 'N/A'}
  - Pull request number: ${prNumber || 'N/A'}
  - Provided preview label: ${label || 'N/A'}
  - Blocked branch name prefixes: ${blockedPrefixes.join(', ')}`);

  // Skip blocked branche prefixes
  if (
    branchName &&
    blockedPrefixes.some((prefix) => branchName.startsWith(prefix))
  ) {
    core.info(`Detected blocked branch '${branchName}' -> skip`);
    return setSkip(true);
  }

  // Non-PR events should continue workflow
  if (eventName !== 'pull_request') {
    core.info('Non pull request event detected -> continue');
    return setSkip(false);
  }

  // Ensure we are in the context of an issue or pull request for PR events
  const issueOrPrNumber = issueNumber || prNumber;
  if (!issueOrPrNumber) {
    const error =
      'analyzeFlyDeploymentConditions must be run in the context of an issue or pull request';
    core.setFailed(error);
    return;
  }

  // Handle PR events that should continue workflow
  if (action === 'closed' || action === 'opened' || action === 'reopened') {
    core.info(`Pull request ${action} -> continue`);
    return setSkip(false);
  }

  // If no preview label is provided, continue workflow
  if (!label) {
    core.warning('No preview label provided -> continue');
    return setSkip(false);
  }

  // Check the preview label for the issue
  try {
    const { data: labels } = await github.rest.issues.listLabelsOnIssue({
      ...context.repo,
      issue_number: issueOrPrNumber
    });
    const hasLabel = labels.some((current) => current.name === label);

    // Continue if preview label is found
    if (hasLabel) {
      core.info(`Preview label '${label}' already present -> continue`);
      return setSkip(false);
    }

    // Ensure label is added when PR is opened or reopened
    if (action === 'opened' || action === 'reopened') {
      await github.rest.issues.addLabels({
        ...context.repo,
        issue_number: issueOrPrNumber,
        labels: [label]
      });
      core.info(`Added preview label '${label}' -> continue`);
      return setSkip(false);
    }

    core.info(`Preview label '${label}' was not found on issue -> skip`);
    setSkip(true);
  } catch (error) {
    setSkip(true);
    core.setFailed(error instanceof Error ? error.message : String(error));
    throw error;
  }
}

export default analyzeFlyDeploymentConditions;
