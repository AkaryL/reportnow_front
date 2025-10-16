import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, 'fleetwatch.db'));
db.pragma('foreign_keys = ON');

console.log('🌱 Sembrando datos de prueba para sistema multi-tenant...\n');

try {
  // ==============================================
  // 1. GEOCERCAS DE CLIENTES (privadas)
  // ==============================================
  console.log('📍 Creando geocercas privadas de clientes...');

  const insertGeofence = db.prepare(`
    INSERT OR REPLACE INTO geofences (
      id, name, type, color, geom_type, coordinates,
      owner_type, owner_id, alert_mode, labels_entry, labels_exit, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Geocercas de Cliente 1 (Transportes del Valle)
  insertGeofence.run(
    'client1-geo1',
    'Almacén Central - Cliente 1',
    'punto-interes',
    '#3b82f6',
    'Circle',
    JSON.stringify({ center: [-103.3800, 20.7100], radius: 200 }),
    'client',
    '1', // client_id
    'entrada_y_salida',
    JSON.stringify(['Vehículo llegó al almacén', 'Entrada registrada']),
    JSON.stringify(['Vehículo salió del almacén', 'Salida registrada']),
    '3' // user cliente
  );

  insertGeofence.run(
    'client1-geo2',
    'Zona de Carga - Cliente 1',
    'zona-permitida',
    '#10b981',
    'Polygon',
    JSON.stringify([
      [-103.3850, 20.7150],
      [-103.3850, 20.7120],
      [-103.3820, 20.7120],
      [-103.3820, 20.7150],
      [-103.3850, 20.7150]
    ]),
    'client',
    '1',
    'solo_salida',
    JSON.stringify([]),
    JSON.stringify(['Carga completada y enviada']),
    '3'
  );

  // Geocercas de Cliente 2 (Logística Zapopan)
  insertGeofence.run(
    'client2-geo1',
    'Centro de Distribución - Cliente 2',
    'punto-interes',
    '#8b5cf6',
    'Circle',
    JSON.stringify({ center: [-103.4500, 20.7300], radius: 250 }),
    'client',
    '2',
    'entrada_y_salida',
    JSON.stringify(['Vehículo en centro de distribución']),
    JSON.stringify(['Vehículo dejó el centro']),
    '3'
  );

  console.log('   ✅ 3 geocercas privadas de clientes creadas\n');

  // ==============================================
  // 2. GEOCERCAS DE ADMIN (pueden asignarse)
  // ==============================================
  console.log('📍 Creando geocercas de administrador...');

  // Geocercas globales del admin
  insertGeofence.run(
    'admin-geo1',
    'Aeropuerto Internacional GDL',
    'punto-interes',
    '#ef4444',
    'Circle',
    JSON.stringify({ center: [-103.3112, 20.5218], radius: 1000 }),
    'admin',
    null,
    'entrada_y_salida',
    JSON.stringify(['Vehículo entró a zona aeropuerto', 'Alerta: Área restringida']),
    JSON.stringify(['Vehículo salió de zona aeropuerto']),
    '1' // julio (superadmin)
  );

  insertGeofence.run(
    'admin-geo2',
    'Centro Histórico GDL',
    'zona-restringida',
    '#f59e0b',
    'Polygon',
    JSON.stringify([
      [-103.3480, 20.6750],
      [-103.3480, 20.6700],
      [-103.3420, 20.6700],
      [-103.3420, 20.6750],
      [-103.3480, 20.6750]
    ]),
    'admin',
    null,
    'solo_entrada',
    JSON.stringify(['Advertencia: Vehículo en zona de tráfico restringido']),
    JSON.stringify([]),
    '2' // admin
  );

  insertGeofence.run(
    'admin-geo3',
    'Parque Industrial El Salto',
    'punto-interes',
    '#06b6d4',
    'Circle',
    JSON.stringify({ center: [-103.2450, 20.6200], radius: 800 }),
    'admin',
    null,
    'entrada_y_salida',
    JSON.stringify(['Vehículo en parque industrial']),
    JSON.stringify(['Vehículo salió del parque industrial']),
    '1'
  );

  console.log('   ✅ 3 geocercas de administrador creadas\n');

  // ==============================================
  // 3. ASIGNACIONES DE GEOCERCAS
  // ==============================================
  console.log('🔗 Creando asignaciones de geocercas...');

  const insertAssignment = db.prepare(`
    INSERT OR IGNORE INTO geofence_assignments (
      geofence_id, scope_type, client_id, created_by
    ) VALUES (?, ?, ?, ?)
  `);

  // Aeropuerto → Global (todos los clientes)
  insertAssignment.run('admin-geo1', 'global', null, '1');

  // Centro Histórico → Solo Cliente 1 y Cliente 2
  insertAssignment.run('admin-geo2', 'client', '1', '2');
  insertAssignment.run('admin-geo2', 'client', '2', '2');

  // Parque Industrial → Solo Cliente 3
  insertAssignment.run('admin-geo3', 'client', '3', '1');

  console.log('   ✅ Asignaciones creadas:');
  console.log('      - Aeropuerto: GLOBAL (todos)');
  console.log('      - Centro Histórico: Cliente 1 y 2');
  console.log('      - Parque Industrial: Cliente 3\n');

  // ==============================================
  // 4. CONFIGURACIÓN DE DESTINATARIOS
  // ==============================================
  console.log('📧 Configurando destinatarios de notificaciones...');

  const insertRecipient = db.prepare(`
    INSERT OR IGNORE INTO geofence_recipients (
      client_id, user_id, email, whatsapp, channels, alert_types,
      geofence_ids, vehicle_ids, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Cliente 1: Recibe todas las alertas por email y WhatsApp
  insertRecipient.run(
    '1',
    null,
    'operaciones@transportesvalle.com',
    '+5213312345678',
    JSON.stringify(['email', 'whatsapp']),
    JSON.stringify(['entry', 'exit']),
    null, // Todas las geocercas
    null, // Todos los vehículos
    1
  );

  // Cliente 2: Solo email, solo entradas, vehículos específicos
  insertRecipient.run(
    '2',
    null,
    'alertas@logisticazapopan.com',
    null,
    JSON.stringify(['email']),
    JSON.stringify(['entry']),
    null,
    JSON.stringify(['3', '4']), // Solo vehículos 3 y 4
    1
  );

  // Cliente 3: WhatsApp, geocercas específicas
  insertRecipient.run(
    '3',
    null,
    null,
    '+5213398765432',
    JSON.stringify(['whatsapp']),
    JSON.stringify(['entry', 'exit']),
    JSON.stringify(['admin-geo3', 'admin-geo1']), // Solo parque industrial y aeropuerto
    null,
    1
  );

  console.log('   ✅ 3 configuraciones de destinatarios creadas\n');

  // ==============================================
  // 5. EVENTOS DE PRUEBA
  // ==============================================
  console.log('🎯 Creando eventos de prueba...');

  const insertEvent = db.prepare(`
    INSERT OR IGNORE INTO geofence_events (
      vehicle_id, geofence_id, direction, lat, lng, occurred_at, dedupe_key, processed
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date();
  const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000);
  const tenMinAgo = new Date(now.getTime() - 10 * 60 * 1000);

  // Evento 1: Vehículo 1 entró al aeropuerto
  insertEvent.run(
    '1', // JLS-1234
    'admin-geo1',
    'entry',
    20.5218,
    -103.3112,
    tenMinAgo.toISOString(),
    `1_admin-geo1_entry_${tenMinAgo.toISOString().substring(0, 16)}`,
    0
  );

  // Evento 2: Vehículo 3 entró al centro histórico
  insertEvent.run(
    '3', // JLS-9012
    'admin-geo2',
    'entry',
    20.6725,
    -103.3450,
    fiveMinAgo.toISOString(),
    `3_admin-geo2_entry_${fiveMinAgo.toISOString().substring(0, 16)}`,
    0
  );

  // Evento 3: Vehículo 5 entró al parque industrial
  insertEvent.run(
    '5', // JLS-7890
    'admin-geo3',
    'entry',
    20.6200,
    -103.2450,
    now.toISOString(),
    `5_admin-geo3_entry_${now.toISOString().substring(0, 16)}`,
    0
  );

  console.log('   ✅ 3 eventos de prueba creados (pendientes de procesamiento)\n');

  // ==============================================
  // RESUMEN
  // ==============================================
  console.log('📊 RESUMEN DEL SEED:\n');

  const geofenceCount = db.prepare('SELECT COUNT(*) as count FROM geofences WHERE deleted_at IS NULL').get() as any;
  const clientGeofences = db.prepare("SELECT COUNT(*) as count FROM geofences WHERE owner_type = 'client'").get() as any;
  const adminGeofences = db.prepare("SELECT COUNT(*) as count FROM geofences WHERE owner_type = 'admin'").get() as any;
  const assignments = db.prepare('SELECT COUNT(*) as count FROM geofence_assignments').get() as any;
  const recipients = db.prepare('SELECT COUNT(*) as count FROM geofence_recipients').get() as any;
  const events = db.prepare('SELECT COUNT(*) as count FROM geofence_events').get() as any;

  console.log(`   📍 Total geocercas: ${geofenceCount.count}`);
  console.log(`      - Clientes: ${clientGeofences.count}`);
  console.log(`      - Admin: ${adminGeofences.count}`);
  console.log(`   🔗 Asignaciones: ${assignments.count}`);
  console.log(`   📧 Destinatarios: ${recipients.count}`);
  console.log(`   🎯 Eventos pendientes: ${events.count}\n`);

  console.log('✅ Seed completado exitosamente!\n');

  // ==============================================
  // EJEMPLOS DE CONSULTAS
  // ==============================================
  console.log('📖 Ejemplos de consultas:\n');

  // Geocercas visibles para Cliente 1
  console.log('1️⃣ Geocercas visibles para Cliente 1:');
  const client1Geofences = db.prepare(`
    SELECT g.id, g.name, g.owner_type,
      CASE
        WHEN g.owner_type = 'client' THEN 'propia'
        WHEN ga.scope_type = 'global' THEN 'asignada (global)'
        ELSE 'asignada (específica)'
      END as visibility
    FROM geofences g
    LEFT JOIN geofence_assignments ga ON g.id = ga.geofence_id
    WHERE g.deleted_at IS NULL
      AND (
        (g.owner_type = 'client' AND g.owner_id = '1')
        OR (g.owner_type = 'admin' AND ga.scope_type = 'global')
        OR (g.owner_type = 'admin' AND ga.scope_type = 'client' AND ga.client_id = '1')
      )
  `).all();
  client1Geofences.forEach((g: any) => {
    console.log(`   - ${g.name} (${g.visibility})`);
  });

  console.log('\n2️⃣ Eventos pendientes de procesar:');
  const pendingEvents = db.prepare(`
    SELECT ge.id, v.plate, gf.name, ge.direction, ge.occurred_at
    FROM geofence_events ge
    JOIN vehicles v ON ge.vehicle_id = v.id
    JOIN geofences gf ON ge.geofence_id = gf.id
    WHERE ge.processed = 0
    ORDER BY ge.occurred_at DESC
  `).all();
  pendingEvents.forEach((e: any) => {
    console.log(`   - ${e.plate} → ${e.direction} en "${e.name}" (${new Date(e.occurred_at).toLocaleString()})`);
  });

  console.log('\n');

} catch (error) {
  console.error('\n❌ Error durante el seed:', error);
  process.exit(1);
} finally {
  db.close();
}
