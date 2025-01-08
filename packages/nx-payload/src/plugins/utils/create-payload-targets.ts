import { join } from 'path';

import type {
  CreateNodesContext,
  ProjectConfiguration,
  TargetConfiguration
} from '@nx/devkit';
import { getNamedInputs } from '@nx/devkit/src/utils/get-named-inputs';
import type { RunCommandsOptions } from 'nx/src/executors/run-commands/run-commands.impl';

import type { BuildExecutorSchema } from '../../executors/build/schema';
import { metadata } from '../../utils/definitions';
import { extractPayloadConfig } from '../../utils/extract-payload-config';
import { opinionatedEsbuildOptions } from '../../utils/opinionated-esbuild-options';

import type { NormalizedOptions } from './types';

export const createPayloadTargets = async (
  projectRoot: string,
  projectConfig: ProjectConfiguration,
  options: NormalizedOptions,
  context: CreateNodesContext
): Promise<Record<string, TargetConfiguration>> => {
  const namedInputs = getNamedInputs(projectRoot, context);
  const absoluteSourceRoot =
    projectConfig.sourceRoot ?? join(context.workspaceRoot, projectRoot, 'src');

  const targets: Record<
    string,
    TargetConfiguration<BuildExecutorSchema | Partial<RunCommandsOptions>>
  > = {};

  // Get current GraphQL config state
  const result = extractPayloadConfig(absoluteSourceRoot, 'graphQL.disable');
  if (!result.config) {
    // Don't throw to prevent messing up the targets
    console.error(result.error);
  }
  const isGraphQLDisabled = result?.config?.graphQL?.disable;

  // Add build target
  targets[options.buildTargetName] = {
    metadata: metadata.build,
    executor: '@cdwr/nx-payload:build',
    inputs: [
      'default',
      Object.hasOwn(namedInputs, 'production') ? '^production' : '^default'
    ],
    outputs: ['{options.outputPath}'],
    defaultConfiguration: 'production',
    options: {
      // Required options
      main: '{projectRoot}/src/main.ts',
      tsConfig: '{projectRoot}/tsconfig.app.json',
      outputPath: '{workspaceRoot}/dist/{projectRoot}',
      // Opinionated options
      ...opinionatedEsbuildOptions
    },
    configurations: {
      development: {
        sourcemap: true
      },
      production: {}
    },
    cache: true
  };

  // Add serve target
  targets[options.serveTargetName] = {
    metadata: metadata.serve,
    executor: '@nx/js:node',
    defaultConfiguration: 'development',
    options: {
      buildTarget: `${projectConfig.name}:${options.buildTargetName}`,
      runBuildTargetDependencies: true
    },
    configurations: {
      development: {
        buildTarget: `${projectConfig.name}:${options.buildTargetName}:development`
      },
      production: {
        buildTarget: `${projectConfig.name}:${options.buildTargetName}:production`
      }
    },
    cache: false
  };

  // Add generate target:
  // Update inferred target when payload config is updated
  targets[options.generateTargetName] = {
    metadata: metadata.gen,
    executor: 'nx:run-commands',
    inputs: ['{projectRoot}/src/payload.config.ts'],
    options: {
      commands: isGraphQLDisabled
        ? ['npx payload generate:types']
        : ['npx payload generate:types', 'npx payload generate:graphQLSchema'],
      env: {
        PAYLOAD_CONFIG_PATH: '{projectRoot}/src/payload.config.ts'
      },
      parallel: false
    }
  };

  // Add payload target
  targets[options.payloadTargetName] = {
    metadata: metadata.payload,
    executor: 'nx:run-commands',
    options: {
      command: 'npx payload',
      forwardAllArgs: true,
      env: {
        PAYLOAD_CONFIG_PATH: '{projectRoot}/src/payload.config.ts'
      }
    }
  };

  // Add mongodb target
  targets[options.dxMongodbTargetName] = {
    metadata: metadata['dx:mongodb'],
    command: `docker ps -q -f name=mongodb-${projectConfig.name} | grep . && echo '[Running] mongodb is already started' || docker run --name mongodb-${projectConfig.name} --rm -d -p 27017:27017 mongo`
  };

  // Add postgres target
  targets[options.dxPostgresTargetName] = {
    metadata: metadata['dx:postgres'],
    executor: 'nx:run-commands',
    options: {
      command: `docker ps -q -f name=postgres-${projectConfig.name} | grep . && echo '[Running] PostgreSQL init process complete' || docker run --name postgres-${projectConfig.name} --rm --env-file ${projectRoot}/.env.local -p 5432:5432 postgres`,
      readyWhen: 'PostgreSQL init process complete'
    }
  };

  // Add start target
  targets[options.dxStartTargetName] = {
    metadata: metadata['dx:start'],
    command: `docker compose -f ${projectRoot}/docker-compose.yml up -d`
  };

  // Add stop target
  targets[options.dxStopTargetName] = {
    metadata: metadata['dx:stop'],
    command: `docker compose -f ${projectRoot}/docker-compose.yml down`
  };

  // Add docker-build target
  targets[options.dxDockerBuildTargetName] = {
    metadata: metadata['dx:docker-build'],
    command: `docker build -f ${projectRoot}/Dockerfile -t ${projectConfig.name} .`
  };

  // Add docker-run target
  targets[options.dxDockerRunTargetName] = {
    metadata: metadata['dx:docker-run'],
    command: `docker run --name ${projectConfig.name} --rm --env-file ${projectRoot}/.env.local -d -p 3000:3000 ${projectConfig.name}`
  };

  return targets;
};
