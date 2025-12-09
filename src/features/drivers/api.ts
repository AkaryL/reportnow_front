import type { Driver } from '../../lib/types';
import apiClient from '../../lib/apiClient';
import { LS_USER_KEY } from '../../lib/constants';

// Helper para obtener el usuario actual del localStorage
const getCurrentUser = () => {
  const userStr = localStorage.getItem(LS_USER_KEY);
  return userStr ? JSON.parse(userStr) : null;
};

export const driversApi = {
  // Obtener todos los conductores
  getAll: async (): Promise<Driver[]> => {
    try {
      const response = await apiClient.get<Driver[]>('/drivers');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || error.message || 'Error al obtener conductores');
    }
  },

  // Obtener conductor por ID
  getById: async (id: string): Promise<Driver | null> => {
    try {
      const response = await apiClient.get<Driver>(`/drivers/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw new Error(error.response?.data?.detail || error.message || 'Error al obtener conductor');
    }
  },

  // Obtener conductores disponibles
  getAvailable: async (): Promise<Driver[]> => {
    try {
      const allDrivers = await driversApi.getAll();
      return allDrivers.filter(d => d.status === 'available');
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || error.message || 'Error al obtener conductores disponibles');
    }
  },

  // Crear nuevo conductor
  create: async (data: {
    name: string;
    license_number: string;
    license_expiry: string;
    phone: string;
    email?: string;
    emergency_phone?: string;
    address?: string;
    client_id?: string;
    photo_url?: string;
    status?: Driver['status'];
  }): Promise<Driver> => {
    try {
      const user = getCurrentUser();

      // Determinar el client_id a usar
      let clientId = data.client_id;

      // Admin/operadores usan su propio client_id
      if ((user?.role === 'admin' || user?.role === 'operator_admin') && user?.client_id) {
        clientId = user.client_id;
      }

      // Validar que tengamos un client_id
      if (!clientId) {
        throw new Error('No está conectado a un cliente. Por favor, vuelva a iniciar sesión.');
      }

      const payload = {
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        license_number: data.license_number,
        license_expiry: data.license_expiry,
        status: data.status || 'available',
        emergency_phone: data.emergency_phone || null,
        address: data.address || null,
        client_id: clientId,
      };

      const response = await apiClient.post<Driver>('/drivers', payload);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || error.message || 'Error al crear conductor');
    }
  },

  // Actualizar conductor
  update: async (id: string, data: Partial<Driver>): Promise<Driver> => {
    try {
      const user = getCurrentUser();

      // Determinar el client_id a usar
      let clientId = data.client_id;

      // Admin/operadores usan su propio client_id
      if ((user?.role === 'admin' || user?.role === 'operator_admin') && user?.client_id) {
        clientId = user.client_id;
      }

      const payload = {
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        license_number: data.license_number,
        license_expiry: data.license_expiry,
        status: data.status,
        emergency_phone: data.emergency_phone || null,
        address: data.address || null,
        client_id: clientId,
      };

      const response = await apiClient.put<Driver>(`/drivers/${id}`, payload);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || error.message || 'Error al actualizar conductor');
    }
  },

  // Eliminar conductor
  delete: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/drivers/${id}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || error.message || 'Error al eliminar conductor');
    }
  },

  // Asignar conductor a vehículo (cambiar estado a on_trip)
  assignToVehicle: async (driverId: string): Promise<Driver> => {
    try {
      const driver = await driversApi.getById(driverId);
      if (!driver) {
        throw new Error('Conductor no encontrado');
      }
      return await driversApi.update(driverId, { ...driver, status: 'on_trip' });
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || error.message || 'Error al asignar conductor');
    }
  },

  // Liberar conductor (cambiar estado a available)
  releaseFromVehicle: async (driverId: string): Promise<Driver> => {
    try {
      const driver = await driversApi.getById(driverId);
      if (!driver) {
        throw new Error('Conductor no encontrado');
      }
      return await driversApi.update(driverId, { ...driver, status: 'available' });
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || error.message || 'Error al liberar conductor');
    }
  },
};
