import {
  type ProjectConfiguration,
  type TargetConfiguration,
  type Tree,
  readNxJson,
  readProjectConfiguration,
  updateProjectConfiguration
} from '@nx/devkit';

import {
  type GeneratorTarget,
  generatorTargets,
  inferredTargets,
  metadata
} from '../../../utils/definitions';

import { isPluginInferenceEnabled } from './is-plugin-inference-enabled';
import type { NormalizedSchema } from './normalize-options';

export function updateProjectConfig(host: Tree, options: NormalizedSchema) {
  const nxJson = readNxJson(host);
  if (!nxJson) {
    throw new Error('Could not read nx.json');
  }

  const projectConfig = readProjectConfiguration(host, options.name);
  if (!projectConfig) {
    throw new Error('Could not read project.json');
  }

  // Generated Express project targets
  const projectBuild = projectConfig.targets?.build;
  const projectLint = projectConfig.targets?.lint;
  const projectServe = projectConfig.targets?.serve;
  const projectTest = projectConfig.targets?.test;

  /** Define all targets configurations */
  const allTargetsConfigurations: Record<GeneratorTarget, TargetConfiguration> =
    {
      build: {
        metadata: metadata.build,
        executor: '@cdwr/nx-payload:build',
        options: {
          main: projectBuild?.options.main,
          tsConfig: projectBuild?.options.tsConfig,
          outputPath: projectBuild?.options.outputPath,
          outputFileName: 'src/main.js'
        },
        cache: true
      },
      serve: {
        metadata: metadata.serve,
        executor: projectServe?.executor,
        options: {
          buildTarget: `${options.name}:build`,
          runBuildTargetDependencies: true,
          watch: true
        }
      },
      gen: {
        metadata: metadata.gen,
        executor: 'nx:run-commands',
        options: {
          commands: [
            'npx payload generate:types',
            'npx payload generate:graphQLSchema'
          ],
          parallel: false,
          env: {
            PAYLOAD_CONFIG_PATH: '{projectRoot}/src/payload.config.ts'
          }
        }
      },
      payload: {
        metadata: metadata.payload,
        executor: 'nx:run-commands',
        options: {
          command: 'npx payload',
          forwardAllArgs: true,
          env: {
            PAYLOAD_CONFIG_PATH: '{projectRoot}/src/payload.config.ts'
          }
        }
      },
      lint: projectLint ?? {},
      test: projectTest ?? {}
    };

  // Final target configurations.
  // If inference is enabled, it will remove all inferred targets.
  const inference = isPluginInferenceEnabled(nxJson);
  const targetsConfigurations = generatorTargets.reduce(
    (acc, key) => {
      if (inference && inferredTargets.map(String).includes(key)) {
        return acc;
      }
      acc[key] = allTargetsConfigurations[key];
      return acc;
    },
    {} as typeof allTargetsConfigurations
  );

  const project: ProjectConfiguration = {
    name: projectConfig.name,
    root: projectConfig.root,
    sourceRoot: projectConfig.sourceRoot,
    projectType: projectConfig.projectType,
    targets: targetsConfigurations,
    tags: projectConfig.tags
  };

  updateProjectConfiguration(host, options.name, {
    ...project
  });
}
