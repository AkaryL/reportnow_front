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
  course_deg: number | null;
  status: 'engine_on' | 'moving' | 'stopped' | 'engine_off' | null;
  // Referencias al estado del equipo en el momento del registro
  equipment_id: string | null;
  client_id: string | null;
  asset_id: string | null;
  sim_id: string | null;
  // Geocercas en las que estaba el punto
  geofences_in: string[] | null;
}

export interface RouteStatsItem {
  inicio: string;
  fin: string;
  tiempo_total_seg: number;
  tiempo_total_horas: number;
  km_recorridos: number;
  velocidad_promedio: number;
  velocidad_maxima: number;
  tiempo_marcha_horas: number;
  tiempo_ralenti_horas: number;
  puntos: number;
  ruta: number;
}

export interface RouteStatsResponse {
  imei: string;
  total_rutas: number;
  rutas: RouteStatsItem[];
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
  // Referencias al estado del equipo en el momento del registro
  equipment_id: string | null;
  client_id: string | null;
  asset_id: string | null;
  sim_id: string | null;
  // Geocercas en las que estaba el punto
  geofences_in: string[] | null;
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

  // Obtener estadísticas de rutas de un vehículo
  getRouteStats: async (
    imei: string,
    params?: {
      start_date?: string;
      end_date?: string;
    }
  ): Promise<RouteStatsResponse> => {
    const response = await apiClient.get<RouteStatsResponse>(
      `/vehicles/stats/routes`,
      { params: { imei, ...params } }
    );
    return response.data;
  },
};
