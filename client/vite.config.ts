import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Load .env from the monorepo root (one level up from client/) so VITE_* vars
  // defined there (e.g. VITE_VAPID_PUBLIC_KEY) are available to the frontend.
  envDir: '..',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true, // listen on 0.0.0.0 so mobile devices on the same network can reach it
    allowedHosts: true, // allow ngrok/tunnel domains to proxy through the backend
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        ws: true, // proxy WebSocket upgrade for Socket.io
      },
    },
  },
});
