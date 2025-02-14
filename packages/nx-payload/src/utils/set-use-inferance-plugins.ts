import { type Tree, readNxJson, updateNxJson } from '@nx/devkit';

export const setUseInferencePlugins = (
  tree: Tree,
  useInferencePlugins?: boolean
) => {
  const workspace = readNxJson(tree);
  if (!workspace) {
    throw new Error('Failed to read nx.json');
  }

  if (useInferencePlugins === undefined) {
    delete workspace.useInferencePlugins;
  } else {
    workspace.useInferencePlugins = useInferencePlugins;
  }
  updateNxJson(tree, workspace);
};
