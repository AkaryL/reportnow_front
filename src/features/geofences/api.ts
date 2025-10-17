import type { Geofence } from '../../lib/types';
import { mockGeofences } from '../../data/mockData';

// Función auxiliar para simular delay de red
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Copia mutable de geocercas
let geofences = [...mockGeofences];

export const geofencesApi = {
  getAll: async (): Promise<Geofence[]> => {
    await delay(150);
    return [...geofences];
  },

  create: async (data: Omit<Geofence, 'id'>): Promise<Geofence> => {
    await delay(250);

    const newGeofence: Geofence = {
      id: `g${Date.now()}`,
      ...data,
    };

    geofences.push(newGeofence);
    return { ...newGeofence };
  },

  delete: async (id: string): Promise<void> => {
    await delay(150);
    geofences = geofences.filter(g => g.id !== id);
  },
};
