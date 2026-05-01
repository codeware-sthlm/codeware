import * as core from '@actions/core';
import * as github from '@actions/github';

import type { ActionInputs } from './schemas/action-inputs.schema';

const BLOCKED_PREFIXES = ['renovate', 'update-nx-workspace'];

type WorkflowRun = {
  conclusion: string;
  head_branch: string;
  event: string;
  pull_requests: Array<{ number: number; head: { ref: string } }>;
};

type Result = {
  skip: boolean;
};

export async function flyConditions({
  previewLabel,
  token
}: ActionInputs): Promise<Result> {
  const { context } = github;
  const { eventName, ref, payload } = context;

  const pr = payload['pull_request'] as
    | { number: number; head: { ref: string } }
    | undefined;

  const branchName = pr?.head?.ref ?? ref.replace('refs/heads/', '');
  const action = payload['action'] as string | undefined;
  const prNumber =
    pr?.number ?? (payload['issue'] as { number?: number } | undefined)?.number;

  core.info(
    [
      'Analyzing deployment conditions:',
      `  Branch:        ${branchName || 'N/A'}`,
      `  Event:         ${eventName}`,
      `  Action:        ${action || 'N/A'}`,
      `  PR number:     ${prNumber ?? 'N/A'}`,
      `  Preview label: ${previewLabel}`
    ].join('\n')
  );

  if (eventName === 'workflow_dispatch') {
    core.info('Manual workflow dispatch -> continue');
    return { skip: false };
  }

  if (eventName === 'workflow_run') {
    return handleWorkflowRun(payload['workflow_run'] as WorkflowRun, {
      previewLabel,
      token,
      context
    });
  }

  if (BLOCKED_PREFIXES.some((prefix) => branchName.startsWith(prefix))) {
    core.info(`Blocked branch prefix '${branchName}' -> skip`);
    return { skip: true };
  }

  if (eventName !== 'pull_request') {
    core.info('Non pull request event -> continue');
    return { skip: false };
  }

  if (!prNumber) {
    core.setFailed('Could not determine pull request number from context');
    return { skip: true };
  }

  if (action === 'closed') {
    core.info('Pull request closed -> continue');
    return { skip: false };
  }

  // On open/reopen: ensure the preview label is present and continue
  if (action === 'opened' || action === 'reopened') {
    const octokit = github.getOctokit(token);
    const { data: existing } = await octokit.rest.issues.listLabelsOnIssue({
      ...context.repo,
      issue_number: prNumber
    });

    if (!existing.some((l) => l.name === previewLabel)) {
      await octokit.rest.issues.addLabels({
        ...context.repo,
        issue_number: prNumber,
        labels: [previewLabel]
      });
      core.info(`Added preview label '${previewLabel}' -> continue`);
    } else {
      core.info(`Preview label '${previewLabel}' already present -> continue`);
    }
    return { skip: false };
  }

  // All other PR events (synchronize, labeled, etc.): gate on label
  const octokit = github.getOctokit(token);
  const { data: labels } = await octokit.rest.issues.listLabelsOnIssue({
    ...context.repo,
    issue_number: prNumber
  });

  if (labels.some((l) => l.name === previewLabel)) {
    core.info(`Preview label '${previewLabel}' present -> continue`);
    return { skip: false };
  }

  core.info(`Preview label '${previewLabel}' not found -> skip`);
  return { skip: true };
}

async function handleWorkflowRun(
  workflowRun: WorkflowRun,
  opts: {
    previewLabel: string;
    token: string;
    context: typeof github.context;
  }
): Promise<Result> {
  const { previewLabel, token, context } = opts;
  const { conclusion, head_branch, event, pull_requests } = workflowRun;

  core.info(
    [
      'CI workflow_run context:',
      `  Conclusion:  ${conclusion}`,
      `  Branch:      ${head_branch}`,
      `  Trigger:     ${event}`
    ].join('\n')
  );

  if (conclusion !== 'success') {
    core.info(`CI checks did not pass (conclusion: '${conclusion}') -> skip`);
    return { skip: true };
  }

  if (BLOCKED_PREFIXES.some((prefix) => head_branch.startsWith(prefix))) {
    core.info(`Blocked branch prefix '${head_branch}' -> skip`);
    return { skip: true };
  }

  if (event !== 'pull_request') {
    core.info(`CI triggered by '${event}' (non-PR) -> continue`);
    return { skip: false };
  }

  const prInfo = pull_requests[0];
  if (!prInfo) {
    core.info('No PR associated with CI run -> skip');
    return { skip: true };
  }

  core.info(`PR number: ${prInfo.number}`);

  const octokit = github.getOctokit(token);
  const { data: labels } = await octokit.rest.issues.listLabelsOnIssue({
    ...context.repo,
    issue_number: prInfo.number
  });

  if (!labels.some((l) => l.name === previewLabel)) {
    // First successful CI run for this PR — add the preview label
    await octokit.rest.issues.addLabels({
      ...context.repo,
      issue_number: prInfo.number,
      labels: [previewLabel]
    });
    core.info(`Added preview label '${previewLabel}' -> continue`);
  } else {
    core.info(`Preview label '${previewLabel}' present -> continue`);
  }

  return { skip: false };
}
