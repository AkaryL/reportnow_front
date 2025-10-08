import { apiClient } from '../../lib/apiClient';
import type { Client } from '../../lib/types';

export const clientsApi = {
  getAll: async (): Promise<Client[]> => {
    const response = await apiClient.get<any[]>('/api/clients');
    return response.data.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      vehicles: c.vehicles || 0,
      lastActivity: c.last_activity,
    }));
  },

  getById: async (id: string): Promise<Client | null> => {
    try {
      const response = await apiClient.get<any>(`/api/clients/${id}`);
      const c = response.data;
      return {
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        vehicles: c.vehicles || 0,
        lastActivity: c.last_activity,
      };
    } catch {
      return null;
    }
  },

  create: async (data: Omit<Client, 'id' | 'vehicles'>): Promise<Client> => {
    const response = await apiClient.post<any>('/api/clients', data);
    const c = response.data;
    return {
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      vehicles: 0,
      lastActivity: c.last_activity,
    };
  },

  update: async (id: string, data: Partial<Client>): Promise<Client> => {
    const response = await apiClient.put<any>(`/api/clients/${id}`, {
      name: data.name,
      email: data.email,
      phone: data.phone,
    });
    const c = response.data;
    return {
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      vehicles: c.vehicles || 0,
      lastActivity: c.last_activity,
    };
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/clients/${id}`);
  },
};
