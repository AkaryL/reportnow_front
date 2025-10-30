// ==================== User & Auth ====================
export type UserRole = 'superuser' | 'admin' | 'operator-admin' | 'operator-monitor';

export interface User {
  id: string;
  username: string;
  password?: string; // Solo para mock/dev, nunca exponer en producción
  name: string;
  email: string;
  role: UserRole;
  client_id?: string; // Tenant al que pertenece (null para superuser)
  phone?: string; // Teléfono del usuario
  created_at: string;
  updated_at?: string;
  last_activity?: string; // Última actividad del usuario
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// ==================== Cliente (Tenant/Account) ====================
export type ClientStatus = 'active' | 'inactive' | 'suspended';

export interface Client {
  id: string;
  // Información de contacto
  name?: string; // Legacy - mantener por compatibilidad
  contact_name: string;
  contact_position: string;
  company_name: string;
  contact_phone: string;
  phone?: string; // Legacy - mantener por compatibilidad
  email: string;
  authorized_phones: string[]; // Teléfonos autorizados
  authorized_emails: string[]; // Emails autorizados

  // Configuración
  equipment_quota: number; // Cuota de equipos asignada por superuser
  status: ClientStatus;
  vehicles?: number; // Legacy - mantener por compatibilidad
  lastActivity?: string; // Legacy - mantener por compatibilidad

  // Metadatos
  created_at: string;
  updated_at?: string;
}

// ==================== SIM ====================
export type SIMStatus = 'available' | 'active' | 'suspended' | 'inactive';

export interface SIM {
  id: string;
  company: string; // Compañía (Telcel, AT&T, Movistar, etc.)
  carrier: string; // Operador (Telcel, AT&T, Movistar, etc.)
  iccid: string; // ICCID único
  phone_number: string; // Número telefónico
  phone_line: string; // Línea telefónica (legacy - mantener por compatibilidad)
  apn?: string; // Access Point Name
  status: SIMStatus;
  equipment_id?: string; // ID del equipo al que está asignado
  assigned_to_equipment_id?: string; // Legacy - mantener por compatibilidad
  data_used_mb: number; // Datos consumidos en MB
  data_limit_mb?: number; // Límite de datos en MB
  activation_date?: string;
  expiry_date?: string;
  created_at: string;
  updated_at?: string;
}

// ==================== Equipo (GPS Device) ====================
export type EquipmentStatus = 'active' | 'inactive' | 'available';

export interface Equipment {
  id: string;
  // Información del dispositivo
  imei: string; // Único
  serial: string; // Único
  brand: string;
  model: string;
  firmware_version?: string;

  // Asignaciones
  sim_id: string; // SIM asignada (obligatorio)
  client_id?: string; // Cliente/tenant al que está asignado
  asset_id?: string; // Activo al que está asignado actualmente (null si no está asignado)

  // Estado
  status: EquipmentStatus; // Activo (asignable) o Inactivo (no asignable/oculto para cliente)

  // Posición actual (telemetría en tiempo real)
  lat?: number;
  lng?: number;
  speed?: number; // km/h
  bearing?: number; // Dirección en grados (0-360)
  last_seen?: string; // ISO timestamp de última comunicación

  // Metadatos
  purchase_date?: string;
  warranty_expiry?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

// ==================== Activo (Asset) ====================
export type AssetType = 'vehicle' | 'cargo' | 'container' | 'person' | 'other';
export type AssetStatus = 'active' | 'inactive';

// Base común para todos los activos
export interface AssetBase {
  id: string;
  type: AssetType;
  name: string;
  description?: string;
  client_id: string; // Tenant propietario
  equipment_id?: string; // Equipo GPS asignado (null si no tiene)
  photo_url?: string; // URL de foto del activo
  icon?: string; // Ícono personalizado (opcional)
  notes?: string;
  status: AssetStatus;
  created_at: string;
  updated_at?: string;
}

// Vehículo
export interface VehicleAsset extends AssetBase {
  type: 'vehicle';
  // Campos específicos de vehículo
  brand: string;
  model: string;
  year: number;
  plate: string; // Único
  economic_id: string; // ID económico - Único
  vin: string; // Único
  color: string;
  driver_id?: string; // Conductor asignado (opcional)
}

// Carga/Mercancía
export interface CargoAsset extends AssetBase {
  type: 'cargo';
  cargo_type: string; // Tipo de mercancía
  box_id?: string; // ID de caja - Único
  tracking_number?: string;
  weight_kg?: number;
  dimensions?: string;
  value?: number;
}

// Contenedor
export interface ContainerAsset extends AssetBase {
  type: 'container';
  container_type: string; // Tipo de contenedor (20ft, 40ft, etc.)
  container_number?: string;
  box_plate?: string; // Placa de caja
  economic_id?: string; // ID económico - Único
  color?: string;
  size_ft?: number;
}

// Persona
export interface PersonAsset extends AssetBase {
  type: 'person';
  person_name: string; // Nombre de la persona
  role?: string;
  phone: string;
  email?: string;
  address?: string;
  emergency_phone?: string;
  position?: string; // Cargo (opcional)
}

// Otro (genérico)
export interface OtherAsset extends AssetBase {
  type: 'other';
  asset_type?: string; // Tipo específico (mascota, equipo, etc.)
  category?: string;
  custom_fields?: Record<string, any>;
}

// Union type para todos los activos
export type Asset = VehicleAsset | CargoAsset | ContainerAsset | PersonAsset | OtherAsset;

// ==================== Conductor (Driver - solo para vehículos) ====================
export type DriverStatus = 'available' | 'on_trip' | 'inactive';

export interface Driver {
  id: string;
  name: string;
  phone: string;
  email?: string;
  photo_url?: string;
  license_number: string; // No. de licencia - Único
  license_expiry: string; // Fecha de expiración ISO
  status: DriverStatus;
  emergency_phone: string;
  address: string;
  client_id: string; // Tenant propietario
  created_at: string;
  updated_at?: string;
}

// ==================== Lugar (Place/POI) ====================
export type PlaceStatus = 'active' | 'inactive';

export interface Place {
  id: string;
  name: string;
  // Ubicación
  lat: number;
  lng: number;
  address?: string; // Dirección opcional

  // Configuración
  radius: number; // Radio en metros (invisible en mapa, solo para cálculo)
  color: string;
  icon?: string; // Ícono opcional del catálogo (8 opciones de React Icons)
  status: PlaceStatus;

  // Eventos
  event_type: 'entry' | 'exit' | 'both'; // Solo entrada, Solo salida, Entrada/Salida
  notify_entry?: boolean;
  notify_exit?: boolean;

  // Metadata
  manager?: string; // Encargado (opcional)
  manager_phone?: string;
  notes?: string;

  // Tenant
  client_id?: string; // Tenant propietario (opcional si es global)
  is_global?: boolean; // Si es visible para todos (solo superuser puede crear globales)

  created_at: string;
  updated_at?: string;
}

// ==================== Geocerca (Geofence) ====================
export type GeofenceCreationMode = 'address' | 'coordinates';
export type GeofenceEventType = 'entry' | 'exit' | 'both';

export interface Geofence {
  id: string;
  name: string;

  // Modo de creación
  creation_mode: GeofenceCreationMode;

  // Para modo 'address' (circular)
  center_lat?: number;
  center_lng?: number;
  radius?: number; // Radio en metros (visible en mapa)
  address?: string; // Dirección o punto de interés buscado

  // Para modo 'coordinates' (polígono)
  // Mínimo 3 puntos [lng, lat]
  polygon_coordinates?: number[][]; // [[lng, lat], [lng, lat], ...]

  // Configuración visual
  color: string;

  // Geometría GeoJSON (para compatibilidad con mapas)
  geom?: any;
  policy?: string;

  // Configuración de eventos
  event_type: GeofenceEventType; // Solo entrada, Solo salida, Entrada/Salida

  // Metadata
  notes?: string;

  // Tenant
  client_id: string; // Tenant propietario
  is_global?: boolean; // Si es visible para todos (solo superuser puede crear globales)

  created_at: string;
  updated_at?: string;
}

// ==================== Historial de Equipo ====================
export interface EquipmentHistoryPoint {
  id: string;
  equipment_id: string; // Historial por equipo (no por activo)
  asset_id?: string; // Activo que tenía asignado en ese momento
  lat: number;
  lng: number;
  speed?: number; // km/h
  bearing?: number; // Dirección
  ts: string; // ISO timestamp
}

// ==================== Eventos de Equipo ====================
export type EquipmentEventType =
  | 'geofence_entry'
  | 'geofence_exit'
  | 'place_entry'
  | 'place_exit'
  | 'speed_alert'
  | 'offline_alert'
  | 'online_alert';

export interface EquipmentEvent {
  id: string;
  equipment_id: string;
  asset_id?: string; // Activo asignado al momento del evento
  event_type: EquipmentEventType;
  description: string;

  // Zona relacionada (si aplica)
  geofence_id?: string;
  geofence_name?: string;
  place_id?: string;
  place_name?: string;

  // Ubicación del evento
  lat?: number;
  lng?: number;

  // Timestamp
  ts: string; // ISO timestamp

  // Metadata adicional
  metadata?: Record<string, any>;
}

// ==================== Notificaciones ====================
export type NotificationType = 'info' | 'warn' | 'crit';
export type NotificationChannel = 'in-app' | 'email' | 'webhook';

export interface Notification {
  id: string;
  ts: string; // ISO timestamp
  type: NotificationType;

  // Actor (quién realizó la acción o generó el evento)
  actor_type: 'user' | 'system';
  actor_user_id?: string; // Si es usuario
  actor_user_name?: string;
  actor_user_role?: UserRole;

  // Acción/Evento
  action: string; // create_geofence, edit_place, equipment_entered_zone, etc.
  description: string; // Mensaje legible

  // Recursos relacionados
  equipment_id?: string;
  asset_id?: string;
  geofence_id?: string;
  place_id?: string;
  resource_name?: string; // Nombre del recurso afectado

  // Tenant
  client_id?: string; // null para notificaciones globales (superuser)

  // Destinatarios
  recipients: string[]; // IDs de usuarios destinatarios

  // Estado
  read_by: string[]; // IDs de usuarios que ya leyeron

  // Canal
  channels: NotificationChannel[];
  priority: 'normal' | 'high';

  // Metadata
  metadata?: Record<string, any>;
}

// ==================== Activity Log (Auditoría) ====================
export type ActivityType =
  // Clientes
  | 'create_client'
  | 'update_client'
  | 'delete_client'
  // Equipos
  | 'create_equipment'
  | 'update_equipment'
  | 'delete_equipment'
  | 'assign_equipment_to_client'
  | 'assign_equipment_to_asset'
  | 'unassign_equipment'
  | 'activate_equipment'
  | 'deactivate_equipment'
  // Activos
  | 'create_asset'
  | 'update_asset'
  | 'delete_asset'
  | 'create_vehicle'
  | 'update_vehicle'
  | 'delete_vehicle'
  // Geocercas
  | 'create_geofence'
  | 'update_geofence'
  | 'delete_geofence'
  | 'add_geofence_point'
  // Lugares
  | 'create_place'
  | 'update_place'
  | 'delete_place'
  // Conductores
  | 'create_driver'
  | 'update_driver'
  | 'delete_driver'
  | 'assign_driver'
  // Usuarios
  | 'create_user'
  | 'update_user'
  | 'delete_user'
  | 'change_user_role'
  // Notificaciones
  | 'send_notification';

export interface ActivityLog {
  id: string;

  // Quién
  user_id: string;
  user_name: string;
  user_role: UserRole;

  // Qué
  activity_type: ActivityType;
  description: string;

  // Sobre qué recurso
  target_type?: 'client' | 'equipment' | 'asset' | 'geofence' | 'place' | 'driver' | 'user' | 'notification';
  target_id?: string;
  target_name?: string;

  // Dónde (tenant)
  client_id?: string; // null para acciones globales de superuser

  // Cuándo
  ts: string; // ISO timestamp

  // Metadata adicional
  metadata?: Record<string, any>;
}

// ==================== Dashboard KPIs ====================
export interface DashboardKPI {
  label: string;
  value: number;
  change?: number; // Cambio porcentual respecto a periodo anterior
  icon?: string;
  status?: 'moving' | 'stopped' | 'offline' | 'critical';
}

// ==================== Filters ====================
export interface EquipmentFilters {
  search: string;
  statuses: EquipmentStatus[];
  clients?: string[]; // Solo para superuser
  hasAsset?: boolean; // true = con activo asignado, false = sin activo, undefined = todos
}

export interface AssetFilters {
  search: string;
  types: AssetType[];
  clients?: string[]; // Solo para superuser
  hasEquipment?: boolean; // true = con equipo asignado, false = sin equipo, undefined = todos
}

// ==================== WebSocket Events ====================
export interface WSEquipmentUpdate {
  equipmentId: string;
  assetId?: string;
  lat: number;
  lng: number;
  speed: number;
  bearing?: number;
  timestamp: string;
}

export interface WSPositionUpdate {
  vehicleId: string;
  lat: number;
  lng: number;
  speed: number;
  bearing: number;
  timestamp: string;
}

export interface WSNotificationEvent {
  notification: Notification;
}

export interface WSEquipmentEvent {
  event: EquipmentEvent;
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

// ==================== Report ====================
export interface Report {
  id: string;
  name: string;
  description: string;
  type: 'trips' | 'alerts' | 'activity' | 'zones';
  client_id?: string; // null para reportes globales
  created_by_user_id: string;
  created_at: string;
}

// ==================== Catálogo de Íconos para Lugares ====================
export const PLACE_ICONS = [
  'home',
  'building',
  'warehouse',
  'store',
  'factory',
  'hospital',
  'school',
  'parking'
] as const;

export type PlaceIcon = typeof PLACE_ICONS[number];

// ==================== TIPOS DE RETROCOMPATIBILIDAD (TEMPORAL) ====================
// Estos tipos mantienen compatibilidad con el código existente durante la refactorización
// TODO: Remover una vez que todos los archivos estén actualizados

export type VehicleStatus = 'moving' | 'stopped' | 'offline' | 'critical';

// Vehicle es ahora una vista combinada de Equipment + VehicleAsset
export interface Vehicle {
  id: string;
  plate: string;
  driver: string;
  status: VehicleStatus;
  lastSeenMin: number;
  lat: number;
  lng: number;
  speed: number;
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

// Helper para convertir Equipment + VehicleAsset a Vehicle (vista legacy)
export function equipmentToVehicle(equipment: Equipment, asset?: VehicleAsset, driver?: Driver): Vehicle {
  const minutesAgo = equipment.last_seen
    ? Math.floor((Date.now() - new Date(equipment.last_seen).getTime()) / 60000)
    : 999;

  let status: VehicleStatus = 'offline';
  if (minutesAgo < 5) {
    status = equipment.speed && equipment.speed > 5 ? 'moving' : 'stopped';
  } else if (minutesAgo < 30) {
    status = 'stopped';
  }

  return {
    id: equipment.id,
    plate: asset?.plate || 'SIN-PLACA',
    driver: driver?.name || asset?.driver_id || 'Sin conductor',
    status,
    lastSeenMin: minutesAgo,
    lat: equipment.lat || 0,
    lng: equipment.lng || 0,
    speed: equipment.speed || 0,
    deviceId: equipment.id,
    clientId: equipment.client_id,
    created_at: equipment.created_at,
    updated_at: equipment.updated_at,
  };
}
