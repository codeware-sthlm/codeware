import { exec } from 'child_process';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'fs';
import os from 'os';
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
import * as dotenv from 'dotenv';

import { backupCmsDatabase } from './backup-db.js';
import type { QueryFn, VerifyModule } from './verify-types.js';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../infisical/.env.infisical') });

const CONTAINER_NAME = 'postgres-cms-migration-test';
const CONTAINER_PORT = 5435;
const POSTGRES_DB = 'cms';
const POSTGRES_USER = 'postgres';
const POSTGRES_PASSWORD = 'postgres';
const TEST_DATABASE_URL = `postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:${CONTAINER_PORT}/${POSTGRES_DB}`;

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

function envFromBackupName(name: string): string {
  return name.split('-')[1] ?? 'unknown';
}

async function isContainerRunning(): Promise<boolean> {
  try {
    const { stdout } = await execAsync(
      `docker ps -q -f name=^/${CONTAINER_NAME}$`
    );
    return stdout.trim().length > 0;
  } catch {
    return false;
  }
}

async function stopContainer(): Promise<void> {
  try {
    await execAsync(`docker stop ${CONTAINER_NAME}`);
  } catch {
    // ignore — container may not exist
  }
}

async function startContainer(): Promise<void> {
  await execAsync(
    `docker run --name ${CONTAINER_NAME} --rm -d ` +
      `-e POSTGRES_DB=${POSTGRES_DB} ` +
      `-e POSTGRES_USER=${POSTGRES_USER} ` +
      `-e POSTGRES_PASSWORD=${POSTGRES_PASSWORD} ` +
      `-p ${CONTAINER_PORT}:5432 ` +
      `postgres:17`
  );

  // Poll until postgres accepts connections
  for (let i = 0; i < 30; i++) {
    try {
      await execAsync(`docker exec ${CONTAINER_NAME} pg_isready -q`);
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  throw new Error('Postgres container did not become ready after 30 seconds');
}

/**
 * Supabase extensions that are unavailable (and crash the backend) on a plain
 * Docker postgres image. SQL blocks that create or depend on these are stripped
 * before restoring to the test container.
 */
/**
 * Extract only the `payload` schema blocks from a Supabase pg_dump SQL file.
 *
 * pg_dump precedes every object with a comment block of the form:
 *   -- Name: <name>; Type: <type>; Schema: <schema>; Owner: -
 *
 * We walk the file line-by-line, tracking which schema the current object
 * belongs to, and only emit lines whose owning object lives in the `payload`
 * schema (or the preamble before the first object header).
 *
 * This is more reliable than exclusion-based filtering because it doesn't
 * depend on maintaining a list of Supabase-specific names, and it can never
 * produce broken SQL from a partially-stripped DO block.
 *
 * Writes the result to a temp file and returns the path.
 */
function extractPayloadSchema(sqlFile: string): string {
  const lines = readFileSync(sqlFile, 'utf8').split('\n');
  // pg_dump emits two header formats:
  //   DDL:  -- Name: <name>; Type: <type>; Schema: <schema>; Owner: -
  //   Data: -- Data for Name: <name>; Type: TABLE DATA; Schema: <schema>; Owner: -
  const headerRe =
    /^-- (?:Data for )?Name:\s*(.+?);\s*Type:\s*(.+?);\s*Schema:\s*(.+?)\s*;/;

  const kept: string[] = [];
  // Before the first object header we only keep safe boilerplate: comments,
  // SET statements, and SELECT pg_catalog.set_config calls. Everything else
  // in the Supabase preamble (ALTER EXTENSION pgsodium, etc.) is excluded.
  let seenFirstHeader = false;
  let inPayload = false;

  for (const line of lines) {
    const match = headerRe.exec(line);
    if (match) {
      seenFirstHeader = true;
      const [, name, type, schema] = match;
      // Keep the payload schema creation block itself (Schema: -)
      // and all objects that live in the payload schema.
      const s = schema.trim();
      const t = type.trim();
      const n = name.trim();
      // Keep:
      //  - the payload schema CREATE SCHEMA block (Schema: -, Type: SCHEMA, Name: payload)
      //  - all objects in the payload schema
      //  - TYPE/ENUM objects in the public schema (payload tables may reference them)
      inPayload =
        s === 'payload' ||
        (s === '-' && t === 'SCHEMA' && n === 'payload') ||
        (s === 'public' && (t === 'TYPE' || t === 'ENUM'));
    }

    if (inPayload) {
      kept.push(line);
    } else if (!seenFirstHeader) {
      // Safe preamble lines only
      const safe =
        line.startsWith('--') ||
        line.startsWith('SET ') ||
        line.startsWith('SELECT pg_catalog.set_config') ||
        line.trim() === '';
      if (safe) kept.push(line);
    }
  }

  const tmpFile = path.join(os.tmpdir(), `cms-payload-only-${Date.now()}.sql`);
  writeFileSync(tmpFile, kept.join('\n'), 'utf8');
  return tmpFile;
}

/**
 * Run a SQL file against the target database.
 *
 * Schema files from Supabase are pre-filtered to strip unavailable extensions
 * before being piped to the test container. After each restore the relevant
 * schema is verified to catch genuine failures.
 */
async function psqlFile(
  dbUrl: string,
  sqlFile: string,
  mode: 'schema' | 'data'
): Promise<void> {
  if (mode === 'schema') {
    const filteredFile = extractPayloadSchema(sqlFile);
    try {
      await execAsync(
        `psql "${dbUrl}" --file="${filteredFile}" --no-password --set ON_ERROR_STOP=on`
      );
    } finally {
      // Clean up temp file regardless of success/failure
      try {
        execAsync(`rm -f "${filteredFile}"`);
      } catch {
        /* ignore */
      }
    }
    // Verify the payload schema loaded
    const { stdout } = await execAsync(
      `psql "${dbUrl}" -t -A -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'payload'"`
    );
    if (stdout.trim() !== 'payload') {
      throw new Error(
        'Schema restore appeared to succeed but the payload schema is missing'
      );
    }
  } else {
    // Data file: strip rows for Supabase-internal tables (pgsodium.key, etc.)
    const filteredFile = extractPayloadSchema(sqlFile);
    try {
      await execAsync(
        `psql "${dbUrl}" --file="${filteredFile}" --no-password --set ON_ERROR_STOP=on`
      );
    } finally {
      try {
        execAsync(`rm -f "${filteredFile}"`);
      } catch {
        /* ignore */
      }
    }
    // Verify payload data landed — migrations table must have rows
    const { stdout } = await execAsync(
      `psql "${dbUrl}" -t -A -c "SELECT COUNT(*) FROM payload.payload_migrations"`
    );
    const count = parseInt(stdout.trim(), 10);
    if (isNaN(count) || count === 0) {
      throw new Error(
        'Data restore appeared to succeed but payload.payload_migrations is empty'
      );
    }
  }
}

async function runMigrations(
  repoRoot: string
): Promise<{ stdout: string; stderr: string }> {
  return execAsync(
    `pnpm tsx --env-file apps/cms/.env.local apps/cms/src/utils/run-migrations.ts`,
    {
      cwd: repoRoot,
      env: {
        ...process.env,
        // Override connection to point at the test container
        DATABASE_URL: TEST_DATABASE_URL,
        DATABASE_SCHEMA: 'payload',
        // Required by env-schema validation but irrelevant in test context
        APP_NAME: 'cms-migration-test',
        DEPLOY_ENV: 'development',
        FLY_URL: 'http://localhost',
        PR_NUMBER: '0',
        NODE_ENV: 'development',
        DISABLE_DB_PUSH: 'true',
        SEED_SOURCE: 'off'
      },
      timeout: 120_000
    }
  );
}

async function queryScalar(sql: string): Promise<string | null> {
  try {
    const { stdout } = await execAsync(
      `psql "${TEST_DATABASE_URL}" -t -A -c "${sql}"`
    );
    return stdout.trim() || null;
  } catch {
    return null;
  }
}

/**
 * Run a companion verify hook for the given migration name if one exists.
 * Dynamically imports the verify module and calls its `verify` function,
 * injecting a `query` helper pre-wired to the test container.
 */
async function runVerifyHook(
  repoRoot: string,
  migrationName: string
): Promise<boolean> {
  const verifyFile = path.join(
    repoRoot,
    'apps/cms/src/migrations/verify',
    `${migrationName}.ts`
  );

  if (!existsSync(verifyFile)) {
    return false;
  }

  console.log(`\n🔍 Running verify hook: verify/${migrationName}.ts`);

  const mod = (await import(verifyFile)) as VerifyModule;

  const query: QueryFn = async (sql) => {
    const { stdout } = await execAsync(
      `psql "${TEST_DATABASE_URL}" -t -A -c "${sql}"`
    );
    return stdout
      .trim()
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
  };

  const checksPassed = await mod.verify(query);
  console.log(`☑️  ${checksPassed} check(s) passed`);

  return true;
}

/**
 * Test the latest pending migration against a production database backup.
 *
 * Steps:
 *  1. Optionally create a fresh production backup
 *  2. Start an isolated Docker Postgres container
 *  3. Restore the backup into the container
 *  4. Run pending migrations via `nx payload cms migrate`
 *  5. Verify the last migration was recorded and enum types are in the right schema
 *  6. Clean up the container
 */
async function main() {
  console.clear();
  intro('🧪  Test Migration Against Production Backup');

  const backupsRoot = path.resolve(__dirname, '../../../backups');
  const repoRoot = path.resolve(__dirname, '../../../');

  // Ask whether to create a fresh production backup first
  const createFresh = await confirm({
    message: 'Create a fresh production backup before testing?',
    active: 'Yes, backup production now',
    inactive: 'No, use an existing backup',
    initialValue: true
  });

  if (isCancel(createFresh)) {
    cancel('Operation cancelled');
    process.exit(0);
  }

  let backupName: string;

  if (createFresh) {
    // Run the interactive backup tool — user selects production in its own flow
    await backupCmsDatabase();

    const backupsAfter = listBackups(backupsRoot);
    if (backupsAfter.length === 0) {
      cancel('No backup found after backup operation');
      process.exit(1);
    }
    backupName = backupsAfter[0];
    console.log(`\nUsing backup: ${backupName}`);
  } else {
    const backups = listBackups(backupsRoot);
    if (backups.length === 0) {
      cancel('No backups found. Run backup-db first to create one.');
      process.exit(1);
    }

    const selected = await select({
      message: 'Select backup to test against:',
      options: backups.map((name) => ({
        value: name,
        label: name,
        hint: `env: ${envFromBackupName(name)}`
      }))
    });

    if (isCancel(selected)) {
      cancel('Operation cancelled');
      process.exit(0);
    }

    backupName = selected as string;
  }

  const backupDir = path.join(backupsRoot, backupName);
  const schemaFile = path.join(backupDir, 'schema.sql');
  const dataFile = path.join(backupDir, 'data.sql');

  if (!existsSync(schemaFile) || !existsSync(dataFile)) {
    cancel(
      `Backup is incomplete — missing schema.sql or data.sql in ${backupName}`
    );
    process.exit(1);
  }

  const s = spinner();

  // Clean up any leftover container from a previous run
  if (await isContainerRunning()) {
    s.start('Stopping existing test container...');
    await stopContainer();
    s.stop('Container stopped');
  }

  // Start fresh isolated Postgres container
  s.start(`Starting Postgres container on port ${CONTAINER_PORT}...`);
  try {
    await startContainer();
    s.stop(`Postgres ready  (port ${CONTAINER_PORT}, db: ${POSTGRES_DB})`);
  } catch (error) {
    s.stop('Failed to start container');
    cancel(`Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }

  let keepContainerRunning = false;

  try {
    // Restore schema
    s.start('Restoring schema from backup...');
    try {
      await psqlFile(TEST_DATABASE_URL, schemaFile, 'schema');
      s.stop('Schema restored');
    } catch (error) {
      s.stop('Schema restore failed');
      throw error;
    }

    // Restore data
    s.start('Restoring data from backup...');
    try {
      await psqlFile(TEST_DATABASE_URL, dataFile, 'data');
      s.stop('Data restored');
    } catch (error) {
      s.stop('Data restore failed');
      throw error;
    }

    // Snapshot migrations already recorded before we run
    const preMigration = await queryScalar(
      'SELECT name FROM payload.payload_migrations ORDER BY id DESC LIMIT 1'
    );
    console.log(`\n   Last migration in backup: ${preMigration ?? '(none)'}`);

    // Run pending migrations
    s.start('Running pending migrations...');
    let migrationOutput = '';
    try {
      const result = await runMigrations(repoRoot);
      migrationOutput = [result.stdout, result.stderr]
        .filter(Boolean)
        .join('\n');
      s.stop('Migrations complete');
    } catch (error) {
      s.stop('Migration failed');
      const output = error as NodeJS.ErrnoException & {
        stdout?: string;
        stderr?: string;
      };
      if (output.stdout) process.stdout.write(output.stdout);
      if (output.stderr) process.stderr.write(output.stderr);
      throw error;
    }

    if (migrationOutput) {
      console.log(migrationOutput);
    }

    // Generic health check: verify last migration was recorded
    const lastMigration = await queryScalar(
      'SELECT name FROM payload.payload_migrations ORDER BY id DESC LIMIT 1'
    );
    console.log(`\n☑️  Last recorded migration: ${lastMigration ?? '(none)'}`);

    if (lastMigration === preMigration) {
      console.log('   ⚠️  No new migrations were applied');
    }

    // Migration-specific verify hook (optional companion file)
    if (lastMigration) {
      const hookRan = await runVerifyHook(repoRoot, lastMigration);
      if (!hookRan) {
        console.log(
          '   No verify hook found — skipping migration-specific checks'
        );
      }
    }

    outro(`✅  Migration test passed\n   Backup: ${backupName}`);

    // Offer to keep the container running for local development
    const keepRunning = await confirm({
      message: 'Keep the container running for local development?',
      active: 'Yes, keep it running',
      inactive: 'No, tear it down',
      initialValue: false
    });

    if (!isCancel(keepRunning) && keepRunning) {
      keepContainerRunning = true;
      console.log(`\n   Container is running on port ${CONTAINER_PORT}`);
      console.log(`   DATABASE_URL=${TEST_DATABASE_URL}`);
      console.log(
        `\n   Set this in apps/cms/.env.local to connect the CMS to this database.`
      );
      console.log(
        `   Run \`docker stop ${CONTAINER_NAME}\` when you're done.\n`
      );
    }
  } catch (error) {
    cancel(
      `Migration test failed: ${error instanceof Error ? error.message : String(error)}`
    );
    process.exit(1);
  } finally {
    if (!keepContainerRunning) {
      s.start('Cleaning up test container...');
      await stopContainer();
      s.stop('Container removed');
    }
  }
}

// Export for use as a library
export { main as testMigration };

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
}
