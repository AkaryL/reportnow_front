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

  update: async (id: string, data: Partial<Omit<Geofence, 'id'>>): Promise<Geofence> => {
    await delay(250);

    const index = geofences.findIndex(g => g.id === id);
    if (index === -1) {
      throw new Error('Geocerca no encontrada');
    }

    geofences[index] = {
      ...geofences[index],
      ...data,
      updated_at: new Date().toISOString(),
    };

    return { ...geofences[index] };
  },

  delete: async (id: string): Promise<void> => {
    await delay(150);
    geofences = geofences.filter(g => g.id !== id);
  },
};
