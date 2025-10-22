import type { Vehicle, VehicleEvent, VehicleHistoryPoint } from '../../lib/types';
import {
  mockVehicles,
  generateVehicleHistory,
  getVehicleEvents
} from '../../data/mockData';

// Función auxiliar para simular delay de red
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Copia mutable de vehículos para permitir operaciones CRUD
let vehicles = [...mockVehicles];

export const vehiclesApi = {
  getAll: async (): Promise<Vehicle[]> => {
    await delay(200);
    return [...vehicles];
  },

  getById: async (id: string): Promise<Vehicle | null> => {
    await delay(150);
    const vehicle = vehicles.find(v => v.id === id);
    return vehicle ? { ...vehicle } : null;
  },

  create: async (data: Partial<Vehicle>): Promise<Vehicle> => {
    await delay(300);

    const newVehicle: Vehicle = {
      id: `v${Date.now()}`,
      plate: data.plate || '',
      driver: data.driver || '',
      status: data.status || 'offline',
      speed: data.speed || 0,
      lat: data.lat || 20.6897,
      lng: data.lng || -103.3918,
      lastSeenMin: 0,
      deviceId: data.deviceId,
      clientId: data.clientId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    vehicles.push(newVehicle);
    return { ...newVehicle };
  },

  update: async (id: string, data: Partial<Vehicle>): Promise<Vehicle> => {
    await delay(250);

    const index = vehicles.findIndex(v => v.id === id);
    if (index === -1) {
      throw new Error('Vehículo no encontrado');
    }

    vehicles[index] = {
      ...vehicles[index],
      ...data,
      id, // Asegurar que el ID no cambie
      updated_at: new Date().toISOString(),
    };

    return { ...vehicles[index] };
  },

  delete: async (id: string): Promise<void> => {
    await delay(200);
    vehicles = vehicles.filter(v => v.id !== id);
  },

  // History endpoints
  getHistoryDates: async (id: string): Promise<{ date: string; points: number }[]> => {
    await delay(150);

    const history = generateVehicleHistory(id);
    const dateGroups = new Map<string, number>();

    history.forEach(point => {
      const date = point.ts.split('T')[0];
      dateGroups.set(date, (dateGroups.get(date) || 0) + 1);
    });

    return Array.from(dateGroups.entries())
      .map(([date, points]) => ({ date, points }))
      .sort((a, b) => b.date.localeCompare(a.date));
  },

  getHistoryByDate: async (id: string, date: string): Promise<VehicleHistoryPoint[]> => {
    await delay(200);

    const history = generateVehicleHistory(id);
    return history.filter(point => point.ts.startsWith(date));
  },

  getHistory: async (
    id: string,
    params?: { from?: string; to?: string; limit?: number }
  ): Promise<VehicleHistoryPoint[]> => {
    await delay(200);

    let history = generateVehicleHistory(id);

    if (params?.from) {
      history = history.filter(point => point.ts >= params.from!);
    }
    if (params?.to) {
      history = history.filter(point => point.ts <= params.to!);
    }
    if (params?.limit) {
      history = history.slice(0, params.limit);
    }

    return history;
  },

  // Track endpoints (new system)
  getTrack: async (
    id: string,
    date: string
  ): Promise<{
    vehicleId: string;
    date: string;
    points: Array<{ ts: string; lat: number; lng: number; speedKmh: number }>
  }> => {
    await delay(200);

    const history = await vehiclesApi.getHistoryByDate(id, date);

    return {
      vehicleId: id,
      date,
      points: history.map(point => ({
        ts: point.ts,
        lat: point.lat,
        lng: point.lng,
        speedKmh: point.speed || 0,
      })),
    };
  },

  simulateTrack: async (id: string, params: { date: string; count?: number }): Promise<any> => {
    await delay(300);

    // En modo mock, simplemente retornamos éxito
    return {
      success: true,
      vehicleId: id,
      date: params.date,
      pointsGenerated: params.count || 100,
      message: 'Track simulado generado (modo mock)',
    };
  },

  getTrackDates: async (id: string): Promise<{ date: string; points: number }[]> => {
    // Reutilizar la misma lógica que getHistoryDates
    return vehiclesApi.getHistoryDates(id);
  },

  generateWeekTracks: async (id: string): Promise<any> => {
    await delay(500);

    return {
      success: true,
      vehicleId: id,
      daysGenerated: 7,
      message: 'Tracks de la semana generados (modo mock)',
    };
  },

  // Events endpoints
  getEvents: async (
    id: string,
    params?: { limit?: number; event_type?: string }
  ): Promise<VehicleEvent[]> => {
    await delay(150);

    let events = getVehicleEvents(id);

    if (params?.event_type) {
      events = events.filter(e => e.event_type === params.event_type);
    }

    if (params?.limit) {
      events = events.slice(0, params.limit);
    }

    return events;
  },
};
