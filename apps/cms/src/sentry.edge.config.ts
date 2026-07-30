import { getEnv } from '@codeware/app-cms/feature/env-loader';
import { getSentrySampleRate } from '@codeware/shared/util/pure';
import * as Sentry from '@sentry/nextjs';

const env = getEnv();
const enabled = !!env.SENTRY;

Sentry.init({
  enabled,
  dsn: env.SENTRY?.dsn,
  environment: env.DEPLOY_ENV,
  release: env.SENTRY?.release,

  // See `sentry.server.config.ts` for why tenants are separated by a tag
  initialScope: {
    tags: {
      mode: env.APP_MODE.type,
      ...(env.APP_MODE.type === 'tenant' && { tenant: env.APP_MODE.tenantId })
    }
  },

  // Percentage of transactions sent to Sentry (0.0 to 1.0)
  tracesSampleRate: getSentrySampleRate(env.DEPLOY_ENV)
});

if (enabled) {
  console.log('[SENTRY] Sentry initialized for edge runtime');
}
