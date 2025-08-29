import express, { Express, Request, Response, NextFunction } from 'express';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import serviceRoutes from './routes/serviceRoutes';
import userRoutes from './routes/userRoutes';
import pushRoutes from './routes/pushRoutes';
import { initDb, isDbConnected } from './db';

// Load environment variables from .env file
dotenv.config();

export const app: Express = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json({ limit: '10mb' })); // To parse JSON bodies (and increase limit for images)

// Middleware to check for DB connection before handling API requests
const checkDbConnection = (req: Request, res: Response, next: NextFunction) => {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isDbConnected && isProd) {
    return res.status(503).json({
      message: 'Serviço indisponível. O servidor não conseguiu se conectar ao banco de dados.'
    });
  }
  next();
};

// API Routes - protected by the DB connection check
app.use('/api', checkDbConnection);
app.use('/api/auth', authRoutes);
app.use('/api/requests', serviceRoutes);
app.use('/api/users', userRoutes);
app.use('/api/push', pushRoutes);


// Sempre que existir build em ../../dist servimos o front; se não existir, mostra health simples
(() => {
  try {
    // Procurar build em dist (padrão) ou docs (configuração atual do Vite)
    const candidates = [path.resolve(__dirname, '../../dist'), path.resolve(__dirname, '../../docs')];
    const fs = require('fs');
    let foundIndex: string | null = null;
    let foundDistPath: string | null = null;
    for (const cand of candidates) {
      const indexPath = path.join(cand, 'index.html');
      try {
        fs.accessSync(indexPath);
        foundIndex = indexPath;
        foundDistPath = cand;
        break;
      } catch (err) {
        // não existe, continuar
      }
    }
    if (foundIndex && foundDistPath) {
      console.log('🖥  Servindo front-end estático de', foundDistPath);
      app.use(express.static(foundDistPath));
      app.get('*', (req: Request, res: Response) => {
        res.sendFile(foundIndex as string);
      });
    } else {
      console.warn('ℹ️  Build front-end não encontrado (dist/index.html ou docs/index.html). Acesse / para health check. Rode `npm run build` na raiz para gerar.');
      app.get('/', (req: Request, res: Response) => {
        res.send('Backend Server is running! (dist/docs ausente)');
      });
    }
  } catch (err) {
    console.error('Erro ao configurar servidor estático:', err);
    app.get('/', (req: Request, res: Response) => {
      res.send('Backend Server is running! (erro ao checar build)');
    });
  }
})();

// Function to start the Express server
export const startServer = () => {
  return app.listen(PORT, () => {
        if (isDbConnected) {
            console.log(`🚀 Server is running on http://localhost:${PORT}`);
        } else {
            console.warn(`⚠️  Server started without DB connection on http://localhost:${PORT}`);
        }
    });
}

// Initialize the database and then start the server
if (process.env.JEST_WORKER_ID === undefined) {
  initDb()
    .catch(error => {
      console.error('Failed to initialize database:', error.message);
      console.warn('Continuando sem conexão com o banco. Algumas rotas podem falhar até que DATABASE_URL seja corrigida.');
    })
    .finally(() => {
      startServer();
    });
}