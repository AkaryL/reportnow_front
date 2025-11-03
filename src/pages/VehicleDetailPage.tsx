import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { vehiclesApi } from '../features/vehicles/api';
import { QUERY_KEYS } from '../lib/constants';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { ClientCard } from '../components/ui/ClientCard';
import { Badge } from '../components/ui/Badge';
import { ClientBadge } from '../components/ui/ClientBadge';
import { Button } from '../components/ui/Button';
import { ClientButton } from '../components/ui/ClientButton';
import { LeafletMap } from '../components/map/LeafletMap';
import { ArrowLeft, MapPin, Navigation, Clock, AlertTriangle, Gauge, Calendar } from 'lucide-react';
import { formatRelativeTime, formatSpeed } from '../lib/utils';
import { VEHICLE_STATUS_CONFIG } from '../lib/constants';
import type { Vehicle } from '../lib/types';
import { useAuth } from '../features/auth/hooks';
import { geofencesApi } from '../features/geofences/api';

export function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [routeHistory, setRouteHistory] = useState<Array<{ lat: number; lng: number; ts?: string }>>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showGeofences, setShowGeofences] = useState(false);

  // Determine if current user is a client/admin for conditional styling
  const isClient = user?.role === 'admin';
  const CardComponent = isClient ? ClientCard : Card;
  const BadgeComponent = isClient ? ClientBadge : Badge;
  const ButtonComponent = isClient ? ClientButton : Button;

  // Obtener todos los vehículos
  const { data: vehicles, isLoading } = useQuery({
    queryKey: (user?.role === 'admin' || user?.role === 'operator-admin' || user?.role === 'operator-monitor') ? ['user-vehicles', user.client_id] : QUERY_KEYS.VEHICLES,
    queryFn: async () => {
      if ((user?.role === 'admin' || user?.role === 'operator-admin' || user?.role === 'operator-monitor') && user.client_id) {
        // Get only vehicles for this client/cliente
        const allVehicles = await vehiclesApi.getAll();
        return allVehicles.filter(v => v.clientId === user.client_id);
      }
      return vehiclesApi.getAll();
    },
    enabled: !!user,
  });

  // Encontrar el vehículo específico
  const vehicle = vehicles?.find((v) => v.id === id);

  // Obtener geocercas filtradas según el rol del usuario
  const { data: geofences = [] } = useQuery({
    queryKey: (user?.role === 'admin' || user?.role === 'operator-admin' || user?.role === 'operator-monitor') ? ['geofences', 'all'] : ['geofences'],
    queryFn: async () => {
      const allGeofences = await geofencesApi.getAll();

      if ((user?.role === 'admin' || user?.role === 'operator-admin' || user?.role === 'operator-monitor') && user.client_id) {
        // Para admin/operadores: obtener sus geocercas + las asignadas + las globales
        return allGeofences.filter(g => g.is_global || g.client_id === user.client_id);
      }
      // Para superuser: obtener todas las geocercas
      return allGeofences;
    },
    enabled: !!user,
  });

  // Obtener fechas disponibles con tracks
  const { data: availableDates, refetch: refetchDates } = useQuery({
    queryKey: ['vehicle-track-dates', id],
    queryFn: () => vehiclesApi.getTrackDates(id!),
    enabled: !!id,
  });

  // Auto-generar tracks para los últimos 7 días al montar el componente
  useEffect(() => {
    if (id && availableDates !== undefined && availableDates.length === 0) {
      setIsGenerating(true);
      vehiclesApi.generateWeekTracks(id)
        .then(() => {
          console.log('✅ Generated week tracks for vehicle', id);
          refetchDates();
        })
        .catch((error) => {
          console.error('Error generating week tracks:', error);
        })
        .finally(() => {
          setIsGenerating(false);
        });
    }
  }, [id, availableDates, refetchDates]);

  // Obtener track del día seleccionado
  useEffect(() => {
    if (!id || !selectedDate) {
      setRouteHistory([]);
      return;
    }

    vehiclesApi.getTrack(id, selectedDate).then((track) => {
      setRouteHistory(track.points.map(p => ({ lat: p.lat, lng: p.lng, ts: p.ts })));
    }).catch((error) => {
      console.error('Error fetching track:', error);
      setRouteHistory([]);
    });
  }, [id, selectedDate]);

  // Obtener eventos del vehículo
  const { data: vehicleEvents = [] } = useQuery({
    queryKey: ['vehicle-events', id],
    queryFn: () => vehiclesApi.getEvents(id!, { limit: 20 }),
    enabled: !!id,
  });

  useEffect(() => {
    if (vehicle) {
      setSelectedVehicle(vehicle);
    }
  }, [vehicle]);

  // Funciones de filtro rápido
  const handleQuickFilter = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className={isClient ? 'client-text-secondary' : 'text-gray-500'}>Vehículo no encontrado</p>
        <ButtonComponent onClick={() => navigate('/vehiculos')} variant="outline">
          <ArrowLeft className="w-4 h-4" />
          Volver a vehículos
        </ButtonComponent>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <CardComponent className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <ButtonComponent onClick={() => navigate('/vehiculos')} variant="ghost" size="sm" className={isClient ? '' : 'hover:bg-gray-100'}>
              <ArrowLeft className="w-5 h-5" />
            </ButtonComponent>
            <div>
              <h1 className={`text-3xl font-bold ${isClient ? 'client-heading' : 'text-gray-900'}`}>Vehículo {vehicle.plate}</h1>
              <p className={`mt-1.5 text-sm ${isClient ? 'client-text-secondary' : 'text-gray-500'}`}>
                Detalles completos y ubicación en tiempo real
              </p>
            </div>
          </div>
          <BadgeComponent variant={vehicle.status} className="self-start sm:self-center">
            {VEHICLE_STATUS_CONFIG[vehicle.status].label}
          </BadgeComponent>
        </div>
      </CardComponent>

      {/* Mapa */}
      <CardComponent className="overflow-hidden">
        <div className={`p-6 ${isClient ? 'border-b border-white/10' : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <h3 className={`flex items-center gap-2 text-xl font-semibold ${isClient ? 'client-heading' : 'text-gray-900'}`}>
              <MapPin className={`w-6 h-6 ${isClient ? 'text-cyan-400' : 'text-blue-600'}`} />
              {selectedDate ? `Recorrido del ${new Date(selectedDate).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}` : 'Ubicación actual'}
            </h3>
            {selectedDate && (
              <ButtonComponent
                variant="outline"
                size="sm"
                onClick={() => setSelectedDate(null)}
              >
                Ver ubicación actual
              </ButtonComponent>
            )}
          </div>
        </div>
        <CardContent className="p-6">
          {/* Selector de fecha con filtros rápidos */}
          <div className="mb-4 space-y-4">
            {/* Botones de filtro rápido */}
            <div>
              <label className={`block text-sm font-medium mb-3 flex items-center gap-2 ${isClient ? 'client-text-secondary' : 'text-gray-700'}`}>
                <Calendar className="w-4 h-4" />
                Filtros rápidos
              </label>
              <div className="flex flex-wrap gap-2">
                <ButtonComponent
                  variant={selectedDate === new Date().toISOString().split('T')[0] ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => handleQuickFilter(0)}
                  disabled={isGenerating}
                >
                  Hoy
                </ButtonComponent>
                <ButtonComponent
                  variant={selectedDate === new Date(Date.now() - 86400000).toISOString().split('T')[0] ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => handleQuickFilter(1)}
                  disabled={isGenerating}
                >
                  Ayer
                </ButtonComponent>
                <ButtonComponent
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Mostrar mensaje o implementar vista de 7 días
                    handleQuickFilter(1); // Por ahora muestra ayer
                  }}
                  disabled={isGenerating}
                >
                  Últimos 7 días
                </ButtonComponent>
                {selectedDate && (
                  <ButtonComponent
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedDate(null)}
                    disabled={isGenerating}
                  >
                    Limpiar
                  </ButtonComponent>
                )}
              </div>
            </div>

            {/* Date picker */}
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className={`block text-sm font-medium mb-2 ${isClient ? 'client-text-secondary' : 'text-gray-700'}`}>
                  O selecciona una fecha específica
                </label>
                <input
                  type="date"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 disabled:cursor-not-allowed ${
                    isClient
                      ? 'bg-white/5 border-white/20 text-white focus:ring-cyan-500 focus:border-cyan-500 disabled:bg-white/5'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100'
                  }`}
                  value={selectedDate || ''}
                  onChange={(e) => setSelectedDate(e.target.value || null)}
                  max={new Date().toISOString().split('T')[0]}
                  min={new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                  disabled={isGenerating}
                />
                {selectedDate && availableDates?.find(d => d.date === selectedDate) && (
                  <p className={`text-xs mt-1 ${isClient ? 'client-text-tertiary' : 'text-gray-500'}`}>
                    {availableDates.find(d => d.date === selectedDate)?.points} puntos registrados
                  </p>
                )}
                {isGenerating && (
                  <p className={`text-xs mt-1 flex items-center gap-1 ${isClient ? 'text-cyan-400' : 'text-blue-600'}`}>
                    <span className="animate-spin">⏳</span>
                    Generando datos históricos...
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Botón para mostrar/ocultar geocercas */}
          <div className="mb-4 flex justify-end">
            <ButtonComponent
              variant={showGeofences ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setShowGeofences(!showGeofences)}
              className="flex items-center gap-2"
            >
              <MapPin className="w-4 h-4" />
              {showGeofences ? 'Ocultar geocercas' : 'Mostrar geocercas'}
            </ButtonComponent>
          </div>

          <div className="h-[500px] rounded-xl overflow-hidden shadow-md border border-gray-200">
            <LeafletMap
              vehicles={selectedDate ? [] : [vehicle]}
              geofences={showGeofences ? geofences : []}
              onVehicleClick={setSelectedVehicle}
              center={[vehicle.lat, vehicle.lng]}
              zoom={15}
              showGeofences={showGeofences}
              routeHistory={routeHistory}
              showRoute={!!selectedDate && routeHistory.length > 0}
            />
          </div>

          {!selectedDate && (
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className={`p-4 rounded-xl border ${
                isClient
                  ? 'bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/20'
                  : 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200'
              }`}>
                <p className={`text-sm font-medium mb-1 ${isClient ? 'text-cyan-400' : 'text-blue-600'}`}>Latitud</p>
                <p className={`text-lg font-bold ${isClient ? 'client-text-primary' : 'text-blue-900'}`}>{vehicle.lat.toFixed(6)}</p>
              </div>
              <div className={`p-4 rounded-xl border ${
                isClient
                  ? 'bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20'
                  : 'bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200'
              }`}>
                <p className={`text-sm font-medium mb-1 ${isClient ? 'text-blue-400' : 'text-indigo-600'}`}>Longitud</p>
                <p className={`text-lg font-bold ${isClient ? 'client-text-primary' : 'text-indigo-900'}`}>{vehicle.lng.toFixed(6)}</p>
              </div>
            </div>
          )}

          {selectedDate && routeHistory.length > 0 && (
            <div className={`mt-6 p-4 rounded-xl border ${
              isClient
                ? 'bg-cyan-500/10 border-cyan-500/20'
                : 'bg-blue-50 border-blue-200'
            }`}>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow"></div>
                  <span className={`text-sm ${isClient ? 'client-text-secondary' : 'text-gray-700'}`}>Inicio</span>
                </div>
                <div className={`flex-1 h-1 ${isClient ? 'bg-cyan-400/50' : 'bg-blue-300'}`}></div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow"></div>
                  <span className={`text-sm ${isClient ? 'client-text-secondary' : 'text-gray-700'}`}>Fin</span>
                </div>
              </div>
              <p className={`text-sm text-center ${isClient ? 'client-text-secondary' : 'text-gray-600'}`}>
                Recorrido con {routeHistory.length} puntos registrados
              </p>
            </div>
          )}
        </CardContent>
      </CardComponent>

      {/* Información del vehículo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Información general */}
        <CardComponent>
          <div className={`p-6 ${isClient ? 'border-b border-white/10' : 'bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-200'}`}>
            <h3 className={`text-xl font-semibold ${isClient ? 'client-heading' : 'text-gray-900'}`}>Información general</h3>
          </div>
          <CardContent className="p-6">
            <div className="space-y-5">
              <div className={`flex justify-between items-center py-3 border-b ${isClient ? 'border-white/10' : 'border-gray-100'}`}>
                <span className={`font-medium ${isClient ? 'client-text-secondary' : 'text-gray-600'}`}>Placa</span>
                <span className={`font-bold text-lg ${isClient ? 'client-text-primary' : 'text-gray-900'}`}>{vehicle.plate}</span>
              </div>
              <div className={`flex justify-between items-center py-3 border-b ${isClient ? 'border-white/10' : 'border-gray-100'}`}>
                <span className={`font-medium ${isClient ? 'client-text-secondary' : 'text-gray-600'}`}>Conductor</span>
                <span className={`font-bold text-lg ${isClient ? 'client-text-primary' : 'text-gray-900'}`}>{vehicle.driver}</span>
              </div>
              <div className={`flex justify-between items-center py-3 border-b ${isClient ? 'border-white/10' : 'border-gray-100'}`}>
                <span className={`font-medium ${isClient ? 'client-text-secondary' : 'text-gray-600'}`}>ID Dispositivo</span>
                <span className={`font-bold text-lg ${isClient ? 'client-text-primary' : 'text-gray-900'}`}>{vehicle.deviceId || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className={`font-medium ${isClient ? 'client-text-secondary' : 'text-gray-600'}`}>Estado</span>
                <BadgeComponent variant={vehicle.status} className="text-sm px-4 py-1">
                  {VEHICLE_STATUS_CONFIG[vehicle.status].label}
                </BadgeComponent>
              </div>
            </div>
          </CardContent>
        </CardComponent>

        {/* Telemetría */}
        <CardComponent>
          <div className={`p-6 ${isClient ? 'border-b border-white/10' : 'bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-gray-200'}`}>
            <h3 className={`text-xl font-semibold ${isClient ? 'client-heading' : 'text-gray-900'}`}>Telemetría en tiempo real</h3>
          </div>
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Velocidad */}
              <div className={`p-5 rounded-xl border shadow-sm ${
                isClient
                  ? 'bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20'
                  : 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl shadow-sm ${isClient ? 'bg-white/10' : 'bg-white'}`}>
                      <Gauge className={`w-6 h-6 ${isClient ? 'text-blue-400' : 'text-blue-600'}`} />
                    </div>
                    <div>
                      <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${isClient ? 'text-blue-400' : 'text-blue-600'}`}>Velocidad actual</p>
                      <p className={`text-3xl font-bold ${isClient ? 'client-text-primary' : 'text-blue-900'}`}>
                        {formatSpeed(vehicle.speed)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Última señal */}
              <div className={`p-5 rounded-xl border shadow-sm ${
                isClient
                  ? 'bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20'
                  : 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200'
              }`}>
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl shadow-sm ${isClient ? 'bg-white/10' : 'bg-white'}`}>
                    <Clock className={`w-6 h-6 ${isClient ? 'text-purple-400' : 'text-purple-600'}`} />
                  </div>
                  <div>
                    <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${isClient ? 'text-purple-400' : 'text-purple-600'}`}>Última señal</p>
                    <p className={`text-3xl font-bold ${isClient ? 'client-text-primary' : 'text-purple-900'}`}>
                      {formatRelativeTime(vehicle.lastSeenMin)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </CardComponent>
      </div>

      {/* Historial y Alertas */}
      <CardComponent>
        <div className={`p-6 ${isClient ? 'border-b border-white/10' : 'bg-gradient-to-r from-violet-50 to-purple-50 border-b border-gray-200'}`}>
          <h3 className={`text-xl font-semibold ${isClient ? 'client-heading' : 'text-gray-900'}`}>Historial y Alertas</h3>
        </div>
        <CardContent className="p-6">
          {vehicleEvents.length === 0 ? (
            <div className={`text-center py-12 ${isClient ? 'text-white/50' : 'text-gray-400'}`}>
              <AlertTriangle className={`w-12 h-12 mx-auto mb-3 ${isClient ? 'text-white/30' : 'text-gray-300'}`} />
              <p className="text-sm">No hay eventos registrados para este vehículo</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {vehicleEvents.map((event: any) => {
                const isGeofenceEvent = event.event_type === 'geofence_entry' || event.event_type === 'geofence_exit';
                const isEntry = event.event_type === 'geofence_entry';
                const isAlert = event.event_type.includes('_alert');

                // Format relative time
                const eventDate = new Date(event.ts);
                const now = new Date();
                const diffMs = now.getTime() - eventDate.getTime();
                const diffMins = Math.floor(diffMs / 60000);
                const diffHours = Math.floor(diffMins / 60);
                const diffDays = Math.floor(diffHours / 24);

                let timeStr = '';
                if (diffMins < 1) timeStr = 'Hace un momento';
                else if (diffMins < 60) timeStr = `Hace ${diffMins} min`;
                else if (diffHours < 24) timeStr = `Hace ${diffHours}h`;
                else timeStr = `Hace ${diffDays} días`;

                return (
                  <div
                    key={event.id}
                    className={`p-4 rounded-xl border transition-all duration-200 hover:shadow-md ${
                      isClient
                        ? isGeofenceEvent
                          ? isEntry
                            ? 'bg-green-500/10 border-green-500/20 hover:bg-green-500/15'
                            : 'bg-orange-500/10 border-orange-500/20 hover:bg-orange-500/15'
                          : isAlert
                          ? 'bg-red-500/10 border-red-500/20 hover:bg-red-500/15'
                          : 'bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/15'
                        : isGeofenceEvent
                        ? isEntry
                          ? 'bg-green-50 border-green-200 hover:bg-green-100'
                          : 'bg-orange-50 border-orange-200 hover:bg-orange-100'
                        : isAlert
                        ? 'bg-red-50 border-red-200 hover:bg-red-100'
                        : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`p-2.5 rounded-lg shrink-0 ${
                        isClient
                          ? isGeofenceEvent
                            ? isEntry
                              ? 'bg-green-500/20'
                              : 'bg-orange-500/20'
                            : isAlert
                            ? 'bg-red-500/20'
                            : 'bg-blue-500/20'
                          : isGeofenceEvent
                          ? isEntry
                            ? 'bg-green-100'
                            : 'bg-orange-100'
                          : isAlert
                          ? 'bg-red-100'
                          : 'bg-blue-100'
                      }`}>
                        {isGeofenceEvent ? (
                          <MapPin className={`w-5 h-5 ${
                            isClient
                              ? isEntry ? 'text-green-400' : 'text-orange-400'
                              : isEntry ? 'text-green-600' : 'text-orange-600'
                          }`} />
                        ) : isAlert ? (
                          <AlertTriangle className={`w-5 h-5 ${isClient ? 'text-red-400' : 'text-red-600'}`} />
                        ) : (
                          <Clock className={`w-5 h-5 ${isClient ? 'text-blue-400' : 'text-blue-600'}`} />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className={`font-semibold text-sm ${isClient ? 'client-text-primary' : 'text-gray-900'}`}>
                            {event.description}
                          </p>
                          <span className={`text-xs shrink-0 ${isClient ? 'client-text-tertiary' : 'text-gray-500'}`}>
                            {timeStr}
                          </span>
                        </div>

                        {event.geofence_name && (
                          <div className="flex items-center gap-2 mt-2">
                            <Badge
                              variant={event.event_subtype === 'authorized' ? 'success' : 'warning'}
                              className="text-xs"
                            >
                              {event.geofence_name}
                            </Badge>
                            {event.event_subtype && (
                              <span className={`text-xs ${
                                isClient
                                  ? event.event_subtype === 'authorized' ? 'text-green-400' : 'text-red-400'
                                  : event.event_subtype === 'authorized' ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {event.event_subtype === 'authorized' ? '✓ Autorizado' : '⚠ No autorizado'}
                              </span>
                            )}
                          </div>
                        )}

                        {event.lat && event.lng && (
                          <p className={`text-xs mt-2 ${isClient ? 'client-text-tertiary' : 'text-gray-500'}`}>
                            📍 {event.lat.toFixed(5)}, {event.lng.toFixed(5)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </CardComponent>
    </div>
  );
}
