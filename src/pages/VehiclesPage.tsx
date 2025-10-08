import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { vehiclesApi } from '../features/vehicles/api';
import { QUERY_KEYS } from '../lib/constants';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Drawer, DrawerSection, DrawerItem } from '../components/ui/Drawer';
import { Eye, Search, MapPin, Navigation, AlertTriangle, Clock } from 'lucide-react';
import { formatFuel, formatRelativeTime, formatSpeed, formatTemp } from '../lib/utils';
import { VEHICLE_STATUS_CONFIG } from '../lib/constants';
import type { Vehicle } from '../lib/types';
import { useAuth } from '../features/auth/hooks';
import { apiClient } from '../lib/apiClient';

export function VehiclesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const { user } = useAuth();

  // Get vehicles based on user role
  const { data: vehicles, isLoading } = useQuery({
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

  const filteredVehicles = vehicles?.filter((vehicle) =>
    vehicle.plate.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vehicle.driver.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

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
          <h1 className="text-2xl font-bold text-gray-900">Vehículos</h1>
          <p className="text-gray-600 mt-1">
            Gestión y monitoreo de vehículos • {filteredVehicles.length} vehículos
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Lista de vehículos</CardTitle>
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Buscar por placa o conductor..."
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
                  <TableHead>Placa</TableHead>
                  <TableHead>Conductor</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Velocidad</TableHead>
                  <TableHead>Combustible</TableHead>
                  <TableHead>Última señal</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVehicles.map((vehicle) => (
                  <TableRow key={vehicle.id}>
                    <TableCell className="font-medium">{vehicle.plate}</TableCell>
                    <TableCell>{vehicle.driver}</TableCell>
                    <TableCell>
                      <Badge variant={vehicle.status}>
                        {VEHICLE_STATUS_CONFIG[vehicle.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={vehicle.speed > 0 ? 'text-ok-600 font-medium' : 'text-gray-500'}>
                        {formatSpeed(vehicle.speed)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-full max-w-[80px] bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              vehicle.fuel > 50
                                ? 'bg-ok-600'
                                : vehicle.fuel > 20
                                ? 'bg-warn-600'
                                : 'bg-crit-600'
                            }`}
                            style={{ width: `${vehicle.fuel}%` }}
                          />
                        </div>
                        <span className="text-sm">{formatFuel(vehicle.fuel)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1 text-sm">
                        <Clock className="w-4 h-4 text-gray-400" />
                        {formatRelativeTime(vehicle.lastSeenMin)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedVehicle(vehicle)}
                      >
                        <Eye className="w-4 h-4" />
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredVehicles.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No se encontraron vehículos</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vehicle Details Drawer */}
      {selectedVehicle && (
        <Drawer
          isOpen={!!selectedVehicle}
          onClose={() => setSelectedVehicle(null)}
          title={`Vehículo ${selectedVehicle.plate}`}
        >
          <DrawerSection title="Información general">
            <div className="space-y-3">
              <DrawerItem
                label="Placa"
                value={selectedVehicle.plate}
              />
              <DrawerItem
                label="Conductor"
                value={selectedVehicle.driver}
              />
              <DrawerItem
                label="ID Dispositivo"
                value={selectedVehicle.deviceId || 'N/A'}
              />
              <DrawerItem
                label="Estado"
                value={
                  <Badge variant={selectedVehicle.status}>
                    {VEHICLE_STATUS_CONFIG[selectedVehicle.status].label}
                  </Badge>
                }
              />
            </div>
          </DrawerSection>

          <DrawerSection title="Telemetría en tiempo real">
            <div className="space-y-3">
              <DrawerItem
                label="Velocidad actual"
                value={
                  <span className={selectedVehicle.speed > 0 ? 'text-ok-600 font-semibold' : ''}>
                    {formatSpeed(selectedVehicle.speed)}
                  </span>
                }
              />
              <DrawerItem
                label="Combustible"
                value={
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          selectedVehicle.fuel > 50
                            ? 'bg-ok-600'
                            : selectedVehicle.fuel > 20
                            ? 'bg-warn-600'
                            : 'bg-crit-600'
                        }`}
                        style={{ width: `${selectedVehicle.fuel}%` }}
                      />
                    </div>
                    <span className="font-medium">{formatFuel(selectedVehicle.fuel)}</span>
                  </div>
                }
              />
              {selectedVehicle.temp && (
                <DrawerItem
                  label="Temperatura motor"
                  value={
                    <span className={selectedVehicle.temp > 30 ? 'text-crit-600 font-semibold' : ''}>
                      {formatTemp(selectedVehicle.temp)}
                    </span>
                  }
                />
              )}
              <DrawerItem
                label="Última señal"
                value={formatRelativeTime(selectedVehicle.lastSeenMin)}
              />
            </div>
          </DrawerSection>

          <DrawerSection title="Ubicación GPS">
            <div className="space-y-3">
              <DrawerItem
                label="Latitud"
                value={selectedVehicle.lat.toFixed(6)}
              />
              <DrawerItem
                label="Longitud"
                value={selectedVehicle.lng.toFixed(6)}
              />
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Zapopan, Jalisco
                </p>
              </div>
            </div>
          </DrawerSection>

          <div className="mt-6 space-y-3">
            <Button className="w-full" variant="primary">
              <Navigation className="w-4 h-4" />
              Ver en mapa
            </Button>
            <Button className="w-full" variant="outline">
              <Clock className="w-4 h-4" />
              Ver historial de ruta
            </Button>
            <Button className="w-full" variant="outline">
              <AlertTriangle className="w-4 h-4" />
              Ver alertas del vehículo
            </Button>
          </div>
        </Drawer>
      )}
    </div>
  );
}
