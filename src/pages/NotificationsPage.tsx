import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { notificationsApi } from '../features/notifications/api';
import { equipmentsApi } from '../features/equipments/api';
import { QUERY_KEYS } from '../lib/constants';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { ClientCard } from '../components/ui/ClientCard';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { ClientTable, ClientTableHeader, ClientTableBody, ClientTableRow, ClientTableHead, ClientTableCell } from '../components/ui/ClientTable';
import { Button } from '../components/ui/Button';
import { ClientButton } from '../components/ui/ClientButton';
import { Badge } from '../components/ui/Badge';
import { ClientBadge } from '../components/ui/ClientBadge';
import { Check, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { formatDate } from '../lib/utils';
import { useAuth } from '../features/auth/hooks';
import type { Notification } from '../lib/types';

export function NotificationsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Determine if current user is a client/admin for conditional styling
  const isClient = user?.role === 'admin';
  const CardComponent = isClient ? ClientCard : Card;
  const ButtonComponent = isClient ? ClientButton : Button;
  const BadgeComponent = isClient ? ClientBadge : Badge;
  const TableComponent = isClient ? ClientTable : Table;
  const TableHeaderComponent = isClient ? ClientTableHeader : TableHeader;
  const TableBodyComponent = isClient ? ClientTableBody : TableBody;
  const TableRowComponent = isClient ? ClientTableRow : TableRow;
  const TableHeadComponent = isClient ? ClientTableHead : TableHead;
  const TableCellComponent = isClient ? ClientTableCell : TableCell;

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.NOTIFICATIONS,
    queryFn: notificationsApi.getAll,
  });

  const { data: equipments = [] } = useQuery({
    queryKey: QUERY_KEYS.EQUIPMENTS,
    queryFn: equipmentsApi.getAll,
  });

  // Filtrar notificaciones por cliente del usuario
  const filteredNotifications = notifications.filter((n) => {
    if (user?.role === 'superuser') return true;
    if (!user?.client_id) return true;
    // Filtrar notificaciones de equipos del cliente
    const equipment = equipments.find(eq => eq.id === n.equipment_id);
    return equipment && equipment.client_id === user.client_id;
  });

  const markAsReadMutation = useMutation({
    mutationFn: notificationsApi.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.NOTIFICATIONS });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: notificationsApi.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.NOTIFICATIONS });
    },
  });

  const unreadCount = filteredNotifications.filter((n) => !n.read_by.includes(user?.id || '')).length;

  const markAsRead = (id: string) => {
    markAsReadMutation.mutate(id);
  };

  const markAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleNotificationClick = (notification: Notification) => {
    // Navigate to equipment detail page to see the problem
    if (notification.equipment_id) {
      navigate(`/equipos/${notification.equipment_id}`);
    }
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'crit':
        return <AlertCircle className={`w-5 h-5 ${isClient ? 'text-red-400' : 'text-crit-600'}`} />;
      case 'warn':
        return <AlertTriangle className={`w-5 h-5 ${isClient ? 'text-orange-400' : 'text-warn-600'}`} />;
      case 'info':
        return <Info className={`w-5 h-5 ${isClient ? 'text-cyan-400' : 'text-info-600'}`} />;
    }
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${isClient ? 'client-heading' : 'text-gray-900 dark:text-white'}`}>Notificaciones</h1>
          <p className={`mt-1 ${isClient ? 'client-text-secondary' : 'text-gray-600 dark:text-gray-400'}`}>
            Alertas y notificaciones del sistema • {unreadCount} sin leer
          </p>
        </div>
        {unreadCount > 0 && (
          <ButtonComponent variant={isClient ? 'secondary' : 'outline'} onClick={markAllAsRead}>
            <Check className="w-4 h-4" />
            Marcar todas como leídas
          </ButtonComponent>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <CardComponent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isClient ? 'client-text-tertiary' : 'text-gray-600 dark:text-gray-400'}`}>Total</p>
              <p className={`text-2xl font-bold mt-1 ${isClient ? 'client-text-primary' : 'text-gray-900 dark:text-white'}`}>
                {notifications.length}
              </p>
            </div>
            <Info className={`w-6 h-6 ${isClient ? 'text-cyan-400' : 'text-gray-400'}`} />
          </div>
        </CardComponent>

        <CardComponent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isClient ? 'client-text-tertiary' : 'text-gray-600 dark:text-gray-400'}`}>Sin leer</p>
              <p className={`text-2xl font-bold mt-1 ${isClient ? 'text-orange-400' : 'text-warn-600'}`}>
                {unreadCount}
              </p>
            </div>
            <AlertCircle className={`w-6 h-6 ${isClient ? 'text-orange-400' : 'text-warn-600'}`} />
          </div>
        </CardComponent>

        <CardComponent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isClient ? 'client-text-tertiary' : 'text-gray-600 dark:text-gray-400'}`}>Críticas</p>
              <p className={`text-2xl font-bold mt-1 ${isClient ? 'text-red-400' : 'text-crit-600'}`}>
                {filteredNotifications.filter((n) => n.type === 'crit').length}
              </p>
            </div>
            <AlertTriangle className={`w-6 h-6 ${isClient ? 'text-red-400' : 'text-crit-600'}`} />
          </div>
        </CardComponent>
      </div>

      <CardComponent>
        {!isClient && (
          <CardHeader>
            <CardTitle>Historial de notificaciones</CardTitle>
          </CardHeader>
        )}
        {isClient && (
          <div className="p-6 border-b border-white/8">
            <h3 className="client-heading text-xl">Historial de notificaciones</h3>
          </div>
        )}
        <CardContent className={isClient ? 'p-0' : 'p-0'}>
          <TableComponent>
            <TableHeaderComponent>
              <TableRowComponent>
                <TableHeadComponent>Fecha</TableHeadComponent>
                <TableHeadComponent>Vehículo</TableHeadComponent>
                <TableHeadComponent>Tipo</TableHeadComponent>
                <TableHeadComponent>Mensaje</TableHeadComponent>
                <TableHeadComponent>Estado</TableHeadComponent>
                <TableHeadComponent className="text-right">Acciones</TableHeadComponent>
              </TableRowComponent>
            </TableHeaderComponent>
            <TableBodyComponent>
              {filteredNotifications.map((notification) => {
                const isRead = notification.read_by.includes(user?.id || '');
                return (
                <TableRowComponent
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`cursor-pointer transition-colors ${
                    !isRead && !isClient
                      ? 'bg-blue-50/50 hover:bg-blue-100/50'
                      : isClient
                        ? 'hover:bg-white/5'
                        : 'hover:bg-gray-50'
                  }`}
                >
                  <TableCellComponent className={`text-sm ${isClient ? '' : 'text-gray-600'}`}>
                    {formatDate(notification.ts)}
                  </TableCellComponent>
                  <TableCellComponent className={isClient ? '' : 'font-medium'}>
                    {notification.resource_name || '-'}
                  </TableCellComponent>
                  <TableCellComponent>
                    <div className="flex items-center gap-2">
                      {getIcon(notification.type)}
                      <BadgeComponent variant={notification.type}>
                        {notification.type === 'crit'
                          ? 'Crítico'
                          : notification.type === 'warn'
                          ? 'Advertencia'
                          : 'Información'}
                      </BadgeComponent>
                    </div>
                  </TableCellComponent>
                  <TableCellComponent className="max-w-md">
                    <p className={`text-sm truncate ${isClient ? 'client-text-primary' : 'text-gray-900 dark:text-white'}`}>{notification.description}</p>
                  </TableCellComponent>
                  <TableCellComponent>
                    {isRead ? (
                      <BadgeComponent variant="default">Leída</BadgeComponent>
                    ) : (
                      <BadgeComponent variant={isClient ? 'default' : 'warning'}>Pendiente</BadgeComponent>
                    )}
                  </TableCellComponent>
                  <TableCellComponent className="text-right">
                    {!isRead && (
                      <ButtonComponent
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                      >
                        <Check className="w-4 h-4" />
                        Marcar leída
                      </ButtonComponent>
                    )}
                  </TableCellComponent>
                </TableRowComponent>
                );
              })}
            </TableBodyComponent>
          </TableComponent>
        </CardContent>
      </CardComponent>
    </div>
  );
}
