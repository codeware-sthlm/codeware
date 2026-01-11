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
  tracesSampleRate: getSentrySampleRate(env.DEPLOY_ENV),

  //tracePropagationTargets: [/^\/api\//],

  // Capture server-side console logs
  // Use Sentry logger to send structured logs from anywhere in your application.
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/#logs-
  enableLogs: true,

  // Include personally identifiable information (request headers, IP addresses)
  // Useful for debugging but consider privacy implications
  sendDefaultPii: true
});

if (enabled) {
  console.log('[SENTRY] Sentry initialized for server runtime');

  // Verify configuration
  const client = Sentry.getClient();
  if (client) {
    const options = client.getOptions();
    console.log('[SENTRY] Server config:', {
      enabled: options.enabled,
      environment: options.environment,
      dsn: options.dsn ? `${options.dsn.substring(0, 20)}...` : 'not set',
      tracesSampleRate: options.tracesSampleRate,
      enableLogs: options.enableLogs,
      sendDefaultPii: options.sendDefaultPii
    });
  } else {
    console.warn('[SENTRY] Server client not initialized!');
  }
} else {
  console.log('[SENTRY] Sentry is disabled (no SENTRY config found)');
}
