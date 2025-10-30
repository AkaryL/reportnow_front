// Mock data para ReportNow - Nueva estructura con Equipos y Activos
// Este archivo contiene datos de prueba para desarrollo sin backend

import type {
  User,
  Client,
  SIM,
  Equipment,
  Asset,
  VehicleAsset,
  Driver,
  Place,
  Geofence,
  Notification,
  EquipmentEvent,
  EquipmentHistoryPoint,
  ActivityLog,
  Vehicle,
} from '../lib/types';
import { equipmentToVehicle } from '../lib/types';

// ==================== USUARIOS ====================
export const mockUsers: User[] = [
  {
    id: '1',
    username: 'julio',
    password: 'admin123',
    name: 'Julio Administrador',
    role: 'superuser',
    email: 'julio@reportnow.com',
    phone: '+52 33 3845 6789',
    created_at: new Date('2024-01-01').toISOString(),
  },
  {
    id: '2',
    username: 'admin',
    password: 'admin123',
    name: 'Admin General',
    role: 'admin',
    email: 'admin@reportnow.com',
    phone: '+52 33 1234 5678',
    client_id: '1', // Ahora el admin es el cliente de Transportes del Valle
    created_at: new Date('2024-01-05').toISOString(),
  },
  {
    id: '3',
    username: 'operador1',
    password: '123',
    name: 'Pedro Operador Admin',
    role: 'operator-admin',
    email: 'pedro@transportesvalle.com',
    phone: '+52 33 1587 3421',
    client_id: '1',
    created_at: new Date('2024-01-10').toISOString(),
    last_activity: new Date('2024-12-15T10:30:00').toISOString(),
  },
  {
    id: '4',
    username: 'monitor1',
    password: '123',
    name: 'Ana Monitor',
    role: 'operator-monitor',
    email: 'ana@transportesvalle.com',
    phone: '+52 33 2947 8156',
    client_id: '1',
    created_at: new Date('2024-01-15').toISOString(),
    last_activity: new Date('2024-12-14T16:45:00').toISOString(),
  },
  {
    id: '5',
    username: 'admin2',
    password: 'admin123',
    name: 'Carlos Admin Express',
    role: 'admin',
    email: 'info@expressjalisco.com',
    phone: '+52 33 2345 6789',
    client_id: '2',
    created_at: new Date('2024-01-20').toISOString(),
  },
  {
    id: '6',
    username: 'operador2',
    password: '123',
    name: 'María García Admin',
    role: 'operator-admin',
    email: 'maria.garcia@transportesvalle.com',
    phone: '+52 33 4562 7891',
    client_id: '1',
    created_at: new Date('2024-02-01').toISOString(),
    last_activity: new Date('2024-12-15T14:20:00').toISOString(),
  },
  {
    id: '7',
    username: 'monitor2',
    password: '123',
    name: 'José Luis Ramírez',
    role: 'operator-monitor',
    email: 'jluis@transportesvalle.com',
    phone: '+52 33 7834 2156',
    client_id: '1',
    created_at: new Date('2024-02-05').toISOString(),
    last_activity: new Date('2024-12-15T09:15:00').toISOString(),
  },
  {
    id: '8',
    username: 'operador3',
    password: '123',
    name: 'Carmen Hernández',
    role: 'operator-admin',
    email: 'carmen@expressjalisco.com',
    phone: '+52 33 5698 4321',
    client_id: '2',
    created_at: new Date('2024-02-10').toISOString(),
    last_activity: new Date('2024-12-14T18:30:00').toISOString(),
  },
  {
    id: '9',
    username: 'monitor3',
    password: '123',
    name: 'Roberto Sánchez',
    role: 'operator-monitor',
    email: 'roberto.s@expressjalisco.com',
    phone: '+52 33 9182 5647',
    client_id: '2',
    created_at: new Date('2024-02-15').toISOString(),
    last_activity: new Date('2024-12-15T11:45:00').toISOString(),
  },
];

// ==================== CLIENTES (Tenants) ====================
export const mockClients: Client[] = [
  {
    id: '1',
    contact_name: 'Roberto Valle',
    contact_position: 'Director de Operaciones',
    company_name: 'Transportes del Valle',
    contact_phone: '+52 33 1234 5678',
    email: 'contacto@transportesvalle.com',
    authorized_phones: ['+52 33 1234 5678', '+52 33 1234 5679'],
    authorized_emails: ['contacto@transportesvalle.com', 'admin@transportesvalle.com'],
    equipment_quota: 10,
    status: 'active',
    created_at: new Date('2024-01-10').toISOString(),
  },
  {
    id: '2',
    contact_name: 'Laura Mendoza',
    contact_position: 'Gerente General',
    company_name: 'Express Jalisco',
    contact_phone: '+52 33 2345 6789',
    email: 'info@expressjalisco.com',
    authorized_phones: ['+52 33 2345 6789'],
    authorized_emails: ['info@expressjalisco.com'],
    equipment_quota: 5,
    status: 'active',
    created_at: new Date('2024-01-15').toISOString(),
  },
  {
    id: '3',
    contact_name: 'Miguel Torres',
    contact_position: 'Director',
    company_name: 'Logística Zapopan',
    contact_phone: '+52 33 3456 7890',
    email: 'ventas@logisticazapopan.com',
    authorized_phones: ['+52 33 3456 7890'],
    authorized_emails: ['ventas@logisticazapopan.com'],
    equipment_quota: 8,
    status: 'active',
    created_at: new Date('2024-01-20').toISOString(),
  },
  {
    id: '4',
    contact_name: 'Patricia Morales',
    contact_position: 'Directora General',
    company_name: 'Transportes Suspendidos S.A.',
    contact_phone: '+52 33 9876 5432',
    email: 'patricia@transportessuspendidos.com',
    authorized_phones: ['+52 33 9876 5432', '+52 33 9876 5433'],
    authorized_emails: ['patricia@transportessuspendidos.com', 'admin@transportessuspendidos.com'],
    equipment_quota: 8,
    status: 'suspended',
    created_at: new Date('2024-02-01').toISOString(),
  },
];

// ==================== SIMs ====================
export const mockSIMs: SIM[] = [
  {
    id: 'sim1',
    company: 'Telcel',
    carrier: 'Telcel',
    iccid: '8952010123456789012',
    phone_number: '+52 33 1111 0001',
    phone_line: '+52 33 1111 0001',
    status: 'active',
    equipment_id: 'eq1',
    assigned_to_equipment_id: 'eq1',
    data_used_mb: 1250,
    data_limit_mb: 5120,
    activation_date: new Date('2024-01-01').toISOString(),
    created_at: new Date('2024-01-01').toISOString()
  },
  {
    id: 'sim2',
    company: 'Telcel',
    carrier: 'Telcel',
    iccid: '8952010123456789013',
    phone_number: '+52 33 1111 0002',
    phone_line: '+52 33 1111 0002',
    status: 'active',
    equipment_id: 'eq2',
    assigned_to_equipment_id: 'eq2',
    data_used_mb: 850,
    data_limit_mb: 3072,
    activation_date: new Date('2024-01-01').toISOString(),
    created_at: new Date('2024-01-01').toISOString()
  },
  {
    id: 'sim3',
    company: 'AT&T',
    carrier: 'AT&T',
    iccid: '8952020123456789014',
    phone_number: '+52 33 2222 0003',
    phone_line: '+52 33 2222 0003',
    status: 'active',
    equipment_id: 'eq3',
    assigned_to_equipment_id: 'eq3',
    data_used_mb: 4800,
    data_limit_mb: 5120,
    activation_date: new Date('2024-01-01').toISOString(),
    created_at: new Date('2024-01-01').toISOString()
  },
  {
    id: 'sim4',
    company: 'Telcel',
    carrier: 'Telcel',
    iccid: '8952010123456789015',
    phone_number: '+52 33 1111 0004',
    phone_line: '+52 33 1111 0004',
    status: 'active',
    equipment_id: 'eq4',
    assigned_to_equipment_id: 'eq4',
    data_used_mb: 2100,
    data_limit_mb: 5120,
    activation_date: new Date('2024-01-01').toISOString(),
    created_at: new Date('2024-01-01').toISOString()
  },
  {
    id: 'sim5',
    company: 'Movistar',
    carrier: 'Movistar',
    iccid: '8952030123456789016',
    phone_number: '+52 33 3333 0005',
    phone_line: '+52 33 3333 0005',
    status: 'active',
    equipment_id: 'eq5',
    assigned_to_equipment_id: 'eq5',
    data_used_mb: 1500,
    data_limit_mb: 3072,
    activation_date: new Date('2024-01-01').toISOString(),
    created_at: new Date('2024-01-01').toISOString()
  },
  {
    id: 'sim6',
    company: 'Telcel',
    carrier: 'Telcel',
    iccid: '8952010123456789017',
    phone_number: '+52 33 1111 0006',
    phone_line: '+52 33 1111 0006',
    status: 'suspended',
    equipment_id: 'eq6',
    assigned_to_equipment_id: 'eq6',
    data_used_mb: 5500,
    data_limit_mb: 5120,
    activation_date: new Date('2024-01-01').toISOString(),
    created_at: new Date('2024-01-01').toISOString()
  },
  {
    id: 'sim7',
    company: 'AT&T',
    carrier: 'AT&T',
    iccid: '8952020123456789018',
    phone_number: '+52 33 2222 0007',
    phone_line: '+52 33 2222 0007',
    status: 'active',
    equipment_id: 'eq7',
    assigned_to_equipment_id: 'eq7',
    data_used_mb: 980,
    data_limit_mb: 3072,
    activation_date: new Date('2024-01-01').toISOString(),
    created_at: new Date('2024-01-01').toISOString()
  },
  {
    id: 'sim8',
    company: 'Telcel',
    carrier: 'Telcel',
    iccid: '8952010123456789019',
    phone_number: '+52 33 1111 0008',
    phone_line: '+52 33 1111 0008',
    status: 'inactive',
    equipment_id: 'eq8',
    assigned_to_equipment_id: 'eq8',
    data_used_mb: 0,
    data_limit_mb: 5120,
    activation_date: new Date('2024-01-05').toISOString(),
    created_at: new Date('2024-01-05').toISOString()
  },
  {
    id: 'sim9',
    company: 'Movistar',
    carrier: 'Movistar',
    iccid: '8952030123456789020',
    phone_number: '+52 33 3333 0009',
    phone_line: '+52 33 3333 0009',
    status: 'inactive',
    data_used_mb: 0,
    created_at: new Date('2024-01-10').toISOString()
  },
];

// ==================== EQUIPOS (GPS Devices) ====================
export const mockEquipments: Equipment[] = [
  {
    id: 'eq1',
    imei: '359987654321001',
    serial: 'GPS-001',
    brand: 'Teltonika',
    model: 'FMB920',
    sim_id: 'sim1',
    client_id: '1',
    asset_id: 'asset1',
    status: 'active',
    lat: 20.6897,
    lng: -103.3918,
    speed: 65,
    bearing: 45,
    last_seen: new Date(Date.now() - 1000 * 60 * 1).toISOString(), // 1 min ago
    created_at: new Date('2024-01-10').toISOString(),
  },
  {
    id: 'eq2',
    imei: '359987654321002',
    serial: 'GPS-002',
    brand: 'Teltonika',
    model: 'FMB920',
    sim_id: 'sim2',
    client_id: '1',
    asset_id: 'asset2',
    status: 'active',
    lat: 20.6767,
    lng: -103.3475,
    speed: 0,
    bearing: 180,
    last_seen: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    created_at: new Date('2024-01-10').toISOString(),
  },
  {
    id: 'eq3',
    imei: '359987654321003',
    serial: 'GPS-003',
    brand: 'Concox',
    model: 'GT06N',
    sim_id: 'sim3',
    client_id: '1',
    asset_id: 'asset3',
    status: 'active',
    lat: 20.7342,
    lng: -103.4002,
    speed: 45,
    bearing: 270,
    last_seen: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    created_at: new Date('2024-01-11').toISOString(),
  },
  {
    id: 'eq4',
    imei: '359987654321004',
    serial: 'GPS-004',
    brand: 'Teltonika',
    model: 'FMB920',
    sim_id: 'sim4',
    client_id: '1',
    asset_id: 'asset4',
    status: 'active',
    lat: 20.6600,
    lng: -103.3200,
    speed: 55,
    bearing: 90,
    last_seen: new Date(Date.now() - 1000 * 60 * 1).toISOString(),
    created_at: new Date('2024-01-12').toISOString(),
  },
  {
    id: 'eq5',
    imei: '359987654321005',
    serial: 'GPS-005',
    brand: 'Queclink',
    model: 'GV300',
    sim_id: 'sim5',
    client_id: '2',
    asset_id: 'asset5',
    status: 'active',
    lat: 20.6500,
    lng: -103.3800,
    speed: 70,
    bearing: 120,
    last_seen: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    created_at: new Date('2024-01-15').toISOString(),
  },
  {
    id: 'eq6',
    imei: '359987654321006',
    serial: 'GPS-006',
    brand: 'Concox',
    model: 'GT06N',
    sim_id: 'sim6',
    client_id: '2',
    asset_id: 'asset6',
    status: 'active',
    lat: 20.7200,
    lng: -103.3600,
    speed: 0,
    bearing: 0,
    last_seen: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 min - offline
    created_at: new Date('2024-01-16').toISOString(),
  },
  {
    id: 'eq7',
    imei: '359987654321007',
    serial: 'GPS-007',
    brand: 'Teltonika',
    model: 'FMB920',
    sim_id: 'sim7',
    client_id: '2',
    asset_id: 'asset7',
    status: 'active',
    lat: 20.6950,
    lng: -103.4100,
    speed: 0,
    bearing: 45,
    last_seen: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    created_at: new Date('2024-01-17').toISOString(),
  },
  {
    id: 'eq8',
    imei: '359987654321008',
    serial: 'GPS-008',
    brand: 'Concox',
    model: 'GT06N',
    sim_id: 'sim8',
    client_id: '1',
    status: 'inactive',
    lat: 20.6800,
    lng: -103.3700,
    speed: 0,
    bearing: 0,
    last_seen: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(), // 15 days ago
    created_at: new Date('2024-01-05').toISOString(),
  },
  {
    id: 'eq9',
    imei: '359987654321009',
    serial: 'GPS-009',
    brand: 'Queclink',
    model: 'GV300',
    sim_id: 'sim9',
    client_id: '2',
    status: 'inactive',
    lat: 20.7100,
    lng: -103.3900,
    speed: 0,
    bearing: 0,
    last_seen: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(), // 30 days ago
    created_at: new Date('2024-01-08').toISOString(),
  },
  {
    id: 'eq10',
    imei: '359987654321010',
    serial: 'GPS-010',
    brand: 'Teltonika',
    model: 'FMB920',
    sim_id: 'sim10',
    status: 'available',
    created_at: new Date('2024-01-20').toISOString(),
  },
  {
    id: 'eq11',
    imei: '359987654321011',
    serial: 'GPS-011',
    brand: 'Concox',
    model: 'GT06N',
    sim_id: 'sim11',
    status: 'available',
    created_at: new Date('2024-01-22').toISOString(),
  },
  {
    id: 'eq12',
    imei: '359987654321012',
    serial: 'GPS-012',
    brand: 'Queclink',
    model: 'GV300',
    sim_id: 'sim12',
    status: 'available',
    created_at: new Date('2024-01-23').toISOString(),
  },
];

// ==================== CONDUCTORES ====================
export const mockDrivers: Driver[] = [
  {
    id: 'drv1',
    name: 'Juan Pérez',
    phone: '+52 33 9876 0001',
    email: 'juan.perez@transportesvalle.com',
    license_number: 'JAL123456',
    license_expiry: new Date('2026-12-31').toISOString(),
    status: 'on_trip',
    emergency_phone: '+52 33 9876 0011',
    address: 'Av. Vallarta 1234, Guadalajara',
    client_id: '1',
    created_at: new Date('2024-01-10').toISOString(),
  },
  {
    id: 'drv2',
    name: 'María González',
    phone: '+52 33 9876 0002',
    email: 'maria.gonzalez@transportesvalle.com',
    license_number: 'JAL234567',
    license_expiry: new Date('2025-06-30').toISOString(),
    status: 'on_trip',
    emergency_phone: '+52 33 9876 0022',
    address: 'Calle Juárez 567, Guadalajara',
    client_id: '1',
    created_at: new Date('2024-01-10').toISOString(),
  },
  {
    id: 'drv3',
    name: 'Carlos Ramírez',
    phone: '+52 33 9876 0003',
    email: 'carlos.ramirez@transportesvalle.com',
    license_number: 'JAL345678',
    license_expiry: new Date('2027-03-15').toISOString(),
    status: 'on_trip',
    emergency_phone: '+52 33 9876 0033',
    address: 'Av. Américas 890, Zapopan',
    client_id: '1',
    created_at: new Date('2024-01-11').toISOString(),
  },
  {
    id: 'drv4',
    name: 'Roberto Silva',
    phone: '+52 33 9876 0004',
    email: 'roberto.silva@expressjalisco.com',
    license_number: 'JAL456789',
    license_expiry: new Date('2026-09-20').toISOString(),
    status: 'on_trip',
    emergency_phone: '+52 33 9876 0044',
    address: 'Calle Hidalgo 123, Tlaquepaque',
    client_id: '2',
    created_at: new Date('2024-01-15').toISOString(),
  },
  {
    id: 'drv5',
    name: 'Ana López',
    phone: '+52 33 9876 0005',
    email: 'ana.lopez@transportesvalle.com',
    license_number: 'JAL567890',
    license_expiry: new Date('2025-02-28').toISOString(),
    status: 'available',
    emergency_phone: '+52 33 9876 0055',
    address: 'Av. López Mateos 456, Guadalajara',
    client_id: '1',
    created_at: new Date('2024-01-12').toISOString(),
  },
  {
    id: 'drv6',
    name: 'Pedro Martínez',
    phone: '+52 33 9876 0006',
    email: 'pedro.martinez@transportesvalle.com',
    license_number: 'JAL678901',
    license_expiry: new Date('2024-12-31').toISOString(),
    status: 'inactive',
    emergency_phone: '+52 33 9876 0066',
    address: 'Calle Independencia 789, Zapopan',
    client_id: '1',
    created_at: new Date('2024-01-13').toISOString(),
  },
];

// ==================== ACTIVOS ====================
export const mockAssets: Asset[] = [
  // Vehículos - Cliente 1
  {
    id: 'asset1',
    type: 'vehicle',
    name: 'Camión Carga 1',
    client_id: '1',
    equipment_id: 'eq1',
    brand: 'Freightliner',
    model: 'Cascadia',
    year: 2022,
    plate: 'JAL-123-A',
    economic_id: 'ECO-001',
    vin: '1FUJGHDV8NLAA1234',
    color: 'Blanco',
    driver_id: 'drv1',
    status: 'active',
    created_at: new Date('2024-01-10').toISOString(),
  },
  {
    id: 'asset2',
    type: 'vehicle',
    name: 'Camioneta Reparto 1',
    client_id: '1',
    equipment_id: 'eq2',
    brand: 'Ford',
    model: 'Transit',
    year: 2021,
    plate: 'JAL-456-B',
    economic_id: 'ECO-002',
    vin: '1FTBW3XM5MKA12345',
    color: 'Gris',
    driver_id: 'drv2',
    status: 'active',
    created_at: new Date('2024-01-10').toISOString(),
  },
  {
    id: 'asset3',
    type: 'vehicle',
    name: 'Camión Torton',
    client_id: '1',
    equipment_id: 'eq3',
    brand: 'International',
    model: 'DuraStar',
    year: 2020,
    plate: 'JAL-789-C',
    economic_id: 'ECO-003',
    vin: '1HTMMAAM1LH123456',
    color: 'Azul',
    driver_id: 'drv3',
    status: 'active',
    created_at: new Date('2024-01-11').toISOString(),
  },
  {
    id: 'asset4',
    type: 'vehicle',
    name: 'Sprinter Ejecutiva',
    client_id: '1',
    equipment_id: 'eq4',
    brand: 'Mercedes-Benz',
    model: 'Sprinter 2500',
    year: 2023,
    plate: 'JAL-012-D',
    economic_id: 'ECO-004',
    vin: 'WD3PE8CC5N5123456',
    color: 'Negro',
    status: 'active',
    created_at: new Date('2024-01-12').toISOString(),
  },
  // Vehículos - Cliente 2
  {
    id: 'asset5',
    type: 'vehicle',
    name: 'Express 1',
    client_id: '2',
    equipment_id: 'eq5',
    brand: 'Nissan',
    model: 'NP300',
    year: 2022,
    plate: 'GDL-234-E',
    economic_id: 'EXP-001',
    vin: '3N6AD31C5SK123456',
    color: 'Rojo',
    driver_id: 'drv4',
    status: 'active',
    created_at: new Date('2024-01-15').toISOString(),
  },
  {
    id: 'asset6',
    type: 'vehicle',
    name: 'Express 2',
    client_id: '2',
    equipment_id: 'eq6',
    brand: 'Chevrolet',
    model: 'Tornado',
    year: 2021,
    plate: 'GDL-567-F',
    economic_id: 'EXP-002',
    vin: '3GCPCCEC5LG123456',
    color: 'Blanco',
    status: 'active',
    created_at: new Date('2024-01-16').toISOString(),
  },
  {
    id: 'asset7',
    type: 'vehicle',
    name: 'Camioneta Carga',
    client_id: '2',
    equipment_id: 'eq7',
    brand: 'Toyota',
    model: 'Hilux',
    year: 2020,
    plate: 'GDL-890-G',
    economic_id: 'EXP-003',
    vin: '5TFDZ5BN8LX123456',
    color: 'Gris Oscuro',
    status: 'active',
    created_at: new Date('2024-01-17').toISOString(),
  },
];

// ==================== LUGARES (Places) ====================
export const mockPlaces: Place[] = [
  {
    id: 'place1',
    name: 'Bodega Central Valle',
    lat: 20.6765,
    lng: -103.3435,
    address: 'Av. Circunvalación 1500, Guadalajara',
    radius: 100,
    color: '#3b82f6',
    icon: 'warehouse',
    status: 'active',
    event_type: 'both',
    manager: 'Jorge Almacén',
    manager_phone: '+52 33 5555 1001',
    notes: 'Bodega principal de operaciones',
    client_id: '1',
    is_global: false,
    created_at: new Date('2024-01-10').toISOString(),
  },
  {
    id: 'place2',
    name: 'Centro Distribución Express',
    lat: 20.6500,
    lng: -103.3800,
    address: 'Calle Industria 789, Tlaquepaque',
    radius: 150,
    color: '#10b981',
    icon: 'building',
    status: 'active',
    event_type: 'both',
    manager: 'Sandra López',
    manager_phone: '+52 33 5555 2001',
    client_id: '2',
    is_global: false,
    created_at: new Date('2024-01-15').toISOString(),
  },
  {
    id: 'place3',
    name: 'Taller Mecánico',
    lat: 20.7000,
    lng: -103.3750,
    radius: 80,
    color: '#f59e0b',
    icon: 'factory',
    status: 'active',
    event_type: 'entry',
    notes: 'Taller autorizado para mantenimiento',
    client_id: '1',
    is_global: false,
    created_at: new Date('2024-01-12').toISOString(),
  },
  {
    id: 'place4',
    name: 'Gasolinera Norte',
    lat: 20.7200,
    lng: -103.3600,
    radius: 50,
    color: '#ef4444',
    icon: 'gas-station',
    status: 'active',
    event_type: 'both',
    notes: 'Gasolinera autorizada para carga de combustible',
    client_id: '1',
    is_global: false,
    created_at: new Date('2024-01-14').toISOString(),
  },
  {
    id: 'place5',
    name: 'Estacionamiento Central',
    lat: 20.6850,
    lng: -103.3500,
    radius: 120,
    color: '#8b5cf6',
    icon: 'parking',
    status: 'inactive',
    event_type: 'entry',
    notes: 'Estacionamiento temporal - En mantenimiento',
    client_id: '1',
    is_global: false,
    created_at: new Date('2024-01-16').toISOString(),
  },
];

// ==================== GEOCERCAS ====================
export const mockGeofences: Geofence[] = [
  // Geocerca circular (por dirección)
  {
    id: 'geo1',
    name: 'Centro de Guadalajara',
    creation_mode: 'address',
    center_lat: 20.6775,
    center_lng: -103.3400,
    radius: 1500,
    address: 'Centro Histórico, Guadalajara, Jalisco',
    color: '#22c55e',
    event_type: 'exit',
    notes: 'Zona de operación principal',
    client_id: '1',
    is_global: false,
    created_at: new Date('2024-01-10').toISOString(),
  },
  // Geocerca poligonal (por coordenadas)
  {
    id: 'geo2',
    name: 'Zona Industrial Tlaquepaque',
    creation_mode: 'coordinates',
    polygon_coordinates: [
      [-103.290, 20.620],
      [-103.280, 20.620],
      [-103.280, 20.610],
      [-103.290, 20.610],
      [-103.290, 20.620], // Cerrar polígono
    ],
    color: '#3b82f6',
    event_type: 'both',
    notes: 'Zona industrial autorizada',
    client_id: '1',
    is_global: false,
    created_at: new Date('2024-01-11').toISOString(),
  },
  // Geocerca restringida
  {
    id: 'geo3',
    name: 'Zona Restringida Norte',
    creation_mode: 'address',
    center_lat: 20.7150,
    center_lng: -103.3650,
    radius: 800,
    color: '#ef4444',
    event_type: 'entry',
    notes: 'Zona no autorizada para vehículos',
    client_id: '1',
    is_global: false,
    created_at: new Date('2024-01-12').toISOString(),
  },
];

// ==================== NOTIFICACIONES ====================
export const mockNotifications: Notification[] = [
  {
    id: 'n1',
    ts: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    type: 'warn',
    actor_type: 'system',
    action: 'equipment_speed_alert',
    description: 'EQ-005 (Express 1) detectó exceso de velocidad (85 km/h)',
    equipment_id: 'eq5',
    asset_id: 'asset5',
    resource_name: 'Express 1',
    client_id: '2',
    recipients: ['5'], // Admin del cliente 2
    read_by: [],
    channels: ['in-app'],
    priority: 'high',
  },
  {
    id: 'n2',
    ts: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    type: 'info',
    actor_type: 'system',
    action: 'equipment_entered_place',
    description: 'EQ-001 (Camión Carga 1) entró a Bodega Central Valle',
    equipment_id: 'eq1',
    asset_id: 'asset1',
    place_id: 'place1',
    resource_name: 'Bodega Central Valle',
    client_id: '1',
    recipients: ['2', '3'],
    read_by: ['2'],
    channels: ['in-app'],
    priority: 'normal',
  },
  {
    id: 'n3',
    ts: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    type: 'crit',
    actor_type: 'system',
    action: 'equipment_offline',
    description: 'EQ-006 (Express 2) sin señal por más de 30 minutos',
    equipment_id: 'eq6',
    asset_id: 'asset6',
    resource_name: 'Express 2',
    client_id: '2',
    recipients: ['5'],
    read_by: [],
    channels: ['in-app', 'email'],
    priority: 'high',
  },
  {
    id: 'n4',
    ts: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    type: 'info',
    actor_type: 'user',
    actor_user_id: '3',
    actor_user_name: 'Pedro Operador Admin',
    actor_user_role: 'operator-admin',
    action: 'create_geofence',
    description: 'Pedro Operador Admin creó la geocerca "Zona Restringida Norte"',
    geofence_id: 'geo3',
    resource_name: 'Zona Restringida Norte',
    client_id: '1',
    recipients: ['1', '2'],
    read_by: ['1'],
    channels: ['in-app'],
    priority: 'normal',
  },
];

// ==================== EVENTOS DE EQUIPO ====================
export const mockEquipmentEvents: EquipmentEvent[] = [
  {
    id: 'evt1',
    equipment_id: 'eq1',
    asset_id: 'asset1',
    event_type: 'place_entry',
    description: 'Entrada a Bodega Central Valle',
    place_id: 'place1',
    place_name: 'Bodega Central Valle',
    lat: 20.6765,
    lng: -103.3435,
    ts: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: 'evt2',
    equipment_id: 'eq5',
    asset_id: 'asset5',
    event_type: 'speed_alert',
    description: 'Exceso de velocidad detectado: 85 km/h',
    lat: 20.6500,
    lng: -103.3800,
    ts: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    metadata: { speed: 85, limit: 70 },
  },
  {
    id: 'evt3',
    equipment_id: 'eq6',
    asset_id: 'asset6',
    event_type: 'offline_alert',
    description: 'Equipo sin señal por más de 30 minutos',
    lat: 20.7200,
    lng: -103.3600,
    ts: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    metadata: { offline_minutes: 45 },
  },
  {
    id: 'evt4',
    equipment_id: 'eq3',
    asset_id: 'asset3',
    event_type: 'geofence_entry',
    description: 'Entrada a Zona Restringida Norte',
    geofence_id: 'geo3',
    geofence_name: 'Zona Restringida Norte',
    lat: 20.7150,
    lng: -103.3650,
    ts: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
];

// ==================== HISTORIAL DE EQUIPO ====================
export const generateEquipmentHistory = (equipmentId: string): EquipmentHistoryPoint[] => {
  const history: EquipmentHistoryPoint[] = [];
  const equipment = mockEquipments.find(e => e.id === equipmentId);

  if (!equipment || !equipment.lat || !equipment.lng) return history;

  const now = Date.now();
  const pointsToGenerate = 20;
  const intervalSeconds = 10;

  let currentLat = equipment.lat;
  let currentLng = equipment.lng;

  const direction = Math.random() * 2 * Math.PI;
  const avgSpeed = equipment.speed || 50;
  const distancePerPointMeters = (avgSpeed * 1000 / 3600) * intervalSeconds;

  const metersPerDegreeLat = 111320;
  const metersPerDegreeLng = 111320 * Math.cos(currentLat * Math.PI / 180);

  const latIncrement = (distancePerPointMeters / metersPerDegreeLat) * Math.cos(direction);
  const lngIncrement = (distancePerPointMeters / metersPerDegreeLng) * Math.sin(direction);

  for (let i = 0; i < pointsToGenerate; i++) {
    const timestamp = now - ((pointsToGenerate - 1 - i) * intervalSeconds * 1000);
    const randomLat = (Math.random() - 0.5) * 0.00005;
    const randomLng = (Math.random() - 0.5) * 0.00005;
    const speedVariation = (Math.random() - 0.5) * 20;
    const currentSpeed = Math.max(0, Math.min(120, avgSpeed + speedVariation));

    history.push({
      id: `hist_${equipmentId}_${i}`,
      equipment_id: equipmentId,
      asset_id: equipment.asset_id,
      lat: currentLat + randomLat,
      lng: currentLng + randomLng,
      speed: currentSpeed,
      bearing: equipment.bearing,
      ts: new Date(timestamp).toISOString(),
    });

    currentLat += latIncrement;
    currentLng += lngIncrement;
  }

  return history.sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
};

// ==================== ACTIVITY LOG ====================
export const mockActivityLogs: ActivityLog[] = [
  {
    id: 'act1',
    user_id: '1',
    user_name: 'Julio Administrador',
    user_role: 'superuser',
    activity_type: 'create_client',
    description: 'Creó el cliente "Transportes del Valle"',
    target_type: 'client',
    target_id: '1',
    target_name: 'Transportes del Valle',
    ts: new Date('2024-01-10T10:00:00').toISOString(),
  },
  {
    id: 'act2',
    user_id: '2',
    user_name: 'Admin General',
    user_role: 'admin',
    activity_type: 'create_asset',
    description: 'Agregó el activo "Camión Carga 1"',
    target_type: 'asset',
    target_id: 'asset1',
    target_name: 'Camión Carga 1',
    client_id: '1',
    ts: new Date('2024-01-10T11:00:00').toISOString(),
    metadata: { asset_type: 'vehicle', plate: 'JAL-123-A' },
  },
  {
    id: 'act3',
    user_id: '3',
    user_name: 'Pedro Operador Admin',
    user_role: 'operator-admin',
    activity_type: 'create_geofence',
    description: 'Creó la geocerca "Zona Restringida Norte"',
    target_type: 'geofence',
    target_id: 'geo3',
    target_name: 'Zona Restringida Norte',
    client_id: '1',
    ts: new Date('2024-01-12T14:30:00').toISOString(),
  },
  {
    id: 'act4',
    user_id: '1',
    user_name: 'Julio Administrador',
    user_role: 'superuser',
    activity_type: 'assign_equipment_to_asset',
    description: 'Asignó equipo GPS-001 al activo "Camión Carga 1"',
    target_type: 'equipment',
    target_id: 'eq1',
    target_name: 'GPS-001',
    client_id: '1',
    ts: new Date('2024-01-10T11:30:00').toISOString(),
    metadata: { equipment_imei: '359987654321001', asset_name: 'Camión Carga 1' },
  },
];

// ==================== FUNCIONES AUXILIARES ====================

// Obtener equipos por cliente
export const getEquipmentsByClient = (clientId: string): Equipment[] => {
  return mockEquipments.filter(e => e.client_id === clientId);
};

// Obtener activos por cliente
export const getAssetsByClient = (clientId: string): Asset[] => {
  return mockAssets.filter(a => a.client_id === clientId);
};

// Obtener geocercas por cliente
export const getGeofencesByClient = (clientId?: string): Geofence[] => {
  if (!clientId) {
    return mockGeofences.filter(g => g.is_global);
  }
  return mockGeofences.filter(g => g.is_global || g.client_id === clientId);
};

// Obtener lugares por cliente
export const getPlacesByClient = (clientId?: string): Place[] => {
  if (!clientId) {
    return mockPlaces.filter(p => p.is_global);
  }
  return mockPlaces.filter(p => p.is_global || p.client_id === clientId);
};

// Obtener notificaciones por cliente
export const getNotificationsByClient = (clientId?: string): Notification[] => {
  if (!clientId) return mockNotifications;
  return mockNotifications.filter(n => n.client_id === clientId);
};

// Obtener eventos de un equipo
export const getEquipmentEvents = (equipmentId: string): EquipmentEvent[] => {
  return mockEquipmentEvents.filter(e => e.equipment_id === equipmentId);
};

// ==================== VISTA LEGACY: VEHÍCULOS ====================
// Estas funciones mantienen compatibilidad con el código existente que usa Vehicle
// TODO: Remover una vez completada la migración

export const mockVehicles: Vehicle[] = mockEquipments
  .map(equipment => {
    const asset = mockAssets.find(a => a.id === equipment.asset_id && a.type === 'vehicle') as VehicleAsset | undefined;
    const driver = asset?.driver_id ? mockDrivers.find(d => d.id === asset.driver_id) : undefined;
    return equipmentToVehicle(equipment, asset, driver);
  });

export const getVehiclesByClient = (clientId: string): Vehicle[] => {
  return mockVehicles.filter(v => v.clientId === clientId);
};

// Mantener compatibilidad con VehicleEvent y VehicleHistoryPoint
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

export const mockVehicleEvents: VehicleEvent[] = mockEquipmentEvents.map(evt => ({
  id: evt.id,
  vehicle_id: evt.equipment_id,
  event_type: evt.event_type === 'place_entry' ? 'geofence_entry' :
              evt.event_type === 'place_exit' ? 'geofence_exit' :
              evt.event_type as any,
  description: evt.description,
  geofence_id: evt.geofence_id || evt.place_id,
  lat: evt.lat,
  lng: evt.lng,
  ts: evt.ts,
  metadata: evt.metadata,
}));

export const generateVehicleHistory = (vehicleId: string): VehicleHistoryPoint[] => {
  const history = generateEquipmentHistory(vehicleId);
  return history.map(h => ({
    id: h.id,
    vehicle_id: h.equipment_id,
    lat: h.lat,
    lng: h.lng,
    speed: h.speed,
    ts: h.ts,
  }));
};

export const getVehicleEvents = (vehicleId: string): VehicleEvent[] => {
  return mockVehicleEvents.filter(e => e.vehicle_id === vehicleId);
};
