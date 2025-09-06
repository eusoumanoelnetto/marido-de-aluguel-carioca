import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  email: string;
  role?: string;
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token ausente ou inválido.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const secret = process.env.JWT_SECRET || 'dev_secret';
    const payload = jwt.verify(token, secret) as JwtPayload;
    // anexar email ao request para uso nas rotas
  (req as any).userEmail = payload.email;
  (req as any).userRole = payload.role;
    next();
  } catch (err) {
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
