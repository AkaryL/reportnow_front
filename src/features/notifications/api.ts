import type { Notification } from '../../lib/types';
import { mockNotifications } from '../../data/mockData';

// Función auxiliar para simular delay de red
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Copia mutable de notificaciones
let notifications = [...mockNotifications];

export const notificationsApi = {
  getAll: async (): Promise<Notification[]> => {
    await delay(150);
    return [...notifications];
  },

  markAsRead: async (id: string): Promise<void> => {
    await delay(100);

    const index = notifications.findIndex(n => n.id === id);
    if (index !== -1) {
      notifications[index] = {
        ...notifications[index],
        read: true,
      };
    }
  },

  markAllAsRead: async (): Promise<void> => {
    await delay(150);

    notifications = notifications.map(n => ({
      ...n,
      read: true,
    }));
  },
};
