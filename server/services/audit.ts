import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, '../fleetwatch.db'));

interface AuditEntry {
  user_id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details?: any;
  ip_address?: string;
  user_agent?: string;
}

/**
 * Servicio de Auditoría
 * Registra todas las acciones críticas en el sistema
 */
export class AuditService {
  /**
   * Registrar una acción en el log de auditoría
   */
  static log(entry: AuditEntry): void {
    try {
      const stmt = db.prepare(`
        INSERT INTO audit_log (
          user_id, action, resource_type, resource_id,
          details, ip_address, user_agent
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        entry.user_id,
        entry.action,
        entry.resource_type,
        entry.resource_id || null,
        entry.details ? JSON.stringify(entry.details) : null,
        entry.ip_address || null,
        entry.user_agent || null
      );
    } catch (error) {
      console.error('Error logging audit entry:', error);
      // No lanzar error para no interrumpir la operación principal
    }
  }

  /**
   * Obtener logs de auditoría con filtros
   */
  static getLogs(filters: {
    user_id?: string;
    action?: string;
    resource_type?: string;
    from?: string;
    to?: string;
    limit?: number;
  }): any[] {
    let query = `
      SELECT a.*, u.username, u.role
      FROM audit_log a
      JOIN users u ON a.user_id = u.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (filters.user_id) {
      query += ' AND a.user_id = ?';
      params.push(filters.user_id);
    }

    if (filters.action) {
      query += ' AND a.action = ?';
      params.push(filters.action);
    }

    if (filters.resource_type) {
      query += ' AND a.resource_type = ?';
      params.push(filters.resource_type);
    }

    if (filters.from) {
      query += ' AND a.created_at >= ?';
      params.push(filters.from);
    }

    if (filters.to) {
      query += ' AND a.created_at <= ?';
      params.push(filters.to);
    }

    query += ' ORDER BY a.created_at DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    return db.prepare(query).all(...params) as any[];
  }
}

// Acciones comunes (para consistencia)
export const AUDIT_ACTIONS = {
  // Geocercas
  CREATE_GEOFENCE: 'create_geofence',
  UPDATE_GEOFENCE: 'update_geofence',
  DELETE_GEOFENCE: 'delete_geofence',
  ASSIGN_GEOFENCE: 'assign_geofence',
  UNASSIGN_GEOFENCE: 'unassign_geofence',

  // Usuarios
  CREATE_USER: 'create_user',
  UPDATE_USER: 'update_user',
  DELETE_USER: 'delete_user',
  DELETE_ADMIN: 'delete_admin', // Acción especial (solo superuser)

  // Destinatarios
  CREATE_RECIPIENT: 'create_recipient',
  UPDATE_RECIPIENT: 'update_recipient',
  DELETE_RECIPIENT: 'delete_recipient',

  // Autenticación
  LOGIN: 'login',
  LOGOUT: 'logout',
  LOGIN_FAILED: 'login_failed',
};
