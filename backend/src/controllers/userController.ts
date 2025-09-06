import { Request, Response } from 'express';
import pool from '../db';
import { User } from '../types';


export const updateUser = async (req: Request, res: Response) => {
    const { email } = req.params;
    const { name, phone, cep, services, profilePictureBase64 }: User = req.body;
    const requesterEmail = (req as any).userEmail;

    if (!requesterEmail || requesterEmail.toLowerCase() !== email.toLowerCase()) {
        return res.status(403).json({ message: 'Não autorizado a atualizar este usuário.' });
    }
  
    try {
        const result = await pool.query(
            'UPDATE users SET name = $1, phone = $2, cep = $3, services = $4, "profilePictureBase64" = $5 WHERE email = $6 RETURNING *',
            [name, phone, cep, services, profilePictureBase64, email.toLowerCase()]
        );
        
        if (result.rowCount === 0) {
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
        const result = await pool.query('DELETE FROM users WHERE email = $1 RETURNING email', [email.toLowerCase()]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }
        res.status(200).json({ message: 'Usuário deletado.', email: result.rows[0].email });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ message: 'Erro ao deletar usuário.' });
    }
};