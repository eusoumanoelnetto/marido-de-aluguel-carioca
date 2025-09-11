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
    // Verificar se as chaves VAPID estão configuradas
    const vapid = {
      subject: process.env.VAPID_SUBJECT || 'mailto:dev@example.com',
      publicKey: process.env.VAPID_PUBLIC_KEY || '',
      privateKey: process.env.VAPID_PRIVATE_KEY || ''
    };

    if (!vapid.publicKey || !vapid.privateKey) {
      console.error('❌ Chaves VAPID não configuradas nas variáveis de ambiente');
      return res.status(500).json({ 
        message: 'Erro de configuração: chaves VAPID não encontradas',
        error: 'VAPID keys missing' 
      });
    }

    console.log('🔧 Configurando VAPID...');
    webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);

    console.log('📱 Buscando subscriptions...');
    const rows = await pool.query('SELECT * FROM push_subscriptions');
    const subs = rows.rows || [];
    
    console.log(`📊 Encontradas ${subs.length} subscriptions`);

    if (subs.length === 0) {
      return res.status(200).json({ 
        message: 'Nenhum usuário inscrito para push notifications ainda',
        results: [] 
      });
    }

    const payload = JSON.stringify({ title, body });
    const results = [];
    
    console.log('🚀 Enviando notificações...');
    for (const s of subs) {
      try {
        const sub = {
          endpoint: s.endpoint,
          keys: { p256dh: s.keys_p256dh, auth: s.keys_auth }
        };
        await webpush.sendNotification(sub, payload);
        results.push({ endpoint: s.endpoint, status: 'sent' });
        console.log(`✅ Enviado para: ${s.endpoint.substring(0, 50)}...`);
      } catch (e: any) {
        console.error(`❌ Erro ao enviar para ${s.endpoint.substring(0, 50)}...`, e.message);
        results.push({ endpoint: s.endpoint, status: 'error', error: e.message });
      }
    }
    
    const sentCount = results.filter(r => r.status === 'sent').length;
    console.log(`📈 Resultado: ${sentCount}/${results.length} notificações enviadas com sucesso`);
    
    res.status(200).json({ results });
  } catch (err: any) {
    console.error('💥 Erro geral ao enviar push:', err);
    res.status(500).json({ 
      message: 'Erro ao enviar push notifications', 
      error: err.message || 'Unknown error' 
    });
  }
};

export const getPublicKey = async (req: Request, res: Response) => {
  res.status(200).json({ publicKey: process.env.VAPID_PUBLIC_KEY || '' });
};
