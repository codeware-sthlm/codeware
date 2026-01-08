import path from 'path';
import { fileURLToPath } from 'url';

import { composePlugins, withNx } from '@nx/next';
import { withPayload } from '@payloadcms/next/withPayload';
import { withSentryConfig } from '@sentry/nextjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Log build-time environment for debugging
if (process.env.NX_TASK_TARGET_TARGET === 'build') {
  console.log(`
    [BUILD] Environment variables available to Sentry in next.config.mjs:
    [BUILD] - DEPLOY_ENV: ${process.env.DEPLOY_ENV || '✗ not set'}
    [BUILD] - NEXT_PUBLIC_DEPLOY_ENV: ${process.env.NEXT_PUBLIC_DEPLOY_ENV || '✗ not set'}
    [BUILD] - NEXT_PUBLIC_SENTRY_DSN: ${process.env.NEXT_PUBLIC_SENTRY_DSN ? '✓ set' : '✗ not set'}
    [BUILD] - NEXT_PUBLIC_SENTRY_RELEASE: ${process.env.NEXT_PUBLIC_SENTRY_RELEASE || '✗ not set'}
    [BUILD] - SENTRY_AUTH_TOKEN: ${process.env.SENTRY_AUTH_TOKEN ? '✓ set' : '✗ not set'}
    [BUILD] - SENTRY_ORG: ${process.env.SENTRY_ORG ? '✓ set' : '✗ not set'}
    [BUILD] - SENTRY_PROJECT: ${process.env.SENTRY_PROJECT ? '✓ set' : '✗ not set'}
    [BUILD] - SENTRY_RELEASE: ${process.env.SENTRY_RELEASE || '✗ not set'}
    `);
}

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  nx: {
    // Set this to true if you would like to use SVGR
    // See: https://github.com/gregberge/svgr
    svgr: false
  },
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname, '../../'),
  experimental: {
    reactCompiler: false
  }
};

/**
 * Sentry build options - automatically reads from environment:
 * - SENTRY_ORG
 * - SENTRY_PROJECT
 * - SENTRY_AUTH_TOKEN (if source map upload is enabled)
 * - SENTRY_RELEASE (will be the name of the created release)
 *
 * @type import('@sentry/nextjs').SentryBuildOptions
 */
const sentryConfig = {
  // Disable telemetry data collection
  telemetry: false,

  // Route Sentry requests through your server (avoids ad-blockers),
  // This increases server load. Consider the trade-off for the application.
  tunnelRoute: '/monitoring',

  // Do not upload source maps for node_modules to reduce build size and exposure
  widenClientFileUpload: false,

  // Release configuration
  release: {
    // Deploy information
    deploy: {
      env: process.env.DEPLOY_ENV
    }
  }
};

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
  withPayload,
  (config) => withSentryConfig(config, sentryConfig)
];

export default composePlugins(...plugins)(nextConfig);
