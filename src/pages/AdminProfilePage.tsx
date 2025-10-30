import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { usersApi, activityLogsApi } from '../features/users/api';
import { QUERY_KEYS } from '../lib/constants';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  ArrowLeft,
  Activity,
  Calendar,
  Mail,
  User,
  TrendingUp,
  Users,
  MapPin,
  Bell,
  Car,
} from 'lucide-react';
import { formatDate } from '../lib/utils';
import type { ActivityType } from '../lib/types';

const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  // Clientes
  create_client: 'Crear Cliente',
  update_client: 'Actualizar Cliente',
  delete_client: 'Eliminar Cliente',
  // Equipos
  create_equipment: 'Crear Equipo',
  update_equipment: 'Actualizar Equipo',
  delete_equipment: 'Eliminar Equipo',
  assign_equipment_to_client: 'Asignar Equipo a Cliente',
  assign_equipment_to_asset: 'Asignar Equipo a Activo',
  unassign_equipment: 'Desasignar Equipo',
  activate_equipment: 'Activar Equipo',
  deactivate_equipment: 'Desactivar Equipo',
  // Activos
  create_asset: 'Crear Activo',
  update_asset: 'Actualizar Activo',
  delete_asset: 'Eliminar Activo',
  create_vehicle: 'Crear Vehículo',
  update_vehicle: 'Actualizar Vehículo',
  delete_vehicle: 'Eliminar Vehículo',
  // Geocercas
  create_geofence: 'Crear Geocerca',
  update_geofence: 'Actualizar Geocerca',
  delete_geofence: 'Eliminar Geocerca',
  add_geofence_point: 'Agregar Punto a Geocerca',
  // Lugares
  create_place: 'Crear Lugar',
  update_place: 'Actualizar Lugar',
  delete_place: 'Eliminar Lugar',
  // Conductores
  create_driver: 'Crear Conductor',
  update_driver: 'Actualizar Conductor',
  delete_driver: 'Eliminar Conductor',
  assign_driver: 'Asignar Conductor',
  assign_vehicle: 'Asignar Vehículo',
  unassign_vehicle: 'Desasignar Vehículo',
  // Usuarios
  create_user: 'Crear Usuario',
  update_user: 'Actualizar Usuario',
  delete_user: 'Eliminar Usuario',
  change_user_role: 'Cambiar Rol de Usuario',
  // Notificaciones
  send_notification: 'Enviar Notificación',
};

const ACTIVITY_TYPE_ICONS: Record<string, any> = {
  create_client: Users,
  update_client: Users,
  delete_client: Users,
  create_geofence: MapPin,
  update_geofence: MapPin,
  delete_geofence: MapPin,
  create_vehicle: Car,
  update_vehicle: Car,
  delete_vehicle: Car,
  send_notification: Bell,
  assign_vehicle: Car,
  unassign_vehicle: Car,
  create_user: User,
  update_user: User,
  delete_user: User,
};

const ACTIVITY_TYPE_COLORS: Record<string, string> = {
  create_client: 'text-ok-600 bg-ok-50',
  update_client: 'text-info-600 bg-info-50',
  delete_client: 'text-crit-600 bg-crit-50',
  create_geofence: 'text-ok-600 bg-ok-50',
  update_geofence: 'text-info-600 bg-info-50',
  delete_geofence: 'text-crit-600 bg-crit-50',
  create_vehicle: 'text-ok-600 bg-ok-50',
  update_vehicle: 'text-info-600 bg-info-50',
  delete_vehicle: 'text-crit-600 bg-crit-50',
  send_notification: 'text-warn-600 bg-warn-50',
  assign_vehicle: 'text-info-600 bg-info-50',
  unassign_vehicle: 'text-info-600 bg-info-50',
  create_user: 'text-ok-600 bg-ok-50',
  update_user: 'text-info-600 bg-info-50',
  delete_user: 'text-crit-600 bg-crit-50',
};

export function AdminProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Fetch admin data
  const { data: admin, isLoading: isLoadingAdmin } = useQuery({
    queryKey: QUERY_KEYS.USER(id!),
    queryFn: () => usersApi.getById(id!),
    enabled: !!id,
  });

  // Fetch activity logs for this admin
  const { data: activityLogs = [], isLoading: isLoadingLogs } = useQuery({
    queryKey: QUERY_KEYS.ACTIVITY_LOGS_BY_USER(id!),
    queryFn: () => activityLogsApi.getByUserId(id!),
    enabled: !!id,
  });

  // Fetch activity stats
  const { data: stats } = useQuery({
    queryKey: QUERY_KEYS.ACTIVITY_STATS(id!),
    queryFn: () => activityLogsApi.getStatsByUserId(id!),
    enabled: !!id,
  });

  if (isLoadingAdmin || isLoadingLogs) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Administrador no encontrado</p>
        <Button className="mt-4" onClick={() => navigate('/admin/usuarios')}>
          Volver a la lista
        </Button>
      </div>
    );
  }

  // Calculate activity breakdown
  const activityByType = stats?.by_type || {};
  const topActivities = Object.entries(activityByType)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/admin/usuarios')}>
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Perfil de Administrador</h1>
          <p className="mt-1 text-gray-600">Información y actividad del usuario</p>
        </div>
      </div>

      {/* Admin Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Administrador</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Nombre</p>
                <p className="font-semibold text-gray-900">{admin.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-info-50 rounded-lg">
                <Mail className="w-6 h-6 text-info-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-semibold text-gray-900">{admin.email || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-ok-50 rounded-lg">
                <User className="w-6 h-6 text-ok-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Usuario</p>
                <p className="font-semibold text-gray-900">{admin.username}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-warn-50 rounded-lg">
                <Calendar className="w-6 h-6 text-warn-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Fecha de Creación</p>
                <p className="font-semibold text-gray-900">
                  {admin.created_at ? formatDate(admin.created_at) : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Actividades</p>
              <p className="text-2xl font-bold mt-1 text-gray-900">
                {stats?.total_activities || 0}
              </p>
            </div>
            <Activity className="w-6 h-6 text-gray-400" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tipos de Actividad</p>
              <p className="text-2xl font-bold mt-1 text-info-600">
                {Object.keys(activityByType).length}
              </p>
            </div>
            <TrendingUp className="w-6 h-6 text-info-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Última Actividad</p>
              <p className="text-sm font-bold mt-1 text-warn-600">
                {stats?.recent_activity_ts ? formatDate(stats.recent_activity_ts) : 'Sin actividad'}
              </p>
            </div>
            <Calendar className="w-6 h-6 text-warn-600" />
          </div>
        </Card>
      </div>

      {/* Top Activities */}
      {topActivities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Actividades Más Frecuentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topActivities.map(([type, count]) => {
                const Icon = ACTIVITY_TYPE_ICONS[type] || Activity;
                const colorClass = ACTIVITY_TYPE_COLORS[type] || 'text-gray-600 bg-gray-50';

                return (
                  <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${colorClass}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="font-medium text-gray-900">
                        {ACTIVITY_TYPE_LABELS[type as ActivityType] || type}
                      </span>
                    </div>
                    <Badge variant="default">{count} veces</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activity History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Actividades</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Objetivo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activityLogs.map((log) => {
                const Icon = ACTIVITY_TYPE_ICONS[log.activity_type] || Activity;
                const colorClass = ACTIVITY_TYPE_COLORS[log.activity_type] || 'text-gray-600 bg-gray-50';

                return (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm text-gray-600">{formatDate(log.ts)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded ${colorClass}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-sm font-medium">
                          {ACTIVITY_TYPE_LABELS[log.activity_type]}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-md">
                      <p className="text-sm text-gray-900">{log.description}</p>
                    </TableCell>
                    <TableCell>
                      {log.target_name && (
                        <Badge variant="default">{log.target_name}</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {activityLogs.length === 0 && (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No hay actividades registradas para este administrador</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
