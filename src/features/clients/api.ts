import type { Client, Vehicle, Geofence, User } from '../../lib/types';
import {
  mockClients,
  getVehiclesByClient,
  getGeofencesByClient
} from '../../data/mockData';
import { activityLogsApi } from '../users/api';
import { LS_USER_KEY } from '../../lib/constants';

// Función auxiliar para simular delay de red
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper para obtener el usuario actual
const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem(LS_USER_KEY);
  return userStr ? JSON.parse(userStr) : null;
};

// Copia mutable de clientes para permitir operaciones CRUD
let clients = [...mockClients];

export const clientsApi = {
  getAll: async (): Promise<Client[]> => {
    await delay(200);
    return [...clients];
  },

  getById: async (id: string): Promise<Client | null> => {
    await delay(150);
    const client = clients.find(c => c.id === id);
    return client ? { ...client } : null;
  },

  create: async (data: any): Promise<Client> => {
    await delay(300);

    const newClient: Client = {
      id: `c${Date.now()}`,
      name: data.name,
      email: data.email,
      phone: data.phone,
      whatsapp: data.whatsapp,
      vehicles: 0,
      lastActivity: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    clients.push(newClient);

    // Registrar actividad
    const user = getCurrentUser();
    if (user && (user.role === 'admin' || user.role === 'superuser')) {
      await activityLogsApi.create({
        user_id: user.id,
        user_name: user.name,
        user_role: user.role,
        activity_type: 'create_client',
        description: `Creó el cliente "${newClient.name}"`,
        target_type: 'client',
        target_id: newClient.id,
        target_name: newClient.name,
        metadata: { client_phone: newClient.phone },
      });
    }

    return { ...newClient };
  },

  update: async (id: string, data: any): Promise<Client> => {
    await delay(250);

    const index = clients.findIndex(c => c.id === id);
    if (index === -1) {
      throw new Error('Cliente no encontrado');
    }

    const oldClient = { ...clients[index] };

    clients[index] = {
      ...clients[index],
      ...data,
      id, // Asegurar que el ID no cambie
    };

    // Registrar actividad
    const user = getCurrentUser();
    if (user && (user.role === 'admin' || user.role === 'superuser')) {
      const updatedFields = Object.keys(data).filter(key => data[key] !== oldClient[key as keyof Client]);
      await activityLogsApi.create({
        user_id: user.id,
        user_name: user.name,
        user_role: user.role,
        activity_type: 'update_client',
        description: `Actualizó la información de "${clients[index].name}"`,
        target_type: 'client',
        target_id: clients[index].id,
        target_name: clients[index].name,
        metadata: { updated_fields: updatedFields },
      });
    }

    return { ...clients[index] };
  },

  delete: async (id: string): Promise<void> => {
    await delay(200);

    const client = clients.find(c => c.id === id);

    clients = clients.filter(c => c.id !== id);

    // Registrar actividad
    const user = getCurrentUser();
    if (user && client && (user.role === 'admin' || user.role === 'superuser')) {
      await activityLogsApi.create({
        user_id: user.id,
        user_name: user.name,
        user_role: user.role,
        activity_type: 'delete_client',
        description: `Eliminó el cliente "${client.name}"`,
        target_type: 'client',
        target_id: client.id,
        target_name: client.name,
      });
    }
  },

  getVehicles: async (id: string): Promise<Vehicle[]> => {
    await delay(150);
    return getVehiclesByClient(id);
  },

  getGeofences: async (id: string): Promise<Geofence[]> => {
    await delay(150);
    return getGeofencesByClient(id);
  },

  sendAlert: async (id: string, message: string): Promise<any> => {
    await delay(300);

    const client = clients.find(c => c.id === id);

    // Registrar actividad
    const user = getCurrentUser();
    if (user && client && (user.role === 'admin' || user.role === 'superuser')) {
      await activityLogsApi.create({
        user_id: user.id,
        user_name: user.name,
        user_role: user.role,
        activity_type: 'send_notification',
        description: `Envió notificación de alerta a cliente "${client.name}"`,
        target_type: 'notification',
        target_id: `alert_${Date.now()}`,
        target_name: 'Alerta manual',
        metadata: { client_id: client.id, message },
      });
    }

    return {
      success: true,
      clientId: id,
      message: 'Alerta enviada (modo mock)',
      sentTo: client?.whatsapp || client?.phone,
      text: message,
    };
  },
};
