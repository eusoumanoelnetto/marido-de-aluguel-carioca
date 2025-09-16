import { Request, Response } from 'express';
import pool from '../db';
import { User, SignUpData } from '../types';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const signUp = async (req: Request, res: Response) => {
  const data: SignUpData = req.body;
  const { name, email, phone, role, cep, password, services } = data;

  if (!password) {
    return res.status(400).json({ message: 'A senha é obrigatória.' });
  }

  const normalizedEmail = String(email || '').trim().toLowerCase();

  try {
    const userExists = await pool.query('SELECT 1 FROM users WHERE email = $1', [normalizedEmail]);

    if (userExists.rowCount && userExists.rowCount > 0) {
      return res.status(409).json({ message: 'Este e-mail já está cadastrado.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Por segurança, impedir criação de admin via signUp público
    const safeRole = role === 'admin' ? 'client' : role;
    const servicesValue = services ?? null;

    const result = await pool.query(
      'INSERT INTO users (name, email, phone, role, cep, password, services) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [name, normalizedEmail, phone, safeRole, cep, hashedPassword, servicesValue]
    );

    const newUser: User = result.rows[0];
    delete (newUser as any).password; // Don't send password hash back

    // generate token (include id when available)
    const secret = process.env.JWT_SECRET || 'dev_secret';
    const token = jwt.sign({ id: (newUser as any).id, email: newUser.email, role: newUser.role }, secret, { expiresIn: '7d' });

    if (process.env.NODE_ENV !== 'production') {
      console.log('New user signed up:', newUser.email);
    }

    // Log event for admin notifications (try to insert into admin_events table if exists)
    try {
      await pool.query(
        'INSERT INTO admin_events (event_type, data, created_at) VALUES ($1, $2, NOW())',
        ['user_signup', JSON.stringify({ name: newUser.name, email: newUser.email, role: newUser.role })]
      );
    } catch (eventError) {
      // Table may not exist yet; ignore silently
    }

    res.status(201).json({ user: newUser, token });
  } catch (error: any) {
    // handle unique constraint race condition explicitly
    if (error?.code === '23505') {
      return res.status(409).json({ message: 'Este e-mail já está cadastrado.' });
    }
    console.error('Sign up error:', error?.stack || error);
    res.status(500).json({ message: 'Erro interno do servidor ao tentar cadastrar.' });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!password) {
      return res.status(400).json({ message: 'A senha é obrigatória.' });
  }

  if (!email) {
    return res.status(400).json({ message: 'O e-mail é obrigatório.' });
  }

  try {
    const normalizedEmail = String(email).trim().toLowerCase();
    // Log the attempting email only in non-production
    if (process.env.NODE_ENV !== 'production') {
      console.debug('Attempting login for:', normalizedEmail);
    }

    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [normalizedEmail]
    );

    if ((result.rowCount ?? 0) === 0) {
      return res.status(401).json({ message: 'E-mail ou senha inválidos.' });
    }

    const user: User = result.rows[0];

    // Ensure user.password exists before comparing
    if (!user.password) {
      return res.status(401).json({ message: 'E-mail ou senha inválidos.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      delete (user as any).password; // Don't send password hash to client
      const secret = process.env.JWT_SECRET || 'dev_secret';
      const token = jwt.sign({ id: (user as any).id, email: user.email, role: user.role }, secret, { expiresIn: '7d' });
      if (process.env.NODE_ENV !== 'production') {
        console.log('User logged in:', user.email);
      }
      try {
        // Atualiza última data de login
        await pool.query('UPDATE users SET last_login_at = NOW() WHERE email = $1', [user.email.toLowerCase()]);
      } catch (e) {
        console.warn('Falha ao atualizar last_login_at:', (e as any)?.message || e);
      }
      res.status(200).json({ user, token });
    } else {
      res.status(401).json({ message: 'E-mail ou senha inválidos.' });
    }
  } catch (error: any) {
    // Log the full error stack to help debugging
    console.error('Login error:', error?.stack || error);
    res.status(500).json({ message: 'Erro interno do servidor ao tentar fazer login.' });
  }
};