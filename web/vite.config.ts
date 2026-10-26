import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    // Без proxy /api: в serverless Vercel функции уже лежат рядом (api/),
    // для локальной разработки используйте `vercel dev`.
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
