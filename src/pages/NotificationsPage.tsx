import { useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { notificationsApi } from '../features/notifications/api';
import { wsClient } from '../lib/websocket';
import { QUERY_KEYS } from '../lib/constants';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Check, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { formatDate } from '../lib/utils';
import type { Notification } from '../lib/types';

export function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.NOTIFICATIONS,
    queryFn: notificationsApi.getAll,
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

  // WebSocket for real-time notifications
  useEffect(() => {
    wsClient.connect();

    wsClient.on('notification:updated', () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.NOTIFICATIONS });
    });

    wsClient.on('notifications:all-read', () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.NOTIFICATIONS });
    });

    return () => {
      wsClient.off('notification:updated');
      wsClient.off('notifications:all-read');
    };
  }, [queryClient]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    markAsReadMutation.mutate(id);
  };

  const markAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'crit':
        return <AlertCircle className="w-5 h-5 text-crit-600" />;
      case 'warn':
        return <AlertTriangle className="w-5 h-5 text-warn-600" />;
      case 'info':
        return <Info className="w-5 h-5 text-info-600" />;
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
          <h1 className="text-2xl font-bold text-gray-900">Notificaciones</h1>
          <p className="text-gray-600 mt-1">
            Alertas y notificaciones del sistema • {unreadCount} sin leer
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllAsRead}>
            <Check className="w-4 h-4" />
            Marcar todas como leídas
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{notifications.length}</p>
              </div>
              <Info className="w-6 h-6 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sin leer</p>
                <p className="text-2xl font-bold text-warn-600 mt-1">{unreadCount}</p>
              </div>
              <AlertCircle className="w-6 h-6 text-warn-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Críticas</p>
                <p className="text-2xl font-bold text-crit-600 mt-1">
                  {notifications.filter((n) => n.type === 'crit').length}
                </p>
              </div>
              <AlertTriangle className="w-6 h-6 text-crit-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historial de notificaciones</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Vehículo</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Mensaje</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notifications.map((notification) => (
                <TableRow
                  key={notification.id}
                  className={!notification.read ? 'bg-blue-50/50' : ''}
                >
                  <TableCell className="text-sm text-gray-600">
                    {formatDate(notification.ts)}
                  </TableCell>
                  <TableCell className="font-medium">{notification.vehiclePlate}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getIcon(notification.type)}
                      <Badge variant={notification.type}>
                        {notification.type === 'crit'
                          ? 'Crítico'
                          : notification.type === 'warn'
                          ? 'Advertencia'
                          : 'Información'}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-md">
                    <p className="text-sm text-gray-900 truncate">{notification.text}</p>
                  </TableCell>
                  <TableCell>
                    {notification.read ? (
                      <Badge variant="default">Leída</Badge>
                    ) : (
                      <Badge variant="warning">Pendiente</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(notification.id)}
                      >
                        <Check className="w-4 h-4" />
                        Marcar leída
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
