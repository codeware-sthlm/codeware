import type { AppInfo } from '@codeware/shared/ui/cms-renderer';

import env from '../../env-resolver/env';
// Version is inlined at build from the (CI-bumped) app manifest.
import pkg from '../../package.json';

/**
 * Build the running web app's About metadata from its manifest version and the
 * build vars injected on deploy. Server-side; passed to the client via the root
 * loader so the About block and `/api/version` share one source of truth.
 */
export const getAppInfo = (): AppInfo => ({
  name: 'web',
  version: pkg.version,
  sha: env.APP_SHA ?? '',
  deployEnv: env.DEPLOY_ENV,
  buildTime: env.APP_BUILD_TIME ?? ''
});
