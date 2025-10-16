import { Router, Request, Response } from 'express';
import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { authenticate } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = Router();
const db = new Database(join(__dirname, '../fleetwatch.db'));

/**
 * GET /api/geofences
 * Obtener geocercas según el rol y permisos del usuario
 *
 * Query params:
 * - filter: 'own' | 'assigned' | 'all' (default: 'own')
 * - clientId: ID del cliente (solo admin/superuser)
 */
router.get('/geofences', authenticate, async (req: Request, res: Response) => {
  try {
    const { filter = 'own', clientId } = req.query;
    const user = req.user!;

    let query = '';
    let params: any[] = [];

    if (user.role === 'client') {
      // CLIENTE: Ve sus propias geocercas + geocercas globales + geocercas asignadas
      if (filter === 'own') {
        // Solo sus propias
        query = `
          SELECT *, 'editable' as permission
          FROM geofences
          WHERE deleted_at IS NULL
            AND created_by_role = 'client'
            AND client_id = ?
          ORDER BY created_at DESC
        `;
        params = [user.client_id];
      } else if (filter === 'assigned') {
        // Solo asignadas (globales o específicas de admin)
        query = `
          SELECT *, 'readonly' as permission
          FROM geofences
          WHERE deleted_at IS NULL
            AND created_by_role IN ('admin', 'superuser')
            AND (is_global = 1 OR client_id = ?)
          ORDER BY created_at DESC
        `;
        params = [user.client_id];
      } else {
        // Todas (propias + asignadas)
        query = `
          SELECT *,
            CASE
              WHEN created_by_role = 'client' AND client_id = ? THEN 'editable'
              ELSE 'readonly'
            END as permission
          FROM geofences
          WHERE deleted_at IS NULL
            AND (
              (created_by_role = 'client' AND client_id = ?)
              OR (created_by_role IN ('admin', 'superuser') AND is_global = 1)
              OR (created_by_role IN ('admin', 'superuser') AND client_id = ?)
            )
          ORDER BY created_at DESC
        `;
        params = [user.client_id, user.client_id, user.client_id];
      }
    } else {
      // ADMIN/SUPERUSER: Puede filtrar por cliente específico
      if (clientId) {
        // Ver geocercas de un cliente específico + globales
        query = `
          SELECT *, 'editable' as permission
          FROM geofences
          WHERE deleted_at IS NULL
            AND (
              (client_id = ?)
              OR (is_global = 1)
            )
          ORDER BY created_at DESC
        `;
        params = [clientId];
      } else {
        // Por defecto, solo mostrar geocercas globales (para no saturar)
        query = `
          SELECT *, 'editable' as permission
          FROM geofences
          WHERE deleted_at IS NULL
            AND is_global = 1
          ORDER BY created_at DESC
        `;
      }
    }

    const geofences = db.prepare(query).all(...params);
    res.json(geofences);
  } catch (error) {
    console.error('Error fetching geofences:', error);
    res.status(500).json({ error: 'Error al obtener geocercas' });
  }
});

/**
 * POST /api/geofences
 * Crear nueva geocerca
 *
 * Body:
 * - name, type, color, geom_type, coordinates
 * - alert_type: 'entry' | 'exit' | 'both' (default: 'both')
 * - client_id?: string (solo admin/superuser, asignar a cliente específico)
 * - is_global?: boolean (solo admin/superuser, hacer visible para todos)
 */
router.post('/geofences', authenticate, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const {
      name,
      type,
      color,
      geom_type,
      coordinates,
      alert_type = 'both',
      client_id,
      is_global = false
    } = req.body;

    // Validaciones
    if (!name || !type || !color || !geom_type || !coordinates) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    if (!['entry', 'exit', 'both'].includes(alert_type)) {
      return res.status(400).json({ error: 'alert_type inválido. Debe ser: entry, exit o both' });
    }

    const id = randomUUID();

    // Determinar client_id e is_global según el rol
    let finalClientId: string | null = null;
    let finalIsGlobal = 0;

    if (user.role === 'client') {
      // Cliente: siempre crea geocercas privadas (asignadas a su cliente)
      finalClientId = user.client_id!;
      finalIsGlobal = 0;
    } else {
      // Admin/Superuser: puede crear globales o asignar a clientes específicos
      if (is_global) {
        finalClientId = null;
        finalIsGlobal = 1;
      } else if (client_id) {
        finalClientId = client_id;
        finalIsGlobal = 0;
      } else {
        // Por defecto, admin crea global
        finalClientId = null;
        finalIsGlobal = 1;
      }
    }

    // Insertar geocerca
    const stmt = db.prepare(`
      INSERT INTO geofences (
        id, name, type, color, geom_type, coordinates,
        alert_type, created_by_role, created_by_user_id, client_id, is_global
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      name,
      type,
      color,
      geom_type,
      typeof coordinates === 'string' ? coordinates : JSON.stringify(coordinates),
      alert_type,
      user.role,
      user.id,
      finalClientId,
      finalIsGlobal
    );

    console.log(`✅ Created geofence '${name}' by ${user.role} ${user.name} (global: ${finalIsGlobal}, client: ${finalClientId || 'none'})`);

    // Obtener geocerca creada
    const created = db.prepare('SELECT * FROM geofences WHERE id = ?').get(id);
    res.status(201).json(created);
  } catch (error: any) {
    console.error('Error creating geofence:', error);
    res.status(500).json({ error: 'Error al crear geocerca', details: error.message });
  }
});

/**
 * PUT /api/geofences/:id
 * Actualizar geocerca
 *
 * Permisos:
 * - Cliente: solo puede editar sus propias geocercas
 * - Admin/Superuser: puede editar cualquier geocerca
 */
router.put('/geofences/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    // Obtener geocerca
    const geofence = db.prepare('SELECT * FROM geofences WHERE id = ? AND deleted_at IS NULL').get(id) as any;

    if (!geofence) {
      return res.status(404).json({ error: 'Geocerca no encontrada' });
    }

    // Verificar permisos
    if (user.role === 'client') {
      // Cliente solo puede editar sus propias geocercas
      if (geofence.created_by_role !== 'client' || geofence.client_id !== user.client_id) {
        return res.status(403).json({
          error: 'No tienes permiso para editar esta geocerca',
          reason: 'Solo puedes editar geocercas que tú creaste'
        });
      }
    }

    // Actualizar campos permitidos
    const {
      name,
      type,
      color,
      geom_type,
      coordinates,
      alert_type,
      client_id,
      is_global
    } = req.body;

    const updates: string[] = [];
    const params: any[] = [];

    if (name !== undefined) { updates.push('name = ?'); params.push(name); }
    if (type !== undefined) { updates.push('type = ?'); params.push(type); }
    if (color !== undefined) { updates.push('color = ?'); params.push(color); }
    if (geom_type !== undefined) { updates.push('geom_type = ?'); params.push(geom_type); }
    if (coordinates !== undefined) {
      updates.push('coordinates = ?');
      params.push(typeof coordinates === 'string' ? coordinates : JSON.stringify(coordinates));
    }
    if (alert_type !== undefined) { updates.push('alert_type = ?'); params.push(alert_type); }

    // Solo admin/superuser puede cambiar asignaciones
    if (user.role !== 'client') {
      if (client_id !== undefined) { updates.push('client_id = ?'); params.push(client_id); }
      if (is_global !== undefined) { updates.push('is_global = ?'); params.push(is_global ? 1 : 0); }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No se proporcionaron campos para actualizar' });
    }

    params.push(id);

    const stmt = db.prepare(`
      UPDATE geofences
      SET ${updates.join(', ')}
      WHERE id = ?
    `);

    stmt.run(...params);

    console.log(`✅ Updated geofence '${geofence.name}' by ${user.role} ${user.name}`);

    // Retornar geocerca actualizada
    const updated = db.prepare('SELECT * FROM geofences WHERE id = ?').get(id);
    res.json(updated);
  } catch (error: any) {
    console.error('Error updating geofence:', error);
    res.status(500).json({ error: 'Error al actualizar geocerca', details: error.message });
  }
});

/**
 * DELETE /api/geofences/:id
 * Eliminar geocerca (soft delete)
 *
 * Permisos:
 * - Cliente: solo puede eliminar sus propias geocercas
 * - Admin/Superuser: puede eliminar cualquier geocerca
 */
router.delete('/geofences/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    // Obtener geocerca
    const geofence = db.prepare('SELECT * FROM geofences WHERE id = ? AND deleted_at IS NULL').get(id) as any;

    if (!geofence) {
      return res.status(404).json({ error: 'Geocerca no encontrada' });
    }

    // Verificar permisos
    if (user.role === 'client') {
      if (geofence.created_by_role !== 'client' || geofence.client_id !== user.client_id) {
        return res.status(403).json({
          error: 'No tienes permiso para eliminar esta geocerca',
          reason: 'Solo puedes eliminar geocercas que tú creaste'
        });
      }
    }

    // Soft delete
    db.prepare(`
      UPDATE geofences
      SET deleted_at = datetime('now')
      WHERE id = ?
    `).run(id);

    console.log(`🗑️  Soft-deleted geofence '${geofence.name}' by ${user.role} ${user.name}`);

    res.json({ message: 'Geocerca eliminada correctamente' });
  } catch (error: any) {
    console.error('Error deleting geofence:', error);
    res.status(500).json({ error: 'Error al eliminar geocerca', details: error.message });
  }
});

export default router;
