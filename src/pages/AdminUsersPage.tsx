import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../features/users/api';
import { clientsApi } from '../features/clients/api';
import { QUERY_KEYS } from '../lib/constants';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Plus, Eye, Trash2, Users, Shield, User } from 'lucide-react';
import { formatDate } from '../lib/utils';
import { useAuth } from '../features/auth/hooks';
import type { User as UserType } from '../lib/types';

const ROLE_LABELS: Record<string, string> = {
  superuser: 'Superusuario',
  admin: 'Administrador Cliente',
  'operator_admin': 'Operador Admin',
  'operator_monitor': 'Operador Monitor',
};

const ROLE_COLORS: Record<string, string> = {
  superuser: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  admin: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'operator_admin': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'operator_monitor': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
};

export function AdminUsersPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');

  // Fetch all users
  const { data: users = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.USERS,
    queryFn: usersApi.getAll,
  });

  // Fetch clients para mostrar nombres
  const { data: clients = [] } = useQuery({
    queryKey: QUERY_KEYS.CLIENTS,
    queryFn: clientsApi.getAll,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: usersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS });
    },
  });

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`¿Está seguro de que desea eliminar el usuario "${name}"?`)) {
      await deleteMutation.mutateAsync(id);
    }
  };

  // Get client name
  const getClientName = (clientId?: string) => {
    if (!clientId) return 'N/A';
    const client = clients.find(c => c.id === clientId);
    return client?.company_name || 'Cliente desconocido';
  };

  // Get current user
  const { user: currentUser } = useAuth();

  // Filter users
  const filteredUsers = users.filter((user) => {
    // Si el usuario no es superuser, solo mostrar usuarios de su cliente
    if (currentUser?.role !== 'superuser' && currentUser?.client_id) {
      if (user.client_id !== currentUser.client_id) {
        return false;
      }
    }

    const matchesSearch =
      !searchQuery ||
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = filterRole === 'all' || user.role === filterRole;

    return matchesSearch && matchesRole;
  });

  // Filtrar usuarios por client para estadísticas
  const usersForStats = users.filter((user) => {
    if (currentUser?.role !== 'superuser' && currentUser?.client_id) {
      if (user.client_id !== currentUser.client_id) {
        return false;
      }
    }
    return true;
  });

  // Calculate stats
  const stats = {
    total: usersForStats.length,
    superusers: usersForStats.filter(u => u.role === 'superuser').length,
    admins: usersForStats.filter(u => u.role === 'admin').length,
    operators: usersForStats.filter(u => u.role === 'operator_admin' || u.role === 'operator_monitor').length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Usuarios del Sistema</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Gestión de todos los usuarios registrados en el sistema
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Usuarios</p>
              <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">{stats.total}</p>
            </div>
            <Users className="w-6 h-6 text-gray-400 dark:text-gray-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Superusuarios</p>
              <p className="text-2xl font-bold mt-1 text-purple-600 dark:text-purple-400">{stats.superusers}</p>
            </div>
            <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Administradores</p>
              <p className="text-2xl font-bold mt-1 text-blue-600 dark:text-blue-400">{stats.admins}</p>
            </div>
            <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Operadores</p>
              <p className="text-2xl font-bold mt-1 text-green-600 dark:text-green-400">{stats.operators}</p>
            </div>
            <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Buscar usuario
            </label>
            <Input
              type="text"
              placeholder="Buscar por nombre, usuario o email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Filtrar por rol
            </label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">Todos los roles</option>
              <option value="superuser">Superusuarios</option>
              <option value="admin">Administradores Cliente</option>
              <option value="operator_admin">Operadores Admin</option>
              <option value="operator_monitor">Operadores Monitor</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader className="p-6">
          <CardTitle>Lista de Usuarios ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Fecha de Creación</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium text-gray-900 dark:text-white">{user.name}</TableCell>
                    <TableCell>
                      <Badge variant="default" className="bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                        {user.username}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-600 dark:text-gray-400">{user.email || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge className={ROLE_COLORS[user.role] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}>
                        {ROLE_LABELS[user.role] || user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-600 dark:text-gray-400">
                      {user.client_id ? (
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                          <span className="text-sm">{getClientName(user.client_id)}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500 text-sm">Sin cliente</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                      {user.created_at ? formatDate(user.created_at) : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {user.role === 'admin' && user.client_id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/clientes/${user.client_id}`)}
                            title="Ver detalles del cliente"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(user.id, user.name)}
                          className="text-crit-600 hover:text-crit-700"
                          title="Eliminar usuario"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredUsers.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  {searchQuery || filterRole !== 'all'
                    ? 'No se encontraron usuarios con los filtros aplicados'
                    : 'No hay usuarios registrados'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
