import { Request, Response } from 'express';
import pool from '../db';
import { User } from '../types';
import bcrypt from 'bcryptjs';


export const updateUser = async (req: Request, res: Response) => {
    const { email } = req.params;
    const { name, phone, cep, services, profilePictureBase64 }: User = req.body;
    const requesterEmail = (req as any).userEmail;

    const requesterRole = (req as any).userRole;
    if (!(requesterRole === 'admin') && (!requesterEmail || requesterEmail.toLowerCase() !== email.toLowerCase())) {
        return res.status(403).json({ message: 'Não autorizado a atualizar este usuário.' });
    }
  
    try {
        const result = await pool.query(
            'UPDATE users SET name = $1, phone = $2, cep = $3, services = $4, "profilePictureBase64" = $5 WHERE email = $6 RETURNING *',
            [name, phone, cep, services, profilePictureBase64, email.toLowerCase()]
        );
        
        if ((result.rowCount ?? 0) === 0) {
            res.status(404).json({ message: 'Usuário não encontrado.' });
            return;
        }

        const updatedUser = result.rows[0];
        console.log('User updated:', updatedUser.email);
        res.status(200).json(updatedUser);

    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao atualizar usuário.' });
    }
};

// Lista todos os usuários (apenas admin)
export const listUsers = async (req: Request, res: Response) => {
    const role = (req as any).userRole;
    if (role !== 'admin') {
        return res.status(403).json({ message: 'Acesso negado. Apenas administradores.' });
    }

    try {
        const result = await pool.query('SELECT name, email, phone, role, cep, "profilePictureBase64" AS "profilePictureBase64", services FROM users');
        res.status(200).json({ users: result.rows });
    } catch (error) {
        console.error('List users error:', error);
        res.status(500).json({ message: 'Erro interno ao listar usuários.' });
    }
};

// Deleta um usuário por email (apenas admin)
export const deleteUser = async (req: Request, res: Response) => {
    const role = (req as any).userRole;
    const { email } = req.params;
    if (role !== 'admin') {
        return res.status(403).json({ message: 'Acesso negado. Apenas administradores.' });
    }

        try {
                // Buscar dados do usuário antes de deletar
                const userRes = await pool.query('SELECT name, email FROM users WHERE email = $1', [email.toLowerCase()]);
                if ((userRes.rowCount ?? 0) === 0) {
                        return res.status(404).json({ message: 'Usuário não encontrado.' });
                }
                const user = userRes.rows[0];
                                const result = await pool.query('DELETE FROM users WHERE email = $1 RETURNING email', [email.toLowerCase()]);
                                // Enviar email de notificação de exclusão
                                try {
                                        const { sendUserDeletedEmail } = await import('../utils/mailer');
                                        await sendUserDeletedEmail(user.email, user.name);
                                } catch (mailErr) {
                                        console.error('Erro ao enviar email de exclusão:', mailErr);
                                }
                                // Enviar push notification se houver subscription
                                try {
                                    const rows = await pool.query('SELECT * FROM push_subscriptions WHERE endpoint LIKE $1', [ '%' + user.email + '%' ]);
                                    if (rows.rowCount && rows.rows.length > 0) {
                                        const { default: webpush } = await import('web-push');
                                        const vapid = {
                                            subject: process.env.VAPID_SUBJECT || 'mailto:dev@example.com',
                                            publicKey: process.env.VAPID_PUBLIC_KEY || '',
                                            privateKey: process.env.VAPID_PRIVATE_KEY || ''
                                        };
                                        webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);
                                        const payload = JSON.stringify({ title: 'Conta excluída', body: 'Sua conta foi excluída do sistema. Entre em contato com o suporte.' });
                                        for (const s of rows.rows) {
                                            const sub = {
                                                endpoint: s.endpoint,
                                                keys: { p256dh: s.keys_p256dh, auth: s.keys_auth }
                                            };
                                            try {
                                                await webpush.sendNotification(sub, payload);
                                            } catch (e) {
                                                console.error('Erro ao enviar push de exclusão:', e);
                                            }
                                        }
                                    }
                                } catch (pushErr) {
                                    console.error('Erro ao tentar enviar push de exclusão:', pushErr);
                                }
                                res.status(200).json({ message: 'Usuário deletado.', email: result.rows[0].email });
        } catch (error) {
                console.error('Delete user error:', error);
                res.status(500).json({ message: 'Erro ao deletar usuário.' });
        }
};

// Lista eventos recentes para admin (opcional)
export const getAdminEvents = async (req: Request, res: Response) => {
    const role = (req as any).userRole;
    if (role !== 'admin') {
        return res.status(403).json({ message: 'Acesso negado. Apenas administradores.' });
    }

    try {
        console.log('📋 Buscando eventos admin...');
        const result = await pool.query(
            'SELECT * FROM admin_events ORDER BY created_at DESC LIMIT 20'
        );
        console.log(`📋 Encontrados ${result.rows.length} eventos:`, result.rows.map(r => r.event_type));
        res.status(200).json({ events: result.rows });
    } catch (error) {
        console.log('❌ Erro ao buscar eventos admin:', error);
        // Table may not exist
        res.status(200).json({ events: [] });
    }
};

// Redefine a senha de um usuário (apenas admin)
export const resetPassword = async (req: Request, res: Response) => {
    const role = (req as any).userRole;
    const { email } = req.params;
    const { password } = req.body as { password?: string };
    if (role !== 'admin') {
        return res.status(403).json({ message: 'Acesso negado. Apenas administradores.' });
    }
    if (!password || String(password).length < 6) {
        return res.status(400).json({ message: 'Senha inválida. Informe ao menos 6 caracteres.' });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(String(password), salt);
        const result = await pool.query('UPDATE users SET password = $1 WHERE email = $2 RETURNING email', [hashed, email.toLowerCase()]);
        if ((result.rowCount ?? 0) === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }
        res.status(200).json({ message: 'Senha redefinida com sucesso.', email: result.rows[0].email });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Erro ao redefinir senha.' });
    }
};