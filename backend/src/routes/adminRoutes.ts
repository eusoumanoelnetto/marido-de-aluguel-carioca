import express from 'express';
import { authenticate, adminAccess } from '../middleware/authMiddleware';
import { dbManager } from '../db-enhanced';

const router = express.Router();

// Dashboard principal - estatísticas gerais
router.get('/stats', adminAccess, async (req, res) => {
  try {
    if (!dbManager.isConnected) {
      // Estatísticas em memória
      return res.json({
        success: true,
        stats: {
          totalMessages: 5,
          unreadMessages: 2,
          totalUsers: 3,
          activeProviders: 1,
          messagesThisWeek: 3,
          messagesThisMonth: 5
        }
      });
    }

    // Estatísticas do banco
    const totalMessages = await dbManager.query('SELECT COUNT(*) as count FROM messages', []);
    const unreadMessages = await dbManager.query('SELECT COUNT(*) as count FROM messages WHERE read_at IS NULL', []);
    const totalUsers = await dbManager.query('SELECT COUNT(*) as count FROM users', []);
    const activeProviders = await dbManager.query('SELECT COUNT(*) as count FROM users WHERE role = ?', ['provider']);
    
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    
    const messagesThisWeek = await dbManager.query(
      'SELECT COUNT(*) as count FROM messages WHERE created_at > ?', 
      [weekAgo]
    );
    
    const messagesThisMonth = await dbManager.query(
      'SELECT COUNT(*) as count FROM messages WHERE created_at > ?', 
      [monthAgo]
    );

    res.json({
      success: true,
      stats: {
        totalMessages: (totalMessages.rows || totalMessages)[0].count,
        unreadMessages: (unreadMessages.rows || unreadMessages)[0].count,
        totalUsers: (totalUsers.rows || totalUsers)[0].count,
        activeProviders: (activeProviders.rows || activeProviders)[0].count,
        messagesThisWeek: (messagesThisWeek.rows || messagesThisWeek)[0].count,
        messagesThisMonth: (messagesThisMonth.rows || messagesThisMonth)[0].count
      }
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Histórico completo de mensagens com filtros
router.get('/messages', adminAccess, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      type = 'all', // all, client_to_admin, provider_to_client, admin_to_client
      status = 'all', // all, read, unread
      search = '',
      startDate = '',
      endDate = ''
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    if (!dbManager.isConnected) {
      // Dados mock para desenvolvimento
      const mockMessages = [
        {
          id: '1',
          senderName: 'João Silva',
          senderEmail: 'joao@teste.com',
          senderType: 'client',
          recipientName: 'Admin',
          recipientEmail: 'admin@sistema.com',
          recipientType: 'admin',
          title: 'Problema com torneira',
          content: 'Preciso de ajuda com o reparo da torneira da cozinha',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          readAt: null,
          isRead: false
        },
        {
          id: '2', 
          senderName: 'Maria Santos',
          senderEmail: 'maria@provider.com',
          senderType: 'provider',
          recipientName: 'Carlos Oliveira',
          recipientEmail: 'carlos@teste.com',
          recipientType: 'client',
          title: 'Orçamento aprovado',
          content: 'Confirmo o serviço para amanhã às 14h. Obrigada!',
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          readAt: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
          isRead: true
        }
      ];

      return res.json({
        success: true,
        messages: mockMessages,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: mockMessages.length,
          pages: Math.ceil(mockMessages.length / Number(limit))
        },
        filters: { type, status, search, startDate, endDate }
      });
    }

    // Construir query dinâmica baseada nos filtros
    let baseQuery = `
      SELECT 
        m.id,
        m.title,
        m.content,
        m.created_at,
        m.read_at,
        m.sender_type,
        m.recipient_type,
        sender.name as sender_name,
        sender.email as sender_email,
        recipient.name as recipient_name,
        recipient.email as recipient_email
      FROM messages m
      LEFT JOIN users sender ON m.sender_id = sender.id
      LEFT JOIN users recipient ON m.recipient_id = recipient.id
      WHERE 1=1
    `;
    
    const queryParams: any[] = [];
    let paramIndex = 1;

    // Filtro por tipo
    if (type !== 'all') {
      switch (type) {
        case 'client_to_admin':
          baseQuery += ` AND m.sender_type = $${paramIndex++} AND m.recipient_type = $${paramIndex++}`;
          queryParams.push('client', 'admin');
          break;
        case 'provider_to_client':
          baseQuery += ` AND m.sender_type = $${paramIndex++} AND m.recipient_type = $${paramIndex++}`;
          queryParams.push('provider', 'client');
          break;
        case 'admin_to_client':
          baseQuery += ` AND m.sender_type = $${paramIndex++} AND m.recipient_type = $${paramIndex++}`;
          queryParams.push('admin', 'client');
          break;
      }
    }

    // Filtro por status de leitura
    if (status !== 'all') {
      if (status === 'read') {
        baseQuery += ` AND m.read_at IS NOT NULL`;
      } else if (status === 'unread') {
        baseQuery += ` AND m.read_at IS NULL`;
      }
    }

    // Filtro por busca de texto
    if (search) {
      baseQuery += ` AND (m.title ILIKE $${paramIndex} OR m.content ILIKE $${paramIndex} OR sender.name ILIKE $${paramIndex} OR sender.email ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Filtro por data
    if (startDate) {
      baseQuery += ` AND m.created_at >= $${paramIndex++}`;
      queryParams.push(startDate);
    }
    
    if (endDate) {
      baseQuery += ` AND m.created_at <= $${paramIndex++}`;
      queryParams.push(endDate);
    }

    // Ordenação e paginação
    baseQuery += ` ORDER BY m.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    queryParams.push(Number(limit), offset);

    // Query para contar total
    const countQuery = baseQuery.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM').replace(/ORDER BY[\s\S]*$/, '');
    const countParams = queryParams.slice(0, -2); // Remove limit e offset

    const [messagesResult, countResult] = await Promise.all([
      dbManager.query(baseQuery, queryParams),
      dbManager.query(countQuery, countParams)
    ]);

    const messages = (messagesResult.rows || messagesResult).map((msg: any) => ({
      id: msg.id,
      senderName: msg.sender_name || 'Usuário não identificado',
      senderEmail: msg.sender_email || '',
      senderType: msg.sender_type,
      recipientName: msg.recipient_name || 'Destinatário não identificado',
      recipientEmail: msg.recipient_email || '',
      recipientType: msg.recipient_type,
      title: msg.title,
      content: msg.content,
      createdAt: msg.created_at,
      readAt: msg.read_at,
      isRead: !!msg.read_at
    }));

    const total = (countResult.rows || countResult)[0].total;

    res.json({
      success: true,
      messages,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: Number(total),
        pages: Math.ceil(Number(total) / Number(limit))
      },
      filters: { type, status, search, startDate, endDate }
    });

  } catch (error) {
    console.error('Erro ao buscar histórico de mensagens:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Detalhes de uma mensagem específica
router.get('/messages/:messageId', adminAccess, async (req, res) => {
  try {
    const { messageId } = req.params;

    if (!dbManager.isConnected) {
      // Mock data
      return res.json({
        success: true,
        message: {
          id: messageId,
          senderName: 'João Silva',
          senderEmail: 'joao@teste.com',
          senderType: 'client',
          recipientName: 'Admin',
          recipientEmail: 'admin@sistema.com',
          recipientType: 'admin',
          title: 'Detalhes da mensagem',
          content: 'Conteúdo completo da mensagem...',
          createdAt: new Date().toISOString(),
          readAt: null,
          isRead: false
        }
      });
    }

    const result = await dbManager.query(
      `SELECT 
        m.id,
        m.title,
        m.content,
        m.created_at,
        m.read_at,
        m.sender_type,
        m.recipient_type,
        sender.name as sender_name,
        sender.email as sender_email,
        recipient.name as recipient_name,
        recipient.email as recipient_email
      FROM messages m
      LEFT JOIN users sender ON m.sender_id = sender.id
      LEFT JOIN users recipient ON m.recipient_id = recipient.id
      WHERE m.id = $1`,
      [messageId]
    );

    const message = (result.rows || result)[0];
    
    if (!message) {
      return res.status(404).json({ error: 'Mensagem não encontrada' });
    }

    res.json({
      success: true,
      message: {
        id: message.id,
        senderName: message.sender_name || 'Usuário não identificado',
        senderEmail: message.sender_email || '',
        senderType: message.sender_type,
        recipientName: message.recipient_name || 'Destinatário não identificado',
        recipientEmail: message.recipient_email || '',
        recipientType: message.recipient_type,
        title: message.title,
        content: message.content,
        createdAt: message.created_at,
        readAt: message.read_at,
        isRead: !!message.read_at
      }
    });

  } catch (error) {
    console.error('Erro ao buscar detalhes da mensagem:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Marcar múltiplas mensagens como lidas
router.patch('/messages/mark-read', adminAccess, async (req, res) => {
  try {
    const { messageIds } = req.body;

    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({ error: 'IDs de mensagens são obrigatórios' });
    }

    if (!dbManager.isConnected) {
      return res.json({
        success: true,
        message: `${messageIds.length} mensagens marcadas como lidas`,
        updatedCount: messageIds.length
      });
    }

    const placeholders = messageIds.map((_, index) => `$${index + 1}`).join(',');
    const result = await dbManager.query(
      `UPDATE messages SET read_at = NOW() WHERE id IN (${placeholders}) AND read_at IS NULL`,
      messageIds
    );

    res.json({
      success: true,
      message: `Mensagens marcadas como lidas`,
      updatedCount: result.rowCount || 0
    });

  } catch (error) {
    console.error('Erro ao marcar mensagens como lidas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Relatório de atividade por período
router.get('/reports/activity', adminAccess, async (req, res) => {
  try {
    const { period = '7d' } = req.query; // 7d, 30d, 90d

    let days = 7;
    switch (period) {
      case '30d': days = 30; break;
      case '90d': days = 90; break;
      default: days = 7; break;
    }

    if (!dbManager.isConnected) {
      // Dados mock
      const mockData = Array.from({ length: days }, (_, i) => ({
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        messages: Math.floor(Math.random() * 10),
        users: Math.floor(Math.random() * 5)
      })).reverse();

      return res.json({
        success: true,
        period,
        data: mockData
      });
    }

    const result = await dbManager.query(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as messages,
        COUNT(DISTINCT sender_id) as users
      FROM messages 
      WHERE created_at >= NOW() - INTERVAL '$1 days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC`,
      [days]
    );

    res.json({
      success: true,
      period,
      data: result.rows || result
    });

  } catch (error) {
    console.error('Erro ao gerar relatório de atividade:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;