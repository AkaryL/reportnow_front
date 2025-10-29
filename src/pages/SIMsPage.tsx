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
} from 'lucide-react';
import type { SIM } from '../lib/types';
import { useAuth } from '../features/auth/hooks';

export function SIMsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSIM, setSelectedSIM] = useState<SIM | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: sims = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.SIMS,
    queryFn: simsApi.getAll,
  });

  const { data: equipments = [] } = useQuery({
    queryKey: QUERY_KEYS.EQUIPMENTS,
    queryFn: equipmentsApi.getAll,
  });

  const deleteMutation = useMutation({
    mutationFn: simsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SIMS });
    },
    onError: (error: any) => {
      alert(error.message || 'Error al eliminar la SIM');
    },
  });

  const assignToEquipmentMutation = useMutation({
    mutationFn: ({ simId, equipmentId }: { simId: string; equipmentId: string }) =>
      simsApi.assignToEquipment(simId, equipmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SIMS });
      alert('SIM asignada exitosamente');
    },
    onError: (error: any) => {
      alert(error.message || 'Error al asignar la SIM');
    },
  });

  const unassignFromEquipmentMutation = useMutation({
    mutationFn: simsApi.unassignFromEquipment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SIMS });
      alert('SIM desasignada exitosamente');
    },
    onError: (error: any) => {
      alert(error.message || 'Error al desasignar la SIM');
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: simsApi.toggleStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SIMS });
    },
    onError: (error: any) => {
      alert(error.message || 'Error al cambiar el estado de la SIM');
    },
  });

  // Filtrar SIMs
  const filteredSIMs = sims.filter((sim) => {
    const matchesSearch =
      !searchQuery ||
      sim.iccid.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sim.phone_number.includes(searchQuery) ||
      sim.carrier.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus === 'all' || sim.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const handleDelete = (id: string, iccid: string) => {
    if (confirm(`¿Estás seguro de eliminar la SIM ${iccid}?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleAssignToEquipment = (simId: string) => {
    const equipmentId = prompt('Ingresa el ID del equipo:');
    if (equipmentId) {
      assignToEquipmentMutation.mutate({ simId, equipmentId });
    }
  };

  const handleUnassignFromEquipment = (simId: string, iccid: string) => {
    if (confirm(`¿Desasignar la SIM ${iccid} del equipo actual?`)) {
      unassignFromEquipmentMutation.mutate(simId);
    }
  };

  const handleToggleStatus = (id: string) => {
    toggleStatusMutation.mutate(id);
  };

  const getEquipmentIMEI = (simId: string) => {
    const equipment = equipments.find((e) => e.sim_id === simId);
    return equipment?.imei || '-';
  };

  const getStatusBadge = (status: SIM['status']) => {
    const config = {
      available: { label: 'Disponible', color: 'bg-ok-50 text-ok-700' },
      active: { label: 'Activa', color: 'bg-info-50 text-info-700' },
      suspended: { label: 'Suspendida', color: 'bg-warn-50 text-warn-700' },
      inactive: { label: 'Inactiva', color: 'bg-gray-100 text-gray-700' },
    };
    const statusConfig = config[status];
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

  const stats = [
    {
      label: 'Total SIMs',
      value: sims.length,
      color: 'bg-blue-50 text-blue-700',
    },
    {
      label: 'Activas',
      value: sims.filter((s) => s.status === 'active').length,
      color: 'bg-info-50 text-info-700',
    },
    {
      label: 'Disponibles',
      value: sims.filter((s) => s.status === 'available').length,
      color: 'bg-ok-50 text-ok-700',
    },
    {
      label: 'Suspendidas',
      value: sims.filter((s) => s.status === 'suspended').length,
      color: 'bg-warn-50 text-warn-700',
    },
    {
      label: 'Sin Asignar',
      value: sims.filter((s) => !s.equipment_id).length,
      color: 'bg-purple-50 text-purple-700',
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
          <h1 className="text-2xl font-bold text-gray-900">Tarjetas SIM</h1>
          <p className="text-gray-600 mt-1">
            Gestión de tarjetas SIM para equipos GPS • {filteredSIMs.length} SIMs
          </p>
        </div>
        <Button variant="primary" onClick={() => alert('TODO: Implementar modal de creación')}>
          <Plus className="w-4 h-4" />
          Nueva SIM
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
                <CreditCard className="w-6 h-6" />
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
              placeholder="Buscar ICCID, teléfono, operador..."
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
            <option value="available">Disponibles</option>
            <option value="active">Activas</option>
            <option value="suspended">Suspendidas</option>
            <option value="inactive">Inactivas</option>
          </select>

          {/* Clear Filters */}
          {(searchQuery || filterStatus !== 'all') && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('');
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
          <CardTitle>Lista de SIMs</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SIM</TableHead>
                  <TableHead>Operador</TableHead>
                  <TableHead>Equipo Asignado</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Uso de Datos</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSIMs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No se encontraron SIMs
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSIMs.map((sim) => (
                    <TableRow key={sim.id}>
                      <TableCell>
                        <div>
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-gray-400" />
                            <span className="font-medium text-gray-900">{sim.iccid}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Phone className="w-3 h-3 text-gray-400" />
                            <p className="text-sm text-gray-500">{sim.phone_number}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">{sim.carrier}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Radio className="w-4 h-4 text-gray-400" />
                          <span className={sim.equipment_id ? 'text-gray-900' : 'text-gray-400'}>
                            {getEquipmentIMEI(sim.id)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(sim.status)}</TableCell>
                      <TableCell>
                        <div className="min-w-[200px]">
                          {formatDataUsage(sim.data_used_mb, sim.data_limit_mb)}
                        </div>
                      </TableCell>
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
                              onClick={() => handleAssignToEquipment(sim.id)}
                              title="Asignar a equipo"
                            >
                              <LinkIcon className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(sim.id)}
                            title={sim.status === 'inactive' ? 'Activar' : 'Desactivar'}
                          >
                            {sim.status === 'inactive' ? 'Activar' : 'Desactivar'}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => alert('TODO: Editar SIM')}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(sim.id, sim.iccid)}
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
    </div>
  );
}
