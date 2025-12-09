import { useState } from 'react';
import { useAuth } from '../features/auth/hooks';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../features/users/api';
import { QUERY_KEYS } from '../lib/constants';
import { Card } from '../components/ui/Card';
import { ClientCard } from '../components/ui/ClientCard';
import { Topbar } from '../components/Topbar';
import { Button } from '../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { UserFormModal } from '../components/users/UserFormModal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { UserCircle, Mail, Building2, Shield, Calendar, Plus, Edit, Trash2, Users as UsersIcon } from 'lucide-react';
import { formatDate } from '../lib/utils';
import { useToast } from '../hooks/useToast';
import { useConfirm } from '../hooks/useConfirm';
import type { UserWithVehicles } from '../features/users/api';

export function AccountPage() {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithVehicles | null>(null);
  const queryClient = useQueryClient();
  const toast = useToast();
  const confirmDialog = useConfirm();

  const isAdmin = user?.role === 'admin';

  // Query para obtener todos los usuarios (solo si es admin)
  const { data: allUsers = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: QUERY_KEYS.USERS,
    queryFn: usersApi.getAll,
    enabled: isAdmin,
  });

  // Filtrar solo operadores del mismo cliente que el admin
  const operators = allUsers.filter(
    (u) =>
      u.client_id === user?.client_id &&
      (u.role === 'operator_admin' || u.role === 'operator_monitor')
  );

  const createMutation = useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS });
      setIsModalOpen(false);
      setSelectedUser(null);
      toast.success('Operador creado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al crear el operador');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => usersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS });
      setIsModalOpen(false);
      setSelectedUser(null);
      toast.success('Operador actualizado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al actualizar el operador');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: usersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS });
      toast.success('Operador eliminado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al eliminar el operador');
    },
  });

  const handleSubmit = (data: any) => {
    if (selectedUser) {
      updateMutation.mutate({ id: selectedUser.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (operator: UserWithVehicles) => {
    setSelectedUser(operator);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await confirmDialog.confirm({
      title: 'Eliminar Operador',
      message: `¿Estás seguro de que deseas eliminar al operador "${name}"? Esta acción no se puede deshacer.`,
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
    setSelectedUser(null);
  };

  const getRoleBadge = (role: string) => {
    const config = {
      'operator_admin': { label: 'Admin', color: 'bg-blue-50 text-blue-700' },
      'operator_monitor': { label: 'Monitor', color: 'bg-purple-50 text-purple-700' },
    };
    const roleConfig = config[role as keyof typeof config];
    if (!roleConfig) return null;
    return <Badge className={roleConfig.color}>{roleConfig.label}</Badge>;
  };

  if (!user) {
    return null;
  }

  const isClient = user.role === 'admin';
  const CardComponent = isClient ? ClientCard : Card;

  return (
    <div className="space-y-0">
      {/* Topbar - solo para admin/superuser */}
      {!isClient && (
        <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-6">
          <Topbar
            title="Mi Cuenta"
            subtitle="Información de tu perfil y organización"
          />
        </div>
      )}

      <div className={isClient ? 'space-y-5' : 'pt-6 space-y-5'}>
        {/* Header para cliente */}
        {isClient && (
          <div className="mb-6">
            <h1 className="client-heading text-3xl mb-2">Mi Cuenta</h1>
            <p className="client-subheading">Información de tu perfil y organización</p>
          </div>
        )}

        {/* Información del Usuario */}
        <CardComponent className={isClient ? 'p-6' : 'p-6'}>
          <div className="flex items-start gap-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 ${
              isClient ? 'bg-gradient-to-br from-cyan-500 to-blue-500' : 'bg-primary/10'
            }`}>
              <UserCircle className={`w-10 h-10 ${isClient ? 'text-white' : 'text-primary'}`} />
            </div>
            <div className="flex-1">
              <h2 className={`text-2xl font-bold ${isClient ? 'client-text-primary' : 'text-gray-900 dark:text-white'}`}>
                {user.name}
              </h2>
              <p className={`text-sm capitalize mt-1 ${isClient ? 'client-text-secondary' : 'text-gray-500'}`}>
                {user.role === 'admin' ? 'Administrador (Cliente)' : user.role === 'operator_admin' ? 'Operador Administrador' : user.role === 'operator_monitor' ? 'Operador Monitor' : user.role}
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email */}
            <div className={`flex items-start gap-3 p-4 rounded-lg ${
              isClient ? 'bg-white/5 border border-white/10' : 'bg-gray-50 dark:bg-gray-700/50'
            }`}>
              <Mail className={`w-5 h-5 mt-0.5 ${isClient ? 'text-cyan-400' : 'text-gray-500'}`} />
              <div>
                <p className={`text-xs mb-1 ${isClient ? 'client-text-tertiary' : 'text-gray-500 dark:text-gray-400'}`}>
                  Correo electrónico
                </p>
                <p className={`text-sm font-medium ${isClient ? 'client-text-primary' : 'text-gray-900 dark:text-white'}`}>
                  {user.email}
                </p>
              </div>
            </div>

            {/* Cliente/Organización */}
            {user.client_id && (
              <div className={`flex items-start gap-3 p-4 rounded-lg ${
                isClient ? 'bg-white/5 border border-white/10' : 'bg-gray-50 dark:bg-gray-700/50'
              }`}>
                <Building2 className={`w-5 h-5 mt-0.5 ${isClient ? 'text-green-400' : 'text-gray-500'}`} />
                <div>
                  <p className={`text-xs mb-1 ${isClient ? 'client-text-tertiary' : 'text-gray-500 dark:text-gray-400'}`}>
                    Organización
                  </p>
                  <p className={`text-sm font-medium ${isClient ? 'client-text-primary' : 'text-gray-900 dark:text-white'}`}>
                    Cliente ID: {user.client_id}
                  </p>
                </div>
              </div>
            )}

            {/* Rol */}
            <div className={`flex items-start gap-3 p-4 rounded-lg ${
              isClient ? 'bg-white/5 border border-white/10' : 'bg-gray-50 dark:bg-gray-700/50'
            }`}>
              <Shield className={`w-5 h-5 mt-0.5 ${isClient ? 'text-blue-400' : 'text-gray-500'}`} />
              <div>
                <p className={`text-xs mb-1 ${isClient ? 'client-text-tertiary' : 'text-gray-500 dark:text-gray-400'}`}>
                  Rol
                </p>
                <p className={`text-sm font-medium capitalize ${isClient ? 'client-text-primary' : 'text-gray-900 dark:text-white'}`}>
                  {user.role === 'admin' ? 'Administrador (Cliente)' : user.role === 'operator_admin' ? 'Operador Administrador' : user.role === 'operator_monitor' ? 'Operador Monitor' : user.role}
                </p>
              </div>
            </div>

            {/* Fecha de creación */}
            {user.created_at && (
              <div className={`flex items-start gap-3 p-4 rounded-lg ${
                isClient ? 'bg-white/5 border border-white/10' : 'bg-gray-50 dark:bg-gray-700/50'
              }`}>
                <Calendar className={`w-5 h-5 mt-0.5 ${isClient ? 'text-purple-400' : 'text-gray-500'}`} />
                <div>
                  <p className={`text-xs mb-1 ${isClient ? 'client-text-tertiary' : 'text-gray-500 dark:text-gray-400'}`}>
                    Miembro desde
                  </p>
                  <p className={`text-sm font-medium ${isClient ? 'client-text-primary' : 'text-gray-900 dark:text-white'}`}>
                    {formatDate(user.created_at)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardComponent>

        {/* Información Adicional */}
        <CardComponent className="p-6">
          <h3 className={`text-lg font-semibold mb-4 ${isClient ? 'client-heading' : 'text-gray-900 dark:text-white'}`}>
            Información de Acceso
          </h3>
          <div className="space-y-3">
            <div className={`flex items-center justify-between py-2 border-b ${
              isClient ? 'border-white/8' : 'border-gray-100 dark:border-gray-700'
            }`}>
              <span className={`text-sm ${isClient ? 'client-text-secondary' : 'text-gray-600 dark:text-gray-400'}`}>
                ID de Usuario
              </span>
              <span className={`text-sm font-mono font-medium ${isClient ? 'client-text-primary' : 'text-gray-900 dark:text-white'}`}>
                {user.id}
              </span>
            </div>
            {user.client_id && (
              <div className={`flex items-center justify-between py-2 border-b ${
                isClient ? 'border-white/8' : 'border-gray-100 dark:border-gray-700'
              }`}>
                <span className={`text-sm ${isClient ? 'client-text-secondary' : 'text-gray-600 dark:text-gray-400'}`}>
                  ID de Cliente
                </span>
                <span className={`text-sm font-mono font-medium ${isClient ? 'client-text-primary' : 'text-gray-900 dark:text-white'}`}>
                  {user.client_id}
                </span>
              </div>
            )}
          </div>
        </CardComponent>

        {/* Información de Contacto */}
        <CardComponent className="p-6">
          <h3 className={`text-lg font-semibold mb-4 ${isClient ? 'client-heading' : 'text-gray-900 dark:text-white'}`}>
            Ayuda y Soporte
          </h3>
          <p className={`text-sm mb-4 ${isClient ? 'client-text-secondary' : 'text-gray-600 dark:text-gray-400'}`}>
            Si necesitas ayuda o tienes alguna pregunta sobre tu cuenta, contacta a tu administrador.
          </p>
          <div className={`rounded-lg p-4 ${
            isClient
              ? 'bg-cyan-500/10 border border-cyan-500/30'
              : 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800'
          }`}>
            <p className={`text-sm ${isClient ? 'text-cyan-300' : 'text-blue-800 dark:text-blue-300'}`}>
              <strong>Nota:</strong> Para actualizar tu información de perfil o cambiar tu contraseña,
              contacta al administrador del sistema.
            </p>
          </div>
        </CardComponent>

        {/* Gestión de Operadores - Solo para Admin */}
        {isAdmin && (
          <CardComponent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isClient ? 'bg-gradient-to-br from-purple-500 to-pink-500' : 'bg-primary/10'
                }`}>
                  <UsersIcon className={`w-5 h-5 ${isClient ? 'text-white' : 'text-primary'}`} />
                </div>
                <div>
                  <h3 className={`text-lg font-semibold ${isClient ? 'client-heading' : 'text-gray-900 dark:text-white'}`}>
                    Mis Operadores
                  </h3>
                  <p className={`text-sm ${isClient ? 'client-text-secondary' : 'text-gray-500'}`}>
                    Gestiona los operadores de tu organización
                  </p>
                </div>
              </div>
              <Button
                variant="primary"
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Nuevo Operador
              </Button>
            </div>

            {isLoadingUsers ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : operators.length === 0 ? (
              <div className={`text-center py-12 rounded-lg ${
                isClient ? 'bg-white/5 border border-white/10' : 'bg-gray-50 dark:bg-gray-700/50'
              }`}>
                <UsersIcon className={`w-12 h-12 mx-auto mb-3 ${
                  isClient ? 'text-cyan-400' : 'text-gray-400'
                }`} />
                <p className={`text-sm ${isClient ? 'client-text-secondary' : 'text-gray-600 dark:text-gray-400'}`}>
                  No tienes operadores registrados aún
                </p>
                <p className={`text-xs mt-1 ${isClient ? 'client-text-tertiary' : 'text-gray-500 dark:text-gray-400'}`}>
                  Haz clic en "Nuevo Operador" para crear uno
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className={isClient ? 'client-text-secondary' : ''}>Nombre</TableHead>
                      <TableHead className={isClient ? 'client-text-secondary' : ''}>Usuario</TableHead>
                      <TableHead className={isClient ? 'client-text-secondary' : ''}>Email</TableHead>
                      <TableHead className={isClient ? 'client-text-secondary' : ''}>Rol del operador</TableHead>
                      <TableHead className={`text-right ${isClient ? 'client-text-secondary' : ''}`}>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {operators.map((operator) => (
                      <TableRow key={operator.id}>
                        <TableCell className={isClient ? 'client-text-primary' : ''}>
                          <div className="font-medium">{operator.name}</div>
                        </TableCell>
                        <TableCell className={isClient ? 'client-text-secondary' : ''}>
                          {operator.username}
                        </TableCell>
                        <TableCell className={isClient ? 'client-text-secondary' : ''}>
                          {operator.email || '-'}
                        </TableCell>
                        <TableCell>{getRoleBadge(operator.role)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(operator)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(operator.id, operator.name)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
            )}
          </CardComponent>
        )}
      </div>

      {/* User Form Modal */}
      {isAdmin && (
        <>
          <UserFormModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            onSubmit={handleSubmit}
            user={selectedUser}
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
        </>
      )}
    </div>
  );
}
