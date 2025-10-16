import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import db from './database.js';

// Import route modules
import geofencesRouter from './routes/geofences.js';
import recipientsRouter from './routes/recipients.js';
import auditRouter from './routes/audit.js';
import tracksRouter from './routes/tracks.js';
import { generateToken, authenticate } from './middleware/auth.js';
import { AuditService, AUDIT_ACTIONS } from './services/audit.js';

const app = express();
const httpServer = createServer(app);

// CORS origins configuration
const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL]
  : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://localhost:5177', 'http://localhost:5178'];

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

app.use(cors({
  origin: allowedOrigins,
}));
app.use(express.json());

// ==================== AUTH ====================
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  const stmt = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?');
  const user = stmt.get(username, password) as any;

  if (!user) {
    // Log failed login attempt
    if (username) {
      try {
        const failedUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username) as any;
        if (failedUser) {
          AuditService.log({
            user_id: failedUser.id,
            action: AUDIT_ACTIONS.LOGIN_FAILED,
            resource_type: 'auth',
            details: { username },
            ip_address: req.ip,
            user_agent: req.headers['user-agent']
          });
        }
      } catch (e) {
        // Ignore audit errors
      }
    }
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Generate real JWT token
  const token = generateToken(user.id);

  // Log successful login
  AuditService.log({
    user_id: user.id,
    action: AUDIT_ACTIONS.LOGIN,
    resource_type: 'auth',
    details: { username: user.username, role: user.role },
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  const { password: _, ...userWithoutPassword } = user;

  res.json({
    user: userWithoutPassword,
    token,
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

  res.json(Object.assign({}, user, { vehicles }));
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
  // First check if the user is a client
  const userStmt = db.prepare('SELECT id, role, client_id FROM users WHERE id = ?');
  const user = userStmt.get(req.params.id) as any;

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  let vehicles;

  if (user.role === 'client' && user.client_id) {
    // For client users, get vehicles from their client_id
    const clientVehiclesStmt = db.prepare('SELECT * FROM vehicles WHERE client_id = ? ORDER BY updated_at DESC');
    vehicles = clientVehiclesStmt.all(user.client_id);
  } else {
    // For admin/superuser, get vehicles from user_vehicles junction table
    const userVehiclesStmt = db.prepare(`
      SELECT v.* FROM vehicles v
      INNER JOIN user_vehicles uv ON v.id = uv.vehicle_id
      WHERE uv.user_id = ?
    `);
    vehicles = userVehiclesStmt.all(req.params.id);
  }

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
  let stmt;
  let vehicles;

  // Try to get user from token (optional authentication)
  const authHeader = req.headers.authorization;
  let user: any = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const jwt = require('jsonwebtoken');
      const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      user = db.prepare('SELECT id, username, role, client_id FROM users WHERE id = ?').get(decoded.userId);
    } catch (e) {
      // Invalid token, continue without user
    }
  }

  // If user is a client, filter by their client_id
  if (user?.role === 'client' && user?.client_id) {
    stmt = db.prepare('SELECT * FROM vehicles WHERE client_id = ? ORDER BY updated_at DESC');
    vehicles = stmt.all(user.client_id);
  } else {
    // Admin, superuser, or no auth can see all vehicles
    stmt = db.prepare('SELECT * FROM vehicles ORDER BY updated_at DESC');
    vehicles = stmt.all();
  }

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

    // Save position to history if lat/lng changed
    if (lat !== undefined && lng !== undefined) {
      const historyStmt = db.prepare(`
        INSERT INTO vehicle_history (vehicle_id, lat, lng, speed, fuel, temp)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      historyStmt.run(req.params.id, lat, lng, speed || 0, fuel || 0, temp || null);
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

// ==================== VEHICLE HISTORY ====================
app.get('/api/vehicles/:id/history', (req, res) => {
  const { from, to, limit } = req.query;

  let query = 'SELECT * FROM vehicle_history WHERE vehicle_id = ?';
  const params: any[] = [req.params.id];

  // Add time range filters if provided
  if (from) {
    query += ' AND ts >= ?';
    params.push(from);
  }
  if (to) {
    query += ' AND ts <= ?';
    params.push(to);
  }

  query += ' ORDER BY ts DESC';

  // Add limit if provided
  if (limit) {
    query += ' LIMIT ?';
    params.push(parseInt(limit as string));
  }

  const stmt = db.prepare(query);
  const history = stmt.all(...params);

  res.json(history);
});

// Add a single position to vehicle history
app.post('/api/vehicles/:id/history', (req, res) => {
  const { lat, lng, speed, fuel, temp } = req.body;

  const stmt = db.prepare(`
    INSERT INTO vehicle_history (vehicle_id, lat, lng, speed, fuel, temp)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  try {
    stmt.run(req.params.id, lat, lng, speed || 0, fuel || 0, temp || null);
    res.status(201).json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get vehicle history statistics
app.get('/api/vehicles/:id/history/stats', (req, res) => {
  const { from, to } = req.query;

  let query = `
    SELECT
      COUNT(*) as total_points,
      AVG(speed) as avg_speed,
      MAX(speed) as max_speed,
      MIN(fuel) as min_fuel,
      MAX(fuel) as max_fuel,
      AVG(temp) as avg_temp,
      MAX(temp) as max_temp,
      MIN(ts) as first_timestamp,
      MAX(ts) as last_timestamp
    FROM vehicle_history
    WHERE vehicle_id = ?
  `;
  const params: any[] = [req.params.id];

  if (from) {
    query += ' AND ts >= ?';
    params.push(from);
  }
  if (to) {
    query += ' AND ts <= ?';
    params.push(to);
  }

  const stmt = db.prepare(query);
  const stats = stmt.get(...params);

  res.json(stats);
});

// Get available dates with history for a vehicle
app.get('/api/vehicles/:id/history/dates', (req, res) => {
  const stmt = db.prepare(`
    SELECT DISTINCT DATE(ts) as date, COUNT(*) as points
    FROM vehicle_history
    WHERE vehicle_id = ?
    GROUP BY DATE(ts)
    ORDER BY date DESC
  `);
  const dates = stmt.all(req.params.id);
  res.json(dates);
});

// Get vehicle history for a specific date (day)
app.get('/api/vehicles/:id/history/date/:date', (req, res) => {
  const { date } = req.params;

  // Get all records for the specified date (from 00:00:00 to 23:59:59)
  const stmt = db.prepare(`
    SELECT * FROM vehicle_history
    WHERE vehicle_id = ?
    AND DATE(ts) = ?
    ORDER BY ts ASC
  `);

  const history = stmt.all(req.params.id, date);
  res.json(history);
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
  const { name, email, phone, whatsapp, password, vehicle_ids } = req.body;

  const clientId = `c-${Date.now()}`;
  const userId = `u-${Date.now()}-client`;

  try {
    // Create client
    const clientStmt = db.prepare(`
      INSERT INTO clients (id, name, email, phone, whatsapp)
      VALUES (?, ?, ?, ?, ?)
    `);
    clientStmt.run(clientId, name, email, phone, whatsapp || null);

    // Create associated user with client role
    const userStmt = db.prepare(`
      INSERT INTO users (id, username, password, name, role, email, client_id)
      VALUES (?, ?, ?, ?, 'client', ?, ?)
    `);
    const username = email.split('@')[0]; // Use email prefix as username
    userStmt.run(userId, username, password || '123', name, email, clientId);

    // Assign vehicles if provided
    if (vehicle_ids && vehicle_ids.length > 0) {
      const updateVehicleStmt = db.prepare('UPDATE vehicles SET client_id = ? WHERE id = ?');
      vehicle_ids.forEach((vehicleId: string) => {
        updateVehicleStmt.run(clientId, vehicleId);
      });
    }

    const newClient = db.prepare('SELECT * FROM clients WHERE id = ?').get(clientId);

    io.emit('client:created', newClient);

    res.status(201).json(newClient);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/clients/:id', (req, res) => {
  const { name, email, phone, whatsapp, password, vehicle_ids } = req.body;

  const stmt = db.prepare(`
    UPDATE clients
    SET name = ?, email = ?, phone = ?, whatsapp = ?
    WHERE id = ?
  `);

  try {
    const result = stmt.run(name, email, phone, whatsapp || null, req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Update associated user if exists
    const user = db.prepare('SELECT id FROM users WHERE client_id = ? AND role = ?').get(req.params.id, 'client') as any;
    if (user) {
      const updates: string[] = [];
      const values: any[] = [];

      if (name) { updates.push('name = ?'); values.push(name); }
      if (email) {
        updates.push('email = ?');
        updates.push('username = ?');
        values.push(email);
        values.push(email.split('@')[0]);
      }
      if (password) { updates.push('password = ?'); values.push(password); }

      if (updates.length > 0) {
        values.push(user.id);
        const updateUserStmt = db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`);
        updateUserStmt.run(...values);
      }
    }

    // Update vehicle assignments if provided
    if (vehicle_ids !== undefined) {
      // Remove client_id from vehicles that are no longer assigned
      db.prepare('UPDATE vehicles SET client_id = NULL WHERE client_id = ?').run(req.params.id);

      // Assign new vehicles
      if (vehicle_ids.length > 0) {
        const updateVehicleStmt = db.prepare('UPDATE vehicles SET client_id = ? WHERE id = ?');
        vehicle_ids.forEach((vehicleId: string) => {
          updateVehicleStmt.run(req.params.id, vehicleId);
        });
      }
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

  // Delete associated user
  db.prepare('DELETE FROM users WHERE client_id = ? AND role = ?').run(req.params.id, 'client');

  const stmt = db.prepare('DELETE FROM clients WHERE id = ?');
  const deleteResult = stmt.run(req.params.id);

  if (deleteResult.changes === 0) {
    return res.status(404).json({ error: 'Client not found' });
  }

  io.emit('client:deleted', req.params.id);

  res.status(204).send();
});

// Get vehicles for a specific client
app.get('/api/clients/:id/vehicles', (req, res) => {
  const stmt = db.prepare('SELECT * FROM vehicles WHERE client_id = ? ORDER BY updated_at DESC');
  const vehicles = stmt.all(req.params.id);
  res.json(vehicles);
});

// Get geofences for a specific client
app.get('/api/clients/:id/geofences', (req, res) => {
  const stmt = db.prepare(`
    SELECT * FROM geofences
    WHERE (client_id = ? OR is_global = 1)
    AND deleted_at IS NULL
    ORDER BY created_at DESC
  `);
  const geofences = stmt.all(req.params.id);
  res.json(geofences);
});

// Send WhatsApp alert to client
app.post('/api/clients/:id/send-alert', (req, res) => {
  const { message } = req.body;

  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id) as any;

  if (!client) {
    return res.status(404).json({ error: 'Client not found' });
  }

  if (!client.whatsapp) {
    return res.status(400).json({ error: 'Client does not have WhatsApp number' });
  }

  // TODO: Integrate with WhatsApp API (Twilio, WhatsApp Business API, etc.)
  // For now, we'll just log the message and return success
  console.log(`📱 WhatsApp alert to ${client.whatsapp}:`, message);

  // In a real implementation, you would send the message via WhatsApp API:
  // const response = await whatsappAPI.sendMessage(client.whatsapp, message);

  res.json({
    success: true,
    recipient: client.whatsapp,
    message: message,
    timestamp: new Date().toISOString()
  });
});

// ==================== GEOFENCES (Multi-tenant with permissions) ====================
// Note: Old simple geofences routes replaced with multi-tenant version
// See server/routes/geofences.ts for full implementation
app.use('/api', geofencesRouter);

// ==================== RECIPIENTS (Notification configuration) ====================
app.use('/api', recipientsRouter);

// ==================== AUDIT (Audit log query API) ====================
app.use('/api', auditRouter);

// ==================== TRACKS (Vehicle route history) ====================
app.use('/api', tracksRouter);

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

// Vehicle movement simulation data
const vehicleRoutes = new Map<string, {
  targetLat: number;
  targetLng: number;
  speed: number;
}>();

// Simulate real-time vehicle updates with more realistic movement - DISABLED
// setInterval(() => {
//   const vehicles = db.prepare("SELECT * FROM vehicles WHERE status IN ('moving', 'stopped')").all() as any[];

//   vehicles.forEach((vehicle) => {
//     const updates: any = {
//       last_seen_min: 0,
//     };

//     // Update position for moving vehicles
//     if (vehicle.status === 'moving') {
//       let route = vehicleRoutes.get(vehicle.id);

//       // If no route exists or vehicle is close to target, generate a new target
//       if (!route) {
//         // Generate a random target within ~5km radius (approx 0.045 degrees)
//         const angle = Math.random() * Math.PI * 2;
//         const distance = Math.random() * 0.045;
//         route = {
//           targetLat: vehicle.lat + Math.cos(angle) * distance,
//           targetLng: vehicle.lng + Math.sin(angle) * distance,
//           speed: 30 + Math.random() * 40, // 30-70 km/h
//         };
//         vehicleRoutes.set(vehicle.id, route);
//       }

//       // Calculate distance to target
//       const latDiff = route.targetLat - vehicle.lat;
//       const lngDiff = route.targetLng - vehicle.lng;
//       const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);

//       // If close to target (within ~100m), generate new target
//       if (distance < 0.001) {
//         vehicleRoutes.delete(vehicle.id);
//         return;
//       }

//       // Move towards target
//       // Speed in km/h converted to degrees per update (rough approximation)
//       // At ~20°N/S, 1 degree ≈ 111 km
//       const stepSize = (route.speed / 111) / (3600 / 2); // 2 second updates

//       const normalizedLat = latDiff / distance;
//       const normalizedLng = lngDiff / distance;

//       updates.lat = vehicle.lat + normalizedLat * stepSize;
//       updates.lng = vehicle.lng + normalizedLng * stepSize;
//       updates.speed = Math.round(route.speed + (Math.random() - 0.5) * 5);
//       updates.fuel = Math.max(5, vehicle.fuel - Math.random() * 0.3);

//       // Randomly change status
//       if (Math.random() > 0.98) {
//         updates.status = 'stopped';
//         vehicleRoutes.delete(vehicle.id);
//       }
//     } else if (vehicle.status === 'stopped') {
//       // Stopped vehicles might start moving
//       if (Math.random() > 0.95) {
//         updates.status = 'moving';
//         updates.speed = 0;
//       }
//     }

//     // Build update query if there are updates
//     if (Object.keys(updates).length > 1) { // More than just last_seen_min
//       const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
//       const values = Object.values(updates);

//       const stmt = db.prepare(`UPDATE vehicles SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`);
//       stmt.run(...values, vehicle.id);

//       const updatedVehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(vehicle.id);
//       io.emit('vehicle:updated', updatedVehicle);
//     }
//   });
// }, 2000); // Update every 2 seconds for smoother animation

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket server ready`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
