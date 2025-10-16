import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, 'fleetwatch.db'));

// Delete all existing geofences
db.prepare('DELETE FROM geofences').run();

// Insert new circular geofences
const insertGeofence = db.prepare(`
  INSERT INTO geofences (id, name, type, color, geom_type, coordinates)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const geofences = [
  [
    '1',
    'Centro Zapopan',
    'zona-permitida',
    '#10b981',
    'Circle',
    JSON.stringify({ center: [-103.3915, 20.7215], radius: 400 }),
  ],
  [
    '2',
    'Andares',
    'punto-interes',
    '#1fb6aa',
    'Circle',
    JSON.stringify({ center: [-103.4620, 20.7345], radius: 350 }),
  ],
  [
    '3',
    'Plaza del Sol',
    'punto-interes',
    '#1fb6aa',
    'Circle',
    JSON.stringify({ center: [-103.3990, 20.6595], radius: 300 }),
  ],
  [
    '4',
    'Zona Restringida Norte',
    'zona-restringida',
    '#ef4444',
    'Circle',
    JSON.stringify({ center: [-103.3725, 20.7500], radius: 500 }),
  ],
  [
    '5',
    'Base de Operaciones',
    'punto-interes',
    '#1fb6aa',
    'Circle',
    JSON.stringify({ center: [-103.4180, 20.7075], radius: 300 }),
  ],
];

geofences.forEach(geofence => insertGeofence.run(...geofence));

console.log('✅ Geofences updated to circles successfully!');

db.close();
