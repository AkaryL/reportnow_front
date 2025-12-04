import apiClient from "../../lib/apiClient";
import type { SIM } from "../../lib/types";

export const simsApi = {
  
  // Obtener todas las SIMs
  getAll: async (): Promise<SIM[]> => {
    const response = await apiClient.get("/sims");
    return response.data;
  },

  // Obtener SIM por ID
  getById: async (id: string): Promise<SIM> => {
    const response = await apiClient.get(`/sims/${id}`);
    return response.data;
  },

  // Crear nueva SIM
  create: async (data: {
    iccid: string;
    phone_number: string;
    carrier: string;
    company?: string;
    data_limit_mb?: number;
    activation_date?: string;
  }): Promise<SIM> => {
    const response = await apiClient.post("/sims", data);
    return response.data;
  },

  // Actualizar SIM
  update: async (id: string, data: Partial<SIM>): Promise<SIM> => {
    const response = await apiClient.put(`/sims/${id}`, data);
    return response.data;
  },

  // Eliminar SIM
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/sims/${id}`);
  },

  // Asignar SIM a un equipo
  assignToEquipment: async (simId: string, equipmentId: string) => {
    const response = await apiClient.post(`/sims/${simId}/assign-equipment/${equipmentId}`);
    return response.data;
  },

  // Desasignar SIM de un equipo
  unassignFromEquipment: async (simId: string) => {
    const response = await apiClient.post(`/sims/${simId}/unassign-equipment`);
    return response.data;
  },
};
