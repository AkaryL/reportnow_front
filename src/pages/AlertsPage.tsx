import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { alertsApi } from '../features/alerts/api';
import { equipmentsApi } from '../features/equipments/api';
import { geofencesApi } from '../features/geofences/api';
import { clientsApi } from '../features/clients/api';
import { QUERY_KEYS } from '../lib/constants';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import {
  Bell,
  Search,
  MapPin,
  LogIn,
  LogOut,
  Clock,
  Radio,
  Filter,
  Download
} from 'lucide-react';
import { generateListPDF } from '../lib/pdfGenerator';
import { Button } from '../components/ui/Button';
import type { Alert, Equipment, Geofence, Client } from '../lib/types';
import { useAuth } from '../features/auth/hooks';
import { cn } from '../lib/utils';

export function AlertsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClient, setFilterClient] = useState<string>('all');
  const [filterType, setFilterType] = useState<'all' | 'geofence_enter' | 'geofence_exit'>('all');
  const { user } = useAuth();
  const isSuperuser = user?.role === 'superuser';

  // Fetch alerts
  const { data: alerts = [], isLoading: isLoadingAlerts } = useQuery({
    queryKey: [...QUERY_KEYS.ALERTS, filterClient],
    queryFn: () => alertsApi.getAll(filterClient !== 'all' ? filterClient : undefined),
  });

  // Fetch equipments for display
  const { data: equipments = [] } = useQuery({
    queryKey: QUERY_KEYS.EQUIPMENTS,
    queryFn: equipmentsApi.getAll,
  });

  // Fetch geofences for display
  const { data: geofences = [] } = useQuery({
    queryKey: QUERY_KEYS.GEOFENCES,
    queryFn: geofencesApi.getAll,
  });

  // Fetch clients for filter (superuser only)
  const { data: clients = [] } = useQuery({
    queryKey: QUERY_KEYS.CLIENTS,
    queryFn: clientsApi.getAll,
    enabled: isSuperuser,
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

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // Filter alerts
  const filteredAlerts = alerts.filter((alert) => {
    // Filter by search (equipment IMEI or geofence name)
    const equipment = getEquipmentInfo(alert.equipment_id);
    const geofenceName = getGeofenceName(alert.geofence_id);
    const matchesSearch =
      !searchQuery ||
      equipment?.imei.toLowerCase().includes(searchQuery.toLowerCase()) ||
      equipment?.serial?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      geofenceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.message.toLowerCase().includes(searchQuery.toLowerCase());

    // Filter by type
    const matchesType = filterType === 'all' || alert.type === filterType;

    return matchesSearch && matchesType;
  });

  // Stats
  const totalAlerts = alerts.length;
  const entryAlerts = alerts.filter((a) => a.type === 'geofence_enter').length;
  const exitAlerts = alerts.filter((a) => a.type === 'geofence_exit').length;

  if (isLoadingAlerts) {
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Alertas</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Historial de alertas de geocercas • {filteredAlerts.length} alertas
          </p>
        </div>
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
              date: formatDate(a.created_at),
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
          </div>
        </CardContent>
      </Card>

      {/* Alerts Table */}
      <Card>
        <CardHeader className="p-6">
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Historial de Alertas
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
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
                    <TableHead>Equipo GPS</TableHead>
                    <TableHead>Geocerca</TableHead>
                    {isSuperuser && <TableHead>Cliente</TableHead>}
                    <TableHead>Mensaje</TableHead>
                    <TableHead>Ubicación</TableHead>
                    <TableHead>Velocidad</TableHead>
                    <TableHead>Fecha/Hora</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAlerts.map((alert) => {
                    const equipment = getEquipmentInfo(alert.equipment_id);
                    return (
                      <TableRow key={alert.id}>
                        <TableCell>
                          {alert.type === 'geofence_enter' ? (
                            <Badge className="bg-green-50 text-green-700 flex items-center gap-1 w-fit">
                              <LogIn className="w-3 h-3" />
                              Entrada
                            </Badge>
                          ) : (
                            <Badge className="bg-red-50 text-red-700 flex items-center gap-1 w-fit">
                              <LogOut className="w-3 h-3" />
                              Salida
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Radio className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {equipment?.imei || 'Desconocido'}
                              </p>
                              {equipment?.serial && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">{equipment.serial}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                            {getGeofenceName(alert.geofence_id)}
                          </div>
                        </TableCell>
                        {isSuperuser && (
                          <TableCell>
                            {getClientName(equipment?.client_id)}
                          </TableCell>
                        )}
                        <TableCell>
                          <span className="text-gray-700 dark:text-gray-300 line-clamp-2">
                            {alert.message}
                          </span>
                        </TableCell>
                        <TableCell>
                          {alert.lat && alert.lng ? (
                            <span className="font-mono text-xs text-gray-600 dark:text-gray-400">
                              {alert.lat.toFixed(4)}, {alert.lng.toFixed(4)}
                            </span>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {alert.speed !== undefined && alert.speed !== null ? (
                            <span className={cn(
                              'font-medium',
                              alert.speed > 80 ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'
                            )}>
                              {alert.speed.toFixed(0)} km/h
                            </span>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                            <Clock className="w-3 h-3" />
                            <span className="text-sm">{formatDate(alert.created_at)}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
