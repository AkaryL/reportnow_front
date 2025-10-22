// ==================== User & Auth ====================
export type UserRole = 'superuser' | 'admin' | 'client' | 'cliente';

export interface User {
  id: string;
  username?: string;
  password?: string;
  name: string;
  email?: string;
  role: UserRole;
  organizationId?: string;
  client_id?: string;
  client_name?: string;
  created_at?: string;
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
  lastSeenMin: number; // minutes ago
  lat: number;
  lng: number;
  speed: number; // km/h
  deviceId?: string;
  organizationId?: string;
  assignedClientIds?: string[];
  clientId?: string;
  created_at?: string;
  updated_at?: string;
}

export interface VehicleEvent {
  id: string;
  vehicle_id: string;
  event_type: 'geofence_entry' | 'geofence_exit' | 'speed_alert' | 'offline_alert';
  description: string;
  geofence_id?: string;
  lat?: number;
  lng?: number;
  ts: string;
  metadata?: any;
}

export interface VehicleHistoryPoint {
  id: string;
  vehicle_id: string;
  lat: number;
  lng: number;
  speed?: number;
  ts: string;
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
  created_at?: string;
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
  type: string;
  policy?: GeofencePolicy;
  alert_type?: 'entry' | 'exit' | 'both';
  color: string;
  geom: {
    type: string;
    coordinates: number[][][];
  };
  organizationId?: string;
  client_id?: string;
  is_global?: boolean;
  created_by_role?: UserRole;
  created_by_user_id?: string;
}

// ==================== Report ====================
export interface Report {
  id: string;
  name: string;
  description: string;
  type: 'trips' | 'alerts' | 'activity';
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
  status: VehicleStatus;
  timestamp: string;
}

export interface WSNotificationEvent {
  notification: Notification;
}

// ==================== Activity Log ====================
export type ActivityType =
  | 'create_client'
  | 'update_client'
  | 'delete_client'
  | 'create_geofence'
  | 'update_geofence'
  | 'delete_geofence'
  | 'create_vehicle'
  | 'update_vehicle'
  | 'delete_vehicle'
  | 'send_notification'
  | 'assign_vehicle'
  | 'unassign_vehicle'
  | 'create_user'
  | 'update_user'
  | 'delete_user';

export interface ActivityLog {
  id: string;
  user_id: string;
  user_name: string;
  user_role: UserRole;
  activity_type: ActivityType;
  description: string;
  target_type?: 'client' | 'vehicle' | 'geofence' | 'user' | 'notification';
  target_id?: string;
  target_name?: string;
  metadata?: Record<string, any>;
  ts: string;
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
