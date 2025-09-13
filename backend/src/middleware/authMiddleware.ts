
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { dbManager } from '../db-enhanced';

interface JwtPayload {
  email?: string;
  role?: string;
  userId?: string;
  userEmail?: string;
  userRole?: string;
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
    console.log('✅ Token válido para usuário:', payload.userEmail || payload.email, 'role:', payload.userRole || payload.role);
    
    const userEmail = payload.userEmail || payload.email;
    const userRole = payload.userRole || payload.role;
    
    if (dbManager.isConnected) {
      // Checar se usuário ainda existe quando DB conectado
      const userResult = await dbManager.query('SELECT 1 FROM users WHERE email = ?', [userEmail]);
      if (!userResult.rowCount) {
        console.log('❌ Usuário não existe mais:', userEmail);
        return res.status(401).json({ message: 'Usuário não existe mais.' });
      }
    } else {
      // Em modo teste sem DB, permitir usuário de teste
      if (userEmail !== 'cliente@teste.com' && userEmail !== 'provider@teste.com') {
        console.log('❌ Usuário não autorizado no modo teste:', userEmail);
        return res.status(401).json({ message: 'Usuário não autorizado no modo teste.' });
      }
    }
    
    // anexar email ao request para uso nas rotas
    (req as any).userEmail = userEmail;
    (req as any).userRole = userRole;
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
      const userEmail = payload.userEmail || payload.email;
      const userRole = payload.userRole || payload.role;
      (req as any).userEmail = userEmail;
      (req as any).userRole = userRole;
      if (userRole === 'admin') return next();
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

// Middleware para verificar se o usuário é um provider (prestador)
export const providerAccess = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token ausente ou inválido.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const secret = process.env.JWT_SECRET || 'dev_secret';
    const payload = jwt.verify(token, secret) as JwtPayload;
    
    const userEmail = payload.userEmail || payload.email;
    const userRole = payload.userRole || payload.role;
    
    // Verificar se é provider
    if (userRole !== 'provider') {
      return res.status(403).json({ message: 'Acesso restrito a prestadores de serviço.' });
    }
    
    if (dbManager.isConnected) {
      // Verificar se provider existe e está ativo
      const providerResult = await dbManager.query(
        'SELECT 1 FROM users WHERE email = ? AND role = ?', 
        [userEmail, 'provider']
      );
      
      if (!providerResult.rowCount) {
        return res.status(403).json({ message: 'Provider não encontrado ou inativo.' });
      }
    } else {
      // Modo teste - permitir provider@teste.com
      if (userEmail !== 'provider@teste.com') {
        return res.status(403).json({ message: 'Provider não autorizado no modo teste.' });
      }
    }
    
    (req as any).userEmail = userEmail;
    (req as any).userRole = userRole;
    (req as any).user = { email: userEmail, role: userRole };
    next();
    
  } catch (err) {
    return res.status(401).json({ message: 'Token inválido.' });
  }
};
