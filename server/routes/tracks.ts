import { Router, Request, Response } from 'express';
import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { simulateTrack } from '../services/trackSimulator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = Router();
const db = new Database(join(__dirname, '../fleetwatch.db'));

// Create tracks table if not exists
db.exec(`
  CREATE TABLE IF NOT EXISTS vehicle_tracks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id TEXT NOT NULL,
    date TEXT NOT NULL,
    points TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(vehicle_id, date),
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
  )
`);

/**
 * GET /api/vehicles/:id/tracks?date=YYYY-MM-DD
 * Get track points for a specific vehicle and date
 */
router.get('/vehicles/:id/tracks', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    if (!date || typeof date !== 'string') {
      return res.status(400).json({ error: 'Date parameter is required (YYYY-MM-DD)' });
    }

    // Check if vehicle exists
    const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(id);
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    // Get track for the specified date
    const track = db.prepare('SELECT * FROM vehicle_tracks WHERE vehicle_id = ? AND date = ?').get(id, date) as any;

    if (!track) {
      return res.json({ vehicleId: id, date, points: [] });
    }

    const points = JSON.parse(track.points);

    res.json({
      vehicleId: id,
      date,
      points
    });
  } catch (error: any) {
    console.error('Error fetching track:', error);
    res.status(500).json({ error: 'Error fetching track data', details: error.message });
  }
});

/**
 * POST /api/vehicles/:id/tracks/simulate
 * Generate and persist a simulated track
 * Body: { date, count?, start?, bearing?, avgSpeedKmh? }
 */
router.post('/vehicles/:id/tracks/simulate', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { date, count = 40, start, bearing, avgSpeedKmh } = req.body;

    if (!date) {
      return res.status(400).json({ error: 'Date is required (YYYY-MM-DD)' });
    }

    // Check if vehicle exists
    const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(id) as any;
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    // Use vehicle's current location as default start
    const startPoint = start || { lat: vehicle.lat, lng: vehicle.lng };

    // Generate track
    const track = simulateTrack({
      vehicleId: id,
      dateISO: date,
      count,
      start: startPoint,
      bearing,
      avgSpeedKmh
    });

    // Store in database (replace if exists)
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO vehicle_tracks (vehicle_id, date, points)
      VALUES (?, ?, ?)
    `);

    stmt.run(id, date, JSON.stringify(track.points));

    console.log(`✅ Generated track for vehicle ${id} on ${date} with ${track.points.length} points`);

    res.status(201).json(track);
  } catch (error: any) {
    console.error('Error simulating track:', error);
    res.status(500).json({ error: 'Error simulating track', details: error.message });
  }
});

/**
 * GET /api/vehicles/:id/tracks/dates
 * Get available dates with track data for a vehicle
 */
router.get('/vehicles/:id/tracks/dates', (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if vehicle exists
    const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(id);
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    // Get all dates with tracks
    const tracks = db.prepare(`
      SELECT date, points
      FROM vehicle_tracks
      WHERE vehicle_id = ?
      ORDER BY date DESC
    `).all(id) as any[];

    const dates = tracks.map(track => ({
      date: track.date,
      points: JSON.parse(track.points).length
    }));

    res.json(dates);
  } catch (error: any) {
    console.error('Error fetching track dates:', error);
    res.status(500).json({ error: 'Error fetching track dates', details: error.message });
  }
});

/**
 * POST /api/vehicles/:id/tracks/generate-week
 * Generate tracks for the last 7 days
 */
router.post('/vehicles/:id/tracks/generate-week', (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if vehicle exists
    const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(id) as any;
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    const generated = [];
    const today = new Date();

    // Generate tracks for last 7 days
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      // Check if track already exists
      const existing = db.prepare('SELECT * FROM vehicle_tracks WHERE vehicle_id = ? AND date = ?').get(id, dateStr);

      if (!existing) {
        // Generate track
        const track = simulateTrack({
          vehicleId: id,
          dateISO: dateStr,
          count: 40,
          start: { lat: vehicle.lat, lng: vehicle.lng },
          avgSpeedKmh: 30 + Math.random() * 20
        });

        // Store in database
        const stmt = db.prepare(`
          INSERT INTO vehicle_tracks (vehicle_id, date, points)
          VALUES (?, ?, ?)
        `);

        stmt.run(id, dateStr, JSON.stringify(track.points));
        generated.push(dateStr);
      }
    }

    console.log(`✅ Generated ${generated.length} tracks for vehicle ${id}`);

    res.json({
      vehicleId: id,
      generated: generated.length,
      dates: generated
    });
  } catch (error: any) {
    console.error('Error generating week tracks:', error);
    res.status(500).json({ error: 'Error generating week tracks', details: error.message });
  }
});

export default router;
