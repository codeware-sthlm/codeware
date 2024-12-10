import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { vitePlugin as remix } from '@remix-run/dev';
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

export default defineConfig({
  root: __dirname,
  build: {
    target: ['node20', 'esnext']
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
    nxViteTsPaths()
  ]
});
