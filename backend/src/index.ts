import express, { Express, Request, Response, NextFunction } from 'express';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import serviceRoutes from './routes/serviceRoutes';
import userRoutes from './routes/userRoutes';
import pushRoutes from './routes/pushRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import { initDb, isDbConnected } from './db';

// Load environment variables from .env file
dotenv.config();

export const app: Express = express();
const PORT = process.env.PORT || 3001;
const IS_PROD = process.env.NODE_ENV === 'production';
if (IS_PROD && (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'dev_secret')) {
  console.warn('⚠️  JWT_SECRET não definido ou usando valor inseguro (dev_secret) em produção. Defina uma string forte em variáveis de ambiente.');
}

// Middlewares
// Enable Cross-Origin Resource Sharing with safer defaults:
// - Allow Authorization header in preflight so browsers can send Bearer tokens
// - Allow origin to be configured via FRONTEND_ORIGIN (comma-separated) or fallback to '*'
const frontendOrigin = process.env.FRONTEND_ORIGIN;
let corsOrigin: boolean | string | string[] = '*';
if (frontendOrigin) {
  // allow a single origin or a comma-separated list
  corsOrigin = frontendOrigin.includes(',') ? frontendOrigin.split(',').map(s => s.trim()) : frontendOrigin;
}
// Em desenvolvimento, sempre permitir localhost
if (!IS_PROD) {
  if (Array.isArray(corsOrigin)) {
    corsOrigin.push('http://localhost:8000', 'http://127.0.0.1:8000');
  } else if (corsOrigin !== '*') {
    corsOrigin = [corsOrigin as string, 'http://localhost:8000', 'http://127.0.0.1:8000'];
  }
}
if (IS_PROD && corsOrigin === '*') {
  console.warn('⚠️  CORS liberado para todos (*) em produção. Defina FRONTEND_ORIGIN com o domínio(s) do seu front-end para maior segurança.');
}
app.use(cors({
  origin: corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  // Allow custom admin header used by the static admin panel
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Admin-Key'],
  exposedHeaders: ['Authorization'],
  // credentials left false by default; if you need cookies set FRONTEND_ORIGIN and enable credentials explicitly
  credentials: false,
}));
// Also respond to all OPTIONS preflight requests
app.options('*', cors());
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
app.use('/api/admin', dashboardRoutes); // Nova rota para dashboard admin


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