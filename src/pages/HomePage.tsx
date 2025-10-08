import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { vehiclesApi } from '../features/vehicles/api';
import { geofencesApi } from '../features/geofences/api';
import { wsClient } from '../lib/websocket';
import { QUERY_KEYS } from '../lib/constants';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { MapView } from '../components/map/MapView';
import { Drawer, DrawerSection, DrawerItem } from '../components/ui/Drawer';
import { Activity, Truck, AlertTriangle, Gauge, Search, X, MapPin, Navigation } from 'lucide-react';
import type { Vehicle, VehicleStatus } from '../lib/types';
import { formatFuel, formatSpeed, formatTemp, formatRelativeTime } from '../lib/utils';
import { VEHICLE_STATUS_CONFIG } from '../lib/constants';
import { useAuth } from '../features/auth/hooks';
import { apiClient } from '../lib/apiClient';

export function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<VehicleStatus[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showGeofences, setShowGeofences] = useState(true);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Get vehicles based on user role
  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: user?.role === 'client' ? ['user-vehicles', user.id] : QUERY_KEYS.VEHICLES,
    queryFn: async () => {
      if (user?.role === 'client') {
        // Get only assigned vehicles for client users
        const response = await apiClient.get<any[]>(`/api/users/${user.id}/vehicles`);
        return response.data.map((v: any) => ({
          id: v.id,
          plate: v.plate,
          driver: v.driver,
          status: v.status,
          fuel: v.fuel,
          speed: v.speed || 0,
          temp: v.temp,
          lat: v.lat,
          lng: v.lng,
          lastSeenMin: v.last_seen_min || 0,
          deviceId: v.device_id,
          clientId: v.client_id,
        }));
      } else {
        // Get all vehicles for admin and superuser
        return vehiclesApi.getAll();
      }
    },
    enabled: !!user,
  });

  const { data: geofences = [] } = useQuery({
    queryKey: QUERY_KEYS.GEOFENCES,
    queryFn: geofencesApi.getAll,
  });

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!user) return;

    wsClient.connect();

    const queryKey = user.role === 'client' ? ['user-vehicles', user.id] : QUERY_KEYS.VEHICLES;

    wsClient.on('vehicle:updated', () => {
      queryClient.invalidateQueries({ queryKey });
    });

    wsClient.on('vehicle:created', () => {
      queryClient.invalidateQueries({ queryKey });
    });

    wsClient.on('vehicle:deleted', () => {
      queryClient.invalidateQueries({ queryKey });
    });

    return () => {
      wsClient.off('vehicle:updated');
      wsClient.off('vehicle:created');
      wsClient.off('vehicle:deleted');
    };
  }, [queryClient, user]);

  // Calculate KPIs
  const kpis = [
    {
      label: 'En movimiento',
      value: vehicles.filter((v) => v.status === 'moving').length,
      icon: Activity,
      color: 'text-ok-600',
      bg: 'bg-ok-50',
      status: 'moving' as VehicleStatus,
    },
    {
      label: 'Detenidos',
      value: vehicles.filter((v) => v.status === 'stopped').length,
      icon: Truck,
      color: 'text-info-600',
      bg: 'bg-info-50',
      status: 'stopped' as VehicleStatus,
    },
    {
      label: 'Sin señal',
      value: vehicles.filter((v) => v.status === 'offline').length,
      icon: AlertTriangle,
      color: 'text-gray-600',
      bg: 'bg-gray-50',
      status: 'offline' as VehicleStatus,
    },
    {
      label: 'Críticos',
      value: vehicles.filter((v) => v.status === 'critical').length,
      icon: Gauge,
      color: 'text-crit-600',
      bg: 'bg-crit-50',
      status: 'critical' as VehicleStatus,
    },
  ];

  // Filter vehicles
  const filteredVehicles = vehicles.filter((vehicle) => {
    // Search filter
    const matchesSearch =
      !searchQuery ||
      vehicle.plate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.driver.toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter
    const matchesStatus =
      selectedStatuses.length === 0 || selectedStatuses.includes(vehicle.status);

    return matchesSearch && matchesStatus;
  });

  const toggleStatus = (status: VehicleStatus) => {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedStatuses([]);
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Monitoreo en tiempo real de {user?.role === 'client' ? 'tus vehículos asignados' : 'tu flota'} • {filteredVehicles.length} de {vehicles.length} vehículos
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          const isSelected = selectedStatuses.includes(kpi.status);

          return (
            <Card
              key={kpi.label}
              className={`hover:shadow-medium transition-all cursor-pointer ${
                isSelected ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => toggleStatus(kpi.status)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{kpi.label}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{kpi.value}</p>
                  </div>
                  <div className={`${kpi.bg} ${kpi.color} p-3 rounded-lg`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Buscar por placa o conductor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              {selectedStatuses.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="w-4 h-4" />
                  Limpiar filtros
                </Button>
              )}
              <Button
                variant={showGeofences ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setShowGeofences(!showGeofences)}
              >
                <MapPin className="w-4 h-4" />
                Geocercas
              </Button>
            </div>
          </div>

          {selectedStatuses.length > 0 && (
            <div className="mt-3 flex gap-2 flex-wrap">
              <span className="text-sm text-gray-600">Filtros activos:</span>
              {selectedStatuses.map((status) => (
                <Badge key={status} variant={status}>
                  {VEHICLE_STATUS_CONFIG[status].label}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Map */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Mapa de vehículos en Zapopan</CardTitle>
            <Badge variant="default">{filteredVehicles.length} vehículos</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="h-[500px] w-full">
            <MapView
              vehicles={filteredVehicles}
              geofences={showGeofences ? geofences : []}
              onVehicleClick={setSelectedVehicle}
              showGeofences={showGeofences}
            />
          </div>
        </CardContent>
      </Card>

      {/* Vehicle Details Drawer */}
      {selectedVehicle && (
        <Drawer
          isOpen={!!selectedVehicle}
          onClose={() => setSelectedVehicle(null)}
          title={`Vehículo ${selectedVehicle.plate}`}
        >
          <DrawerSection title="Estado actual">
            <div className="space-y-3">
              <DrawerItem
                label="Estado"
                value={
                  <Badge variant={selectedVehicle.status}>
                    {VEHICLE_STATUS_CONFIG[selectedVehicle.status].label}
                  </Badge>
                }
              />
              <DrawerItem
                label="Conductor"
                value={selectedVehicle.driver}
              />
              <DrawerItem
                label="Última señal"
                value={formatRelativeTime(selectedVehicle.lastSeenMin)}
              />
            </div>
          </DrawerSection>

          <DrawerSection title="Telemetría">
            <div className="space-y-3">
              <DrawerItem
                label="Velocidad"
                value={formatSpeed(selectedVehicle.speed)}
              />
              <DrawerItem
                label="Combustible"
                value={formatFuel(selectedVehicle.fuel)}
              />
              {selectedVehicle.temp && (
                <DrawerItem
                  label="Temperatura"
                  value={formatTemp(selectedVehicle.temp)}
                />
              )}
            </div>
          </DrawerSection>

          <DrawerSection title="Ubicación">
            <div className="space-y-3">
              <DrawerItem
                label="Latitud"
                value={selectedVehicle.lat.toFixed(6)}
              />
              <DrawerItem
                label="Longitud"
                value={selectedVehicle.lng.toFixed(6)}
              />
            </div>
          </DrawerSection>

          <div className="mt-6 space-y-3">
            <Button className="w-full" variant="primary">
              <Navigation className="w-4 h-4" />
              Ver historial de ruta
            </Button>
            <Button className="w-full" variant="outline">
              <AlertTriangle className="w-4 h-4" />
              Ver alertas
            </Button>
          </div>
        </Drawer>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Vehículos en movimiento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {vehicles
                .filter((v) => v.status === 'moving')
                .slice(0, 5)
                .map((vehicle) => (
                  <div
                    key={vehicle.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                    onClick={() => setSelectedVehicle(vehicle)}
                  >
                    <div className="w-2 h-2 bg-ok-600 rounded-full animate-pulse" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{vehicle.plate}</p>
                      <p className="text-xs text-gray-500">{vehicle.driver}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {formatSpeed(vehicle.speed)}
                      </p>
                      <p className="text-xs text-gray-500">{formatFuel(vehicle.fuel)}</p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alertas recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {vehicles
                .filter((v) => v.status === 'critical' || v.fuel < 20)
                .slice(0, 5)
                .map((vehicle) => (
                  <div
                    key={vehicle.id}
                    className="flex items-center gap-3 p-3 bg-crit-50 rounded-lg hover:bg-crit-100 cursor-pointer transition-colors"
                    onClick={() => setSelectedVehicle(vehicle)}
                  >
                    <AlertTriangle className="w-5 h-5 text-crit-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{vehicle.plate}</p>
                      <p className="text-xs text-gray-500">
                        {vehicle.fuel < 20 ? 'Combustible bajo' : 'Estado crítico'}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
