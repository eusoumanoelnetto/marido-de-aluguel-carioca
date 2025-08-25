import { Request, Response } from 'express';
import pool from '../db';
import { User } from '../types';


export const updateUser = async (req: Request, res: Response) => {
    const { email } = req.params;
    const { name, phone, cep, services, profilePictureBase64 }: User = req.body;
  
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