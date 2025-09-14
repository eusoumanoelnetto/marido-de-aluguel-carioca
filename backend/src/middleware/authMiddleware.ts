
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dbClient from '../db';

interface JwtPayload {
  email: string;
  role?: string;
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('❌ Token ausente ou inválido na requisição para:', req.path);
    return res.status(401).json({ message: 'Token ausente ou inválido.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const secret = process.env.JWT_SECRET || 'dev_secret';
    const payload = jwt.verify(token, secret) as JwtPayload;
    console.log('✅ Token válido para usuário:', payload.email, 'role:', payload.role);
    
    // Checar se usuário ainda existe
    const userResult = await dbClient.query('SELECT 1 FROM users WHERE email = $1', [payload.email]);
    if (!userResult.rowCount) {
      console.log('❌ Usuário não existe mais:', payload.email);
      return res.status(401).json({ message: 'Usuário não existe mais.' });
    }
    // anexar email ao request para uso nas rotas
    (req as any).userEmail = payload.email;
    (req as any).userRole = payload.role;
    next();
  } catch (err) {
    console.log('❌ Token inválido:', err);
    return res.status(401).json({ message: 'Token inválido.' });
  }
};

// Middleware que permite acesso admin via JWT OU via X-Admin-Key (painel estático)
export const adminAccess = (req: Request, res: Response, next: NextFunction) => {
  // 1) Se veio Bearer token, validar e exigir role admin
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const secret = process.env.JWT_SECRET || 'dev_secret';
      const payload = jwt.verify(token, secret) as JwtPayload;
      (req as any).userEmail = payload.email;
      (req as any).userRole = payload.role;
      if (payload.role === 'admin') return next();
    } catch (_) {
      // ignora e tenta via admin key
    }
  }
  // 2) Tentar via X-Admin-Key
  const adminKey = req.headers['x-admin-key'] as string | undefined;
  if (adminKey && process.env.ADMIN_PANEL_KEY && adminKey === process.env.ADMIN_PANEL_KEY) {
    (req as any).userRole = 'admin';
    (req as any).userEmail = 'admin@panel.local';
    return next();
  }
  return res.status(403).json({ message: 'Acesso admin negado.' });
};

// Middleware que aceita OU Bearer token válido (usuário autenticado) OU X-Admin-Key (admin do painel)
export const authenticateOrAdmin = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    // Tenta autenticar via JWT
    return authenticate(req, res, next);
  }
  // Caso não haja Bearer, tenta via admin key
  return adminAccess(req, res, next);
};
