import type { VehicleStatus, NotificationType, UserRole, EquipmentStatus, AssetType } from './types';

export const APP_NAME = import.meta.env.VITE_APP_NAME || 'ReportNow';
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
export const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';
export const MAP_STYLE = import.meta.env.VITE_MAP_STYLE || 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

// Local Storage Keys
export const LS_TOKEN_KEY = 'reportnow:token';
export const LS_USER_KEY = 'reportnow:user';
export const LS_LAYOUT_PREFIX = 'reportnow:layout';

// Role Configuration
export const ROLE_CONFIG: Record<UserRole, {
  label: string;
  description: string;
  color: string;
  bgColor: string;
  textColor: string;
  permissions: {
    canManageClients: boolean;
    canManageEquipments: boolean;
    canManageAssets: boolean;
    canManageUsers: boolean;
    canManageGeofences: boolean;
    canManagePlaces: boolean;
    canViewAllClients: boolean;
    canEditOwnRole: boolean;
    canExport: boolean;
  };
}> = {
  superuser: {
    label: 'Superusuario',
    description: 'Acceso total a la plataforma',
    color: '#8b5cf6',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    permissions: {
      canManageClients: true,
      canManageEquipments: true,
      canManageAssets: true,
      canManageUsers: true,
      canManageGeofences: true,
      canManagePlaces: true,
      canViewAllClients: true,
      canEditOwnRole: false,
      canExport: true,
    },
  },
  admin: {
    label: 'Administrador',
    description: 'Gestiona su cliente completo',
    color: '#0ea5e9',
    bgColor: 'bg-info-50',
    textColor: 'text-info-700',
    permissions: {
      canManageClients: false,
      canManageEquipments: false, // Solo puede usar los asignados
      canManageAssets: true,
      canManageUsers: true,
      canManageGeofences: true,
      canManagePlaces: true,
      canViewAllClients: false,
      canEditOwnRole: false,
      canExport: true,
    },
  },
  'operator-admin': {
    label: 'Operador Administrador',
    description: 'Paridad con Admin, sin cambiar roles',
    color: '#10b981',
    bgColor: 'bg-ok-50',
    textColor: 'text-ok-700',
    permissions: {
      canManageClients: false,
      canManageEquipments: false,
      canManageAssets: true,
      canManageUsers: true, // Puede crear operadores
      canManageGeofences: true,
      canManagePlaces: true,
      canViewAllClients: false,
      canEditOwnRole: false,
      canExport: true,
    },
  },
  'operator-monitor': {
    label: 'Operador Monitor',
    description: 'Solo lectura',
    color: '#6b7280',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
    permissions: {
      canManageClients: false,
      canManageEquipments: false,
      canManageAssets: false,
      canManageUsers: false,
      canManageGeofences: false,
      canManagePlaces: false,
      canViewAllClients: false,
      canEditOwnRole: false,
      canExport: false,
    },
  },
};

// Equipment Status Configuration
export const EQUIPMENT_STATUS_CONFIG: Record<EquipmentStatus, {
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
}> = {
  active: {
    label: 'Activo',
    color: '#10b981',
    bgColor: 'bg-ok-50',
    textColor: 'text-ok-700',
  },
  inactive: {
    label: 'Inactivo',
    color: '#6b7280',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
  },
  available: {
    label: 'Disponible',
    color: '#8b5cf6',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
  },
};

// Asset Type Configuration
export const ASSET_TYPE_CONFIG: Record<AssetType, {
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  textColor: string;
}> = {
  vehiculo: {
    label: 'Vehículo',
    icon: 'truck',
    color: '#0ea5e9',
    bgColor: 'bg-info-50',
    textColor: 'text-info-700',
  },
  cargo: {
    label: 'Mercancía',
    icon: 'package',
    color: '#f59e0b',
    bgColor: 'bg-warn-50',
    textColor: 'text-warn-700',
  },
  container: {
    label: 'Contenedor',
    icon: 'box',
    color: '#8b5cf6',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
  },
  person: {
    label: 'Persona',
    icon: 'user',
    color: '#10b981',
    bgColor: 'bg-ok-50',
    textColor: 'text-ok-700',
  },
  other: {
    label: 'Otro',
    icon: 'circle',
    color: '#6b7280',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
  },
};

// Vehicle Status Configuration
export const VEHICLE_STATUS_CONFIG: Record<VehicleStatus, {
  label: string;
  color: string;
  markerColor: string;
  bgColor: string;
  textColor: string;
}> = {
  moving: {
    label: 'En movimiento',
    color: '#10b981',
    markerColor: '#10b981',
    bgColor: 'bg-ok-50',
    textColor: 'text-ok-700',
  },
  stopped: {
    label: 'Detenido',
    color: '#0ea5e9',
    markerColor: '#0ea5e9',
    bgColor: 'bg-info-50',
    textColor: 'text-info-700',
  },
  offline: {
    label: 'Sin señal',
    color: '#6b7280',
    markerColor: '#6b7280',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
  },
  critical: {
    label: 'Crítico',
    color: '#ef4444',
    markerColor: '#ef4444',
    bgColor: 'bg-crit-50',
    textColor: 'text-crit-700',
  },
};

// Notification Type Configuration
export const NOTIFICATION_TYPE_CONFIG: Record<NotificationType, {
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
}> = {
  info: {
    label: 'Información',
    color: '#0ea5e9',
    bgColor: 'bg-info-50',
    textColor: 'text-info-700',
  },
  warn: {
    label: 'Advertencia',
    color: '#f59e0b',
    bgColor: 'bg-warn-50',
    textColor: 'text-warn-700',
  },
  crit: {
    label: 'Crítico',
    color: '#ef4444',
    bgColor: 'bg-crit-50',
    textColor: 'text-crit-700',
  },
};

// Map Configuration
export const MAP_DEFAULT_CENTER: [number, number] = [-103.3918, 20.6897]; // Guadalajara, Jalisco (centrado en la zona metropolitana)
export const MAP_DEFAULT_ZOOM = 11;

// Dashboard Card IDs
export const DASHBOARD_CARDS = {
  KPI: 'kpi-card',
  MAP: 'map-card',
  ORDERS: 'orders-card',
  SUMMARY: 'summary-card',
} as const;

// Routes
export const ROUTES = {
  LOGIN: '/login',
  HOME: '/',
  // Vehículos (legacy - mantener para retrocompatibilidad)
  VEHICLES: '/vehiculos',
  VEHICLE_DETAIL: '/vehiculos/:id',
  // Nuevas rutas
  EQUIPMENTS: '/equipos', // Para superuser: vista global de equipos
  EQUIPMENT_DETAIL: '/equipos/:id',
  ASSETS: '/assets', // Para superuser: vista global de assets
  ASSET_DETAIL: '/assets/:id',
  DRIVERS: '/conductores',
  DRIVER_DETAIL: '/conductores/:id',
  PLACES: '/lugares',
  SIMS: '/sims',
  GEOFENCES: '/geocercas',
  CLIENTS: '/clientes',
  CLIENT_DETAIL: '/clientes/:id',
  REPORTS: '/reportes',
  NOTIFICATIONS: '/notificaciones',
  ALERTS: '/alertas',
  ROLES: '/roles',
  USERS: '/usuarios',
  ACCOUNT: '/mi-cuenta',
  ROUTE_SIMULATION: '/simulacion-ruta',
} as const;

// Query Keys
export const QUERY_KEYS = {
  AUTH_USER: ['auth', 'user'],
  // Legacy
  VEHICLES: ['vehicles'],
  VEHICLE: (id: string) => ['vehicle', id],
  VEHICLE_HISTORY: (id: string) => ['vehicle', id, 'history'],
  VEHICLE_EVENTS: (id: string) => ['vehicle', id, 'events'],
  // Nuevos
  EQUIPMENTS: ['equipments'],
  EQUIPMENT: (id: string) => ['equipment', id],
  EQUIPMENT_HISTORY: (id: string) => ['equipment', id, 'history'],
  EQUIPMENT_EVENTS: (id: string) => ['equipment', id, 'events'],
  ASSETS: ['assets'],
  ASSET: (id: string) => ['asset', id],
  DRIVERS: ['drivers'],
  DRIVER: (id: string) => ['driver', id],
  SIMS: ['sims'],
  SIM: (id: string) => ['sim', id],
  PLACES: ['places'],
  PLACE: (id: string) => ['place', id],
  CLIENTS: ['clients'],
  CLIENT: (id: string) => ['client', id],
  GEOFENCES: ['geofences'],
  GEOFENCE: (id: string) => ['geofence', id],
  NOTIFICATIONS: ['notifications'],
  ALERTS: ['alerts'],
  ALERTS_BY_EQUIPMENT: (equipmentId: string) => ['alerts', 'equipment', equipmentId],
  ALERTS_BY_GEOFENCE: (geofenceId: string) => ['alerts', 'geofence', geofenceId],
  REPORTS: ['reports'],
  USERS: ['users'],
  USER: (id: string) => ['user', id],
  ADMINS: ['admins'],
  ACTIVITY_LOGS: ['activity_logs'],
  ACTIVITY_LOGS_BY_USER: (userId: string) => ['activity_logs', 'user', userId],
  ACTIVITY_STATS: (userId: string) => ['activity_stats', userId],
} as const;
