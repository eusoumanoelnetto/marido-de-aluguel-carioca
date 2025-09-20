import express, { Express, Request, Response, NextFunction } from 'express';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import serviceRoutes from './routes/serviceRoutes';
import userRoutes from './routes/userRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import messageRoutes from './routes/messageRoutes';
import { initDb, isDbConnected } from './db';

// Load environment variables from .env file
dotenv.config();

export const app: Express = express();
const PORT = process.env.PORT || 3001;
const IS_PROD = process.env.NODE_ENV === 'production';
if (IS_PROD && (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'dev_secret')) {
  console.warn('⚠️  JWT_SECRET não definido ou usando valor inseguro (dev_secret) em produção. Defina uma string forte em variáveis de ambiente.');
}

// CORS: use a single, explicit middleware
// Behavior:
// - In production, if FRONTEND_ORIGIN is set we validate against it (single or comma-separated list)
// - Otherwise (including local dev) we reflect the request origin so browser receives an exact match
const frontendOrigin = process.env.FRONTEND_ORIGIN || '';

// Parse FRONTEND_ORIGIN which may be a comma-separated list (or space/newline separated).
// Normalize entries (trim, remove trailing slash) and filter empties.
const parseOrigins = (raw: string) => {
  if (!raw) return null;
  const parts = raw
    .split(/[,\s]+/) // split on comma or whitespace
    .map(p => p.trim().replace(/\/+$/, '')) // trim and remove trailing slashes
    .filter(Boolean);
  return parts.length ? parts : null;
};

let corsOrigin = parseOrigins(frontendOrigin);

// In non-prod, allow localhost dev ports in addition to configured origins
if (!IS_PROD) {
  const devOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:8000', 'http://127.0.0.1:8000'];
  if (!corsOrigin) corsOrigin = [...devOrigins];
  else corsOrigin = [...corsOrigin, ...devOrigins];
}

const normalize = (origin?: string | null) => (origin ? origin.trim().replace(/\/+$/, '') : origin);

const allowedOriginsSet = Array.isArray(corsOrigin) ? new Set(corsOrigin.map(o => normalize(o) as string)) : null;

const originValidator = (origin: string | undefined | null, cb: (err: Error | null, allow?: boolean | string) => void) => {
  // no origin (curl, server-to-server) => allow
  if (!origin) return cb(null, true);
  const nOrigin = normalize(origin);
  if (!allowedOriginsSet) {
    // no configured frontend origins => allow any origin (reflect)
    return cb(null, true);
  }
  if (!nOrigin) return cb(null, false);
  return cb(null, allowedOriginsSet.has(nOrigin) ? true : false);
};

const corsOptions = {
  origin: originValidator,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Admin-Key'],
  exposedHeaders: ['Authorization'],
  credentials: false,
};

app.use(cors(corsOptions));
// Also respond to all OPTIONS preflight requests using the same options
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '10mb' })); // To parse JSON bodies (and increase limit for images)

// DEV-only middleware: log Authorization header for debugging authentication issues
if (process.env.NODE_ENV !== 'production') {
  app.use((req: Request, res: Response, next: NextFunction) => {
    try {
      // eslint-disable-next-line no-console
      console.log('DEV-MW auth-header:', { method: req.method, path: req.path, authorization: req.headers.authorization ? String(req.headers.authorization).slice(0, 80) + '...' : 'none' });
    } catch (e) {}
    next();
  });
}

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
app.use('/api/admin', dashboardRoutes); // Nova rota para dashboard admin
app.use('/api/messages', messageRoutes); // Mensagens entre cliente e prestador


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