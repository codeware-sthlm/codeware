import type { TargetConfiguration } from '@nx/devkit';
import type { RunCommandsOptions } from 'nx/src/executors/run-commands/run-commands.impl';

import type { PayloadTarget } from './definitions';

/**
 * Create Payload targets for a project
 *
 * @param args - arguments
 * @returns The payload targets
 */
export function createPayloadTargets(args: {
  isGraphQLDisabled?: boolean;
  projectName: string;
  projectRoot: string;
}): Record<PayloadTarget, TargetConfiguration> {
  const { isGraphQLDisabled, projectName, projectRoot } = args;

  const dxPrefix = 'Developer experience (DX)';

  return {
    gen: {
      metadata: {
        description:
          'Generate types and GraphQL schema (if enabled) from the Payload configuration',
        technologies: ['node']
      },
      executor: 'nx:run-commands',
      inputs: ['{projectRoot}/src/payload.config.ts'],
      options: {
        commands: isGraphQLDisabled
          ? ['npx payload generate:types']
          : [
              'npx payload generate:types',
              'npx payload-graphql generate:schema'
            ],
        cwd: projectRoot,
        parallel: false
      } satisfies Partial<RunCommandsOptions>
    },
    payload: {
      metadata: {
        description: 'Run a native Payload command',
        technologies: ['node']
      },
      executor: 'nx:run-commands',
      options: {
        command: 'npx payload',
        forwardAllArgs: true,
        cwd: projectRoot
      } satisfies Partial<RunCommandsOptions>
    },
    'payload-graphql': {
      metadata: {
        description: 'Run a native Payload GraphQL command',
        technologies: ['node']
      },
      executor: 'nx:run-commands',
      options: {
        command: 'npx payload-graphql',
        forwardAllArgs: true,
        cwd: projectRoot
      } satisfies Partial<RunCommandsOptions>
    },
    'dx:mongodb': {
      metadata: {
        description: `${dxPrefix} - Start a Mongo database in Docker container`,
        technologies: ['docker']
      },
      command: `docker ps -q -f name=mongodb-${projectName} | grep . && echo '[Running] mongodb is already started' || docker run --name mongodb-${projectName} --rm -d -p 27017:27017 mongo`
    },
    'dx:postgres': {
      metadata: {
        description: `${dxPrefix} - Start a Postgres database in Docker container`,
        technologies: ['docker']
      },
      executor: 'nx:run-commands',
      options: {
        command: `docker ps -q -f name=postgres-${projectName} | grep . && echo '[Running] PostgreSQL init process complete' || docker run --name postgres-${projectName} --rm --env-file ${projectRoot}/.env.local -p 5432:5432 postgres`,
        readyWhen: 'PostgreSQL init process complete'
      } satisfies Partial<RunCommandsOptions>
    },
    'dx:start': {
      metadata: {
        description: `${dxPrefix} - Start Payload admin application and Mongo and Postgres databases in Docker containers`,
        technologies: ['docker']
      },
      command: `docker compose -f ${projectRoot}/docker-compose.yml up -d`
    },
    'dx:stop': {
      metadata: {
        description: `${dxPrefix} - Stop all Docker containers started by 'dx:start' target`,
        technologies: ['docker']
      },
      command: `docker compose -f ${projectRoot}/docker-compose.yml down`
    }
  };
}
