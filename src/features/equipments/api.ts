import type { Equipment, EquipmentStatus } from '../../lib/types';
import { mockEquipments } from '../../data/mockData';
import { LS_USER_KEY } from '../../lib/constants';

// Función auxiliar para simular delay de red
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper para obtener el usuario actual
const getCurrentUser = () => {
  const userStr = localStorage.getItem(LS_USER_KEY);
  return userStr ? JSON.parse(userStr) : null;
};

// Copia mutable
let equipments = [...mockEquipments];

export const equipmentsApi = {
  // Obtener todos los equipos (con filtro por cliente si aplica)
  getAll: async (): Promise<Equipment[]> => {
    await delay(200);

    const user = getCurrentUser();

    // Si es admin, operator-admin o operator-monitor, filtrar por su tenant
    if ((user?.role === 'admin' || user?.role === 'operator-admin' || user?.role === 'operator-monitor') && user?.client_id) {
      return equipments.filter(e => e.client_id === user.client_id);
    }

    // Superuser ve todos los equipos
    return [...equipments];
  },

  // Obtener equipo por ID
  getById: async (id: string): Promise<Equipment | null> => {
    await delay(150);

    const equipment = equipments.find(e => e.id === id);
    if (!equipment) return null;

    const user = getCurrentUser();

    // Verificar permisos: admin/operadores solo ven equipos de su tenant
    if ((user?.role === 'admin' || user?.role === 'operator-admin' || user?.role === 'operator-monitor') && user?.client_id) {
      if (equipment.client_id !== user.client_id) {
        return null; // No tiene permiso
      }
    }

    return equipment;
  },

  // Obtener equipos por cliente (solo superuser)
  getByClientId: async (clientId: string): Promise<Equipment[]> => {
    await delay(150);

    const user = getCurrentUser();
    if (user?.role !== 'superuser') {
      throw new Error('Solo superuser puede obtener equipos por cliente');
    }

    return equipments.filter(e => e.client_id === clientId);
  },

  // Obtener equipos disponibles (sin asignar a cliente)
  getAvailable: async (): Promise<Equipment[]> => {
    await delay(150);

    const user = getCurrentUser();
    if (user?.role !== 'superuser') {
      throw new Error('Solo superuser puede ver equipos disponibles');
    }

    return equipments.filter(e => !e.client_id || e.status === 'available');
  },

  // Crear nuevo equipo (solo superuser)
  create: async (data: {
    imei: string;
    serial: string;
    brand: string;
    model: string;
    sim_id: string;
    client_id?: string;
    status?: EquipmentStatus;
  }): Promise<Equipment> => {
    await delay(300);

    const user = getCurrentUser();
    if (user?.role !== 'superuser') {
      throw new Error('Solo superuser puede crear equipos');
    }

    // Verificar que el IMEI no exista
    if (equipments.some(e => e.imei === data.imei)) {
      throw new Error('Ya existe un equipo con ese IMEI');
    }

    const newEquipment: Equipment = {
      id: `eq${Date.now()}`,
      imei: data.imei,
      serial: data.serial,
      brand: data.brand,
      model: data.model,
      sim_id: data.sim_id,
      client_id: data.client_id,
      asset_id: undefined,
      status: data.status || 'available',
      created_at: new Date().toISOString(),
    };

    equipments.push(newEquipment);
    return newEquipment;
  },

  // Actualizar equipo (superuser actualiza todo, admin/operator solo pueden actualizar su equipo asignado)
  update: async (id: string, data: Partial<Equipment>): Promise<Equipment> => {
    await delay(250);

    const index = equipments.findIndex(e => e.id === id);
    if (index === -1) {
      throw new Error('Equipo no encontrado');
    }

    const user = getCurrentUser();
    const equipment = equipments[index];

    // Admin/operadores solo pueden actualizar equipos de su tenant
    if ((user?.role === 'admin' || user?.role === 'operator-admin') && user?.client_id) {
      if (equipment.client_id !== user.client_id) {
        throw new Error('No tiene permiso para actualizar este equipo');
      }
      // Admin/operadores no pueden cambiar: imei, serial, brand, model, client_id
      const { imei, serial, brand, model, client_id, ...allowedData } = data;
      data = allowedData;
    }

    // Operador monitor no puede actualizar
    if (user?.role === 'operator-monitor') {
      throw new Error('Operador monitor no tiene permisos de escritura');
    }

    equipments[index] = {
      ...equipments[index],
      ...data,
      id, // Asegurar que el ID no cambie
      updated_at: new Date().toISOString(),
    };

    return equipments[index];
  },

  // Asignar equipo a cliente (solo superuser)
  assignToClient: async (equipmentId: string, clientId: string): Promise<Equipment> => {
    await delay(200);

    const user = getCurrentUser();
    if (user?.role !== 'superuser') {
      throw new Error('Solo superuser puede asignar equipos a clientes');
    }

    const index = equipments.findIndex(e => e.id === equipmentId);
    if (index === -1) {
      throw new Error('Equipo no encontrado');
    }

    equipments[index] = {
      ...equipments[index],
      client_id: clientId,
      status: 'inactive',
      updated_at: new Date().toISOString(),
    };

    return equipments[index];
  },

  // Desasignar equipo de cliente (solo superuser)
  unassignFromClient: async (equipmentId: string): Promise<Equipment> => {
    await delay(200);

    const user = getCurrentUser();
    if (user?.role !== 'superuser') {
      throw new Error('Solo superuser puede desasignar equipos');
    }

    const index = equipments.findIndex(e => e.id === equipmentId);
    if (index === -1) {
      throw new Error('Equipo no encontrado');
    }

    equipments[index] = {
      ...equipments[index],
      client_id: undefined,
      asset_id: undefined,
      status: 'available',
      updated_at: new Date().toISOString(),
    };

    return equipments[index];
  },

  // Asignar equipo a activo (admin o operator-admin)
  assignToAsset: async (equipmentId: string, assetId: string): Promise<Equipment> => {
    await delay(200);

    const index = equipments.findIndex(e => e.id === equipmentId);
    if (index === -1) {
      throw new Error('Equipo no encontrado');
    }

    const user = getCurrentUser();
    const equipment = equipments[index];

    // Solo admin y operator-admin pueden asignar a activo
    if (user?.role !== 'superuser' && user?.role !== 'admin' && user?.role !== 'operator-admin') {
      throw new Error('No tiene permisos para asignar equipos a activos');
    }

    // Admin/operadores solo pueden asignar equipos de su tenant
    if ((user?.role === 'admin' || user?.role === 'operator-admin') && user?.client_id) {
      if (equipment.client_id !== user.client_id) {
        throw new Error('No tiene permiso para asignar este equipo');
      }
    }

    equipments[index] = {
      ...equipments[index],
      asset_id: assetId,
      status: 'active',
      updated_at: new Date().toISOString(),
    };

    return equipments[index];
  },

  // Desasignar equipo de activo (admin o operator-admin)
  unassignFromAsset: async (equipmentId: string): Promise<Equipment> => {
    await delay(200);

    const index = equipments.findIndex(e => e.id === equipmentId);
    if (index === -1) {
      throw new Error('Equipo no encontrado');
    }

    const user = getCurrentUser();
    const equipment = equipments[index];

    // Solo admin y operator-admin pueden desasignar de activo
    if (user?.role !== 'superuser' && user?.role !== 'admin' && user?.role !== 'operator-admin') {
      throw new Error('No tiene permisos para desasignar equipos');
    }

    // Admin/operadores solo pueden desasignar equipos de su tenant
    if ((user?.role === 'admin' || user?.role === 'operator-admin') && user?.client_id) {
      if (equipment.client_id !== user.client_id) {
        throw new Error('No tiene permiso para desasignar este equipo');
      }
    }

    equipments[index] = {
      ...equipments[index],
      asset_id: undefined,
      status: 'inactive',
      updated_at: new Date().toISOString(),
    };

    return equipments[index];
  },

  // Eliminar equipo (solo superuser)
  delete: async (id: string): Promise<void> => {
    await delay(200);

    const user = getCurrentUser();
    if (user?.role !== 'superuser') {
      throw new Error('Solo superuser puede eliminar equipos');
    }

    const equipment = equipments.find(e => e.id === id);
    if (!equipment) {
      throw new Error('Equipo no encontrado');
    }

    // No se puede eliminar si está asignado a un activo
    if (equipment.asset_id) {
      throw new Error('No se puede eliminar un equipo asignado a un activo. Primero desasígnelo.');
    }

    equipments = equipments.filter(e => e.id !== id);
  },

  // Actualizar telemetría (simulación - normalmente vendría del GPS)
  updateTelemetry: async (
    equipmentId: string,
    telemetry: {
      lat?: number;
      lng?: number;
      speed?: number;
      bearing?: number;
      altitude?: number;
      satellites?: number;
    }
  ): Promise<Equipment> => {
    await delay(100);

    const index = equipments.findIndex(e => e.id === equipmentId);
    if (index === -1) {
      throw new Error('Equipo no encontrado');
    }

    equipments[index] = {
      ...equipments[index],
      ...telemetry,
      last_seen: new Date().toISOString(),
      status: 'active',
    };

    return equipments[index];
  },
};
