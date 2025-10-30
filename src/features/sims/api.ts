import type { SIM } from '../../lib/types';
import { mockSIMs, mockEquipments } from '../../data/mockData';
import { LS_USER_KEY } from '../../lib/constants';

// Función auxiliar para simular delay de red
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper para obtener el usuario actual
const getCurrentUser = () => {
  const userStr = localStorage.getItem(LS_USER_KEY);
  return userStr ? JSON.parse(userStr) : null;
};

// Copia mutable
let sims = [...mockSIMs];

// Acceso a equipos para actualización bidireccional
let equipments = mockEquipments;

export const simsApi = {
  // Obtener todas las SIM (solo superuser ve todas, admin ve las de sus equipos)
  getAll: async (): Promise<SIM[]> => {
    await delay(200);

    const user = getCurrentUser();

    // Solo superuser puede ver todas las SIM
    if (user?.role !== 'superuser') {
      throw new Error('Solo superuser tiene acceso a la gestión de SIM');
    }

    return [...sims];
  },

  // Obtener SIM por ID
  getById: async (id: string): Promise<SIM | null> => {
    await delay(150);

    const user = getCurrentUser();
    if (user?.role !== 'superuser') {
      throw new Error('Solo superuser tiene acceso a la gestión de SIM');
    }

    const sim = sims.find(s => s.id === id);
    return sim || null;
  },

  // Obtener SIM por ICCID
  getByIccid: async (iccid: string): Promise<SIM | null> => {
    await delay(150);

    const user = getCurrentUser();
    if (user?.role !== 'superuser') {
      throw new Error('Solo superuser tiene acceso a la gestión de SIM');
    }

    const sim = sims.find(s => s.iccid === iccid);
    return sim || null;
  },

  // Obtener SIM disponibles (no asignadas)
  getAvailable: async (): Promise<SIM[]> => {
    await delay(150);

    const user = getCurrentUser();
    if (user?.role !== 'superuser') {
      throw new Error('Solo superuser tiene acceso a la gestión de SIM');
    }

    return sims.filter(s => s.status === 'available');
  },

  // Obtener SIM activas
  getActive: async (): Promise<SIM[]> => {
    await delay(150);

    const user = getCurrentUser();
    if (user?.role !== 'superuser') {
      throw new Error('Solo superuser tiene acceso a la gestión de SIM');
    }

    return sims.filter(s => s.status === 'active');
  },

  // Crear nueva SIM
  create: async (data: {
    iccid: string;
    phone_number: string;
    carrier: string;
    company?: string;
    data_limit_mb?: number;
    activation_date?: string;
  }): Promise<SIM> => {
    await delay(300);

    const user = getCurrentUser();
    if (user?.role !== 'superuser') {
      throw new Error('Solo superuser puede crear SIM');
    }

    // Verificar que el ICCID no exista
    if (sims.some(s => s.iccid === data.iccid)) {
      throw new Error('Ya existe una SIM con ese ICCID');
    }

    // Verificar que el teléfono no exista
    if (data.phone_number && sims.some(s => s.phone_number === data.phone_number)) {
      throw new Error('Ya existe una SIM con ese número de teléfono');
    }

    const newSim: SIM = {
      id: `sim${Date.now()}`,
      iccid: data.iccid,
      phone_number: data.phone_number,
      phone_line: data.phone_number,
      carrier: data.carrier,
      company: data.company || data.carrier,
      data_limit_mb: data.data_limit_mb,
      data_used_mb: 0,
      status: 'available',
      activation_date: data.activation_date,
      created_at: new Date().toISOString(),
    };

    sims.push(newSim);
    return newSim;
  },

  // Actualizar SIM
  update: async (id: string, data: Partial<SIM>): Promise<SIM> => {
    await delay(250);

    const user = getCurrentUser();
    if (user?.role !== 'superuser') {
      throw new Error('Solo superuser puede actualizar SIM');
    }

    const index = sims.findIndex(s => s.id === id);
    if (index === -1) {
      throw new Error('SIM no encontrada');
    }

    const sim = sims[index];

    // Si se cambia el ICCID, verificar que no exista
    if (data.iccid && data.iccid !== sim.iccid) {
      if (sims.some(s => s.iccid === data.iccid)) {
        throw new Error('Ya existe una SIM con ese ICCID');
      }
    }

    // Si se cambia el teléfono, verificar que no exista
    if (data.phone_number && data.phone_number !== sim.phone_number) {
      if (sims.some(s => s.phone_number === data.phone_number)) {
        throw new Error('Ya existe una SIM con ese número de teléfono');
      }
    }

    sims[index] = {
      ...sims[index],
      ...data,
      id, // Asegurar que el ID no cambie
      updated_at: new Date().toISOString(),
    };

    return sims[index];
  },

  // Activar SIM
  activate: async (id: string): Promise<SIM> => {
    await delay(200);

    const user = getCurrentUser();
    if (user?.role !== 'superuser') {
      throw new Error('Solo superuser puede activar SIM');
    }

    const index = sims.findIndex(s => s.id === id);
    if (index === -1) {
      throw new Error('SIM no encontrada');
    }

    if (sims[index].status === 'suspended') {
      throw new Error('No se puede activar una SIM suspendida. Primero debe reactivarla.');
    }

    sims[index] = {
      ...sims[index],
      status: 'active',
      activation_date: sims[index].activation_date || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return sims[index];
  },

  // Suspender SIM (por límite de datos, falta de pago, etc.)
  suspend: async (id: string, reason?: string): Promise<SIM> => {
    await delay(200);

    const user = getCurrentUser();
    if (user?.role !== 'superuser') {
      throw new Error('Solo superuser puede suspender SIM');
    }

    const index = sims.findIndex(s => s.id === id);
    if (index === -1) {
      throw new Error('SIM no encontrada');
    }

    sims[index] = {
      ...sims[index],
      status: 'suspended',
      expiry_date: reason ? new Date().toISOString() : sims[index].expiry_date,
      updated_at: new Date().toISOString(),
    };

    return sims[index];
  },

  // Reactivar SIM suspendida
  reactivate: async (id: string): Promise<SIM> => {
    await delay(200);

    const user = getCurrentUser();
    if (user?.role !== 'superuser') {
      throw new Error('Solo superuser puede reactivar SIM');
    }

    const index = sims.findIndex(s => s.id === id);
    if (index === -1) {
      throw new Error('SIM no encontrada');
    }

    if (sims[index].status !== 'suspended') {
      throw new Error('Solo se pueden reactivar SIM suspendidas');
    }

    sims[index] = {
      ...sims[index],
      status: 'available',
      expiry_date: undefined,
      updated_at: new Date().toISOString(),
    };

    return sims[index];
  },

  // Actualizar uso de datos
  updateDataUsage: async (id: string, dataUsedMb: number): Promise<SIM> => {
    await delay(100);

    const user = getCurrentUser();
    if (user?.role !== 'superuser') {
      throw new Error('Solo superuser puede actualizar uso de datos');
    }

    const index = sims.findIndex(s => s.id === id);
    if (index === -1) {
      throw new Error('SIM no encontrada');
    }

    const sim = sims[index];

    sims[index] = {
      ...sims[index],
      data_used_mb: dataUsedMb,
      updated_at: new Date().toISOString(),
    };

    // Si excede el límite, suspender automáticamente
    if (sim.data_limit_mb && dataUsedMb >= sim.data_limit_mb) {
      sims[index].status = 'suspended';
    }

    return sims[index];
  },

  // Asignar SIM a equipo
  assignToEquipment: async (simId: string, equipmentId: string): Promise<SIM> => {
    await delay(200);

    const user = getCurrentUser();
    if (user?.role !== 'superuser') {
      throw new Error('Solo superuser puede asignar SIM');
    }

    const simIndex = sims.findIndex(s => s.id === simId);
    if (simIndex === -1) {
      throw new Error('SIM no encontrada');
    }

    if (sims[simIndex].equipment_id) {
      throw new Error('La SIM ya está asignada a un equipo');
    }

    // Verificar que el equipo existe
    const equipmentIndex = equipments.findIndex(e => e.id === equipmentId);
    if (equipmentIndex === -1) {
      throw new Error('Equipo no encontrado');
    }

    // Verificar que el equipo no tenga ya una SIM
    if (equipments[equipmentIndex].sim_id) {
      throw new Error('El equipo ya tiene una SIM asignada');
    }

    // Actualizar la SIM
    sims[simIndex] = {
      ...sims[simIndex],
      equipment_id: equipmentId,
      assigned_to_equipment_id: equipmentId,
      status: 'active',
      updated_at: new Date().toISOString(),
    };

    // Actualizar el equipo
    equipments[equipmentIndex] = {
      ...equipments[equipmentIndex],
      sim_id: simId,
      updated_at: new Date().toISOString(),
    };

    return sims[simIndex];
  },

  // Desasignar SIM de equipo
  unassignFromEquipment: async (simId: string): Promise<SIM> => {
    await delay(200);

    const user = getCurrentUser();
    if (user?.role !== 'superuser') {
      throw new Error('Solo superuser puede desasignar SIM');
    }

    const simIndex = sims.findIndex(s => s.id === simId);
    if (simIndex === -1) {
      throw new Error('SIM no encontrada');
    }

    const equipmentId = sims[simIndex].equipment_id;

    // Actualizar la SIM
    sims[simIndex] = {
      ...sims[simIndex],
      equipment_id: undefined,
      assigned_to_equipment_id: undefined,
      status: 'available',
      updated_at: new Date().toISOString(),
    };

    // Si había un equipo asignado, quitarle la SIM
    if (equipmentId) {
      const equipmentIndex = equipments.findIndex(e => e.id === equipmentId);
      if (equipmentIndex !== -1) {
        equipments[equipmentIndex] = {
          ...equipments[equipmentIndex],
          sim_id: undefined,
          updated_at: new Date().toISOString(),
        };
      }
    }

    return sims[simIndex];
  },

  // Cambiar estado de SIM (toggle entre active/inactive)
  toggleStatus: async (id: string): Promise<SIM> => {
    await delay(200);

    const user = getCurrentUser();
    if (user?.role !== 'superuser') {
      throw new Error('Solo superuser puede cambiar el estado de SIM');
    }

    const index = sims.findIndex(s => s.id === id);
    if (index === -1) {
      throw new Error('SIM no encontrada');
    }

    const currentStatus = sims[index].status;
    let newStatus: SIM['status'];

    if (currentStatus === 'inactive') {
      newStatus = 'available';
    } else if (currentStatus === 'suspended') {
      throw new Error('No se puede activar una SIM suspendida. Use la opción de reactivar.');
    } else {
      newStatus = 'inactive';
    }

    sims[index] = {
      ...sims[index],
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    return sims[index];
  },

  // Eliminar SIM
  delete: async (id: string): Promise<void> => {
    await delay(200);

    const user = getCurrentUser();
    if (user?.role !== 'superuser') {
      throw new Error('Solo superuser puede eliminar SIM');
    }

    const sim = sims.find(s => s.id === id);
    if (!sim) {
      throw new Error('SIM no encontrada');
    }

    // No se puede eliminar si está asignada a equipo
    if (sim.equipment_id) {
      throw new Error('No se puede eliminar una SIM asignada a un equipo. Primero desasígnela.');
    }

    sims = sims.filter(s => s.id !== id);
  },

  // Obtener estadísticas de uso
  getUsageStats: async (): Promise<{
    total: number;
    active: number;
    available: number;
    suspended: number;
    totalDataUsedMb: number;
    totalDataLimitMb: number;
  }> => {
    await delay(150);

    const user = getCurrentUser();
    if (user?.role !== 'superuser') {
      throw new Error('Solo superuser puede ver estadísticas');
    }

    const total = sims.length;
    const active = sims.filter(s => s.status === 'active').length;
    const available = sims.filter(s => s.status === 'available').length;
    const suspended = sims.filter(s => s.status === 'suspended').length;
    const totalDataUsedMb = sims.reduce((sum, s) => sum + (s.data_used_mb || 0), 0);
    const totalDataLimitMb = sims.reduce((sum, s) => sum + (s.data_limit_mb || 0), 0);

    return {
      total,
      active,
      available,
      suspended,
      totalDataUsedMb,
      totalDataLimitMb,
    };
  },
};
