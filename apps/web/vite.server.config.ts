import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { defineConfig } from 'vite';

export default defineConfig({
  root: __dirname,
  build: {
    ssr: true,
    outDir: './', // Effective output path is configured in project.json
    emptyOutDir: false, // Important!
    target: ['node20', 'esnext'],
    rollupOptions: {
      input: './apps/web/server.ts',
      output: {
        entryFileNames: 'server.js',
        format: 'esm'
      },
      // We don't want to bundle the Remix server build
      external: ['./build/server/index.js']
    }
  },
  plugins: [nxViteTsPaths()],
  // Exlude public directory from the build
  publicDir: false
});
