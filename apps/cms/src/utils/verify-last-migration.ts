import { cancel, confirm, intro, note } from '@clack/prompts';
import { getMigrations, getPayload } from 'payload';

import { loadEnv } from '@codeware/app-cms/feature/env-loader';
import { seed } from '@codeware/app-cms/feature/seed';

import config from '../payload.config';

/**
 * This script is used to verify the last migration.
 *
 * - Runs a fresh migration on a clean database.
 * - Seeds the database.
 * - Bumps the batch number of the last migration to be unique.
 * - Rolls back the last migration.
 * - Re-applies the last migration.
 *
 * This ensures that the last migration can be applied and rolled back without issues.
 */
async function verifyLastMigration() {
  intro('Verify the last migration');
  const answer = await confirm({
    message: 'This will reset your local development database. Continue?',
    active: 'Yes',
    inactive: 'No',
    initialValue: false
  });
  if (answer !== true) {
    cancel('Exit verify last migration.');
    process.exit(0);
  }

  const env = await loadEnv();

  if (!env) {
    console.warn('Environment variables could not be loaded, abort');
    process.exit(0);
  }

  if (env.DEPLOY_ENV !== 'development') {
    console.error(
      'Error: Verify last migration is for development environment only!'
    );
    process.exit(0);
  }

  const start = Date.now();

  const payload = await getPayload({ config });

  // Run a fresh migration to apply all migrations on a clean database
  console.log('🔄 Run fresh migration...');
  await payload.db.migrateFresh({ forceAcceptWarning: true });

  note('Applied fresh migrations');

  // Seed the database
  console.log('🔄 Run seed database...');
  await seed({
    environment: 'development',
    payload,
    remoteDataUrl: env.SEED_DATA_URL,
    source: 'local',
    strategy: 'once'
  });

  note('Seeded database');

  // Possible improvement here:
  // Patch database with changes that could be affected by rollback

  // The last migration must have a different batch number than the one before it,
  // so get the last migration and update its batch number to be higher than the previous one.
  console.log('🔄 Bump last migration batch number to be unique...');
  const { existingMigrations, latestBatch } = await getMigrations({
    payload
  });
  console.log(`☑️ Found ${existingMigrations.length} existing migrations`);
  const lastMigration = existingMigrations
    .sort((a, b) => Number(a.id) - Number(b.id))
    .at(-1);
  if (!lastMigration?.id) {
    console.error('❌ No migrations found after fresh migrate!');
    process.exit(1);
  }
  await payload.update({
    collection: 'payload-migrations',
    id: lastMigration.id,
    data: { batch: latestBatch + 1 }
  });

  note(`Bumped batch number on ${lastMigration.name}\n`);

  // Now rollback the last migration
  console.log('🔄 Run down migration...');
  await payload.db.migrateDown();

  note('Rolled back last migration');

  // Migrate again to apply the last migration
  console.log('🔄 Run migration to apply the last migration again...');
  await payload.db.migrate();

  note('Re-applied last migration');

  const end = Date.now();
  note(`Duration ${end - start} ms`, 'Last migration verified successfully');
  process.exit(0);
}

verifyLastMigration().catch((err) => {
  console.error('❌ Verify last migration failed');
  console.error(err);
  process.exit(1);
});
