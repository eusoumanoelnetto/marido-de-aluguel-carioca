import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  // Forçar VITE_API_BASE em produção se não estiver definida
  const apiBase = env.VITE_API_BASE || 'https://marido-de-aluguel-carioca.onrender.com';
  
  return {
    plugins: [react()],
  // Default base for Vercel should be root '/'. Keep VITE_BASE to allow GitHub Pages builds.
  base: env.VITE_BASE || '/',
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      // Garantir que VITE_API_BASE está sempre definida
      'import.meta.env.VITE_API_BASE': JSON.stringify(apiBase),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      outDir: 'dist',
    },
  };
});
