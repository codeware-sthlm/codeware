import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

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

/**
 * Discover which apps each tenant deploys, from the `/tenants/<id>/apps/<app>`
 * folder structure. Every app folder holding a `PAYLOAD_API_KEY` has to be
 * updated, otherwise that deployment authenticates with the retired key.
 */
async function fetchTenantApps(
  environment: Environment
): Promise<Map<string, Array<string>>> {
  const folders = await withInfisical({
    environment,
    filter: { path: '/tenants', recurse: true },
    groupByFolder: true
  });

  const tenantApps = new Map<string, Array<string>>();
  const tenantAppPattern = /^\/tenants\/([^/]+)\/apps\/([^/]+)$/;

  for (const folder of folders ?? []) {
    const match = folder.path.match(tenantAppPattern);

    if (!match) {
      continue;
    }

    const [, tenantId, appName] = match;
    const hasApiKey = folder.secrets.some(
      ({ secretKey }) => secretKey === 'PAYLOAD_API_KEY'
    );

    if (!hasApiKey) {
      continue;
    }

    tenantApps.set(tenantId, [...(tenantApps.get(tenantId) ?? []), appName]);
  }

  return tenantApps;
}

/**
 * Fetch the CMS host DATABASE_URL for an environment
 */
async function fetchDatabaseUrl(environment: Environment): Promise<string> {
  const secrets = await withInfisical({
    environment,
    filter: { path: '/apps/cms' }
  });

  const dbUrl = secrets?.find(
    ({ secretKey }) => secretKey === 'DATABASE_URL'
  )?.secretValue;

  if (!dbUrl) {
    throw new Error(
      `DATABASE_URL not found in Infisical /apps/cms for environment: ${environment}`
    );
  }

  return dbUrl;
}

/**
 * Rotate the key in Payload via the local-api and return the new value
 */
async function rotateInPayload(
  tenantId: string,
  databaseUrl: string
): Promise<string> {
  const { stdout } = await execAsync('npx tsx src/utils/rotate-tenant-key.ts', {
    cwd: path.join(workspaceRoot, 'apps/cms'),
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
      ROTATE_TENANT_SLUG: tenantId,
      DISABLE_DB_PUSH: 'true',
      SEED_SOURCE: 'off'
    }
  });

  const apiKey = stdout.match(/^ROTATED_API_KEY=(.+)$/m)?.[1]?.trim();

  if (!apiKey) {
    throw new Error(`Rotation script did not return a key:\n${stdout}`);
  }

  return apiKey;
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

  s.start(`Fetching tenants for ${environment} from Infisical...`);

  let tenantApps: Map<string, Array<string>>;
  try {
    tenantApps = await fetchTenantApps(environment);
    s.stop(`Found ${tenantApps.size} tenant(s)`);
  } catch (error) {
    s.stop('Failed to fetch tenants');
    cancel(`Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }

  if (tenantApps.size === 0) {
    cancel(`No tenants with a PAYLOAD_API_KEY found in ${environment}`);
    process.exit(0);
  }

  const tenantId = await select<string>({
    message: 'Select tenant to rotate:',
    options: [...tenantApps.entries()].map(([tenant, apps]) => ({
      value: tenant,
      label: tenant,
      hint: `${apps.join(', ')}`
    }))
  });

  if (isCancel(tenantId)) {
    cancel('Operation cancelled');
    process.exit(0);
  }

  const apps = tenantApps.get(tenantId) ?? [];

  note(
    [
      `Payload tenant '${tenantId}' gets a new API key, then Infisical is`,
      `updated for: ${apps.map((app) => `/tenants/${tenantId}/apps/${app}`).join(', ')}`,
      '',
      `The running deployments keep using the old key until they are`,
      `redeployed, so ${tenantId} serves errors until that completes.`
    ].join('\n'),
    'What happens next'
  );

  const proceed = await confirm({
    message: `Rotate the API key for '${tenantId}' in ${environment}?`,
    initialValue: false
  });

  if (isCancel(proceed) || !proceed) {
    cancel('Operation cancelled');
    process.exit(0);
  }

  s.start(`Fetching DATABASE_URL for ${environment}...`);

  let databaseUrl: string;
  try {
    databaseUrl = toPoolerUrl(
      await fetchDatabaseUrl(environment),
      SUPABASE_REGION
    );
    s.stop('Database URL fetched');
  } catch (error) {
    s.stop('Failed to fetch database URL');
    cancel(`Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }

  s.start(`Rotating key in Payload for '${tenantId}'...`);

  let apiKey: string;
  try {
    apiKey = await rotateInPayload(tenantId, databaseUrl);
    s.stop('Payload tenant updated');
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
        value: apiKey
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
        `  ${apiKey}`
      ].join('\n'),
      '⚠️  Infisical is out of sync'
    );
    process.exit(1);
  }

  note(
    [
      `Redeploy ${tenantId} so the deployments pick up the new key:`,
      '',
      `  Actions → Fly Deployment → Run workflow`,
      `  App: <empty>  Tenant: ${tenantId}  Environment: ${environment}`,
      '',
      `Until then ${tenantId} authenticates with the retired key.`
    ].join('\n'),
    'Redeploy required'
  );

  outro(`✅  Rotated API key for '${tenantId}' in ${environment}`);
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
