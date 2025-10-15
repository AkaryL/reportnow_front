import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, 'fleetwatch.db'));

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Migration: Add client_id column if it doesn't exist
try {
  db.exec(`ALTER TABLE users ADD COLUMN client_id TEXT REFERENCES clients(id)`);
  console.log('✅ Added client_id column to users table');
} catch (error: any) {
  // Column already exists, ignore
  if (!error.message.includes('duplicate column')) {
    console.log('ℹ️ client_id column already exists');
  }
}

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('superuser', 'admin', 'client')),
    email TEXT,
    client_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id)
  );

  CREATE TABLE IF NOT EXISTS user_vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    vehicle_id TEXT NOT NULL,
    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    UNIQUE(user_id, vehicle_id)
  );

  CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_activity DATETIME
  );

  CREATE TABLE IF NOT EXISTS vehicles (
    id TEXT PRIMARY KEY,
    plate TEXT UNIQUE NOT NULL,
    driver TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('moving', 'stopped', 'offline', 'critical')),
    fuel REAL NOT NULL,
    speed REAL DEFAULT 0,
    temp REAL,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    last_seen_min INTEGER DEFAULT 0,
    device_id TEXT,
    client_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id)
  );

  CREATE TABLE IF NOT EXISTS geofences (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    color TEXT NOT NULL,
    geom_type TEXT NOT NULL,
    coordinates TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    vehicle_plate TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('crit', 'warn', 'info')),
    text TEXT NOT NULL,
    read INTEGER DEFAULT 0,
    ts DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_plate) REFERENCES vehicles(plate)
  );

  CREATE TABLE IF NOT EXISTS vehicle_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id TEXT NOT NULL,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    speed REAL NOT NULL,
    fuel REAL NOT NULL,
    temp REAL,
    ts DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
  );
`);

// Insert initial data
const insertUser = db.prepare(`
  INSERT OR IGNORE INTO users (id, username, password, name, role, email)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const users = [
  ['1', 'julio', 'admin123', 'Julio González', 'superuser', 'julio@fleetwatch.com'],
  ['2', 'admin', 'admin123', 'Admin User', 'admin', 'admin@fleetwatch.com'],
  ['3', 'cliente', 'cliente123', 'Cliente Demo', 'client', 'cliente@fleetwatch.com'],
];

users.forEach(user => insertUser.run(...user));

const insertClient = db.prepare(`
  INSERT OR IGNORE INTO clients (id, name, email, phone, last_activity)
  VALUES (?, ?, ?, ?, ?)
`);

const clients = [
  ['1', 'Transportes del Valle', 'contacto@transportesvalle.com', '+52 33 1234 5678', new Date().toISOString()],
  ['2', 'Logística Zapopan', 'info@logisticazapopan.com', '+52 33 8765 4321', new Date().toISOString()],
  ['3', 'Distribuidora Jalisco', 'ventas@distribuidorajalisco.com', '+52 33 5555 1234', new Date().toISOString()],
  ['4', 'Entregas Rápidas SA', 'servicio@entregasrapidas.com', '+52 33 9876 5432', new Date().toISOString()],
  ['5', 'Mensajería Express', 'contacto@mensajeriaexpress.com', '+52 33 4444 7777', new Date().toISOString()],
];

clients.forEach(client => insertClient.run(...client));

const insertVehicle = db.prepare(`
  INSERT OR IGNORE INTO vehicles (id, plate, driver, status, fuel, speed, temp, lat, lng, last_seen_min, device_id, client_id)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const vehicles = [
  ['1', 'JLS-1234', 'Juan Pérez Sánchez', 'moving', 75, 45, 22, 20.7214, -103.3918, 0, 'dev-001', '1'],
  ['2', 'JLS-5678', 'María González López', 'stopped', 82, 0, 18, 20.6597, -103.3494, 2, 'dev-002', '1'],
  ['3', 'JLS-9012', 'Carlos Hernández', 'moving', 45, 62, 28, 20.7350, -103.4622, 1, 'dev-003', '2'],
  ['4', 'JLS-3456', 'Ana Martínez', 'offline', 68, 0, null, 20.6737, -103.4054, 35, 'dev-004', '2'],
  ['5', 'JLS-7890', 'Roberto Sánchez', 'critical', 15, 0, 35, 20.7167, -103.3830, 0, 'dev-005', '3'],
  ['6', 'JLS-2468', 'Laura Ramírez', 'moving', 91, 38, 20, 20.6889, -103.3983, 0, 'dev-006', '3'],
  ['7', 'JLS-1357', 'Miguel Torres', 'stopped', 55, 0, 19, 20.7089, -103.4173, 5, 'dev-007', '4'],
  ['8', 'JLS-8024', 'Patricia Flores', 'moving', 78, 52, 24, 20.7456, -103.3789, 0, 'dev-008', '4'],
  ['9', 'JLS-9753', 'José Morales', 'moving', 88, 41, 21, 20.6945, -103.4267, 1, 'dev-009', '5'],
  ['10', 'JLS-4682', 'Carmen Ruiz', 'stopped', 62, 0, 17, 20.7234, -103.3567, 8, 'dev-010', '5'],
  ['11', 'JLS-3691', 'Fernando Castro', 'moving', 70, 48, 23, 20.7123, -103.4089, 0, 'dev-011', '1'],
  ['12', 'JLS-1593', 'Diana Ortiz', 'offline', 35, 0, null, 20.6834, -103.3745, 42, 'dev-012', '2'],
  ['13', 'JLS-7531', 'Ricardo Vargas', 'moving', 95, 55, 25, 20.7389, -103.3912, 0, 'dev-013', '3'],
  ['14', 'JLS-8642', 'Gabriela Méndez', 'stopped', 41, 0, 18, 20.6678, -103.4156, 12, 'dev-014', '4'],
  ['15', 'JLS-9517', 'Alberto Guzmán', 'critical', 18, 0, 38, 20.7512, -103.3678, 1, 'dev-015', '5'],
];

vehicles.forEach(vehicle => insertVehicle.run(...vehicle));

const insertGeofence = db.prepare(`
  INSERT OR IGNORE INTO geofences (id, name, type, color, geom_type, coordinates)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const geofences = [
  [
    '1',
    'Centro Zapopan',
    'zona-permitida',
    '#10b981',
    'Polygon',
    JSON.stringify([[
      [-103.3950, 20.7250],
      [-103.3880, 20.7250],
      [-103.3880, 20.7180],
      [-103.3950, 20.7180],
      [-103.3950, 20.7250],
    ]]),
  ],
  [
    '2',
    'Andares',
    'punto-interes',
    '#1fb6aa',
    'Polygon',
    JSON.stringify([[
      [-103.4650, 20.7370],
      [-103.4590, 20.7370],
      [-103.4590, 20.7320],
      [-103.4650, 20.7320],
      [-103.4650, 20.7370],
    ]]),
  ],
  [
    '3',
    'Plaza del Sol',
    'punto-interes',
    '#1fb6aa',
    'Polygon',
    JSON.stringify([[
      [-103.4020, 20.6620],
      [-103.3960, 20.6620],
      [-103.3960, 20.6570],
      [-103.4020, 20.6570],
      [-103.4020, 20.6620],
    ]]),
  ],
  [
    '4',
    'Zona Restringida Norte',
    'zona-restringida',
    '#ef4444',
    'Polygon',
    JSON.stringify([[
      [-103.3800, 20.7550],
      [-103.3650, 20.7550],
      [-103.3650, 20.7450],
      [-103.3800, 20.7450],
      [-103.3800, 20.7550],
    ]]),
  ],
  [
    '5',
    'Base de Operaciones',
    'punto-interes',
    '#1fb6aa',
    'Polygon',
    JSON.stringify([[
      [-103.4210, 20.7100],
      [-103.4150, 20.7100],
      [-103.4150, 20.7050],
      [-103.4210, 20.7050],
      [-103.4210, 20.7100],
    ]]),
  ],
];

geofences.forEach(geofence => insertGeofence.run(...geofence));

const insertNotification = db.prepare(`
  INSERT OR IGNORE INTO notifications (id, vehicle_plate, type, text, read, ts)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const notifications = [
  ['1', 'JLS-5678', 'crit', 'Vehículo detenido por más de 30 minutos en zona no autorizada', 0, new Date(Date.now() - 15 * 60000).toISOString()],
  ['2', 'JLS-3456', 'warn', 'Vehículo sin señal GPS por más de 30 minutos', 0, new Date(Date.now() - 35 * 60000).toISOString()],
  ['3', 'JLS-7890', 'crit', 'Nivel de combustible crítico: 15%', 0, new Date(Date.now() - 5 * 60000).toISOString()],
  ['4', 'JLS-1234', 'info', 'Vehículo ha completado ruta asignada', 1, new Date(Date.now() - 120 * 60000).toISOString()],
  ['5', 'JLS-2468', 'warn', 'Exceso de velocidad detectado: 95 km/h en zona de 60 km/h', 0, new Date(Date.now() - 45 * 60000).toISOString()],
  ['6', 'JLS-9012', 'warn', 'Temperatura del motor elevada: 28°C', 1, new Date(Date.now() - 90 * 60000).toISOString()],
  ['7', 'JLS-8024', 'info', 'Mantenimiento programado en 500 km', 1, new Date(Date.now() - 180 * 60000).toISOString()],
  ['8', 'JLS-9517', 'crit', 'Alerta crítica: Temperatura del motor muy alta (38°C) y combustible bajo', 0, new Date(Date.now() - 2 * 60000).toISOString()],
];

notifications.forEach(notification => insertNotification.run(...notification));

// Insert vehicle history data (last week with ~10 stops per day)
const insertHistory = db.prepare(`
  INSERT OR IGNORE INTO vehicle_history (vehicle_id, lat, lng, speed, fuel, temp, ts)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

// Generate realistic route history with stops for a single day
const generateDayRouteWithStops = (vehicleId: string, startLat: number, startLng: number, date: Date) => {
  const history: any[] = [];
  const numStops = 8 + Math.floor(Math.random() * 5); // 8-12 stops per day

  // Start at 8 AM
  const startHour = 8;
  const endHour = 18; // End at 6 PM
  const totalMinutes = (endHour - startHour) * 60;
  const minutesPerStop = totalMinutes / numStops;

  let currentLat = startLat;
  let currentLng = startLng;
  let currentFuel = 85 + Math.random() * 10; // Start with 85-95% fuel

  for (let stopIndex = 0; stopIndex < numStops; stopIndex++) {
    const stopStartMinutes = startHour * 60 + stopIndex * minutesPerStop;
    const stopEndMinutes = stopStartMinutes + 15 + Math.random() * 20; // Stop duration: 15-35 minutes

    // Move to new location (if not first stop)
    if (stopIndex > 0) {
      const travelMinutes = 10 + Math.random() * 20; // 10-30 minutes travel
      const pointsInTravel = 3 + Math.floor(Math.random() * 4); // 3-6 points during travel

      // Generate destination
      const angle = Math.random() * Math.PI * 2;
      const distance = 0.01 + Math.random() * 0.02; // 1-3 km
      const destLat = currentLat + Math.cos(angle) * distance;
      const destLng = currentLng + Math.sin(angle) * distance;

      // Generate points during travel
      for (let j = 0; j < pointsInTravel; j++) {
        const progress = (j + 1) / pointsInTravel;
        const travelLat = currentLat + (destLat - currentLat) * progress;
        const travelLng = currentLng + (destLng - currentLng) * progress;
        const travelTime = stopStartMinutes - travelMinutes + (travelMinutes * progress);

        const timestamp = new Date(date);
        timestamp.setHours(0, travelTime, 0, 0);

        const speed = 30 + Math.random() * 40; // 30-70 km/h
        currentFuel = Math.max(15, currentFuel - 0.5);
        const temp = 22 + Math.random() * 8;

        history.push([vehicleId, travelLat, travelLng, speed, currentFuel, temp, timestamp.toISOString()]);
      }

      currentLat = destLat;
      currentLng = destLng;
    }

    // Add stop point (speed = 0)
    const stopTime = new Date(date);
    stopTime.setHours(0, stopStartMinutes, 0, 0);

    const temp = 20 + Math.random() * 6;
    history.push([vehicleId, currentLat, currentLng, 0, currentFuel, temp, stopTime.toISOString()]);

    // Add another point at end of stop
    const stopEndTime = new Date(date);
    stopEndTime.setHours(0, stopEndMinutes, 0, 0);
    history.push([vehicleId, currentLat, currentLng, 0, currentFuel, temp, stopEndTime.toISOString()]);
  }

  return history;
};

// Generate history for last 7 days for active vehicles
const vehicleHistories: any[] = [];
const activeVehicles = [
  { id: '1', lat: 20.7214, lng: -103.3918 },  // JLS-1234
  { id: '2', lat: 20.6597, lng: -103.3494 },  // JLS-5678
  { id: '3', lat: 20.7350, lng: -103.4622 },  // JLS-9012
  { id: '6', lat: 20.6889, lng: -103.3983 },  // JLS-2468
  { id: '8', lat: 20.7456, lng: -103.3789 },  // JLS-8024
  { id: '9', lat: 20.6945, lng: -103.4267 },  // JLS-9753
  { id: '11', lat: 20.7123, lng: -103.4089 }, // JLS-3691
  { id: '13', lat: 20.7389, lng: -103.3912 }, // JLS-7531
];

// Generate for last 7 days
for (let daysAgo = 6; daysAgo >= 0; daysAgo--) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(0, 0, 0, 0);

  // Skip weekends (Saturday = 6, Sunday = 0)
  if (date.getDay() === 0 || date.getDay() === 6) continue;

  activeVehicles.forEach(vehicle => {
    // Add some randomness - not all vehicles work every day
    if (Math.random() > 0.15) { // 85% chance vehicle worked that day
      vehicleHistories.push(...generateDayRouteWithStops(vehicle.id, vehicle.lat, vehicle.lng, date));
    }
  });
}

vehicleHistories.forEach(record => insertHistory.run(...record));

console.log('✅ Database initialized with seed data');

export default db;
