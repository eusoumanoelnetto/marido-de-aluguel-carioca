import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
  // Use base path only in production; in dev use root to allow proxy '/api' to work correctly
  base: mode === 'production' ? '/marido-de-aluguel-carioca/' : '/',
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
        ,
        server: {
          proxy: {
            '/api': {
              target: 'http://localhost:3001',
              changeOrigin: true,
              secure: false,
            }
          }
        },
        build: {
          outDir: 'docs'
        }
    };
});
