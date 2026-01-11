import * as Sentry from '@sentry/nextjs';

import { getEnv } from '@codeware/app-cms/feature/env-loader';

import { getSentrySampleRate } from './utils/get-sentry-sample-rate';

const env = getEnv();
const enabled = !!env.SENTRY;

Sentry.init({
  enabled,
  dsn: env.SENTRY?.dsn,
  environment: env.DEPLOY_ENV,
  release: env.SENTRY?.release,

  // Percentage of transactions sent to Sentry (0.0 to 1.0)
  tracesSampleRate: getSentrySampleRate(env.DEPLOY_ENV)
});

if (enabled) {
  console.log('[SENTRY] Sentry initialized for edge runtime');
}
