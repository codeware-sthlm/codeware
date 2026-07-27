import type { Env } from '@codeware/app-cms/util/env-schema';
import type { AppInfo } from '@codeware/shared/ui/cms-renderer';

// Version is inlined at build from the (CI-bumped) app manifest.
import pkg from '../package.json';

/**
 * Build the running cms app's About metadata from its manifest version and the
 * build vars injected on deploy (server-side env). Consumed by the site
 * `PayloadProvider` (About block) and the admin About affordance.
 *
 * Takes the parsed env rather than calling `getEnv()` itself — both callers
 * already hold one, and `getEnv()` re-runs the full `withEnvVars` walk over
 * `process.env` plus Zod validation on every call.
 */
export const getAppInfo = (env: Env): AppInfo => ({
  name: 'cms',
  version: pkg.version,
  sha: env.APP_SHA ?? '',
  deployEnv: env.DEPLOY_ENV,
  buildTime: env.APP_BUILD_TIME ?? ''
});
