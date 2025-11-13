import type { Vehicle, VehicleEvent, VehicleHistoryPoint } from '../../lib/types';
import apiClient from '../../lib/apiClient';
import { assetsApi } from '../assets/api';
import type { Asset } from '../../lib/types';

// Función para convertir un Asset del backend a Vehicle del frontend
const assetToVehicle = (asset: any): Vehicle => {
  const equipment = asset.equipment;

  return {
    id: asset.id,
    plate: asset.plate || asset.name || 'SIN-PLACA',
    driver: asset.person_name || 'Sin conductor',
    status: determineVehicleStatus(asset, equipment),
    lastSeenMin: equipment?.last_seen
      ? Math.floor((Date.now() - new Date(equipment.last_seen).getTime()) / 60000)
      : 999,
    lat: equipment?.lat || 0,
    lng: equipment?.lng || 0,
    speed: equipment?.speed || 0,
    deviceId: equipment?.imei || asset.equipment_id,
    clientId: asset.client_id,
    created_at: asset.created_at,
    updated_at: asset.updated_at,
  };
};

// Determinar el estado del vehículo basado en los datos del asset
const determineVehicleStatus = (asset: any, equipment: any): Vehicle['status'] => {
  if (asset.status === 'inactive') return 'offline';

  if (equipment?.last_seen) {
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
      // Obtener assets de tipo vehículo del backend
      const assets = await assetsApi.getAll({ asset_type: 'vehicle' });
      // Convertir assets a vehicles
      return assets.map(assetToVehicle);
    } catch (error) {
      console.error('Error fetching vehicles from backend:', error);
      return [];
    }
  },

  getById: async (id: string): Promise<Vehicle | null> => {
    try {
      const asset = await assetsApi.getById(id);
      if (!asset) return null;
      return assetToVehicle(asset);
    } catch (error) {
      console.error('Error fetching vehicle:', error);
      return null;
    }
  },

  create: async (data: Partial<Vehicle>): Promise<Vehicle> => {
    // Crear como asset de tipo vehículo
    const assetData = {
      type: 'vehicle' as const,
      name: data.plate || 'Nuevo vehículo',
      client_id: data.clientId || '',
      plate: data.plate,
      status: 'active' as const,
    };
    const asset = await assetsApi.create(assetData);
    return assetToVehicle(asset);
  },

  update: async (id: string, data: Partial<Vehicle>): Promise<Vehicle> => {
    const assetData: any = {};
    if (data.plate) assetData.plate = data.plate;
    if (data.status) assetData.status = data.status === 'offline' ? 'inactive' : 'active';

    const asset = await assetsApi.update(id, assetData);
    return assetToVehicle(asset);
  },

  delete: async (id: string): Promise<void> => {
    await assetsApi.delete(id);
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
