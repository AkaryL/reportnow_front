import apiClient from "../../lib/apiClient";

export interface SimulationPoint {
  lat: number;
  lon: number;
  speed_kph?: number;
}

export interface RouteSimulationCreate {
  imei: string;
  device_model?: string;
  start_time: string; // ISO datetime
  end_time: string; // ISO datetime
  min_speed_kph: number;
  max_speed_kph: number;
  points: SimulationPoint[];
}

export interface RouteSimulationResponse {
  message: string;
  points_created: number;
  imei: string;
  start_time: string;
  end_time: string;
}

export const routeSimulationApi = {
  createSimulation: async (data: RouteSimulationCreate): Promise<RouteSimulationResponse> => {
    const res = await apiClient.post("/vehicle-history/simulate", data);
    return res.data;
  }
};
