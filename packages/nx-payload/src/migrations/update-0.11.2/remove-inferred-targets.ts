import { type Tree, formatFiles, updateProjectConfiguration } from '@nx/devkit';

import { getPayloadProjects } from '../../utils/get-payload-projects';
import { hasNxPayloadPlugin } from '../../utils/has-nx-payload-plugin';

export default async function (tree: Tree) {
  if (!hasNxPayloadPlugin(tree)) {
    return;
  }

  const projects = getPayloadProjects(tree);
  if (projects.length === 0) {
    return;
  }

  for (const project of projects) {
    if (!project?.targets) {
      continue;
    }

    if (!project.name) {
      console.warn(
        `Expected to find name on project '${project.root}', skip migration`
      );
      continue;
    }

    const targetCount = Object.keys(project.targets).length;

    if (project.targets['build']) {
      console.log(`Remove build target from project '${project.name}'`);
      delete project.targets['build'];
    }

    if (project.targets['serve']) {
      console.log(`Remove serve target from project '${project.name}'`);
      delete project.targets['serve'];
    }

    if (targetCount === Object.keys(project.targets).length) {
      console.log(
        `No inferred targets to remove from project '${project.name}'`
      );
    }

    updateProjectConfiguration(tree, project.name, project);
  }

  await formatFiles(tree);
}
