import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
  // Base path is configurable via VITE_BASE so we can build for GitHub Pages
  // (e.g. '/owner/repo/') or use a relative base for local/backend-serving ('./').
  base: env.VITE_BASE || '/marido-de-aluguel-carioca/',
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
          outDir: 'dist'
        }
    };
});
