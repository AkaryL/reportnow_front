import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, 'fleetwatch.db'));

console.log('🚀 Iniciando migración a sistema multi-tenant...\n');

// Enable foreign keys
db.pragma('foreign_keys = ON');

try {
  // ==============================================
  // PASO 1: Modificar tabla geofences
  // ==============================================
  console.log('📝 Paso 1: Modificando tabla geofences...');

  // Verificar si ya tiene las nuevas columnas
  const tableInfo = db.prepare("PRAGMA table_info(geofences)").all() as any[];
  const hasOwnerType = tableInfo.some(col => col.name === 'owner_type');

  if (!hasOwnerType) {
    // Agregar nuevas columnas
    db.exec(`
      ALTER TABLE geofences ADD COLUMN owner_type TEXT NOT NULL DEFAULT 'admin'
        CHECK(owner_type IN ('client', 'admin'));
    `);

    db.exec(`ALTER TABLE geofences ADD COLUMN owner_id TEXT;`);
    db.exec(`ALTER TABLE geofences ADD COLUMN alert_mode TEXT NOT NULL DEFAULT 'entrada_y_salida'
      CHECK(alert_mode IN ('solo_entrada', 'solo_salida', 'entrada_y_salida', 'ninguna'));`);
    db.exec(`ALTER TABLE geofences ADD COLUMN labels_entry TEXT;`);
    db.exec(`ALTER TABLE geofences ADD COLUMN labels_exit TEXT;`);
    db.exec(`ALTER TABLE geofences ADD COLUMN deleted_at DATETIME;`);
    db.exec(`ALTER TABLE geofences ADD COLUMN created_by TEXT;`);

    // Actualizar geocercas existentes como 'admin' ownership
    db.exec(`UPDATE geofences SET owner_type = 'admin', owner_id = NULL WHERE owner_type IS NULL;`);

    // Set default labels for existing geofences
    db.exec(`
      UPDATE geofences
      SET labels_entry = '["Vehículo entró a la zona"]',
          labels_exit = '["Vehículo salió de la zona"]'
      WHERE labels_entry IS NULL;
    `);

    console.log('   ✅ Columnas agregadas a geofences');
  } else {
    console.log('   ⏭️  Las columnas ya existen, saltando...');
  }

  // Crear índices para geofences
  db.exec(`CREATE INDEX IF NOT EXISTS idx_geofences_owner ON geofences(owner_type, owner_id);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_geofences_deleted ON geofences(deleted_at);`);
  console.log('   ✅ Índices creados\n');

  // ==============================================
  // PASO 2: Crear tabla geofence_assignments
  // ==============================================
  console.log('📝 Paso 2: Creando tabla geofence_assignments...');

  db.exec(`
    CREATE TABLE IF NOT EXISTS geofence_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      geofence_id TEXT NOT NULL,
      scope_type TEXT NOT NULL CHECK(scope_type IN ('global', 'client')),
      client_id TEXT,
      created_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (geofence_id) REFERENCES geofences(id) ON DELETE CASCADE,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id),

      UNIQUE(geofence_id, client_id)
    );
  `);

  db.exec(`CREATE INDEX IF NOT EXISTS idx_assignments_geofence ON geofence_assignments(geofence_id);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_assignments_client ON geofence_assignments(client_id);`);
  console.log('   ✅ Tabla geofence_assignments creada\n');

  // ==============================================
  // PASO 3: Crear tabla geofence_recipients
  // ==============================================
  console.log('📝 Paso 3: Creando tabla geofence_recipients...');

  db.exec(`
    CREATE TABLE IF NOT EXISTS geofence_recipients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id TEXT NOT NULL,
      user_id TEXT,

      email TEXT,
      whatsapp TEXT,
      channels TEXT NOT NULL,
      alert_types TEXT NOT NULL,

      geofence_ids TEXT,
      vehicle_ids TEXT,

      is_active INTEGER DEFAULT 1,

      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  db.exec(`CREATE INDEX IF NOT EXISTS idx_recipients_client ON geofence_recipients(client_id);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_recipients_active ON geofence_recipients(is_active);`);
  console.log('   ✅ Tabla geofence_recipients creada\n');

  // ==============================================
  // PASO 4: Crear tabla geofence_events
  // ==============================================
  console.log('📝 Paso 4: Creando tabla geofence_events...');

  db.exec(`
    CREATE TABLE IF NOT EXISTS geofence_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicle_id TEXT NOT NULL,
      geofence_id TEXT NOT NULL,
      direction TEXT NOT NULL CHECK(direction IN ('entry', 'exit')),

      lat REAL NOT NULL,
      lng REAL NOT NULL,

      occurred_at DATETIME NOT NULL,

      dedupe_key TEXT NOT NULL,
      processed INTEGER DEFAULT 0,

      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
      FOREIGN KEY (geofence_id) REFERENCES geofences(id) ON DELETE CASCADE,

      UNIQUE(dedupe_key)
    );
  `);

  db.exec(`CREATE INDEX IF NOT EXISTS idx_events_vehicle ON geofence_events(vehicle_id);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_events_geofence ON geofence_events(geofence_id);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_events_processed ON geofence_events(processed);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_events_occurred ON geofence_events(occurred_at);`);
  console.log('   ✅ Tabla geofence_events creada\n');

  // ==============================================
  // PASO 5: Crear tabla notifications_log
  // ==============================================
  console.log('📝 Paso 5: Creando tabla notifications_log...');

  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL,

      channel TEXT NOT NULL CHECK(channel IN ('email', 'whatsapp')),
      recipient TEXT NOT NULL,

      subject TEXT,
      message TEXT NOT NULL,

      status TEXT NOT NULL CHECK(status IN ('pending', 'sent', 'failed', 'skipped')),
      error_message TEXT,

      sent_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (event_id) REFERENCES geofence_events(id) ON DELETE CASCADE
    );
  `);

  db.exec(`CREATE INDEX IF NOT EXISTS idx_notifications_event ON notifications_log(event_id);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications_log(status);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_notifications_sent ON notifications_log(sent_at);`);
  console.log('   ✅ Tabla notifications_log creada\n');

  // ==============================================
  // PASO 6: Crear tabla audit_log
  // ==============================================
  console.log('📝 Paso 6: Creando tabla audit_log...');

  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      action TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      resource_id TEXT,

      details TEXT,
      ip_address TEXT,
      user_agent TEXT,

      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  db.exec(`CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);`);
  console.log('   ✅ Tabla audit_log creada\n');

  // ==============================================
  // Verificación Final
  // ==============================================
  console.log('🔍 Verificando tablas creadas...');

  const tables = db.prepare(`
    SELECT name FROM sqlite_master
    WHERE type='table' AND name NOT LIKE 'sqlite_%'
    ORDER BY name
  `).all() as any[];

  console.log('\n📊 Tablas en la base de datos:');
  tables.forEach(t => console.log(`   - ${t.name}`));

  console.log('\n✅ Migración completada exitosamente!');

} catch (error) {
  console.error('\n❌ Error durante la migración:', error);
  process.exit(1);
} finally {
  db.close();
}
