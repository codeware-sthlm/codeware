import { getSentrySampleRate } from '@codeware/shared/util/pure';
import { RemixBrowser } from '@remix-run/react';
import * as Sentry from '@sentry/react';
import { StrictMode, startTransition } from 'react';
import { hydrateRoot } from 'react-dom/client';

// Baked into the bundle from the Docker build args. The tenant cannot be baked
// in — one image serves every tenant — so the root route tags it at runtime.
const dsn = import.meta.env.VITE_SENTRY_DSN;
const deployEnv = import.meta.env.VITE_DEPLOY_ENV;

Sentry.init({
  enabled: !!dsn,
  dsn,
  environment: deployEnv,
  release: import.meta.env.VITE_SENTRY_RELEASE,

  // Percentage of transactions sent to Sentry (0.0 to 1.0)
  tracesSampleRate: getSentrySampleRate(deployEnv),

  // Structured logs are opt-in; without this nothing reaches Sentry Logs
  enableLogs: true,

  integrations: [
    Sentry.browserTracingIntegration(),

    // Send console.log, console.warn and console.error calls as logs
    Sentry.consoleLoggingIntegration({ levels: ['log', 'warn', 'error'] })
  ]
});

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <RemixBrowser />
    </StrictMode>
  );
});
