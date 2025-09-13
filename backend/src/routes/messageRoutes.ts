import express from 'express';
import { authenticate, adminAccess, providerAccess } from '../middleware/authMiddleware';
import { 
  sendMessage, 
  sendMessageToAdmin,
  getMessagesForUser, 
  getMessagesForAdmin,
  markMessageAsRead, 
  getMessageStats,
  getTestToken,
  sendProviderMessage,
  getProviderMessages,
  replyToClient
} from '../controllers/messageController';

const router = express.Router();

// Rota para admin enviar mensagem PV
router.post('/send', adminAccess, sendMessage);

// NOVA: Rota para usuário enviar mensagem para admin
router.post('/send-to-admin', authenticate, sendMessageToAdmin);

// Rota para usuário buscar suas mensagens
router.get('/', authenticate, getMessagesForUser);  // Rota principal
router.get('/user', authenticate, getMessagesForUser);

// NOVA: Rota para admin buscar todas as mensagens
router.get('/admin', adminAccess, getMessagesForAdmin);

// Rota para marcar mensagem como lida
router.patch('/:messageId/read', authenticate, markMessageAsRead);

// Rota para admin obter estatísticas de mensagens
router.get('/stats', adminAccess, getMessageStats);

// Rota de teste para obter token (apenas desenvolvimento)
router.get('/test-token', getTestToken);

// === ROTAS ESPECÍFICAS PARA PROVIDERS ===

// Provider envia mensagem para cliente
router.post('/provider/send', providerAccess, sendProviderMessage);

// Provider busca suas mensagens (enviadas e recebidas)
router.get('/provider', providerAccess, getProviderMessages);

// Provider responde mensagem de cliente
router.post('/provider/reply', providerAccess, replyToClient);

export default router;