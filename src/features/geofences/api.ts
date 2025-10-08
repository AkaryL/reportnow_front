import { apiClient } from '../../lib/apiClient';
import type { Geofence } from '../../lib/types';

export const geofencesApi = {
  getAll: async (): Promise<Geofence[]> => {
    const response = await apiClient.get<any[]>('/api/geofences');
    return response.data;
  },

  create: async (data: Omit<Geofence, 'id'>): Promise<Geofence> => {
    const response = await apiClient.post<any>('/api/geofences', data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/geofences/${id}`);
  },
};
