import {
  cancel,
  intro,
  isCancel,
  log,
  multiselect,
  outro,
  select,
  spinner,
  text
} from '@clack/prompts';
import { Fly } from '@codeware/fly-node';
import Table from 'cli-table3';

// Initialize Fly client
const fly = new Fly({
  logger: {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    info: () => {}, // Silent mode
    error: console.error,
    traceCLI: false,
    redactSecrets: true,
    verbose: false,
    debug: false,
    streamToConsole: false
  }
});

interface AppInfoOptions {
  appPrefix?: string;
  apps?: string[];
}

/**
 * Format bytes to human readable size
 */
function formatBytes(mb: number): string {
  if (mb >= 1024) {
    return `${(mb / 1024).toFixed(1)} GB`;
  }
  return `${mb} MB`;
}

/**
 * Format machine state with color
 */
function formatState(state: string): string {
  const stateMap: Record<string, string> = {
    started: '🟢 Started',
    stopped: '🔴 Stopped',
    starting: '🟡 Starting',
    stopping: '🟡 Stopping',
    created: '🔵 Created',
    destroyed: '⚫ Destroyed'
  };
  return stateMap[state] || `⚪ ${state}`;
}

/**
 * Format uptime from created date
 */
function formatUptime(createdAt: string): string {
  const created = new Date(createdAt);
  const now = new Date();
  const diff = now.getTime() - created.getTime();

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) {
    return `${days}d ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Format compact state indicator for tables
 */
function formatCompactState(state: string): string {
  const stateMap: Record<string, string> = {
    started: '●',
    stopped: '○',
    starting: '◐',
    stopping: '◑',
    created: '◌',
    destroyed: '✕'
  };
  return stateMap[state] || '?';
}

interface AppSummary {
  name: string;
  deployed: boolean;
  machinesCount: number;
  states: string[];
  resources: string;
  uptime: string;
  certs: number;
  secrets: number;
}

/**
 * Fetch app summary for table display
 */
async function fetchAppSummary(appName: string): Promise<AppSummary | null> {
  try {
    const status = await fly.status({ app: appName });
    if (!status) return null;

    const states = status.machines.map((m) => m.state);

    // Get resources and uptime from machines
    let resources = '-';
    let uptime = '-';

    if (status.machines.length > 0) {
      const firstMachine = status.machines[0];
      const guest = firstMachine.config?.guest;

      if (guest?.cpus || guest?.memory_mb) {
        const cpuKind = (guest.cpu_kind || 'shared')
          .replace('shared', 'sh')
          .replace('performance', 'pf');
        const cpus = guest.cpus || 1;
        const memory = guest.memory_mb || 256;
        const memDisplay =
          memory >= 1024 ? `${(memory / 1024).toFixed(0)}G` : `${memory}M`;
        resources = `${cpuKind}×${cpus} ${memDisplay}`;
      }

      // Get oldest machine uptime (most representative)
      const oldestMachine = status.machines.reduce(
        (oldest, m) =>
          new Date(m.createdAt) < new Date(oldest.createdAt) ? m : oldest,
        firstMachine
      );
      uptime = formatUptime(oldestMachine.createdAt);
    }

    // Fetch certificates count
    let certsCount = 0;
    try {
      const certs = await fly.certs.list({ app: appName });
      certsCount = certs.length;
    } catch {
      // Ignore
    }

    // Fetch secrets count
    let secretsCount = 0;
    try {
      const secrets = await fly.secrets.list({ app: appName });
      secretsCount = secrets.length;
    } catch {
      // Ignore
    }

    return {
      name: status.name,
      deployed: status.deployed,
      machinesCount: status.machines.length,
      states,
      resources,
      uptime,
      certs: certsCount,
      secrets: secretsCount
    };
  } catch {
    return null;
  }
}

/**
 * Display apps in table format
 */
async function displayAppTable(appNames: string[]): Promise<void> {
  const s = spinner();
  s.start('Fetching app information...');

  const summaries: AppSummary[] = [];
  for (const appName of appNames) {
    const summary = await fetchAppSummary(appName);
    if (summary) {
      summaries.push(summary);
    }
  }

  s.stop(`✓ Fetched ${summaries.length} apps`);

  if (summaries.length === 0) {
    log.warn('No app data retrieved');
    return;
  }

  // Create table with cli-table3
  const table = new Table({
    head: [
      'App',
      'Status',
      'States',
      'Resources',
      'Uptime',
      'Certs',
      'Secrets'
    ],
    style: {
      head: [], // No color styling
      border: [] // No color styling
    }
  });

  // Add rows
  for (const summary of summaries) {
    const status = summary.deployed ? 'UP' : 'DOWN';
    const machinesDisplay = summary.states.map(formatCompactState).join(' ');

    table.push([
      summary.name,
      status,
      machinesDisplay,
      summary.resources,
      summary.uptime,
      String(summary.certs),
      String(summary.secrets)
    ]);
  }

  log.message('');
  log.message(table.toString());
  log.message('');
}

/**
 * Display detailed app information
 */
async function displayAppInfo(appName: string): Promise<void> {
  const s = spinner();

  try {
    // Fetch app status
    s.start(`Fetching information for ${appName}...`);
    const status = await fly.status({ app: appName });

    if (!status) {
      s.stop(`App ${appName} not found`, 1);
      return;
    }

    s.stop(`✓ Data fetched for ${appName}`);

    // Fetch certificates
    let certs: Awaited<ReturnType<typeof fly.certs.list>> = [];
    try {
      certs = await fly.certs.list({ app: appName });
    } catch {
      // Certs are optional
    }

    // Fetch secrets
    let secretNames: string[] = [];
    try {
      const secrets = await fly.secrets.list({ app: appName });
      secretNames = secrets.map((s) => s.name);
    } catch {
      // Secrets are optional
    }

    // Display app overview
    log.message('');
    log.message('━'.repeat(60));
    log.message(`📱 ${status.name}`);
    log.message('━'.repeat(60));

    // Basic info
    log.message(
      `📋 ID: ${status.id} | Hostname: ${status.hostname} | ${status.deployed ? '✅ Deployed' : '⏸️  Not Deployed'}`
    );
    log.message(
      `   Version: ${status.version} | Org: ${status.organization.slug}`
    );

    // Machines
    if (status.machines.length > 0) {
      log.message('');
      log.message(`⚙️  Machines (${status.machines.length}):`);

      for (const machine of status.machines) {
        const guest = machine.config?.guest;

        log.message(`   🖥️  ${machine.name} (${machine.region})`);
        log.message(
          `      ${formatState(machine.state)} | Uptime: ${formatUptime(machine.createdAt)}`
        );

        // Image info
        if (machine.imageRef) {
          const imgRef = machine.imageRef;
          log.message(`      Image: ${imgRef.repository}:${imgRef.tag}`);
        }

        // Resources
        if (guest?.cpus || guest?.memory_mb) {
          const cpuKind = guest.cpu_kind || 'shared';
          const cpus = guest.cpus || 1;
          const memory = guest.memory_mb || 256;
          log.message(
            `      Resources: ${cpuKind}-cpu-${cpus}x / ${formatBytes(memory)}`
          );
        }

        // Health checks
        if (machine.checks && machine.checks.length > 0) {
          const passing = machine.checks.filter(
            (c) => c.status === 'passing'
          ).length;
          const total = machine.checks.length;
          const healthStatus = passing === total ? '✅' : '⚠️';
          log.message(
            `      Health: ${healthStatus} ${passing}/${total} checks passing`
          );
        }
      }
    } else {
      log.message('');
      log.warn('   No machines found');
    }

    // Certificates
    if (certs.length > 0) {
      log.message('');
      log.message(`🔒 Certificates (${certs.length}):`);

      for (const cert of certs) {
        const statusIcon = cert.clientStatus === 'Ready' ? '✅' : '⏳';
        log.message(
          `   ${statusIcon} ${cert.hostname} | ${cert.clientStatus} | Created: ${new Date(cert.createdAt).toLocaleDateString()}`
        );
      }
    }

    // Secrets
    if (secretNames.length > 0) {
      log.message('');
      log.message(
        `🔑 Secrets (${secretNames.length}): ${secretNames.join(', ')}`
      );
    }

    log.message('━'.repeat(60));
    log.message('');
  } catch (error) {
    s.stop(`Failed to fetch info for ${appName}`, 1);
    log.error(
      `Error: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Main interactive script
 */
async function main(options: AppInfoOptions = {}) {
  console.clear();

  intro('📊 Fly.io App Information');

  let appNames: string[] = options.apps || [];

  if (appNames.length === 0) {
    // Get app prefix
    let appPrefix = options.appPrefix;

    if (!appPrefix) {
      const prefixInput = await text({
        message: 'Filter apps by prefix (optional):',
        placeholder: 'e.g., cdwr-',
        defaultValue: ''
      });

      if (isCancel(prefixInput)) {
        cancel('Operation cancelled');
        process.exit(0);
      }

      appPrefix = (prefixInput as string) || undefined;
    }

    // List apps
    const s = spinner();
    s.start('Fetching Fly apps...');
    let apps: Awaited<ReturnType<typeof fly.apps.list>>;
    try {
      const allApps = await fly.apps.list();
      apps = appPrefix
        ? allApps.filter((app) => app.name.startsWith(appPrefix))
        : allApps;
      s.stop(
        `Found ${apps.length} app${apps.length === 1 ? '' : 's'}${appPrefix ? ` matching "${appPrefix}"` : ''}`
      );
    } catch (error) {
      s.stop('Failed to fetch apps', 1);
      log.error(
        `Error: ${error instanceof Error ? error.message : String(error)}`
      );
      process.exit(1);
    }

    if (apps.length === 0) {
      log.warn('No apps found');
      process.exit(0);
    }

    // Select apps
    const displayMode = await select({
      message: 'How would you like to view app information?',
      options: [
        {
          value: 'single',
          label: 'Select one app',
          hint: 'Detailed view of a single app'
        },
        {
          value: 'multiple',
          label: 'Select multiple apps',
          hint: 'View info for multiple apps'
        },
        {
          value: 'all',
          label: 'All apps',
          hint: `View all ${apps.length} apps`
        }
      ]
    });

    if (isCancel(displayMode)) {
      cancel('Operation cancelled');
      process.exit(0);
    }

    if (displayMode === 'all') {
      appNames = apps.map((app) => app.name);
    } else if (displayMode === 'single') {
      const appSelection = await select({
        message: 'Select an app:',
        options: apps.map((app) => ({
          value: app.name,
          label: app.name,
          hint: app.status
        }))
      });

      if (isCancel(appSelection)) {
        cancel('Operation cancelled');
        process.exit(0);
      }

      appNames = [appSelection as string];
    } else {
      const appsSelection = await multiselect({
        message: 'Select apps to view:',
        options: apps.map((app) => ({
          value: app.name,
          label: app.name,
          hint: app.status
        })),
        required: true
      });

      if (isCancel(appsSelection)) {
        cancel('Operation cancelled');
        process.exit(0);
      }

      appNames = appsSelection as string[];
    }
  }

  // Display info for apps
  if (appNames.length === 1) {
    // Single app: detailed view
    await displayAppInfo(appNames[0]);
  } else {
    // Multiple apps: table view
    await displayAppTable(appNames);
  }

  outro(
    `✨ Displayed information for ${appNames.length} app${appNames.length === 1 ? '' : 's'}`
  );
}

// Export for use as a library
export { main as showAppInfo, type AppInfoOptions };

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    log.error(
      `Fatal error: ${error instanceof Error ? error.message : String(error)}`
    );
    process.exit(1);
  });
}
