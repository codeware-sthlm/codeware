import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { defineConfig } from 'vite';

export default defineConfig({
  root: __dirname,
  cacheDir: '../../../../node_modules/.vite/libs/shared/util/payload-utils',
  plugins: [nxViteTsPaths()],
  test: {
    name: 'shared-util-payload-utils',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../../../coverage/libs/shared/util/payload-utils',
      provider: 'v8'
    },
    passWithNoTests: true
  }
});
