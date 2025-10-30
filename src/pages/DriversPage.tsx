import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { driversApi } from '../features/drivers/api';
import { QUERY_KEYS } from '../lib/constants';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { DriverFormModal } from '../components/drivers/DriverFormModal';
import {
  UserCircle,
  Plus,
  Edit,
  Trash2,
  Search,
  Phone,
  Mail,
  CreditCard,
  Calendar,
} from 'lucide-react';
import type { Driver } from '../lib/types';
import { useAuth } from '../features/auth/hooks';
import { useToast } from '../hooks/useToast';
import { useConfirm } from '../hooks/useConfirm';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

export function DriversPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const toast = useToast();
  const confirmDialog = useConfirm();

  const { data: drivers = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.DRIVERS,
    queryFn: driversApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: driversApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DRIVERS });
      setIsModalOpen(false);
      setSelectedDriver(null);
      toast.success('Conductor creado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al crear el conductor');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => driversApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DRIVERS });
      setIsModalOpen(false);
      setSelectedDriver(null);
      toast.success('Conductor actualizado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al actualizar el conductor');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: driversApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DRIVERS });
      toast.success('Conductor eliminado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al eliminar el conductor');
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: driversApi.toggleStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DRIVERS });
      toast.success('Estado actualizado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al cambiar el estado del conductor');
    },
  });

  // Filtrar conductores
  const filteredDrivers = drivers.filter((driver) => {
    const matchesSearch =
      !searchQuery ||
      driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.license_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.phone.includes(searchQuery);

    const matchesStatus = filterStatus === 'all' || driver.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const handleSubmit = (data: any) => {
    if (selectedDriver) {
      updateMutation.mutate({ id: selectedDriver.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (driver: Driver) => {
    setSelectedDriver(driver);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await confirmDialog.confirm({
      title: 'Eliminar Conductor',
      message: `¿Estás seguro de que deseas eliminar al conductor ${name}? Esta acción no se puede deshacer.`,
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
    setSelectedDriver(null);
  };

  const handleToggleStatus = (id: string) => {
    toggleStatusMutation.mutate(id);
  };

  const getStatusBadge = (status: Driver['status']) => {
    const config = {
      available: { label: 'Disponible', color: 'bg-ok-50 text-ok-700' },
      on_trip: { label: 'En viaje', color: 'bg-info-50 text-info-700' },
      inactive: { label: 'Inactivo', color: 'bg-gray-100 text-gray-700' },
    };
    const statusConfig = config[status];
    return (
      <Badge
        variant={status === 'available' ? 'success' : status === 'on_trip' ? 'default' : 'default'}
        className={statusConfig.color}
      >
        {statusConfig.label}
      </Badge>
    );
  };

  const isLicenseExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date();
  };

  const isLicenseExpiringSoon = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const daysUntilExpiry = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
  };

  const stats = [
    {
      label: 'Total Conductores',
      value: drivers.length,
      color: 'bg-blue-50 text-blue-700',
    },
    {
      label: 'Disponibles',
      value: drivers.filter((d) => d.status === 'available').length,
      color: 'bg-ok-50 text-ok-700',
    },
    {
      label: 'En viaje',
      value: drivers.filter((d) => d.status === 'on_trip').length,
      color: 'bg-info-50 text-info-700',
    },
    {
      label: 'Inactivos',
      value: drivers.filter((d) => d.status === 'inactive').length,
      color: 'bg-gray-100 text-gray-700',
    },
    {
      label: 'Licencias por vencer',
      value: drivers.filter((d) => isLicenseExpiringSoon(d.license_expiry) && !isLicenseExpired(d.license_expiry))
        .length,
      color: 'bg-warn-50 text-warn-700',
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
          <h1 className="text-2xl font-bold text-gray-900">Conductores</h1>
          <p className="text-gray-600 mt-1">
            Gestión de conductores • {filteredDrivers.length} conductores
          </p>
        </div>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Nuevo Conductor
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
                <UserCircle className="w-6 h-6" />
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
              placeholder="Buscar por nombre, licencia, teléfono..."
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
            <option value="on_trip">En viaje</option>
            <option value="inactive">Inactivos</option>
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
          <CardTitle>Lista de conductores</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Conductor</TableHead>
                  <TableHead>Licencia</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Vencimiento Licencia</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDrivers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No se encontraron conductores
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDrivers.map((driver) => {
                    const expired = isLicenseExpired(driver.license_expiry);
                    const expiringSoon = isLicenseExpiringSoon(driver.license_expiry);

                    return (
                      <TableRow key={driver.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <UserCircle className="w-5 h-5 text-gray-400" />
                            <div>
                              <div className="font-medium text-gray-900">{driver.name}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">{driver.license_number}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600">{driver.phone}</span>
                            </div>
                            {driver.email && (
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-600">{driver.email}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(driver.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <div>
                              <span
                                className={`text-sm ${
                                  expired
                                    ? 'text-red-600 font-semibold'
                                    : expiringSoon
                                    ? 'text-yellow-600 font-semibold'
                                    : 'text-gray-600'
                                }`}
                              >
                                {new Date(driver.license_expiry).toLocaleDateString('es-MX')}
                              </span>
                              {expired && (
                                <Badge variant="default" className="ml-2 bg-crit-50 text-crit-700">
                                  Vencida
                                </Badge>
                              )}
                              {expiringSoon && !expired && (
                                <Badge variant="default" className="ml-2 bg-warn-50 text-warn-700">
                                  Por vencer
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {user?.role !== 'operator-monitor' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleToggleStatus(driver.id)}
                                  title={driver.status === 'inactive' ? 'Activar' : 'Desactivar'}
                                >
                                  {driver.status === 'inactive' ? 'Activar' : 'Desactivar'}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(driver)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(driver.id, driver.name)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
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

      <DriverFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        driver={selectedDriver}
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
