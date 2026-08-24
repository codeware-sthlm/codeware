import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { vitePlugin as remix } from '@remix-run/dev';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import { defineConfig } from 'vite';

declare module '@remix-run/node' {
  interface Future {
    v3_singleFetch: true;
  }
}

/**
 * Output build path limitation!
 *
 * We can force the output to be written to workspace root `dist` using remix config:
 *  buildDirectory: '../../dist/apps/web/build'
 *
 * However this makes the compiled property `assetsBuildDirectory` in `server/index.js`
 * point to the wrong path, and there is no way to override it (as I know it (Håkan)).
 *
 * Therefore we stick to output compiled code to app root until we know better.
 */

// Source maps are only uploaded when the deploy supplies every part: the shared
// credentials *and* this app's own project and release. Org and auth token reach
// every app, so gating on those alone would arm the plugin for an app that has
// no Sentry configuration and upload to an undefined project and a release that
// was never created. The release itself is created by the build workflow, so the
// plugin only attaches artifacts to it.
const sentryEnabled = [
  'SENTRY_AUTH_TOKEN',
  'SENTRY_ORG',
  'SENTRY_PROJECT',
  'SENTRY_RELEASE',
  // The pre-deploy action only ever resolves project and dsn together, but the
  // gate should state the whole invariant rather than lean on that guarantee
  'SENTRY_DSN'
].every((key) => !!process.env[key]);

export default defineConfig({
  root: __dirname,
  build: {
    target: ['node20', 'esnext'],
    sourcemap: sentryEnabled
  },
  ssr: {
    // sanitize-html's dependency tree (htmlparser2's ESM-only subtree, plus
    // postcss and its own transitive deps) breaks at runtime when left
    // external: Vite's SSR default resolves node_modules via Node's own
    // require()/import(), but pnpm's strict, non-hoisting layout means those
    // packages aren't resolvable from wherever the bundled code ends up
    // (ERR_REQUIRE_ESM on htmlparser2, then ERR_MODULE_NOT_FOUND on postcss
    // once htmlparser2 was force-bundled but postcss wasn't). Enumerating the
    // dependency tree one crash at a time doesn't scale — bundle everything.
    // No native-binary deps are actually reachable from apps/web's own
    // import graph (verified: sharp appears in the lockfile as an unused
    // transitive optional dependency of a build tool, never touched by the
    // compiled server bundle), so there's nothing noExternal:true would
    // break by inlining it.
    noExternal: true
  },
  plugins: [
    remix({
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
        v3_singleFetch: true,
        v3_lazyRouteDiscovery: true
      }
    }),
    nxViteTsPaths(),
    ...(sentryEnabled
      ? [
          sentryVitePlugin({
            authToken: process.env.SENTRY_AUTH_TOKEN,
            org: process.env.SENTRY_ORG,
            project: process.env.SENTRY_PROJECT,
            telemetry: false,
            release: {
              name: process.env.SENTRY_RELEASE,
              create: false,
              finalize: false
            },
            // Keep source maps out of the deployed image
            sourcemaps: { filesToDeleteAfterUpload: ['**/*.map'] }
          })
        ]
      : [])
  ]
});
