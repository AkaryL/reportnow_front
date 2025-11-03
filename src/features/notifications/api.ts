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

      // Si es admin, operator-admin o operator-monitor, filtrar notificaciones de su cliente
      if ((user.role === 'admin' || user.role === 'operator-admin' || user.role === 'operator-monitor') && user.client_id) {
        // Filtrar por client_id y por destinatarios
        return notifications.filter(n =>
          n.client_id === user.client_id &&
          (n.recipients.includes(user.id) || n.recipients.length === 0)
        );
      }

      // Superuser ve todas las notificaciones
      return [...notifications];
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
      return [...notifications];
    }
  },

  markAsRead: async (id: string): Promise<void> => {
    await delay(100);

    const userStr = localStorage.getItem(LS_USER_KEY);
    if (!userStr) return;

    const user = JSON.parse(userStr);

    const index = notifications.findIndex(n => n.id === id);
    if (index !== -1) {
      // Agregar el user.id a read_by si no está
      if (!notifications[index].read_by.includes(user.id)) {
        notifications[index] = {
          ...notifications[index],
          read_by: [...notifications[index].read_by, user.id],
        };
      }
    }
  },

  markAllAsRead: async (): Promise<void> => {
    await delay(150);

    const userStr = localStorage.getItem(LS_USER_KEY);
    if (!userStr) return;

    const user = JSON.parse(userStr);

    notifications = notifications.map(n => ({
      ...n,
      read_by: n.read_by.includes(user.id) ? n.read_by : [...n.read_by, user.id],
    }));
  },
};
