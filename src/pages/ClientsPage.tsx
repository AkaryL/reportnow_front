import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { clientsApi } from '../features/clients/api';
import { equipmentsApi } from '../features/equipments/api';
import { authApi } from '../features/auth/api';
import { QUERY_KEYS } from '../lib/constants';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Eye, Mail, Phone, Plus, Building2, Edit, Trash2, Radio, Users, Info, Search, Filter, LogIn } from 'lucide-react';
import { formatDate } from '../lib/utils';
import { ClientFormModal } from '../components/clients/ClientFormModal';
import type { Client } from '../lib/types';
import { useConfirm } from '../hooks/useConfirm';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../features/auth/hooks';

export function ClientsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const confirmDialog = useConfirm();
  const toast = useToast();
  const { user } = useAuth();

  const { data: clients = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.CLIENTS,
    queryFn: clientsApi.getAll,
  });

  const { data: equipments = [] } = useQuery({
    queryKey: QUERY_KEYS.EQUIPMENTS,
    queryFn: equipmentsApi.getAll,
  });

  const { data: users = [] } = useQuery({
    queryKey: QUERY_KEYS.USERS,
    queryFn: async () => {
      const { usersApi } = await import('../features/users/api');
      return usersApi.getAll();
    },
  });

  const createMutation = useMutation({
    mutationFn: clientsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CLIENTS });
      setIsModalOpen(false);
      setSelectedClient(null);
      toast.success('Cliente creado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al crear el cliente');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => clientsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CLIENTS });
      setIsModalOpen(false);
      setSelectedClient(null);
      toast.success('Cliente actualizado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al actualizar el cliente');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: clientsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CLIENTS });
      toast.success('Cliente eliminado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al eliminar el cliente');
    },
  });

  const handleCreateClient = () => {
    setSelectedClient(null);
    setIsModalOpen(true);
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setIsModalOpen(true);
  };

  const handleSubmit = (data: any) => {
    if (selectedClient) {
      // Don't send empty password when editing
      const updateData = { ...data };
      if (!updateData.password || updateData.password.trim() === '') {
        delete updateData.password;
      }
      updateMutation.mutate({ id: selectedClient.id, data: updateData });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDeleteClient = async (id: string, name: string) => {
    const confirmed = await confirmDialog.confirm({
      title: 'Eliminar Cliente',
      message: `¿Estás seguro de que deseas eliminar al cliente "${name}"? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });

    if (confirmed) {
      deleteMutation.mutate(id);
    }
  };

  const handleViewClient = (id: string) => {
    navigate(`/clientes/${id}`);
  };

  const handleLoginAsClient = async (client: Client) => {
    const confirmed = await confirmDialog.confirm({
      title: 'Iniciar sesión como cliente',
      message: `¿Deseas iniciar sesión como "${client.company_name}"? Tu sesión actual se cerrará.`,
      confirmText: 'Iniciar sesión',
      cancelText: 'Cancelar',
      variant: 'primary',
    });

    if (confirmed) {
      try {
        // Llamar al endpoint de login-as-client
        await authApi.loginAsClient(client.id);

        toast.success(`Sesión iniciada como ${client.company_name}`);

        // Redirigir al home
        navigate('/');

        // Recargar la página para actualizar el contexto de autenticación
        window.location.reload();
      } catch (error: any) {
        toast.error(error.message || 'Error al iniciar sesión como cliente');
      }
    }
  };

  // Helper para contar equipos del cliente
  const getClientEquipmentStats = (clientId: string) => {
    const clientEquipments = equipments.filter((eq) => eq.client_id === clientId);
    const active = clientEquipments.filter((eq) => eq.status === 'active').length;
    const inactive = clientEquipments.filter((eq) => eq.status === 'inactive').length;
    const total = clientEquipments.length;
    return { active, inactive, total };
  };

  // Helper para contar operadores del cliente
  const getClientOperatorsCount = (clientId: string) => {
    return users.filter(
      (u) => u.client_id === clientId && (u.role === 'operator-admin' || u.role === 'operator-monitor')
    ).length;
  };

  // Filtrar clientes por búsqueda y estatus
  const filteredClients = clients.filter((client) => {
    // Filtro de búsqueda
    const matchesSearch =
      searchQuery === '' ||
      client.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.contact_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.contact_phone.includes(searchQuery);

    // Filtro de estatus
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && client.status === 'active') ||
      (statusFilter === 'suspended' && client.status === 'suspended');

    return matchesSearch && matchesStatus;
  });

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
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-600 mt-1">
            Gestión de clientes y asignaciones • {filteredClients.length} de {clients.length} clientes
          </p>
        </div>
        <Button variant="primary" onClick={handleCreateClient}>
          <Plus className="w-4 h-4" />
          Nuevo Cliente
        </Button>
      </div>

      {/* Filtros y búsqueda */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Barra de búsqueda */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, empresa, email o teléfono..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Filtros de estatus */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-600" />
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === 'all' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('all')}
                >
                  Todos
                </Button>
                <Button
                  variant={statusFilter === 'active' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('active')}
                >
                  Activos
                </Button>
                <Button
                  variant={statusFilter === 'suspended' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('suspended')}
                >
                  Suspendidos
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-6">
          <CardTitle>Lista de clientes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Estatus</TableHead>
                <TableHead>
                  <div className="flex items-center gap-1.5">
                    Equipos Asignados
                    <div className="relative group">
                      <Info className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-50 w-56">
                        <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 shadow-lg">
                          <p className="font-semibold mb-1">Estados de equipos</p>
                          <p><span className="text-ok-400">Activos:</span> Equipos funcionando normalmente</p>
                          <p className="mt-1"><span className="text-gray-400">Inactivos:</span> Equipos apagados o sin señal</p>
                          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
                            <div className="border-4 border-transparent border-t-gray-900"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-1.5">
                    Operadores
                    <div className="relative group">
                      <Info className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-50 w-60">
                        <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 shadow-lg">
                          <p className="font-semibold mb-1">¿Qué son los operadores?</p>
                          <p>Usuarios creados por el cliente administrador para monitorear sus equipos.</p>
                          <p className="mt-1 text-gray-300">Cada operador tiene acceso limitado solo a los equipos de su cliente.</p>
                          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
                            <div className="border-4 border-transparent border-t-gray-900"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TableHead>
                <TableHead>Última actividad</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => {
                const equipmentStats = getClientEquipmentStats(client.id);
                const operatorsCount = getClientOperatorsCount(client.id);

                return (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                          <button
                            onClick={() => handleViewClient(client.id)}
                            className="font-medium text-gray-900 hover:text-primary-600 transition-colors text-left"
                          >
                            {client.company_name}
                          </button>
                          <p className="text-sm text-gray-500">{client.contact_name}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">{client.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">{client.contact_phone}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={client.status === 'active' ? 'success' : 'warning'}>
                        {client.status === 'active' ? 'Activo' : 'Suspendido'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Radio className="w-4 h-4 text-gray-400" />
                        <div>
                          {equipmentStats.total === 0 ? (
                            <span className="text-sm text-gray-400">Sin equipos</span>
                          ) : (
                            <div className="flex flex-col gap-0.5">
                              <span className="text-sm font-medium text-gray-900">
                                {equipmentStats.total} {equipmentStats.total === 1 ? 'equipo' : 'equipos'}
                              </span>
                              {equipmentStats.inactive > 0 ? (
                                <span className="text-xs text-gray-500">
                                  {equipmentStats.active} activos, {equipmentStats.inactive} inactivos
                                </span>
                              ) : (
                                <span className="text-xs text-ok-600">
                                  {equipmentStats.active} activos
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {operatorsCount} {operatorsCount === 1 ? 'operador' : 'operadores'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatDate(client.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {user?.role === 'superuser' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleLoginAsClient(client)}
                            className="text-primary-600 hover:text-primary-700"
                            title="Iniciar sesión como este cliente"
                          >
                            <LogIn className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewClient(client.id)}
                        >
                          <Eye className="w-4 h-4" />
                          Ver
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClient(client)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClient(client.id, client.company_name)}
                          className="text-crit-600 hover:text-crit-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Clientes</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{clients.length}</p>
              </div>
              <div className="bg-primary-100 p-3 rounded-lg">
                <Building2 className="w-6 h-6 text-primary-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Equipos asignados</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {equipments.filter((e) => e.client_id).length}
                </p>
              </div>
              <div className="bg-ok-100 p-3 rounded-lg">
                <Radio className="w-6 h-6 text-ok-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Operadores</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {users.filter((u) => u.role === 'operator-admin' || u.role === 'operator-monitor').length}
                </p>
              </div>
              <div className="bg-info-100 p-3 rounded-lg">
                <Users className="w-6 h-6 text-info-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <ClientFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedClient(null);
        }}
        onSubmit={handleSubmit}
        client={selectedClient}
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
