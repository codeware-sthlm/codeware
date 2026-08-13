import { adoptableDomains } from '@codeware/app-cms/feature/domains';
import type { Payload } from 'payload';

import { resolveScopedTenant } from '../security/resolve-scoped-tenant';

/**
 * Serve this deployment's workspace on its own custom domain.
 *
 * The domain lives in the workspace document rather than in a deployment
 * secret, which means it is not known when the config is built — the database
 * is what the config is being built to reach. So it is applied here instead,
 * from `onInit`, which runs after the connection is up and before the app takes
 * a request.
 *
 * Three settings have to move together, and missing any one leaves a domain
 * that half works:
 *
 * - `serverURL` — every absolute link the platform generates, including the
 *   password reset that gets a locked-out editor back in
 * - `cors` — whether the api answers a browser on that origin at all
 * - `csrf` — whether the admin accepts its own cookie from that origin
 *
 * Payload reads all three from the live config per request rather than
 * capturing them at build time, which is what makes this work; the sibling
 * spec pins that assumption to the installed version.
 *
 * Nothing here is destructive. Existing origins are kept, `CUSTOM_URL` still
 * wins if it is set, and a workspace with no validated domain leaves the
 * deployment exactly as it was.
 */
export const adoptTenantDomains = async (payload: Payload): Promise<void> => {
  const { config } = payload;

  try {
    const tenant = await resolveScopedTenant(payload);

    if (!tenant) {
      return;
    }

    const { primary, origins } = adoptableDomains(
      tenant.domains,
      process.env['APP_NAME']
    );

    if (!origins.length) {
      return;
    }

    // An explicitly configured url outranks an adopted one: it is the escape
    // hatch for putting a deployment somewhere the data does not know about
    if (primary && !process.env['CUSTOM_URL']) {
      config.serverURL = primary;
      payload.logger.info(`[domains] Serving as ${primary}`);
    }

    // A wildcard already allows these, and narrowing it here would quietly
    // tighten a deployment that chose to be open
    if (Array.isArray(config.cors)) {
      config.cors = [...new Set([...config.cors, ...origins])];
    }

    config.csrf = [...new Set([...(config.csrf ?? []), ...origins])];

    payload.logger.info(`[domains] Accepting ${origins.join(', ')}`);
  } catch (error) {
    // A workspace lookup failing must not stop the app from booting — without
    // this it still serves on its Fly url, which is how support reaches it
    payload.logger.error(
      `[domains] Could not apply custom domains: ${String(error)}`
    );
  }
};
