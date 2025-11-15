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
    console.log(data);
    console.log(" Enviando al backend (SIM):", data);

    const response = await apiClient.post("/sims", data);

    // console.log("Respuesta del backend (SIM):", response.data);
    // return response.data;
     return;
  },

  // Actualizar SIM
  update: async (id: string, data: Partial<SIM>): Promise<SIM> => {
    console.log(data);

    // const response = await apiClient.put(`/sims/${id}`, data);
    // return response.data;

     return;
  },

  // Eliminar SIM
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/sims/${id}`);
  },

  // Asignar SIM a un equipo
  assignToEquipment: async (simId: string, equipmentId: string) => {
    const response = await apiClient.post(`/sims/${simId}/assign`, {
      equipment_id: equipmentId,
    });
    return response.data;
  },

  // Desasignar SIM de un equipo
  unassignFromEquipment: async (simId: string) => {
    const response = await apiClient.post(`/sims/${simId}/unassign`);
    return response.data;
  },
};
