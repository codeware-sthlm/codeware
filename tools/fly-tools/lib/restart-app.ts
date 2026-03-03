import {
  cancel,
  intro,
  isCancel,
  log,
  outro,
  select,
  spinner
} from '@clack/prompts';
import { Fly } from '@codeware/fly-node';

// Initialize Fly client
const fly = new Fly({
  logger: {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    info: () => {}, // Silent mode for API calls
    error: console.error,
    traceCLI: false,
    redactSecrets: true,
    verbose: false,
    debug: false,
    streamToConsole: false
  }
});

interface RestartAppOptions {
  app?: string;
}

/**
 * List all Fly apps
 */
async function listApps() {
  return await fly.apps.list();
}

/**
 * Get app status and machines
 */
async function getAppStatus(appName: string) {
  return await fly.status({ app: appName });
}

/**
 * Restart a machine by stopping then starting it
 */
async function restartMachine(
  appName: string,
  machineId: string
): Promise<void> {
  await fly.machines.restart(appName, machineId);
}

/**
 * Start a machine
 */
async function startMachine(appName: string, machineId: string): Promise<void> {
  await fly.machines.start(appName, machineId);
}

/**
 * Main interactive script
 */
async function main(options?: RestartAppOptions) {
  console.clear();

  intro('🔄 Fly App Machine Restarter');

  let appName: string;

  if (options?.app) {
    // Use provided app name
    appName = options.app;
  } else {
    // List apps and let user select
    const s = spinner();
    s.start('Fetching Fly apps...');

    let apps;
    try {
      apps = await listApps();
      s.stop('Apps fetched successfully');
    } catch (error) {
      s.stop('Failed to fetch apps');
      cancel(
        `Error: ${error instanceof Error ? error.message : String(error)}`
      );
      process.exit(1);
    }

    if (apps.length === 0) {
      outro('No deployed apps found');
      process.exit(0);
    }

    // Select app
    const selectedApp = await select({
      message: 'Select an app to restart:',
      options: apps.map((app) => ({
        value: app.name,
        label: app.name,
        hint: `${app.status} | ${app.organization.slug}`
      }))
    });

    if (isCancel(selectedApp)) {
      cancel('Operation cancelled');
      process.exit(0);
    }

    appName = selectedApp as string;
  }

  // Get app status
  const statusSpinner = spinner();
  statusSpinner.start(`Fetching status for ${appName}...`);

  let status;
  try {
    status = await getAppStatus(appName);

    if (!status) {
      statusSpinner.stop('App not found');
      cancel(`App '${appName}' not found`);
      process.exit(1);
    }

    statusSpinner.stop('Status fetched successfully');
  } catch (error) {
    statusSpinner.stop('Failed to fetch status');
    cancel(`Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }

  if (!status.machines || status.machines.length === 0) {
    outro(`No machines found for ${appName}`);
    process.exit(0);
  }

  // Restart or start machines
  log.info(`Found ${status.machines.length} machine(s) for ${appName}`);

  let successCount = 0;
  const failedMachines: string[] = [];

  for (const machine of status.machines) {
    const machineSpinner = spinner();

    // Determine the action based on machine state
    let action: string;
    if (machine.state === 'stopped' || machine.state === 'created') {
      action = 'Starting';
    } else if (machine.state === 'started') {
      action = 'Restarting';
    } else {
      // Intermediate states like 'stopping', 'starting', etc.
      action = 'Restarting (via stop/start)';
    }

    machineSpinner.start(
      `${action} machine ${machine.id} (${machine.name}, state: ${machine.state})...`
    );

    try {
      if (machine.state === 'stopped' || machine.state === 'created') {
        // Just start it
        await startMachine(appName, machine.id);
      } else {
        // For started or any other state, stop then start
        await restartMachine(appName, machine.id);
      }

      successCount++;
      machineSpinner.stop(`Machine ${machine.id}`);
      log.success(
        `${action === 'Starting' ? 'Started' : 'Restarted'} ${machine.id} (${machine.name})`
      );
    } catch (error) {
      failedMachines.push(machine.id);
      machineSpinner.stop(`Machine ${machine.id}`);
      log.error(
        `Failed to ${action.toLowerCase().replace(' (via stop/start)', '')} ${machine.id}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  if (failedMachines.length === 0) {
    outro(
      `✅ Successfully processed ${successCount} machine(s) for ${appName}!`
    );
    process.exit(0);
  } else {
    outro(
      `⚠️  Processed ${successCount}/${status.machines.length} machines.\nFailed: ${failedMachines.join(', ')}`
    );
    process.exit(1);
  }
}

// Export for use as a library
export { main as restartApp, type RestartAppOptions };

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
}
