import express from 'express';
import cors from 'cors';
import { dbManager } from './src/db-enhanced';

const app = express();
const PORT = 3003;

// Middlewares
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());

// Middleware simples de autenticação
const simpleAuth = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token ausente' });
  }

  try {
    const jwt = require('jsonwebtoken');
    const token = authHeader.split(' ')[1];
    const secret = 'dev_secret';
    const payload = jwt.verify(token, secret);
    
    req.user = { 
      email: payload.email, 
      role: payload.role 
    };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token inválido' });
  }
};

// Endpoint para provider enviar mensagem
app.post('/api/messages/provider/send', simpleAuth, (req: any, res) => {
  const { clientEmail, title, message } = req.body;
  const providerEmail = req.user.email;
  
  console.log(`📤 Provider ${providerEmail} enviando mensagem para ${clientEmail}`);
  
  if (req.user.role !== 'provider') {
    return res.status(403).json({ error: 'Acesso negado - apenas providers' });
  }
  
  if (!clientEmail || !message) {
    return res.status(400).json({ error: 'clientEmail e message são obrigatórios' });
  }

  // Simular salvamento
  const messageId = Date.now().toString();
  
  res.json({
    success: true,
    messageId,
    message: 'Mensagem enviada com sucesso!',
    data: {
      from: providerEmail,
      to: clientEmail,
      title: title || 'Mensagem do Prestador',
      content: message,
      timestamp: new Date().toISOString()
    }
  });
});

// Endpoint para provider buscar mensagens
app.get('/api/messages/provider', simpleAuth, (req: any, res) => {
  const providerEmail = req.user.email;
  
  console.log(`📥 Provider ${providerEmail} buscando mensagens`);
  
  if (req.user.role !== 'provider') {
    return res.status(403).json({ error: 'Acesso negado - apenas providers' });
  }

  // Simular busca de mensagens
  const mockMessages = [
    {
      id: '1',
      title: 'Solicitação de orçamento',
      content: 'Preciso de um reparo na torneira da cozinha',
      senderEmail: 'cliente@teste.com',
      recipientEmail: providerEmail,
      timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 dia atrás
      direction: 'received'
    },
    {
      id: '2',
      title: 'Orçamento enviado',
      content: 'Posso fazer o reparo por R$ 80. Confirma?',
      senderEmail: providerEmail,
      recipientEmail: 'cliente@teste.com',
      timestamp: new Date().toISOString(),
      direction: 'sent'
    }
  ];

  res.json({
    success: true,
    messages: mockMessages,
    total: mockMessages.length
  });
});

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor provider funcionando!' });
});

async function startProviderServer() {
  await dbManager.connect().catch(e => console.log('DB opcional:', e.message));
  
  app.listen(PORT, () => {
    console.log(`🚀 Servidor provider rodando em http://localhost:${PORT}`);
  });
}

startProviderServer();