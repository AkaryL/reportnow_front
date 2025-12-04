import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, CircleMarker, Polyline, Popup } from 'react-leaflet';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { equipmentsApi } from '../features/equipments/api';
import { vehicleHistoryApi, type RoutePoint } from '../features/vehicle-history/api';
import { QUERY_KEYS, EQUIPMENT_STATUS_CONFIG } from '../lib/constants';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Gauge,
  Radio,
  Building2,
  Box,
  Navigation,
  Satellite,
  Calendar,
  Activity,
  Zap
} from 'lucide-react';
import { formatRelativeTime, formatSpeed } from '../lib/utils';
import type { Equipment } from '../lib/types';
import { useAuth } from '../features/auth/hooks';
import { geofencesApi } from '../features/geofences/api';
import 'leaflet/dist/leaflet.css';

export function EquipmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Estados para filtros de fecha/hora
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [startTime, setStartTime] = useState('00:00');
  const [endTime, setEndTime] = useState('23:59');
  const [showGeofences, setShowGeofences] = useState(false);

  // Obtener el equipo específico
  const { data: equipment, isLoading: isLoadingEquipment } = useQuery({
    queryKey: QUERY_KEYS.EQUIPMENT(id || ''),
    queryFn: () => equipmentsApi.getById(id!),
    enabled: !!id,
  });

  // Obtener clientes
  const { data: clients = [] } = useQuery({
    queryKey: QUERY_KEYS.CLIENTS,
    queryFn: async () => {
      const { clientsApi } = await import('../features/clients/api');
      return clientsApi.getAll();
    },
    enabled: user?.role === 'superuser',
  });

  // Obtener activos
  const { data: assets = [] } = useQuery({
    queryKey: QUERY_KEYS.ASSETS,
    queryFn: async () => {
      const { assetsApi } = await import('../features/assets/api');
      return assetsApi.getAll();
    },
  });

  // Obtener geocercas
  const { data: geofences = [] } = useQuery({
    queryKey: QUERY_KEYS.GEOFENCES,
    queryFn: geofencesApi.getAll,
  });

  // Obtener historial de rutas del equipo
  const { data: routes = [], isLoading: isLoadingRoutes } = useQuery({
    queryKey: ['vehicle-history', 'routes', equipment?.imei, startDate, startTime, endDate, endTime],
    queryFn: () => vehicleHistoryApi.getRoutes(equipment!.imei, {
      start_date: `${startDate}T${startTime}:00`,
      end_date: `${endDate}T${endTime}:59`,
    }),
    enabled: !!equipment?.imei,
  });

  // Helpers
  const getClientName = (clientId?: string) => {
    if (!clientId) return 'Sin asignar';
    const client = clients.find((c) => c.id === clientId);
    return client?.company_name || 'Cliente desconocido';
  };

  const getAssetInfo = (assetId?: string) => {
    if (!assetId) return null;
    return assets.find((a) => a.id === assetId);
  };

  const getAssetTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      vehiculo: 'Vehículo',
      cargo: 'Mercancía',
      container: 'Contenedor',
      person: 'Persona',
      other: 'Otro',
    };
    return labels[type] || type;
  };

  // Calcular el centro del mapa
  const mapCenter: [number, number] = routes && routes.length > 0 && routes[0].lat && routes[0].lon
    ? [routes[0].lat, routes[0].lon]
    : equipment?.lat && equipment?.lng
      ? [equipment.lat, equipment.lng]
      : [20.6897, -103.3918]; // Guadalajara por defecto

  // Convertir rutas a coordenadas para la polilínea
  const routeCoordinates: [number, number][] = routes
    .filter(point => point.lat !== null && point.lon !== null)
    .map(point => [point.lat!, point.lon!]);

  // Determinar color del punto según velocidad
  const getPointColor = (speed: number | null): string => {
    if (!speed || speed === 0) return '#6b7280'; // Gris - detenido
    if (speed < 30) return '#0ea5e9'; // Azul - lento
    if (speed < 60) return '#10b981'; // Verde - medio
    return '#ef4444'; // Rojo - rápido
  };

  // Calcular estadísticas del recorrido
  const routeStats = {
    totalPoints: routes.length,
    maxSpeed: routes.reduce((max, p) => Math.max(max, p.speed_kph || 0), 0),
    avgSpeed: routes.length > 0
      ? routes.reduce((sum, p) => sum + (p.speed_kph || 0), 0) / routes.filter(p => p.speed_kph).length
      : 0,
    stoppedPoints: routes.filter(p => !p.speed_kph || p.speed_kph === 0).length,
  };

  if (isLoadingEquipment) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!equipment) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-gray-500">Equipo GPS no encontrado</p>
        <Button onClick={() => navigate('/equipos')} variant="outline">
          <ArrowLeft className="w-4 h-4" />
          Volver a equipos GPS
        </Button>
      </div>
    );
  }

  const asset = getAssetInfo(equipment.asset_id);

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button onClick={() => navigate('/equipos')} variant="ghost" size="sm">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <Radio className="w-6 h-6 text-primary" />
                <h1 className="text-2xl font-bold text-gray-900">
                  {equipment.brand} {equipment.model}
                </h1>
              </div>
              <p className="text-gray-500 mt-1">
                IMEI: {equipment.imei} • S/N: {equipment.serial}
              </p>
            </div>
          </div>
          <Badge
            className={`${EQUIPMENT_STATUS_CONFIG[equipment.status]?.bgColor} ${EQUIPMENT_STATUS_CONFIG[equipment.status]?.textColor}`}
          >
            {EQUIPMENT_STATUS_CONFIG[equipment.status]?.label || equipment.status}
          </Badge>
        </div>
      </Card>

      {/* Info Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Cliente */}
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500 uppercase">Cliente</p>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {getClientName(equipment.client_id)}
              </p>
            </div>
          </div>
        </Card>

        {/* Activo */}
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Box className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500 uppercase">Activo Asignado</p>
              {asset ? (
                <div className="mt-1">
                  <p className="text-lg font-semibold text-gray-900">{asset.name}</p>
                  <p className="text-sm text-gray-500">{getAssetTypeLabel(asset.type)}</p>
                </div>
              ) : (
                <p className="text-lg font-semibold text-gray-400 mt-1">Sin activo</p>
              )}
            </div>
          </div>
        </Card>

        {/* Última señal */}
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Activity className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500 uppercase">Última Señal</p>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {equipment.last_seen
                  ? formatRelativeTime(Math.floor((Date.now() - new Date(equipment.last_seen).getTime()) / 60000))
                  : 'Nunca'}
              </p>
              {equipment.speed !== undefined && equipment.speed !== null && (
                <p className="text-sm text-gray-500">
                  {formatSpeed(equipment.speed)}
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Mapa y Filtros */}
      <Card>
        <CardHeader className="p-6 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Historial de Recorrido
            </CardTitle>
            <Button
              variant={showGeofences ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setShowGeofences(!showGeofences)}
            >
              <MapPin className="w-4 h-4" />
              {showGeofences ? 'Ocultar geocercas' : 'Mostrar geocercas'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Filtros de Fecha y Hora */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filtrar por fecha y hora</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Fecha Inicio</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  max={todayStr}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Hora Inicio</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Fecha Fin</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  max={todayStr}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Hora Fin</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Estadísticas del recorrido */}
            {routes.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{routeStats.totalPoints}</p>
                    <p className="text-xs text-gray-500">Puntos registrados</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{routeStats.maxSpeed.toFixed(0)} km/h</p>
                    <p className="text-xs text-gray-500">Velocidad máxima</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{routeStats.avgSpeed.toFixed(0)} km/h</p>
                    <p className="text-xs text-gray-500">Velocidad promedio</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-600">{routeStats.stoppedPoints}</p>
                    <p className="text-xs text-gray-500">Puntos detenido</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Mapa */}
          <div className="h-[500px] rounded-xl overflow-hidden border border-gray-200">
            {isLoadingRoutes ? (
              <div className="flex items-center justify-center h-full bg-gray-50">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4 text-gray-600">Cargando historial...</p>
                </div>
              </div>
            ) : routes.length > 0 ? (
              <MapContainer
                center={mapCenter}
                zoom={14}
                className="h-full w-full"
                zoomControl={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Polilínea de la ruta */}
                <Polyline
                  positions={routeCoordinates}
                  color="#3b82f6"
                  weight={3}
                  opacity={0.7}
                />

                {/* Puntos de la ruta */}
                {routes.map((point, index) => {
                  if (!point.lat || !point.lon) return null;

                  const color = getPointColor(point.speed_kph);
                  const isFirst = index === 0;
                  const isLast = index === routes.length - 1;

                  return (
                    <CircleMarker
                      key={index}
                      center={[point.lat, point.lon]}
                      radius={isFirst || isLast ? 10 : 6}
                      fillColor={isFirst ? '#10b981' : isLast ? '#ef4444' : color}
                      color="#ffffff"
                      weight={2}
                      opacity={1}
                      fillOpacity={0.9}
                    >
                      <Popup>
                        <div className="min-w-[220px] p-2">
                          <div className="mb-3 pb-2 border-b border-gray-200">
                            <div className="font-bold text-gray-900">
                              {isFirst ? '🟢 Inicio del recorrido' : isLast ? '🔴 Fin del recorrido' : '📍 Punto de ruta'}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-gray-400" />
                              <div>
                                <div className="font-medium text-gray-900">
                                  {format(new Date(point.recv_time), 'dd/MM/yyyy', { locale: es })}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {format(new Date(point.recv_time), 'HH:mm:ss', { locale: es })}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Gauge className="h-4 w-4 text-gray-400" />
                              <span className={`font-medium ${
                                (point.speed_kph || 0) > 80 ? 'text-red-600' : 'text-gray-900'
                              }`}>
                                {point.speed_kph !== null
                                  ? `${Math.round(point.speed_kph)} km/h`
                                  : 'Sin datos'}
                              </span>
                            </div>

                            {point.satellites !== null && (
                              <div className="flex items-center gap-2">
                                <Satellite className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-700">{point.satellites} satélites</span>
                              </div>
                            )}

                            <div className="flex items-center gap-2">
                              <Navigation className="h-4 w-4 text-gray-400" />
                              <span className="text-xs text-gray-600 font-mono">
                                {point.lat.toFixed(6)}, {point.lon.toFixed(6)}
                              </span>
                            </div>

                            {point.ignition !== null && (
                              <div className="mt-2 flex items-center gap-2 p-2 rounded bg-gray-50">
                                <Zap className={`h-4 w-4 ${point.ignition ? 'text-green-500' : 'text-gray-400'}`} />
                                <span className="text-sm">
                                  Motor: {point.ignition ? '✓ Encendido' : '✗ Apagado'}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                })}

                {/* Geocercas */}
                {showGeofences && geofences.map((geofence) => {
                  if (geofence.center_lat && geofence.center_lng && geofence.radius) {
                    // Geocerca circular
                    return (
                      <CircleMarker
                        key={geofence.id}
                        center={[geofence.center_lat, geofence.center_lng]}
                        radius={20}
                        fillColor={geofence.color || '#3b82f6'}
                        color={geofence.color || '#3b82f6'}
                        weight={2}
                        opacity={0.6}
                        fillOpacity={0.2}
                      >
                        <Popup>
                          <div className="font-medium">{geofence.name}</div>
                          <div className="text-sm text-gray-500">Radio: {geofence.radius}m</div>
                        </Popup>
                      </CircleMarker>
                    );
                  }
                  return null;
                })}
              </MapContainer>
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-50">
                <div className="text-center">
                  <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No se encontraron puntos de ruta</p>
                  <p className="text-sm text-gray-400 mt-1">para el período seleccionado</p>
                </div>
              </div>
            )}
          </div>

          {/* Leyenda de colores */}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
            <span className="text-gray-500">Leyenda:</span>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Inicio</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>Fin</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-500"></div>
              <span>Detenido</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-sky-500"></div>
              <span>&lt;30 km/h</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span>30-60 km/h</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>&gt;60 km/h</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Información detallada del equipo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Información del equipo */}
        <Card>
          <CardHeader className="p-6 border-b bg-gray-50">
            <CardTitle className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-gray-600" />
              Información del Equipo
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between py-3 border-b border-gray-100">
                <span className="text-gray-500">IMEI</span>
                <span className="font-mono font-semibold text-gray-900">{equipment.imei}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-100">
                <span className="text-gray-500">Número de Serie</span>
                <span className="font-mono font-semibold text-gray-900">{equipment.serial}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-100">
                <span className="text-gray-500">Marca</span>
                <span className="font-semibold text-gray-900">{equipment.brand}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-100">
                <span className="text-gray-500">Modelo</span>
                <span className="font-semibold text-gray-900">{equipment.model}</span>
              </div>
              {equipment.firmware_version && (
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-500">Firmware</span>
                  <span className="font-mono text-gray-900">{equipment.firmware_version}</span>
                </div>
              )}
              <div className="flex justify-between py-3">
                <span className="text-gray-500">Estado</span>
                <Badge className={`${EQUIPMENT_STATUS_CONFIG[equipment.status]?.bgColor} ${EQUIPMENT_STATUS_CONFIG[equipment.status]?.textColor}`}>
                  {EQUIPMENT_STATUS_CONFIG[equipment.status]?.label}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ubicación actual */}
        <Card>
          <CardHeader className="p-6 border-b bg-gray-50">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gray-600" />
              Ubicación Actual
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between py-3 border-b border-gray-100">
                <span className="text-gray-500">Latitud</span>
                <span className="font-mono font-semibold text-gray-900">
                  {equipment.lat?.toFixed(6) || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-100">
                <span className="text-gray-500">Longitud</span>
                <span className="font-mono font-semibold text-gray-900">
                  {equipment.lng?.toFixed(6) || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-100">
                <span className="text-gray-500">Velocidad</span>
                <span className="font-semibold text-gray-900">
                  {equipment.speed !== undefined && equipment.speed !== null
                    ? formatSpeed(equipment.speed)
                    : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-100">
                <span className="text-gray-500">Dirección</span>
                <span className="font-semibold text-gray-900">
                  {equipment.bearing !== undefined && equipment.bearing !== null
                    ? `${equipment.bearing}°`
                    : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-gray-500">Última actualización</span>
                <span className="text-gray-900">
                  {equipment.last_seen
                    ? format(new Date(equipment.last_seen), "dd/MM/yyyy HH:mm:ss", { locale: es })
                    : 'Nunca'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
