import * as Sentry from '@sentry/nextjs';

import { loadEnv } from '@codeware/app-cms/feature/env-loader';

export async function register() {
  const runtime = process.env.NEXT_RUNTIME;
  console.log(`[REGISTER] Load environment variables in ${runtime} runtime`);

  const env = await loadEnv();

  if (env) {
    console.log(
      `[REGISTER] Successfully loaded environment variables for ${env.DEPLOY_ENV}`,
      env.DEPLOY_ENV !== 'production' && env.LOG_LEVEL === 'debug'
        ? env
        : Object.keys(env)
    );

    if (env.SENTRY) {
      if (runtime === 'nodejs') {
        console.log('[REGISTER] Initializing Sentry nodejs runtime');
        await import('./sentry.server.config');
      } else if (runtime === 'edge') {
        console.log('[REGISTER] Initializing Sentry edge runtime');
        await import('./sentry.edge.config');
      }
    }
  }
}

export const onRequestError = Sentry.captureRequestError;
