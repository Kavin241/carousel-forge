import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import mkcert from 'vite-plugin-mkcert';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

export default defineConfig({
  plugins: [react(), mkcert(), cssInjectedByJsPlugin()],
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
});
