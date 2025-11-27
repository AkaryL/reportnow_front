import apiClient from "../../lib/apiClient";
import type { Equipment } from "../../lib/types";

export const equipmentsApi = {
  getAll: async () => {
    const res = await apiClient.get("/equipment");
    return res.data;
  },

  getById: async (id: string) => {
    const res = await apiClient.get(`/equipment/${id}`);
    return res.data;
  },

  create: async (data: any) => {
    console.log(" Enviando al backend:", data);
    const res = await apiClient.post("/equipment", data);
    console.log(" Respuesta backend:", res.data);
    return res.data;
  },

  update: async (id: string, data: any) => {
    const res = await apiClient.put(`/equipment/${id}`, data);
    return res.data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/equipment/${id}`);
  },

  assignToClient: async (equipmentId: string, clientId: string) => {
    const res = await apiClient.post(`/equipment/${equipmentId}/assign-client/${clientId}`);
    return res.data;
  },

  unassignFromClient: async (equipmentId: string) => {
    const res = await apiClient.post(`/equipment/${equipmentId}/unassign-client`);
    return res.data;
  }
};
