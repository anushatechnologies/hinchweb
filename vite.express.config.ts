import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    {
      name: 'express-html-entry',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (req.url === '/' || req.url === '/index.html' || (req.url && !req.url.includes('.') && !req.url.startsWith('/api') && !req.url.startsWith('/@') && !req.url.startsWith('/src'))) {
            req.url = '/express.html';
          }
          next();
        });
      },
    },
  ],
  server: {
    port: 5176,
    host: true,
    open: false,
    proxy: {
      '/api': {
        target: 'https://api.hinchmart.com',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist-express',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'express.html'),
      },
    },
  },
  appType: 'spa',
});
