import { Request, Response } from 'express';
import { dbManager } from '../db-enhanced';

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
        `SELECT id, title, message, is_urgent, is_read, created_at, from_admin
         FROM messages 
         WHERE to_user_email = ? OR (to_admin = ? AND from_user_email = ?)
         ORDER BY created_at DESC`,
        [userEmail, 1, userEmail]
      );

      res.json({ 
        messages: result.rows || []
      });
    } else {
      // Buscar em memória
      const userMessages = memoryMessages.filter(msg => 
        msg.to_user_email === userEmail || (msg.to_admin && msg.from_user_email === userEmail)
      );
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
         SET is_read = ? 
         WHERE id = ? AND (to_user_email = ? OR from_user_email = ?)`,
        [1, messageId, userEmail, userEmail]
      );
    } else {
      // Marcar como lida em memória
      const messageIndex = memoryMessages.findIndex(msg => 
        msg.id === messageId && (msg.to_user_email === userEmail || msg.from_user_email === userEmail)
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
      const unreadResult = await dbManager.query('SELECT COUNT(*) as unread FROM messages WHERE is_read = 0');
      const urgentResult = await dbManager.query('SELECT COUNT(*) as urgent FROM messages WHERE is_urgent = 1 AND is_read = 0');

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

// NOVA FUNCIONALIDADE: Buscar mensagens para admin (todas)
export const getMessagesForAdmin = async (req: Request, res: Response) => {
  try {
    if (dbManager.isConnected) {
      const result = await dbManager.query(
        `SELECT id, title, message, is_urgent, is_read, created_at, from_admin, 
                from_user_email, to_user_email, to_admin
         FROM messages 
         ORDER BY created_at DESC 
         LIMIT 100`
      );

      res.json({ 
        messages: result.rows || []
      });
    } else {
      // Buscar em memória (últimas 100)
      const adminMessages = memoryMessages
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 100);
      
      res.json({ 
        messages: adminMessages
      });
    }

  } catch (error) {
    console.error('Erro ao buscar mensagens para admin:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor ao buscar mensagens.' 
    });
  }
};

// Endpoint de teste para gerar token mock (apenas quando DB não conectado)
export const getTestToken = async (req: Request, res: Response) => {
  if (dbManager.isConnected && dbManager.dbType === 'postgresql') {
    return res.status(403).json({ message: 'Endpoint de teste disponível apenas sem conexão PostgreSQL.' });
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