import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { equipmentsApi } from '../features/equipments/api';
import { clientsApi } from '../features/clients/api';
import { QUERY_KEYS, EQUIPMENT_STATUS_CONFIG } from '../lib/constants';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { EquipmentFormModal } from '../components/equipments/EquipmentFormModal';
import { AssignEquipmentModal } from '../components/equipments/AssignEquipmentModal';
import { Radio, MapPin, Plus, Edit, Trash2, Search, Building2, Link as LinkIcon, Unlink, Eye, Box } from 'lucide-react';
import { formatRelativeTime } from '../lib/utils';
import type { Equipment } from '../lib/types';
import { useAuth } from '../features/auth/hooks';
import { useToast } from '../hooks/useToast';
import { useConfirm } from '../hooks/useConfirm';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

export function EquipmentsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [equipmentToAssign, setEquipmentToAssign] = useState<Equipment | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterClient, setFilterClient] = useState<string>('all');
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const confirmDialog = useConfirm();

  const { data: equipments = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.EQUIPMENTS,
    queryFn: equipmentsApi.getAll,
  });

  const { data: clients = [] } = useQuery({
    queryKey: QUERY_KEYS.CLIENTS,
    queryFn: clientsApi.getAll,
    enabled: user?.role === 'superuser',
  });

  const { data: assets = [] } = useQuery({
    queryKey: QUERY_KEYS.ASSETS,
    queryFn: async () => {
      const { assetsApi } = await import('../features/assets/api');
      return assetsApi.getAll();
    },
  });

  const createMutation = useMutation({
    mutationFn: equipmentsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.EQUIPMENTS });
      setIsModalOpen(false);
      setSelectedEquipment(null);
      toast.success('Equipo creado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al crear el equipo');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => equipmentsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.EQUIPMENTS });
      setIsModalOpen(false);
      setSelectedEquipment(null);
      toast.success('Equipo actualizado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al actualizar el equipo');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: equipmentsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.EQUIPMENTS });
      toast.success('Equipo eliminado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al eliminar el equipo');
    },
  });

  const assignToClientMutation = useMutation({
    mutationFn: ({ equipmentId, clientId }: { equipmentId: string; clientId: string }) =>
      equipmentsApi.assignToClient(equipmentId, clientId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.EQUIPMENTS });
      toast.success('Equipo asignado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al asignar el equipo');
    },
  });

  const unassignFromClientMutation = useMutation({
    mutationFn: equipmentsApi.unassignFromClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.EQUIPMENTS });
      toast.success('Equipo desasignado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al desasignar el equipo');
    },
  });

  // Filtrar equipos
  const filteredEquipments = equipments.filter((equipment) => {
    const matchesSearch =
      !searchQuery ||
      equipment.imei.toLowerCase().includes(searchQuery.toLowerCase()) ||
      equipment.serial.toLowerCase().includes(searchQuery.toLowerCase()) ||
      equipment.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      equipment.model.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus === 'all' || equipment.status === filterStatus;
    const matchesClient =
      filterClient === 'all' ||
      (filterClient === 'unassigned' && !equipment.client_id) ||
      equipment.client_id === filterClient;

    return matchesSearch && matchesStatus && matchesClient;
  });

  const handleSubmit = (data: any) => {
    if (selectedEquipment) {
      updateMutation.mutate({ id: selectedEquipment.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, imei: string) => {
    const confirmed = await confirmDialog.confirm({
      title: 'Eliminar Equipo',
      message: `¿Estás seguro de que deseas eliminar el equipo ${imei}? Esta acción no se puede deshacer.`,
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
    setSelectedEquipment(null);
  };

  const handleAssignToClient = (equipment: Equipment) => {
    setEquipmentToAssign(equipment);
    setIsAssignModalOpen(true);
  };

  const handleAssignSubmit = (clientId: string) => {
    if (equipmentToAssign) {
      assignToClientMutation.mutate({ equipmentId: equipmentToAssign.id, clientId });
      setIsAssignModalOpen(false);
      setEquipmentToAssign(null);
    }
  };

  const handleCloseAssignModal = () => {
    setIsAssignModalOpen(false);
    setEquipmentToAssign(null);
  };

  const handleUnassignFromClient = async (equipmentId: string, imei: string) => {
    const confirmed = await confirmDialog.confirm({
      title: 'Desasignar Equipo',
      message: `¿Desasignar el equipo ${imei} del cliente actual?`,
      confirmText: 'Desasignar',
      cancelText: 'Cancelar',
      variant: 'warning',
    });

    if (confirmed) {
      unassignFromClientMutation.mutate(equipmentId);
    }
  };

  const getClientName = (clientId?: string) => {
    if (!clientId) return 'Sin asignar';
    const client = clients.find((c) => c.id === clientId);
    return client?.company_name || clientId;
  };

  const getAssetName = (assetId?: string) => {
    if (!assetId) return null;
    const asset = assets.find((a) => a.id === assetId);
    return asset?.name || null;
  };

  const getStatusBadge = (status: Equipment['status']) => {
    const config = EQUIPMENT_STATUS_CONFIG[status];
    return (
      <Badge variant={status === 'active' ? 'success' : 'default'} className={config.bgColor + ' ' + config.textColor}>
        {config.label}
      </Badge>
    );
  };

  const stats = [
    {
      label: 'Total Equipos',
      value: equipments.length,
      color: 'bg-blue-50 text-blue-700',
    },
    {
      label: 'Activos',
      value: equipments.filter((e) => e.status === 'active').length,
      color: 'bg-green-50 text-green-700',
    },
    {
      label: 'Inactivos',
      value: equipments.filter((e) => e.status === 'inactive').length,
      color: 'bg-gray-100 text-gray-700',
    },
    {
      label: 'Disponibles',
      value: equipments.filter((e) => e.status === 'available').length,
      color: 'bg-purple-50 text-purple-700',
    },
    {
      label: 'Sin Asignar',
      value: equipments.filter((e) => !e.client_id).length,
      color: 'bg-yellow-50 text-yellow-700',
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
          <h1 className="text-2xl font-bold text-gray-900">Equipos GPS</h1>
          <p className="text-gray-600 mt-1">
            Gestión global de dispositivos GPS • {filteredEquipments.length} equipos
          </p>
        </div>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Nuevo Equipo
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.label}</p>
                <p className={`text-2xl font-bold mt-1 ${stat.color.split(' ')[1]}`}>{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-full ${stat.color} flex items-center justify-center`}>
                <Radio className="w-6 h-6" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar IMEI, serial, marca..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
            <option value="available">Disponibles</option>
          </select>

          {/* Client Filter */}
          <select
            value={filterClient}
            onChange={(e) => setFilterClient(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Todos los clientes</option>
            <option value="unassigned">Sin asignar</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.company_name}
              </option>
            ))}
          </select>

          {/* Clear Filters */}
          {(searchQuery || filterStatus !== 'all' || filterClient !== 'all') && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setFilterStatus('all');
                setFilterClient('all');
              }}
            >
              Limpiar filtros
            </Button>
          )}
        </div>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="p-6">
          <CardTitle>Lista de equipos GPS</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Equipo</TableHead>
                  <TableHead>Cliente Asignado</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Última Señal</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEquipments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No se encontraron equipos
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEquipments.map((equipment) => (
                    <TableRow key={equipment.id}>
                      <TableCell>
                        <div>
                          <div className="flex items-center gap-2">
                            <Radio className="w-4 h-4 text-gray-400" />
                            <span className="font-medium text-gray-900">{equipment.imei}</span>
                          </div>
                          <p className="text-sm text-gray-500 mt-0.5">
                            {equipment.brand} {equipment.model}
                          </p>
                          <p className="text-xs text-gray-400">S/N: {equipment.serial}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-gray-400" />
                            <span className={equipment.client_id ? 'text-gray-900' : 'text-gray-400'}>
                              {getClientName(equipment.client_id)}
                            </span>
                          </div>
                          {equipment.asset_id && getAssetName(equipment.asset_id) && (
                            <div className="flex items-center gap-2 mt-1">
                              <Box className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-500">
                                {getAssetName(equipment.asset_id)}
                              </span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(equipment.status)}</TableCell>
                      <TableCell>
                        {equipment.last_seen ? (
                          <span className="text-sm text-gray-600">
                            {formatRelativeTime(
                              Math.floor((Date.now() - new Date(equipment.last_seen).getTime()) / 60000)
                            )}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">Nunca</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {equipment.lat && equipment.lng ? (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <MapPin className="w-3 h-3" />
                            <span>
                              {equipment.lat.toFixed(4)}, {equipment.lng.toFixed(4)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Sin ubicación</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/equipos/${equipment.id}`)}
                            title="Ver detalles"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {equipment.client_id ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUnassignFromClient(equipment.id, equipment.imei)}
                              title="Desasignar de cliente"
                            >
                              <Unlink className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAssignToClient(equipment)}
                              title="Asignar a cliente"
                            >
                              <LinkIcon className="w-4 h-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(equipment)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(equipment.id, equipment.imei)}
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

      <EquipmentFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        equipment={selectedEquipment}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <AssignEquipmentModal
        isOpen={isAssignModalOpen}
        onClose={handleCloseAssignModal}
        onAssign={handleAssignSubmit}
        equipment={equipmentToAssign}
        clients={clients}
        isLoading={assignToClientMutation.isPending}
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
