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
 * The tenant is identified by its **current API key**, not by a slug. Infisical
 * tenant ids and Payload tenant slugs are separate namespaces - `/tenants/demo`
 * can hold the key of a tenant slugged `star-wars` - and the key is what a
 * deployment itself authenticates with (see `resolveScopedTenant`).
 *
 * Driven by env vars so the caller controls which database is targeted:
 * - `ROTATE_CURRENT_API_KEY` - the key currently in Infisical (required)
 * - `ROTATE_DATABASE_URL` - target database, overriding whatever Infisical
 *   resolves (required - the caller reaches the database differently than a
 *   deployment does, through a pooler or a Fly proxy)
 * - `ROTATE_DRY_RUN` - resolve and report the tenant without writing anything
 *
 * The resolved tenant and new key are written to stdout as `RESOLVED_TENANT=`
 * and `ROTATED_API_KEY=` for the caller. Nothing else prints the key.
 */
async function rotate() {
  const currentApiKey = process.env['ROTATE_CURRENT_API_KEY'];
  const databaseUrl = process.env['ROTATE_DATABASE_URL'];

  if (!currentApiKey || !databaseUrl) {
    console.error(
      'Error: ROTATE_CURRENT_API_KEY and ROTATE_DATABASE_URL are required'
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

  // The key is hashed in the DB index and cannot be matched with a where
  // clause, so resolve it the same way access control does - read them all and
  // compare in memory.
  const { docs } = await payload.find({
    collection: 'tenants',
    overrideAccess: true,
    pagination: false,
    depth: 0
  });

  const tenant = docs.find(({ apiKey }) => apiKey === currentApiKey);

  if (!tenant) {
    console.error(
      'Error: No tenant in this database uses the API key held in Infisical.\n' +
        'Either the two have drifted apart, or this is the wrong environment.'
    );
    process.exit(1);
  }

  // Resolving is the risky part to get wrong, so it can be checked on its own
  if (process.env['ROTATE_DRY_RUN'] === 'true') {
    console.log(
      `[ROTATE] Would rotate tenant '${tenant.slug}' (id: ${tenant.id})`
    );
    console.log(`RESOLVED_TENANT=${tenant.slug}`);
    process.exit(0);
  }

  const apiKey = randomUUID();

  await payload.update({
    collection: 'tenants',
    id: tenant.id,
    data: { apiKey, enableAPIKey: true },
    overrideAccess: true
  });

  console.log(`[ROTATE] Tenant '${tenant.slug}' (id: ${tenant.id}) updated`);
  console.log(`RESOLVED_TENANT=${tenant.slug}`);
  console.log(`ROTATED_API_KEY=${apiKey}`);

  process.exit(0);
}

rotate();
