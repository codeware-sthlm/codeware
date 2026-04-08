import { exec } from 'child_process';
import { readdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

import {
  cancel,
  confirm,
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
type RestoreEnv = Environment;

type RestoreMode = 'schema' | 'data' | 'full';

/**
 * Fetch the DATABASE_URL for the CMS from Infisical
 */
async function fetchDatabaseUrl(environment: RestoreEnv): Promise<string> {
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
 * List available backup directories sorted newest first
 */
function listBackups(backupsRoot: string): string[] {
  try {
    return readdirSync(backupsRoot, { withFileTypes: true })
      .filter((d) => d.isDirectory() && d.name.startsWith('cms-'))
      .map((d) => d.name)
      .sort()
      .reverse();
  } catch {
    return [];
  }
}

/**
 * Run psql to execute a SQL file against the target database
 */
async function psqlFile(dbUrl: string, sqlFile: string): Promise<void> {
  const { stderr } = await execAsync(
    `psql "${dbUrl}" --file="${sqlFile}" --no-password`
  );

  if (stderr && stderr.toLowerCase().includes('error')) {
    throw new Error(stderr.trim());
  }
}

/**
 * Parse environment from backup folder name: cms-{env}-{timestamp}
 */
function envFromBackupName(name: string): string {
  const parts = name.split('-');
  // cms-preview-... or cms-production-...
  return parts[1] ?? 'unknown';
}

/**
 * Main interactive restore script
 */
async function main() {
  console.clear();
  intro('♻️   CMS Database Restore');

  const backupsRoot = path.resolve(__dirname, '../../../backups');
  const backups = listBackups(backupsRoot);

  if (backups.length === 0) {
    cancel(
      'No backups found. Run `nx run db-tools:backup-db` to create one first.'
    );
    process.exit(1);
  }

  // Select backup
  const selectedBackup = await select({
    message: 'Select backup to restore:',
    options: backups.map((name) => ({
      value: name,
      label: name,
      hint: `source env: ${envFromBackupName(name)}`
    }))
  });

  if (isCancel(selectedBackup)) {
    cancel('Operation cancelled');
    process.exit(0);
  }

  const backupName = selectedBackup as string;
  const backupDir = path.join(backupsRoot, backupName);

  // Select what to restore
  const mode = await select<RestoreMode>({
    message: 'What do you want to restore?',
    options: [
      {
        value: 'full' as const,
        label: 'Full restore',
        hint: 'schema then data'
      },
      {
        value: 'data' as const,
        label: 'Data only',
        hint: 'leaves schema untouched'
      },
      {
        value: 'schema' as const,
        label: 'Schema only',
        hint: 'structure without data'
      }
    ]
  });

  if (isCancel(mode)) {
    cancel('Operation cancelled');
    process.exit(0);
  }

  // Select target environment
  const environment = await select<RestoreEnv>({
    message: 'Select target environment:',
    options: Environments.map((env) => ({
      value: env,
      label: env,
      hint: env === 'production' ? '⚠️  Live production database' : undefined
    }))
  });

  if (isCancel(environment)) {
    cancel('Operation cancelled');
    process.exit(0);
  }

  const env = environment as RestoreEnv;

  // Extra confirmation for production
  if (env === 'production') {
    const confirmed = await confirm({
      message: `⚠️  You are about to restore to PRODUCTION. This will overwrite live data. Are you sure?`,
      active: 'Yes, restore to production',
      inactive: 'No, cancel',
      initialValue: false
    });

    if (isCancel(confirmed) || !confirmed) {
      cancel('Restore cancelled');
      process.exit(0);
    }
  }

  const s = spinner();

  // Fetch connection string from Infisical
  s.start(`Fetching DATABASE_URL for ${env} from Infisical...`);

  let dbUrl: string;
  try {
    dbUrl = await fetchDatabaseUrl(env);
    s.stop('Database URL fetched');
  } catch (error) {
    s.stop('Failed to fetch database URL');
    cancel(`Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }

  const schemaFile = path.join(backupDir, 'schema.sql');
  const dataFile = path.join(backupDir, 'data.sql');

  // Restore schema
  if (mode === 'schema' || mode === 'full') {
    s.start(`Restoring schema to ${env}...`);
    try {
      await psqlFile(dbUrl, schemaFile);
      s.stop('Schema restored');
    } catch (error) {
      s.stop('Schema restore failed');
      cancel(
        `Error: ${error instanceof Error ? error.message : String(error)}`
      );
      process.exit(1);
    }
  }

  // Restore data
  if (mode === 'data' || mode === 'full') {
    s.start(`Restoring data to ${env}...`);
    try {
      await psqlFile(dbUrl, dataFile);
      s.stop('Data restored');
    } catch (error) {
      s.stop('Data restore failed');
      cancel(
        `Error: ${error instanceof Error ? error.message : String(error)}`
      );
      process.exit(1);
    }
  }

  outro(`✅  Restore complete: ${backupName} → ${env}`);
}

// Export for use as a library
export { main as restoreCmsDatabase };

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
}
