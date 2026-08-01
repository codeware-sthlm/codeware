import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { Fly } from '@cdwr/fly-node';
import { getAppName } from '@codeware/shared/util/nx-deploy';
import * as TOML from 'smol-toml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const workspaceRoot = path.resolve(__dirname, '../../..');

/**
 * Silent client - these commands handle output themselves, and some of what
 * the Fly CLI prints (ssh output, secret values) should not reach the console.
 */
export const fly = new Fly({
  logger: {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    info: () => {},
    error: console.error,
    traceCLI: false,
    redactSecrets: true,
    verbose: false,
    debug: false,
    streamToConsole: false
  }
});

/** Base Fly app name from an app's own fly config */
export function configAppName(app: string): string {
  const configPath = path.join(workspaceRoot, 'apps', app, 'fly.toml');
  const config = TOML.parse(readFileSync(configPath, 'utf-8')) as {
    app?: string;
  };

  if (!config.app) {
    throw new Error(`No app name found in ${configPath}`);
  }

  return config.app;
}

/**
 * Resolve the Fly app name for a tenant's deployment of an app, applying the
 * same pull request and tenant suffixes the deployment action uses.
 */
export function flyAppName(
  app: string,
  tenantId: string,
  pullRequest?: string
): string {
  return getAppName({
    configAppName: configAppName(app),
    environment: pullRequest ? 'preview' : 'production',
    pullRequest: pullRequest ? Number(pullRequest) : undefined,
    tenantId
  });
}

/**
 * Start every machine of an app that is not already running.
 *
 * Preview machines suspend when idle, and Fly can neither ssh into nor update
 * a machine that is not started.
 */
export async function startMachines(app: string): Promise<void> {
  const status = await fly.status({ app });
  const machines = status?.machines ?? [];

  if (!machines.length) {
    throw new Error(`App '${app}' has no machines - is it deployed?`);
  }

  const stopped = machines.filter(({ state }) => state !== 'started');

  for (const machine of stopped) {
    await fly.machines.start(app, machine.id);
  }

  if (stopped.length) {
    // Give them a moment to accept connections
    await new Promise((resolve) => setTimeout(resolve, 5_000));
  }
}

/** Wait until a machine reaches one of the given states */
async function waitForMachineState(
  app: string,
  machineId: string,
  states: Array<string>,
  timeoutMs = 120_000
): Promise<void> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const machine = (await fly.status({ app }))?.machines?.find(
      ({ id }) => id === machineId
    );

    if (machine && states.includes(machine.state)) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 2_000));
  }

  throw new Error(
    `Machine ${machineId} in '${app}' did not reach ${states.join('/')} in time`
  );
}

/**
 * Restart every machine of an app so it re-reads its runtime configuration.
 *
 * Secrets under `/apps/<app>` are fetched from Infisical when the app boots,
 * not injected at deploy, so a restart is all it takes to pick up a new value.
 * Stopping and starting is a cold boot - a suspended machine resumed from its
 * snapshot would never re-read anything.
 *
 * Done one machine at a time, waiting for each to come back before touching
 * the next, so the app keeps serving throughout. The waits are on observed
 * state rather than a fixed delay: `fly-node`'s own `machines.restart` sleeps
 * two seconds between stop and start, which is not enough - the start is
 * rejected with `unable to start machine from current state: 'stopping'`.
 */
export async function restartApp(app: string): Promise<void> {
  const status = await fly.status({ app });
  const machines = status?.machines ?? [];

  if (!machines.length) {
    throw new Error(`App '${app}' has no machines - is it deployed?`);
  }

  for (const machine of machines) {
    await fly.machines.stop(app, machine.id);
    await waitForMachineState(app, machine.id, ['stopped', 'suspended']);

    await fly.machines.start(app, machine.id);
    await waitForMachineState(app, machine.id, ['started']);
  }
}
