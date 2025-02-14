import { joinPathFragments } from '@nx/devkit';
import { getProjects } from '@nx/devkit';
import type { ProjectConfiguration, Tree } from '@nx/devkit';

/**
 * Find all projects that have a `payload.config.ts` file in `<projectRoot>/src`.
 */
export function findPayloadProjects(tree: Tree): Array<ProjectConfiguration> {
  const projects = getProjects(tree);
  const payloadProjects = Array<ProjectConfiguration>();

  for (const project of projects.values()) {
    if (
      project?.sourceRoot &&
      tree.exists(
        joinPathFragments(
          project.sourceRoot,
          project.sourceRoot.endsWith('src') ? '' : 'src',
          'payload.config.ts'
        )
      )
    ) {
      payloadProjects.push(project);
    }
  }
  return payloadProjects;
}
