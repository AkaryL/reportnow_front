import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { vehiclesApi } from '../features/vehicles/api';
import { geofencesApi } from '../features/geofences/api';
import { clientsApi } from '../features/clients/api';
import { notificationsApi } from '../features/notifications/api';
import { wsClient } from '../lib/websocket';
import { QUERY_KEYS } from '../lib/constants';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { ClientCard } from '../components/ui/ClientCard';
import { Input } from '../components/ui/Input';
import { ClientInput } from '../components/ui/ClientInput';
import { Badge } from '../components/ui/Badge';
import { ClientBadge } from '../components/ui/ClientBadge';
import { Button } from '../components/ui/Button';
import { ClientButton } from '../components/ui/ClientButton';
import { MapView } from '../components/map/MapView';
import { LeafletMap } from '../components/map/LeafletMap';
import { Drawer, DrawerSection, DrawerItem } from '../components/ui/Drawer';
import { GeofenceModal } from '../components/GeofenceModal';
import { Topbar } from '../components/Topbar';
import { Activity, Truck, AlertTriangle, Gauge, Search, X, MapPin, Navigation, Bell, Clock } from 'lucide-react';
import type { Vehicle, VehicleStatus } from '../lib/types';
import { formatFuel, formatSpeed, formatTemp, formatRelativeTime } from '../lib/utils';
import { VEHICLE_STATUS_CONFIG } from '../lib/constants';
import { useAuth } from '../features/auth/hooks';
import { apiClient } from '../lib/apiClient';

export function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<VehicleStatus[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showGeofences, setShowGeofences] = useState(true);
  const [ordersPeriod, setOrdersPeriod] = useState<'day' | 'week' | 'month'>('week');
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [isGeofenceModalOpen, setIsGeofenceModalOpen] = useState(false);
  const [mapFilters, setMapFilters] = useState({
    lowFuel: false,
    moving: false,
    insideGeofence: false,
  });
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Determine if current user is a client for conditional styling
  const isClient = user?.role === 'client';
  const CardComponent = isClient ? ClientCard : Card;
  const BadgeComponent = isClient ? ClientBadge : Badge;
  const ButtonComponent = isClient ? ClientButton : Button;
  const InputComponent = isClient ? ClientInput : Input;

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
    refetchInterval: false, // Disable automatic refetching
    refetchOnWindowFocus: false, // Don't refetch when window gains focus
    refetchOnMount: false, // Don't refetch when component mounts again
    refetchOnReconnect: false, // Don't refetch when reconnecting
  });

  const { data: geofences = [] } = useQuery({
    queryKey: QUERY_KEYS.GEOFENCES,
    queryFn: geofencesApi.getAll,
  });

  const { data: clients = [] } = useQuery({
    queryKey: QUERY_KEYS.CLIENTS,
    queryFn: clientsApi.getAll,
    enabled: user?.role === 'superuser' || user?.role === 'admin',
  });

  const { data: notifications = [] } = useQuery({
    queryKey: QUERY_KEYS.NOTIFICATIONS,
    queryFn: notificationsApi.getAll,
  });

  // WebSocket connection for real-time updates - DISABLED to prevent auto-reload
  // useEffect(() => {
  //   if (!user) return;

  //   wsClient.connect();

  //   const queryKey = user.role === 'client' ? ['user-vehicles', user.id] : QUERY_KEYS.VEHICLES;

  //   wsClient.on('vehicle:updated', () => {
  //     queryClient.invalidateQueries({ queryKey });
  //   });

  //   wsClient.on('vehicle:created', () => {
  //     queryClient.invalidateQueries({ queryKey });
  //   });

  //   wsClient.on('vehicle:deleted', () => {
  //     queryClient.invalidateQueries({ queryKey });
  //   });

  //   return () => {
  //     wsClient.off('vehicle:updated');
  //     wsClient.off('vehicle:created');
  //     wsClient.off('vehicle:deleted');
  //   };
  // }, [queryClient, user]);

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

  // Helper function: Check if point is inside polygon using ray-casting algorithm
  const isPointInPolygon = (point: [number, number], polygon: number[][]) => {
    const [lat, lng] = point;
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const [lat1, lng1] = polygon[i];
      const [lat2, lng2] = polygon[j];

      const intersect =
        lng1 > lng !== lng2 > lng &&
        lat < ((lat2 - lat1) * (lng - lng1)) / (lng2 - lng1) + lat1;

      if (intersect) inside = !inside;
    }

    return inside;
  };

  // Helper function: Calculate distance between two points (Haversine formula)
  const getDistanceInMeters = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  // Helper function: Check if vehicle is inside any geofence
  const isVehicleInGeofence = (vehicle: Vehicle) => {
    if (!geofences || geofences.length === 0) return false;

    return geofences.some((geofence: any) => {
      // Handle Circle type geofences (from database: geom_type = 'Circle')
      if (geofence.geom_type === 'Circle' && geofence.coordinates) {
        try {
          const coords = typeof geofence.coordinates === 'string'
            ? JSON.parse(geofence.coordinates)
            : geofence.coordinates;

          if (coords.center && coords.radius) {
            const [centerLng, centerLat] = coords.center;
            const distance = getDistanceInMeters(vehicle.lat, vehicle.lng, centerLat, centerLng);
            return distance <= coords.radius;
          }
        } catch (error) {
          console.error('Error parsing circle geofence:', error);
          return false;
        }
      }

      // Handle Polygon type geofences (from UI: geom.type = 'Polygon')
      if (geofence.geom?.type === 'Polygon' && geofence.geom.coordinates) {
        const coordinates = geofence.geom.coordinates[0];
        if (!coordinates || coordinates.length === 0) return false;

        // Auto-detect coordinate format
        const firstCoord = coordinates[0];
        const isLatLngFormat = Math.abs(firstCoord[0]) <= 90 && Math.abs(firstCoord[1]) <= 180;

        // Convert to [lat, lng] format for comparison
        const polygonCoords = isLatLngFormat
          ? coordinates.map((coord: number[]) => [coord[0], coord[1]])
          : coordinates.map((coord: number[]) => [coord[1], coord[0]]);

        return isPointInPolygon([vehicle.lat, vehicle.lng], polygonCoords);
      }

      return false;
    });
  };

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

    // Client filter (for map search and vehicle list)
    const matchesMapSearch =
      !mapSearchQuery ||
      vehicle.plate.toLowerCase().includes(mapSearchQuery.toLowerCase()) ||
      vehicle.driver.toLowerCase().includes(mapSearchQuery.toLowerCase());

    const matchesClient =
      !selectedClientId || String(vehicle.clientId) === String(selectedClientId);

    // Map filters
    const matchesMoving = !mapFilters.moving || vehicle.status === 'moving';
    const matchesInsideGeofence = !mapFilters.insideGeofence || isVehicleInGeofence(vehicle);

    return matchesSearch && matchesStatus && matchesMapSearch && matchesClient && matchesMoving && matchesInsideGeofence;
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

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleStatusFilter = (status: VehicleStatus) => {
    toggleStatus(status);
  };

  const handleAddGeofence = () => {
    setIsGeofenceModalOpen(true);
  };

  const handleSaveGeofence = async (geofenceData: { name: string; color: string; center: [number, number]; radius: number }) => {
    try {
      // Convertir el círculo a un polígono aproximado para el backend
      const numPoints = 32; // Número de puntos para aproximar el círculo
      const coordinates: [number, number][] = [];
      const [lat, lng] = geofenceData.center;

      // Calcular puntos del círculo
      // Aproximación: 1 grado de latitud ≈ 111,320 metros
      // 1 grado de longitud ≈ 111,320 * cos(latitud) metros
      const latRadius = geofenceData.radius / 111320;
      const lngRadius = geofenceData.radius / (111320 * Math.cos(lat * Math.PI / 180));

      for (let i = 0; i < numPoints; i++) {
        const angle = (i / numPoints) * 2 * Math.PI;
        const pointLat = lat + latRadius * Math.sin(angle);
        const pointLng = lng + lngRadius * Math.cos(angle);
        coordinates.push([pointLat, pointLng]);
      }

      // Cerrar el polígono (el primer punto debe ser igual al último)
      coordinates.push(coordinates[0]);

      const payload = {
        name: geofenceData.name,
        type: 'zone',
        color: geofenceData.color,
        geom: {
          type: 'Polygon',
          coordinates: [coordinates],
        },
      };

      await apiClient.post('/api/geofences', payload);

      // Refrescar la lista de geocercas
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GEOFENCES });

      alert('Geocerca creada exitosamente');
    } catch (error) {
      console.error('Error al crear geocerca:', error);
      alert('Error al crear la geocerca');
    }
  };

  const handleMapSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Buscando en mapa:', mapSearchQuery);
  };

  const clearMapSearch = () => {
    setMapSearchQuery('');
  };

  const toggleMapFilter = (filter: keyof typeof mapFilters) => {
    setMapFilters((prev) => ({
      ...prev,
      [filter]: !prev[filter],
    }));
  };

  const clearMapFilters = () => {
    setMapFilters({
      lowFuel: false,
      moving: false,
      insideGeofence: false,
    });
  };

  const handleViewAllOrders = () => {
    // Navegar a la vista de todas las órdenes
    console.log('Viendo todas las órdenes...');
    // Aquí iría la navegación a /orders
  };

  const handleViewRouteHistory = () => {
    if (!selectedVehicle) return;
    // TODO: Implementar navegación a página de historial de ruta
    console.log('Ver historial de ruta para:', selectedVehicle.plate);
    alert(`Función de historial de ruta para ${selectedVehicle.plate} - Por implementar`);
  };

  const handleViewAlerts = () => {
    if (!selectedVehicle) return;
    // TODO: Implementar navegación a página de alertas
    console.log('Ver alertas para:', selectedVehicle.plate);
    alert(`Función de alertas para ${selectedVehicle.plate} - Por implementar`);
  };

  // Helper function to get notification icon and colors
  const getNotificationStyle = (type: string) => {
    switch (type) {
      case 'crit':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          iconColor: 'text-red-600',
          icon: AlertTriangle,
        };
      case 'warn':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          iconColor: 'text-yellow-600',
          icon: AlertTriangle,
        };
      case 'info':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          iconColor: 'text-blue-600',
          icon: Bell,
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          iconColor: 'text-gray-600',
          icon: Bell,
        };
    }
  };

  // Helper function to format relative time
  const getRelativeTime = (timestamp: string) => {
    const now = new Date();
    const notifTime = new Date(timestamp);
    const diffMs = now.getTime() - notifTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;

    const diffDays = Math.floor(diffHours / 24);
    return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
  };

  return (
    <div className="space-y-0">
      {/* Topbar - solo para admin/superuser */}
      {!isClient && (
        <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-6">
          <Topbar
            title="Home"
            subtitle="Visión general en tiempo real"
            onSearch={handleSearch}
          />
        </div>
      )}

      <div className={isClient ? 'space-y-5' : 'pt-6 space-y-5'}>
        {/* Header para cliente */}
        {isClient && (
          <div className="mb-6">
            <h1 className="client-heading text-3xl mb-2">Dashboard</h1>
            <p className="client-subheading">Visión general de tu flota en tiempo real</p>
          </div>
        )}

      {/* Tarjetas de resumen - 4 cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1 - En movimiento */}
        <CardComponent
          className={`h-[140px] transition-shadow cursor-pointer p-5 ${
            isClient ? 'hover:bg-white/8' : 'hover:shadow-lg'
          }`}
          onClick={() => handleStatusFilter('moving')}
        >
          <div className="h-full flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <h3 className={`text-sm font-semibold ${isClient ? 'client-text-secondary' : 'text-gray-700'}`}>En movimiento</h3>
              <ButtonComponent
                variant={isClient ? 'secondary' : 'outline'}
                size="sm"
                className={`h-7 px-3 text-xs rounded-full ${
                  isClient ? '' : 'border-black text-black hover:bg-[#EEF7FE]'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleStatusFilter('moving');
                }}
              >
                Ver
              </ButtonComponent>
            </div>
            <div>
              <p className={`text-[34px] font-semibold leading-none ${
                isClient ? 'client-text-primary' : 'text-gray-900'
              }`}>
                {vehicles.filter((v) => v.status === 'moving').length}
              </p>
              <p className={`text-[12.5px] mt-2 ${isClient ? 'client-text-tertiary' : 'text-slate-500'}`}>
                Vehículos transmitiendo posición
              </p>
            </div>
          </div>
        </CardComponent>

        {/* Card 2 - Detenidos */}
        <CardComponent
          className={`h-[140px] transition-shadow cursor-pointer p-5 ${
            isClient ? 'hover:bg-white/8' : 'hover:shadow-lg'
          }`}
          onClick={() => handleStatusFilter('stopped')}
        >
          <div className="h-full flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <h3 className={`text-sm font-semibold ${isClient ? 'client-text-secondary' : 'text-gray-700'}`}>Detenidos</h3>
              <ButtonComponent
                variant={isClient ? 'secondary' : 'outline'}
                size="sm"
                className={`h-7 px-3 text-xs rounded-full ${
                  isClient ? '' : 'border-black text-black hover:bg-[#EEF7FE]'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleStatusFilter('stopped');
                }}
              >
                Ver
              </ButtonComponent>
            </div>
            <div>
              <p className={`text-[34px] font-semibold leading-none ${
                isClient ? 'client-text-primary' : 'text-gray-900'
              }`}>
                {vehicles.filter((v) => v.status === 'stopped').length}
              </p>
              <p className={`text-[12.5px] mt-2 ${isClient ? 'client-text-tertiary' : 'text-slate-500'}`}>
                Última señal reciente, sin movimiento
              </p>
            </div>
          </div>
        </CardComponent>

        {/* Card 3 - Sin señal */}
        <CardComponent
          className={`h-[140px] transition-shadow cursor-pointer p-5 ${
            isClient ? 'hover:bg-white/8' : 'hover:shadow-lg'
          }`}
          onClick={() => handleStatusFilter('offline')}
        >
          <div className="h-full flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <h3 className={`text-sm font-semibold ${isClient ? 'client-text-secondary' : 'text-gray-700'}`}>Sin señal</h3>
              <ButtonComponent
                variant={isClient ? 'secondary' : 'outline'}
                size="sm"
                className={`h-7 px-3 text-xs rounded-full ${
                  isClient ? '' : 'border-black text-black hover:bg-[#EEF7FE]'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleStatusFilter('offline');
                }}
              >
                Revisar
              </ButtonComponent>
            </div>
            <div>
              <p className={`text-[34px] font-semibold leading-none ${
                isClient ? 'client-text-primary' : 'text-gray-900'
              }`}>
                {vehicles.filter((v) => v.status === 'offline').length}
              </p>
              <p className={`text-[12.5px] mt-2 ${isClient ? 'client-text-tertiary' : 'text-slate-500'}`}>
                Equipos fuera de línea
              </p>
            </div>
          </div>
        </CardComponent>

        {/* Card 4 - Combustible bajo */}
        <CardComponent
          className={`h-[140px] transition-shadow cursor-pointer p-5 ${
            isClient ? 'hover:bg-white/8' : 'hover:shadow-lg'
          }`}
          onClick={() => handleStatusFilter('critical')}
        >
          <div className="h-full flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <h3 className={`text-sm font-semibold ${isClient ? 'client-text-secondary' : 'text-gray-700'}`}>Combustible bajo</h3>
              <ButtonComponent
                variant={isClient ? 'secondary' : 'outline'}
                size="sm"
                className={`h-7 px-3 text-xs rounded-full ${
                  isClient ? '' : 'border-black text-black hover:bg-[#EEF7FE]'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleStatusFilter('critical');
                }}
              >
                Listar
              </ButtonComponent>
            </div>
            <div>
              <p className={`text-[34px] font-semibold leading-none ${
                isClient ? 'client-text-primary' : 'text-gray-900'
              }`}>
                {vehicles.filter((v) => v.status === 'critical' || (v.fuel !== undefined && v.fuel < 15)).length}
              </p>
              <p className={`text-[12.5px] mt-2 ${isClient ? 'client-text-tertiary' : 'text-slate-500'}`}>
                Por debajo de 15%
              </p>
            </div>
          </div>
        </CardComponent>
      </div>

      {/* Bloque Filtro de Home - OCULTO */}
      <CardComponent className="h-[60px] p-5 hidden">
        <div className="h-full flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">Filtro de Home</h3>
          <div className="flex gap-2 items-center">
            {selectedStatuses.length > 0 && (
              <>
                <div className="flex gap-2">
                  {selectedStatuses.map((status) => (
                    <span
                      key={status}
                      className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium flex items-center gap-2"
                    >
                      {VEHICLE_STATUS_CONFIG[status].label}
                      <button
                        onClick={() => toggleStatus(status)}
                        className="hover:bg-slate-200 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <button
                  onClick={clearFilters}
                  className="text-xs text-gray-600 hover:text-gray-900 underline"
                >
                  Limpiar filtros
                </button>
              </>
            )}
            {selectedStatuses.length === 0 && (
              <span className="text-xs text-gray-500">Sin filtros activos</span>
            )}
          </div>
        </div>
      </CardComponent>

      {/* Sección principal dividida en 2 columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-[70%_30%] gap-5">
        {/* Izquierda: Mapa */}
        <CardComponent className="h-[440px] p-5">
          <div className="pb-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className={`text-base font-semibold ${isClient ? 'client-heading' : 'text-gray-900'}`}>Mapa</h3>
              {(user?.role === 'superuser' || user?.role === 'admin') && (
                <button
                  onClick={handleAddGeofence}
                  className={`h-8 px-3 text-xs rounded-full transition-colors font-medium flex items-center gap-1.5 ${
                    isClient
                      ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/30'
                      : 'bg-[#3BA2E8] text-white hover:bg-[#2386CF]'
                  }`}
                >
                  <MapPin className="w-3 h-3" />
                  + Geocerca
                </button>
              )}
            </div>
            {/* Buscador y filtros del mapa */}
            <div className="flex gap-2 items-center">
              <form onSubmit={handleMapSearch} className="relative flex-1">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                  isClient ? 'text-white/50' : 'text-gray-400'
                }`} />
                <InputComponent
                  type="text"
                  value={mapSearchQuery}
                  onChange={(e) => setMapSearchQuery(e.target.value)}
                  placeholder="Buscar vehículo en mapa..."
                  className={`w-full h-9 pl-10 pr-9 rounded-full text-[13px] transition-all ${
                    !isClient && 'border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none'
                  }`}
                />
                {mapSearchQuery && (
                  <button
                    type="button"
                    onClick={clearMapSearch}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                      isClient ? 'text-white/50 hover:text-white/70' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </form>

              {/* Filtros rápidos */}
              <div className="flex gap-2">
                {/* Client filter - only for admin/superuser */}
                {(user?.role === 'superuser' || user?.role === 'admin') && clients.length > 0 && (
                  <select
                    value={selectedClientId || ''}
                    onChange={(e) => setSelectedClientId(e.target.value ? Number(e.target.value) : null)}
                    className="h-9 px-3 text-[12px] rounded-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors font-medium shadow-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    title="Filtrar por cliente"
                  >
                    <option value="">Todos los clientes</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                )}

                <button
                  onClick={() => toggleMapFilter('moving')}
                  className={`h-9 px-3 text-[12px] rounded-full border transition-colors font-medium ${
                    mapFilters.moving
                      ? 'bg-emerald-100 border-emerald-300 text-emerald-700'
                      : 'border-slate-200 bg-white text-gray-600 hover:bg-slate-50'
                  }`}
                  title="Filtrar vehículos en movimiento"
                >
                  <Activity className="w-3.5 h-3.5 inline mr-1" />
                  En ruta
                </button>
                <button
                  onClick={() => toggleMapFilter('insideGeofence')}
                  className={`h-9 px-3 text-[12px] rounded-full border transition-colors font-medium ${
                    mapFilters.insideGeofence
                      ? 'bg-blue-100 border-blue-300 text-blue-700'
                      : 'border-slate-200 bg-white text-gray-600 hover:bg-slate-50'
                  }`}
                  title="Filtrar vehículos dentro de geocercas"
                >
                  <MapPin className="w-3.5 h-3.5 inline mr-1" />
                  En zona
                </button>
                <button
                  onClick={() => setShowGeofences(!showGeofences)}
                  className={`h-9 px-3 text-[12px] rounded-full border transition-colors font-medium ${
                    showGeofences
                      ? 'bg-purple-100 border-purple-300 text-purple-700'
                      : 'border-slate-200 bg-white text-gray-600 hover:bg-slate-50'
                  }`}
                  title="Mostrar/ocultar geocercas en el mapa"
                >
                  <MapPin className="w-3.5 h-3.5 inline mr-1" />
                  Geocercas
                </button>
              </div>
            </div>
          </div>
          <div className="h-[calc(100%-100px)]">
            <LeafletMap
              vehicles={filteredVehicles}
              geofences={geofences}
              onVehicleClick={setSelectedVehicle}
              showGeofences={showGeofences}
            />
          </div>
        </CardComponent>

        {/* Derecha: Lista de Vehículos */}
        <div className="relative">
          <CardComponent className="h-[440px] p-5">
            <div className="pb-4">
              <div className="flex items-center justify-between">
                <h3 className={`text-base font-semibold ${isClient ? 'client-heading' : 'text-gray-900'}`}>Vehículos en mapa</h3>
                <span className={`text-xs ${isClient ? 'client-text-tertiary' : 'text-gray-500'}`}>{filteredVehicles.length} total</span>
              </div>
            </div>
            <div className="space-y-0 overflow-y-auto h-[calc(100%-100px)]">
              {filteredVehicles.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                    <Search className="w-8 h-8 text-slate-400" />
                  </div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">
                    No se encontraron vehículos
                  </h4>
                  <p className="text-xs text-gray-500 mb-4">
                    {mapFilters.insideGeofence || mapFilters.moving || mapSearchQuery || selectedClientId
                      ? 'No hay vehículos que coincidan con los filtros seleccionados.'
                      : 'No hay vehículos disponibles en este momento.'}
                  </p>
                  {(mapFilters.insideGeofence || mapFilters.moving || mapSearchQuery || selectedClientId) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        clearMapSearch();
                        clearMapFilters();
                        setSelectedClientId(null);
                      }}
                      className="text-xs"
                    >
                      Limpiar filtros
                    </Button>
                  )}
                </div>
              ) : (
                filteredVehicles
                  .slice(currentPage * 4, (currentPage * 4) + 4)
                  .map((vehicle) => {
                  const statusColors = {
                    moving: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
                    stopped: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
                    offline: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
                    critical: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' }
                  };

                  const statusColor = statusColors[vehicle.status];

                  return (
                    <div
                      key={vehicle.id}
                      className="py-3 border-t border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors"
                      onClick={() => setSelectedVehicle(vehicle)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg ${statusColor.bg} border ${statusColor.border} flex items-center justify-center flex-shrink-0`}>
                          <Truck className={`w-5 h-5 ${statusColor.text}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="text-sm font-bold text-gray-900">{vehicle.plate}</h4>
                              <p className="text-xs text-gray-600">{vehicle.driver}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[11px] text-gray-500">
                                  <Gauge className="w-3 h-3 inline mr-0.5" />
                                  {vehicle.fuel}%
                                </span>
                                <span className="text-[11px] text-gray-500">
                                  <Activity className="w-3 h-3 inline mr-0.5" />
                                  {vehicle.speed} km/h
                                </span>
                              </div>
                            </div>
                            <span className={`px-2 py-0.5 ${statusColor.bg} ${statusColor.text} text-[11px] font-medium rounded-full whitespace-nowrap border ${statusColor.border}`}>
                              {VEHICLE_STATUS_CONFIG[vehicle.status].label}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Paginación */}
            {filteredVehicles.length > 4 && (
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                  disabled={currentPage === 0}
                  className="text-xs text-gray-600 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed font-medium"
                >
                  ← Anterior
                </button>
                <span className="text-xs text-gray-500">
                  Página {currentPage + 1} de {Math.ceil(filteredVehicles.length / 4)}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredVehicles.length / 4) - 1, prev + 1))}
                  disabled={currentPage >= Math.ceil(filteredVehicles.length / 4) - 1}
                  className="text-xs text-gray-600 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed font-medium"
                >
                  Siguiente →
                </button>
              </div>
            )}
          </CardComponent>
        </div>
      </div>

      {/* Footer Estado */}
      <div className="flex justify-end">
        <p className={`text-sm ${isClient ? 'client-text-tertiary' : 'text-gray-500'}`}>{filteredVehicles.length} mostrados</p>
      </div>

      {/* Notificaciones Recientes */}
      <CardComponent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell className={`w-5 h-5 ${isClient ? 'text-cyan-400' : 'text-gray-700'}`} />
            <h3 className={`text-base font-semibold ${isClient ? 'client-heading' : 'text-gray-900'}`}>Notificaciones Recientes</h3>
          </div>
          <button className={`text-xs font-medium ${
            isClient ? 'text-cyan-400 hover:text-cyan-300' : 'text-primary hover:text-primary/80'
          }`}>
            Ver todas
          </button>
        </div>

        <div className="space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No hay notificaciones recientes</p>
            </div>
          ) : (
            notifications.slice(0, 5).map((notification) => {
              const style = getNotificationStyle(notification.type);
              const Icon = style.icon;

              return (
                <div
                  key={notification.id}
                  className={`flex gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-gray-100 ${
                    !notification.read ? 'bg-blue-50/30' : ''
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full ${style.bg} border ${style.border} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${style.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-gray-900">{notification.vehiclePlate}</h4>
                          {!notification.read && (
                            <span className="w-2 h-2 rounded-full bg-primary"></span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mt-0.5">{notification.text}</p>
                      </div>
                      <span className="text-xs text-gray-500 whitespace-nowrap flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {getRelativeTime(notification.ts)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardComponent>

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
            <Button className="w-full" variant="primary" onClick={handleViewRouteHistory}>
              <Navigation className="w-4 h-4" />
              Ver historial de ruta
            </Button>
            <Button className="w-full" variant="outline" onClick={handleViewAlerts}>
              <AlertTriangle className="w-4 h-4" />
              Ver alertas
            </Button>
          </div>
        </Drawer>
      )}

      {/* Geofence Modal */}
      <GeofenceModal
        isOpen={isGeofenceModalOpen}
        onClose={() => setIsGeofenceModalOpen(false)}
        onSave={handleSaveGeofence}
      />

      </div>
    </div>
  );
}
