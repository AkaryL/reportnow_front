import type { Notification } from '../../lib/types';
import { mockNotifications, getNotificationsByClient } from '../../data/mockData';
import { LS_USER_KEY } from '../../lib/constants';

// Función auxiliar para simular delay de red
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Copia mutable de notificaciones
let notifications = [...mockNotifications];

export const notificationsApi = {
  getAll: async (): Promise<Notification[]> => {
    await delay(150);

    // Obtener el usuario actual del localStorage
    const userStr = localStorage.getItem(LS_USER_KEY);
    if (!userStr) {
      return [...notifications];
    }

    try {
      const user = JSON.parse(userStr);

      // Si es cliente, filtrar notificaciones solo de sus vehículos
      if (user.role === 'client' && user.client_id) {
        const clientNotifications = getNotificationsByClient(user.client_id);
        // Filtrar de las notificaciones mutables solo las que pertenecen al cliente
        return notifications.filter(n =>
          clientNotifications.some(cn => cn.id === n.id)
        );
      }

      // Admin y superuser ven todas las notificaciones
      return [...notifications];
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
      return [...notifications];
    }
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
