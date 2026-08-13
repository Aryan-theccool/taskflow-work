import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The browser talks to the API through relative URLs; Vite proxies them to
// the Express server so nothing ever points at a hard-coded host.
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts: true,
    proxy: {
      '/boards': 'http://localhost:4000',
      '/tasks': 'http://localhost:4000',
      '/health': 'http://localhost:4000',
    },
  },
  preview: {
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
