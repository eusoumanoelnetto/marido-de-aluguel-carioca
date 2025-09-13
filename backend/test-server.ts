import express from 'express';
import cors from 'cors';
import { dbManager } from './src/db-enhanced';
import messageRoutes from './src/routes/messageRoutes';

const app = express();
const PORT = 3002;

// Middlewares
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());

// Usar as rotas de mensagens completas
app.use('/api/messages', messageRoutes);

// Rota de teste simples
app.get('/api/messages/test-token', (req, res) => {
  console.log('🔑 Gerando token de teste...');
  
  const jwt = require('jsonwebtoken');
  const secret = process.env.JWT_SECRET || 'dev_secret';
  
  const payload = {
    email: 'cliente@teste.com',
    role: 'client'
  };

  const token = jwt.sign(payload, secret, { expiresIn: '24h' });

  res.json({
    success: true,
    token,
    user: {
      email: 'cliente@teste.com',
      name: 'Cliente Teste',
      role: 'client'
    },
    message: 'Token de teste gerado'
  });
});

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor funcionando!' });
});

async function startTestServer() {
  await dbManager.connect().catch(e => console.log('DB opcional:', e.message));
  
  app.listen(PORT, () => {
    console.log(`🚀 Servidor de teste rodando em http://localhost:${PORT}`);
  });
}

startTestServer();