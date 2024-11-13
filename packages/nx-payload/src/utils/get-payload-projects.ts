import { joinPathFragments } from '@nx/devkit';
import { getProjects } from '@nx/devkit';
import type { ProjectConfiguration, Tree } from '@nx/devkit';

/**
 * Get all projects that a `payload.config.ts` file in their source root.
 */
export function getPayloadProjects(tree: Tree): Array<ProjectConfiguration> {
  const projects = getProjects(tree);
  const payloadProjects = Array<ProjectConfiguration>();

  for (const project of projects.values()) {
    if (
      project?.sourceRoot &&
      tree.exists(joinPathFragments(project.sourceRoot, 'payload.config.ts'))
    ) {
      payloadProjects.push(project);
    }
  }
  return payloadProjects;
}
