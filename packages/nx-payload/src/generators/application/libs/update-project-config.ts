import {
  type ProjectConfiguration,
  type TargetConfiguration,
  type Tree,
  readNxJson,
  readProjectConfiguration,
  updateProjectConfiguration
} from '@nx/devkit';

import { isPluginInferenceEnabled } from './is-plugin-inference-enabled';
import type { NormalizedSchema } from './normalize-options';

/**
 * Available targets.
 *
 * `generate` is aliased to `gen` to avoid conflict with native `nx generate`.
 */
type Target = 'build' | 'gen' | 'lint' | 'payload' | 'serve' | 'test';

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
  const allTargetsConfigurations: Record<Target, TargetConfiguration> = {
    build: {
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
      executor: projectServe?.executor,
      options: {
        buildTarget: `${options.name}:build`,
        runBuildTargetDependencies: true,
        watch: true
      }
    },
    gen: {
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
      executor: 'nx:run-commands',
      options: {
        command: 'npx payload',
        forwardAllArgs: true,
        env: {
          PAYLOAD_CONFIG_PATH: '{projectRoot}/src/payload.config.ts'
        }
      }
    },
    lint: {
      ...projectLint
    },
    test: {
      ...projectTest
    }
  };

  // Targets above which can also be inferred
  const inferredTargets: Array<Target> = ['build', 'gen', 'payload', 'serve'];

  // Targets which should be added to the project configuration
  // (if inference is enabled, the inferred targets will not be added to the project configuration)
  const projectTargets = Object.keys(allTargetsConfigurations)
    .filter((target) =>
      isPluginInferenceEnabled(nxJson)
        ? inferredTargets.map(String).includes(target) === false
        : true
    )
    .map((target) => target as Target);

  // Final target configurations
  const targetsConfigurations = projectTargets.reduce(
    (acc, key) => {
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
