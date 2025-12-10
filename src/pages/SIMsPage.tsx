import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { simsApi } from '../features/sims/api';
import { equipmentsApi } from '../features/equipments/api';
import { QUERY_KEYS } from '../lib/constants';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { SIMFormModal } from '../components/sims/SIMFormModal';
import { AssignSIMModal } from '../components/sims/AssignSIMModal';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Phone,
  CreditCard,
  Radio,
  Link as LinkIcon,
  Unlink,
  TrendingUp,
  Building2,
  Box,
  Download,
} from 'lucide-react';
import { generateListPDF } from '../lib/pdfGenerator';
import type { SIM } from '../lib/types';
import { useAuth } from '../features/auth/hooks';
import { useToast } from '../hooks/useToast';
import { useConfirm } from '../hooks/useConfirm';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

export function SIMsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedSIM, setSelectedSIM] = useState<SIM | null>(null);
  const [simToAssign, setSimToAssign] = useState<SIM | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterClient, setFilterClient] = useState<string>('all');
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const toast = useToast();
  const confirmDialog = useConfirm();

  const { data: sims = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.SIMS,
    queryFn: simsApi.getAll,
  });

  const { data: equipments = [] } = useQuery({
    queryKey: QUERY_KEYS.EQUIPMENTS,
    queryFn: equipmentsApi.getAll,
  });

  const { data: clients = [] } = useQuery({
    queryKey: QUERY_KEYS.CLIENTS,
    queryFn: async () => {
      const { clientsApi } = await import('../features/clients/api');
      return clientsApi.getAll();
    },
    enabled: !!user?.role && user.role === 'superuser',
  });

  const { data: assets = [] } = useQuery({
    queryKey: QUERY_KEYS.ASSETS,
    queryFn: async () => {
      const { assetsApi } = await import('../features/assets/api');
      return assetsApi.getAll();
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: simsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SIMS });
      setIsModalOpen(false);
      setSelectedSIM(null);
      toast.success('SIM creada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al crear la SIM');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => simsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SIMS });
      setIsModalOpen(false);
      setSelectedSIM(null);
      toast.success('SIM actualizada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al actualizar la SIM');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: simsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SIMS });
      toast.success('SIM eliminada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al eliminar la SIM');
    },
  });

  const assignToEquipmentMutation = useMutation({
    mutationFn: ({ simId, equipmentId }: { simId: string; equipmentId: string }) =>
      simsApi.assignToEquipment(simId, equipmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SIMS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.EQUIPMENTS });
      toast.success('SIM asignada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al asignar la SIM');
    },
  });

  const unassignFromEquipmentMutation = useMutation({
    mutationFn: simsApi.unassignFromEquipment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SIMS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.EQUIPMENTS });
      toast.success('SIM desasignada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al desasignar la SIM');
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: simsApi.toggleStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SIMS });
      toast.success('Estado actualizado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al cambiar el estado de la SIM');
    },
  });

  // Calcular el estado dinámico de una SIM basado en su equipo
  const getSIMStatus = (sim: SIM): 'Active' | 'Inactive' => {
    // Si no tiene equipo asignado, está disponible
    if (!sim.equipment_id && !sim.assigned_to_equipment_id) {
      return 'Active';
    }

    // Tiene equipo asignado, buscar el estado del equipo
    const equipmentId = sim.equipment_id || sim.assigned_to_equipment_id;
    const equipment = equipments.find((e) => e.id === equipmentId);

    // El equipo siempre debe existir, pero por seguridad
    if (!equipment) {
      console.warn(`Equipo ${equipmentId} no encontrado para SIM ${sim.iccid}`);
      return 'Active';
    }

    // El estado de la SIM refleja el estado del equipo
    return equipment.status === 'Inactive' ? 'Inactive' : 'Active';
  };

  // Helper para obtener el nombre del cliente
  const getClientName = (clientId?: string) => {
    if (!clientId) return 'Sin asignar';
    const client = clients.find((c) => c.id === clientId);
    return client?.company_name || 'Cliente desconocido';
  };

  // Helper para obtener el nombre del activo
  const getAssetName = (assetId?: string) => {
    if (!assetId) return null;
    const asset = assets.find((a) => a.id === assetId);
    return asset?.name || null;
  };

  // Helper para obtener el equipo de una SIM
  const getEquipmentForSIM = (sim: SIM) => {
    const equipmentId = sim.equipment_id || sim.assigned_to_equipment_id;
    if (!equipmentId) return null;
    return equipments.find((e) => e.id === equipmentId) || null;
  };

  // Filtrar SIMs
  const filteredSIMs = sims.filter((sim) => {
    const matchesSearch =
      !searchQuery ||
      sim.iccid.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sim.phone_number.includes(searchQuery) ||
      sim.carrier.toLowerCase().includes(searchQuery.toLowerCase());

    const dynamicStatus = getSIMStatus(sim);
    const matchesStatus = filterStatus === 'all' || dynamicStatus === filterStatus;

    // Filtrar por cliente
    let matchesClient = true;
    if (filterClient !== 'all') {
      const equipment = getEquipmentForSIM(sim);
      if (filterClient === 'unassigned') {
        matchesClient = !equipment || !equipment.client_id;
      } else {
        matchesClient = equipment?.client_id === filterClient;
      }
    }

    return matchesSearch && matchesStatus && matchesClient;
  });

  const handleSubmit = (data: any) => {
    if (selectedSIM) {
      updateMutation.mutate({ id: selectedSIM.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (sim: SIM) => {
    setSelectedSIM(sim);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, iccid: string) => {
    const confirmed = await confirmDialog.confirm({
      title: 'Eliminar SIM',
      message: `¿Estás seguro de que deseas eliminar la SIM ${iccid}? Esta acción no se puede deshacer.`,
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
    setSelectedSIM(null);
  };

  const handleAssignToEquipment = (sim: SIM) => {
    setSimToAssign(sim);
    setIsAssignModalOpen(true);
  };

  const handleAssignSubmit = (equipmentId: string) => {
    if (simToAssign) {
      assignToEquipmentMutation.mutate({ simId: simToAssign.id, equipmentId });
      setIsAssignModalOpen(false);
      setSimToAssign(null);
    }
  };

  const handleCloseAssignModal = () => {
    setIsAssignModalOpen(false);
    setSimToAssign(null);
  };

  const handleUnassignFromEquipment = async (simId: string, iccid: string) => {
    const confirmed = await confirmDialog.confirm({
      title: 'Desasignar SIM',
      message: `¿Deseas desasignar la SIM ${iccid} del equipo actual?`,
      confirmText: 'Desasignar',
      cancelText: 'Cancelar',
      variant: 'warning',
    });

    if (confirmed) {
      unassignFromEquipmentMutation.mutate(simId);
    }
  };

  const handleToggleStatus = (id: string) => {
    toggleStatusMutation.mutate(id);
  };

  const getEquipmentIMEI = (simId: string) => {
    const equipment = equipments.find((e) => e.sim_id === simId);
    return equipment?.imei || null;
  };

  // Obtener equipos disponibles (sin SIM asignada)
  const availableEquipments = equipments.filter((e) => !e.sim_id);

  const getStatusBadge = (status: SIM['status']) => {
    const config = {
      available: { label: 'Disponible', color: 'bg-ok-50 text-ok-700' },
      active: { label: 'Activa', color: 'bg-info-50 text-info-700' },
      suspended: { label: 'Suspendida', color: 'bg-warn-50 text-warn-700' },
      inactive: { label: 'Inactiva', color: 'bg-gray-100 text-gray-700' },
    };
    const statusConfig = config[status] || config.inactive; // Fallback a inactive si el status no existe
    return (
      <Badge
        variant={status === 'active' ? 'success' : status === 'available' ? 'default' : 'default'}
        className={statusConfig.color}
      >
        {statusConfig.label}
      </Badge>
    );
  };

  const formatDataUsage = (usedMb: number, limitMb?: number) => {
    if (!limitMb) return `${usedMb} MB`;
    const percentage = (usedMb / limitMb) * 100;
    const isNearLimit = percentage >= 80;
    const isOverLimit = percentage >= 100;

    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className={isOverLimit ? 'text-red-600 font-semibold' : isNearLimit ? 'text-yellow-600' : ''}>
            {usedMb} MB / {limitMb} MB
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full ${isOverLimit ? 'bg-red-500' : isNearLimit ? 'bg-yellow-500' : 'bg-blue-500'}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          ></div>
        </div>
        {isNearLimit && (
          <Badge variant="default" className={isOverLimit ? 'bg-crit-50 text-crit-700' : 'bg-warn-50 text-warn-700'}>
            {isOverLimit ? 'Límite excedido' : 'Cerca del límite'}
          </Badge>
        )}
      </div>
    );
  };

  // Calcular stats basados en el estado dinámico
  const stats = [
    {
      label: 'Total SIMs',
      value: sims.length,
      bgColor: 'bg-blue-50 dark:bg-blue-900/30',
      textColor: 'text-blue-700 dark:text-blue-400',
    },
    {
      label: 'Activas',
      value: sims.filter((s) => getSIMStatus(s) === 'Active').length,
      bgColor: 'bg-info-50 dark:bg-info-900/30',
      textColor: 'text-info-700 dark:text-info-400',
    },
    {
      label: 'Inactivas',
      value: sims.filter((s) => getSIMStatus(s) === 'Inactive').length,
      bgColor: 'bg-gray-100 dark:bg-gray-700',
      textColor: 'text-gray-700 dark:text-gray-300',
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tarjetas SIM</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gestión de tarjetas SIM para equipos GPS • {filteredSIMs.length} SIMs
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => generateListPDF({
              title: 'Lista de Tarjetas SIM',
              subtitle: `${filteredSIMs.length} SIMs encontradas`,
              columns: [
                { header: 'ICCID', key: 'iccid' },
                { header: 'Telefono', key: 'phone' },
                { header: 'Operador', key: 'carrier' },
                { header: 'Plan', key: 'plan' },
                { header: 'Estado', key: 'status' },
              ],
              data: filteredSIMs.map(s => ({
                iccid: s.iccid,
                phone: s.phone_number,
                carrier: s.carrier,
                plan: s.data_plan || '-',
                status: s.status === 'active' ? 'Activa' : s.status === 'inactive' ? 'Inactiva' : 'Suspendida',
              })),
              filename: 'tarjetas_sim',
              filters: filterStatus !== 'all' ? [{ label: 'Estado', value: filterStatus }] : undefined,
            })}
          >
            <Download className="w-4 h-4" />
            PDF
          </Button>
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4" />
            Nueva SIM
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
                <p className={`text-2xl font-bold mt-1 ${stat.textColor}`}>{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-full ${stat.bgColor} flex items-center justify-center`}>
                <CreditCard className={`w-6 h-6 ${stat.textColor}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar ICCID, teléfono, compañía..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activas</option>
            <option value="inactive">Inactivas</option>
          </select>

          {/* Client Filter */}
          <select
            value={filterClient}
            onChange={(e) => setFilterClient(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
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
          <CardTitle>Lista de SIMs</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SIM</TableHead>
                  <TableHead>Compañía</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Equipo Asignado</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSIMs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No se encontraron SIMs
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSIMs.map((sim) => {
                    const dynamicStatus = getSIMStatus(sim);
                    const equipmentIMEI = getEquipmentIMEI(sim.id);
                    const equipment = getEquipmentForSIM(sim);
                    const clientName = equipment ? getClientName(equipment.client_id) : 'Sin asignar';
                    const assetName = equipment ? getAssetName(equipment.asset_id) : null;

                    return (
                      <TableRow key={sim.id}>
                        <TableCell>
                          <div>
                            <div className="flex items-center gap-2">
                              <CreditCard className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                              <span className="font-medium text-gray-900 dark:text-white">{sim.iccid}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Phone className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                              <p className="text-sm text-gray-500 dark:text-gray-400">{sim.phone_number}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600 dark:text-gray-300">{sim.carrier}</span>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                              <span className={equipment?.client_id ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}>
                                {clientName}
                              </span>
                            </div>
                            {assetName && (
                              <div className="flex items-center gap-2 mt-1">
                                <Box className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                                <span className="text-xs text-gray-500 dark:text-gray-400">{assetName}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Radio className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                            <span className={equipmentIMEI ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}>
                              {equipmentIMEI || 'Sin asignar'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(dynamicStatus)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {sim.equipment_id ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUnassignFromEquipment(sim.id, sim.iccid)}
                                title="Desasignar de equipo"
                              >
                                <Unlink className="w-4 h-4" />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleAssignToEquipment(sim)}
                                title="Asignar a equipo"
                              >
                                <LinkIcon className="w-4 h-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(sim)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(sim.id, sim.iccid)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/30"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                    </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <SIMFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        sim={selectedSIM}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <AssignSIMModal
        isOpen={isAssignModalOpen}
        onClose={handleCloseAssignModal}
        onAssign={handleAssignSubmit}
        sim={simToAssign}
        availableEquipments={availableEquipments}
        isLoading={assignToEquipmentMutation.isPending}
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
