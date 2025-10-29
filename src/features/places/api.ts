import type { Place } from '../../lib/types';
import { mockPlaces } from '../../data/mockData';
import { LS_USER_KEY } from '../../lib/constants';

// Función auxiliar para simular delay de red
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper para obtener el usuario actual
const getCurrentUser = () => {
  const userStr = localStorage.getItem(LS_USER_KEY);
  return userStr ? JSON.parse(userStr) : null;
};

// Copia mutable
let places = [...mockPlaces];

export const placesApi = {
  // Obtener todos los lugares (con filtro por cliente si aplica)
  getAll: async (): Promise<Place[]> => {
    await delay(200);

    const user = getCurrentUser();

    // Si es admin, operator-admin o operator-monitor, filtrar por su tenant + globales
    if ((user?.role === 'admin' || user?.role === 'operator-admin' || user?.role === 'operator-monitor') && user?.client_id) {
      return places.filter(p => p.is_global || p.client_id === user.client_id);
    }

    // Superuser ve todos los lugares
    return [...places];
  },

  // Obtener lugar por ID
  getById: async (id: string): Promise<Place | null> => {
    await delay(150);

    const place = places.find(p => p.id === id);
    if (!place) return null;

    const user = getCurrentUser();

    // Verificar permisos
    if ((user?.role === 'admin' || user?.role === 'operator-admin' || user?.role === 'operator-monitor') && user?.client_id) {
      if (!place.is_global && place.client_id !== user.client_id) {
        return null;
      }
    }

    return place;
  },

  // Obtener lugares por cliente (solo superuser)
  getByClientId: async (clientId: string): Promise<Place[]> => {
    await delay(150);

    const user = getCurrentUser();
    if (user?.role !== 'superuser') {
      throw new Error('Solo superuser puede obtener lugares por cliente');
    }

    return places.filter(p => p.client_id === clientId);
  },

  // Obtener lugares globales
  getGlobal: async (): Promise<Place[]> => {
    await delay(150);

    return places.filter(p => p.is_global);
  },

  // Crear nuevo lugar
  create: async (data: {
    name: string;
    lat: number;
    lng: number;
    radius: number;
    color: string;
    icon?: string;
    event_type: 'entry' | 'exit' | 'both';
    client_id?: string;
    is_global?: boolean;
  }): Promise<Place> => {
    await delay(300);

    const user = getCurrentUser();

    // Operador monitor no puede crear
    if (user?.role === 'operator-monitor') {
      throw new Error('Operador monitor no tiene permisos de escritura');
    }

    // Solo superuser puede crear lugares globales
    if (data.is_global && user?.role !== 'superuser') {
      throw new Error('Solo superuser puede crear lugares globales');
    }

    // Admin/operadores solo pueden crear en su tenant
    if ((user?.role === 'admin' || user?.role === 'operator-admin') && user?.client_id) {
      data.client_id = user.client_id;
      data.is_global = false;
    }

    // Validar icono (debe ser uno de los 8 disponibles)
    const validIcons = ['home', 'office', 'warehouse', 'factory', 'store', 'gas-station', 'parking', 'other'];
    if (data.icon && !validIcons.includes(data.icon)) {
      throw new Error(`Icono inválido. Debe ser uno de: ${validIcons.join(', ')}`);
    }

    const newPlace: Place = {
      id: `plc${Date.now()}`,
      name: data.name,
      lat: data.lat,
      lng: data.lng,
      radius: data.radius, // Radio invisible para cálculos
      color: data.color,
      icon: data.icon,
      event_type: data.event_type,
      client_id: data.client_id,
      is_global: data.is_global || false,
      status: 'active',
      created_at: new Date().toISOString(),
    };

    places.push(newPlace);
    return newPlace;
  },

  // Actualizar lugar
  update: async (id: string, data: Partial<Place>): Promise<Place> => {
    await delay(250);

    const index = places.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error('Lugar no encontrado');
    }

    const user = getCurrentUser();
    const place = places[index];

    // Operador monitor no puede actualizar
    if (user?.role === 'operator-monitor') {
      throw new Error('Operador monitor no tiene permisos de escritura');
    }

    // Solo superuser puede actualizar lugares globales
    if (place.is_global && user?.role !== 'superuser') {
      throw new Error('Solo superuser puede actualizar lugares globales');
    }

    // Admin/operadores solo pueden actualizar lugares de su tenant
    if ((user?.role === 'admin' || user?.role === 'operator-admin') && user?.client_id) {
      if (!place.is_global && place.client_id !== user.client_id) {
        throw new Error('No tiene permiso para actualizar este lugar');
      }
    }

    // Admin/operadores no pueden hacer global un lugar
    if (data.is_global && user?.role !== 'superuser') {
      delete data.is_global;
    }

    // Validar icono si se proporciona
    if (data.icon) {
      const validIcons = ['home', 'office', 'warehouse', 'factory', 'store', 'gas-station', 'parking', 'other'];
      if (!validIcons.includes(data.icon)) {
        throw new Error(`Icono inválido. Debe ser uno de: ${validIcons.join(', ')}`);
      }
    }

    places[index] = {
      ...places[index],
      ...data,
      id, // Asegurar que el ID no cambie
      updated_at: new Date().toISOString(),
    };

    return places[index];
  },

  // Eliminar lugar
  delete: async (id: string): Promise<void> => {
    await delay(200);

    const user = getCurrentUser();

    // Operador monitor no puede eliminar
    if (user?.role === 'operator-monitor') {
      throw new Error('Operador monitor no tiene permisos de escritura');
    }

    const place = places.find(p => p.id === id);
    if (!place) {
      throw new Error('Lugar no encontrado');
    }

    // Solo superuser puede eliminar lugares globales
    if (place.is_global && user?.role !== 'superuser') {
      throw new Error('Solo superuser puede eliminar lugares globales');
    }

    // Admin/operadores solo pueden eliminar lugares de su tenant
    if ((user?.role === 'admin' || user?.role === 'operator-admin') && user?.client_id) {
      if (!place.is_global && place.client_id !== user.client_id) {
        throw new Error('No tiene permiso para eliminar este lugar');
      }
    }

    places = places.filter(p => p.id !== id);
  },

  // Activar/Desactivar lugar (cambiar estado)
  toggleStatus: async (id: string): Promise<Place> => {
    await delay(150);

    const index = places.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error('Lugar no encontrado');
    }

    const user = getCurrentUser();
    const place = places[index];

    // Operador monitor no puede cambiar estado
    if (user?.role === 'operator-monitor') {
      throw new Error('Operador monitor no tiene permisos de escritura');
    }

    // Verificar permisos
    if (place.is_global && user?.role !== 'superuser') {
      throw new Error('Solo superuser puede cambiar el estado de lugares globales');
    }

    if ((user?.role === 'admin' || user?.role === 'operator-admin') && user?.client_id) {
      if (!place.is_global && place.client_id !== user.client_id) {
        throw new Error('No tiene permiso para cambiar el estado de este lugar');
      }
    }

    places[index] = {
      ...places[index],
      status: places[index].status === 'active' ? 'inactive' : 'active',
      updated_at: new Date().toISOString(),
    };

    return places[index];
  },

  // Verificar si una coordenada está dentro de un lugar
  isPointInPlace: (placeId: string, lat: number, lng: number): boolean => {
    const place = places.find(p => p.id === placeId);
    if (!place) return false;

    // Calcular distancia usando fórmula Haversine
    const R = 6371e3; // Radio de la Tierra en metros
    const φ1 = (place.lat * Math.PI) / 180;
    const φ2 = (lat * Math.PI) / 180;
    const Δφ = ((lat - place.lat) * Math.PI) / 180;
    const Δλ = ((lng - place.lng) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c; // Distancia en metros

    return distance <= place.radius;
  },

  // Obtener lugares cercanos a una coordenada
  getNearby: async (lat: number, lng: number, maxDistanceMeters: number = 5000): Promise<Place[]> => {
    await delay(150);

    const allPlaces = await placesApi.getAll();

    return allPlaces.filter((place) => {
      const R = 6371e3;
      const φ1 = (place.lat * Math.PI) / 180;
      const φ2 = (lat * Math.PI) / 180;
      const Δφ = ((lat - place.lat) * Math.PI) / 180;
      const Δλ = ((lng - place.lng) * Math.PI) / 180;

      const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      const distance = R * c;

      return distance <= maxDistanceMeters;
    });
  },
};
