import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { vehiclesApi } from '../features/vehicles/api';
import { QUERY_KEYS } from '../lib/constants';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { LeafletMap } from '../components/map/LeafletMap';
import { ArrowLeft, MapPin, Navigation, Clock, AlertTriangle, Fuel, Gauge, Thermometer, Calendar } from 'lucide-react';
import { formatFuel, formatRelativeTime, formatSpeed, formatTemp } from '../lib/utils';
import { VEHICLE_STATUS_CONFIG } from '../lib/constants';
import type { Vehicle } from '../lib/types';

export function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [routeHistory, setRouteHistory] = useState<Array<{ lat: number; lng: number; ts?: string }>>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Obtener todos los vehículos
  const { data: vehicles, isLoading } = useQuery({
    queryKey: QUERY_KEYS.VEHICLES,
    queryFn: vehiclesApi.getAll,
  });

  // Encontrar el vehículo específico
  const vehicle = vehicles?.find((v) => v.id === id);

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
        <p className="text-gray-500">Vehículo no encontrado</p>
        <Button onClick={() => navigate('/vehiculos')} variant="outline">
          <ArrowLeft className="w-4 h-4" />
          Volver a vehículos
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <Button onClick={() => navigate('/vehiculos')} variant="ghost" size="sm" className="hover:bg-gray-100">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Vehículo {vehicle.plate}</h1>
            <p className="text-gray-500 mt-1.5 text-sm">
              Detalles completos y ubicación en tiempo real
            </p>
          </div>
        </div>
        <Badge variant={vehicle.status} className="self-start sm:self-center">
          {VEHICLE_STATUS_CONFIG[vehicle.status].label}
        </Badge>
      </div>

      {/* Mapa */}
      <Card className="overflow-hidden shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-xl">
              <MapPin className="w-6 h-6 text-blue-600" />
              {selectedDate ? `Recorrido del ${new Date(selectedDate).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}` : 'Ubicación actual'}
            </CardTitle>
            {selectedDate && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDate(null)}
              >
                Ver ubicación actual
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Selector de fecha con filtros rápidos */}
          <div className="mb-4 space-y-4">
            {/* Botones de filtro rápido */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Filtros rápidos
              </label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedDate === new Date().toISOString().split('T')[0] ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => handleQuickFilter(0)}
                  disabled={isGenerating}
                >
                  Hoy
                </Button>
                <Button
                  variant={selectedDate === new Date(Date.now() - 86400000).toISOString().split('T')[0] ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => handleQuickFilter(1)}
                  disabled={isGenerating}
                >
                  Ayer
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Mostrar mensaje o implementar vista de 7 días
                    handleQuickFilter(1); // Por ahora muestra ayer
                  }}
                  disabled={isGenerating}
                >
                  Últimos 7 días
                </Button>
                {selectedDate && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedDate(null)}
                    disabled={isGenerating}
                  >
                    Limpiar
                  </Button>
                )}
              </div>
            </div>

            {/* Date picker */}
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  O selecciona una fecha específica
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  value={selectedDate || ''}
                  onChange={(e) => setSelectedDate(e.target.value || null)}
                  max={new Date().toISOString().split('T')[0]}
                  min={new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                  disabled={isGenerating}
                />
                {selectedDate && availableDates?.find(d => d.date === selectedDate) && (
                  <p className="text-xs text-gray-500 mt-1">
                    {availableDates.find(d => d.date === selectedDate)?.points} puntos registrados
                  </p>
                )}
                {isGenerating && (
                  <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                    <span className="animate-spin">⏳</span>
                    Generando datos históricos...
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="h-[500px] rounded-xl overflow-hidden shadow-md border border-gray-200">
            <LeafletMap
              vehicles={selectedDate ? [] : [vehicle]}
              geofences={[]}
              onVehicleClick={setSelectedVehicle}
              center={[vehicle.lat, vehicle.lng]}
              zoom={15}
              showGeofences={false}
              routeHistory={routeHistory}
              showRoute={!!selectedDate && routeHistory.length > 0}
            />
          </div>

          {!selectedDate && (
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                <p className="text-sm text-blue-600 font-medium mb-1">Latitud</p>
                <p className="text-lg font-bold text-blue-900">{vehicle.lat.toFixed(6)}</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl border border-indigo-200">
                <p className="text-sm text-indigo-600 font-medium mb-1">Longitud</p>
                <p className="text-lg font-bold text-indigo-900">{vehicle.lng.toFixed(6)}</p>
              </div>
            </div>
          )}

          {selectedDate && routeHistory.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow"></div>
                  <span className="text-sm text-gray-700">Inicio</span>
                </div>
                <div className="flex-1 h-1 bg-blue-300"></div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow"></div>
                  <span className="text-sm text-gray-700">Fin</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 text-center">
                Recorrido con {routeHistory.length} puntos registrados
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Información del vehículo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Información general */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-200">
            <CardTitle className="text-xl">Información general</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-5">
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600 font-medium">Placa</span>
                <span className="font-bold text-gray-900 text-lg">{vehicle.plate}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600 font-medium">Conductor</span>
                <span className="font-bold text-gray-900 text-lg">{vehicle.driver}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600 font-medium">ID Dispositivo</span>
                <span className="font-bold text-gray-900 text-lg">{vehicle.deviceId || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-gray-600 font-medium">Estado</span>
                <Badge variant={vehicle.status} className="text-sm px-4 py-1">
                  {VEHICLE_STATUS_CONFIG[vehicle.status].label}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Telemetría */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-gray-200">
            <CardTitle className="text-xl">Telemetría en tiempo real</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Velocidad */}
              <div className="p-5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-xl shadow-sm">
                      <Gauge className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-1">Velocidad actual</p>
                      <p className="text-3xl font-bold text-blue-900">
                        {formatSpeed(vehicle.speed)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Combustible */}
              <div className="p-5 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-xl shadow-sm">
                      <Fuel className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-green-600 font-semibold uppercase tracking-wide mb-1">Combustible</p>
                      <p className="text-3xl font-bold text-green-900">{formatFuel(vehicle.fuel)}</p>
                    </div>
                  </div>
                </div>
                <div className="w-full bg-white rounded-full h-3 overflow-hidden shadow-inner">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      vehicle.fuel > 50
                        ? 'bg-green-600'
                        : vehicle.fuel > 20
                        ? 'bg-yellow-500'
                        : 'bg-red-600'
                    }`}
                    style={{ width: `${vehicle.fuel}%` }}
                  />
                </div>
              </div>

              {/* Temperatura */}
              {vehicle.temp && (
                <div className="p-5 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-xl shadow-sm">
                      <Thermometer className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-xs text-orange-600 font-semibold uppercase tracking-wide mb-1">Temperatura motor</p>
                      <p className="text-3xl font-bold text-orange-900">
                        {formatTemp(vehicle.temp)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Última señal */}
              <div className="p-5 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white rounded-xl shadow-sm">
                    <Clock className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-purple-600 font-semibold uppercase tracking-wide mb-1">Última señal</p>
                    <p className="text-3xl font-bold text-purple-900">
                      {formatRelativeTime(vehicle.lastSeenMin)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Historial y Alertas */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 border-b border-gray-200">
          <CardTitle className="text-xl">Historial y Alertas</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              className="p-8 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 hover:shadow-lg transition-all duration-300 group"
              onClick={() => {
                // TODO: Implementar navegación a historial de ruta
                console.log('Ver historial de ruta para:', vehicle.plate);
              }}
            >
              <div className="flex flex-col items-center text-center gap-4">
                <div className="p-4 bg-blue-100 rounded-2xl group-hover:bg-blue-200 group-hover:scale-110 transition-all duration-300 shadow-md">
                  <Navigation className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-900 mb-2">
                    Historial de rutas
                  </h3>
                  <p className="text-sm text-gray-600">Ver todas las rutas recorridas por este vehículo</p>
                </div>
              </div>
            </button>

            <button
              className="p-8 border-2 border-gray-200 rounded-xl hover:border-red-500 hover:bg-red-50 hover:shadow-lg transition-all duration-300 group"
              onClick={() => {
                // TODO: Implementar navegación a alertas
                console.log('Ver alertas para:', vehicle.plate);
              }}
            >
              <div className="flex flex-col items-center text-center gap-4">
                <div className="p-4 bg-red-100 rounded-2xl group-hover:bg-red-200 group-hover:scale-110 transition-all duration-300 shadow-md">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-red-900 mb-2">
                    Alertas del vehículo
                  </h3>
                  <p className="text-sm text-gray-600">Ver todas las alertas generadas por este vehículo</p>
                </div>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
