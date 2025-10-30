import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assetsApi } from '../features/assets/api';
import { driversApi } from '../features/drivers/api';
import { equipmentsApi } from '../features/equipments/api';
import { QUERY_KEYS, ASSET_TYPE_CONFIG } from '../lib/constants';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { AssetFormModal } from '../components/assets/AssetFormModal';
import {
  Truck,
  Package,
  Box,
  UserCircle,
  Circle,
  Plus,
  Edit,
  Trash2,
  Search,
  Radio,
  User
} from 'lucide-react';
import type { Asset } from '../lib/types';
import { useAuth } from '../features/auth/hooks';
import { useToast } from '../hooks/useToast';
import { useConfirm } from '../hooks/useConfirm';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

export function AssetsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const toast = useToast();
  const confirmDialog = useConfirm();

  const { data: assets = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.ASSETS,
    queryFn: assetsApi.getAll,
  });

  const { data: drivers = [] } = useQuery({
    queryKey: QUERY_KEYS.DRIVERS,
    queryFn: driversApi.getAll,
  });

  const { data: equipments = [] } = useQuery({
    queryKey: QUERY_KEYS.EQUIPMENTS,
    queryFn: equipmentsApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: assetsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ASSETS });
      setIsModalOpen(false);
      setSelectedAsset(null);
      toast.success('Activo creado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al crear el activo');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => assetsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ASSETS });
      setIsModalOpen(false);
      setSelectedAsset(null);
      toast.success('Activo actualizado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al actualizar el activo');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: assetsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ASSETS });
      toast.success('Activo eliminado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al eliminar el activo');
    },
  });

  // Filtrar activos
  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      !searchQuery ||
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ('plate' in asset && asset.plate?.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = filterType === 'all' || asset.type === filterType;
    const matchesStatus = filterStatus === 'all' || asset.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const handleSubmit = (data: any) => {
    if (selectedAsset) {
      updateMutation.mutate({ id: selectedAsset.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (asset: Asset) => {
    setSelectedAsset(asset);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await confirmDialog.confirm({
      title: 'Eliminar Activo',
      message: `¿Estás seguro de que deseas eliminar el activo "${name}"? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });

    if (confirmed) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAsset(null);
  };

  const getTypeIcon = (type: Asset['type']) => {
    const icons = {
      vehicle: Truck,
      cargo: Package,
      container: Box,
      person: UserCircle,
      other: Circle,
    };
    return icons[type];
  };

  const getTypeBadge = (type: Asset['type']) => {
    const config = ASSET_TYPE_CONFIG[type];
    const Icon = getTypeIcon(type);
    return (
      <Badge variant="default" className={`${config.bgColor} ${config.textColor}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getStatusBadge = (status: Asset['status']) => {
    const config = {
      active: { label: 'Activo', color: 'bg-ok-50 text-ok-700' },
      inactive: { label: 'Inactivo', color: 'bg-gray-100 text-gray-700' },
      maintenance: { label: 'Mantenimiento', color: 'bg-warn-50 text-warn-700' },
    };
    const statusConfig = config[status];
    return (
      <Badge variant={status === 'active' ? 'success' : 'default'} className={statusConfig.color}>
        {statusConfig.label}
      </Badge>
    );
  };

  const getDriverName = (driverId?: string) => {
    if (!driverId) return '-';
    const driver = drivers.find((d) => d.id === driverId);
    return driver?.name || driverId;
  };

  const getEquipmentIMEI = (assetId: string) => {
    const equipment = equipments.find((e) => e.asset_id === assetId);
    return equipment?.imei || '-';
  };

  const stats = [
    {
      label: 'Total Activos',
      value: assets.length,
      color: 'bg-blue-50 text-blue-700',
      icon: Circle,
    },
    {
      label: 'Vehículos',
      value: assets.filter((a) => a.type === 'vehicle').length,
      color: 'bg-info-50 text-info-700',
      icon: Truck,
    },
    {
      label: 'Mercancía',
      value: assets.filter((a) => a.type === 'cargo').length,
      color: 'bg-warn-50 text-warn-700',
      icon: Package,
    },
    {
      label: 'Contenedores',
      value: assets.filter((a) => a.type === 'container').length,
      color: 'bg-purple-50 text-purple-700',
      icon: Box,
    },
    {
      label: 'Activos',
      value: assets.filter((a) => a.status === 'active').length,
      color: 'bg-ok-50 text-ok-700',
      icon: Circle,
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Activos</h1>
          <p className="text-gray-600 mt-1">
            Gestión de activos rastreados • {filteredAssets.length} activos
          </p>
        </div>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Nuevo Activo
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className={`text-2xl font-bold mt-1 ${stat.color.split(' ')[1]}`}>{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-full ${stat.color} flex items-center justify-center`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar por nombre, placa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Todos los tipos</option>
            <option value="vehicle">Vehículos</option>
            <option value="cargo">Mercancía</option>
            <option value="container">Contenedores</option>
            <option value="person">Personas</option>
            <option value="other">Otros</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
            <option value="maintenance">En mantenimiento</option>
          </select>

          {/* Clear Filters */}
          {(searchQuery || filterType !== 'all' || filterStatus !== 'all') && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setFilterType('all');
                setFilterStatus('all');
              }}
            >
              Limpiar filtros
            </Button>
          )}
        </div>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de activos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Activo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Equipo GPS</TableHead>
                  <TableHead>Conductor</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No se encontraron activos
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAssets.map((asset) => (
                    <TableRow key={asset.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">{asset.name}</div>
                          {asset.type === 'vehicle' && 'plate' in asset && (
                            <p className="text-sm text-gray-500 mt-0.5">
                              {asset.plate} • {asset.brand} {asset.model}
                            </p>
                          )}
                          {asset.type === 'cargo' && 'tracking_number' in asset && asset.tracking_number && (
                            <p className="text-sm text-gray-500 mt-0.5">
                              Tracking: {String(asset.tracking_number)}
                            </p>
                          )}
                          {asset.type === 'container' && 'container_number' in asset && asset.container_number && (
                            <p className="text-sm text-gray-500 mt-0.5">
                              Contenedor: {String(asset.container_number)}
                            </p>
                          )}
                          {asset.type === 'person' && 'employee_id' in asset && asset.employee_id && (
                            <p className="text-sm text-gray-500 mt-0.5">
                              ID: {String(asset.employee_id)}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getTypeBadge(asset.type)}</TableCell>
                      <TableCell>{getStatusBadge(asset.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Radio className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{getEquipmentIMEI(asset.id)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {asset.type === 'vehicle' && 'driver_id' in asset
                              ? getDriverName(asset.driver_id)
                              : '-'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(asset)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(asset.id, asset.name)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AssetFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        asset={selectedAsset}
        clientId={user?.client_id || ''}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={confirmDialog.handleCancel}
        onConfirm={confirmDialog.handleConfirm}
        title={confirmDialog.options.title}
        message={confirmDialog.options.message}
        confirmText={confirmDialog.options.confirmText}
        cancelText={confirmDialog.options.cancelText}
        variant={confirmDialog.options.variant}
      />
    </div>
  );
}
