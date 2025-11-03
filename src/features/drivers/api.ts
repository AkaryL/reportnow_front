import type { Driver } from '../../lib/types';
import { mockDrivers } from '../../data/mockData';
import { LS_USER_KEY } from '../../lib/constants';

// Función auxiliar para simular delay de red
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper para obtener el usuario actual
const getCurrentUser = () => {
  const userStr = localStorage.getItem(LS_USER_KEY);
  return userStr ? JSON.parse(userStr) : null;
};

// Copia mutable
let drivers = [...mockDrivers];

export const driversApi = {
  // Obtener todos los conductores (con filtro por cliente si aplica)
  getAll: async (): Promise<Driver[]> => {
    await delay(200);

    const user = getCurrentUser();

    // Si es admin, operator-admin o operator-monitor, filtrar por su cliente
    if ((user?.role === 'admin' || user?.role === 'operator-admin' || user?.role === 'operator-monitor') && user?.client_id) {
      return drivers.filter(d => d.client_id === user.client_id);
    }

    // Superuser ve todos los conductores
    return [...drivers];
  },

  // Obtener conductor por ID
  getById: async (id: string): Promise<Driver | null> => {
    await delay(150);

    const driver = drivers.find(d => d.id === id);
    if (!driver) return null;

    const user = getCurrentUser();

    // Verificar permisos
    if ((user?.role === 'admin' || user?.role === 'operator-admin' || user?.role === 'operator-monitor') && user?.client_id) {
      if (driver.client_id !== user.client_id) {
        return null;
      }
    }

    return driver;
  },

  // Obtener conductores por cliente (solo superuser)
  getByClientId: async (clientId: string): Promise<Driver[]> => {
    await delay(150);

    const user = getCurrentUser();
    if (user?.role !== 'superuser') {
      throw new Error('Solo superuser puede obtener conductores por cliente');
    }

    return drivers.filter(d => d.client_id === clientId);
  },

  // Obtener conductores disponibles (no asignados a vehículo)
  getAvailable: async (): Promise<Driver[]> => {
    await delay(150);

    const allDrivers = await driversApi.getAll();
    return allDrivers.filter(d => d.status === 'available');
  },

  // Crear nuevo conductor
  create: async (data: {
    name: string;
    license_number: string;
    license_expiry: string;
    phone: string;
    email?: string;
    emergency_phone?: string;
    address?: string;
    client_id: string;
    photo_url?: string;
    status?: Driver['status'];
  }): Promise<Driver> => {
    await delay(300);

    const user = getCurrentUser();

    // Operador monitor no puede crear
    if (user?.role === 'operator-monitor') {
      throw new Error('Operador monitor no tiene permisos de escritura');
    }

    // Admin/operadores solo pueden crear en su cliente
    if ((user?.role === 'admin' || user?.role === 'operator-admin') && user?.client_id) {
      if (data.client_id !== user.client_id) {
        throw new Error('No puede crear conductores para otro cliente');
      }
    }

    // Verificar que la licencia no exista
    if (drivers.some(d => d.license_number === data.license_number)) {
      throw new Error('Ya existe un conductor con ese número de licencia');
    }

    const newDriver: Driver = {
      id: `drv${Date.now()}`,
      name: data.name,
      license_number: data.license_number,
      license_expiry: data.license_expiry,
      phone: data.phone,
      email: data.email,
      emergency_phone: data.emergency_phone || '',
      address: data.address || '',
      client_id: data.client_id,
      photo_url: data.photo_url,
      status: data.status || 'available',
      created_at: new Date().toISOString(),
    };

    drivers.push(newDriver);
    return newDriver;
  },

  // Actualizar conductor
  update: async (id: string, data: Partial<Driver>): Promise<Driver> => {
    await delay(250);

    const index = drivers.findIndex(d => d.id === id);
    if (index === -1) {
      throw new Error('Conductor no encontrado');
    }

    const user = getCurrentUser();
    const driver = drivers[index];

    // Operador monitor no puede actualizar
    if (user?.role === 'operator-monitor') {
      throw new Error('Operador monitor no tiene permisos de escritura');
    }

    // Admin/operadores solo pueden actualizar conductores de su cliente
    if ((user?.role === 'admin' || user?.role === 'operator-admin') && user?.client_id) {
      if (driver.client_id !== user.client_id) {
        throw new Error('No tiene permiso para actualizar este conductor');
      }
    }

    // Si se cambia la licencia, verificar que no exista
    if (data.license_number && data.license_number !== driver.license_number) {
      if (drivers.some(d => d.license_number === data.license_number)) {
        throw new Error('Ya existe un conductor con ese número de licencia');
      }
    }

    drivers[index] = {
      ...drivers[index],
      ...data,
      id, // Asegurar que el ID no cambie
      updated_at: new Date().toISOString(),
    };

    return drivers[index];
  },

  // Eliminar conductor
  delete: async (id: string): Promise<void> => {
    await delay(200);

    const user = getCurrentUser();

    // Operador monitor no puede eliminar
    if (user?.role === 'operator-monitor') {
      throw new Error('Operador monitor no tiene permisos de escritura');
    }

    const driver = drivers.find(d => d.id === id);
    if (!driver) {
      throw new Error('Conductor no encontrado');
    }

    // Admin/operadores solo pueden eliminar conductores de su cliente
    if ((user?.role === 'admin' || user?.role === 'operator-admin') && user?.client_id) {
      if (driver.client_id !== user.client_id) {
        throw new Error('No tiene permiso para eliminar este conductor');
      }
    }

    // No se puede eliminar si está asignado (on_trip)
    if (driver.status === 'on_trip') {
      throw new Error('No se puede eliminar un conductor que está en viaje. Primero finalice el viaje.');
    }

    drivers = drivers.filter(d => d.id !== id);
  },

  // Asignar conductor a vehículo (cambiar estado)
  assignToVehicle: async (driverId: string): Promise<Driver> => {
    await delay(150);

    const index = drivers.findIndex(d => d.id === driverId);
    if (index === -1) {
      throw new Error('Conductor no encontrado');
    }

    const user = getCurrentUser();
    const driver = drivers[index];

    // Verificar permisos
    if ((user?.role === 'admin' || user?.role === 'operator-admin') && user?.client_id) {
      if (driver.client_id !== user.client_id) {
        throw new Error('No tiene permiso para asignar este conductor');
      }
    }

    if (driver.status === 'inactive') {
      throw new Error('No se puede asignar un conductor inactivo');
    }

    drivers[index] = {
      ...drivers[index],
      status: 'on_trip',
      updated_at: new Date().toISOString(),
    };

    return drivers[index];
  },

  // Liberar conductor (cambiar estado a disponible)
  releaseFromVehicle: async (driverId: string): Promise<Driver> => {
    await delay(150);

    const index = drivers.findIndex(d => d.id === driverId);
    if (index === -1) {
      throw new Error('Conductor no encontrado');
    }

    const user = getCurrentUser();
    const driver = drivers[index];

    // Verificar permisos
    if ((user?.role === 'admin' || user?.role === 'operator-admin') && user?.client_id) {
      if (driver.client_id !== user.client_id) {
        throw new Error('No tiene permiso para liberar este conductor');
      }
    }

    drivers[index] = {
      ...drivers[index],
      status: 'available',
      updated_at: new Date().toISOString(),
    };

    return drivers[index];
  },
};
