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

  try {
    const userExists = await pool.query('SELECT 1 FROM users WHERE email = $1', [email.toLowerCase()]);

    if (userExists.rowCount) {
      return res.status(409).json({ message: 'Este e-mail já está cadastrado.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Por segurança, impedir criação de admin via signUp público
    const safeRole = role === 'admin' ? 'client' : role;
    const result = await pool.query(
      'INSERT INTO users (name, email, phone, role, cep, password, services) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [name, email.toLowerCase(), phone, safeRole, cep, hashedPassword, services]
    );

    const newUser: User = result.rows[0];
  delete newUser.password; // Don't send password hash back

  // generate token
  const secret = process.env.JWT_SECRET || 'dev_secret';
  const token = jwt.sign({ email: newUser.email, role: newUser.role }, secret, { expiresIn: '7d' });

  console.log('New user signed up:', newUser.email);
  res.status(201).json({ user: newUser, token });
  } catch (error) {
    console.error('Sign up error:', error);
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
  // Log the attempting email (do not log the password)
  console.debug('Attempting login for:', normalizedEmail);

  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [normalizedEmail]
  );
    
    if (result.rowCount === 0) {
        return res.status(401).json({ message: 'E-mail ou senha inválidos.' });
    }

    const user: User = result.rows[0];

    // Ensure user.password exists before comparing
    if (!user.password) {
        return res.status(401).json({ message: 'E-mail ou senha inválidos.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

  if (isMatch) {
    delete user.password; // Don't send password hash to client
    const secret = process.env.JWT_SECRET || 'dev_secret';
  const token = jwt.sign({ email: user.email, role: user.role }, secret, { expiresIn: '7d' });
    console.log('User logged in:', user.email);
    res.status(200).json({ user, token });
  } else {
    res.status(401).json({ message: 'E-mail ou senha inválidos.' });
  }
  } catch (error) {
  // Log the full error stack to help debugging
  const errAny: any = error;
  console.error('Login error:', errAny?.stack || errAny);
  res.status(500).json({ message: 'Erro interno do servidor ao tentar fazer login.' });
  }
};