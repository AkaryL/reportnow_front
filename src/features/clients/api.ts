import type { Client, Vehicle, Geofence } from '../../lib/types';
import apiClient from '../../lib/apiClient';

// Normalizar cliente del backend para el frontend
const normalizeClient = (client: any): Client => {
  return {
    ...client,
    // Aliases para mantener compatibilidad con código existente
    name: client.company_name || client.name,
    phone: client.contact_phone || client.phone,
  };
};

export const clientsApi = {
  getAll: async (): Promise<Client[]> => {
    const response = await apiClient.get<any[]>('/clients');
    return response.data.map(normalizeClient);
  },

  getById: async (id: string): Promise<Client | null> => {
    try {
      const response = await apiClient.get<any>(`/clients/${id}`);
      return normalizeClient(response.data);
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  create: async (data: any): Promise<Client> => {
    // Transformar datos del frontend al formato del backend
    const backendData = {
      contact_name: data.contact_name || data.name,
      company_name: data.company_name || data.name,
      contact_phone: data.contact_phone || data.phone,
      contact_position: data.contact_position || 'Gerente',
      email: data.email,
      authorized_phones: data.authorized_phones || [data.contact_phone || data.phone],
      authorized_emails: data.authorized_emails || [data.email],
      equipment_quota: data.equipment_quota || 5,
      status: data.status || 'active',
    };
    const response = await apiClient.post<any>('/clients', backendData);
    return normalizeClient(response.data);
  },

  update: async (id: string, data: any): Promise<Client> => {
    // Transformar datos del frontend al formato del backend
    const backendData: any = {};
    if (data.name) {
      backendData.company_name = data.name;
      backendData.contact_name = data.name;
    }
    if (data.company_name) backendData.company_name = data.company_name;
    if (data.contact_name) backendData.contact_name = data.contact_name;
    if (data.phone) backendData.contact_phone = data.phone;
    if (data.contact_phone) backendData.contact_phone = data.contact_phone;
    if (data.email) backendData.email = data.email;
    if (data.contact_position) backendData.contact_position = data.contact_position;
    if (data.authorized_phones) backendData.authorized_phones = data.authorized_phones;
    if (data.authorized_emails) backendData.authorized_emails = data.authorized_emails;
    if (data.equipment_quota) backendData.equipment_quota = data.equipment_quota;
    if (data.status) backendData.status = data.status;

    const response = await apiClient.put<any>(`/clients/${id}`, backendData);
    return normalizeClient(response.data);
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/clients/${id}`);
  },
};
