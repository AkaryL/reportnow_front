import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { AuditService } from '../services/audit.js';

const router = Router();

/**
 * GET /api/audit
 * Obtener logs de auditoría
 *
 * Query params:
 * - user_id?: string
 * - action?: string
 * - resource_type?: string
 * - from?: string (ISO date)
 * - to?: string (ISO date)
 * - limit?: number (default: 100)
 *
 * Permisos: Solo admin y superuser
 */
router.get('/audit', authenticate, authorize('admin', 'superuser'), async (req: Request, res: Response) => {
  try {
    const { user_id, action, resource_type, from, to, limit } = req.query;

    const filters: any = {};

    if (user_id) filters.user_id = user_id as string;
    if (action) filters.action = action as string;
    if (resource_type) filters.resource_type = resource_type as string;
    if (from) filters.from = from as string;
    if (to) filters.to = to as string;
    if (limit) filters.limit = parseInt(limit as string);

    // Default limit
    if (!filters.limit) filters.limit = 100;

    const logs = AuditService.getLogs(filters);

    // Parse JSON fields
    const result = logs.map((log: any) => ({
      ...log,
      details: log.details ? JSON.parse(log.details) : null
    }));

    res.json(result);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Error al obtener logs de auditoría' });
  }
});

/**
 * GET /api/audit/actions
 * Obtener lista de acciones disponibles para filtrado
 *
 * Permisos: Solo admin y superuser
 */
router.get('/audit/actions', authenticate, authorize('admin', 'superuser'), async (req: Request, res: Response) => {
  try {
    const { AUDIT_ACTIONS } = await import('../services/audit.js');

    res.json({
      actions: Object.values(AUDIT_ACTIONS),
      actionGroups: {
        geofences: [
          AUDIT_ACTIONS.CREATE_GEOFENCE,
          AUDIT_ACTIONS.UPDATE_GEOFENCE,
          AUDIT_ACTIONS.DELETE_GEOFENCE,
          AUDIT_ACTIONS.ASSIGN_GEOFENCE,
          AUDIT_ACTIONS.UNASSIGN_GEOFENCE
        ],
        users: [
          AUDIT_ACTIONS.CREATE_USER,
          AUDIT_ACTIONS.UPDATE_USER,
          AUDIT_ACTIONS.DELETE_USER,
          AUDIT_ACTIONS.DELETE_ADMIN
        ],
        recipients: [
          AUDIT_ACTIONS.CREATE_RECIPIENT,
          AUDIT_ACTIONS.UPDATE_RECIPIENT,
          AUDIT_ACTIONS.DELETE_RECIPIENT
        ],
        auth: [
          AUDIT_ACTIONS.LOGIN,
          AUDIT_ACTIONS.LOGOUT,
          AUDIT_ACTIONS.LOGIN_FAILED
        ]
      }
    });
  } catch (error) {
    console.error('Error fetching audit actions:', error);
    res.status(500).json({ error: 'Error al obtener acciones de auditoría' });
  }
});

/**
 * GET /api/audit/stats
 * Obtener estadísticas de auditoría
 *
 * Query params:
 * - from?: string (ISO date)
 * - to?: string (ISO date)
 *
 * Permisos: Solo admin y superuser
 */
router.get('/audit/stats', authenticate, authorize('admin', 'superuser'), async (req: Request, res: Response) => {
  try {
    const { from, to } = req.query;

    // Get logs with filters
    const filters: any = {};
    if (from) filters.from = from as string;
    if (to) filters.to = to as string;

    const logs = AuditService.getLogs(filters);

    // Calculate statistics
    const stats = {
      total: logs.length,
      by_action: {} as Record<string, number>,
      by_user: {} as Record<string, number>,
      by_resource_type: {} as Record<string, number>,
      recent_activity: logs.slice(0, 10).map((log: any) => ({
        id: log.id,
        action: log.action,
        username: log.username,
        resource_type: log.resource_type,
        created_at: log.created_at
      }))
    };

    logs.forEach((log: any) => {
      // Count by action
      stats.by_action[log.action] = (stats.by_action[log.action] || 0) + 1;

      // Count by user
      const userKey = `${log.username} (${log.role})`;
      stats.by_user[userKey] = (stats.by_user[userKey] || 0) + 1;

      // Count by resource type
      stats.by_resource_type[log.resource_type] = (stats.by_resource_type[log.resource_type] || 0) + 1;
    });

    res.json(stats);
  } catch (error) {
    console.error('Error fetching audit stats:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas de auditoría' });
  }
});

export default router;
