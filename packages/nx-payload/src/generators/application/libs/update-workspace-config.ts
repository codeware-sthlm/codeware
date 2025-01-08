import {
  type ExpandedPluginConfiguration,
  type PluginConfiguration,
  type Tree,
  readNxJson,
  updateNxJson
} from '@nx/devkit';

import type { PayloadPluginOptions } from '../../../plugins/utils/types';

import type { NormalizedSchema } from './normalize-options';

const defaultPlugin: ExpandedPluginConfiguration<PayloadPluginOptions> = {
  plugin: '@cdwr/nx-payload/plugin',
  options: {
    buildTargetName: 'build',
    generateTargetName: 'gen',
    payloadTargetName: 'payload',
    serveTargetName: 'serve',
    dxDockerBuildTargetName: 'dx:docker-build',
    dxDockerRunTargetName: 'dx:docker-run',
    dxMongodbTargetName: 'dx:mongodb',
    dxPostgresTargetName: 'dx:postgres',
    dxStartTargetName: 'dx:start',
    dxStopTargetName: 'dx:stop'
  }
};

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

  // Lookup plugin name in plugins array
  if (
    plugins.find((p) => {
      if (typeof p === 'string') {
        return p === defaultPlugin.plugin;
      }

      return p.plugin === defaultPlugin.plugin;
    })
  ) {
    return plugins;
  }

  plugins.push(defaultPlugin);

  return plugins;
};
