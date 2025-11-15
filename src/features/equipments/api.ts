import apiClient from "../../lib/apiClient";
import type { Equipment } from "../../lib/types";

export const equipmentsApi = {
  getAll: async () => {
    const res = await apiClient.get("/equipments");
    return res.data;
  },

  getById: async (id: string) => {
    const res = await apiClient.get(`/equipments/${id}`);
    return res.data;
  },

  create: async (data: any) => {
    console.log("📤 Enviando al backend:", data);
    const res = await apiClient.post("/equipments", data);
    console.log("📥 Respuesta backend:", res.data);
    return res.data;
  },

  update: async (id: string, data: any) => {
    const res = await apiClient.put(`/equipments/${id}`, data);
    return res.data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/equipments/${id}`);
  }
};
