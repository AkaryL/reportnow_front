import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assetsApi } from '../features/assets/api';
import { driversApi } from '../features/drivers/api';
import { equipmentsApi } from '../features/equipments/api';
import { clientsApi } from '../features/clients/api';
import { QUERY_KEYS } from '../lib/constants';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { AssetFormModal } from '../components/assets/AssetFormModal';
import { AssetDetailModal } from '../components/assets/AssetDetailModal';
import { AssignEquipmentToAssetModal } from '../components/assets/AssignEquipmentToAssetModal';
import {
  Truck,
  Package,
  Box as BoxIcon,
  UserCircle,
  Circle,
  Plus,
  Edit,
  Trash2,
  Search,
  Radio,
  User,
  Container,
  Link,
  Unlink,
  Download
} from 'lucide-react';
import { generateListPDF } from '../lib/pdfGenerator';
import type { Asset, VehicleAsset, CargoAsset, ContainerAsset, PersonAsset, OtherAsset } from '../lib/types';
import { useAuth } from '../features/auth/hooks';
import { useToast } from '../hooks/useToast';
import { useConfirm } from '../hooks/useConfirm';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { cn } from '../lib/utils';

type AssetTab = 'all' | 'vehiculo' | 'cargo' | 'container' | 'person' | 'other';

export function AssetsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClient, setFilterClient] = useState<string>('all');
  const [filterEquipment, setFilterEquipment] = useState<'all' | 'with' | 'without'>('all');
  const [activeTab, setActiveTab] = useState<AssetTab>('all');
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [viewingAsset, setViewingAsset] = useState<Asset | null>(null);
  const [isAssignEquipmentModalOpen, setIsAssignEquipmentModalOpen] = useState(false);
  const [assetToAssignEquipment, setAssetToAssignEquipment] = useState<Asset | null>(null);
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

  const { data: clients = [] } = useQuery({
    queryKey: QUERY_KEYS.CLIENTS,
    queryFn: clientsApi.getAll,
    enabled: user?.role === 'superuser',
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
      setIsDetailModalOpen(false);
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

  const assignEquipmentMutation = useMutation({
    mutationFn: ({ equipmentId, assetId }: { equipmentId: string; assetId: string }) =>
      equipmentsApi.assignToAsset(equipmentId, assetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.EQUIPMENTS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ASSETS });
      setIsAssignEquipmentModalOpen(false);
      setAssetToAssignEquipment(null);
      toast.success('Equipo GPS asignado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al asignar el equipo');
    },
  });

  const unassignEquipmentMutation = useMutation({
    mutationFn: (equipmentId: string) => equipmentsApi.unassignFromAsset(equipmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.EQUIPMENTS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ASSETS });
      setIsAssignEquipmentModalOpen(false);
      setAssetToAssignEquipment(null);
      toast.success('Equipo GPS desasignado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al desasignar el equipo');
    },
  });

  // Filtrar activos por cliente, equipo y búsqueda (sin tipo para las tabs)
  const assetsFilteredByClientAndSearch = assets.filter((asset) => {
    // Si el usuario no es superuser, solo mostrar activos de su cliente
    if (user?.role !== 'superuser' && user?.client_id) {
      if (asset.client_id !== user.client_id) {
        return false;
      }
    }

    const matchesSearch =
      !searchQuery ||
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ('plate' in asset && asset.plate?.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesClient = filterClient === 'all' || asset.client_id === filterClient;

    // Verificar si el activo tiene equipo asignado
    const hasEquipment = equipments.some((eq) => eq.asset_id === asset.id);
    const matchesEquipment =
      filterEquipment === 'all' ||
      (filterEquipment === 'with' && hasEquipment) ||
      (filterEquipment === 'without' && !hasEquipment);

    return matchesSearch && matchesClient && matchesEquipment;
  });

  // Filtrar activos incluyendo el tipo activo
  const filteredAssets = assetsFilteredByClientAndSearch.filter((asset) => {
    const matchesType = activeTab === 'all' || asset.type === activeTab;
    return matchesType;
  });

  const getClientName = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    return client?.company_name || 'Sin asignar';
  };

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

  const handleViewDetails = (asset: Asset) => {
    setViewingAsset(asset);
    setIsDetailModalOpen(true);
  };

  const handleSaveFromDetail = (updatedAsset: Asset) => {
    updateMutation.mutate({ id: updatedAsset.id, data: updatedAsset });
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

  const getDriverName = (driverId?: string) => {
    if (!driverId) return '-';
    const driver = drivers.find((d) => d.id === driverId);
    return driver?.name || driverId;
  };

  const getEquipmentSerial = (assetId: string) => {
    const equipment = equipments.find((e) => e.asset_id === assetId);
    return equipment?.serial || '-';
  };

  const getEquipmentForAsset = (assetId: string) => {
    return equipments.find((e) => e.asset_id === assetId) || null;
  };

  const getAvailableEquipments = () => {
    return equipments.filter((e) => !e.asset_id);
  };

  const handleOpenAssignEquipmentModal = (asset: Asset) => {
    setAssetToAssignEquipment(asset);
    setIsAssignEquipmentModalOpen(true);
  };

  const handleAssignEquipment = (equipmentId: string) => {
    if (assetToAssignEquipment) {
      assignEquipmentMutation.mutate({ equipmentId, assetId: assetToAssignEquipment.id });
    }
  };

  const handleUnassignEquipment = (equipmentId: string) => {
    unassignEquipmentMutation.mutate(equipmentId);
  };

  const tabs = [
    { id: 'all' as AssetTab, label: 'Todas', icon: Circle },
    { id: 'vehiculo' as AssetTab, label: 'Vehículos', icon: Truck },
    { id: 'cargo' as AssetTab, label: 'Mercancía', icon: Package },
    { id: 'container' as AssetTab, label: 'Contenedores', icon: Container },
    { id: 'person' as AssetTab, label: 'Personas', icon: UserCircle },
    { id: 'other' as AssetTab, label: 'Otros', icon: BoxIcon },
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Activos</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gestión de activos rastreados • {filteredAssets.length} activos
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => generateListPDF({
              title: 'Lista de Activos',
              subtitle: `${filteredAssets.length} activos encontrados`,
              columns: [
                { header: 'Nombre', key: 'name' },
                { header: 'Tipo', key: 'type' },
                { header: 'Identificador', key: 'identifier' },
                { header: 'Estado', key: 'status' },
              ],
              data: filteredAssets.map(a => ({
                name: a.name,
                type: a.type,
                identifier: a.type === 'vehiculo' ? (a as VehicleAsset).plates : a.type === 'cargo' ? (a as CargoAsset).tracking_code : '-',
                status: a.status === 'active' ? 'Activo' : 'Inactivo',
              })),
              filename: 'activos',
              filters: filterClient !== 'all' || activeTab !== 'all' ? [
                ...(filterClient !== 'all' ? [{ label: 'Cliente', value: clients.find(c => c.id === filterClient)?.company_name || filterClient }] : []),
                ...(activeTab !== 'all' ? [{ label: 'Tipo', value: activeTab }] : []),
              ] : undefined,
            })}
          >
            <Download className="w-4 h-4" />
            PDF
          </Button>
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4" />
            Nuevo Activo
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar activos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            {user?.role === 'superuser' && (
              <select
                value={filterClient}
                onChange={(e) => setFilterClient(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">Todos los clientes</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.company_name}
                  </option>
                ))}
              </select>
            )}
            <select
              value={filterEquipment}
              onChange={(e) => setFilterEquipment(e.target.value as 'all' | 'with' | 'without')}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">Todos los activos</option>
              <option value="with">Con equipo GPS</option>
              <option value="without">Sin equipo GPS</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const count = tab.id === 'all'
              ? assetsFilteredByClientAndSearch.length
              : assetsFilteredByClientAndSearch.filter(a => a.type === tab.id).length;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors',
                  isActive
                    ? 'border-primary text-primary dark:text-primary-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                <span className={cn(
                  'ml-2 py-0.5 px-2 rounded-full text-xs',
                  isActive
                    ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="p-6">
          <CardTitle>
            {activeTab === 'all' ? 'Todos los Activos' : tabs.find(t => t.id === activeTab)?.label}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {filteredAssets.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">No se encontraron activos</p>
              </div>
            ) : (
              <>
                {activeTab === 'all' && <AllAssetsTable assets={filteredAssets} onView={handleViewDetails} onEdit={handleEdit} onDelete={handleDelete} onAssignEquipment={handleOpenAssignEquipmentModal} getClientName={getClientName} isSuperuser={user?.role === 'superuser'} getEquipmentSerial={getEquipmentSerial} getEquipmentForAsset={getEquipmentForAsset} />}
                {activeTab === 'vehiculo' && <VehicleTable assets={filteredAssets as VehicleAsset[]} onView={handleViewDetails} onEdit={handleEdit} onDelete={handleDelete} onAssignEquipment={handleOpenAssignEquipmentModal} getClientName={getClientName} getDriverName={getDriverName} getEquipmentSerial={getEquipmentSerial} getEquipmentForAsset={getEquipmentForAsset} isSuperuser={user?.role === 'superuser'} />}
                {activeTab === 'cargo' && <CargoTable assets={filteredAssets as CargoAsset[]} onView={handleViewDetails} onEdit={handleEdit} onDelete={handleDelete} onAssignEquipment={handleOpenAssignEquipmentModal} getClientName={getClientName} getEquipmentSerial={getEquipmentSerial} getEquipmentForAsset={getEquipmentForAsset} isSuperuser={user?.role === 'superuser'} />}
                {activeTab === 'container' && <ContainerTable assets={filteredAssets as ContainerAsset[]} onView={handleViewDetails} onEdit={handleEdit} onDelete={handleDelete} onAssignEquipment={handleOpenAssignEquipmentModal} getClientName={getClientName} getEquipmentSerial={getEquipmentSerial} getEquipmentForAsset={getEquipmentForAsset} isSuperuser={user?.role === 'superuser'} />}
                {activeTab === 'person' && <PersonTable assets={filteredAssets as PersonAsset[]} onView={handleViewDetails} onEdit={handleEdit} onDelete={handleDelete} onAssignEquipment={handleOpenAssignEquipmentModal} getClientName={getClientName} getEquipmentSerial={getEquipmentSerial} getEquipmentForAsset={getEquipmentForAsset} isSuperuser={user?.role === 'superuser'} />}
                {activeTab === 'other' && <OtherTable assets={filteredAssets as OtherAsset[]} onView={handleViewDetails} onEdit={handleEdit} onDelete={handleDelete} onAssignEquipment={handleOpenAssignEquipmentModal} getClientName={getClientName} getEquipmentSerial={getEquipmentSerial} getEquipmentForAsset={getEquipmentForAsset} isSuperuser={user?.role === 'superuser'} />}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <AssetFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        asset={selectedAsset}
        clientId={user?.client_id}
        isLoading={createMutation.isPending || updateMutation.isPending}
        user={user}
        clients={clients}
      />

      <AssetDetailModal
        asset={viewingAsset}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setViewingAsset(null);
        }}
        onSave={handleSaveFromDetail}
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

      <AssignEquipmentToAssetModal
        isOpen={isAssignEquipmentModalOpen}
        onClose={() => {
          setIsAssignEquipmentModalOpen(false);
          setAssetToAssignEquipment(null);
        }}
        onAssign={handleAssignEquipment}
        onUnassign={handleUnassignEquipment}
        asset={assetToAssignEquipment}
        availableEquipments={getAvailableEquipments()}
        currentEquipment={assetToAssignEquipment ? getEquipmentForAsset(assetToAssignEquipment.id) : null}
        isLoading={assignEquipmentMutation.isPending || unassignEquipmentMutation.isPending}
      />
    </div>
  );
}

// Tabla para "Todas"
function AllAssetsTable({ assets, onView, onEdit, onDelete, onAssignEquipment, getClientName, isSuperuser, getEquipmentSerial, getEquipmentForAsset }: any) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Tipo</TableHead>
          {isSuperuser && <TableHead>Cliente</TableHead>}
          <TableHead>Equipo GPS</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {assets.map((asset: Asset) => {
          const hasEquipment = !!getEquipmentForAsset(asset.id);
          return (
            <TableRow key={asset.id} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800" onClick={() => onView(asset)}>
              <TableCell className="font-medium">{asset.name}</TableCell>
              <TableCell>
                {asset.type === 'vehiculo' && <Badge variant="default" className="bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400">Vehículo</Badge>}
                {asset.type === 'cargo' && <Badge variant="default" className="bg-orange-50 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400">Mercancía</Badge>}
                {asset.type === 'container' && <Badge variant="default" className="bg-purple-50 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400">Contenedor</Badge>}
                {asset.type === 'person' && <Badge variant="default" className="bg-green-50 dark:bg-green-900/40 text-green-700 dark:text-green-400">Persona</Badge>}
                {asset.type === 'other' && <Badge variant="default" className="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300">Otro</Badge>}
              </TableCell>
              {isSuperuser && <TableCell>{getClientName(asset.client_id)}</TableCell>}
              <TableCell>{getEquipmentSerial(asset.id)}</TableCell>
              <TableCell className="text-right">
                <div className="flex gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onAssignEquipment(asset)}
                    title={hasEquipment ? 'Gestionar equipo GPS' : 'Asignar equipo GPS'}
                    className={hasEquipment ? 'text-blue-600 hover:text-blue-700' : 'text-gray-600 hover:text-gray-700'}
                  >
                    {hasEquipment ? <Link className="w-4 h-4" /> : <Unlink className="w-4 h-4" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onEdit(asset)} title="Editar">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onDelete(asset.id, asset.name)} className="text-red-600 hover:text-red-700" title="Eliminar">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

// Tabla para Vehículos
function VehicleTable({ assets, onView, onEdit, onDelete, onAssignEquipment, getClientName, getDriverName, getEquipmentSerial, getEquipmentForAsset, isSuperuser }: any) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Marca</TableHead>
          <TableHead>Modelo</TableHead>
          <TableHead>Año</TableHead>
          <TableHead>Placas</TableHead>
          <TableHead>ID Económico</TableHead>
          <TableHead>Conductor</TableHead>
          {isSuperuser && <TableHead>Cliente</TableHead>}
          <TableHead>Equipo GPS</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {assets.map((asset: VehicleAsset) => {
          const hasEquipment = !!getEquipmentForAsset(asset.id);
          return (
            <TableRow key={asset.id} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800" onClick={() => onView(asset)}>
              <TableCell className="font-medium">{asset.name}</TableCell>
              <TableCell>{asset.brand}</TableCell>
              <TableCell>{asset.model}</TableCell>
              <TableCell>{asset.year}</TableCell>
              <TableCell className="font-mono">{asset.plate || '-'}</TableCell>
              <TableCell>{asset.economic_id || '-'}</TableCell>
              <TableCell>{getDriverName(asset.driver_id)}</TableCell>
              {isSuperuser && <TableCell>{getClientName(asset.client_id)}</TableCell>}
              <TableCell>{getEquipmentSerial(asset.id)}</TableCell>
              <TableCell className="text-right">
                <div className="flex gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onAssignEquipment(asset)}
                    title={hasEquipment ? 'Gestionar equipo GPS' : 'Asignar equipo GPS'}
                    className={hasEquipment ? 'text-blue-600 hover:text-blue-700' : 'text-gray-600 hover:text-gray-700'}
                  >
                    {hasEquipment ? <Link className="w-4 h-4" /> : <Unlink className="w-4 h-4" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onEdit(asset)} title="Editar">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onDelete(asset.id, asset.name)} className="text-red-600 hover:text-red-700" title="Eliminar">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

// Tabla para Mercancía
function CargoTable({ assets, onView, onEdit, onDelete, onAssignEquipment, getClientName, getEquipmentSerial, getEquipmentForAsset, isSuperuser }: any) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Tipo de Mercancía</TableHead>
          <TableHead>ID de Caja</TableHead>
          {isSuperuser && <TableHead>Cliente</TableHead>}
          <TableHead>Equipo GPS</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {assets.map((asset: CargoAsset) => {
          const hasEquipment = !!getEquipmentForAsset(asset.id);
          return (
            <TableRow key={asset.id} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800" onClick={() => onView(asset)}>
              <TableCell className="font-medium">{asset.name}</TableCell>
              <TableCell>{asset.cargo_type || '-'}</TableCell>
              <TableCell className="font-mono">{asset.box_id || '-'}</TableCell>
              {isSuperuser && <TableCell>{getClientName(asset.client_id)}</TableCell>}
              <TableCell>{getEquipmentSerial(asset.id)}</TableCell>
              <TableCell className="text-right">
                <div className="flex gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onAssignEquipment(asset)}
                    title={hasEquipment ? 'Gestionar equipo GPS' : 'Asignar equipo GPS'}
                    className={hasEquipment ? 'text-blue-600 hover:text-blue-700' : 'text-gray-600 hover:text-gray-700'}
                  >
                    {hasEquipment ? <Link className="w-4 h-4" /> : <Unlink className="w-4 h-4" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onEdit(asset)} title="Editar">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onDelete(asset.id, asset.name)} className="text-red-600 hover:text-red-700" title="Eliminar">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

// Tabla para Contenedores
function ContainerTable({ assets, onView, onEdit, onDelete, onAssignEquipment, getClientName, getEquipmentSerial, getEquipmentForAsset, isSuperuser }: any) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Tipo de Contenedor</TableHead>
          <TableHead>Placa Caja</TableHead>
          <TableHead>ID Económico</TableHead>
          <TableHead>Color</TableHead>
          {isSuperuser && <TableHead>Cliente</TableHead>}
          <TableHead>Equipo GPS</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {assets.map((asset: ContainerAsset) => {
          const hasEquipment = !!getEquipmentForAsset(asset.id);
          return (
            <TableRow key={asset.id} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800" onClick={() => onView(asset)}>
              <TableCell className="font-medium">{asset.name}</TableCell>
              <TableCell>{asset.container_type || '-'}</TableCell>
              <TableCell className="font-mono">{asset.box_plate || '-'}</TableCell>
              <TableCell>{asset.economic_id || '-'}</TableCell>
              <TableCell>{asset.color || '-'}</TableCell>
              {isSuperuser && <TableCell>{getClientName(asset.client_id)}</TableCell>}
              <TableCell>{getEquipmentSerial(asset.id)}</TableCell>
              <TableCell className="text-right">
                <div className="flex gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onAssignEquipment(asset)}
                    title={hasEquipment ? 'Gestionar equipo GPS' : 'Asignar equipo GPS'}
                    className={hasEquipment ? 'text-blue-600 hover:text-blue-700' : 'text-gray-600 hover:text-gray-700'}
                  >
                    {hasEquipment ? <Link className="w-4 h-4" /> : <Unlink className="w-4 h-4" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onEdit(asset)} title="Editar">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onDelete(asset.id, asset.name)} className="text-red-600 hover:text-red-700" title="Eliminar">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

// Tabla para Personas
function PersonTable({ assets, onView, onEdit, onDelete, onAssignEquipment, getClientName, getEquipmentSerial, getEquipmentForAsset, isSuperuser }: any) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre de Persona</TableHead>
          <TableHead>Teléfono</TableHead>
          <TableHead>Tel. Emergencia</TableHead>
          <TableHead>Rol</TableHead>
          {isSuperuser && <TableHead>Cliente</TableHead>}
          <TableHead>Equipo GPS</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {assets.map((asset: PersonAsset) => {
          const hasEquipment = !!getEquipmentForAsset(asset.id);
          return (
            <TableRow key={asset.id} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800" onClick={() => onView(asset)}>
              <TableCell className="font-medium">{asset.person_name}</TableCell>
              <TableCell>{asset.phone}</TableCell>
              <TableCell>{asset.emergency_phone || '-'}</TableCell>
              <TableCell>{asset.role || '-'}</TableCell>
              {isSuperuser && <TableCell>{getClientName(asset.client_id)}</TableCell>}
              <TableCell>{getEquipmentSerial(asset.id)}</TableCell>
              <TableCell className="text-right">
                <div className="flex gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onAssignEquipment(asset)}
                    title={hasEquipment ? 'Gestionar equipo GPS' : 'Asignar equipo GPS'}
                    className={hasEquipment ? 'text-blue-600 hover:text-blue-700' : 'text-gray-600 hover:text-gray-700'}
                  >
                    {hasEquipment ? <Link className="w-4 h-4" /> : <Unlink className="w-4 h-4" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onEdit(asset)} title="Editar">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onDelete(asset.id, asset.name)} className="text-red-600 hover:text-red-700" title="Eliminar">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

// Tabla para Otros
function OtherTable({ assets, onView, onEdit, onDelete, onAssignEquipment, getClientName, getEquipmentSerial, getEquipmentForAsset, isSuperuser }: any) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Categoría</TableHead>
          {isSuperuser && <TableHead>Cliente</TableHead>}
          <TableHead>Equipo GPS</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {assets.map((asset: OtherAsset) => {
          const hasEquipment = !!getEquipmentForAsset(asset.id);
          return (
            <TableRow key={asset.id} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800" onClick={() => onView(asset)}>
              <TableCell className="font-medium">{asset.name}</TableCell>
              <TableCell>{asset.asset_type || '-'}</TableCell>
              <TableCell>{asset.category || '-'}</TableCell>
              {isSuperuser && <TableCell>{getClientName(asset.client_id)}</TableCell>}
              <TableCell>{getEquipmentSerial(asset.id)}</TableCell>
              <TableCell className="text-right">
                <div className="flex gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onAssignEquipment(asset)}
                    title={hasEquipment ? 'Gestionar equipo GPS' : 'Asignar equipo GPS'}
                    className={hasEquipment ? 'text-blue-600 hover:text-blue-700' : 'text-gray-600 hover:text-gray-700'}
                  >
                    {hasEquipment ? <Link className="w-4 h-4" /> : <Unlink className="w-4 h-4" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onEdit(asset)} title="Editar">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onDelete(asset.id, asset.name)} className="text-red-600 hover:text-red-700" title="Eliminar">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
