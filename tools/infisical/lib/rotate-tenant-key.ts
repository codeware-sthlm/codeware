import { type ChildProcess, exec, spawn } from 'child_process';
import { connect } from 'net';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

import { Fly } from '@cdwr/fly-node';
import {
  cancel,
  confirm,
  intro,
  isCancel,
  log,
  note,
  outro,
  select,
  spinner
} from '@clack/prompts';
import {
  type Environment,
  EnvironmentSchema,
  setInfisicalSecret,
  withInfisical
} from '@codeware/shared/feature/infisical';
import { toPoolerUrl } from '@codeware/shared/util/pure';
import * as dotenv from 'dotenv';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env.infisical') });

const Environments = EnvironmentSchema.options;

// Supabase project region — used to construct the Session Mode pooler hostname
const SUPABASE_REGION = 'eu-central-1';

const workspaceRoot = path.resolve(__dirname, '../../..');

// Silent client — the ssh output carries a connection string, so nothing from
// the Fly CLI should reach the console
const fly = new Fly({
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

type TenantDeployment = {
  /** App folders holding a `PAYLOAD_API_KEY`, all of which must be updated */
  apps: Array<string>;
  /** Distinct key values found across those folders */
  apiKeys: Set<string>;
};

/**
 * Discover which apps each tenant deploys, from the `/tenants/<id>/apps/<app>`
 * folder structure. Every app folder holding a `PAYLOAD_API_KEY` has to be
 * updated, otherwise that deployment authenticates with the retired key.
 *
 * The key value is collected too - it is what identifies the Payload tenant.
 * The Infisical tenant id is a deployment name, not the tenant's slug.
 */
async function fetchTenantDeployments(
  environment: Environment
): Promise<Map<string, TenantDeployment>> {
  const folders = await withInfisical({
    environment,
    filter: { path: '/tenants', recurse: true },
    groupByFolder: true
  });

  const tenants = new Map<string, TenantDeployment>();
  const tenantAppPattern = /^\/tenants\/([^/]+)\/apps\/([^/]+)$/;

  for (const folder of folders ?? []) {
    const match = folder.path.match(tenantAppPattern);

    if (!match) {
      continue;
    }

    const [, tenantId, appName] = match;
    const apiKey = folder.secrets.find(
      ({ secretKey }) => secretKey === 'PAYLOAD_API_KEY'
    )?.secretValue;

    if (!apiKey) {
      continue;
    }

    const entry = tenants.get(tenantId) ?? { apps: [], apiKeys: new Set() };
    entry.apps.push(appName);
    entry.apiKeys.add(apiKey);
    tenants.set(tenantId, entry);
  }

  return tenants;
}

/**
 * Resolve the production DATABASE_URL from Infisical.
 *
 * Production runs on Supabase, so the connection string is a managed secret.
 */
async function fetchProductionDatabaseUrl(): Promise<string> {
  const secrets = await withInfisical({
    environment: 'production',
    filter: { path: '/apps/cms' }
  });

  const dbUrl = secrets?.find(
    ({ secretKey }) => secretKey === 'DATABASE_URL'
  )?.secretValue;

  if (!dbUrl) {
    throw new Error('DATABASE_URL not found in Infisical /apps/cms');
  }

  return toPoolerUrl(dbUrl, SUPABASE_REGION);
}

/**
 * Resolve a preview DATABASE_URL from the selected cms app.
 *
 * Preview databases are created by `fly postgres attach` during deploy, so the
 * connection string only exists as a Fly secret on the app itself - it is not
 * in Infisical and `fly secrets list` returns digests, not values. The only way
 * to read it back is from inside a running machine.
 *
 * All cms apps for a pull request share one database (`flyPostgresDatabaseName`),
 * so the host app is enough - the tenant-suffixed apps point at the same place.
 */
async function fetchPreviewDatabaseUrl(app: string): Promise<string> {
  const status = await fly.status({ app });
  const machines = status?.machines ?? [];

  if (!machines.length) {
    throw new Error(`App '${app}' has no machines - is the preview deployed?`);
  }

  // Preview machines auto-stop when idle and Fly cannot ssh into a stopped one
  if (!machines.some(({ state }) => state === 'started')) {
    await fly.machines.start(app, machines[0].id);

    // Give the machine a moment to accept connections
    await new Promise((resolve) => setTimeout(resolve, 5_000));
  }

  const dbUrl = (await fly.ssh.exec(app, 'printenv DATABASE_URL')).trim();

  if (!dbUrl.startsWith('postgres')) {
    throw new Error(`Could not read DATABASE_URL from app '${app}'`);
  }

  return dbUrl;
}

/**
 * List the cms host apps deployed for open pull requests
 */
async function fetchPreviewCmsApps(): Promise<Array<string>> {
  const apps = await fly.apps.list();

  return apps
    .map(({ name }) => name)
    .filter((name) => /-pr-\d+$/.test(name) && name.includes('cms'))
    .sort();
}

/** Local port used for the Fly proxy tunnel */
const PROXY_PORT = 15432;

/** Whether a connection string points at a Fly private network address */
const isFlyPrivateUrl = (dbUrl: string) =>
  /\.(flycast|internal)$/.test(new URL(dbUrl).hostname);

/** Whether something is already accepting connections on a local port */
const isPortOpen = (port: number) =>
  new Promise<boolean>((resolve) => {
    const socket = connect({ host: '127.0.0.1', port })
      .on('connect', () => {
        socket.destroy();
        resolve(true);
      })
      .on('error', () => resolve(false));
  });

/** Wait until the spawned proxy accepts connections on a local port */
async function waitForPort(
  port: number,
  proxy: ChildProcess,
  timeoutMs = 20_000
): Promise<void> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    // A proxy that died is never going to open the port, and `fly proxy` exits
    // immediately when the port is taken or the app is unreachable
    if (proxy.exitCode !== null || proxy.signalCode !== null) {
      throw new Error(
        `Fly proxy exited before opening port ${port} (code ${proxy.exitCode ?? proxy.signalCode})`
      );
    }

    if (await isPortOpen(port)) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Fly proxy did not open port ${port} in time`);
}

/**
 * Run `fn` with a Fly proxy tunnelling the Postgres app to localhost.
 *
 * Preview databases are only routable inside the Fly private network
 * (`<pg-app>.flycast`), so a local process cannot reach them without a tunnel.
 */
async function withFlyProxy<T>(
  pgApp: string,
  remotePort: string,
  fn: (localPort: number) => Promise<T>
): Promise<T> {
  // Refuse to reuse a port something else is already serving. Waiting on an
  // open port would otherwise succeed instantly and point the rotation at
  // whatever is listening, which could be a different database entirely.
  if (await isPortOpen(PROXY_PORT)) {
    throw new Error(
      `Port ${PROXY_PORT} is already in use - close it before rotating, ` +
        'the tunnel must be the only thing listening there'
    );
  }

  const proxy = spawn(
    'flyctl',
    ['proxy', `${PROXY_PORT}:${remotePort}`, '--app', pgApp],
    { stdio: 'ignore' }
  );

  try {
    await waitForPort(PROXY_PORT, proxy);
    return await fn(PROXY_PORT);
  } finally {
    proxy.kill();
  }
}

/**
 * Rotate the key in Payload via the local-api and return the new value
 */
async function rotateInPayload(
  environment: Environment,
  currentApiKey: string,
  databaseUrl: string,
  dryRun = false
): Promise<{ apiKey: string; slug: string }> {
  // The CLI itself runs under `tsx --tsconfig tools/tsconfig.tools.json`, which
  // exports that path relatively. Inheriting it makes the child resolve it
  // against `apps/cms` and fail before it starts.
  const { TSX_TSCONFIG_PATH: _ignored, ...parentEnv } = process.env;

  const { stdout } = await execAsync('npx tsx src/utils/rotate-tenant-key.ts', {
    cwd: path.join(workspaceRoot, 'apps/cms'),
    env: {
      ...parentEnv,
      // The target environment decides which PAYLOAD_SECRET_KEY is loaded, and
      // that key encrypts the API key - inheriting the local one would write a
      // value the deployment cannot decrypt
      DEPLOY_ENV: environment,
      // Rotation is a host-mode operation across all tenants
      TENANT_ID: '',
      // Normally injected by the deployment action, and required by the env
      // schema even though a local rotation does not use them
      APP_NAME: 'cdwr-cms',
      FLY_URL: '',
      PR_NUMBER: '',
      ROTATE_DATABASE_URL: databaseUrl,
      ROTATE_CURRENT_API_KEY: currentApiKey,
      ROTATE_DRY_RUN: String(dryRun),
      DISABLE_DB_PUSH: 'true',
      SEED_SOURCE: 'off'
    }
  });

  const apiKey = stdout.match(/^ROTATED_API_KEY=(.+)$/m)?.[1]?.trim() ?? '';
  const slug = stdout.match(/^RESOLVED_TENANT=(.+)$/m)?.[1]?.trim();

  if (!slug || (!dryRun && !apiKey)) {
    throw new Error(`Rotation script did not report a result:\n${stdout}`);
  }

  return { apiKey, slug };
}

/**
 * Main interactive rotation script
 */
async function main() {
  console.clear();
  intro('🔑  Rotate tenant API key');

  const environment = await select<Environment>({
    message: 'Select environment:',
    options: Environments.map((env) => ({ value: env, label: env }))
  });

  if (isCancel(environment)) {
    cancel('Operation cancelled');
    process.exit(0);
  }

  const s = spinner();

  // Preview has one database per pull request, so the app has to be named
  // before anything can be read from it
  let previewApp = '';

  if (environment === 'preview') {
    s.start('Listing preview cms apps...');

    let previewApps: Array<string>;
    try {
      previewApps = await fetchPreviewCmsApps();
      s.stop(`Found ${previewApps.length} preview cms app(s)`);
    } catch (error) {
      s.stop('Failed to list apps');
      cancel(
        `Error: ${error instanceof Error ? error.message : String(error)}`
      );
      process.exit(1);
    }

    if (!previewApps.length) {
      cancel('No preview cms apps are deployed');
      process.exit(0);
    }

    const selected = await select<string>({
      message: 'Select the cms app holding the preview database:',
      options: previewApps.map((app) => ({ value: app, label: app }))
    });

    if (isCancel(selected)) {
      cancel('Operation cancelled');
      process.exit(0);
    }

    previewApp = selected;
  }

  s.start(`Fetching tenants for ${environment} from Infisical...`);

  let tenants: Map<string, TenantDeployment>;
  try {
    tenants = await fetchTenantDeployments(environment);
    s.stop(`Found ${tenants.size} tenant(s)`);
  } catch (error) {
    s.stop('Failed to fetch tenants');
    cancel(`Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }

  if (tenants.size === 0) {
    cancel(`No tenants with a PAYLOAD_API_KEY found in ${environment}`);
    process.exit(0);
  }

  const tenantId = await select<string>({
    message: 'Select tenant to rotate:',
    options: [...tenants.entries()].map(([tenant, { apps }]) => ({
      value: tenant,
      label: tenant,
      hint: `${apps.join(', ')}`
    }))
  });

  if (isCancel(tenantId)) {
    cancel('Operation cancelled');
    process.exit(0);
  }

  const { apps, apiKeys } = tenants.get(tenantId) ?? {
    apps: [],
    apiKeys: new Set<string>()
  };

  // The key identifies the tenant, so the folders disagreeing means we cannot
  // know which one the deployments actually authenticate with
  if (apiKeys.size > 1) {
    cancel(
      `The app folders under /tenants/${tenantId} hold different ` +
        `PAYLOAD_API_KEY values. Reconcile them before rotating.`
    );
    process.exit(1);
  }

  const [currentApiKey] = [...apiKeys];

  note(
    [
      `The Payload tenant using this key gets a new one, then Infisical is`,
      `updated for: ${apps.map((app) => `/tenants/${tenantId}/apps/${app}`).join(', ')}`,
      '',
      `'${tenantId}' is a deployment name - the tenant is resolved by its`,
      `current API key, and its Payload slug is reported once resolved.`,
      ...(previewApp
        ? [
            '',
            `Database is read from '${previewApp}', which is started first if`,
            `its machines are stopped.`
          ]
        : []),
      '',
      `The running deployments keep using the old key until they are`,
      `redeployed, so ${tenantId} serves errors until that completes.`
    ].join('\n'),
    'What happens next'
  );

  s.start(
    previewApp
      ? `Reading DATABASE_URL from '${previewApp}'...`
      : 'Fetching DATABASE_URL from Infisical...'
  );

  let databaseUrl: string;
  try {
    databaseUrl = previewApp
      ? await fetchPreviewDatabaseUrl(previewApp)
      : await fetchProductionDatabaseUrl();
    s.stop('Database URL resolved');
  } catch (error) {
    s.stop('Failed to resolve database URL');
    cancel(`Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }

  /**
   * Resolve the tenant first and only rotate once it has been confirmed.
   *
   * Both run inside the same tunnel, since opening one per step would mean
   * starting and tearing down a proxy twice.
   */
  const resolveThenRotate = async (dbUrl: string) => {
    s.start('Resolving which Payload tenant holds this key...');

    const { slug } = await rotateInPayload(
      environment,
      currentApiKey,
      dbUrl,
      true
    );

    s.stop(`Resolved to Payload tenant '${slug}'`);

    const proceed = await confirm({
      message: `Rotate '${tenantId}' → Payload tenant '${slug}' in ${environment}?`,
      initialValue: false
    });

    if (isCancel(proceed) || !proceed) {
      cancel('Operation cancelled - nothing was written');
      process.exit(0);
    }

    s.start(`Rotating key for '${slug}'...`);
    return rotateInPayload(environment, currentApiKey, dbUrl);
  };

  let rotated: { apiKey: string; slug: string };
  try {
    if (isFlyPrivateUrl(databaseUrl)) {
      // Only reachable from inside Fly, so tunnel it for the rotation
      const url = new URL(databaseUrl);
      const pgApp = url.hostname.replace(/\.(flycast|internal)$/, '');

      rotated = await withFlyProxy(pgApp, url.port || '5432', (localPort) => {
        url.hostname = '127.0.0.1';
        url.port = String(localPort);
        return resolveThenRotate(url.toString());
      });
    } else {
      rotated = await resolveThenRotate(databaseUrl);
    }
    s.stop(`Payload tenant '${rotated.slug}' updated`);
  } catch (error) {
    s.stop('Rotation failed');
    cancel(`Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }

  // From here the Payload key is already live — every Infisical write has to
  // land or the tenant stays broken with no way back to the old key.
  const failed: Array<string> = [];

  for (const app of apps) {
    const secretPath = `/tenants/${tenantId}/apps/${app}`;
    s.start(`Updating ${secretPath}...`);

    try {
      const { action } = await setInfisicalSecret({
        environment,
        path: secretPath,
        key: 'PAYLOAD_API_KEY',
        value: rotated.apiKey
      });
      s.stop(`${secretPath} ${action}`);
    } catch (error) {
      s.stop(`${secretPath} failed`);
      log.error(error instanceof Error ? error.message : String(error));
      failed.push(secretPath);
    }
  }

  if (failed.length) {
    note(
      [
        `Payload now expects the new key but these paths were not updated:`,
        ...failed.map((p) => `  ${p}`),
        '',
        `Set PAYLOAD_API_KEY manually before redeploying:`,
        `  ${rotated.apiKey}`
      ].join('\n'),
      '⚠️  Infisical is out of sync'
    );
    process.exit(1);
  }

  const pullRequest = previewApp.match(/-pr-(\d+)$/)?.[1];

  note(
    [
      `Redeploy ${tenantId} so the deployments pick up the new key:`,
      '',
      ...(pullRequest
        ? [`  Re-run the Fly Deployment workflow for PR #${pullRequest}`]
        : [
            `  Actions → Fly Deployment → Run workflow`,
            `  App: <empty>  Tenant: ${tenantId}  Environment: ${environment}`
          ]),
      '',
      `Until then ${tenantId} authenticates with the retired key.`
    ].join('\n'),
    'Redeploy required'
  );

  outro(
    `✅  Rotated API key for '${tenantId}' (tenant '${rotated.slug}') in ${environment}`
  );
}

// Export for use as a library
export { main as rotateTenantKeyMain };

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
}
