import type { Vehicle, Client, Notification, Geofence } from './types';

// Coordenadas de Zapopan, Jalisco
export const mockVehicles: Vehicle[] = [
  {
    id: '1',
    plate: 'JLS-1234',
    driver: 'Juan Pérez Sánchez',
    status: 'moving',
    lastSeenMin: 0,
    lat: 20.7214,
    lng: -103.3918, // Zona Centro Zapopan
    speed: 45,
    deviceId: 'dev-001',
  },
  {
    id: '2',
    plate: 'JAL-5678',
    driver: 'María García López',
    status: 'stopped',
    lastSeenMin: 5,
    lat: 20.7367,
    lng: -103.4629, // Andares
    speed: 0,
    deviceId: 'dev-002',
  },
  {
    id: '3',
    plate: 'GDL-9012',
    driver: 'Carlos López Ramírez',
    status: 'moving',
    lastSeenMin: 1,
    lat: 20.6597,
    lng: -103.3494, // Plaza del Sol
    speed: 60,
    deviceId: 'dev-003',
  },
  {
    id: '4',
    plate: 'ZAP-3456',
    driver: 'Ana Martínez González',
    status: 'offline',
    lastSeenMin: 120,
    lat: 20.7008,
    lng: -103.3743, // Av. Patria
    speed: 0,
    deviceId: 'dev-004',
  },
  {
    id: '5',
    plate: 'MEX-7890',
    driver: 'Pedro Sánchez Torres',
    status: 'critical',
    lastSeenMin: 2,
    lat: 20.7463,
    lng: -103.4311, // Ciudad Granja
    speed: 30,
    deviceId: 'dev-005',
  },
  {
    id: '6',
    plate: 'TLA-2345',
    driver: 'Laura Fernández Cruz',
    status: 'moving',
    lastSeenMin: 0,
    lat: 20.6829,
    lng: -103.3935, // Universidad Panamericana
    speed: 50,
    deviceId: 'dev-006',
  },
  {
    id: '7',
    plate: 'GTO-6789',
    driver: 'Roberto Torres Díaz',
    status: 'stopped',
    lastSeenMin: 10,
    lat: 20.7186,
    lng: -103.4139, // Plaza Concentro
    speed: 0,
    deviceId: 'dev-007',
  },
  {
    id: '8',
    plate: 'VER-0123',
    driver: 'Diana Ramírez Ortiz',
    status: 'moving',
    lastSeenMin: 0,
    lat: 20.7294,
    lng: -103.3815, // Av. Aviación
    speed: 55,
    deviceId: 'dev-008',
  },
  {
    id: '9',
    plate: 'QRO-4567',
    driver: 'Miguel Castro Vargas',
    status: 'moving',
    lastSeenMin: 1,
    lat: 20.7095,
    lng: -103.4235, // Punto Sao Paulo
    speed: 40,
    deviceId: 'dev-009',
  },
  {
    id: '10',
    plate: 'PUE-8901',
    driver: 'Sofía Morales Ruiz',
    status: 'stopped',
    lastSeenMin: 15,
    lat: 20.7440,
    lng: -103.3890, // Periferico Norte
    speed: 0,
    deviceId: 'dev-010',
  },
  {
    id: '11',
    plate: 'JAL-1111',
    driver: 'Jorge Mendoza Silva',
    status: 'moving',
    lastSeenMin: 3,
    lat: 20.6934,
    lng: -103.4012, // Av. Vallarta
    speed: 48,
    deviceId: 'dev-011',
  },
  {
    id: '12',
    plate: 'GDL-2222',
    driver: 'Patricia Herrera Gómez',
    status: 'stopped',
    lastSeenMin: 8,
    lat: 20.7523,
    lng: -103.4501, // Tesistán
    speed: 0,
    deviceId: 'dev-012',
  },
  {
    id: '13',
    plate: 'ZAP-3333',
    driver: 'Ricardo Flores Medina',
    status: 'critical',
    lastSeenMin: 1,
    lat: 20.7156,
    lng: -103.3654, // Base Aérea
    speed: 25,
    deviceId: 'dev-013',
  },
  {
    id: '14',
    plate: 'MEX-4444',
    driver: 'Gabriela Reyes Núñez',
    status: 'moving',
    lastSeenMin: 0,
    lat: 20.6712,
    lng: -103.4178, // Chapalita
    speed: 52,
    deviceId: 'dev-014',
  },
  {
    id: '15',
    plate: 'JAL-5555',
    driver: 'Fernando Jiménez Castro',
    status: 'offline',
    lastSeenMin: 180,
    lat: 20.7381,
    lng: -103.3742, // La Cima
    speed: 0,
    deviceId: 'dev-015',
  },
];

export const mockClients: Client[] = [
  {
    id: 'c1',
    name: 'Transportes del Occidente S.A. de C.V.',
    email: 'contacto@transportesoccidente.com',
    phone: '+52 33 1234 5678',
    vehicles: 6,
    lastActivity: new Date().toISOString(),
  },
  {
    id: 'c2',
    name: 'Logística Express Jalisco',
    email: 'info@logisticaexpress.mx',
    phone: '+52 33 8765 4321',
    vehicles: 5,
    lastActivity: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'c3',
    name: 'Distribuidora Zapopan Central',
    email: 'ventas@dzcentral.com.mx',
    phone: '+52 33 5555 1234',
    vehicles: 4,
    lastActivity: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: 'c4',
    name: 'Fletes y Mudanzas GDL',
    email: 'operaciones@fletesmudasgdl.com',
    phone: '+52 33 3344 5566',
    vehicles: 3,
    lastActivity: new Date(Date.now() - 259200000).toISOString(),
  },
  {
    id: 'c5',
    name: 'Reparto Rápido Metropolitano',
    email: 'contacto@repartorapido.mx',
    phone: '+52 33 7788 9900',
    vehicles: 2,
    lastActivity: new Date(Date.now() - 345600000).toISOString(),
  },
];

export const mockNotifications: Notification[] = [
  {
    id: 'n3',
    ts: new Date(Date.now() - 300000).toISOString(),
    type: 'warn',
    vehicleId: '4',
    vehiclePlate: 'ZAP-3456',
    text: 'Vehículo sin señal por más de 2 horas',
    read: false,
  },
  {
    id: 'n4',
    ts: new Date(Date.now() - 600000).toISOString(),
    type: 'warn',
    vehicleId: '15',
    vehiclePlate: 'JAL-5555',
    text: 'Vehículo offline desde hace 3 horas - Verificar conexión GPS',
    read: false,
  },
  {
    id: 'n5',
    ts: new Date(Date.now() - 900000).toISOString(),
    type: 'info',
    vehicleId: '1',
    vehiclePlate: 'JLS-1234',
    text: 'Vehículo salió de geocerca: Zona Centro Zapopan',
    read: true,
  },
  {
    id: 'n6',
    ts: new Date(Date.now() - 1200000).toISOString(),
    type: 'info',
    vehicleId: '3',
    vehiclePlate: 'GDL-9012',
    text: 'Vehículo entró en geocerca: Plaza del Sol',
    read: true,
  },
  {
    id: 'n7',
    ts: new Date(Date.now() - 1500000).toISOString(),
    type: 'warn',
    vehicleId: '2',
    vehiclePlate: 'JAL-5678',
    text: 'Vehículo detenido por más de 30 minutos en Andares',
    read: true,
  },
  {
    id: 'n8',
    ts: new Date(Date.now() - 1800000).toISOString(),
    type: 'info',
    vehicleId: '6',
    vehiclePlate: 'TLA-2345',
    text: 'Mantenimiento programado completado exitosamente',
    read: true,
  },
];

export const mockGeofences: Geofence[] = [
  {
    id: 'g1',
    name: 'Centro Zapopan',
    type: 'zona-permitida',
    policy: 'entrada',
    color: '#10b981',
    geom: {
      type: 'Polygon',
      coordinates: [
        [
          [-103.3950, 20.7180],
          [-103.3880, 20.7180],
          [-103.3880, 20.7250],
          [-103.3950, 20.7250],
          [-103.3950, 20.7180],
        ],
      ],
    },
  },
  {
    id: 'g2',
    name: 'Zona Andares',
    type: 'punto-interes',
    policy: 'salida',
    color: '#f59e0b',
    geom: {
      type: 'Polygon',
      coordinates: [
        [
          [-103.4680, 20.7330],
          [-103.4580, 20.7330],
          [-103.4580, 20.7400],
          [-103.4680, 20.7400],
          [-103.4680, 20.7330],
        ],
      ],
    },
  },
  {
    id: 'g3',
    name: 'Zona Restringida Industrial',
    type: 'zona-restringida',
    policy: 'prohibido',
    color: '#ef4444',
    geom: {
      type: 'Polygon',
      coordinates: [
        [
          [-103.4350, 20.7480],
          [-103.4250, 20.7480],
          [-103.4250, 20.7550],
          [-103.4350, 20.7550],
          [-103.4350, 20.7480],
        ],
      ],
    },
  },
  {
    id: 'g4',
    name: 'Plaza del Sol',
    type: 'zona-permitida',
    policy: 'entrada',
    color: '#10b981',
    geom: {
      type: 'Polygon',
      coordinates: [
        [
          [-103.3540, 20.6560],
          [-103.3450, 20.6560],
          [-103.3450, 20.6630],
          [-103.3540, 20.6630],
          [-103.3540, 20.6560],
        ],
      ],
    },
  },
  {
    id: 'g5',
    name: 'Periferico Norte',
    type: 'punto-interes',
    policy: 'salida',
    color: '#f59e0b',
    geom: {
      type: 'Polygon',
      coordinates: [
        [
          [-103.3940, 20.7410],
          [-103.3840, 20.7410],
          [-103.3840, 20.7470],
          [-103.3940, 20.7470],
          [-103.3940, 20.7410],
        ],
      ],
    },
  },
];
