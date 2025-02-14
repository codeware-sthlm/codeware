import { type Tree, joinPathFragments } from '@nx/devkit';

import { findPayloadProjects } from '../../utils/find-payload-projects';
import { hasNxPayloadPlugin } from '../../utils/has-nx-payload-plugin';

export default async function (tree: Tree) {
  if (!hasNxPayloadPlugin(tree)) {
    return;
  }

  const projects = findPayloadProjects(tree);
  if (projects.length === 0) {
    return;
  }

  for (const project of projects) {
    const envFilePath = joinPathFragments(project.root, '.env.serve');
    if (tree.exists(envFilePath)) {
      tree.delete(envFilePath);
      console.log(`Removed obsolete '${envFilePath}' file`);
    }
  }
}
