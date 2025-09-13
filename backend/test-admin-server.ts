import express from 'express';
import cors from 'cors';
import { dbManager } from './src/db-enhanced';
import adminRoutes from './src/routes/adminRoutes';

const app = express();
const PORT = 3004;

// Middlewares
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());

// Usar as rotas administrativas
app.use('/api/admin-panel', adminRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Servidor admin panel funcionando!',
    endpoints: [
      'GET /api/admin-panel/stats',
      'GET /api/admin-panel/messages',
      'GET /api/admin-panel/messages/:id',
      'PATCH /api/admin-panel/messages/mark-read',
      'GET /api/admin-panel/reports/activity'
    ]
  });
});

async function startAdminServer() {
  await dbManager.connect().catch(e => console.log('DB opcional:', e.message));
  
  app.listen(PORT, () => {
    console.log(`🚀 Servidor admin panel rodando em http://localhost:${PORT}`);
    console.log('📊 Endpoints disponíveis:');
    console.log('  - GET /api/admin-panel/stats (estatísticas)');
    console.log('  - GET /api/admin-panel/messages (histórico de mensagens)');
    console.log('  - GET /api/admin-panel/messages/:id (detalhes da mensagem)');
    console.log('  - PATCH /api/admin-panel/messages/mark-read (marcar como lidas)');
    console.log('  - GET /api/admin-panel/reports/activity (relatórios)');
  });
}

startAdminServer();