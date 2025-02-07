/**
 * Environment configuration for Payload CMS backend.
 *
 * IMPORTANT!
 * Due to Payload CMS's design decisions, we need to handle
 * server-side and client-side environment variables separately.
 *
 * The problem:
 * - Payload use `payload.config.ts` mainly server-side but use
 *   it also client-side to lookup some settings.
 * - Payload bundles therefore the entire config file (and its imports) for
 *   the admin panel
 * - This means we have to keep the server code out of `payload.config.ts`,
 *   otherwise it would end up in the client bundle, causing runtime errors
 *   (no process.env, no process.exit, etc.)
 *
 * Current solution:
 * - This file is responsible for providing a asynchronous function
 *   that resolves environment variables into `process.env`.
 *   It should only be used by server start file `main.ts`.
 * - `payload.config.ts` is considered client-only and should hence
 *   import `resolved-env.ts` instead, free from any server-side concerns.
 * - `resolved-env.ts` can actually be used by both client and server
 *   once the environment variables are resolved by server-side code.
 */

import { withInfisical } from '@codeware/shared/feature/infisical';
import { withEnvVars } from '@codeware/shared/util/zod';

import { EnvSchema } from './env.schema';
import isBrowser from './is-browser';

if (isBrowser) {
  throw new Error(
    '[RESOLVER] This file should not be imported by client side code'
  );
}

/**
 * Apply environment variable lookup to the schema to resolve the actual values
 */
const EnvServerSchema = withEnvVars(EnvSchema);

/**
 * Resolve and validate environment variables server side into `process.env`
 */
const resolveServerSideEnv = async (): Promise<void> => {
  // Pre-check environment variables as they can be injected from CLI.
  // Then there is no reason to connect to Infisical using the SDK.
  const preResponse = EnvSchema.safeParse(process.env);
  if (preResponse.success) {
    console.log(
      '[RESOLVER] Server environment variables already resolved, skipping Infisical connection'
    );
    return;
  }

  // Connect to Infisical and get the secrets for the app into process.env
  const statusPath = await withInfisical({
    environment: process.env.DEPLOY_ENV,
    filter: { path: '/cms' },
    injectEnv: true,
    silent: true,
    site: 'eu'
  });
  // and other required secrets for the cms app
  const statusTag = await withInfisical({
    environment: process.env.DEPLOY_ENV,
    filter: { tags: ['cms'], recurse: true },
    injectEnv: true,
    silent: true,
    site: 'eu'
  });

  if (!statusPath || !statusTag) {
    console.error('[RESOLVER] Failed to load secrets from Infisical');
    console.log(
      '[RESOLVER] Unable to proceed with missing data:',
      preResponse.error.flatten().fieldErrors
    );
    process.exit(1);
  }

  // Validate resolved environment variables
  const { success, error } = EnvServerSchema.safeParse(process.env);

  if (!success) {
    console.error('[RESOLVER] Invalid environment variables:');
    console.error(JSON.stringify(error.flatten().fieldErrors, null, 2));
    process.exit(1);
  }

  console.log('[RESOLVER] Server environment variables resolved');
};

/**
 * Resolve environment variables and return them as a parsed object
 */
export async function resolveEnv() {
  console.log('[RESOLVER] Start resolving environment variables');

  await resolveServerSideEnv();

  const env = EnvServerSchema.parse(process.env);
  console.log(
    '[RESOLVER] Successfully resolved environment variables',
    env.DEPLOY_ENV !== 'production' && env.LOG_LEVEL === 'debug'
      ? env
      : Object.keys(env)
  );

  return env;
}
