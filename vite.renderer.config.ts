import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist/renderer',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    'process.env.ENABLE_DEVTOOLS': JSON.stringify(process.env.ENABLE_DEVTOOLS || 'true'),
  },
});
