import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    ssr: true,
    outDir: './apps/web',
    emptyOutDir: false,
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
