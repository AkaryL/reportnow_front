import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { vehiclesApi } from '../features/vehicles/api';
import { QUERY_KEYS } from '../lib/constants';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { ClientCard } from '../components/ui/ClientCard';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { ClientTable, ClientTableHeader, ClientTableBody, ClientTableRow, ClientTableHead, ClientTableCell } from '../components/ui/ClientTable';
import { Badge } from '../components/ui/Badge';
import { ClientBadge } from '../components/ui/ClientBadge';
import { Button } from '../components/ui/Button';
import { ClientButton } from '../components/ui/ClientButton';
import { Input } from '../components/ui/Input';
import { ClientInput } from '../components/ui/ClientInput';
import { Drawer, DrawerSection, DrawerItem } from '../components/ui/Drawer';
import { ClientDrawer, ClientDrawerSection, ClientDrawerItem } from '../components/ui/ClientDrawer';
import { Eye, Search, MapPin, Navigation, AlertTriangle, Clock } from 'lucide-react';
import { formatFuel, formatRelativeTime, formatSpeed, formatTemp } from '../lib/utils';
import { VEHICLE_STATUS_CONFIG } from '../lib/constants';
import type { Vehicle } from '../lib/types';
import { useAuth } from '../features/auth/hooks';

export function VehiclesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 10;
  const { user } = useAuth();
  const navigate = useNavigate();

  // Determine if current user is a client for conditional styling
  const isClient = user?.role === 'client';
  const CardComponent = isClient ? ClientCard : Card;
  const ButtonComponent = isClient ? ClientButton : Button;
  const BadgeComponent = isClient ? ClientBadge : Badge;
  const InputComponent = isClient ? ClientInput : Input;
  const TableComponent = isClient ? ClientTable : Table;
  const TableHeaderComponent = isClient ? ClientTableHeader : TableHeader;
  const TableBodyComponent = isClient ? ClientTableBody : TableBody;
  const TableRowComponent = isClient ? ClientTableRow : TableRow;
  const TableHeadComponent = isClient ? ClientTableHead : TableHead;
  const TableCellComponent = isClient ? ClientTableCell : TableCell;
  const DrawerComponent = isClient ? ClientDrawer : Drawer;
  const DrawerSectionComponent = isClient ? ClientDrawerSection : DrawerSection;
  const DrawerItemComponent = isClient ? ClientDrawerItem : DrawerItem;

  // Get vehicles based on user role
  const { data: vehicles, isLoading } = useQuery({
    queryKey: user?.role === 'client' ? ['user-vehicles', user.client_id] : QUERY_KEYS.VEHICLES,
    queryFn: async () => {
      if (user?.role === 'client' && user.client_id) {
        // Get only vehicles for this client
        const allVehicles = await vehiclesApi.getAll();
        return allVehicles.filter(v => v.clientId === user.client_id);
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

  // Calculate pagination
  const totalPages = Math.ceil(filteredVehicles.length / itemsPerPage);
  const startIndex = currentPage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedVehicles = filteredVehicles.slice(startIndex, endIndex);

  // Reset to first page when search changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(0);
  };

  const handleViewOnMap = () => {
    if (!selectedVehicle) return;
    // Open Google Maps with vehicle coordinates
    const googleMapsUrl = `https://www.google.com/maps?q=${selectedVehicle.lat},${selectedVehicle.lng}`;
    window.open(googleMapsUrl, '_blank');
  };

  const handleViewRouteHistory = () => {
    if (!selectedVehicle) return;
    // Navegar a la página de detalles del vehículo
    navigate(`/vehiculos/${selectedVehicle.id}`);
  };

  const handleViewAlerts = () => {
    if (!selectedVehicle) return;
    // Navegar a la página de detalles del vehículo
    navigate(`/vehiculos/${selectedVehicle.id}`);
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
          <h1 className={`text-2xl font-bold ${isClient ? 'client-heading' : 'text-gray-900'}`}>Vehículos</h1>
          <p className={`mt-1 ${isClient ? 'client-text-secondary' : 'text-gray-600'}`}>
            Gestión y monitoreo de vehículos • {filteredVehicles.length} vehículos
          </p>
        </div>
      </div>

      <CardComponent>
        {!isClient && (
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle>Lista de vehículos</CardTitle>
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <InputComponent
                  placeholder="Buscar por placa o conductor..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
        )}
        {isClient && (
          <div className="p-6 border-b border-white/8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h3 className="client-heading text-xl">Lista de vehículos</h3>
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400/50" />
                <InputComponent
                  placeholder="Buscar por placa o conductor..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        )}
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <TableComponent>
              <TableHeaderComponent>
                <TableRowComponent>
                  <TableHeadComponent>Placa</TableHeadComponent>
                  <TableHeadComponent>Conductor</TableHeadComponent>
                  <TableHeadComponent>Estado</TableHeadComponent>
                  <TableHeadComponent>Velocidad</TableHeadComponent>
                  <TableHeadComponent>Combustible</TableHeadComponent>
                  <TableHeadComponent>Última señal</TableHeadComponent>
                  <TableHeadComponent className="text-right">Acciones</TableHeadComponent>
                </TableRowComponent>
              </TableHeaderComponent>
              <TableBodyComponent>
                {paginatedVehicles.map((vehicle) => (
                  <TableRowComponent key={vehicle.id}>
                    <TableCellComponent className={isClient ? '' : 'font-medium'}>{vehicle.plate}</TableCellComponent>
                    <TableCellComponent>{vehicle.driver}</TableCellComponent>
                    <TableCellComponent>
                      <BadgeComponent variant={vehicle.status}>
                        {VEHICLE_STATUS_CONFIG[vehicle.status].label}
                      </BadgeComponent>
                    </TableCellComponent>
                    <TableCellComponent>
                      <span className={vehicle.speed > 0 ? `${isClient ? 'text-green-400' : 'text-ok-600'} font-medium` : `${isClient ? 'text-white/40' : 'text-gray-500'}`}>
                        {formatSpeed(vehicle.speed)}
                      </span>
                    </TableCellComponent>
                    <TableCellComponent>
                      <div className="flex items-center gap-2">
                        <div className={`w-full max-w-[80px] rounded-full h-2 ${isClient ? 'bg-white/10' : 'bg-gray-200'}`}>
                          <div
                            className={`h-2 rounded-full ${
                              vehicle.fuel > 50
                                ? isClient ? 'bg-green-400' : 'bg-ok-600'
                                : vehicle.fuel > 20
                                ? isClient ? 'bg-orange-400' : 'bg-warn-600'
                                : isClient ? 'bg-red-400' : 'bg-crit-600'
                            }`}
                            style={{ width: `${vehicle.fuel}%` }}
                          />
                        </div>
                        <span className="text-sm">{formatFuel(vehicle.fuel)}</span>
                      </div>
                    </TableCellComponent>
                    <TableCellComponent>
                      <span className="flex items-center gap-1 text-sm">
                        <Clock className={`w-4 h-4 ${isClient ? 'text-cyan-400/50' : 'text-gray-400'}`} />
                        {formatRelativeTime(vehicle.lastSeenMin)}
                      </span>
                    </TableCellComponent>
                    <TableCellComponent className="text-right">
                      <ButtonComponent
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedVehicle(vehicle)}
                      >
                        <Eye className="w-4 h-4" />
                        Ver
                      </ButtonComponent>
                    </TableCellComponent>
                  </TableRowComponent>
                ))}
              </TableBodyComponent>
            </TableComponent>
          </div>

          {filteredVehicles.length === 0 && (
            <div className="text-center py-12">
              <p className={isClient ? 'client-text-tertiary' : 'text-gray-500'}>No se encontraron vehículos</p>
            </div>
          )}

          {/* Pagination */}
          {filteredVehicles.length > itemsPerPage && (
            <div className={`px-6 py-4 border-t flex items-center justify-between ${isClient ? 'border-white/8' : 'border-gray-200'}`}>
              <div className={`flex items-center gap-2 text-sm ${isClient ? 'client-text-secondary' : 'text-gray-600'}`}>
                <span>
                  Mostrando {startIndex + 1} - {Math.min(endIndex, filteredVehicles.length)} de {filteredVehicles.length} vehículos
                </span>
              </div>
              <div className="flex items-center gap-2">
                <ButtonComponent
                  variant={isClient ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                >
                  Anterior
                </ButtonComponent>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded-md text-sm font-medium transition-colors ${
                        currentPage === page
                          ? isClient
                            ? 'bg-gradient-to-br from-cyan-500 to-blue-500 text-white'
                            : 'bg-primary text-white'
                          : isClient
                            ? 'text-white/70 hover:bg-white/5'
                            : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {page + 1}
                    </button>
                  ))}
                </div>
                <ButtonComponent
                  variant={isClient ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                  disabled={currentPage === totalPages - 1}
                >
                  Siguiente
                </ButtonComponent>
              </div>
            </div>
          )}
        </CardContent>
      </CardComponent>

      {/* Vehicle Details Drawer */}
      {selectedVehicle && (
        <DrawerComponent
          isOpen={!!selectedVehicle}
          onClose={() => setSelectedVehicle(null)}
          title={`Vehículo ${selectedVehicle.plate}`}
        >
          <DrawerSectionComponent title="Información general">
            <div className="space-y-3">
              <DrawerItemComponent
                label="Placa"
                value={selectedVehicle.plate}
              />
              <DrawerItemComponent
                label="Conductor"
                value={selectedVehicle.driver}
              />
              <DrawerItemComponent
                label="ID Dispositivo"
                value={selectedVehicle.deviceId || 'N/A'}
              />
              <DrawerItemComponent
                label="Estado"
                value={
                  <BadgeComponent variant={selectedVehicle.status}>
                    {VEHICLE_STATUS_CONFIG[selectedVehicle.status].label}
                  </BadgeComponent>
                }
              />
            </div>
          </DrawerSectionComponent>

          <DrawerSectionComponent title="Telemetría en tiempo real">
            <div className="space-y-3">
              <DrawerItemComponent
                label="Velocidad actual"
                value={
                  <span className={selectedVehicle.speed > 0 ? (isClient ? 'text-green-400 font-semibold' : 'text-ok-600 font-semibold') : ''}>
                    {formatSpeed(selectedVehicle.speed)}
                  </span>
                }
              />
              <DrawerItemComponent
                label="Combustible"
                value={
                  <div className="flex items-center gap-2">
                    <div className={`w-24 rounded-full h-2 ${isClient ? 'bg-white/10' : 'bg-gray-200'}`}>
                      <div
                        className={`h-2 rounded-full ${
                          selectedVehicle.fuel > 50
                            ? isClient ? 'bg-green-400' : 'bg-ok-600'
                            : selectedVehicle.fuel > 20
                            ? isClient ? 'bg-orange-400' : 'bg-warn-600'
                            : isClient ? 'bg-red-400' : 'bg-crit-600'
                        }`}
                        style={{ width: `${selectedVehicle.fuel}%` }}
                      />
                    </div>
                    <span className="font-medium">{formatFuel(selectedVehicle.fuel)}</span>
                  </div>
                }
              />
              {selectedVehicle.temp && (
                <DrawerItemComponent
                  label="Temperatura motor"
                  value={
                    <span className={selectedVehicle.temp > 30 ? (isClient ? 'text-red-400 font-semibold' : 'text-crit-600 font-semibold') : ''}>
                      {formatTemp(selectedVehicle.temp)}
                    </span>
                  }
                />
              )}
              <DrawerItemComponent
                label="Última señal"
                value={formatRelativeTime(selectedVehicle.lastSeenMin)}
              />
            </div>
          </DrawerSectionComponent>

          <DrawerSectionComponent title="Ubicación GPS">
            <div className="space-y-3">
              <DrawerItemComponent
                label="Latitud"
                value={selectedVehicle.lat.toFixed(6)}
              />
              <DrawerItemComponent
                label="Longitud"
                value={selectedVehicle.lng.toFixed(6)}
              />
              <div className={`mt-4 p-3 rounded-lg ${isClient ? 'bg-white/5 border border-white/10' : 'bg-gray-50'}`}>
                <p className={`text-sm ${isClient ? 'client-text-secondary' : 'text-gray-600'}`}>
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Zapopan, Jalisco
                </p>
              </div>
            </div>
          </DrawerSectionComponent>

          <div className="mt-6 space-y-3">
            <ButtonComponent className="w-full" variant="primary" onClick={handleViewOnMap}>
              <Navigation className="w-4 h-4" />
              Ver en mapa
            </ButtonComponent>
            <ButtonComponent className="w-full" variant={isClient ? 'secondary' : 'outline'} onClick={handleViewRouteHistory}>
              <Clock className="w-4 h-4" />
              Ver historial de ruta
            </ButtonComponent>
            <ButtonComponent className="w-full" variant={isClient ? 'secondary' : 'outline'} onClick={handleViewAlerts}>
              <AlertTriangle className="w-4 h-4" />
              Ver alertas del vehículo
            </ButtonComponent>
          </div>
        </DrawerComponent>
      )}
    </div>
  );
}
