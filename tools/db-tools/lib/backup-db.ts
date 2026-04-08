import { exec } from 'child_process';
import { mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

import {
  cancel,
  intro,
  isCancel,
  outro,
  select,
  spinner
} from '@clack/prompts';
import {
  type Environment,
  EnvironmentSchema,
  withInfisical
} from '@codeware/shared/feature/infisical';
import * as dotenv from 'dotenv';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../infisical/.env.infisical') });

const Environments = EnvironmentSchema.options;
type BackupEnv = Environment;

// Supabase project region — used to construct the Session Mode pooler hostname
const SUPABASE_REGION = 'eu-central-1';

/**
 * Fetch the DATABASE_URL for the CMS from Infisical
 */
async function fetchDatabaseUrl(environment: BackupEnv): Promise<string> {
  const secrets = await withInfisical({
    environment,
    filter: { path: '/apps/cms' }
  });

  if (!secrets) {
    throw new Error(
      `Could not connect to Infisical for environment: ${environment}`
    );
  }

  const dbUrlSecret = secrets.find((s) => s.secretKey === 'DATABASE_URL');

  if (!dbUrlSecret?.secretValue) {
    throw new Error(
      `DATABASE_URL not found in Infisical /apps/cms for environment: ${environment}`
    );
  }

  return dbUrlSecret.secretValue;
}

/**
 * Convert a Supabase direct connection URL to a Session Mode pooler URL.
 *
 * Direct:  postgresql://postgres:[pass]@db.[ref].supabase.co:5432/postgres
 * Pooler:  postgresql://postgres.[ref]:[pass]@aws-0-[region].pooler.supabase.com:5432/postgres
 *
 * The pooler is reachable from more networks and is compatible with pg_dump
 * (unlike Transaction Mode which does not support prepared statements).
 *
 * If the URL is already a pooler URL, it is returned unchanged.
 */
function toPoolerUrl(dbUrl: string, region: string): string {
  const url = new URL(dbUrl);
  const directHostMatch = url.hostname.match(/^db\.([a-z0-9]+)\.supabase\.co$/);

  if (!directHostMatch) {
    // Already a pooler URL or an unrecognised format — use as-is
    return dbUrl;
  }

  const projectRef = directHostMatch[1];
  url.hostname = `aws-0-${region}.pooler.supabase.com`;
  url.username = `postgres.${projectRef}`;
  return url.toString();
}

/**
 * Check that pg_dump is available on PATH
 */
async function checkPgDump(): Promise<void> {
  try {
    await execAsync('pg_dump --version');
  } catch {
    throw new Error(
      'pg_dump is not available. Install PostgreSQL client tools and ensure pg_dump is on your PATH.'
    );
  }
}

/**
 * Run pg_dump for schema or data into a plain SQL file
 */
async function dump(
  dbUrl: string,
  outputPath: string,
  dataOnly: boolean
): Promise<void> {
  const flag = dataOnly ? '--data-only' : '--schema-only';
  const { stderr } = await execAsync(
    `pg_dump ${flag} --no-acl --no-owner --file="${outputPath}" "${dbUrl}"`
  );

  if (stderr && stderr.toLowerCase().includes('error')) {
    throw new Error(stderr.trim());
  }
}

/**
 * Main interactive backup script
 */
async function main() {
  console.clear();
  intro('💾  CMS Database Backup');

  // Select environment
  const environment = await select<BackupEnv>({
    message: 'Select environment to backup:',
    options: Environments.map((env) => ({ value: env, label: env }))
  });

  if (isCancel(environment)) {
    cancel('Operation cancelled');
    process.exit(0);
  }

  const env = environment as BackupEnv;
  const s = spinner();

  // Verify pg_dump is installed
  s.start('Checking for pg_dump...');
  try {
    await checkPgDump();
    s.stop('pg_dump found');
  } catch (error) {
    s.stop('pg_dump not found');
    cancel(`Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }

  // Fetch connection string from Infisical
  s.start(`Fetching DATABASE_URL for ${env} from Infisical...`);

  let dbUrl: string;
  try {
    dbUrl = toPoolerUrl(await fetchDatabaseUrl(env), SUPABASE_REGION);
    s.stop('Database URL fetched');
  } catch (error) {
    s.stop('Failed to fetch database URL');
    cancel(`Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }

  // Create timestamped backup directory: backups/cms-{env}-{timestamp}/
  const timestamp = new Date()
    .toISOString()
    .replace(/T/, '_')
    .replace(/:/g, '-')
    .slice(0, 19); // e.g. 2026-04-04_12-30-00

  const backupDir = path.resolve(
    __dirname,
    '../../../backups',
    `cms-${env}-${timestamp}`
  );
  mkdirSync(backupDir, { recursive: true });

  const schemaFile = path.join(backupDir, 'schema.sql');
  const dataFile = path.join(backupDir, 'data.sql');

  // Dump schema
  s.start(`Dumping schema from ${env}...`);
  try {
    await dump(dbUrl, schemaFile, false);
    s.stop('Schema dumped');
  } catch (error) {
    s.stop('Schema dump failed');
    cancel(`Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }

  // Dump data
  s.start(`Dumping data from ${env}...`);
  try {
    await dump(dbUrl, dataFile, true);
    s.stop('Data dumped');
  } catch (error) {
    s.stop('Data dump failed');
    cancel(`Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }

  outro(
    `✅  Backup saved to: backups/cms-${env}-${timestamp}/\n   schema.sql + data.sql`
  );
}

// Export for use as a library
export { main as backupCmsDatabase };

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
}
