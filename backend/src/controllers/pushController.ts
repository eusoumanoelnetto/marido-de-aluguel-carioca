import { Request, Response } from 'express';
import webpush from 'web-push';
import pool from '../db';

// Save subscription to DB (in-memory fallback will store it)
export const saveSubscription = async (req: Request, res: Response) => {
  const subscription = req.body;
  if (!subscription || !subscription.endpoint) return res.status(400).json({ message: 'Subscription inválida.' });
  try {
    // For simplicity store in a simple table subscriptions (email optional)
    await pool.query('INSERT INTO push_subscriptions (endpoint, keys_p256dh, keys_auth) VALUES ($1, $2, $3)', [subscription.endpoint, subscription.keys?.p256dh, subscription.keys?.auth]);
    res.status(201).json({ message: 'Subscription salva.' });
  } catch (err) {
    console.error('Erro ao salvar subscription:', err);
    res.status(500).json({ message: 'Erro ao salvar subscription.' });
  }
};

export const sendTestPush = async (req: Request, res: Response) => {
  const { title = 'Teste', body = 'Mensagem de teste' } = req.body;
  try {
    const rows = await pool.query('SELECT * FROM push_subscriptions');
    const subs = rows.rows || [];
    const vapid = {
      subject: process.env.VAPID_SUBJECT || 'mailto:dev@example.com',
      publicKey: process.env.VAPID_PUBLIC_KEY || '',
      privateKey: process.env.VAPID_PRIVATE_KEY || ''
    };
    webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);
    const payload = JSON.stringify({ title, body });
    const results = [];
    for (const s of subs) {
      try {
        const sub = {
          endpoint: s.endpoint,
          keys: { p256dh: s.keys_p256dh, auth: s.keys_auth }
        };
        await webpush.sendNotification(sub, payload);
        results.push({ endpoint: s.endpoint, status: 'sent' });
      } catch (e) {
        results.push({ endpoint: s.endpoint, status: 'error', error: String(e) });
      }
    }
    res.status(200).json({ results });
  } catch (err) {
    console.error('Erro ao enviar push:', err);
    res.status(500).json({ message: 'Erro ao enviar push.' });
  }
};

export const getPublicKey = async (req: Request, res: Response) => {
  res.status(200).json({ publicKey: process.env.VAPID_PUBLIC_KEY || '' });
};
