import apiClient from '../../lib/apiClient';

export interface AlertType {
  id: string;
  code: string;
  name: string;
  description: string | null;
  equipment_type: string | null;
  is_active: boolean;
}

export interface NotificationSetting {
  id: string;
  alert_type_id: string;
  channel: 'sms' | 'email' | 'whatsapp';
  enabled: boolean;
}

export interface NotificationSettingCreate {
  alert_type_id: string;
  channel: 'sms' | 'email' | 'whatsapp';
  enabled: boolean;
}

export interface ClientConfig {
  speed_limit: number;
  route_interval: number;
}

export interface ClientConfigUpdate {
  speed_limit?: number;
  route_interval?: number;
}

export const settingsApi = {
  // Obtener todos los tipos de alerta
  getAlertTypes: async (): Promise<AlertType[]> => {
    const response = await apiClient.get<AlertType[]>('/settings/alert-types');
    return response.data;
  },

  // Obtener configuración de notificaciones del usuario actual
  getNotificationSettings: async (): Promise<NotificationSetting[]> => {
    const response = await apiClient.get<NotificationSetting[]>('/settings/notification-settings');
    return response.data;
  },

  // Guardar una configuración individual
  saveNotificationSetting: async (data: NotificationSettingCreate): Promise<{ ok: boolean }> => {
    const response = await apiClient.post<{ ok: boolean }>('/settings/notification-settings', data);
    return response.data;
  },

  // Guardar múltiples configuraciones de una vez
  saveNotificationSettingsBulk: async (settings: NotificationSettingCreate[]): Promise<{ ok: boolean; count: number }> => {
    const response = await apiClient.post<{ ok: boolean; count: number }>('/settings/notification-settings/bulk', {
      settings
    });
    return response.data;
  },

  // Obtener configuración del cliente
  getClientConfig: async (): Promise<ClientConfig> => {
    const response = await apiClient.get<ClientConfig>('/settings/client-config');
    return response.data;
  },

  // Actualizar configuración del cliente
  updateClientConfig: async (data: ClientConfigUpdate): Promise<ClientConfig> => {
    const response = await apiClient.put<ClientConfig>('/settings/client-config', data);
    return response.data;
  },
};
