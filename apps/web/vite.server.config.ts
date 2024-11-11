import { cwd } from 'node:process';

import { defineConfig } from 'vite';

console.log('Vite server config', cwd());

export default defineConfig({
  build: {
    ssr: true,
    outDir: './apps/web/dist',
    target: 'node20',
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
  // Exlude public directory from the build
  publicDir: false
});
