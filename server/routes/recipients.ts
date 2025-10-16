import { Router, Request, Response } from 'express';
import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { authenticate, authorize, isAdminOrSuperuser } from '../middleware/auth.js';
import { AuditService, AUDIT_ACTIONS } from '../services/audit.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = Router();
const db = new Database(join(__dirname, '../fleetwatch.db'));

/**
 * GET /api/clients/:clientId/recipients
 * Obtener destinatarios de un cliente
 *
 * Permisos:
 * - Cliente: solo puede ver sus propios destinatarios
 * - Admin/Superuser: puede ver destinatarios de cualquier cliente
 */
router.get('/clients/:clientId/recipients', authenticate, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { clientId } = req.params;

    // Verificar permisos
    if (user.role === 'client' && user.client_id !== clientId) {
      return res.status(403).json({
        error: 'No tienes permiso para ver estos destinatarios',
        reason: 'Solo puedes ver los destinatarios de tu propia organización'
      });
    }

    const recipients = db.prepare(`
      SELECT r.*, u.username, u.email as user_email
      FROM geofence_recipients r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.client_id = ?
      ORDER BY r.created_at DESC
    `).all(clientId);

    // Parse JSON fields
    const result = recipients.map((r: any) => ({
      ...r,
      channels: r.channels ? JSON.parse(r.channels) : [],
      alert_types: r.alert_types ? JSON.parse(r.alert_types) : [],
      geofence_ids: r.geofence_ids ? JSON.parse(r.geofence_ids) : null,
      vehicle_ids: r.vehicle_ids ? JSON.parse(r.vehicle_ids) : null
    }));

    res.json(result);
  } catch (error) {
    console.error('Error fetching recipients:', error);
    res.status(500).json({ error: 'Error al obtener destinatarios' });
  }
});

/**
 * POST /api/clients/:clientId/recipients
 * Crear destinatario de notificaciones
 *
 * Body:
 * - email?: string
 * - whatsapp?: string
 * - channels: ('email' | 'whatsapp')[]
 * - alert_types: ('entry' | 'exit')[]
 * - geofence_ids?: string[] (null = todas)
 * - vehicle_ids?: string[] (null = todos)
 * - user_id?: string (optional)
 * - is_active?: boolean (default: true)
 *
 * Permisos:
 * - Cliente: solo puede crear para su propia organización
 * - Admin/Superuser: puede crear para cualquier cliente
 */
router.post('/clients/:clientId/recipients', authenticate, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { clientId } = req.params;

    // Verificar permisos
    if (user.role === 'client' && user.client_id !== clientId) {
      return res.status(403).json({
        error: 'No tienes permiso para crear destinatarios en este cliente',
        reason: 'Solo puedes gestionar destinatarios de tu propia organización'
      });
    }

    const {
      email,
      whatsapp,
      channels,
      alert_types,
      geofence_ids,
      vehicle_ids,
      user_id,
      is_active = true
    } = req.body;

    // Validaciones
    if (!channels || !Array.isArray(channels) || channels.length === 0) {
      return res.status(400).json({ error: 'Debe especificar al menos un canal de notificación' });
    }

    if (!alert_types || !Array.isArray(alert_types) || alert_types.length === 0) {
      return res.status(400).json({ error: 'Debe especificar al menos un tipo de alerta' });
    }

    // Validar que exista al menos un método de contacto
    if (channels.includes('email') && !email) {
      return res.status(400).json({ error: 'Email es requerido si se selecciona canal de email' });
    }

    if (channels.includes('whatsapp') && !whatsapp) {
      return res.status(400).json({ error: 'WhatsApp es requerido si se selecciona canal de WhatsApp' });
    }

    // Verificar que el cliente existe
    const client = db.prepare('SELECT id FROM clients WHERE id = ?').get(clientId);
    if (!client) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    const id = randomUUID();

    const stmt = db.prepare(`
      INSERT INTO geofence_recipients (
        id, client_id, user_id, email, whatsapp, channels, alert_types,
        geofence_ids, vehicle_ids, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      clientId,
      user_id || null,
      email || null,
      whatsapp || null,
      JSON.stringify(channels),
      JSON.stringify(alert_types),
      geofence_ids ? JSON.stringify(geofence_ids) : null,
      vehicle_ids ? JSON.stringify(vehicle_ids) : null,
      is_active ? 1 : 0
    );

    // Auditoría
    AuditService.log({
      user_id: user.id,
      action: AUDIT_ACTIONS.CREATE_RECIPIENT,
      resource_type: 'recipient',
      resource_id: id,
      details: { client_id: clientId, channels, alert_types },
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    });

    // Obtener destinatario creado
    const created = db.prepare('SELECT * FROM geofence_recipients WHERE id = ?').get(id) as any;

    res.status(201).json({
      ...created,
      channels: JSON.parse(created.channels),
      alert_types: JSON.parse(created.alert_types),
      geofence_ids: created.geofence_ids ? JSON.parse(created.geofence_ids) : null,
      vehicle_ids: created.vehicle_ids ? JSON.parse(created.vehicle_ids) : null
    });
  } catch (error: any) {
    console.error('Error creating recipient:', error);
    res.status(500).json({ error: 'Error al crear destinatario', details: error.message });
  }
});

/**
 * PUT /api/recipients/:id
 * Actualizar destinatario
 *
 * Permisos:
 * - Cliente: solo puede editar destinatarios de su organización
 * - Admin/Superuser: puede editar cualquier destinatario
 */
router.put('/recipients/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    // Obtener destinatario
    const recipient = db.prepare('SELECT * FROM geofence_recipients WHERE id = ?').get(id) as any;

    if (!recipient) {
      return res.status(404).json({ error: 'Destinatario no encontrado' });
    }

    // Verificar permisos
    if (user.role === 'client' && user.client_id !== recipient.client_id) {
      return res.status(403).json({
        error: 'No tienes permiso para editar este destinatario',
        reason: 'Solo puedes editar destinatarios de tu propia organización'
      });
    }

    const {
      email,
      whatsapp,
      channels,
      alert_types,
      geofence_ids,
      vehicle_ids,
      user_id,
      is_active
    } = req.body;

    const updates: string[] = [];
    const params: any[] = [];

    if (email !== undefined) { updates.push('email = ?'); params.push(email); }
    if (whatsapp !== undefined) { updates.push('whatsapp = ?'); params.push(whatsapp); }
    if (user_id !== undefined) { updates.push('user_id = ?'); params.push(user_id); }
    if (is_active !== undefined) { updates.push('is_active = ?'); params.push(is_active ? 1 : 0); }

    if (channels !== undefined) {
      if (!Array.isArray(channels) || channels.length === 0) {
        return res.status(400).json({ error: 'Debe especificar al menos un canal' });
      }
      updates.push('channels = ?');
      params.push(JSON.stringify(channels));
    }

    if (alert_types !== undefined) {
      if (!Array.isArray(alert_types) || alert_types.length === 0) {
        return res.status(400).json({ error: 'Debe especificar al menos un tipo de alerta' });
      }
      updates.push('alert_types = ?');
      params.push(JSON.stringify(alert_types));
    }

    if (geofence_ids !== undefined) {
      updates.push('geofence_ids = ?');
      params.push(geofence_ids ? JSON.stringify(geofence_ids) : null);
    }

    if (vehicle_ids !== undefined) {
      updates.push('vehicle_ids = ?');
      params.push(vehicle_ids ? JSON.stringify(vehicle_ids) : null);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No se proporcionaron campos para actualizar' });
    }

    updates.push('updated_at = datetime("now")');
    params.push(id);

    const stmt = db.prepare(`
      UPDATE geofence_recipients
      SET ${updates.join(', ')}
      WHERE id = ?
    `);

    stmt.run(...params);

    // Auditoría
    AuditService.log({
      user_id: user.id,
      action: AUDIT_ACTIONS.UPDATE_RECIPIENT,
      resource_type: 'recipient',
      resource_id: id,
      details: { updates: Object.keys(req.body) },
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    });

    // Retornar destinatario actualizado
    const updated = db.prepare('SELECT * FROM geofence_recipients WHERE id = ?').get(id) as any;

    res.json({
      ...updated,
      channels: JSON.parse(updated.channels),
      alert_types: JSON.parse(updated.alert_types),
      geofence_ids: updated.geofence_ids ? JSON.parse(updated.geofence_ids) : null,
      vehicle_ids: updated.vehicle_ids ? JSON.parse(updated.vehicle_ids) : null
    });
  } catch (error: any) {
    console.error('Error updating recipient:', error);
    res.status(500).json({ error: 'Error al actualizar destinatario', details: error.message });
  }
});

/**
 * DELETE /api/recipients/:id
 * Eliminar destinatario
 *
 * Permisos:
 * - Cliente: solo puede eliminar destinatarios de su organización
 * - Admin/Superuser: puede eliminar cualquier destinatario
 */
router.delete('/recipients/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    // Obtener destinatario
    const recipient = db.prepare('SELECT * FROM geofence_recipients WHERE id = ?').get(id) as any;

    if (!recipient) {
      return res.status(404).json({ error: 'Destinatario no encontrado' });
    }

    // Verificar permisos
    if (user.role === 'client' && user.client_id !== recipient.client_id) {
      return res.status(403).json({
        error: 'No tienes permiso para eliminar este destinatario',
        reason: 'Solo puedes eliminar destinatarios de tu propia organización'
      });
    }

    // Eliminar
    db.prepare('DELETE FROM geofence_recipients WHERE id = ?').run(id);

    // Auditoría
    AuditService.log({
      user_id: user.id,
      action: AUDIT_ACTIONS.DELETE_RECIPIENT,
      resource_type: 'recipient',
      resource_id: id,
      details: { client_id: recipient.client_id, email: recipient.email },
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    });

    res.json({ message: 'Destinatario eliminado correctamente' });
  } catch (error: any) {
    console.error('Error deleting recipient:', error);
    res.status(500).json({ error: 'Error al eliminar destinatario', details: error.message });
  }
});

/**
 * GET /api/recipients/:id/test
 * Probar configuración de destinatario (envía notificación de prueba)
 *
 * Solo admin/superuser
 */
router.post('/recipients/:id/test', authenticate, authorize('admin', 'superuser'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const recipient = db.prepare('SELECT * FROM geofence_recipients WHERE id = ?').get(id) as any;

    if (!recipient) {
      return res.status(404).json({ error: 'Destinatario no encontrado' });
    }

    // TODO: Implementar envío de notificación de prueba
    // Por ahora solo registramos en audit log

    AuditService.log({
      user_id: req.user!.id,
      action: 'test_recipient',
      resource_type: 'recipient',
      resource_id: id,
      details: {
        channels: JSON.parse(recipient.channels),
        email: recipient.email,
        whatsapp: recipient.whatsapp
      },
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    });

    res.json({
      message: 'Funcionalidad de prueba pendiente de implementación en Phase 4',
      recipient: {
        email: recipient.email,
        whatsapp: recipient.whatsapp,
        channels: JSON.parse(recipient.channels)
      }
    });
  } catch (error: any) {
    console.error('Error testing recipient:', error);
    res.status(500).json({ error: 'Error al probar destinatario', details: error.message });
  }
});

export default router;
