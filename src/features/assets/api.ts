import type { Asset, VehicleAsset, CargoAsset, ContainerAsset, PersonAsset, OtherAsset, AssetType } from '../../lib/types';
import { mockAssets } from '../../data/mockData';
import { LS_USER_KEY } from '../../lib/constants';

// Función auxiliar para simular delay de red
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper para obtener el usuario actual
const getCurrentUser = () => {
  const userStr = localStorage.getItem(LS_USER_KEY);
  return userStr ? JSON.parse(userStr) : null;
};

// Copia mutable
let assets = [...mockAssets];

export const assetsApi = {
  // Obtener todos los activos (con filtro por cliente si aplica)
  getAll: async (): Promise<Asset[]> => {
    await delay(200);

    const user = getCurrentUser();

    // Si es admin, operator-admin o operator-monitor, filtrar por su tenant
    if ((user?.role === 'admin' || user?.role === 'operator-admin' || user?.role === 'operator-monitor') && user?.client_id) {
      return assets.filter(a => a.client_id === user.client_id);
    }

    // Superuser ve todos los activos
    return [...assets];
  },

  // Obtener activo por ID
  getById: async (id: string): Promise<Asset | null> => {
    await delay(150);

    const asset = assets.find(a => a.id === id);
    if (!asset) return null;

    const user = getCurrentUser();

    // Verificar permisos
    if ((user?.role === 'admin' || user?.role === 'operator-admin' || user?.role === 'operator-monitor') && user?.client_id) {
      if (asset.client_id !== user.client_id) {
        return null;
      }
    }

    return asset;
  },

  // Obtener activos por tipo
  getByType: async (type: AssetType): Promise<Asset[]> => {
    await delay(150);

    const allAssets = await assetsApi.getAll();
    return allAssets.filter(a => a.type === type);
  },

  // Obtener activos por cliente (solo superuser)
  getByClientId: async (clientId: string): Promise<Asset[]> => {
    await delay(150);

    const user = getCurrentUser();
    if (user?.role !== 'superuser') {
      throw new Error('Solo superuser puede obtener activos por cliente');
    }

    return assets.filter(a => a.client_id === clientId);
  },

  // Crear nuevo activo de tipo vehículo
  createVehicle: async (data: {
    name: string;
    description?: string;
    client_id: string;
    plate: string;
    brand: string;
    model: string;
    year: number;
    color: string;
    vin?: string;
    driver_id?: string;
  }): Promise<VehicleAsset> => {
    await delay(300);

    const user = getCurrentUser();

    // Operador monitor no puede crear
    if (user?.role === 'operator-monitor') {
      throw new Error('Operador monitor no tiene permisos de escritura');
    }

    // Admin/operadores solo pueden crear en su tenant
    if ((user?.role === 'admin' || user?.role === 'operator-admin') && user?.client_id) {
      if (data.client_id !== user.client_id) {
        throw new Error('No puede crear activos para otro cliente');
      }
    }

    const newAsset: VehicleAsset = {
      id: `ast${Date.now()}`,
      type: 'vehicle',
      name: data.name,
      description: data.description,
      client_id: data.client_id,
      status: 'active',
      plate: data.plate,
      brand: data.brand,
      model: data.model,
      year: data.year,
      color: data.color,
      vin: data.vin,
      driver_id: data.driver_id,
      created_at: new Date().toISOString(),
    };

    assets.push(newAsset);
    return newAsset;
  },

  // Crear nuevo activo de tipo carga
  createCargo: async (data: {
    name: string;
    description?: string;
    client_id: string;
    weight_kg?: number;
    dimensions?: string;
    cargo_type: string;
    value?: number;
  }): Promise<CargoAsset> => {
    await delay(300);

    const user = getCurrentUser();

    if (user?.role === 'operator-monitor') {
      throw new Error('Operador monitor no tiene permisos de escritura');
    }

    if ((user?.role === 'admin' || user?.role === 'operator-admin') && user?.client_id) {
      if (data.client_id !== user.client_id) {
        throw new Error('No puede crear activos para otro cliente');
      }
    }

    const newAsset: CargoAsset = {
      id: `ast${Date.now()}`,
      type: 'cargo',
      name: data.name,
      description: data.description,
      client_id: data.client_id,
      status: 'active',
      weight_kg: data.weight_kg,
      dimensions: data.dimensions,
      cargo_type: data.cargo_type,
      value: data.value,
      created_at: new Date().toISOString(),
    };

    assets.push(newAsset);
    return newAsset;
  },

  // Crear nuevo activo de tipo contenedor
  createContainer: async (data: {
    name: string;
    description?: string;
    client_id: string;
    container_number: string;
    container_type: string;
    size_ft: number;
    seal_number?: string;
  }): Promise<ContainerAsset> => {
    await delay(300);

    const user = getCurrentUser();

    if (user?.role === 'operator-monitor') {
      throw new Error('Operador monitor no tiene permisos de escritura');
    }

    if ((user?.role === 'admin' || user?.role === 'operator-admin') && user?.client_id) {
      if (data.client_id !== user.client_id) {
        throw new Error('No puede crear activos para otro cliente');
      }
    }

    const newAsset: ContainerAsset = {
      id: `ast${Date.now()}`,
      type: 'container',
      name: data.name,
      description: data.description,
      client_id: data.client_id,
      status: 'active',
      container_number: data.container_number,
      container_type: data.container_type,
      size_ft: data.size_ft,
      seal_number: data.seal_number,
      created_at: new Date().toISOString(),
    };

    assets.push(newAsset);
    return newAsset;
  },

  // Crear nuevo activo de tipo persona
  createPerson: async (data: {
    name: string;
    description?: string;
    client_id: string;
    person_name: string;
    role: string;
    phone?: string;
    email?: string;
  }): Promise<PersonAsset> => {
    await delay(300);

    const user = getCurrentUser();

    if (user?.role === 'operator-monitor') {
      throw new Error('Operador monitor no tiene permisos de escritura');
    }

    if ((user?.role === 'admin' || user?.role === 'operator-admin') && user?.client_id) {
      if (data.client_id !== user.client_id) {
        throw new Error('No puede crear activos para otro cliente');
      }
    }

    const newAsset: PersonAsset = {
      id: `ast${Date.now()}`,
      type: 'person',
      name: data.name,
      description: data.description,
      client_id: data.client_id,
      status: 'active',
      person_name: data.person_name,
      role: data.role,
      phone: data.phone,
      email: data.email,
      created_at: new Date().toISOString(),
    };

    assets.push(newAsset);
    return newAsset;
  },

  // Crear nuevo activo de tipo otro
  createOther: async (data: {
    name: string;
    description?: string;
    client_id: string;
    category: string;
    custom_fields?: Record<string, any>;
  }): Promise<OtherAsset> => {
    await delay(300);

    const user = getCurrentUser();

    if (user?.role === 'operator-monitor') {
      throw new Error('Operador monitor no tiene permisos de escritura');
    }

    if ((user?.role === 'admin' || user?.role === 'operator-admin') && user?.client_id) {
      if (data.client_id !== user.client_id) {
        throw new Error('No puede crear activos para otro cliente');
      }
    }

    const newAsset: OtherAsset = {
      id: `ast${Date.now()}`,
      type: 'other',
      name: data.name,
      description: data.description,
      client_id: data.client_id,
      status: 'active',
      category: data.category,
      custom_fields: data.custom_fields,
      created_at: new Date().toISOString(),
    };

    assets.push(newAsset);
    return newAsset;
  },

  // Actualizar activo
  update: async (id: string, data: Partial<Asset>): Promise<Asset> => {
    await delay(250);

    const index = assets.findIndex(a => a.id === id);
    if (index === -1) {
      throw new Error('Activo no encontrado');
    }

    const user = getCurrentUser();
    const asset = assets[index];

    // Operador monitor no puede actualizar
    if (user?.role === 'operator-monitor') {
      throw new Error('Operador monitor no tiene permisos de escritura');
    }

    // Admin/operadores solo pueden actualizar activos de su tenant
    if ((user?.role === 'admin' || user?.role === 'operator-admin') && user?.client_id) {
      if (asset.client_id !== user.client_id) {
        throw new Error('No tiene permiso para actualizar este activo');
      }
    }

    assets[index] = {
      ...assets[index],
      ...data,
      id, // Asegurar que el ID no cambie
      type: assets[index].type, // No se puede cambiar el tipo
      updated_at: new Date().toISOString(),
    };

    return assets[index];
  },

  // Eliminar activo
  delete: async (id: string): Promise<void> => {
    await delay(200);

    const user = getCurrentUser();

    // Operador monitor no puede eliminar
    if (user?.role === 'operator-monitor') {
      throw new Error('Operador monitor no tiene permisos de escritura');
    }

    const asset = assets.find(a => a.id === id);
    if (!asset) {
      throw new Error('Activo no encontrado');
    }

    // Admin/operadores solo pueden eliminar activos de su tenant
    if ((user?.role === 'admin' || user?.role === 'operator-admin') && user?.client_id) {
      if (asset.client_id !== user.client_id) {
        throw new Error('No tiene permiso para eliminar este activo');
      }
    }

    // TODO: Verificar que no tenga equipo asignado
    // (En producción, desasignar equipo primero)

    assets = assets.filter(a => a.id !== id);
  },
};
