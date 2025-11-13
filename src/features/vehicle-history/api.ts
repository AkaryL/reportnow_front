import apiClient from '../../lib/apiClient';

export interface IMEIItem {
  imei: string;
  device_model: string | null;
  last_seen: string;
  total_points: number;
}

export interface RoutePoint {
  lat: number | null;
  lon: number | null;
  speed_kph: number | null;
  recv_time: string;
  fix_time: string;
  ignition: boolean | null;
  satellites: number | null;
}

export interface VehicleHistoryPoint {
  id: number;
  imei: string;
  device_model: string | null;
  recv_time: string;
  fix_time: string;
  lat: number | null;
  lon: number | null;
  altitude_m: number | null;
  speed_kph: number | null;
  course_deg: number | null;
  satellites: number | null;
  hdop: number | null;
  ignition: boolean | null;
  battery_v: number | null;
  signal_level: number | null;
  odometer_m: number | null;
  status: string | null;
  raw_hex: string | null;
  extras: Record<string, any> | null;
}

export const vehicleHistoryApi = {
  // Obtener lista de IMEIs disponibles
  getIMEIs: async (): Promise<IMEIItem[]> => {
    const response = await apiClient.get<IMEIItem[]>('/vehicle-history/imeis');
    return response.data;
  },

  // Obtener puntos de ruta para un IMEI específico
  getRoutes: async (
    imei: string,
    params?: {
      days?: number;
      start_date?: string;
      end_date?: string;
    }
  ): Promise<RoutePoint[]> => {
    const response = await apiClient.get<RoutePoint[]>(
      `/vehicle-history/routes/${imei}`,
      { params }
    );
    return response.data;
  },

  // Obtener historial completo de un IMEI
  getFullHistory: async (
    imei: string,
    params?: {
      days?: number;
      start_date?: string;
      end_date?: string;
      limit?: number;
    }
  ): Promise<VehicleHistoryPoint[]> => {
    const response = await apiClient.get<VehicleHistoryPoint[]>(
      `/vehicle-history/history/${imei}`,
      { params }
    );
    return response.data;
  },
};
