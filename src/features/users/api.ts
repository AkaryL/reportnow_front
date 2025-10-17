import type { User, ActivityLog } from '../../lib/types';
import { mockUsers, mockUserVehicles, mockVehicles, mockActivityLogs } from '../../data/mockData';
import { LS_USER_KEY } from '../../lib/constants';

// Función auxiliar para simular delay de red
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper para obtener el usuario actual
const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem(LS_USER_KEY);
  return userStr ? JSON.parse(userStr) : null;
};

export interface UserWithVehicles extends User {
  vehicles?: any[];
  assigned_vehicles?: number;
}

// Copias mutables
let users = [...mockUsers];
let userVehicles = [...mockUserVehicles];
let activityLogs = [...mockActivityLogs];

export const usersApi = {
  getAll: async (): Promise<UserWithVehicles[]> => {
    await delay(200);

    return users.map(user => {
      const { password, ...userWithoutPassword } = user;
      const assignedVehicleIds = userVehicles
        .filter(uv => uv.userId === user.id)
        .map(uv => uv.vehicleId);

      return {
        ...userWithoutPassword,
        assigned_vehicles: assignedVehicleIds.length,
      };
    });
  },

  getById: async (id: string): Promise<UserWithVehicles | null> => {
    await delay(150);

    const user = users.find(u => u.id === id);
    if (!user) return null;

    const { password, ...userWithoutPassword } = user;
    const assignedVehicleIds = userVehicles
      .filter(uv => uv.userId === id)
      .map(uv => uv.vehicleId);

    return {
      ...userWithoutPassword,
      assigned_vehicles: assignedVehicleIds.length,
    };
  },

  create: async (data: {
    username: string;
    password: string;
    name: string;
    role: 'superuser' | 'admin' | 'client';
    email?: string;
    client_id?: string;
    vehicle_ids?: string[];
  }): Promise<User> => {
    await delay(300);

    const newUser: User = {
      id: `u${Date.now()}`,
      username: data.username,
      password: data.password, // En producción esto debería estar hasheado
      name: data.name,
      role: data.role,
      email: data.email,
      client_id: data.client_id,
      created_at: new Date().toISOString(),
    };

    users.push(newUser);

    // Asignar vehículos si se especifican
    if (data.vehicle_ids && data.vehicle_ids.length > 0) {
      data.vehicle_ids.forEach(vehicleId => {
        userVehicles.push({ userId: newUser.id, vehicleId });
      });
    }

    // Registrar actividad solo si el nuevo usuario es admin
    if (data.role === 'admin') {
      const user = getCurrentUser();
      if (user && user.role === 'superuser') {
        await activityLogsApi.create({
          user_id: user.id,
          user_name: user.name,
          user_role: user.role,
          activity_type: 'create_user',
          description: `Creó el usuario admin "${newUser.name}"`,
          target_type: 'user',
          target_id: newUser.id,
          target_name: newUser.name,
          metadata: { user_email: newUser.email },
        });
      }
    }

    const { password, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  },

  update: async (id: string, data: {
    username?: string;
    password?: string;
    name?: string;
    role?: 'superuser' | 'admin' | 'client';
    email?: string;
    client_id?: string;
    vehicle_ids?: string[];
  }): Promise<User> => {
    await delay(250);

    const index = users.findIndex(u => u.id === id);
    if (index === -1) {
      throw new Error('Usuario no encontrado');
    }

    const oldUser = { ...users[index] };

    // Actualizar usuario
    users[index] = {
      ...users[index],
      ...data,
      id, // Asegurar que el ID no cambie
    };

    // Si se especifican vehicle_ids, actualizar asignaciones
    if (data.vehicle_ids !== undefined) {
      // Eliminar asignaciones antiguas
      userVehicles = userVehicles.filter(uv => uv.userId !== id);

      // Añadir nuevas asignaciones
      data.vehicle_ids.forEach(vehicleId => {
        userVehicles.push({ userId: id, vehicleId });
      });
    }

    // Registrar actividad solo si el usuario actualizado es admin
    if (oldUser.role === 'admin' || data.role === 'admin') {
      const user = getCurrentUser();
      if (user && user.role === 'superuser') {
        const updatedFields = Object.keys(data).filter(key => key !== 'password'); // No registrar cambio de password por seguridad
        await activityLogsApi.create({
          user_id: user.id,
          user_name: user.name,
          user_role: user.role,
          activity_type: 'update_user',
          description: `Actualizó el usuario admin "${users[index].name}"`,
          target_type: 'user',
          target_id: users[index].id,
          target_name: users[index].name,
          metadata: { updated_fields: updatedFields },
        });
      }
    }

    const { password, ...userWithoutPassword } = users[index];
    return userWithoutPassword;
  },

  delete: async (id: string): Promise<void> => {
    await delay(200);

    const userToDelete = users.find(u => u.id === id);

    users = users.filter(u => u.id !== id);
    userVehicles = userVehicles.filter(uv => uv.userId !== id);

    // Registrar actividad solo si el usuario eliminado es admin
    if (userToDelete && userToDelete.role === 'admin') {
      const user = getCurrentUser();
      if (user && user.role === 'superuser') {
        await activityLogsApi.create({
          user_id: user.id,
          user_name: user.name,
          user_role: user.role,
          activity_type: 'delete_user',
          description: `Eliminó el usuario admin "${userToDelete.name}"`,
          target_type: 'user',
          target_id: userToDelete.id,
          target_name: userToDelete.name,
        });
      }
    }
  },

  getUserVehicles: async (id: string): Promise<any[]> => {
    await delay(150);

    const assignedVehicleIds = userVehicles
      .filter(uv => uv.userId === id)
      .map(uv => uv.vehicleId);

    return mockVehicles.filter(v => assignedVehicleIds.includes(v.id));
  },

  assignVehicle: async (userId: string, vehicleId: string): Promise<void> => {
    await delay(150);

    // Verificar que no exista ya la asignación
    const exists = userVehicles.some(
      uv => uv.userId === userId && uv.vehicleId === vehicleId
    );

    if (!exists) {
      userVehicles.push({ userId, vehicleId });
    }
  },

  unassignVehicle: async (userId: string, vehicleId: string): Promise<void> => {
    await delay(150);

    userVehicles = userVehicles.filter(
      uv => !(uv.userId === userId && uv.vehicleId === vehicleId)
    );
  },

  // Obtener solo usuarios admin
  getAdmins: async (): Promise<UserWithVehicles[]> => {
    await delay(200);

    const admins = users.filter(u => u.role === 'admin');

    return admins.map(user => {
      const { password, ...userWithoutPassword } = user;
      const assignedVehicleIds = userVehicles
        .filter(uv => uv.userId === user.id)
        .map(uv => uv.vehicleId);

      return {
        ...userWithoutPassword,
        assigned_vehicles: assignedVehicleIds.length,
      };
    });
  },
};

// ==================== ACTIVITY LOGS API ====================
export const activityLogsApi = {
  getAll: async (): Promise<ActivityLog[]> => {
    await delay(200);
    // Ordenar por fecha más reciente primero
    return [...activityLogs].sort((a, b) =>
      new Date(b.ts).getTime() - new Date(a.ts).getTime()
    );
  },

  getByUserId: async (userId: string): Promise<ActivityLog[]> => {
    await delay(150);

    const userLogs = activityLogs.filter(log => log.user_id === userId);

    // Ordenar por fecha más reciente primero
    return userLogs.sort((a, b) =>
      new Date(b.ts).getTime() - new Date(a.ts).getTime()
    );
  },

  getByUserRole: async (role: 'admin' | 'superuser'): Promise<ActivityLog[]> => {
    await delay(150);

    const roleLogs = activityLogs.filter(log => log.user_role === role);

    // Ordenar por fecha más reciente primero
    return roleLogs.sort((a, b) =>
      new Date(b.ts).getTime() - new Date(a.ts).getTime()
    );
  },

  create: async (log: Omit<ActivityLog, 'id' | 'ts'>): Promise<ActivityLog> => {
    await delay(100);

    const newLog: ActivityLog = {
      ...log,
      id: `a${Date.now()}`,
      ts: new Date().toISOString(),
    };

    activityLogs.push(newLog);
    return newLog;
  },

  // Obtener estadísticas de actividad por usuario
  getStatsByUserId: async (userId: string): Promise<{
    total_activities: number;
    by_type: Record<string, number>;
    recent_activity_ts?: string;
  }> => {
    await delay(150);

    const userLogs = activityLogs.filter(log => log.user_id === userId);

    const by_type: Record<string, number> = {};
    userLogs.forEach(log => {
      by_type[log.activity_type] = (by_type[log.activity_type] || 0) + 1;
    });

    const sortedLogs = userLogs.sort((a, b) =>
      new Date(b.ts).getTime() - new Date(a.ts).getTime()
    );

    return {
      total_activities: userLogs.length,
      by_type,
      recent_activity_ts: sortedLogs[0]?.ts,
    };
  },
};
