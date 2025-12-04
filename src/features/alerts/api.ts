import apiClient from "../../lib/apiClient";
import type { Alert } from "../../lib/types";

export const alertsApi = {
  // Obtener todas las alertas (filtradas por permisos del usuario)
  getAll: async (clientId?: string): Promise<Alert[]> => {
    const params = clientId ? { client_id: clientId } : {};
    const response = await apiClient.get("/alerts", { params });
    return response.data;
  },

  // Obtener alertas por equipo
  getByEquipment: async (equipmentId: string): Promise<Alert[]> => {
    const response = await apiClient.get(`/alerts/equipment/${equipmentId}`);
    return response.data;
  },

  // Obtener alertas por geocerca
  getByGeofence: async (geofenceId: string): Promise<Alert[]> => {
    const response = await apiClient.get(`/alerts/geofence/${geofenceId}`);
    return response.data;
  },
};
