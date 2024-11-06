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

/** Available targets */
type Target =
  | 'build'
  | 'lint'
  | 'payload-build'
  | 'payload-cli'
  | 'serve'
  | 'test';

export function updateProjectConfig(host: Tree, options: NormalizedSchema) {
  const nxJson = readNxJson(host);
  if (!nxJson) {
    throw new Error('Could not read nx.json');
  }

  const projectConfig = readProjectConfiguration(host, options.name);
  if (!projectConfig) {
    throw new Error('Could not read project.json');
  }

  // Project targets with options
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
        outputFileName: projectBuild?.options.outputFileName
      },
      dependsOn: ['payload-build']
    },
    serve: {
      ...projectServe,
      options: {
        ...projectServe?.options,
        runBuildTargetDependencies: true,
        watch: true
      },
      configurations: {
        ...projectServe?.configurations,
        development: {
          buildTarget: `${options.name}:build:development`
        }
      }
    },
    lint: {
      ...projectLint
    },
    test: {
      ...projectTest
    },
    ['payload-build']: {
      executor: '@cdwr/nx-payload:payload-build',
      defaultConfiguration: projectBuild?.defaultConfiguration,
      configurations: {
        production: {
          outputPath: projectBuild?.options.outputPath
        }
      }
    },
    ['payload-cli']: {
      executor: '@cdwr/nx-payload:payload-cli'
    }
  };

  // Targets above which can also be inferred
  const inferredTargets: Array<Target> = [
    'build',
    'payload-build',
    'payload-cli',
    'serve'
  ];

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
