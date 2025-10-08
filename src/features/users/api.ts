import { apiClient } from '../../lib/apiClient';
import type { User } from '../../lib/types';

export interface UserWithVehicles extends User {
  vehicles?: any[];
  assigned_vehicles?: number;
}

export const usersApi = {
  getAll: async (): Promise<UserWithVehicles[]> => {
    const response = await apiClient.get<any[]>('/api/users');
    return response.data;
  },

  getById: async (id: string): Promise<UserWithVehicles | null> => {
    try {
      const response = await apiClient.get<any>(`/api/users/${id}`);
      return response.data;
    } catch {
      return null;
    }
  },

  create: async (data: {
    username: string;
    password: string;
    name: string;
    role: 'superuser' | 'admin' | 'client';
    email?: string;
    client_id?: string;
    vehicle_ids?: string[];
  }): Promise<User> => {
    const response = await apiClient.post<any>('/api/users', data);
    return response.data;
  },

  update: async (id: string, data: {
    username?: string;
    password?: string;
    name?: string;
    role?: 'superuser' | 'admin' | 'client';
    email?: string;
    client_id?: string;
    vehicle_ids?: string[];
  }): Promise<User> => {
    const response = await apiClient.put<any>(`/api/users/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/users/${id}`);
  },

  getUserVehicles: async (id: string): Promise<any[]> => {
    const response = await apiClient.get<any[]>(`/api/users/${id}/vehicles`);
    return response.data;
  },

  assignVehicle: async (userId: string, vehicleId: string): Promise<void> => {
    await apiClient.post(`/api/users/${userId}/vehicles`, { vehicle_id: vehicleId });
  },

  unassignVehicle: async (userId: string, vehicleId: string): Promise<void> => {
    await apiClient.delete(`/api/users/${userId}/vehicles/${vehicleId}`);
  },
};
