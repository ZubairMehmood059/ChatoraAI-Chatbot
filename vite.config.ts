import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

function isSupabaseSecretKey(key: string): boolean {
  if (key.startsWith('sb_secret_')) return true;

  const payload = key.split('.')[1];
  if (!payload) return false;

  try {
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return claims.role === 'service_role';
  } catch {
    return false;
  }
}

export default defineConfig(({mode}) => {
  const viteEnv = loadEnv(mode, process.cwd(), 'VITE_');
  const supabaseClientKey =
    process.env.VITE_SUPABASE_ANON_KEY || viteEnv.VITE_SUPABASE_ANON_KEY || '';

  if (isSupabaseSecretKey(supabaseClientKey)) {
    throw new Error(
      'VITE_SUPABASE_ANON_KEY must be a publishable or legacy anon key, never a Supabase secret key. Key value omitted.'
    );
  }

  const apiTarget = process.env.FASTAPI_URL || 'http://127.0.0.1:8000';
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
      host: '0.0.0.0',
      hmr: process.env.DISABLE_HMR === 'true' ? false : undefined,
      proxy: {
        '/api': { target: apiTarget, changeOrigin: true },
        '/health': { target: apiTarget, changeOrigin: true },
      },
    },
  };
});
