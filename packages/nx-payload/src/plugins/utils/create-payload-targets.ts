import type {
  CreateNodesContext,
  ProjectConfiguration,
  TargetConfiguration
} from '@nx/devkit';
import { getNamedInputs } from '@nx/devkit/src/utils/get-named-inputs';
import type { RunCommandsOptions } from 'nx/src/executors/run-commands/run-commands.impl';

import type { BuildExecutorSchema } from '../../executors/build/schema';

import type { NormalizedOptions } from './types';

export const createPayloadTargets = async (
  projectRoot: string,
  projectConfig: ProjectConfiguration,
  options: NormalizedOptions,
  context: CreateNodesContext
): Promise<Record<string, TargetConfiguration>> => {
  const namedInputs = getNamedInputs(projectRoot, context);

  const targets: Record<
    string,
    TargetConfiguration<BuildExecutorSchema | Partial<RunCommandsOptions>>
  > = {};

  // Add `build` target
  targets[options.buildTargetName] = {
    executor: '@cdwr/nx-payload:build',
    inputs: [
      'default',
      Object.hasOwn(namedInputs, 'production') ? '^production' : '^default'
    ],
    outputs: ['{options.outputPath}'],
    options: {
      main: '{projectRoot}/src/main.ts',
      tsConfig: '{projectRoot}/tsconfig.app.json',
      outputPath: '{workspaceRoot}/dist/{projectRoot}',
      outputFileName: 'src/main.js'
    },
    dependsOn: [options.payloadBuildTargetName],
    cache: true
  };

  // Add `mongodb` target
  targets[options.mongodbTargetName] = {
    executor: 'nx:run-commands',
    options: {
      command: `docker ps -q -f name=mongodb-${projectConfig.name} | grep . && echo '[Running] mongodb is already started' || docker run --name mongodb-${projectConfig.name} --rm -d -p 27017:27017 mongo`
    },
    cache: false
  };

  // Add `payload-build` target
  targets[options.payloadBuildTargetName] = {
    executor: '@cdwr/nx-payload:payload-build',
    configurations: {
      production: {
        outputPath: '{workspaceRoot}/dist/{projectRoot}'
      }
    },
    cache: true
  };

  // Add `payload-cli` target
  targets[options.payloadCliTargetName] = {
    executor: '@cdwr/nx-payload:payload-cli',
    cache: false
  };

  // Add `postgres` target
  targets[options.postgresTargetName] = {
    executor: 'nx:run-commands',
    options: {
      command: `docker ps -q -f name=postgres-${projectConfig.name} | grep . && echo '[Running] PostgreSQL init process complete' || docker run --name postgres-${projectConfig.name} --rm --env-file ${projectRoot}/.env.local -p 5432:5432 postgres`,
      readyWhen: 'PostgreSQL init process complete'
    },
    cache: false
  };

  // Add `serve` target
  targets[options.serveTargetName] = {
    executor: '@nx/js:node',
    options: {
      buildTarget: `${options.buildTargetName}:development`,
      runBuildTargetDependencies: true,
      watch: true
    },
    configurations: {
      development: {
        buildTarget: `${options.buildTargetName}:build:development`
      },
      production: {
        buildTarget: `${options.buildTargetName}:build:production`
      }
    },
    defaultConfiguration: 'development',
    dependsOn: [options.buildTargetName],
    cache: false
  };

  // Add `start` target
  targets[options.startTargetName] = {
    executor: 'nx:run-commands',
    options: {
      command: `docker compose -f ${projectRoot}/docker-compose.yml up -d`
    },
    cache: false
  };

  // Add `stop` target
  targets[options.stopTargetName] = {
    executor: 'nx:run-commands',
    options: {
      command: `docker compose -f ${projectRoot}/docker-compose.yml down`
    },
    cache: false
  };

  // Add `docker-build` target
  targets[options.dockerBuildTargetName] = {
    executor: 'nx:run-commands',
    options: {
      command: `docker build -f ${projectRoot}/Dockerfile -t ${projectConfig.name} .`
    },
    cache: false
  };

  // Add `docker-run` target
  targets[options.dockerRunTargetName] = {
    executor: 'nx:run-commands',
    options: {
      command: `docker run --name ${projectConfig.name} --rm --env-file ${projectRoot}/.env.local -d -p 3000:3000 ${projectConfig.name}`
    },
    cache: false
  };

  return targets;
};
