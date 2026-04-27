import * as core from '@actions/core';
import { addPullRequestComment } from '@codeware/core/actions';

import type { ActionInputs } from './schemas/action-inputs.schema';

/**
 * Post a deployment status comment to a GitHub pull request.
 *
 * @param inputs Comment options
 */
export async function flyPrComment(inputs: ActionInputs): Promise<void> {
  const { pullRequest, deployed, failed, token } = inputs;

  const deployedEntries = Object.entries(deployed ?? {});
  const failedList = failed ?? [];

  const comment: string[] = [];

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

  core.info(`Add comment to pull request ${pullRequest}`);
  await addPullRequestComment(token, pullRequest, comment.join('\n'));
}
