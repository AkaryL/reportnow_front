import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import db from './database.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://localhost:5177'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

app.use(cors());
app.use(express.json());

// ==================== AUTH ====================
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  const stmt = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?');
  const user = stmt.get(username, password) as any;

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const { password: _, ...userWithoutPassword } = user;

  res.json({
    user: userWithoutPassword,
    token: `mock-jwt-token-${user.id}`,
  });
});

// ==================== USERS ====================
app.get('/api/users', (req, res) => {
  const stmt = db.prepare(`
    SELECT u.id, u.username, u.name, u.role, u.email, u.client_id, u.created_at,
           COUNT(uv.vehicle_id) as assigned_vehicles
    FROM users u
    LEFT JOIN user_vehicles uv ON u.id = uv.user_id
    GROUP BY u.id
    ORDER BY u.created_at DESC
  `);
  const users = stmt.all();
  res.json(users);
});

app.get('/api/users/:id', (req, res) => {
  const stmt = db.prepare('SELECT id, username, name, role, email, client_id, created_at FROM users WHERE id = ?');
  const user = stmt.get(req.params.id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Get assigned vehicles
  const vehiclesStmt = db.prepare(`
    SELECT v.* FROM vehicles v
    INNER JOIN user_vehicles uv ON v.id = uv.vehicle_id
    WHERE uv.user_id = ?
  `);
  const vehicles = vehiclesStmt.all(req.params.id);

  res.json({ ...user, vehicles });
});

app.post('/api/users', (req, res) => {
  const { username, password, name, role, email, client_id, vehicle_ids } = req.body;

  const id = `u-${Date.now()}`;
  const stmt = db.prepare(`
    INSERT INTO users (id, username, password, name, role, email, client_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  try {
    stmt.run(id, username, password, name, role, email || null, client_id || null);

    // Assign vehicles if provided
    if (vehicle_ids && vehicle_ids.length > 0) {
      const assignStmt = db.prepare('INSERT INTO user_vehicles (user_id, vehicle_id) VALUES (?, ?)');
      vehicle_ids.forEach((vehicleId: string) => {
        try {
          assignStmt.run(id, vehicleId);
        } catch (e) {
          // Ignore duplicates
        }
      });
    }

    const newUser = db.prepare('SELECT id, username, name, role, email, client_id, created_at FROM users WHERE id = ?').get(id);

    io.emit('user:created', newUser);

    res.status(201).json(newUser);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/users/:id', (req, res) => {
  const { username, password, name, role, email, client_id, vehicle_ids } = req.body;

  const updates: string[] = [];
  const values: any[] = [];

  if (username) { updates.push('username = ?'); values.push(username); }
  if (password) { updates.push('password = ?'); values.push(password); }
  if (name) { updates.push('name = ?'); values.push(name); }
  if (role) { updates.push('role = ?'); values.push(role); }
  if (email !== undefined) { updates.push('email = ?'); values.push(email || null); }
  if (client_id !== undefined) { updates.push('client_id = ?'); values.push(client_id || null); }

  values.push(req.params.id);

  const stmt = db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`);

  try {
    const result = stmt.run(...values);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update vehicle assignments
    if (vehicle_ids !== undefined) {
      // Remove existing assignments
      db.prepare('DELETE FROM user_vehicles WHERE user_id = ?').run(req.params.id);

      // Add new assignments
      if (vehicle_ids.length > 0) {
        const assignStmt = db.prepare('INSERT INTO user_vehicles (user_id, vehicle_id) VALUES (?, ?)');
        vehicle_ids.forEach((vehicleId: string) => {
          try {
            assignStmt.run(req.params.id, vehicleId);
          } catch (e) {
            // Ignore duplicates
          }
        });
      }
    }

    const updatedUser = db.prepare('SELECT id, username, name, role, email, client_id, created_at FROM users WHERE id = ?').get(req.params.id);

    io.emit('user:updated', updatedUser);

    res.json(updatedUser);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/users/:id', (req, res) => {
  const stmt = db.prepare('DELETE FROM users WHERE id = ?');
  const result = stmt.run(req.params.id);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'User not found' });
  }

  io.emit('user:deleted', req.params.id);

  res.status(204).send();
});

// ==================== USER VEHICLE ASSIGNMENTS ====================
app.get('/api/users/:id/vehicles', (req, res) => {
  const stmt = db.prepare(`
    SELECT v.* FROM vehicles v
    INNER JOIN user_vehicles uv ON v.id = uv.vehicle_id
    WHERE uv.user_id = ?
  `);
  const vehicles = stmt.all(req.params.id);
  res.json(vehicles);
});

app.post('/api/users/:id/vehicles', (req, res) => {
  const { vehicle_id } = req.body;

  const stmt = db.prepare('INSERT INTO user_vehicles (user_id, vehicle_id) VALUES (?, ?)');

  try {
    stmt.run(req.params.id, vehicle_id);
    res.status(201).json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/users/:userId/vehicles/:vehicleId', (req, res) => {
  const stmt = db.prepare('DELETE FROM user_vehicles WHERE user_id = ? AND vehicle_id = ?');
  const result = stmt.run(req.params.userId, req.params.vehicleId);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Assignment not found' });
  }

  res.status(204).send();
});

// ==================== VEHICLES ====================
app.get('/api/vehicles', (req, res) => {
  const stmt = db.prepare('SELECT * FROM vehicles ORDER BY updated_at DESC');
  const vehicles = stmt.all();
  res.json(vehicles);
});

app.get('/api/vehicles/:id', (req, res) => {
  const stmt = db.prepare('SELECT * FROM vehicles WHERE id = ?');
  const vehicle = stmt.get(req.params.id);

  if (!vehicle) {
    return res.status(404).json({ error: 'Vehicle not found' });
  }

  res.json(vehicle);
});

app.post('/api/vehicles', (req, res) => {
  const { plate, driver, status, fuel, speed, temp, lat, lng, device_id, client_id } = req.body;

  const id = `v-${Date.now()}`;
  const stmt = db.prepare(`
    INSERT INTO vehicles (id, plate, driver, status, fuel, speed, temp, lat, lng, device_id, client_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  try {
    stmt.run(id, plate, driver, status || 'offline', fuel || 0, speed || 0, temp, lat, lng, device_id, client_id);

    const newVehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(id);

    // Emit to all connected clients
    io.emit('vehicle:created', newVehicle);

    res.status(201).json(newVehicle);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/vehicles/:id', (req, res) => {
  const { plate, driver, status, fuel, speed, temp, lat, lng, device_id, client_id } = req.body;

  const stmt = db.prepare(`
    UPDATE vehicles
    SET plate = ?, driver = ?, status = ?, fuel = ?, speed = ?, temp = ?,
        lat = ?, lng = ?, device_id = ?, client_id = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  try {
    const result = stmt.run(plate, driver, status, fuel, speed, temp, lat, lng, device_id, client_id, req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    const updatedVehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(req.params.id);

    // Emit to all connected clients
    io.emit('vehicle:updated', updatedVehicle);

    res.json(updatedVehicle);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/vehicles/:id', (req, res) => {
  const stmt = db.prepare('DELETE FROM vehicles WHERE id = ?');
  const result = stmt.run(req.params.id);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Vehicle not found' });
  }

  // Emit to all connected clients
  io.emit('vehicle:deleted', req.params.id);

  res.status(204).send();
});

// ==================== CLIENTS ====================
app.get('/api/clients', (req, res) => {
  const stmt = db.prepare(`
    SELECT c.*, COUNT(v.id) as vehicles
    FROM clients c
    LEFT JOIN vehicles v ON v.client_id = c.id
    GROUP BY c.id
    ORDER BY c.created_at DESC
  `);
  const clients = stmt.all();
  res.json(clients);
});

app.get('/api/clients/:id', (req, res) => {
  const stmt = db.prepare('SELECT * FROM clients WHERE id = ?');
  const client = stmt.get(req.params.id);

  if (!client) {
    return res.status(404).json({ error: 'Client not found' });
  }

  res.json(client);
});

app.post('/api/clients', (req, res) => {
  const { name, email, phone } = req.body;

  const id = `c-${Date.now()}`;
  const stmt = db.prepare(`
    INSERT INTO clients (id, name, email, phone)
    VALUES (?, ?, ?, ?)
  `);

  try {
    stmt.run(id, name, email, phone);

    const newClient = db.prepare('SELECT * FROM clients WHERE id = ?').get(id);

    io.emit('client:created', newClient);

    res.status(201).json(newClient);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/clients/:id', (req, res) => {
  const { name, email, phone } = req.body;

  const stmt = db.prepare(`
    UPDATE clients
    SET name = ?, email = ?, phone = ?
    WHERE id = ?
  `);

  try {
    const result = stmt.run(name, email, phone, req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const updatedClient = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);

    io.emit('client:updated', updatedClient);

    res.json(updatedClient);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/clients/:id', (req, res) => {
  // Check if client has vehicles
  const checkStmt = db.prepare('SELECT COUNT(*) as count FROM vehicles WHERE client_id = ?');
  const result = checkStmt.get(req.params.id) as any;

  if (result.count > 0) {
    return res.status(400).json({ error: 'Cannot delete client with assigned vehicles' });
  }

  const stmt = db.prepare('DELETE FROM clients WHERE id = ?');
  const deleteResult = stmt.run(req.params.id);

  if (deleteResult.changes === 0) {
    return res.status(404).json({ error: 'Client not found' });
  }

  io.emit('client:deleted', req.params.id);

  res.status(204).send();
});

// ==================== GEOFENCES ====================
app.get('/api/geofences', (req, res) => {
  const stmt = db.prepare('SELECT * FROM geofences ORDER BY created_at DESC');
  const geofences = stmt.all().map((g: any) => ({
    ...g,
    geom: {
      type: g.geom_type,
      coordinates: JSON.parse(g.coordinates),
    },
  }));
  res.json(geofences);
});

app.post('/api/geofences', (req, res) => {
  const { name, type, color, geom } = req.body;

  const id = `g-${Date.now()}`;
  const stmt = db.prepare(`
    INSERT INTO geofences (id, name, type, color, geom_type, coordinates)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  try {
    stmt.run(id, name, type, color, geom.type, JSON.stringify(geom.coordinates));

    const newGeofence = db.prepare('SELECT * FROM geofences WHERE id = ?').get(id);

    io.emit('geofence:created', newGeofence);

    res.status(201).json(newGeofence);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/geofences/:id', (req, res) => {
  const stmt = db.prepare('DELETE FROM geofences WHERE id = ?');
  const result = stmt.run(req.params.id);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Geofence not found' });
  }

  io.emit('geofence:deleted', req.params.id);

  res.status(204).send();
});

// ==================== NOTIFICATIONS ====================
app.get('/api/notifications', (req, res) => {
  const stmt = db.prepare('SELECT * FROM notifications ORDER BY ts DESC');
  const notifications = stmt.all();
  res.json(notifications);
});

app.put('/api/notifications/:id/read', (req, res) => {
  const stmt = db.prepare('UPDATE notifications SET read = 1 WHERE id = ?');
  const result = stmt.run(req.params.id);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Notification not found' });
  }

  const updatedNotification = db.prepare('SELECT * FROM notifications WHERE id = ?').get(req.params.id);

  io.emit('notification:updated', updatedNotification);

  res.json(updatedNotification);
});

app.put('/api/notifications/read-all', (req, res) => {
  const stmt = db.prepare('UPDATE notifications SET read = 1 WHERE read = 0');
  stmt.run();

  io.emit('notifications:all-read');

  res.json({ success: true });
});

// ==================== WEBSOCKET ====================
io.on('connection', (socket) => {
  console.log('✅ Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

// Simulate real-time vehicle updates
setInterval(() => {
  const vehicles = db.prepare("SELECT * FROM vehicles WHERE status IN ('moving', 'stopped')").all() as any[];

  vehicles.forEach((vehicle) => {
    // Random chance to update
    if (Math.random() > 0.7) {
      const updates: any = {
        last_seen_min: 0,
      };

      // Update position for moving vehicles
      if (vehicle.status === 'moving') {
        updates.lat = vehicle.lat + (Math.random() - 0.5) * 0.005;
        updates.lng = vehicle.lng + (Math.random() - 0.5) * 0.005;
        updates.speed = Math.max(0, vehicle.speed + (Math.random() - 0.5) * 10);
        updates.fuel = Math.max(0, vehicle.fuel - Math.random() * 0.5);
      }

      // Build update query
      const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
      const values = Object.values(updates);

      const stmt = db.prepare(`UPDATE vehicles SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`);
      stmt.run(...values, vehicle.id);

      const updatedVehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(vehicle.id);
      io.emit('vehicle:updated', updatedVehicle);
    }
  });
}, 5000); // Update every 5 seconds

const PORT = 3000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket server ready`);
});
