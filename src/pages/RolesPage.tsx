import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { usersApi, type UserWithVehicles } from '../features/users/api';
import { QUERY_KEYS } from '../lib/constants';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { UserFormModal } from '../components/users/UserFormModal';
import { Plus, Edit, Trash2, Search, Shield, Users as UsersIcon, UserCog } from 'lucide-react';

export function RolesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithVehicles | null>(null);
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.USERS,
    queryFn: usersApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS });
      setIsModalOpen(false);
      setSelectedUser(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => usersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS });
      setIsModalOpen(false);
      setSelectedUser(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: usersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS });
    },
  });

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenModal = (user?: UserWithVehicles) => {
    setSelectedUser(user || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const handleSubmit = (data: any) => {
    if (selectedUser) {
      updateMutation.mutate({ id: selectedUser.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`¿Estás seguro de eliminar al usuario "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const getRoleBadge = (role: string) => {
    const config = {
      superuser: { label: 'Super Usuario', variant: 'default' as const, color: 'bg-purple-100 text-purple-700' },
      admin: { label: 'Administrador (Cliente)', variant: 'default' as const, color: 'bg-blue-100 text-blue-700' },
      'operator-admin': { label: 'Operador Admin', variant: 'default' as const, color: 'bg-green-100 text-green-700' },
      'operator-monitor': { label: 'Operador Monitor', variant: 'default' as const, color: 'bg-gray-100 text-gray-700' },
    };
    const roleConfig = config[role as keyof typeof config] || config['operator-monitor'];
    return (
      <Badge variant={roleConfig.variant} className={roleConfig.color}>
        {roleConfig.label}
      </Badge>
    );
  };

  const stats = [
    {
      label: 'Total Usuarios',
      value: users.length,
      icon: UsersIcon,
      color: 'bg-primary-100 text-primary-600',
    },
    {
      label: 'Administradores',
      value: users.filter((u) => u.role === 'admin').length,
      icon: UserCog,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      label: 'Clientes',
      value: users.filter((u) => u.role === 'client').length,
      icon: Shield,
      color: 'bg-green-100 text-green-600',
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
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios y Roles</h1>
          <p className="text-gray-600 mt-1">
            Administra usuarios, roles y asignación de vehículos • {filteredUsers.length} usuarios
          </p>
        </div>
        <Button variant="primary" onClick={() => handleOpenModal()}>
          <Plus className="w-4 h-4" />
          Nuevo Usuario
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Lista de usuarios</CardTitle>
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Buscar por nombre, usuario o email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Vehículos</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {user.email || <span className="text-gray-400">Sin email</span>}
                    </TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>
                      {user.role === 'client' ? (
                        <Badge variant="default">
                          {user.assigned_vehicles || 0} asignados
                        </Badge>
                      ) : (
                        <span className="text-gray-400 text-sm">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenModal(user)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(user.id, user.name)}
                          className="text-crit-600 hover:text-crit-700 hover:bg-crit-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No se encontraron usuarios</p>
            </div>
          )}
        </CardContent>
      </Card>

      <UserFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        user={selectedUser}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
