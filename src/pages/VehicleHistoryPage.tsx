import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, CircleMarker, Polyline, Popup } from 'react-leaflet';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Clock, Navigation, Gauge, Satellite } from 'lucide-react';
import { vehicleHistoryApi, type IMEIItem, type RoutePoint } from '../features/vehicle-history/api';
import 'leaflet/dist/leaflet.css';

export default function VehicleHistoryPage() {
  const [selectedIMEI, setSelectedIMEI] = useState<string | null>(null);
  const [days, setDays] = useState<number>(7);
  const [useCustomRange, setUseCustomRange] = useState<boolean>(false);
  const [startDate, setStartDate] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('00:00');
  const [endDate, setEndDate] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('23:59');

  // Obtener lista de IMEIs
  const { data: imeis, isLoading: isLoadingIMEIs } = useQuery({
    queryKey: ['vehicle-history', 'imeis'],
    queryFn: () => vehicleHistoryApi.getIMEIs(),
  });

  // Construir parámetros de query
  const queryParams = useCustomRange && startDate && endDate
    ? {
        start_date: `${startDate}T${startTime}:00`,
        end_date: `${endDate}T${endTime}:59`,
      }
    : { days };

  // Obtener rutas del IMEI seleccionado
  const { data: routes, isLoading: isLoadingRoutes } = useQuery({
    queryKey: ['vehicle-history', 'routes', selectedIMEI, useCustomRange, startDate, startTime, endDate, endTime, days],
    queryFn: () => vehicleHistoryApi.getRoutes(selectedIMEI!, queryParams),
    enabled: !!selectedIMEI,
  });

  // Calcular el centro del mapa basado en las rutas
  const mapCenter: [number, number] = routes && routes.length > 0
    ? [routes[0].lat || 20.6897, routes[0].lon || -103.3918]
    : [20.6897, -103.3918]; // Guadalajara por defecto

  // Convertir rutas a coordenadas para la polilínea
  const routeCoordinates: [number, number][] = routes
    ? routes
        .filter(point => point.lat !== null && point.lon !== null)
        .map(point => [point.lat!, point.lon!])
    : [];

  // Determinar color del punto según velocidad
  const getPointColor = (speed: number | null): string => {
    if (!speed || speed === 0) return '#6b7280'; // Gris - detenido
    if (speed < 30) return '#0ea5e9'; // Azul - lento
    if (speed < 60) return '#10b981'; // Verde - medio
    return '#ef4444'; // Rojo - rápido
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-4 p-4">
      {/* Panel lateral */}
      <div className="flex w-80 flex-col gap-4 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        {/* Header */}
        <div className="border-b border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Historial de Rastreo
          </h2>
          <p className="text-sm text-gray-500">Temporal - Vehicle History</p>
        </div>

        {/* Filtros de fecha */}
        <div className="px-4 space-y-4">
          {/* Toggle entre días y rango personalizado */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="useCustomRange"
              checked={useCustomRange}
              onChange={(e) => setUseCustomRange(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="useCustomRange" className="text-sm font-medium text-gray-700">
              Rango personalizado
            </label>
          </div>

          {!useCustomRange ? (
            // Selector de días preestablecidos
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Días de historial
              </label>
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value={1}>1 día</option>
                <option value={3}>3 días</option>
                <option value={7}>7 días</option>
                <option value={15}>15 días</option>
                <option value={30}>30 días</option>
              </select>
            </div>
          ) : (
            // Selectores de fecha y hora personalizados
            <div className="space-y-3">
              {/* Fecha y hora de inicio */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Fecha y hora de inicio
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-24 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Fecha y hora de fin */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Fecha y hora de fin
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-24 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Mensaje de ayuda */}
              {(!startDate || !endDate) && (
                <p className="text-xs text-amber-600">
                  Selecciona fecha de inicio y fin
                </p>
              )}
            </div>
          )}
        </div>

        {/* Lista de IMEIs */}
        <div className="flex-1 overflow-y-auto px-4">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Seleccionar dispositivo
          </label>

          {isLoadingIMEIs ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
            </div>
          ) : imeis && imeis.length > 0 ? (
            <div className="space-y-2">
              {imeis.map((imei: IMEIItem) => (
                <button
                  key={imei.imei}
                  onClick={() => setSelectedIMEI(imei.imei)}
                  className={`w-full rounded-lg border p-3 text-left transition-all ${
                    selectedIMEI === imei.imei
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium text-gray-900">{imei.imei}</div>
                  <div className="mt-1 text-xs text-gray-500">
                    {imei.device_model || 'Modelo desconocido'}
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-xs text-gray-600">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(imei.last_seen), 'dd/MM/yy HH:mm', { locale: es })}
                    </span>
                    <span>{imei.total_points.toLocaleString()} pts</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center text-sm text-gray-600">
              No hay dispositivos con historial
            </div>
          )}
        </div>

        {/* Info de puntos cargados */}
        {selectedIMEI && routes && (
          <div className="border-t border-gray-200 bg-gray-50 p-4">
            <div className="text-sm text-gray-600">
              <strong>{routes.length}</strong> puntos cargados
            </div>
          </div>
        )}
      </div>

      {/* Mapa */}
      <div className="flex-1 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        {!selectedIMEI ? (
          <div className="flex h-full items-center justify-center text-gray-500">
            Selecciona un dispositivo para ver su historial
          </div>
        ) : isLoadingRoutes ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
              <p className="mt-4 text-gray-600">Cargando rutas...</p>
            </div>
          </div>
        ) : routes && routes.length > 0 ? (
          <MapContainer
            center={mapCenter}
            zoom={13}
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
              opacity={0.6}
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
                  radius={isFirst || isLast ? 8 : 5}
                  fillColor={isFirst ? '#10b981' : isLast ? '#ef4444' : color}
                  color="#ffffff"
                  weight={2}
                  opacity={1}
                  fillOpacity={0.8}
                >
                  <Popup>
                    <div className="min-w-[200px] p-2">
                      <div className="mb-2 border-b pb-2">
                        <div className="font-semibold text-gray-900">
                          {isFirst ? '🟢 Inicio' : isLast ? '🔴 Fin' : '📍 Punto'}
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <div>
                            <div className="font-medium">
                              {format(new Date(point.recv_time), 'dd/MM/yyyy', { locale: es })}
                            </div>
                            <div className="text-xs text-gray-500">
                              {format(new Date(point.recv_time), 'HH:mm:ss', { locale: es })}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-gray-700">
                          <Gauge className="h-4 w-4 text-gray-500" />
                          <span>
                            {point.speed_kph !== null
                              ? `${Math.round(point.speed_kph)} km/h`
                              : 'Sin datos'}
                          </span>
                        </div>

                        {point.satellites !== null && (
                          <div className="flex items-center gap-2 text-gray-700">
                            <Satellite className="h-4 w-4 text-gray-500" />
                            <span>{point.satellites} satélites</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-gray-700">
                          <Navigation className="h-4 w-4 text-gray-500" />
                          <span className="text-xs">
                            {point.lat.toFixed(6)}, {point.lon.toFixed(6)}
                          </span>
                        </div>

                        {point.ignition !== null && (
                          <div className="mt-2 rounded border border-gray-200 bg-gray-50 px-2 py-1 text-xs">
                            Motor: {point.ignition ? '✓ Encendido' : '✗ Apagado'}
                          </div>
                        )}
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-gray-500">
            No se encontraron puntos de ruta para el período seleccionado
          </div>
        )}
      </div>
    </div>
  );
}
