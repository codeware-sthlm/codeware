import { randomUUID } from 'crypto';

import { loadEnv } from '@codeware/app-cms/feature/env-loader';
import { getPayload } from 'payload';

/**
 * Rotate a tenant's Payload API key using the local-api.
 *
 * The `apiKey` field is write-protected for REST, GraphQL and the admin UI
 * (`update: () => false`), which the local-api bypasses with `overrideAccess`.
 * That is why rotation runs as a script rather than from the admin panel.
 *
 * Driven by env vars so the caller controls which database is targeted:
 * - `ROTATE_TENANT_SLUG` - tenant to rotate (required)
 * - `ROTATE_DATABASE_URL` - target database, overriding whatever Infisical
 *   resolves (required - the caller reaches the database differently than a
 *   deployment does, through a pooler or a Fly proxy)
 *
 * The new key is written to stdout as `ROTATED_API_KEY=<key>` for the caller to
 * mirror into Infisical. Nothing else prints it.
 */
async function rotate() {
  const slug = process.env['ROTATE_TENANT_SLUG'];
  const databaseUrl = process.env['ROTATE_DATABASE_URL'];

  if (!slug || !databaseUrl) {
    console.error(
      'Error: ROTATE_TENANT_SLUG and ROTATE_DATABASE_URL are required'
    );
    process.exit(1);
  }

  // Set before loading: preview databases are created by `fly postgres attach`
  // and never reach Infisical, so the env would not validate without this.
  process.env['DATABASE_URL'] = databaseUrl;

  const env = await loadEnv();

  if (!env) {
    console.error('Environment variables could not be loaded, abort');
    process.exit(1);
  }

  // `loadEnv` injects the Infisical values over `process.env`, so anything the
  // caller set has just been overwritten. Re-apply what this script depends on
  // before the config reads it:
  // - the deployment's own DATABASE_URL host is not reachable from here
  // - a rotation must never seed or push schema to the target database
  process.env['DATABASE_URL'] = databaseUrl;
  process.env['SEED_SOURCE'] = 'off';
  process.env['DISABLE_DB_PUSH'] = 'true';

  console.log(`[DB] Using schema '${env.DATABASE_SCHEMA}'`);

  // Imported after `loadEnv` - the config reads `getEnv()` at module scope and
  // throws when the environment has not been hydrated yet. Unlike the other
  // scripts here this one runs outside Nx, so nothing pre-loads `.env.local`.
  const { default: config } = await import('../payload.config');

  const payload = await getPayload({ config });

  const { docs } = await payload.find({
    collection: 'tenants',
    where: { slug: { equals: slug } },
    overrideAccess: true,
    depth: 0,
    limit: 1
  });

  const tenant = docs[0];

  if (!tenant) {
    console.error(`Error: No tenant found with slug '${slug}'`);
    process.exit(1);
  }

  const apiKey = randomUUID();

  await payload.update({
    collection: 'tenants',
    id: tenant.id,
    data: { apiKey, enableAPIKey: true },
    overrideAccess: true
  });

  console.log(`[ROTATE] Tenant '${slug}' (id: ${tenant.id}) updated`);
  console.log(`ROTATED_API_KEY=${apiKey}`);

  process.exit(0);
}

rotate();
