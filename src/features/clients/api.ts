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
    const backendData: any = {
      contact_name: data.contact_name || data.name,
      company_name: data.company_name || data.name,
      contact_phone: data.contact_phone || data.phone,
      contact_position: data.contact_position || 'Gerente',
      email: data.email,
      password: data.password,
      authorized_phones: data.authorized_phones || [data.contact_phone || data.phone],
      authorized_emails: data.authorized_emails || [data.email],
      equipment_quota: data.equipment_quota ?? 0,
      status: data.status || 'activo',
      assigned_equipments: data.assigned_equipments || data.equipment_ids || [],
    };

    // Solo agregar campos opcionales si tienen valor
    if (data.whatsapp) backendData.whatsapp = data.whatsapp;
    if (data.rfc) backendData.rfc = data.rfc;
    if (data.address) backendData.address = data.address;
    if (data.city) backendData.city = data.city;
    if (data.state) backendData.state = data.state;
    if (data.postal_code || data.zip_code) backendData.postal_code = data.postal_code || data.zip_code;

    console.log('Datos enviados al backend:', backendData);
    try {
      const response = await apiClient.post<any>('/clients', backendData);
      console.log('Respuesta del backend:', response.data);
      return normalizeClient(response.data);
    } catch (error: any) {
      console.error('Error al crear cliente:', error);
      console.error('Detalles del error:', error.response?.data);
      throw error;
    }
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
    if (data.equipment_quota !== undefined) backendData.equipment_quota = data.equipment_quota;
    if (data.status) backendData.status = data.status;
    if (data.whatsapp) backendData.whatsapp = data.whatsapp;
    if (data.rfc) backendData.rfc = data.rfc;
    if (data.address) backendData.address = data.address;
    if (data.city) backendData.city = data.city;
    if (data.state) backendData.state = data.state;
    if (data.postal_code || data.zip_code) backendData.postal_code = data.postal_code || data.zip_code;
    if (data.password) backendData.password = data.password;
    if (data.assigned_equipments || data.equipment_ids) {
      backendData.assigned_equipments = data.assigned_equipments || data.equipment_ids;
    }

    const response = await apiClient.put<any>(`/clients/${id}`, backendData);
    return normalizeClient(response.data);
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/clients/${id}`);
  },
};
