// ==================== User & Auth ====================
export type UserRole = 'superuser' | 'admin' | 'cliente';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organizationId?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// ==================== Vehicle ====================
export type VehicleStatus = 'moving' | 'stopped' | 'offline' | 'critical';

export interface Vehicle {
  id: string;
  plate: string;
  driver: string;
  status: VehicleStatus;
  fuel: number; // percentage 0-100
  lastSeenMin: number; // minutes ago
  lat: number;
  lng: number;
  speed: number; // km/h
  temp?: number; // celsius
  deviceId?: string;
  organizationId?: string;
  assignedClientIds?: string[];
}

// ==================== Client ====================
export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  whatsapp?: string;
  vehicles: number; // count of assigned vehicles
  lastActivity?: string; // ISO date
  organizationId?: string;
}

// ==================== Notification ====================
export type NotificationType = 'info' | 'warn' | 'crit';

export interface Notification {
  id: string;
  ts: string; // ISO timestamp
  type: NotificationType;
  vehicleId: string;
  vehiclePlate?: string;
  text: string;
  read: boolean;
}

// ==================== Geofence ====================
export type GeofencePolicy = 'entrada' | 'salida' | 'prohibido';

export interface Geofence {
  id: string;
  name: string;
  policy: GeofencePolicy;
  color: string;
  geom: {
    type: string;
    coordinates: number[][][];
  };
  organizationId?: string;
}

// ==================== Report ====================
export interface Report {
  id: string;
  name: string;
  description: string;
  type: 'trips' | 'alerts' | 'fuel' | 'activity';
  createdAt: string;
}

// ==================== Dashboard ====================
export interface DashboardKPI {
  label: string;
  value: number;
  status?: VehicleStatus;
  icon?: string;
}

export interface DashboardLayout {
  userId: string;
  route: string;
  layout: {
    id: string;
    x: number;
    y: number;
    w: number;
    h: number;
  }[];
}

// ==================== Filters ====================
export interface HomeFilters {
  search: string;
  statuses: VehicleStatus[];
  timeRange?: {
    from: Date;
    to: Date;
  };
}

// ==================== WebSocket Events ====================
export interface WSPositionUpdate {
  vehicleId: string;
  lat: number;
  lng: number;
  speed: number;
  fuel: number;
  status: VehicleStatus;
  timestamp: string;
}

export interface WSNotificationEvent {
  notification: Notification;
}

// ==================== API Responses ====================
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
