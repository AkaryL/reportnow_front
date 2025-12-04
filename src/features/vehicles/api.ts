import type { Vehicle, VehicleEvent, VehicleHistoryPoint, Equipment, VehicleLastStatus } from '../../lib/types';
import apiClient from '../../lib/apiClient';
import { equipmentsApi } from '../equipments/api';

// Función para convertir un Equipment del backend a Vehicle del frontend
const equipmentToVehicle = (equipment: Equipment): Vehicle => {
  return {
    id: equipment.id,
    plate: equipment.serial || equipment.imei || 'SIN-ID',
    driver: `${equipment.brand || ''} ${equipment.model || ''}`.trim() || 'Sin modelo',
    status: determineVehicleStatusFromEquipment(equipment),
    lastSeenMin: equipment.last_seen
      ? Math.floor((Date.now() - new Date(equipment.last_seen).getTime()) / 60000)
      : 999,
    lat: equipment.lat || 0,
    lng: equipment.lng || 0,
    speed: equipment.speed || 0,
    deviceId: equipment.id,
    clientId: equipment.client_id,
    created_at: equipment.created_at,
    updated_at: equipment.updated_at,
  };
};

// Determinar el estado del vehículo basado en last_status del equipo
const determineVehicleStatusFromEquipment = (equipment: Equipment): Vehicle['status'] => {
  // Si el equipo está inactivo, siempre offline
  if (equipment.status === 'inactive') return 'offline';

  // Usar last_status si está disponible
  if (equipment.last_status) {
    switch (equipment.last_status) {
      case 'moving':
        return 'moving';
      case 'stopped':
      case 'engine_on':
        return 'stopped';
      case 'engine_off':
        return 'offline';
      default:
        break;
    }
  }

  // Fallback: calcular basándose en last_seen y speed
  if (equipment.last_seen) {
    const minutesAgo = Math.floor((Date.now() - new Date(equipment.last_seen).getTime()) / 60000);
    if (minutesAgo > 30) return 'offline';
    if (equipment.speed && equipment.speed > 5) return 'moving';
    return 'stopped';
  }

  return 'offline';
};

export const vehiclesApi = {
  getAll: async (): Promise<Vehicle[]> => {
    try {
      // Obtener equipos GPS directamente del backend
      const equipments = await equipmentsApi.getAll();
      // Convertir equipos a vehicles para mantener compatibilidad con UI
      return equipments.map(equipmentToVehicle);
    } catch (error) {
      console.error('Error fetching equipments from backend:', error);
      return [];
    }
  },

  getById: async (id: string): Promise<Vehicle | null> => {
    try {
      const equipment = await equipmentsApi.getById(id);
      if (!equipment) return null;
      return equipmentToVehicle(equipment);
    } catch (error) {
      console.error('Error fetching equipment:', error);
      return null;
    }
  },

  create: async (data: Partial<Vehicle>): Promise<Vehicle> => {
    // Crear equipo GPS
    const equipmentData = {
      imei: data.plate || `IMEI-${Date.now()}`,
      serial: data.plate,
      brand: 'Generic',
      model: 'GPS',
      status: 'active' as const,
    };
    const equipment = await equipmentsApi.create(equipmentData);
    return equipmentToVehicle(equipment);
  },

  update: async (id: string, data: Partial<Vehicle>): Promise<Vehicle> => {
    const equipmentData: any = {};
    if (data.plate) equipmentData.serial = data.plate;
    if (data.status) equipmentData.status = data.status === 'offline' ? 'inactive' : 'active';

    const equipment = await equipmentsApi.update(id, equipmentData);
    return equipmentToVehicle(equipment);
  },

  delete: async (id: string): Promise<void> => {
    await equipmentsApi.delete(id);
  },

  // History endpoints (TODO: Implement with backend vehicle-history endpoints)
  getHistoryDates: async (id: string): Promise<{ date: string; points: number }[]> => {
    // TODO: Implement with /vehicle-history/routes/{imei}
    return [];
  },

  getHistoryByDate: async (id: string, date: string): Promise<VehicleHistoryPoint[]> => {
    // TODO: Implement with /vehicle-history/routes/{imei}
    return [];
  },

  getHistory: async (
    id: string,
    params?: { from?: string; to?: string; limit?: number }
  ): Promise<VehicleHistoryPoint[]> => {
    // TODO: Implement with /vehicle-history/history/{imei}
    return [];
  },

  // Events endpoints (TODO: Implement with backend equipment-events endpoints)
  getEvents: async (
    id: string,
    params?: { limit?: number; event_type?: string }
  ): Promise<VehicleEvent[]> => {
    // TODO: Implement with /equipment-events
    return [];
  },
};
