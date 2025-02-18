import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { defineConfig } from 'vite';

export default defineConfig({
  root: __dirname,
  cacheDir: '../../../../node_modules/.vite/libs/app-cms/util/env-schema',
  plugins: [nxViteTsPaths()],
  test: {
    name: 'app-cms-util-env-schema',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../../../coverage/libs/app-cms/util/env-schema',
      provider: 'v8'
    },
    passWithNoTests: true
  }
});
