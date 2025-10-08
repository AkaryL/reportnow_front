import { apiClient } from '../../lib/apiClient';
import type { Vehicle } from '../../lib/types';

export const vehiclesApi = {
  getAll: async (): Promise<Vehicle[]> => {
    const response = await apiClient.get<any[]>('/api/vehicles');
    return response.data.map((v) => ({
      id: v.id,
      plate: v.plate,
      driver: v.driver,
      status: v.status,
      fuel: v.fuel,
      speed: v.speed || 0,
      temp: v.temp,
      lat: v.lat,
      lng: v.lng,
      lastSeenMin: v.last_seen_min || 0,
      deviceId: v.device_id,
      clientId: v.client_id,
    }));
  },

  getById: async (id: string): Promise<Vehicle | null> => {
    try {
      const response = await apiClient.get<any>(`/api/vehicles/${id}`);
      const v = response.data;
      return {
        id: v.id,
        plate: v.plate,
        driver: v.driver,
        status: v.status,
        fuel: v.fuel,
        speed: v.speed || 0,
        temp: v.temp,
        lat: v.lat,
        lng: v.lng,
        lastSeenMin: v.last_seen_min || 0,
        deviceId: v.device_id,
        clientId: v.client_id,
      };
    } catch {
      return null;
    }
  },

  create: async (data: Partial<Vehicle>): Promise<Vehicle> => {
    const response = await apiClient.post<any>('/api/vehicles', {
      plate: data.plate,
      driver: data.driver,
      status: data.status || 'offline',
      fuel: data.fuel || 0,
      speed: data.speed || 0,
      temp: data.temp,
      lat: data.lat,
      lng: data.lng,
      device_id: data.deviceId,
      client_id: data.clientId,
    });

    const v = response.data;
    return {
      id: v.id,
      plate: v.plate,
      driver: v.driver,
      status: v.status,
      fuel: v.fuel,
      speed: v.speed || 0,
      temp: v.temp,
      lat: v.lat,
      lng: v.lng,
      lastSeenMin: v.last_seen_min || 0,
      deviceId: v.device_id,
      clientId: v.client_id,
    };
  },

  update: async (id: string, data: Partial<Vehicle>): Promise<Vehicle> => {
    const response = await apiClient.put<any>(`/api/vehicles/${id}`, {
      plate: data.plate,
      driver: data.driver,
      status: data.status,
      fuel: data.fuel,
      speed: data.speed,
      temp: data.temp,
      lat: data.lat,
      lng: data.lng,
      device_id: data.deviceId,
      client_id: data.clientId,
    });

    const v = response.data;
    return {
      id: v.id,
      plate: v.plate,
      driver: v.driver,
      status: v.status,
      fuel: v.fuel,
      speed: v.speed || 0,
      temp: v.temp,
      lat: v.lat,
      lng: v.lng,
      lastSeenMin: v.last_seen_min || 0,
      deviceId: v.device_id,
      clientId: v.client_id,
    };
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/vehicles/${id}`);
  },
};
