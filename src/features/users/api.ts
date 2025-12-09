import type { User, ActivityLog } from '../../lib/types';
import apiClient from '../../lib/apiClient';

export interface UserWithVehicles extends User {
  vehicles?: any[];
  assigned_vehicles?: number;
}

export const usersApi = {
  getAll: async (): Promise<UserWithVehicles[]> => {
    const response = await apiClient.get<User[]>('/users');
    return response.data.map(user => ({
      ...user,
      assigned_vehicles: 0,
    }));
  },

  getById: async (id: string): Promise<UserWithVehicles | null> => {
    try {
      const response = await apiClient.get<User>(`/users/${id}`);
      return {
        ...response.data,
        assigned_vehicles: 0,
      };
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  create: async (data: {
    username: string;
    password: string;
    name: string;
    role: 'superuser' | 'admin' | 'operator_admin' | 'operator_monitor';
    email: string;
    phone?: string;
    client_id?: string;
  }): Promise<User> => {
    const response = await apiClient.post<User>('/users', data);
    return response.data;
  },

  update: async (id: string, data: {
    username?: string;
    password?: string;
    name?: string;
    role?: 'superuser' | 'admin' | 'operator_admin' | 'operator_monitor';
    email?: string;
    phone?: string;
    client_id?: string;
  }): Promise<User> => {
    const response = await apiClient.put<User>(`/users/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },

  // Obtener logs de actividad de un usuario
  getUserActivity: async (userId: string): Promise<ActivityLog[]> => {
    const response = await apiClient.get<ActivityLog[]>(`/users/${userId}/activity`);
    return response.data;
  },

  // Obtener solo usuarios admin (filtrado en frontend)
  getAdmins: async (): Promise<UserWithVehicles[]> => {
    const response = await apiClient.get<User[]>('/users');
    const admins = response.data.filter(u => u.role === 'admin' || u.role === 'superuser');
    return admins.map(user => ({
      ...user,
      assigned_vehicles: 0,
    }));
  },
};

// ==================== ACTIVITY LOGS API ====================
// NOTA: Los logs de actividad se obtienen a través de /users/{user_id}/activity
export const activityLogsApi = {
  // Obtener logs de actividad de un usuario específico
  getByUserId: async (userId: string): Promise<ActivityLog[]> => {
    const response = await apiClient.get<ActivityLog[]>(`/users/${userId}/activity`);
    return response.data;
  },
};
