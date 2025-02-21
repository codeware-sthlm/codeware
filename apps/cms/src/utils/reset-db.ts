import { sql } from '@payloadcms/db-postgres';
import { getPayload } from 'payload';

import { loadEnv } from '@codeware/app-cms/feature/env-loader';

import config from '../payload.config';

/**
 * This script is used to reset the database for development purposes.
 * It will drop all tables and enums.
 */
async function reset() {
  const env = await loadEnv();

  if (!env) {
    console.warn('Environment variables could not be loaded, abort');
    process.exit(0);
  }

  if (env.DEPLOY_ENV !== 'development') {
    console.error(
      'Error: Resetting database is for development environment only!'
    );
    process.exit(0);
  }

  const payload = await getPayload({ config });

  console.log('⏳ Resetting database...');
  const start = Date.now();

  const query = sql`
		-- Delete all tables
		DO $$ DECLARE
		    r RECORD;
		BEGIN
		    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = current_schema()) LOOP
		        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
		    END LOOP;
		END $$;

		-- Delete enums
		DO $$ DECLARE
			r RECORD;
		BEGIN
			FOR r IN (select t.typname as enum_name
			from pg_type t
				join pg_enum e on t.oid = e.enumtypid
				join pg_catalog.pg_namespace n ON n.oid = t.typnamespace
			where n.nspname = current_schema()) LOOP
				EXECUTE 'DROP TYPE IF EXISTS ' || quote_ident(r.enum_name);
			END LOOP;
		END $$;

		`;

  await payload.db.drizzle.execute(query);

  const end = Date.now();
  console.log(`✅ Reset took ${end - start}ms`);
  process.exit(0);
}

reset().catch((err) => {
  console.error('❌ Reset failed');
  console.error(err);
  process.exit(1);
});
