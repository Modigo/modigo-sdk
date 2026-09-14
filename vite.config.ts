import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/modigo.ts'),
      name: 'modigo',
      formats: ['es', 'umd'],
      fileName: (format) => `modigo.${format}.js`,
    },
    rollupOptions: {
      // No external deps — everything must be self-contained
      external: [],
    },
    minify: 'esbuild',
    sourcemap: true,
  },
});
