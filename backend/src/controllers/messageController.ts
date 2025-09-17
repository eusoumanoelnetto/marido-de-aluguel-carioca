import { Request, Response } from 'express';
import pool, { isDbConnected } from '../db';
import { v4 as uuidv4 } from 'uuid';

export const sendMessage = async (req: Request, res: Response) => {
  // Diagnostic logs
  try { console.log('sendMessage: NODE_ENV=', process.env.NODE_ENV); } catch {}
  try { console.log('sendMessage: headers=', JSON.stringify(req.headers)); } catch {}
  try { console.log('sendMessage: body=', JSON.stringify(req.body)); } catch {}
  try { console.log('sendMessage: isDbConnected=', Boolean(isDbConnected)); } catch {}

  const { serviceId, recipientEmail, content } = req.body as { serviceId: string; recipientEmail: string; content: string };
  const senderEmail = (req as any).userEmail as string | undefined;
  if (!senderEmail) return res.status(401).json({ message: 'Não autenticado.' });
  if (!serviceId || !recipientEmail || !content) return res.status(400).json({ message: 'Dados da mensagem incompletos.' });

  const id = uuidv4();
  const createdAt = new Date().toISOString();
  try {
    // Debug logging to help diagnose intermittent 500 errors
    try { console.log('sendMessage: incoming', { serviceId, recipientEmail, contentLength: content?.length, senderEmail }); } catch {}
    try { const db = (pool as any); console.log('sendMessage: isDbConnected flag?', db && db.query ? true : 'unknown'); } catch {}
    const result = await pool.query(
      'INSERT INTO messages (id, "serviceId", "senderEmail", "recipientEmail", content, "createdAt") VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [id, serviceId, senderEmail, recipientEmail, content, createdAt]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    let errorMsg = '';
    if (error instanceof Error) {
      errorMsg = error.stack || error.message;
    } else {
      errorMsg = String(error);
    }
    console.error('Error inserting message:', errorMsg);
    // Return more context in dev environment to help debugging (but keep generic in prod)
    if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production') {
      res.status(500).json({ message: 'Erro ao enviar mensagem.' });
    } else {
      res.status(500).json({ message: 'Erro ao enviar mensagem.', error: errorMsg });
    }
  }
};

export const listMessagesByService = async (req: Request, res: Response) => {
  const { serviceId } = req.params;
  const userEmail = (req as any).userEmail as string | undefined;
  if (!userEmail) return res.status(401).json({ message: 'Não autenticado.' });
  if (!serviceId) return res.status(400).json({ message: 'serviceId é obrigatório.' });
  try {
    const result = await pool.query('SELECT * FROM messages WHERE "serviceId" = $1 ORDER BY "createdAt" ASC', [serviceId]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error listing messages:', error);
    res.status(500).json({ message: 'Erro ao listar mensagens.' });
  }
};

export const listRecentByUser = async (req: Request, res: Response) => {
  const userEmail = (req as any).userEmail as string | undefined;
  if (!userEmail) return res.status(401).json({ message: 'Não autenticado.' });
  try {
    const result = await pool.query('SELECT * FROM messages WHERE "senderEmail" = $1 OR "recipientEmail" = $1 ORDER BY "createdAt" DESC LIMIT 100', [userEmail]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error listing user messages:', error);
    res.status(500).json({ message: 'Erro ao listar mensagens do usuário.' });
  }
};
