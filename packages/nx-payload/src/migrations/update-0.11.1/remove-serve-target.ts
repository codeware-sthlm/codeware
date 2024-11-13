import {
  type Tree,
  formatFiles,
  getProjects,
  joinPathFragments,
  updateProjectConfiguration
} from '@nx/devkit';

import { hasNxPayloadPlugin } from '../../utils/has-nx-payload-plugin';

export default async function (tree: Tree) {
  if (!hasNxPayloadPlugin(tree)) {
    return;
  }

  const projectNames = getPayloadProjectsWithServeTarget(tree);
  if (projectNames.length === 0) {
    return;
  }

  removeServeTargets(tree, projectNames);

  await formatFiles(tree);
}

/**
 * Remove the `serve` target from the given projects.
 */
function removeServeTargets(tree: Tree, projectNames: Array<string>) {
  const projects = getProjects(tree);

  for (const projectName of projectNames) {
    const project = projects.get(projectName);
    if (!project?.targets) {
      throw new Error(`Expected to find targets on project '${projectName}'`);
    }

    if (!project.targets['serve']) {
      throw new Error(
        `Expected to find serve target on project '${projectName}'`
      );
    }

    delete project.targets['serve'];
    updateProjectConfiguration(tree, projectName, project);

    console.log(`Removed serve target from project '${projectName}'`);
  }
}

/**
 * Get the names of all projects that have a `serve` target that uses the `@nx/js:node` executor
 * and have a `payload.config.ts` file in their source root.
 */
function getPayloadProjectsWithServeTarget(tree: Tree) {
  const projects = getProjects(tree);
  const payloadProjects = Array<string>();

  for (const project of projects.values()) {
    const targets = project.targets || {};
    for (const [name, target] of Object.entries(targets)) {
      if (
        name === 'serve' &&
        target.executor === '@nx/js:node' &&
        project?.sourceRoot &&
        tree.exists(joinPathFragments(project.sourceRoot, 'payload.config.ts'))
      ) {
        payloadProjects.push(String(project.name));
      }
    }
  }
  return payloadProjects;
}
