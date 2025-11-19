import type { Geofence } from '../../lib/types';
import  apiClient  from "../../lib/apiClient";

// Funcion auxiliar para simular delay de red (opcional)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const geofencesApi = {
  getAll: async (): Promise<Geofence[]> => {
    await delay(150);
    const response = await apiClient.get<Geofence[]>('/geofences');
    return response.data;
  },

  create: async (data: Omit<Geofence, 'id'>): Promise<Geofence> => {
    await delay(150);
    let newData = data;
    if(data.client_id === ''){
      console.log("No hay cliente xd");
      newData = {
        ...data,
        client_id: null
      }
    }
    console.log(" Enviando geocerca al backend:", newData);

    const response = await apiClient.post<Geofence>('/geofences', newData);

    console.log(" Respuesta del backend:", response.data);

    return response.data;
  },

  update: async (id: string, data: Partial<Omit<Geofence, 'id'>>): Promise<Geofence> => {
    await delay(150);

    console.log(` Actualizando geocerca ${id} con:`, data);

    const response = await apiClient.put<Geofence>(`/geofences/${id}`, data);

    console.log(" Respuesta del backend:", response.data);

    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await delay(150);

    console.log(` Eliminando geocerca ${id}`);

    await apiClient.delete(`/geofences/${id}`);

    console.log(" Eliminado del backend");
  }
};
