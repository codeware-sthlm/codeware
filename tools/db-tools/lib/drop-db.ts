import { exec } from 'child_process';
import { promisify } from 'util';

import {
  cancel,
  confirm,
  intro,
  isCancel,
  multiselect,
  outro,
  password,
  spinner
} from '@clack/prompts';

const execAsync = promisify(exec);

const CLUSTER_NAME = 'pg-preview';

interface Database {
  name: string;
  owner: string;
  encoding: string;
  size: string;
}

/**
 * Execute a command via Fly SSH console
 */
async function flyExec(appName: string, command: string): Promise<string> {
  try {
    // Escape the command properly for shell execution using single-quote pattern
    // This avoids issues with backslash escaping and ensures all shell meta-characters
    // (including backslashes, double quotes, etc.) are treated as literal characters
    const safeCommand = "'" + command.replace(/'/g, "'\\''") + "'";
    const { stdout, stderr } = await execAsync(
      `fly -a ${appName} ssh console --command ${safeCommand}`
    );
    if (stderr && !stderr.includes('Connecting to')) {
      throw new Error(stderr);
    }
    return stdout;
  } catch (error) {
    throw new Error(
      `Failed to execute command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * List all databases in the PostgreSQL cluster
 */
async function listDatabases(clusterPassword: string): Promise<Database[]> {
  const connectionString = `postgres://postgres:${clusterPassword}@localhost:5432/postgres`;

  // Query to list all databases with their details
  const query = `SELECT datname as name, pg_catalog.pg_get_userbyid(datdba) as owner, pg_encoding_to_char(encoding) as encoding, pg_size_pretty(pg_database_size(datname)) as size FROM pg_database WHERE datistemplate = false ORDER BY datname;`;

  const psqlCommand = `psql ${connectionString} -t -A -F, -c "${query}"`;

  const output = await flyExec(CLUSTER_NAME, psqlCommand);

  // Parse the CSV output
  const databases: Database[] = output
    .trim()
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => {
      const [name, owner, encoding, size] = line.split(',');
      return { name, owner, encoding, size };
    })
    .filter((db) => !['postgres', 'template0', 'template1'].includes(db.name));

  return databases;
}

/**
 * Drop a database
 */
async function dropDatabase(
  dbName: string,
  clusterPassword: string
): Promise<void> {
  const connectionString = `postgres://postgres:${clusterPassword}@localhost:5432/postgres`;

  const dropCommand = `psql ${connectionString} -c "DROP DATABASE IF EXISTS \\"${dbName}\\" WITH (FORCE);"`;

  await flyExec(CLUSTER_NAME, dropCommand);
}

/**
 * Main interactive script
 */
async function main() {
  console.clear();

  intro('🗑️  Interactive Database Dropper');

  // Get cluster password
  const clusterPassword = await password({
    message: `Enter the password for ${CLUSTER_NAME} cluster:`,
    mask: '•',
    validate: (value) => {
      if (!value) return 'Password is required';
      if (value.length < 8) return 'Password seems too short';
    }
  });

  if (isCancel(clusterPassword)) {
    cancel('Operation cancelled');
    process.exit(0);
  }

  // List databases
  const s = spinner();
  s.start('Fetching databases from cluster...');

  let databases: Database[];
  try {
    databases = await listDatabases(clusterPassword as string);
    s.stop('Databases fetched successfully');
  } catch (error) {
    s.stop('Failed to fetch databases');
    cancel(`Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }

  if (databases.length === 0) {
    outro('No user databases found in the cluster');
    process.exit(0);
  }

  // Select databases to drop
  const selectedDbs = await multiselect({
    message:
      'Select databases to drop (use space to select, enter to confirm):',
    options: databases.map((db) => ({
      value: db.name,
      label: `${db.name}`,
      hint: `${db.size} | Owner: ${db.owner}`
    })),
    required: true
  });

  if (isCancel(selectedDbs)) {
    cancel('Operation cancelled');
    process.exit(0);
  }

  const dbList = selectedDbs as string[];

  if (dbList.length === 0) {
    outro('No databases selected');
    process.exit(0);
  }

  // Confirm deletion
  const confirmDrop = await confirm({
    message: `Are you sure you want to drop ${dbList.length} database(s)? This action cannot be undone!`,
    active: 'Yes, drop them',
    inactive: 'No, cancel',
    initialValue: false
  });

  if (isCancel(confirmDrop) || !confirmDrop) {
    cancel('Database drop cancelled');
    process.exit(0);
  }

  // Drop the databases
  let successCount = 0;
  const failedDbs: string[] = [];

  for (const dbName of dbList) {
    const s = spinner();
    s.start(
      `Dropping "${dbName}" (${successCount + failedDbs.length + 1}/${dbList.length})...`
    );

    try {
      await dropDatabase(dbName, clusterPassword as string);
      successCount++;
      s.stop(
        `Dropped "${dbName}" (${successCount + failedDbs.length}/${dbList.length})`
      );
    } catch (error) {
      failedDbs.push(dbName);
      s.stop(
        `Failed to drop "${dbName}": ${error instanceof Error ? error.message : String(error)}`,
        1
      );
    }
  }

  if (failedDbs.length === 0) {
    outro(`✅ Successfully dropped ${successCount} database(s)!`);
    process.exit(0);
  } else {
    outro(
      `⚠️ Dropped ${successCount}/${dbList.length} databases.\nFailed: ${failedDbs.join(', ')}`
    );
    process.exit(1);
  }
}

// Export for use as a library
export { main as dropDatabase };

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
}
