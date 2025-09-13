import { Request, Response } from 'express';
import { dbManager } from '../db-enhanced';

// Referência ao WebSocket service será importada dinamicamente para evitar dependência circular
let webSocketService: any = null;

// Função para configurar a referência do WebSocket service
export const setWebSocketService = (wsService: any) => {
  webSocketService = wsService;
};

// Armazenamento em memória para quando não há DB (fallback)
let memoryMessages: any[] = [
  {
    id: 'test1',
    from_admin: true,
    from_user_email: null,
    to_user_email: 'cliente@teste.com',
    to_admin: false,
    title: 'Bem-vindo ao sistema!',
    message: 'Esta é sua primeira mensagem de teste. O sistema de mensagens está funcionando!',
    is_urgent: false,
    is_read: false,
    created_at: '2024-01-10T10:00:00Z'
  },
  {
    id: 'test2',
    from_admin: true,
    from_user_email: null,
    to_user_email: 'cliente@teste.com',
    to_admin: false,
    title: '🚨 Mensagem Urgente',
    message: 'Esta é uma mensagem urgente de teste para verificar a funcionalidade.',
    is_urgent: true,
    is_read: false,
    created_at: '2024-01-10T11:00:00Z'
  }
];
let memoryUsers = [
  { email: 'cliente@teste.com', name: 'Cliente Teste' },
  { email: 'provider@teste.com', name: 'Provider Teste' },
  { email: 'admin@teste.com', name: 'Admin Teste' }
];

// Enviar mensagem PV do admin para usuário específico
export const sendMessage = async (req: Request, res: Response) => {
  console.log('📨 sendMessage chamado - DB conectado:', dbManager.isConnected);
  console.log('📨 Dados recebidos:', req.body);
  
  try {
    const { toUserEmail, title, message, isUrgent } = req.body;

    if (!toUserEmail || !title || !message) {
      return res.status(400).json({ 
        message: 'Email do destinatário, título e mensagem são obrigatórios.' 
      });
    }

    if (dbManager.isConnected) {
      // Verificar se o usuário existe no banco
      const userExists = await dbManager.query('SELECT email FROM users WHERE email = ?', [toUserEmail]);
      if (!userExists.rows || userExists.rows.length === 0) {
        // Se não existir na tabela users, permitir para usuários de teste
        if (!['cliente@teste.com', 'provider@teste.com'].includes(toUserEmail)) {
          return res.status(404).json({ 
            message: 'Usuário destinatário não encontrado.' 
          });
        }
      }

      const messageId = Date.now().toString() + Math.random().toString(36).substr(2, 9);

      if (dbManager.dbType === 'postgresql') {
        await dbManager.query(
          `INSERT INTO messages (id, from_admin, to_user_email, title, message, is_urgent, created_at) 
           VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [messageId, true, toUserEmail, title, message, isUrgent || false]
        );
      } else {
        await dbManager.query(
          `INSERT INTO messages (id, from_admin, to_user_email, title, message, is_urgent) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [messageId, 1, toUserEmail, title, message, isUrgent ? 1 : 0]
        );
      }

      console.log('✅ Mensagem salva no banco:', messageId);
      res.status(201).json({ 
        success: true,
        message: 'Mensagem enviada com sucesso.',
        messageId 
      });
    } else {
      // Fallback para armazenamento em memória
      console.log('💾 Usando armazenamento em memória');
      const userExists = memoryUsers.find(u => u.email === toUserEmail);
      if (!userExists) {
        return res.status(404).json({ 
          message: 'Usuário destinatário não encontrado.' 
        });
      }

      const messageId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      const newMessage = {
        id: messageId,
        from_admin: true,
        from_user_email: null,
        to_user_email: toUserEmail,
        to_admin: false,
        title,
        message,
        is_urgent: isUrgent || false,
        is_read: false,
        created_at: new Date().toISOString()
      };

      memoryMessages.push(newMessage);
      console.log('✅ Mensagem salva em memória:', messageId);
      console.log('📊 Total de mensagens em memória:', memoryMessages.length);

      res.status(201).json({ 
        success: true,
        message: 'Mensagem enviada com sucesso! (modo memória)',
        messageId 
      });
    }
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor ao enviar mensagem.' 
    });
  }
};

// NOVA FUNCIONALIDADE: Enviar mensagem de usuário para admin
export const sendMessageToAdmin = async (req: Request, res: Response) => {
  console.log('📨 sendMessageToAdmin chamado');
  console.log('📨 Dados recebidos:', req.body);
  
  try {
    const { title, message, isUrgent } = req.body;
    const userEmail = (req as any).userEmail;

    if (!title || !message) {
      return res.status(400).json({ 
        message: 'Título e mensagem são obrigatórios.' 
      });
    }

    if (!userEmail) {
      return res.status(401).json({ 
        message: 'Usuário não autenticado.' 
      });
    }

    const messageId = Date.now().toString() + Math.random().toString(36).substr(2, 9);

    if (dbManager.isConnected) {
      if (dbManager.dbType === 'postgresql') {
        await dbManager.query(
          `INSERT INTO messages (id, from_admin, from_user_email, to_admin, title, message, is_urgent, created_at) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
          [messageId, false, userEmail, true, title, message, isUrgent || false]
        );
      } else {
        await dbManager.query(
          `INSERT INTO messages (id, from_admin, from_user_email, to_admin, title, message, is_urgent) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [messageId, 0, userEmail, 1, title, message, isUrgent ? 1 : 0]
        );
      }

      console.log('✅ Mensagem para admin salva no banco:', messageId);
    } else {
      // Fallback para memória
      const newMessage = {
        id: messageId,
        from_admin: false,
        from_user_email: userEmail,
        to_user_email: null,
        to_admin: true,
        title,
        message,
        is_urgent: isUrgent || false,
        is_read: false,
        created_at: new Date().toISOString()
      };

      memoryMessages.push(newMessage);
      console.log('✅ Mensagem para admin salva em memória:', messageId);
    }

    // 🔔 NOTIFICAÇÃO WEBSOCKET: Notificar admins sobre nova mensagem
    try {
      if (webSocketService) {
        webSocketService.notifyAdmins({
          id: messageId,
          from_user_email: userEmail,
          title,
          message,
          is_urgent: isUrgent || false,
          created_at: new Date().toISOString()
        });
        console.log('🔔 Notificação WebSocket enviada para admins');
      }
    } catch (error) {
      console.log('⚠️ Erro ao enviar notificação WebSocket:', error);
    }

    res.status(201).json({ 
      success: true,
      message: 'Mensagem enviada para o administrador com sucesso.',
      messageId 
    });

  } catch (error) {
    console.error('❌ Erro ao enviar mensagem para admin:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor ao enviar mensagem.' 
    });
  }
};

// Buscar mensagens para um usuário específico
export const getMessagesForUser = async (req: Request, res: Response) => {
  try {
    const userEmail = (req as any).userEmail;

    if (!userEmail) {
      return res.status(401).json({ message: 'Usuário não autenticado.' });
    }

    if (dbManager.isConnected) {
      const result = await dbManager.query(
        `SELECT id, title, message, is_urgent, is_read, created_at 
         FROM messages 
         WHERE to_user_email = $1 
         ORDER BY created_at DESC`,
        [userEmail]
      );

      res.json({ 
        messages: result.rows || []
      });
    } else {
      // Buscar em memória
      const userMessages = memoryMessages.filter(msg => msg.to_user_email === userEmail);
      res.json({ 
        messages: userMessages
      });
    }

  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor ao buscar mensagens.' 
    });
  }
};

// Marcar mensagem como lida
export const markMessageAsRead = async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;
    const userEmail = (req as any).userEmail;

    if (!userEmail) {
      return res.status(401).json({ message: 'Usuário não autenticado.' });
    }

    if (dbManager.isConnected) {
      await dbManager.query(
        `UPDATE messages 
         SET is_read = TRUE 
         WHERE id = $1 AND to_user_email = $2`,
        [messageId, userEmail]
      );
    } else {
      // Marcar como lida em memória
      const messageIndex = memoryMessages.findIndex(msg => 
        msg.id === messageId && msg.to_user_email === userEmail
      );
      if (messageIndex !== -1) {
        memoryMessages[messageIndex].is_read = true;
      }
    }

    res.json({ 
      success: true,
      message: 'Mensagem marcada como lida.' 
    });

  } catch (error) {
    console.error('Erro ao marcar mensagem como lida:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor.' 
    });
  }
};

// Buscar estatísticas de mensagens (para admin)
export const getMessageStats = async (req: Request, res: Response) => {
  try {
    if (dbManager.isConnected) {
      const totalResult = await dbManager.query('SELECT COUNT(*) as total FROM messages');
      const unreadResult = await dbManager.query('SELECT COUNT(*) as unread FROM messages WHERE is_read = FALSE');
      const urgentResult = await dbManager.query('SELECT COUNT(*) as urgent FROM messages WHERE is_urgent = TRUE AND is_read = FALSE');

      res.json({
        total: parseInt(totalResult.rows?.[0]?.total || '0'),
        unread: parseInt(unreadResult.rows?.[0]?.unread || '0'),
        urgent: parseInt(urgentResult.rows?.[0]?.urgent || '0')
      });
    } else {
      // Estatísticas em memória
      const total = memoryMessages.length;
      const unread = memoryMessages.filter(msg => !msg.is_read).length;
      const urgent = memoryMessages.filter(msg => msg.is_urgent && !msg.is_read).length;

      res.json({
        total,
        unread,
        urgent
      });
    }

  } catch (error) {
    console.error('Erro ao buscar estatísticas de mensagens:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor.' 
    });
  }
};

// Endpoint de teste para gerar token mock (apenas quando DB não conectado)
export const getTestToken = async (req: Request, res: Response) => {
  if (dbManager.isConnected) {
    return res.status(403).json({ message: 'Endpoint de teste disponível apenas sem conexão DB.' });
  }

  // Token JWT simples para teste (não usar em produção)
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
    message: 'Token de teste gerado (válido apenas para desenvolvimento)'
  });
};

// Função para admins visualizarem todas as mensagens
export const getMessagesForAdmin = async (req: Request, res: Response) => {
  try {
    if (!dbManager.isConnected) {
      // Retornar mensagens de memória quando DB não está conectado
      return res.json({
        success: true,
        messages: memoryMessages.map(msg => ({
          id: msg.id,
          senderId: msg.from_user_email || 'system',
          senderType: msg.from_admin ? 'admin' : 'client',
          senderName: msg.from_admin ? 'Admin' : 'Cliente',
          senderEmail: msg.from_user_email || '',
          content: msg.message,
          createdAt: msg.timestamp,
          readAt: msg.read ? msg.timestamp : null,
          isRead: msg.read
        })),
        total: memoryMessages.length
      });
    }
    
    // Buscar todas as mensagens com informações do usuário
    const messagesResult = await dbManager.query(
      `SELECT 
        m.id,
        m.sender_id,
        m.sender_type,
        m.content,
        m.created_at,
        m.read_at,
        u.name as sender_name,
        u.email as sender_email
       FROM messages m
       LEFT JOIN users u ON m.sender_id = u.id
       ORDER BY m.created_at DESC`,
      []
    );

    // Formatar as mensagens
    const formattedMessages = (messagesResult.rows || messagesResult).map(msg => ({
      id: msg.id,
      senderId: msg.sender_id,
      senderType: msg.sender_type,
      senderName: msg.sender_name || 'Usuário não identificado',
      senderEmail: msg.sender_email || '',
      content: msg.content,
      createdAt: msg.created_at,
      readAt: msg.read_at,
      isRead: !!msg.read_at
    }));

    res.json({
      success: true,
      messages: formattedMessages,
      total: formattedMessages.length
    });
  } catch (error) {
    console.error('Erro ao buscar mensagens para admin:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// === FUNÇÕES ESPECÍFICAS PARA PROVIDERS ===

// Provider envia mensagem para cliente
export const sendProviderMessage = async (req: Request, res: Response) => {
  try {
    const { clientEmail, title, message } = req.body;
    const providerEmail = (req as any).user?.email;
    
    if (!clientEmail || !message) {
      return res.status(400).json({ 
        error: 'Email do cliente e mensagem são obrigatórios' 
      });
    }

    if (!dbManager.isConnected) {
      // Fallback para memória
      const newMessage = {
        id: Date.now().toString(),
        from_admin: false,
        from_user_email: providerEmail,
        to_user_email: clientEmail,
        to_admin: false,
        title: title || 'Mensagem do Prestador',
        message,
        timestamp: new Date().toISOString(),
        read: false,
        urgent: false,
        category: 'provider_message'
      };
      
      memoryMessages.push(newMessage);
      
      // Notificação WebSocket para o cliente
      if (webSocketService) {
        webSocketService.sendNotificationToUser(clientEmail, {
          type: 'newMessage',
          title: `Nova mensagem do prestador`,
          message: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
          timestamp: new Date().toISOString()
        });
      }
      
      return res.json({
        success: true,
        messageId: newMessage.id,
        message: 'Mensagem enviada com sucesso!'
      });
    }

    // Verificar se cliente existe
    const clientResult = await dbManager.query(
      'SELECT id, name FROM users WHERE email = $1',
      [clientEmail]
    );
    
    const clientData = clientResult.rows ? clientResult.rows[0] : clientResult[0];
    if (!clientData) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    // Obter dados do provider
    const providerResult = await dbManager.query(
      'SELECT id, name FROM users WHERE email = $1',
      [providerEmail]
    );
    
    const providerData = providerResult.rows ? providerResult.rows[0] : providerResult[0];

    // Inserir mensagem
    const insertResult = await dbManager.query(
      `INSERT INTO messages (sender_id, sender_type, recipient_id, recipient_type, content, title)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, created_at`,
      [providerData?.id, 'provider', clientData.id, 'client', message, title || 'Mensagem do Prestador']
    );

    const messageData = insertResult.rows ? insertResult.rows[0] : insertResult[0];

    // Notificação WebSocket para o cliente
    if (webSocketService) {
      webSocketService.sendNotificationToUser(clientEmail, {
        type: 'newMessage',
        title: `Nova mensagem de ${providerData?.name || 'Prestador'}`,
        message: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
        timestamp: messageData.created_at
      });
    }

    res.json({
      success: true,
      messageId: messageData.id,
      message: 'Mensagem enviada com sucesso!'
    });

  } catch (error) {
    console.error('Erro ao enviar mensagem do provider:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Provider busca mensagens recebidas de clientes
export const getProviderMessages = async (req: Request, res: Response) => {
  try {
    const providerEmail = (req as any).user?.email;
    
    if (!dbManager.isConnected) {
      // Fallback para memória - filtrar mensagens do provider
      const providerMessages = memoryMessages.filter(msg => 
        msg.to_user_email === providerEmail || msg.from_user_email === providerEmail
      );
      
      return res.json({
        success: true,
        messages: providerMessages.map(msg => ({
          id: msg.id,
          title: msg.title,
          content: msg.message,
          from: msg.from_user_email,
          to: msg.to_user_email,
          timestamp: msg.timestamp,
          isRead: msg.read,
          category: msg.category || 'general'
        })),
        total: providerMessages.length
      });
    }

    // Buscar mensagens do banco onde o provider é remetente ou destinatário
    const messagesResult = await dbManager.query(
      `SELECT 
        m.id,
        m.title,
        m.content,
        m.created_at,
        m.read_at,
        m.sender_type,
        m.recipient_type,
        sender.email as sender_email,
        sender.name as sender_name,
        recipient.email as recipient_email,
        recipient.name as recipient_name
       FROM messages m
       LEFT JOIN users sender ON m.sender_id = sender.id
       LEFT JOIN users recipient ON m.recipient_id = recipient.id
       WHERE sender.email = $1 OR recipient.email = $1
       ORDER BY m.created_at DESC`,
      [providerEmail]
    );

    const messages = messagesResult.rows || messagesResult;
    
    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      title: msg.title,
      content: msg.content,
      senderEmail: msg.sender_email,
      senderName: msg.sender_name,
      recipientEmail: msg.recipient_email,
      recipientName: msg.recipient_name,
      timestamp: msg.created_at,
      isRead: !!msg.read_at,
      direction: msg.sender_email === providerEmail ? 'sent' : 'received'
    }));

    res.json({
      success: true,
      messages: formattedMessages,
      total: formattedMessages.length
    });

  } catch (error) {
    console.error('Erro ao buscar mensagens do provider:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Provider responde mensagem de cliente
export const replyToClient = async (req: Request, res: Response) => {
  try {
    const { originalMessageId, clientEmail, message } = req.body;
    const providerEmail = (req as any).user?.email;
    
    if (!clientEmail || !message) {
      return res.status(400).json({ 
        error: 'Email do cliente e mensagem são obrigatórios' 
      });
    }

    if (!dbManager.isConnected) {
      // Fallback para memória
      const newMessage = {
        id: Date.now().toString(),
        from_admin: false,
        from_user_email: providerEmail,
        to_user_email: clientEmail,
        to_admin: false,
        title: 'Resposta do Prestador',
        message,
        timestamp: new Date().toISOString(),
        read: false,
        urgent: false,
        category: 'provider_reply'
      };
      
      memoryMessages.push(newMessage);
      
      // Notificação WebSocket
      if (webSocketService) {
        webSocketService.sendNotificationToUser(clientEmail, {
          type: 'newMessage',
          title: 'Resposta do prestador',
          message: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
          timestamp: new Date().toISOString()
        });
      }
      
      return res.json({
        success: true,
        messageId: newMessage.id,
        message: 'Resposta enviada com sucesso!'
      });
    }

    // Verificar mensagem original se fornecida
    if (originalMessageId) {
      const originalResult = await dbManager.query(
        'SELECT id, title FROM messages WHERE id = $1',
        [originalMessageId]
      );
      
      if (!originalResult.rows?.[0] && !originalResult[0]) {
        return res.status(404).json({ error: 'Mensagem original não encontrada' });
      }
    }

    // Obter IDs dos usuários
    const clientResult = await dbManager.query(
      'SELECT id, name FROM users WHERE email = $1',
      [clientEmail]
    );
    
    const providerResult = await dbManager.query(
      'SELECT id, name FROM users WHERE email = $1',
      [providerEmail]
    );
    
    const clientData = clientResult.rows ? clientResult.rows[0] : clientResult[0];
    const providerData = providerResult.rows ? providerResult.rows[0] : providerResult[0];

    if (!clientData) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    // Inserir resposta
    const insertResult = await dbManager.query(
      `INSERT INTO messages (sender_id, sender_type, recipient_id, recipient_type, content, title)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, created_at`,
      [providerData?.id, 'provider', clientData.id, 'client', message, 'Resposta do Prestador']
    );

    const messageData = insertResult.rows ? insertResult.rows[0] : insertResult[0];

    // Notificação WebSocket
    if (webSocketService) {
      webSocketService.sendNotificationToUser(clientEmail, {
        type: 'newMessage',
        title: `Resposta de ${providerData?.name || 'Prestador'}`,
        message: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
        timestamp: messageData.created_at
      });
    }

    res.json({
      success: true,
      messageId: messageData.id,
      message: 'Resposta enviada com sucesso!'
    });

  } catch (error) {
    console.error('Erro ao responder cliente:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};