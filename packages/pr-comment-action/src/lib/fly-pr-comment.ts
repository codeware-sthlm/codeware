import * as core from '@actions/core';
import { addPullRequestComment } from '@codeware/shared/util/github';

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
 * Neutralise HTML tags in text that ends up inside a `<details>` block.
 *
 * Changelog bodies are built from commit messages, so a `</details>` or any
 * stray `<` would escape the block and reshape the comment. Only `<` is
 * escaped: it is the whole injection vector, and touching `>` or `&` would
 * break blockquotes and link URLs in the surrounding markdown.
 */
const escapeTags = (text: string): string => text.replaceAll('<', '&lt;');

/**
 * Render each app's changelog as a collapsed section.
 *
 * The range is the previous preview deploy up to this one, so this is what the
 * latest push added — not everything the pull request contains.
 */
function renderChangelogs(changelogs: Record<string, string>): string[] {
  const entries = Object.entries(changelogs);
  if (entries.length === 0) {
    return [];
  }

  const lines = ['', '---', ''];

  for (const [name, contents] of entries) {
    lines.push(
      '<details>',
      `<summary><b>${escapeTags(name)}</b> — changes in this deploy</summary>`,
      '',
      escapeTags(contents),
      '',
      '</details>',
      ''
    );
  }

  return lines;
}

/**
 * Post a deployment status comment to a GitHub pull request.
 *
 * @param inputs Comment options
 */
export async function flyPrComment(inputs: ActionInputs): Promise<void> {
  const { pullRequest, deployed, failed, projects, changelogs, token } = inputs;

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

  comment.push(...renderChangelogs(changelogs ?? {}));

  // One comment per deploy, never updated in place. Each deploy's changelog is
  // a delta, so replacing the previous comment would throw away the only record
  // of what earlier pushes shipped — and move the reader's scroll position. The
  // extra comments are cheaper than the lost history.
  core.info(`Add comment to pull request ${pullRequest}`);
  await addPullRequestComment(token, pullRequest, comment.join('\n'));
}
