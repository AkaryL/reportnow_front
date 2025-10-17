import type { VehicleStatus, NotificationType } from './types';

export const APP_NAME = import.meta.env.VITE_APP_NAME || 'ReportNow';
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
export const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';
export const MAP_STYLE = import.meta.env.VITE_MAP_STYLE || 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

// Local Storage Keys
export const LS_TOKEN_KEY = 'reportnow:token';
export const LS_USER_KEY = 'reportnow:user';
export const LS_LAYOUT_PREFIX = 'reportnow:layout';

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
  VEHICLES: '/vehiculos',
  VEHICLE_DETAIL: '/vehiculos/:id',
  GEOFENCES: '/geocercas',
  CLIENTS: '/clientes',
  CLIENT_DETAIL: '/clientes/:id',
  REPORTS: '/reportes',
  NOTIFICATIONS: '/notificaciones',
  ROLES: '/roles',
  ACCOUNT: '/mi-cuenta',
} as const;

// Query Keys
export const QUERY_KEYS = {
  AUTH_USER: ['auth', 'user'],
  VEHICLES: ['vehicles'],
  VEHICLE: (id: string) => ['vehicle', id],
  CLIENTS: ['clients'],
  GEOFENCES: ['geofences'],
  NOTIFICATIONS: ['notifications'],
  REPORTS: ['reports'],
  USERS: ['users'],
  USER: (id: string) => ['user', id],
  ADMINS: ['admins'],
  ACTIVITY_LOGS: ['activity_logs'],
  ACTIVITY_LOGS_BY_USER: (userId: string) => ['activity_logs', 'user', userId],
  ACTIVITY_STATS: (userId: string) => ['activity_stats', userId],
} as const;
