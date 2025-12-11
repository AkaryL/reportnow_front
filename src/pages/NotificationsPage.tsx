import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { notificationsApi } from '../features/notifications/api';
import { alertsApi } from '../features/alerts/api';
import { equipmentsApi } from '../features/equipments/api';
import { geofencesApi } from '../features/geofences/api';
import { clientsApi } from '../features/clients/api';
import { QUERY_KEYS } from '../lib/constants';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Drawer, DrawerSection, DrawerItem } from '../components/ui/Drawer';
import {
  Bell,
  AlertTriangle,
  Info,
  AlertCircle,
  Check,
  Search,
  MapPin,
  LogIn,
  LogOut,
  Clock,
  Radio,
  Filter,
  Download,
  Settings,
  Navigation,
  Gauge,
} from 'lucide-react';
import { formatDate, cn } from '../lib/utils';
import { generateListPDF } from '../lib/pdfGenerator';
import { useAuth } from '../features/auth/hooks';
import type { Notification, Alert, Equipment } from '../lib/types';

type TabType = 'alerts' | 'system';

export function NotificationsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isSuperuser = user?.role === 'superuser';

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('alerts');

  // Drawer states
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  // Filters for alerts
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClient, setFilterClient] = useState<string>('all');
  const [filterType, setFilterType] = useState<'all' | 'geofence_enter' | 'geofence_exit'>('all');

  // Fetch alerts
  const { data: alerts = [], isLoading: isLoadingAlerts } = useQuery({
    queryKey: [...QUERY_KEYS.ALERTS, filterClient],
    queryFn: () => alertsApi.getAll(filterClient !== 'all' ? filterClient : undefined),
  });

  // Fetch notifications (system)
  const { data: notifications = [], isLoading: isLoadingNotifications } = useQuery({
    queryKey: QUERY_KEYS.NOTIFICATIONS,
    queryFn: notificationsApi.getAll,
  });

  // Fetch equipments
  const { data: equipments = [] } = useQuery({
    queryKey: QUERY_KEYS.EQUIPMENTS,
    queryFn: equipmentsApi.getAll,
  });

  // Fetch geofences
  const { data: geofences = [] } = useQuery({
    queryKey: QUERY_KEYS.GEOFENCES,
    queryFn: geofencesApi.getAll,
  });

  // Fetch clients
  const { data: clients = [] } = useQuery({
    queryKey: QUERY_KEYS.CLIENTS,
    queryFn: clientsApi.getAll,
    enabled: isSuperuser,
  });

  // Mutations for system notifications
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

  // Helper functions
  const getEquipmentInfo = (equipmentId: string): Equipment | undefined => {
    return equipments.find((eq) => eq.id === equipmentId);
  };

  const getGeofenceName = (geofenceId?: string): string => {
    if (!geofenceId) return '-';
    const geofence = geofences.find((gf) => gf.id === geofenceId);
    return geofence?.name || 'Geocerca desconocida';
  };

  const getClientName = (clientId?: string): string => {
    if (!clientId) return 'Sin cliente';
    const client = clients.find((c) => c.id === clientId);
    return client?.company_name || 'Cliente desconocido';
  };

  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Filter alerts by client first
  const clientFilteredAlerts = alerts.filter((alert) => {
    // Superusers see all alerts
    if (user?.role === 'superuser') return true;
    // Clients only see alerts from their own equipment
    if (!user?.client_id) return true;
    const equipment = getEquipmentInfo(alert.equipment_id);
    return equipment && equipment.client_id === user.client_id;
  });

  // Filter alerts by search and type
  const filteredAlerts = clientFilteredAlerts.filter((alert) => {
    const equipment = getEquipmentInfo(alert.equipment_id);
    const geofenceName = getGeofenceName(alert.geofence_id);
    const matchesSearch =
      !searchQuery ||
      equipment?.imei.toLowerCase().includes(searchQuery.toLowerCase()) ||
      equipment?.serial?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      geofenceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.message.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === 'all' || alert.type === filterType;

    return matchesSearch && matchesType;
  });

  // Filter system notifications by client
  const filteredNotifications = notifications.filter((n) => {
    if (user?.role === 'superuser') return true;
    if (!user?.client_id) return true;
    const equipment = equipments.find(eq => eq.id === n.equipment_id);
    return equipment && equipment.client_id === user.client_id;
  });

  // Stats for alerts (use client-filtered alerts)
  const totalAlerts = clientFilteredAlerts.length;
  const entryAlerts = clientFilteredAlerts.filter((a) => a.type === 'geofence_enter').length;
  const exitAlerts = clientFilteredAlerts.filter((a) => a.type === 'geofence_exit').length;

  // Stats for system notifications
  const unreadCount = filteredNotifications.filter((n) => !n.read_by.includes(user?.id || '')).length;
  const criticalCount = filteredNotifications.filter((n) => n.type === 'crit').length;

  const markAsRead = (id: string) => {
    markAsReadMutation.mutate(id);
  };

  const markAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'crit':
        return <AlertCircle className="w-5 h-5 text-crit-600 dark:text-crit-400" />;
      case 'warn':
        return <AlertTriangle className="w-5 h-5 text-warn-600 dark:text-warn-400" />;
      case 'info':
        return <Info className="w-5 h-5 text-info-600 dark:text-info-400" />;
    }
  };

  const isLoading = isLoadingAlerts || isLoadingNotifications;

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notificaciones</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Centro de alertas y notificaciones del sistema
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('alerts')}
            className={cn(
              'py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors',
              activeTab === 'alerts'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            )}
          >
            <MapPin className="w-4 h-4" />
            Alertas de Equipos
            {totalAlerts > 0 && (
              <Badge variant="default" className="ml-1">{totalAlerts}</Badge>
            )}
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={cn(
              'py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors',
              activeTab === 'system'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            )}
          >
            <Settings className="w-4 h-4" />
            Sistema
            {unreadCount > 0 && (
              <Badge variant="warning" className="ml-1">{unreadCount}</Badge>
            )}
          </button>
        </nav>
      </div>

      {/* Tab Content: Alerts */}
      {activeTab === 'alerts' && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Alertas</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalAlerts}</p>
                  </div>
                  <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full">
                    <Bell className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Entradas</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">{entryAlerts}</p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                    <LogIn className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Salidas</p>
                    <p className="text-3xl font-bold text-red-600 dark:text-red-400">{exitAlerts}</p>
                  </div>
                  <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                    <LogOut className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Buscar por IMEI, geocerca o mensaje..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {isSuperuser && (
                  <select
                    value={filterClient}
                    onChange={(e) => setFilterClient(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="all">Todos los clientes</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.company_name}
                      </option>
                    ))}
                  </select>
                )}

                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as 'all' | 'geofence_enter' | 'geofence_exit')}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">Todos los tipos</option>
                  <option value="geofence_enter">Entradas</option>
                  <option value="geofence_exit">Salidas</option>
                </select>

                <Button
                  variant="outline"
                  onClick={() => generateListPDF({
                    title: 'Historial de Alertas',
                    subtitle: `${filteredAlerts.length} alertas encontradas`,
                    columns: [
                      { header: 'Fecha', key: 'date' },
                      { header: 'Tipo', key: 'type' },
                      { header: 'Equipo', key: 'equipment' },
                      { header: 'Geocerca', key: 'geofence' },
                    ],
                    data: filteredAlerts.map(a => ({
                      date: formatDateTime(a.created_at),
                      type: a.type === 'geofence_enter' ? 'Entrada' : 'Salida',
                      equipment: getEquipmentInfo(a.equipment_id)?.imei || '-',
                      geofence: getGeofenceName(a.geofence_id),
                    })),
                    filename: 'alertas',
                    filters: filterType !== 'all' || filterClient !== 'all' ? [
                      ...(filterType !== 'all' ? [{ label: 'Tipo', value: filterType === 'geofence_enter' ? 'Entrada' : 'Salida' }] : []),
                      ...(filterClient !== 'all' ? [{ label: 'Cliente', value: clients.find(c => c.id === filterClient)?.company_name || filterClient }] : []),
                    ] : undefined,
                  })}
                >
                  <Download className="w-4 h-4" />
                  PDF
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Alerts Table - Simplified */}
          <Card>
            <CardHeader className="p-6">
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Historial de Alertas ({filteredAlerts.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {filteredAlerts.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No se encontraron alertas</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Equipo</TableHead>
                      <TableHead>Geocerca</TableHead>
                      <TableHead>Fecha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAlerts.map((alert) => {
                      const equipment = getEquipmentInfo(alert.equipment_id);
                      return (
                        <TableRow
                          key={alert.id}
                          className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"
                          onClick={() => setSelectedAlert(alert)}
                        >
                          <TableCell>
                            {alert.type === 'geofence_enter' ? (
                              <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 flex items-center gap-1 w-fit">
                                <LogIn className="w-3 h-3" />
                                Entrada
                              </Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 flex items-center gap-1 w-fit">
                                <LogOut className="w-3 h-3" />
                                Salida
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {equipment?.imei || 'Desconocido'}
                            </span>
                          </TableCell>
                          <TableCell className="text-gray-600 dark:text-gray-400">
                            {getGeofenceName(alert.geofence_id)}
                          </TableCell>
                          <TableCell className="text-gray-600 dark:text-gray-400">
                            {formatDateTime(alert.created_at)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Tab Content: System */}
      {activeTab === 'system' && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</p>
                  <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">
                    {filteredNotifications.length}
                  </p>
                </div>
                <Info className="w-6 h-6 text-gray-400 dark:text-gray-500" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Sin leer</p>
                  <p className="text-2xl font-bold mt-1 text-warn-600 dark:text-warn-400">
                    {unreadCount}
                  </p>
                </div>
                <AlertCircle className="w-6 h-6 text-warn-600 dark:text-warn-400" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Criticas</p>
                  <p className="text-2xl font-bold mt-1 text-crit-600 dark:text-crit-400">
                    {criticalCount}
                  </p>
                </div>
                <AlertTriangle className="w-6 h-6 text-crit-600 dark:text-crit-400" />
              </div>
            </Card>
          </div>

          {/* Actions */}
          {unreadCount > 0 && (
            <div className="flex justify-end">
              <Button variant="outline" onClick={markAllAsRead}>
                <Check className="w-4 h-4" />
                Marcar todas como leidas
              </Button>
            </div>
          )}

          {/* System Notifications Table - Simplified */}
          <Card>
            <CardHeader className="p-6">
              <CardTitle>Historial de notificaciones del sistema</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-12">
                  <Settings className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No hay notificaciones del sistema</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Recurso</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredNotifications.map((notification) => {
                      const isRead = notification.read_by.includes(user?.id || '');
                      return (
                        <TableRow
                          key={notification.id}
                          onClick={() => setSelectedNotification(notification)}
                          className={cn(
                            'cursor-pointer transition-colors',
                            !isRead
                              ? 'bg-blue-50/50 dark:bg-blue-900/10 hover:bg-blue-100/50 dark:hover:bg-blue-900/20'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                          )}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getNotificationIcon(notification.type)}
                              <Badge variant={notification.type}>
                                {notification.type === 'crit'
                                  ? 'Critico'
                                  : notification.type === 'warn'
                                  ? 'Advertencia'
                                  : 'Info'}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium text-gray-900 dark:text-white">
                            {notification.resource_name || '-'}
                          </TableCell>
                          <TableCell>
                            {isRead ? (
                              <Badge variant="default">Leida</Badge>
                            ) : (
                              <Badge variant="warning">Pendiente</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-gray-600 dark:text-gray-400">
                            {formatDate(notification.ts)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Alert Detail Drawer */}
      <Drawer
        isOpen={!!selectedAlert}
        onClose={() => setSelectedAlert(null)}
        title="Detalle de Alerta"
      >
        {selectedAlert && (() => {
          const equipment = getEquipmentInfo(selectedAlert.equipment_id);
          return (
            <>
              {/* Type Badge */}
              <div className="mb-6">
                {selectedAlert.type === 'geofence_enter' ? (
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 flex items-center gap-2 w-fit px-4 py-2 text-base">
                    <LogIn className="w-5 h-5" />
                    Entrada a Geocerca
                  </Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 flex items-center gap-2 w-fit px-4 py-2 text-base">
                    <LogOut className="w-5 h-5" />
                    Salida de Geocerca
                  </Badge>
                )}
              </div>

              <DrawerSection title="Equipo GPS">
                <div className="space-y-1 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <DrawerItem label="IMEI" value={equipment?.imei || 'Desconocido'} />
                  {equipment?.serial && (
                    <DrawerItem label="Serial" value={equipment.serial} />
                  )}
                  {equipment?.brand && (
                    <DrawerItem label="Marca" value={equipment.brand} />
                  )}
                  {equipment?.model && (
                    <DrawerItem label="Modelo" value={equipment.model} />
                  )}
                </div>
              </DrawerSection>

              <DrawerSection title="Geocerca">
                <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                    <MapPin className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {getGeofenceName(selectedAlert.geofence_id)}
                  </span>
                </div>
              </DrawerSection>

              {isSuperuser && equipment?.client_id && (
                <DrawerSection title="Cliente">
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {getClientName(equipment.client_id)}
                    </span>
                  </div>
                </DrawerSection>
              )}

              <DrawerSection title="Ubicacion">
                <div className="space-y-1 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  {selectedAlert.lat && selectedAlert.lng ? (
                    <>
                      <DrawerItem
                        label="Coordenadas"
                        value={
                          <span className="font-mono text-xs">
                            {selectedAlert.lat.toFixed(6)}, {selectedAlert.lng.toFixed(6)}
                          </span>
                        }
                      />
                      <div className="pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => window.open(`https://www.google.com/maps?q=${selectedAlert.lat},${selectedAlert.lng}`, '_blank')}
                        >
                          <Navigation className="w-4 h-4" />
                          Ver en Google Maps
                        </Button>
                      </div>
                    </>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Sin ubicacion disponible</p>
                  )}
                </div>
              </DrawerSection>

              {selectedAlert.speed !== undefined && selectedAlert.speed !== null && (
                <DrawerSection title="Velocidad">
                  <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <div className={cn(
                      "p-2 rounded-lg",
                      selectedAlert.speed > 80
                        ? "bg-red-100 dark:bg-red-900/30"
                        : "bg-gray-100 dark:bg-gray-600"
                    )}>
                      <Gauge className={cn(
                        "w-5 h-5",
                        selectedAlert.speed > 80
                          ? "text-red-600 dark:text-red-400"
                          : "text-gray-600 dark:text-gray-400"
                      )} />
                    </div>
                    <span className={cn(
                      "text-2xl font-bold",
                      selectedAlert.speed > 80
                        ? "text-red-600 dark:text-red-400"
                        : "text-gray-900 dark:text-white"
                    )}>
                      {selectedAlert.speed.toFixed(0)} km/h
                    </span>
                  </div>
                </DrawerSection>
              )}

              <DrawerSection title="Mensaje">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <p className="text-gray-700 dark:text-gray-300">{selectedAlert.message}</p>
                </div>
              </DrawerSection>

              <DrawerSection title="Fecha y Hora">
                <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-900 dark:text-white">
                    {formatDateTime(selectedAlert.created_at)}
                  </span>
                </div>
              </DrawerSection>
            </>
          );
        })()}
      </Drawer>

      {/* System Notification Detail Drawer */}
      <Drawer
        isOpen={!!selectedNotification}
        onClose={() => setSelectedNotification(null)}
        title="Detalle de Notificacion"
      >
        {selectedNotification && (() => {
          const isRead = selectedNotification.read_by.includes(user?.id || '');
          return (
            <>
              {/* Type Badge */}
              <div className="mb-6 flex items-center gap-3">
                {getNotificationIcon(selectedNotification.type)}
                <Badge variant={selectedNotification.type} className="px-4 py-2 text-base">
                  {selectedNotification.type === 'crit'
                    ? 'Critico'
                    : selectedNotification.type === 'warn'
                    ? 'Advertencia'
                    : 'Informacion'}
                </Badge>
              </div>

              <DrawerSection title="Recurso">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {selectedNotification.resource_name || 'Sin recurso'}
                  </span>
                </div>
              </DrawerSection>

              <DrawerSection title="Descripcion">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <p className="text-gray-700 dark:text-gray-300">
                    {selectedNotification.description || 'Sin descripcion'}
                  </p>
                </div>
              </DrawerSection>

              <DrawerSection title="Estado">
                <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  {isRead ? (
                    <Badge variant="default" className="px-4 py-2">Leida</Badge>
                  ) : (
                    <>
                      <Badge variant="warning" className="px-4 py-2">Pendiente</Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          markAsRead(selectedNotification.id);
                          setSelectedNotification(null);
                        }}
                      >
                        <Check className="w-4 h-4" />
                        Marcar leida
                      </Button>
                    </>
                  )}
                </div>
              </DrawerSection>

              <DrawerSection title="Fecha y Hora">
                <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-900 dark:text-white">
                    {formatDate(selectedNotification.ts)}
                  </span>
                </div>
              </DrawerSection>

              {selectedNotification.equipment_id && (
                <div className="mt-6">
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={() => {
                      navigate(`/equipos/${selectedNotification.equipment_id}`);
                      setSelectedNotification(null);
                    }}
                  >
                    <Radio className="w-4 h-4" />
                    Ver Equipo
                  </Button>
                </div>
              )}
            </>
          );
        })()}
      </Drawer>
    </div>
  );
}
