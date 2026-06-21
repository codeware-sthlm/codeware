import { postgresAdapter } from '@payloadcms/db-postgres';
import { buildConfig } from 'payload';

// Minimal Payload config for the migration script (apps/cms/migrate.ts).
// Intentionally excludes sharp, Sentry, collections, and plugins so esbuild can bundle
// payload and the DB adapter directly into migrate.mjs without pulling in Next.js dependencies.

// Default to 'payload' — all migrations hardcode this schema via SET search_path.
// DATABASE_SCHEMA may be absent on fresh preview apps; the default is safe.
const schemaName = process.env['DATABASE_SCHEMA'] || 'payload';

export default buildConfig({
  db: postgresAdapter({
    pool: {
      connectionString: process.env['DATABASE_URL'],
      // pg passes `options` verbatim in the startup message, setting search_path for every
      // connection in the pool. Without this, Drizzle's unqualified INSERT INTO
      // "payload_migrations" resolves to public.payload_migrations which doesn't exist on
      // fresh databases — only payload.payload_migrations exists after the first migration.
      options: schemaName ? `-c search_path=${schemaName},public` : undefined
    },
    schemaName
  }),
  // Payload requires a non-empty secret to init, even for migrations that don't use JWT auth.
  // The real secret is a runtime variable from Infisical; fall back to a placeholder when absent.
  secret: process.env['PAYLOAD_SECRET_KEY'] || 'migrate-placeholder',
  collections: []
});
