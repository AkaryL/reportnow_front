import { apiClient } from '../../lib/apiClient';
import type { Notification } from '../../lib/types';

export const notificationsApi = {
  getAll: async (): Promise<Notification[]> => {
    const response = await apiClient.get<any[]>('/api/notifications');
    return response.data.map((n) => ({
      id: n.id,
      vehiclePlate: n.vehicle_plate,
      type: n.type,
      text: n.text,
      read: n.read === 1,
      ts: n.ts,
    }));
  },

  markAsRead: async (id: string): Promise<void> => {
    await apiClient.put(`/api/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await apiClient.put('/api/notifications/read-all');
  },
};
