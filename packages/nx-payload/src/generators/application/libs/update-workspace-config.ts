import {
  type PluginConfiguration,
  type Tree,
  readNxJson,
  updateNxJson
} from '@nx/devkit';

import type { NormalizedSchema } from './normalize-options';

const PLUGIN = '@cdwr/nx-payload/plugin';

export function updateWorkspaceConfig(host: Tree, options: NormalizedSchema) {
  const workspace = readNxJson(host);
  if (!workspace) {
    throw new Error('Could not read nx.json');
  }

  if (!workspace.defaultProject) {
    workspace.defaultProject = options.name;
  }

  if (workspace?.useInferencePlugins !== false) {
    workspace.plugins = updatePlugins(workspace.plugins);
  }

  updateNxJson(host, workspace);
}

const updatePlugins = (
  plugins?: Array<PluginConfiguration>
): Array<PluginConfiguration> => {
  plugins = plugins || [];

  if (plugins.includes(PLUGIN)) {
    return plugins;
  }

  if (
    plugins.find((p) => {
      if (typeof p === 'string') {
        return false;
      }
      return p.plugin === PLUGIN;
    })
  ) {
    return plugins;
  }

  plugins.push(PLUGIN);

  return plugins;
};
