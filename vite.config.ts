import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import mkcert from 'vite-plugin-mkcert';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    mode === 'development' ? mkcert() : null,
    cssInjectedByJsPlugin()
  ].filter(Boolean),
  define: {
    'process.env': {}
  },
  server: {
    port: 8080
  },
  build: {
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        manualChunks: undefined,
        entryFileNames: 'index.js'
      }
    }
  }
}));
