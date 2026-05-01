import * as core from '@actions/core';
import { upsertPullRequestComment } from '@codeware/core/actions';

import type { ActionInputs, Project } from './schemas/action-inputs.schema';

function renderProjectsTable(projects: Project[]): string[] {
  const deployable = projects.filter((p) => p.action !== 'destroy');
  if (deployable.length === 0) {
    return [':information_source: No affected projects to deploy.'];
  }

  const deployedCount = deployable.filter((p) => p.action === 'deploy').length;
  const lines: string[] = [];

  if (deployedCount > 0) {
    lines.push(
      `:sparkles: Your pull request project${deployedCount > 1 ? 's are' : ' is'} ready for preview`
    );
  } else {
    lines.push(':information_source: Deployment status');
  }

  lines.push('', '| Project | Status | Preview |', '| --- | --- | --- |');

  for (const project of deployable) {
    if (project.action === 'deploy') {
      lines.push(
        `| ${project.name} | ✅ Deployed | [${project.url}](${project.url}) |`
      );
    } else if (project.action === 'failed') {
      const isSkipped = project.error.startsWith('Skipped:');
      const status = isSkipped ? '⏭️ Skipped' : '❌ Failed';
      lines.push(`| ${project.appOrProject} | ${status} | ${project.error} |`);
    }
  }

  return lines;
}

/**
 * Post a deployment status comment to a GitHub pull request.
 *
 * @param inputs Comment options
 */
export async function flyPrComment(inputs: ActionInputs): Promise<void> {
  const { pullRequest, deployed, failed, projects, token } = inputs;

  const comment: string[] = [];

  if (projects && projects.length > 0) {
    comment.push(...renderProjectsTable(projects));
  } else {
    // Fallback to legacy deployed/failed inputs
    const deployedEntries = Object.entries(deployed ?? {});
    const failedList = failed ?? [];

    if (deployedEntries.length > 0) {
      comment.push(
        `:sparkles: Your pull request project${
          deployedEntries.length > 1 ? 's are' : ' is'
        } ready for preview`
      );

      comment.push('', '| Project | Preview |', '| --- | --- |');
      for (const [name, url] of deployedEntries) {
        comment.push(`| ${name} | [${url}](${url}) |`);
      }
    } else {
      comment.push(':information_source: Deployment status');
    }

    if (failedList.length > 0) {
      comment.push(
        '',
        `❌ Failed ${failedList.length} project${failedList.length > 1 ? 's' : ''}: ${failedList.map((p) => `\`${p}\``).join(', ')}`
      );
    }

    if (deployedEntries.length === 0 && failedList.length === 0) {
      comment.push('', 'No affected projects to deploy.');
    }
  }

  core.info(`Upsert comment on pull request ${pullRequest}`);
  await upsertPullRequestComment(
    token,
    pullRequest,
    comment.join('\n'),
    'codeware/fly-deployment'
  );
}
