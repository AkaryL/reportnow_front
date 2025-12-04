import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, CircleMarker, Polyline, Popup, Circle, Polygon } from 'react-leaflet';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { equipmentsApi } from '../features/equipments/api';
import { vehicleHistoryApi } from '../features/vehicle-history/api';
import type { RoutePoint } from '../features/vehicle-history/api';
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
  Zap,
  Hexagon,
  Smartphone,
  Power,
  Car,
  CircleStop,
  PowerOff
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

  // Obtener SIMs
  const { data: sims = [] } = useQuery({
    queryKey: QUERY_KEYS.SIMS,
    queryFn: async () => {
      const { simsApi } = await import('../features/sims/api');
      return simsApi.getAll();
    },
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

  const getSimInfo = (simId?: string) => {
    if (!simId) return null;
    return sims.find((s) => s.id === simId);
  };

  const getGeofenceNames = (geofenceIds: string[] | null) => {
    if (!geofenceIds || geofenceIds.length === 0) return [];
    return geofenceIds
      .map(id => geofences.find(gf => gf.id === id))
      .filter(Boolean)
      .map(gf => gf!.name);
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

  // Configuración de estados del vehículo
  const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: typeof Power }> = {
    engine_on: { label: 'Encendido de motor', color: 'text-green-600', bgColor: 'bg-green-100', icon: Power },
    moving: { label: 'En movimiento', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: Car },
    stopped: { label: 'Detenido', color: 'text-amber-600', bgColor: 'bg-amber-100', icon: CircleStop },
    engine_off: { label: 'Motor apagado', color: 'text-gray-600', bgColor: 'bg-gray-200', icon: PowerOff },
  };

  // Inferir estado del vehículo basándose en velocidad e ignición
  const inferStatus = (point: RoutePoint, index: number): string => {
    // Si tiene un status válido (no null, no "simulated"), usarlo
    if (point.status && point.status !== 'simulated' &&
        ['engine_on', 'moving', 'stopped', 'engine_off'].includes(point.status)) {
      return point.status;
    }

    // Inferir basándose en velocidad e ignición
    const speed = point.speed_kph || 0;
    const ignition = point.ignition;

    if (ignition === false) {
      return 'engine_off';
    } else if (speed > 2) {
      return 'moving';
    } else if (index === 0 && ignition === true) {
      return 'engine_on';
    } else if (index === routes.length - 1 && speed === 0) {
      return 'engine_off';
    } else {
      return 'stopped';
    }
  };

  // Agrupar estados consecutivos para el timeline
  const getStatusSegments = () => {
    if (routes.length === 0) return [];

    const segments: Array<{
      status: string;
      startTime: string;
      endTime: string;
      duration: number;
      pointCount: number;
    }> = [];

    let currentSegment: typeof segments[0] | null = null;

    routes.forEach((point, index) => {
      const status = inferStatus(point, index);

      if (!currentSegment || currentSegment.status !== status) {
        // Cerrar segmento anterior
        if (currentSegment) {
          currentSegment.endTime = routes[index - 1].recv_time;
          currentSegment.duration = new Date(currentSegment.endTime).getTime() - new Date(currentSegment.startTime).getTime();
          segments.push(currentSegment);
        }
        // Iniciar nuevo segmento
        currentSegment = {
          status,
          startTime: point.recv_time,
          endTime: point.recv_time,
          duration: 0,
          pointCount: 1,
        };
      } else {
        currentSegment.pointCount++;
      }
    });

    // Cerrar último segmento
    if (currentSegment) {
      currentSegment.endTime = routes[routes.length - 1].recv_time;
      currentSegment.duration = new Date(currentSegment.endTime).getTime() - new Date(currentSegment.startTime).getTime();
      segments.push(currentSegment);
    }

    return segments;
  };

  const statusSegments = getStatusSegments();

  // Formatear duración en formato legible
  const formatDuration = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
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
  const sim = getSimInfo(equipment.sim_id);

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

        {/* SIM */}
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Smartphone className="w-5 h-5 text-orange-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500 uppercase">SIM Asignada</p>
              {sim ? (
                <div className="mt-1">
                  <p className="text-lg font-semibold text-gray-900">{sim.phone_number}</p>
                  <p className="text-sm text-gray-500">{sim.carrier}</p>
                </div>
              ) : (
                <p className="text-lg font-semibold text-gray-400 mt-1">Sin SIM</p>
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

          {/* Mapa y Timeline */}
          <div className="flex gap-4 h-[500px]">
            {/* Mapa - 2/3 del ancho */}
            <div className="w-2/3 rounded-xl overflow-hidden border border-gray-200">
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
                          <div className="min-w-[260px] p-2">
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
                                {point.course_deg !== null && (
                                  <span className="text-xs text-gray-500">
                                    ({Math.round(point.course_deg)}°)
                                  </span>
                                )}
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
                                <div className="flex items-center gap-2 p-2 rounded bg-gray-50">
                                  <Zap className={`h-4 w-4 ${point.ignition ? 'text-green-500' : 'text-gray-400'}`} />
                                  <span className="text-sm">
                                    Motor: {point.ignition ? '✓ Encendido' : '✗ Apagado'}
                                  </span>
                                </div>
                              )}

                              {/* Geocercas donde estaba el punto */}
                              {point.geofences_in && point.geofences_in.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-gray-200">
                                  <div className="flex items-start gap-2">
                                    <Hexagon className="h-4 w-4 text-purple-500 mt-0.5" />
                                    <div>
                                      <div className="text-xs font-medium text-purple-700">Dentro de geocerca(s):</div>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {getGeofenceNames(point.geofences_in).map((name, i) => (
                                          <span key={i} className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                                            {name}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Info del activo en ese momento */}
                              {point.asset_id && (
                                <div className="mt-2 pt-2 border-t border-gray-200">
                                  <div className="flex items-center gap-2">
                                    <Box className="h-4 w-4 text-blue-500" />
                                    <div>
                                      <div className="text-xs text-gray-500">Activo asignado:</div>
                                      <div className="text-sm font-medium text-gray-800">
                                        {getAssetInfo(point.asset_id)?.name || 'Desconocido'}
                                      </div>
                                    </div>
                                  </div>
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
                    // Geocerca circular (por dirección/pin)
                    if (geofence.center_lat && geofence.center_lng && geofence.radius) {
                      return (
                        <Circle
                          key={geofence.id}
                          center={[Number(geofence.center_lat), Number(geofence.center_lng)]}
                          radius={Number(geofence.radius)}
                          pathOptions={{
                            fillColor: geofence.color || '#3b82f6',
                            color: geofence.color || '#3b82f6',
                            weight: 2,
                            opacity: 0.8,
                            fillOpacity: 0.2
                          }}
                        >
                          <Popup>
                            <div className="font-medium">{geofence.name}</div>
                            <div className="text-sm text-gray-500">Radio: {geofence.radius}m</div>
                          </Popup>
                        </Circle>
                      );
                    }

                    // Geocerca poligonal (por coordenadas)
                    if (geofence.polygon_coordinates && Array.isArray(geofence.polygon_coordinates) && geofence.polygon_coordinates.length >= 3) {
                      // polygon_coordinates viene como [[lng, lat], [lng, lat], ...]
                      // Leaflet necesita [[lat, lng], [lat, lng], ...]
                      const positions: [number, number][] = geofence.polygon_coordinates.map(
                        (coord: number[]) => [coord[1], coord[0]] as [number, number]
                      );

                      return (
                        <Polygon
                          key={geofence.id}
                          positions={positions}
                          pathOptions={{
                            fillColor: geofence.color || '#3b82f6',
                            color: geofence.color || '#3b82f6',
                            weight: 2,
                            opacity: 0.8,
                            fillOpacity: 0.2
                          }}
                        >
                          <Popup>
                            <div className="font-medium">{geofence.name}</div>
                            <div className="text-sm text-gray-500">Polígono ({geofence.polygon_coordinates.length} puntos)</div>
                          </Popup>
                        </Polygon>
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

            {/* Timeline de estados - 1/3 del ancho */}
            <div className="w-1/3 rounded-xl border border-gray-200 bg-white overflow-hidden flex flex-col">
              <div className="p-3 border-b border-gray-200 bg-gray-50">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  Timeline de Estados
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                {isLoadingRoutes ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : statusSegments.length > 0 ? (
                  <div className="relative">
                    {/* Línea vertical del timeline */}
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                    {/* Segmentos del timeline */}
                    <div className="space-y-3">
                      {statusSegments.map((segment, index) => {
                        const config = STATUS_CONFIG[segment.status] || STATUS_CONFIG.stopped;
                        const Icon = config.icon;

                        return (
                          <div key={index} className="relative pl-10">
                            {/* Icono del estado */}
                            <div className={`absolute left-0 w-8 h-8 rounded-full ${config.bgColor} flex items-center justify-center border-2 border-white shadow-sm`}>
                              <Icon className={`w-4 h-4 ${config.color}`} />
                            </div>

                            {/* Contenido del segmento */}
                            <div className={`p-2 rounded-lg ${config.bgColor} bg-opacity-30 border border-gray-100`}>
                              <div className={`font-medium text-sm ${config.color}`}>
                                {config.label}
                              </div>
                              <div className="text-xs text-gray-600 mt-1">
                                {format(new Date(segment.startTime), 'HH:mm:ss', { locale: es })}
                                {segment.duration > 0 && (
                                  <span className="text-gray-400"> - {format(new Date(segment.endTime), 'HH:mm:ss', { locale: es })}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                <span className="font-medium">{formatDuration(segment.duration)}</span>
                                <span className="text-gray-400">•</span>
                                <span>{segment.pointCount} punto{segment.pointCount !== 1 ? 's' : ''}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-gray-400">
                      <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Sin datos de estado</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Leyenda de estados */}
              {statusSegments.length > 0 && (
                <div className="p-3 border-t border-gray-200 bg-gray-50">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(STATUS_CONFIG).map(([key, config]) => {
                      const Icon = config.icon;
                      return (
                        <div key={key} className="flex items-center gap-1.5">
                          <Icon className={`w-3 h-3 ${config.color}`} />
                          <span className="text-gray-600 truncate">{config.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
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
                  {equipment.lat != null ? Number(equipment.lat).toFixed(6) : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-100">
                <span className="text-gray-500">Longitud</span>
                <span className="font-mono font-semibold text-gray-900">
                  {equipment.lng != null ? Number(equipment.lng).toFixed(6) : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-100">
                <span className="text-gray-500">Velocidad</span>
                <span className="font-semibold text-gray-900">
                  {equipment.speed != null
                    ? formatSpeed(Number(equipment.speed))
                    : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-100">
                <span className="text-gray-500">Dirección</span>
                <span className="font-semibold text-gray-900">
                  {equipment.bearing != null
                    ? `${Number(equipment.bearing).toFixed(0)}°`
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
