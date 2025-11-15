import type { Asset, VehicleAsset, CargoAsset, ContainerAsset, PersonAsset, OtherAsset, AssetType } from '../../lib/types';
import apiClient from '../../lib/apiClient';

export const assetsApi = {
  // Obtener todos los activos
  getAll: async (params?: {
    client_id?: string;
    asset_type?: string;
    status?: string;
  }): Promise<Asset[]> => {
    const response = await apiClient.get<Asset[]>('/assets', { params });
    return response.data;
  },

  // Obtener activo por ID
  getById: async (id: string): Promise<Asset | null> => {
    try {
      const response = await apiClient.get<Asset>(`/assets/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  // Obtener activos por tipo
  getByType: async (assetType: string): Promise<Asset[]> => {
    const response = await apiClient.get<Asset[]>(`/assets/type/${assetType}`);
    return response.data;
  },

  // Obtener activos por cliente
  getByClient: async (clientId: string): Promise<Asset[]> => {
    return assetsApi.getAll({ client_id: clientId });
  },

  // Contar activos por cliente
  countByClient: async (clientId: string): Promise<number> => {
    const response = await apiClient.get<{ count: number }>(`/assets/client/${clientId}/count`);
    return response.data.count;
  },

  // Crear activo
  create: async (data: Partial<Asset>): Promise<Asset> => {
    console.log(data);
    
    const response = await apiClient.post<Asset>('/assets', data);
    return response.data;
    // return;
  },

  // Actualizar activo
  update: async (id: string, data: Partial<Asset>): Promise<Asset> => {
    const response = await apiClient.put<Asset>(`/assets/${id}`, data);
    return response.data;
  },

   
  // Eliminar activo
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/assets/${id}`);
  },
};
