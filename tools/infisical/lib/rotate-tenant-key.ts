import { type ChildProcess, exec, spawn } from 'child_process';
import { randomUUID } from 'crypto';
import { readFileSync } from 'fs';
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
  deleteInfisicalSecret,
  setInfisicalSecret,
  withInfisical
} from '@codeware/shared/feature/infisical';
import { getAppName } from '@codeware/shared/util/nx-deploy';
import { toPoolerUrl } from '@codeware/shared/util/pure';
import * as dotenv from 'dotenv';
import * as TOML from 'smol-toml';

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
  await startMachines(app);

  // `fly ssh console` prepends its own chatter when it picks a machine for you
  // ("No machine specified, using ..."), so take the line that is the value
  // rather than assuming the output is only the value
  const output = await fly.ssh.exec(app, 'printenv DATABASE_URL');
  const dbUrl = output
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.startsWith('postgres'));

  if (!dbUrl) {
    throw new Error(
      `Could not read DATABASE_URL from app '${app}':\n${output.trim()}`
    );
  }

  return dbUrl;
}

/**
 * Prove Infisical will accept an edit, before anything is rotated.
 *
 * Rotation writes Payload first and Infisical second, so a token that cannot
 * edit leaves the tenant holding a key nothing else knows. Checking up front
 * turns that into a refusal to start.
 *
 * It has to be a real edit of a real secret: writing `PAYLOAD_API_KEY` back
 * unchanged proves nothing, because a write that "fails" but leaves the stored
 * value matching is treated as success. So use a throwaway secret, change it,
 * confirm the change is visible, and remove it.
 */
async function assertInfisicalWritable(
  environment: Environment,
  secretPath: string
): Promise<void> {
  const key = 'ROTATION_WRITE_CHECK';
  const write = (value: string) =>
    setInfisicalSecret({ environment, path: secretPath, key, value });

  try {
    await write(`probe-${randomUUID()}`);

    // The edit, which is the permission rotation actually needs
    const expected = `probe-${randomUUID()}`;
    await write(expected);

    const stored = (
      await withInfisical({ environment, filter: { path: secretPath } })
    )?.find(({ secretKey }) => secretKey === key)?.secretValue;

    if (stored !== expected) {
      throw new Error('the edit did not take effect');
    }
  } catch (error) {
    throw new Error(
      `Infisical will not accept writes at ${secretPath}: ` +
        `${error instanceof Error ? error.message : String(error)}`
    );
  } finally {
    await deleteInfisicalSecret({ environment, path: secretPath, key });
  }
}

/**
 * Resolve the Fly app name for a tenant's deployment of an app.
 *
 * The base name lives in the app's own fly config, and `getAppName` applies the
 * same pull request and tenant suffixes the deployment action uses.
 */
function flyAppName(
  app: string,
  tenantId: string,
  pullRequest?: string
): string {
  const configPath = path.join(workspaceRoot, 'apps', app, 'fly.toml');
  const config = TOML.parse(readFileSync(configPath, 'utf-8')) as {
    app?: string;
  };

  if (!config.app) {
    throw new Error(`No app name found in ${configPath}`);
  }

  return getAppName({
    configAppName: config.app,
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
async function startMachines(app: string): Promise<void> {
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

/** How many times to rebuild the tunnel before giving up */
const TUNNEL_ATTEMPTS = 5;

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

/**
 * Whether a Postgres server actually answers on a local port.
 *
 * `fly proxy` opens its listener immediately, well before the remote is
 * reachable, so an accepted TCP connection proves nothing. Handing that to
 * Payload is worse than waiting: its connect helper swallows the failure
 * (`catch (ignore)`) and returns, so the script would end with no logs, no
 * error and a success exit code.
 *
 * Send a Postgres SSLRequest and require the single-byte reply a real server
 * gives. No client library needed for a handshake this small.
 */
const isPostgresReady = (port: number) =>
  new Promise<boolean>((resolve) => {
    const socket = connect({ host: '127.0.0.1', port });
    let settled = false;

    // An explicit timer, because `socket.setTimeout` only covers inactivity
    // after connecting - a connect that never completes would leave this
    // promise pending forever, and a pending promise with no handles left is
    // how a Node process exits 0 having done nothing at all
    const deadline = setTimeout(() => done(false), 5_000);

    const done = (ready: boolean) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(deadline);
      socket.destroy();
      resolve(ready);
    };

    socket.setTimeout(3_000);
    socket.on('connect', () => {
      const sslRequest = Buffer.alloc(8);
      sslRequest.writeInt32BE(8, 0);
      sslRequest.writeInt32BE(80877103, 4);
      socket.write(sslRequest);
    });
    // 'S' (ssl supported) or 'N' (not) - either means a Postgres server
    socket.on('data', (data) => done(data[0] === 0x53 || data[0] === 0x4e));
    socket.on('timeout', () => done(false));
    socket.on('error', () => done(false));
    socket.on('close', () => done(false));
  });

/** Wait until the tunnel carries a working Postgres connection */
async function waitForPostgres(
  port: number,
  proxy: ChildProcess,
  timeoutMs = 30_000
): Promise<void> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    // A proxy that died is never going to serve the port, and `fly proxy` exits
    // immediately when the port is taken or the app is unreachable
    if (proxy.exitCode !== null || proxy.signalCode !== null) {
      throw new Error(
        `Fly proxy exited before opening port ${port} (code ${proxy.exitCode ?? proxy.signalCode})`
      );
    }

    if (await isPostgresReady(port)) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(
    `Fly proxy never carried a Postgres connection on port ${port}`
  );
}

/**
 * Run `fn` against the database, tunnelling first when it is only reachable
 * from inside Fly (`<pg-app>.flycast`).
 *
 * Deliberately per operation rather than one tunnel around the whole rotation.
 * A tunnel held open across a confirmation prompt goes stale while it waits,
 * and Payload's connect helper swallows the resulting failure - the script then
 * ends with no output and an exit code of 0.
 */
async function withDatabase<T>(
  databaseUrl: string,
  fn: (dbUrl: string) => Promise<T>,
  onRetry?: (attempt: number) => void
): Promise<T> {
  const run = () => {
    if (!isFlyPrivateUrl(databaseUrl)) {
      return fn(databaseUrl);
    }

    const url = new URL(databaseUrl);
    const pgApp = url.hostname.replace(/\.(flycast|internal)$/, '');

    return withFlyProxy(pgApp, url.port || '5432', (localPort) => {
      url.hostname = '127.0.0.1';
      url.port = String(localPort);
      return fn(url.toString());
    });
  };

  // A fresh tunnel can pass the readiness probe and still drop the connection
  // the script then opens - observed needing three goes - so retry with a new
  // proxy each time. Only failures that happen before the script reaches the
  // tenant are retried, so this can never repeat a write.
  for (let attempt = 1; ; attempt++) {
    try {
      return await run();
    } catch (error) {
      if (attempt >= TUNNEL_ATTEMPTS || !isPreWriteFailure(error)) {
        throw error;
      }

      onRetry?.(attempt);
      await new Promise((resolve) => setTimeout(resolve, 2_000));
    }
  }
}

/**
 * Whether a failure happened before the script touched the tenant.
 *
 * The script reports `RESOLVED_TENANT` as soon as it has found the tenant and
 * `ROTATED_API_KEY` once it has written, so a failure carrying neither means
 * it never got past connecting - nothing was changed and retrying is safe.
 */
const isPreWriteFailure = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error);

  return (
    !message.includes('RESOLVED_TENANT=') &&
    !message.includes('ROTATED_API_KEY=') &&
    /exited early|did not report a result/.test(message)
  );
};

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
    await waitForPostgres(PROXY_PORT, proxy);

    // The probe above opens and drops a connection of its own. Give the proxy a
    // breath to re-establish before handing it something that matters.
    await new Promise((resolve) => setTimeout(resolve, 2_000));

    return await fn(PROXY_PORT);
  } finally {
    proxy.kill();

    // Killing the proxy does not free the port straight away, and the next
    // tunnel refuses to start while something is still listening
    const deadline = Date.now() + 15_000;
    while (Date.now() < deadline && (await isPortOpen(PROXY_PORT))) {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
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
  // This CLI runs under `tsx --tsconfig tools/tsconfig.tools.json`, which
  // exports its own instrumentation for child processes: the tsconfig path
  // (relative, so the child resolves it against `apps/cms` and dies) and a
  // NODE_PATH pointing into tsx's bundled node_modules, which quietly changes
  // how the child resolves modules. The child runs its own `npx tsx` and needs
  // none of it, so drop the lot rather than inherit a half-applied setup.
  const {
    TSX_TSCONFIG_PATH: _tsconfig,
    NODE_PATH: _nodePath,
    NODE_OPTIONS: _nodeOptions,
    ...parentEnv
  } = process.env;

  const { stdout, stderr } = await execAsync(
    'npx tsx src/utils/rotate-tenant-key.ts',
    {
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
    }
  );

  const apiKey = stdout.match(/^ROTATED_API_KEY=(.+)$/m)?.[1]?.trim() ?? '';
  const slug = stdout.match(/^RESOLVED_TENANT=(.+)$/m)?.[1]?.trim();

  if (!slug || (!dryRun && !apiKey)) {
    // The key may already have been written and printed before whatever went
    // wrong here, and this output ends up on a console and in shell history.
    // Keep the marker, drop the value - `isPreWriteFailure` reads the marker
    // to decide whether a retry could repeat a write.
    const redact = (output: string) =>
      output.replace(/^(ROTATED_API_KEY=).*$/gm, '$1<redacted>');

    // Report both streams - the interesting part of a silent failure is
    // usually on stderr, and without it there is nothing to go on
    throw new Error(
      [
        'Rotation script did not report a result.',
        '',
        '--- stdout ---',
        redact(stdout.trim()) || '<empty>',
        '',
        '--- stderr ---',
        redact(stderr.trim()) || '<empty>'
      ].join('\n')
    );
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

  // Both stores have to be writable for a rotation to finish. Payload is
  // written first, so an Infisical token that cannot edit would leave the
  // tenant holding a key nothing else has - check before that can happen.
  s.start('Checking Infisical accepts writes...');

  try {
    for (const app of apps) {
      await assertInfisicalWritable(
        environment,
        `/tenants/${tenantId}/apps/${app}`
      );
    }
    s.stop('Infisical writes verified');
  } catch (error) {
    s.stop('Infisical is not writable');
    note(
      [
        error instanceof Error ? error.message : String(error),
        '',
        `Nothing was changed - Payload is untouched and the tenant still works.`,
        '',
        `Rotation writes to Infisical, so the credentials in`,
        `tools/infisical/.env.infisical need to create and edit secrets under`,
        `/tenants. A read-only token gets this far and then strands the tenant`,
        `on a key only Payload knows, which is why it is checked up front.`
      ].join('\n'),
      '⚠️  Cannot rotate'
    );
    process.exit(1);
  }

  // Resolve first, so the tenant being rotated is named before anything is
  // written. This connects on its own - see `withDatabase` for why the
  // connection is not held open across the prompt that follows.
  s.start('Resolving which Payload tenant holds this key...');

  let slug: string;
  try {
    ({ slug } = await withDatabase(
      databaseUrl,
      (dbUrl) => rotateInPayload(environment, currentApiKey, dbUrl, true),
      (attempt) =>
        s.message(`Tunnel dropped, rebuilding (attempt ${attempt + 1})...`)
    ));
    s.stop(`Resolved to Payload tenant '${slug}'`);
  } catch (error) {
    s.stop('Could not resolve the tenant');
    cancel(`Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }

  const proceed = await confirm({
    message: `Rotate '${tenantId}' → Payload tenant '${slug}' in ${environment}?`,
    initialValue: false
  });

  if (isCancel(proceed) || !proceed) {
    cancel('Operation cancelled - nothing was written');
    process.exit(0);
  }

  s.start(`Rotating key for '${slug}'...`);

  let rotated: { apiKey: string; slug: string };
  try {
    rotated = await withDatabase(
      databaseUrl,
      (dbUrl) => rotateInPayload(environment, currentApiKey, dbUrl),
      (attempt) =>
        s.message(`Tunnel dropped, rebuilding (attempt ${attempt + 1})...`)
    );
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

  // A redeploy would not finish the job: the deployment only sets secrets that
  // are missing and skips any that already exist, so a rotated PAYLOAD_API_KEY
  // never reaches a running app that way. Write it to the Fly apps directly.
  const pullRequest = previewApp.match(/-pr-(\d+)$/)?.[1];
  const flyApps = apps.map((app) => ({
    app,
    flyApp: flyAppName(app, tenantId, pullRequest)
  }));

  // Stage everywhere first, then apply, so cms and web change together instead
  // of each restarting as its own secret lands
  const staged: Array<string> = [];

  for (const { app, flyApp } of flyApps) {
    s.start(`Staging PAYLOAD_API_KEY on ${flyApp}...`);

    try {
      await fly.secrets.set(
        { PAYLOAD_API_KEY: rotated.apiKey },
        { app: flyApp, stage: true }
      );
      staged.push(flyApp);
      s.stop(`${flyApp} staged`);
    } catch (error) {
      s.stop(`${flyApp} could not be staged`);
      log.error(error instanceof Error ? error.message : String(error));
      note(
        [
          `Infisical holds the new key, but '${flyApp}' (${app}) did not take`,
          `it. Nothing has been applied yet, so the tenant is still running on`,
          `the old key - finish the remaining apps by hand:`,
          '',
          `  fly secrets set PAYLOAD_API_KEY=<key> --app ${flyApp}`
        ].join('\n'),
        '⚠️  Staging incomplete'
      );
      process.exit(1);
    }
  }

  for (const flyApp of staged) {
    s.start(`Applying staged secret on ${flyApp}...`);

    try {
      // Fly can only update a started machine, and preview machines suspend
      await startMachines(flyApp);
      await fly.secrets.deploy(flyApp);
      s.stop(`${flyApp} restarted with the new key`);
    } catch (error) {
      s.stop(`${flyApp} could not be restarted`);
      log.error(error instanceof Error ? error.message : String(error));
      note(
        [
          `The secret is staged on '${flyApp}' but not applied. Its machines`,
          `keep the old key until they take it up:`,
          '',
          `  fly secrets deploy --app ${flyApp}`
        ].join('\n'),
        '⚠️  Apply incomplete'
      );
      process.exit(1);
    }
  }

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
