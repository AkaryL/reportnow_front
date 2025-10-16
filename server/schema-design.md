# Esquema de Base de Datos - Sistema de Geocercas Multi-Tenant

## 1. Tabla: `geofences` (MODIFICADA)
Geocercas con ownership y configuración de alertas.

```sql
CREATE TABLE geofences (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,                    -- 'zona-permitida', 'zona-restringida', 'punto-interes'
  color TEXT NOT NULL,
  geom_type TEXT NOT NULL,               -- 'Circle', 'Polygon'
  coordinates TEXT NOT NULL,             -- JSON: {center, radius} o [[lat,lng],...]

  -- Ownership
  owner_type TEXT NOT NULL CHECK(owner_type IN ('client', 'admin')),
  owner_id TEXT,                         -- client_id si owner_type='client', NULL si 'admin'

  -- Configuración de Alertas
  alert_mode TEXT NOT NULL DEFAULT 'entrada_y_salida'
    CHECK(alert_mode IN ('solo_entrada', 'solo_salida', 'entrada_y_salida', 'ninguna')),
  labels_entry TEXT,                     -- JSON array: ["Vehículo entró", "Acceso autorizado"]
  labels_exit TEXT,                      -- JSON array: ["Vehículo salió", "Fin de ruta"]

  -- Soft Delete
  deleted_at DATETIME,

  -- Metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,                       -- user_id del creador

  FOREIGN KEY (owner_id) REFERENCES clients(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_geofences_owner ON geofences(owner_type, owner_id);
CREATE INDEX idx_geofences_deleted ON geofences(deleted_at);
```

**Reglas:**
- `owner_type='client'` → geocerca privada del cliente (owner_id requerido)
- `owner_type='admin'` → geocerca creada por admin/superadmin (owner_id=NULL)

---

## 2. Tabla: `geofence_assignments` (NUEVA)
Asignaciones de geocercas admin a clientes específicos.

```sql
CREATE TABLE geofence_assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  geofence_id TEXT NOT NULL,
  scope_type TEXT NOT NULL CHECK(scope_type IN ('global', 'client')),
  client_id TEXT,                        -- NULL si scope_type='global'
  created_by TEXT NOT NULL,              -- user_id de admin/superadmin
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (geofence_id) REFERENCES geofences(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id),

  UNIQUE(geofence_id, client_id)        -- No duplicar asignaciones
);

CREATE INDEX idx_assignments_geofence ON geofence_assignments(geofence_id);
CREATE INDEX idx_assignments_client ON geofence_assignments(client_id);
```

**Reglas:**
- `scope_type='global'` → todos los clientes ven esta geocerca admin
- `scope_type='client'` → solo client_id específico la ve

---

## 3. Tabla: `geofence_recipients` (NUEVA)
Destinatarios de notificaciones por cliente.

```sql
CREATE TABLE geofence_recipients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id TEXT NOT NULL,
  user_id TEXT,                          -- Opcional: usuario específico del cliente

  -- Canales de notificación
  email TEXT,                            -- Email del destinatario
  whatsapp TEXT,                         -- Número de WhatsApp
  channels TEXT NOT NULL,                -- JSON: ["email", "whatsapp"]

  -- Tipos de alerta a recibir
  alert_types TEXT NOT NULL,             -- JSON: ["entry", "exit"]

  -- Filtros (opcional)
  geofence_ids TEXT,                     -- JSON: ["geo1", "geo2"] o NULL (todas)
  vehicle_ids TEXT,                      -- JSON: ["v1", "v2"] o NULL (todos)

  -- Estado
  is_active INTEGER DEFAULT 1,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_recipients_client ON geofence_recipients(client_id);
CREATE INDEX idx_recipients_active ON geofence_recipients(is_active);
```

**Ejemplo:**
```json
{
  "client_id": "1",
  "email": "alertas@cliente1.com",
  "whatsapp": "+521234567890",
  "channels": ["email", "whatsapp"],
  "alert_types": ["entry", "exit"],
  "geofence_ids": null,  // Todas las geocercas
  "vehicle_ids": ["v1", "v2"]  // Solo vehículos v1 y v2
}
```

---

## 4. Tabla: `geofence_events` (NUEVA)
Registro de eventos de entrada/salida detectados.

```sql
CREATE TABLE geofence_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id TEXT NOT NULL,
  geofence_id TEXT NOT NULL,
  direction TEXT NOT NULL CHECK(direction IN ('entry', 'exit')),

  -- Ubicación del evento
  lat REAL NOT NULL,
  lng REAL NOT NULL,

  -- Timestamp
  occurred_at DATETIME NOT NULL,

  -- Deduplicación
  dedupe_key TEXT NOT NULL,              -- "v1_geo1_entry_20250116_1030"
  processed INTEGER DEFAULT 0,           -- 0=pendiente, 1=procesado

  -- Metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  FOREIGN KEY (geofence_id) REFERENCES geofences(id) ON DELETE CASCADE,

  UNIQUE(dedupe_key)                     -- Evitar duplicados
);

CREATE INDEX idx_events_vehicle ON geofence_events(vehicle_id);
CREATE INDEX idx_events_geofence ON geofence_events(geofence_id);
CREATE INDEX idx_events_processed ON geofence_events(processed);
CREATE INDEX idx_events_occurred ON geofence_events(occurred_at);
```

**Cooldown:** El `dedupe_key` incluye timestamp redondeado (ej: cada 5 minutos) para evitar spam.

---

## 5. Tabla: `notifications_log` (NUEVA)
Registro de notificaciones enviadas (auditoría y antispam).

```sql
CREATE TABLE notifications_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL,

  -- Canal y destinatarios
  channel TEXT NOT NULL CHECK(channel IN ('email', 'whatsapp')),
  recipient TEXT NOT NULL,               -- Email o teléfono

  -- Contenido
  subject TEXT,
  message TEXT NOT NULL,

  -- Estado
  status TEXT NOT NULL CHECK(status IN ('pending', 'sent', 'failed', 'skipped')),
  error_message TEXT,

  -- Timestamps
  sent_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (event_id) REFERENCES geofence_events(id) ON DELETE CASCADE
);

CREATE INDEX idx_notifications_event ON notifications_log(event_id);
CREATE INDEX idx_notifications_status ON notifications_log(status);
CREATE INDEX idx_notifications_sent ON notifications_log(sent_at);
```

---

## 6. Tabla: `audit_log` (NUEVA)
Auditoría de acciones críticas.

```sql
CREATE TABLE audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,                  -- 'create_geofence', 'assign_geofence', 'delete_admin', etc.
  resource_type TEXT NOT NULL,           -- 'geofence', 'user', 'assignment', etc.
  resource_id TEXT,

  -- Detalles
  details TEXT,                          -- JSON con información adicional
  ip_address TEXT,
  user_agent TEXT,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_action ON audit_log(action);
CREATE INDEX idx_audit_created ON audit_log(created_at);
```

---

## Resumen de Cambios

### Tablas Modificadas:
1. **`geofences`**: Añadir owner_type, owner_id, alert_mode, labels_entry, labels_exit, deleted_at, created_by

### Tablas Nuevas:
2. **`geofence_assignments`**: Asignaciones de geocercas admin a clientes
3. **`geofence_recipients`**: Configuración de destinatarios de notificaciones
4. **`geofence_events`**: Eventos de entrada/salida detectados
5. **`notifications_log`**: Registro de notificaciones enviadas
6. **`audit_log`**: Auditoría de acciones críticas

### Índices:
- Índices en owner_type/owner_id, deleted_at
- Índices en tablas de relación (assignments, recipients)
- Índices para optimizar queries del worker (processed, occurred_at)
