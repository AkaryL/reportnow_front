import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi, activityLogsApi } from '../features/users/api';
import { QUERY_KEYS } from '../lib/constants';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Plus, Eye, Trash2, Activity, Users, Shield } from 'lucide-react';
import { formatDate } from '../lib/utils';
import type { UserWithVehicles } from '../features/users/api';

export function AdminUsersPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<string | null>(null);

  // Fetch admins
  const { data: admins = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.ADMINS,
    queryFn: usersApi.getAdmins,
  });

  // Fetch activity logs
  const { data: activityLogs = [] } = useQuery({
    queryKey: QUERY_KEYS.ACTIVITY_LOGS,
    queryFn: activityLogsApi.getAll,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: usersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ADMINS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS });
    },
  });

  const handleDelete = async (id: string) => {
    if (confirm('¿Está seguro de que desea eliminar este usuario admin?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  // Calculate stats
  const totalActivities = activityLogs.filter(log => log.user_role === 'admin').length;
  const activeAdmins = admins.filter(admin => {
    const adminLogs = activityLogs.filter(log => log.user_id === admin.id);
    if (adminLogs.length === 0) return false;
    const lastActivity = new Date(adminLogs[0].ts);
    const daysSinceLastActivity = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceLastActivity <= 7; // Activo en los últimos 7 días
  }).length;

  // Get stats for each admin
  const getAdminStats = (adminId: string) => {
    const adminLogs = activityLogs.filter(log => log.user_id === adminId);
    const recentLog = adminLogs[0];

    return {
      totalActivities: adminLogs.length,
      lastActivity: recentLog?.ts,
    };
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
          <h1 className="text-2xl font-bold text-gray-900">Usuarios Administradores</h1>
          <p className="mt-1 text-gray-600">
            Gestiona los usuarios con rol de administrador
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4" />
          Crear nuevo admin
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Admins</p>
              <p className="text-2xl font-bold mt-1 text-gray-900">{admins.length}</p>
            </div>
            <Users className="w-6 h-6 text-gray-400" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Admins Activos</p>
              <p className="text-2xl font-bold mt-1 text-ok-600">{activeAdmins}</p>
            </div>
            <Shield className="w-6 h-6 text-ok-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Actividades Totales</p>
              <p className="text-2xl font-bold mt-1 text-info-600">{totalActivities}</p>
            </div>
            <Activity className="w-6 h-6 text-info-600" />
          </div>
        </Card>
      </div>

      {/* Admins Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Administradores</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Actividades</TableHead>
                <TableHead>Última Actividad</TableHead>
                <TableHead>Fecha de Creación</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map((admin) => {
                const stats = getAdminStats(admin.id);
                return (
                  <TableRow key={admin.id}>
                    <TableCell className="font-medium">{admin.name}</TableCell>
                    <TableCell className="text-gray-600">{admin.email || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant="default">{admin.username}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{stats.totalActivities}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {stats.lastActivity ? formatDate(stats.lastActivity) : 'Sin actividad'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {admin.created_at ? formatDate(admin.created_at) : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/admin/usuarios/${admin.id}`)}
                        >
                          <Eye className="w-4 h-4" />
                          Ver perfil
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(admin.id)}
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

          {admins.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No hay usuarios administradores</p>
              <Button className="mt-4" onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4" />
                Crear primer admin
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateAdminModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ADMINS });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS });
          }}
        />
      )}
    </div>
  );
}

// Create Admin Modal Component
interface CreateAdminModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function CreateAdminModal({ onClose, onSuccess }: CreateAdminModalProps) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => {
      onSuccess();
    },
    onError: (error: any) => {
      setErrors({ general: error.message || 'Error al crear el usuario' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.username) newErrors.username = 'El nombre de usuario es requerido';
    if (!formData.password) newErrors.password = 'La contraseña es requerida';
    if (formData.password.length < 6) newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    if (!formData.name) newErrors.name = 'El nombre es requerido';
    if (!formData.email) newErrors.email = 'El email es requerido';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    createMutation.mutate({
      ...formData,
      role: 'admin',
    });
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Crear Nuevo Administrador" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.general && (
          <div className="bg-crit-50 text-crit-700 p-3 rounded-lg text-sm">
            {errors.general}
          </div>
        )}

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Nombre Completo *
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Juan Pérez"
          />
          {errors.name && <p className="text-crit-600 text-sm mt-1">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
            Nombre de Usuario *
          </label>
          <input
            type="text"
            id="username"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="juanperez"
          />
          {errors.username && <p className="text-crit-600 text-sm mt-1">{errors.username}</p>}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="juan@reportnow.com"
          />
          {errors.email && <p className="text-crit-600 text-sm mt-1">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Contraseña *
          </label>
          <input
            type="password"
            id="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Mínimo 6 caracteres"
          />
          {errors.password && <p className="text-crit-600 text-sm mt-1">{errors.password}</p>}
        </div>

        <div className="flex items-center justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Creando...' : 'Crear Administrador'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
