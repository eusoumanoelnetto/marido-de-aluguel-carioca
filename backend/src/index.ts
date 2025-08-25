import express, { Express, Request, Response, NextFunction } from 'express';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import serviceRoutes from './routes/serviceRoutes';
import userRoutes from './routes/userRoutes';
import { initDb, isDbConnected } from './db';

// Load environment variables from .env file
dotenv.config();

const app: Express = express();
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


// In development, use health check; in production, serve the front-end
if (process.env.NODE_ENV !== 'production') {
  app.get('/', (req: Request, res: Response) => {
    res.send('Backend Server is running!');
  });
} else {
  const distPath = path.resolve(__dirname, '../../dist');
  app.use(express.static(distPath));
  app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Function to start the Express server
const startServer = () => {
    app.listen(PORT, () => {
        if (isDbConnected) {
            console.log(`🚀 Server is running on http://localhost:${PORT}`);
        } else {
            console.warn(`⚠️  Server started without DB connection on http://localhost:${PORT}`);
        }
    });
}

// Initialize the database and then start the server
initDb()
    .catch(error => {
        // Log detailed error for the developer
        console.error('Failed to initialize database:', error.message);
        // Log a more user-friendly message
        console.warn('Continuando sem conexão com o banco. Algumas rotas podem falhar até que DATABASE_URL seja corrigida.');
    })
    .finally(() => {
        // Start the server regardless of DB connection status
        startServer();
    });