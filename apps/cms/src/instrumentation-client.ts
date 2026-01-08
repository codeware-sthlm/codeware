import * as Sentry from '@sentry/nextjs';

import { getSentrySampleRate } from './utils/get-sentry-sample-rate';

// Client-side env variables must use NEXT_PUBLIC_ prefix
type ClientEnv = {
  DEPLOY_ENV?: string;
  SENTRY_DSN?: string;
  SENTRY_RELEASE?: string;
};
const env = {
  DEPLOY_ENV: process.env.NEXT_PUBLIC_DEPLOY_ENV,
  SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  SENTRY_RELEASE: process.env.NEXT_PUBLIC_SENTRY_RELEASE
} as ClientEnv;

const enabled = !!env.SENTRY_DSN;

Sentry.init({
  enabled,
  dsn: env.SENTRY_DSN,
  environment: env.DEPLOY_ENV,
  release: env.SENTRY_RELEASE,

  // Use Sentry logger to send structured logs from anywhere in your application.
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/#logs-
  enableLogs: true,

  // Percentage of transactions sent to Sentry (0.0 to 1.0)
  tracesSampleRate: getSentrySampleRate(env.DEPLOY_ENV),

  // Session Replay sample rates
  replaysSessionSampleRate: getSentrySampleRate(env.DEPLOY_ENV),
  replaysOnErrorSampleRate: 1.0, // Capture 100% of sessions with errors

  integrations: [
    Sentry.browserTracingIntegration(),

    // send console.log, console.warn, and console.error calls as logs to Sentry
    Sentry.consoleLoggingIntegration({ levels: ['log', 'warn', 'error'] }),

    // Configure Session Replay integration
    Sentry.replayIntegration({
      // Don't mask user text (adjust based on privacy requirements)
      maskAllText: false,
      // Don't block media elements from recordings
      blockAllMedia: false
    })
  ]
});

// Required export to enable instrument router navigations
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

if (enabled) {
  console.log('[SENTRY] Sentry initialized for client runtime');

  // Verify configuration (only in browser, not during SSR)
  if (typeof window !== 'undefined') {
    const client = Sentry.getClient();
    if (client) {
      const {
        enabled,
        environment,
        dsn,
        release,
        tracesSampleRate,
        integrations
      } = client.getOptions();
      console.log('[SENTRY] Client config:', {
        enabled,
        environment,
        dsn: dsn ? `${dsn.substring(0, 15)}[REDACTED]` : 'not set',
        release,
        tracesSampleRate: tracesSampleRate,
        integrations: integrations.length
      });
    } else {
      console.warn('[SENTRY] Client not initialized!');
    }
  }
} else {
  console.log('[SENTRY] Sentry is disabled (NEXT_PUBLIC_SENTRY_DSN not set)');
  console.log('[SENTRY] Available env:', {
    DEPLOY_ENV: env.DEPLOY_ENV,
    SENTRY_DSN: env.SENTRY_DSN ? 'set' : 'not set',
    SENTRY_RELEASE: env.SENTRY_RELEASE
  });
}
