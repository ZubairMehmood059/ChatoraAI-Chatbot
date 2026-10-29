import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  const isCloudRun = Boolean(process.env.APP_URL) || process.env.DISABLE_HMR === 'true';
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname || '.', '.'),
      },
    },
    optimizeDeps: {
      include: ['motion/react', 'framer-motion', 'motion-dom'],
    },
    server: {
      // Disable HMR in AI Studio to eliminate websocket closed errors
      hmr: false,
    },
  };
});
