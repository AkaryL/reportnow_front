import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, 'fleetwatch.db'));

console.log('🔍 Verificando integridad del esquema multi-tenant...\n');

let errors = 0;
let warnings = 0;

// Helper para verificar tabla
function checkTable(tableName: string, expectedColumns: string[]) {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all() as any[];

  if (columns.length === 0) {
    console.log(`❌ Tabla "${tableName}" no existe`);
    errors++;
    return false;
  }

  console.log(`✅ Tabla "${tableName}" existe`);

  const columnNames = columns.map((c: any) => c.name);
  const missing = expectedColumns.filter(col => !columnNames.includes(col));

  if (missing.length > 0) {
    console.log(`   ⚠️  Columnas faltantes: ${missing.join(', ')}`);
    warnings++;
  }

  return true;
}

// Helper para verificar índice
function checkIndex(indexName: string) {
  const indices = db.prepare(`
    SELECT name FROM sqlite_master
    WHERE type='index' AND name=?
  `).get(indexName);

  if (!indices) {
    console.log(`   ⚠️  Índice "${indexName}" no encontrado`);
    warnings++;
  } else {
    console.log(`   ✅ Índice "${indexName}" existe`);
  }
}

try {
  // ==============================================
  // 1. Verificar tabla geofences
  // ==============================================
  console.log('📍 Tabla: geofences');
  if (checkTable('geofences', [
    'id', 'name', 'type', 'color', 'geom_type', 'coordinates',
    'owner_type', 'owner_id', 'alert_mode', 'labels_entry', 'labels_exit',
    'deleted_at', 'created_at', 'updated_at', 'created_by'
  ])) {
    checkIndex('idx_geofences_owner');
    checkIndex('idx_geofences_deleted');
  }
  console.log('');

  // ==============================================
  // 2. Verificar tabla geofence_assignments
  // ==============================================
  console.log('🔗 Tabla: geofence_assignments');
  if (checkTable('geofence_assignments', [
    'id', 'geofence_id', 'scope_type', 'client_id', 'created_by', 'created_at'
  ])) {
    checkIndex('idx_assignments_geofence');
    checkIndex('idx_assignments_client');
  }
  console.log('');

  // ==============================================
  // 3. Verificar tabla geofence_recipients
  // ==============================================
  console.log('📧 Tabla: geofence_recipients');
  if (checkTable('geofence_recipients', [
    'id', 'client_id', 'user_id', 'email', 'whatsapp', 'channels', 'alert_types',
    'geofence_ids', 'vehicle_ids', 'is_active', 'created_at', 'updated_at'
  ])) {
    checkIndex('idx_recipients_client');
    checkIndex('idx_recipients_active');
  }
  console.log('');

  // ==============================================
  // 4. Verificar tabla geofence_events
  // ==============================================
  console.log('🎯 Tabla: geofence_events');
  if (checkTable('geofence_events', [
    'id', 'vehicle_id', 'geofence_id', 'direction', 'lat', 'lng',
    'occurred_at', 'dedupe_key', 'processed', 'created_at'
  ])) {
    checkIndex('idx_events_vehicle');
    checkIndex('idx_events_geofence');
    checkIndex('idx_events_processed');
    checkIndex('idx_events_occurred');
  }
  console.log('');

  // ==============================================
  // 5. Verificar tabla notifications_log
  // ==============================================
  console.log('📬 Tabla: notifications_log');
  if (checkTable('notifications_log', [
    'id', 'event_id', 'channel', 'recipient', 'subject', 'message',
    'status', 'error_message', 'sent_at', 'created_at'
  ])) {
    checkIndex('idx_notifications_event');
    checkIndex('idx_notifications_status');
    checkIndex('idx_notifications_sent');
  }
  console.log('');

  // ==============================================
  // 6. Verificar tabla audit_log
  // ==============================================
  console.log('📋 Tabla: audit_log');
  if (checkTable('audit_log', [
    'id', 'user_id', 'action', 'resource_type', 'resource_id',
    'details', 'ip_address', 'user_agent', 'created_at'
  ])) {
    checkIndex('idx_audit_user');
    checkIndex('idx_audit_action');
    checkIndex('idx_audit_created');
  }
  console.log('');

  // ==============================================
  // 7. Verificar constraints
  // ==============================================
  console.log('🔒 Verificando constraints...\n');

  // Test owner_type constraint
  try {
    db.prepare(`
      INSERT INTO geofences (id, name, type, color, geom_type, coordinates, owner_type, alert_mode)
      VALUES ('test1', 'Test', 'test', '#fff', 'Circle', '{}', 'invalid', 'ninguna')
    `).run();
    console.log(`❌ Constraint owner_type NO funciona`);
    errors++;
    db.prepare('DELETE FROM geofences WHERE id = ?').run('test1');
  } catch {
    console.log(`✅ Constraint owner_type funciona`);
  }

  // Test alert_mode constraint
  try {
    db.prepare(`
      INSERT INTO geofences (id, name, type, color, geom_type, coordinates, owner_type, alert_mode)
      VALUES ('test2', 'Test', 'test', '#fff', 'Circle', '{}', 'admin', 'invalid')
    `).run();
    console.log(`❌ Constraint alert_mode NO funciona`);
    errors++;
    db.prepare('DELETE FROM geofences WHERE id = ?').run('test2');
  } catch {
    console.log(`✅ Constraint alert_mode funciona`);
  }

  // Test direction constraint
  try {
    db.prepare(`
      INSERT INTO geofence_events (vehicle_id, geofence_id, direction, lat, lng, occurred_at, dedupe_key)
      VALUES ('1', '1', 'invalid', 0, 0, datetime('now'), 'test')
    `).run();
    console.log(`❌ Constraint direction NO funciona`);
    errors++;
    db.prepare('DELETE FROM geofence_events WHERE dedupe_key = ?').run('test');
  } catch {
    console.log(`✅ Constraint direction funciona`);
  }

  console.log('');

  // ==============================================
  // 8. Verificar datos de prueba
  // ==============================================
  console.log('📊 Verificando datos de prueba...\n');

  const geofences = db.prepare('SELECT COUNT(*) as count FROM geofences WHERE deleted_at IS NULL').get() as any;
  const clientGeofences = db.prepare("SELECT COUNT(*) as count FROM geofences WHERE owner_type = 'client'").get() as any;
  const adminGeofences = db.prepare("SELECT COUNT(*) as count FROM geofences WHERE owner_type = 'admin'").get() as any;
  const assignments = db.prepare('SELECT COUNT(*) as count FROM geofence_assignments').get() as any;
  const recipients = db.prepare('SELECT COUNT(*) as count FROM geofence_recipients').get() as any;
  const events = db.prepare('SELECT COUNT(*) as count FROM geofence_events').get() as any;

  console.log(`   Geocercas activas: ${geofences.count}`);
  console.log(`   - Clientes: ${clientGeofences.count}`);
  console.log(`   - Admin: ${adminGeofences.count}`);
  console.log(`   Asignaciones: ${assignments.count}`);
  console.log(`   Destinatarios: ${recipients.count}`);
  console.log(`   Eventos: ${events.count}`);

  if (geofences.count === 0) {
    console.log(`\n   ⚠️  No hay geocercas. Ejecuta: npx tsx server/seed-multitenant.ts`);
    warnings++;
  }

  console.log('');

  // ==============================================
  // Resumen
  // ==============================================
  console.log('═══════════════════════════════════════════\n');

  if (errors === 0 && warnings === 0) {
    console.log('✅ VERIFICACIÓN COMPLETADA - Todo correcto!\n');
  } else {
    if (errors > 0) {
      console.log(`❌ ${errors} error(es) encontrado(s)`);
    }
    if (warnings > 0) {
      console.log(`⚠️  ${warnings} advertencia(s) encontrada(s)`);
    }
    console.log('');
  }

} catch (error) {
  console.error('\n❌ Error durante la verificación:', error);
  process.exit(1);
} finally {
  db.close();
}
