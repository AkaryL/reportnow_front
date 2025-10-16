import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, '../fleetwatch.db'));
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
        name: string;
        role: 'superuser' | 'admin' | 'client';
        client_id?: string;
      };
    }
  }
}

/**
 * Middleware de autenticación JWT
 * Verifica que el token sea válido y adjunta el usuario a req.user
 */
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No se proporcionó token de autenticación' });
    }

    const token = authHeader.substring(7); // Remover 'Bearer '

    // Verificar token
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // Buscar usuario en la base de datos
    const user = db.prepare(`
      SELECT id, username, name, role, client_id
      FROM users
      WHERE id = ?
    `).get(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    // Adjuntar usuario a request
    req.user = user as any;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Token inválido' });
    }
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Token expirado' });
    }
    return res.status(500).json({ error: 'Error de autenticación' });
  }
};

/**
 * Middleware de autorización por roles
 * Verifica que el usuario tenga uno de los roles permitidos
 */
export const authorize = (...allowedRoles: ('superuser' | 'admin' | 'client')[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'No tienes permisos para realizar esta acción',
        required: allowedRoles,
        current: req.user.role
      });
    }

    next();
  };
};

/**
 * Helper: Verificar si el usuario es admin o superuser
 */
export const isAdminOrSuperuser = (user: any): boolean => {
  return user.role === 'admin' || user.role === 'superuser';
};

/**
 * Helper: Verificar si el usuario puede gestionar al usuario objetivo
 * - Superuser puede gestionar a admin y client
 * - Admin puede gestionar a client
 * - Client no puede gestionar a nadie
 */
export const canManageUser = (currentUser: any, targetRole: string): boolean => {
  if (currentUser.role === 'superuser') {
    return true; // Superuser puede gestionar a todos
  }
  if (currentUser.role === 'admin' && targetRole === 'client') {
    return true; // Admin puede gestionar a clientes
  }
  return false;
};

/**
 * Helper: Generar token JWT
 */
export const generateToken = (userId: string): string => {
  return jwt.sign(
    { userId },
    JWT_SECRET,
    { expiresIn: '7d' } // Token válido por 7 días
  );
};
