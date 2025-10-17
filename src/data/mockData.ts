// Mock data para ReportNow - Frontend standalone
// Este archivo contiene datos de prueba para desarrollo sin backend

import type { User, Vehicle, Client, Notification, Geofence, VehicleEvent, VehicleHistoryPoint, ActivityLog } from '../lib/types';

// ==================== USUARIOS ====================
export const mockUsers: User[] = [
  {
    id: '1',
    username: 'julio',
    password: 'admin123', // En producción esto debe estar hasheado
    name: 'Julio Administrador',
    role: 'superuser',
    email: 'julio@reportnow.com',
    created_at: new Date('2024-01-01').toISOString(),
  },
  {
    id: '2',
    username: 'admin',
    password: 'admin123',
    name: 'Admin General',
    role: 'admin',
    email: 'admin@reportnow.com',
    created_at: new Date('2024-01-05').toISOString(),
  },
  {
    id: '3',
    username: 'contacto',
    password: '123',
    name: 'Cliente Valle',
    role: 'client',
    email: 'contacto@transportesvalle.com',
    client_id: '1',
    created_at: new Date('2024-01-10').toISOString(),
  },
  {
    id: '4',
    username: 'cliente2',
    password: '123',
    name: 'Cliente Express',
    role: 'client',
    email: 'info@expressjalisco.com',
    client_id: '2',
    created_at: new Date('2024-01-15').toISOString(),
  },
];

// ==================== CLIENTES ====================
export const mockClients: Client[] = [
  {
    id: '1',
    name: 'Transportes del Valle',
    email: 'contacto@transportesvalle.com',
    phone: '+52 33 1234 5678',
    whatsapp: '+52 33 1234 5678',
    vehicles: 4,
    lastActivity: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 min ago
    created_at: new Date('2024-01-10').toISOString(),
  },
  {
    id: '2',
    name: 'Express Jalisco',
    email: 'info@expressjalisco.com',
    phone: '+52 33 2345 6789',
    whatsapp: '+52 33 2345 6789',
    vehicles: 3,
    lastActivity: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
    created_at: new Date('2024-01-15').toISOString(),
  },
  {
    id: '3',
    name: 'Logística Zapopan',
    email: 'ventas@logisticazapopan.com',
    phone: '+52 33 3456 7890',
    vehicles: 3,
    lastActivity: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    created_at: new Date('2024-01-20').toISOString(),
  },
  {
    id: '4',
    name: 'Carga Rápida GDL',
    email: 'contacto@cargaapidagdl.com',
    phone: '+52 33 4567 8901',
    whatsapp: '+52 33 4567 8901',
    vehicles: 3,
    lastActivity: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    created_at: new Date('2024-01-25').toISOString(),
  },
  {
    id: '5',
    name: 'Mudanzas Tapatías',
    email: 'info@mudanzastapatias.com',
    phone: '+52 33 5678 9012',
    vehicles: 2,
    lastActivity: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    created_at: new Date('2024-02-01').toISOString(),
  },
];

// ==================== VEHÍCULOS ====================
export const mockVehicles: Vehicle[] = [
  // Cliente 1: Transportes del Valle
  {
    id: 'v1',
    plate: 'JAL-123-A',
    driver: 'Juan Pérez',
    status: 'moving',
    fuel: 75,
    speed: 65,
    temp: 22,
    lat: 20.6897,
    lng: -103.3918,
    lastSeenMin: 1,
    deviceId: 'dev001',
    clientId: '1',
    created_at: new Date('2024-01-10').toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'v2',
    plate: 'JAL-456-B',
    driver: 'María González',
    status: 'stopped',
    fuel: 45,
    speed: 0,
    temp: 24,
    lat: 20.6767,
    lng: -103.3475,
    lastSeenMin: 3,
    deviceId: 'dev002',
    clientId: '1',
    created_at: new Date('2024-01-10').toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'v3',
    plate: 'JAL-789-C',
    driver: 'Carlos Ramírez',
    status: 'critical',
    fuel: 15,
    speed: 45,
    temp: 35,
    lat: 20.7342,
    lng: -103.4002,
    lastSeenMin: 2,
    deviceId: 'dev003',
    clientId: '1',
    created_at: new Date('2024-01-11').toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'v4',
    plate: 'JAL-012-D',
    driver: 'Ana López',
    status: 'moving',
    fuel: 80,
    speed: 55,
    temp: 21,
    lat: 20.6600,
    lng: -103.3200,
    lastSeenMin: 1,
    deviceId: 'dev004',
    clientId: '1',
    created_at: new Date('2024-01-12').toISOString(),
    updated_at: new Date().toISOString(),
  },

  // Cliente 2: Express Jalisco
  {
    id: 'v5',
    plate: 'GDL-234-E',
    driver: 'Roberto Silva',
    status: 'moving',
    fuel: 60,
    speed: 70,
    temp: 23,
    lat: 20.6500,
    lng: -103.3800,
    lastSeenMin: 2,
    deviceId: 'dev005',
    clientId: '2',
    created_at: new Date('2024-01-15').toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'v6',
    plate: 'GDL-567-F',
    driver: 'Laura Martínez',
    status: 'offline',
    fuel: 30,
    speed: 0,
    temp: 20,
    lat: 20.7200,
    lng: -103.3600,
    lastSeenMin: 45,
    deviceId: 'dev006',
    clientId: '2',
    created_at: new Date('2024-01-16').toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'v7',
    plate: 'GDL-890-G',
    driver: 'Pedro Sánchez',
    status: 'stopped',
    fuel: 55,
    speed: 0,
    temp: 22,
    lat: 20.6950,
    lng: -103.4100,
    lastSeenMin: 5,
    deviceId: 'dev007',
    clientId: '2',
    created_at: new Date('2024-01-17').toISOString(),
    updated_at: new Date().toISOString(),
  },

  // Cliente 3: Logística Zapopan
  {
    id: 'v8',
    plate: 'ZAP-123-H',
    driver: 'Miguel Torres',
    status: 'moving',
    fuel: 70,
    speed: 60,
    temp: 21,
    lat: 20.7100,
    lng: -103.3950,
    lastSeenMin: 1,
    deviceId: 'dev008',
    clientId: '3',
    created_at: new Date('2024-01-20').toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'v9',
    plate: 'ZAP-456-I',
    driver: 'Sandra Flores',
    status: 'stopped',
    fuel: 40,
    speed: 0,
    temp: 25,
    lat: 20.6800,
    lng: -103.3500,
    lastSeenMin: 10,
    deviceId: 'dev009',
    clientId: '3',
    created_at: new Date('2024-01-21').toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'v10',
    plate: 'ZAP-789-J',
    driver: 'Jorge Herrera',
    status: 'critical',
    fuel: 10,
    speed: 30,
    temp: 38,
    lat: 20.7450,
    lng: -103.4200,
    lastSeenMin: 3,
    deviceId: 'dev010',
    clientId: '3',
    created_at: new Date('2024-01-22').toISOString(),
    updated_at: new Date().toISOString(),
  },

  // Cliente 4: Carga Rápida GDL
  {
    id: 'v11',
    plate: 'CRG-012-K',
    driver: 'Patricia Mendoza',
    status: 'moving',
    fuel: 85,
    speed: 50,
    temp: 20,
    lat: 20.6550,
    lng: -103.3700,
    lastSeenMin: 2,
    deviceId: 'dev011',
    clientId: '4',
    created_at: new Date('2024-01-25').toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'v12',
    plate: 'CRG-345-L',
    driver: 'Luis Morales',
    status: 'offline',
    fuel: 20,
    speed: 0,
    temp: 19,
    lat: 20.7300,
    lng: -103.3850,
    lastSeenMin: 60,
    deviceId: 'dev012',
    clientId: '4',
    created_at: new Date('2024-01-26').toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'v13',
    plate: 'CRG-678-M',
    driver: 'Carmen Ruiz',
    status: 'moving',
    fuel: 65,
    speed: 75,
    temp: 23,
    lat: 20.6650,
    lng: -103.3300,
    lastSeenMin: 1,
    deviceId: 'dev013',
    clientId: '4',
    created_at: new Date('2024-01-27').toISOString(),
    updated_at: new Date().toISOString(),
  },

  // Cliente 5: Mudanzas Tapatías
  {
    id: 'v14',
    plate: 'MDZ-901-N',
    driver: 'Ricardo Vargas',
    status: 'stopped',
    fuel: 50,
    speed: 0,
    temp: 24,
    lat: 20.7000,
    lng: -103.3750,
    lastSeenMin: 8,
    deviceId: 'dev014',
    clientId: '5',
    created_at: new Date('2024-02-01').toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'v15',
    plate: 'MDZ-234-O',
    driver: 'Elena Castro',
    status: 'moving',
    fuel: 72,
    speed: 45,
    temp: 22,
    lat: 20.6750,
    lng: -103.4050,
    lastSeenMin: 2,
    deviceId: 'dev015',
    clientId: '5',
    created_at: new Date('2024-02-02').toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// ==================== GEOCERCAS ====================
export const mockGeofences: Geofence[] = [
  {
    id: 'g1',
    name: 'Centro de Guadalajara',
    type: 'zona-permitida',
    color: '#22c55e',
    geom_type: 'Circle',
    coordinates: {
      center: [-103.3400, 20.6775], // [lng, lat]
      radius: 1500, // metros
    },
    alert_type: 'exit',
    is_global: true,
    created_by_role: 'superuser',
    created_by_user_id: '1',
  },
  {
    id: 'g2',
    name: 'Zona Industrial',
    type: 'punto-interes',
    color: '#3b82f6',
    geom_type: 'Circle',
    coordinates: {
      center: [-103.4050, 20.7400],
      radius: 2000,
    },
    alert_type: 'entry',
    is_global: true,
    created_by_role: 'superuser',
    created_by_user_id: '1',
  },
  {
    id: 'g3',
    name: 'Zona Restringida',
    type: 'zona-restringida',
    color: '#ef4444',
    geom_type: 'Circle',
    coordinates: {
      center: [-103.3650, 20.7150],
      radius: 800,
    },
    alert_type: 'entry',
    is_global: true,
    created_by_role: 'superuser',
    created_by_user_id: '1',
  },
  {
    id: 'g4',
    name: 'Bodega Principal - Valle',
    type: 'punto-interes',
    color: '#8b5cf6',
    geom_type: 'Circle',
    coordinates: {
      center: [-103.3435, 20.6765],
      radius: 500,
    },
    alert_type: 'both',
    client_id: '1',
    is_global: false,
    created_by_role: 'client',
    created_by_user_id: '3',
  },
  {
    id: 'g5',
    name: 'Ruta Zapopan',
    type: 'zona-permitida',
    color: '#f59e0b',
    geom_type: 'Circle',
    coordinates: {
      center: [-103.3950, 20.7150],
      radius: 2500,
    },
    alert_type: 'exit',
    is_global: true,
    created_by_role: 'admin',
    created_by_user_id: '2',
  },
];

// ==================== NOTIFICACIONES ====================
export const mockNotifications: Notification[] = [
  {
    id: 'n1',
    ts: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 min ago
    type: 'crit',
    vehicleId: 'v3',
    vehiclePlate: 'JAL-789-C',
    text: 'Combustible crítico (15%) - JAL-789-C',
    read: false,
  },
  {
    id: 'n2',
    ts: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    type: 'warn',
    vehicleId: 'v3',
    vehiclePlate: 'JAL-789-C',
    text: 'Temperatura elevada (35°C) - JAL-789-C',
    read: false,
  },
  {
    id: 'n3',
    ts: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    type: 'crit',
    vehicleId: 'v10',
    vehiclePlate: 'ZAP-789-J',
    text: 'Combustible crítico (10%) - ZAP-789-J',
    read: false,
  },
  {
    id: 'n4',
    ts: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    type: 'warn',
    vehicleId: 'v6',
    vehiclePlate: 'GDL-567-F',
    text: 'Vehículo offline por más de 30 minutos - GDL-567-F',
    read: true,
  },
  {
    id: 'n5',
    ts: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    type: 'info',
    vehicleId: 'v1',
    vehiclePlate: 'JAL-123-A',
    text: 'Vehículo entró en geocerca: Centro de Guadalajara',
    read: true,
  },
  {
    id: 'n6',
    ts: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    type: 'crit',
    vehicleId: 'v12',
    vehiclePlate: 'CRG-345-L',
    text: 'Vehículo offline por más de 60 minutos - CRG-345-L',
    read: true,
  },
  {
    id: 'n7',
    ts: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    type: 'warn',
    vehicleId: 'v5',
    vehiclePlate: 'GDL-234-E',
    text: 'Exceso de velocidad detectado (85 km/h) - GDL-234-E',
    read: true,
  },
  {
    id: 'n8',
    ts: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    type: 'info',
    vehicleId: 'v8',
    vehiclePlate: 'ZAP-123-H',
    text: 'Vehículo salió de geocerca: Ruta Zapopan',
    read: true,
  },
];

// ==================== EVENTOS DE VEHÍCULOS ====================
export const mockVehicleEvents: VehicleEvent[] = [
  {
    id: 'e1',
    vehicle_id: 'v1',
    event_type: 'geofence_entry',
    description: 'Entrada a geocerca: Centro de Guadalajara',
    geofence_id: 'g1',
    lat: 20.6720,
    lng: -103.3450,
    ts: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    metadata: { geofence_name: 'Centro de Guadalajara' },
  },
  {
    id: 'e2',
    vehicle_id: 'v3',
    event_type: 'fuel_alert',
    description: 'Combustible bajo: 15%',
    lat: 20.7342,
    lng: -103.4002,
    ts: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    metadata: { fuel_level: 15 },
  },
  {
    id: 'e3',
    vehicle_id: 'v3',
    event_type: 'temp_alert',
    description: 'Temperatura elevada: 35°C',
    lat: 20.7342,
    lng: -103.4002,
    ts: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    metadata: { temperature: 35 },
  },
  {
    id: 'e4',
    vehicle_id: 'v6',
    event_type: 'offline_alert',
    description: 'Vehículo offline por más de 30 minutos',
    lat: 20.7200,
    lng: -103.3600,
    ts: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    metadata: { offline_minutes: 45 },
  },
  {
    id: 'e5',
    vehicle_id: 'v5',
    event_type: 'speed_alert',
    description: 'Exceso de velocidad: 85 km/h',
    lat: 20.6500,
    lng: -103.3800,
    ts: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    metadata: { speed: 85 },
  },
];

// ==================== HISTORIAL DE VEHÍCULOS ====================
// Generador de puntos de historial simulando recorrido realista
export const generateVehicleHistory = (vehicleId: string): VehicleHistoryPoint[] => {
  const history: VehicleHistoryPoint[] = [];
  const vehicle = mockVehicles.find(v => v.id === vehicleId);

  if (!vehicle) return history;

  const now = Date.now();
  const pointsToGenerate = 19; // 19 puntos de recorrido
  const intervalSeconds = 10; // Un punto cada 10 segundos

  // Definir punto inicial (posición actual del vehículo)
  let currentLat = vehicle.lat;
  let currentLng = vehicle.lng;

  // Definir dirección de movimiento (simulando ruta en una dirección)
  const direction = Math.random() * 2 * Math.PI; // Dirección aleatoria en radianes

  // Velocidad promedio del vehículo en km/h (usar la velocidad actual o una por defecto)
  const avgSpeed = vehicle.speed > 0 ? vehicle.speed : 50;

  // Calcular distancia que recorre en 10 segundos
  // velocidad (km/h) * 1000 (m/km) / 3600 (s/h) * 10 (segundos) = metros en 10 segundos
  const distancePerPointMeters = (avgSpeed * 1000 / 3600) * intervalSeconds;

  // Conversión aproximada: 1 grado ≈ 111,320 metros
  const metersPerDegreeLat = 111320;
  const metersPerDegreeLng = 111320 * Math.cos(currentLat * Math.PI / 180);

  const latIncrement = (distancePerPointMeters / metersPerDegreeLat) * Math.cos(direction);
  const lngIncrement = (distancePerPointMeters / metersPerDegreeLng) * Math.sin(direction);

  // Generar puntos de recorrido
  for (let i = 0; i < pointsToGenerate; i++) {
    const timestamp = now - ((pointsToGenerate - 1 - i) * intervalSeconds * 1000);

    // Añadir pequeña variación aleatoria para simular movimiento natural
    const randomLat = (Math.random() - 0.5) * 0.00005; // Variación muy pequeña
    const randomLng = (Math.random() - 0.5) * 0.00005;

    // Variación de velocidad ±10 km/h
    const speedVariation = (Math.random() - 0.5) * 20;
    const currentSpeed = Math.max(0, Math.min(120, avgSpeed + speedVariation));

    history.push({
      id: `h_${vehicleId}_${i}`,
      vehicle_id: vehicleId,
      lat: currentLat + randomLat,
      lng: currentLng + randomLng,
      speed: currentSpeed,
      fuel: Math.max(10, vehicle.fuel - (i * 0.5)), // Combustible disminuye gradualmente
      temp: 18 + Math.random() * 10, // Temperatura entre 18-28°C
      ts: new Date(timestamp).toISOString(),
    });

    // Actualizar posición para el siguiente punto
    currentLat += latIncrement;
    currentLng += lngIncrement;
  }

  return history.sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
};

// ==================== ASIGNACIONES USUARIO-VEHÍCULO ====================
export const mockUserVehicles = [
  { userId: '3', vehicleId: 'v1' },
  { userId: '3', vehicleId: 'v2' },
  { userId: '3', vehicleId: 'v3' },
  { userId: '3', vehicleId: 'v4' },
  { userId: '4', vehicleId: 'v5' },
  { userId: '4', vehicleId: 'v6' },
  { userId: '4', vehicleId: 'v7' },
];

// ==================== LOG DE ACTIVIDADES ====================
export const mockActivityLogs: ActivityLog[] = [
  {
    id: 'a1',
    user_id: '2',
    user_name: 'Admin General',
    user_role: 'admin',
    activity_type: 'create_client',
    description: 'Creó el cliente "Mudanzas Tapatías"',
    target_type: 'client',
    target_id: '5',
    target_name: 'Mudanzas Tapatías',
    metadata: { client_phone: '+52 33 5678 9012' },
    ts: new Date('2024-02-01T10:30:00').toISOString(),
  },
  {
    id: 'a2',
    user_id: '2',
    user_name: 'Admin General',
    user_role: 'admin',
    activity_type: 'create_geofence',
    description: 'Creó la geocerca "Ruta Zapopan"',
    target_type: 'geofence',
    target_id: 'g5',
    target_name: 'Ruta Zapopan',
    metadata: { geofence_type: 'zona-permitida', radius: 2500 },
    ts: new Date('2024-01-28T15:45:00').toISOString(),
  },
  {
    id: 'a3',
    user_id: '2',
    user_name: 'Admin General',
    user_role: 'admin',
    activity_type: 'create_vehicle',
    description: 'Agregó el vehículo "MDZ-234-O"',
    target_type: 'vehicle',
    target_id: 'v15',
    target_name: 'MDZ-234-O',
    metadata: { driver: 'Elena Castro', client: 'Mudanzas Tapatías' },
    ts: new Date('2024-02-02T09:15:00').toISOString(),
  },
  {
    id: 'a4',
    user_id: '2',
    user_name: 'Admin General',
    user_role: 'admin',
    activity_type: 'assign_vehicle',
    description: 'Asignó vehículo "CRG-678-M" a cliente "Carga Rápida GDL"',
    target_type: 'vehicle',
    target_id: 'v13',
    target_name: 'CRG-678-M',
    metadata: { client_id: '4', client_name: 'Carga Rápida GDL' },
    ts: new Date('2024-01-27T11:20:00').toISOString(),
  },
  {
    id: 'a5',
    user_id: '2',
    user_name: 'Admin General',
    user_role: 'admin',
    activity_type: 'update_client',
    description: 'Actualizó la información de "Express Jalisco"',
    target_type: 'client',
    target_id: '2',
    target_name: 'Express Jalisco',
    metadata: { updated_fields: ['phone', 'whatsapp'] },
    ts: new Date('2024-01-20T14:30:00').toISOString(),
  },
  {
    id: 'a6',
    user_id: '2',
    user_name: 'Admin General',
    user_role: 'admin',
    activity_type: 'send_notification',
    description: 'Envió notificación de alerta crítica a cliente "Logística Zapopan"',
    target_type: 'notification',
    target_id: 'n3',
    target_name: 'Alerta: Combustible crítico',
    metadata: { client_id: '3', vehicle_plate: 'ZAP-789-J' },
    ts: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: 'a7',
    user_id: '2',
    user_name: 'Admin General',
    user_role: 'admin',
    activity_type: 'create_client',
    description: 'Creó el cliente "Carga Rápida GDL"',
    target_type: 'client',
    target_id: '4',
    target_name: 'Carga Rápida GDL',
    metadata: { client_phone: '+52 33 4567 8901' },
    ts: new Date('2024-01-25T08:00:00').toISOString(),
  },
  {
    id: 'a8',
    user_id: '1',
    user_name: 'Julio Administrador',
    user_role: 'superuser',
    activity_type: 'create_user',
    description: 'Creó el usuario admin "Admin General"',
    target_type: 'user',
    target_id: '2',
    target_name: 'Admin General',
    metadata: { user_email: 'admin@reportnow.com' },
    ts: new Date('2024-01-05T10:00:00').toISOString(),
  },
  {
    id: 'a9',
    user_id: '1',
    user_name: 'Julio Administrador',
    user_role: 'superuser',
    activity_type: 'create_geofence',
    description: 'Creó la geocerca global "Centro de Guadalajara"',
    target_type: 'geofence',
    target_id: 'g1',
    target_name: 'Centro de Guadalajara',
    metadata: { geofence_type: 'zona-permitida', radius: 1500, is_global: true },
    ts: new Date('2024-01-03T12:00:00').toISOString(),
  },
  {
    id: 'a10',
    user_id: '2',
    user_name: 'Admin General',
    user_role: 'admin',
    activity_type: 'update_geofence',
    description: 'Actualizó la geocerca "Ruta Zapopan"',
    target_type: 'geofence',
    target_id: 'g5',
    target_name: 'Ruta Zapopan',
    metadata: { updated_fields: ['radius', 'alert_type'] },
    ts: new Date('2024-01-30T16:20:00').toISOString(),
  },
];

// ==================== FUNCIONES AUXILIARES ====================

// Función para obtener vehículos por cliente
export const getVehiclesByClient = (clientId: string): Vehicle[] => {
  return mockVehicles.filter(v => v.clientId === clientId);
};

// Función para obtener geocercas por cliente
export const getGeofencesByClient = (clientId?: string): Geofence[] => {
  if (!clientId) {
    return mockGeofences.filter(g => g.is_global);
  }
  return mockGeofences.filter(g => g.is_global || g.client_id === clientId);
};

// Función para obtener notificaciones por cliente
export const getNotificationsByClient = (clientId?: string): Notification[] => {
  if (!clientId) return mockNotifications;

  const clientVehicles = mockVehicles
    .filter(v => v.clientId === clientId)
    .map(v => v.id);

  return mockNotifications.filter(n => clientVehicles.includes(n.vehicleId));
};

// Función para obtener eventos de un vehículo
export const getVehicleEvents = (vehicleId: string): VehicleEvent[] => {
  return mockVehicleEvents.filter(e => e.vehicle_id === vehicleId);
};
