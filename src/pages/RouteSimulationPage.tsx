import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { FiMapPin, FiTrash2, FiSend, FiClock, FiZap, FiList } from 'react-icons/fi';
import L from 'leaflet';
import { equipmentsApi } from '../features/equipments/api';
import { routeSimulationApi, type SimulationPoint, type RouteSimulationCreate } from '../features/route-simulation/api';
import type { Equipment } from '../lib/types';

interface RoutePoint extends SimulationPoint {
  id: string;
}

export function RouteSimulationPage() {
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
  const [startTime, setStartTime] = useState<string>(() => {
    const now = new Date();
    now.setHours(now.getHours() - 1);
    return now.toISOString().slice(0, 16);
  });
  const [endTime, setEndTime] = useState<string>(() => {
    return new Date().toISOString().slice(0, 16);
  });
  const [minSpeed, setMinSpeed] = useState<number>(20);
  const [maxSpeed, setMaxSpeed] = useState<number>(80);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);

  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const polylineRef = useRef<L.Polyline | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch equipments - only those with a client assigned
  const { data: allEquipments = [], isLoading: loadingEquipments } = useQuery({
    queryKey: ['equipments'],
    queryFn: equipmentsApi.getAll,
  });

  // Filter to only show equipments with a client_id assigned (needed for geofence alerts)
  const equipments = allEquipments.filter((eq: Equipment) => eq.client_id);

  // Mutation for creating simulation
  const createSimulationMutation = useMutation({
    mutationFn: routeSimulationApi.createSimulation,
    onSuccess: (data) => {
      alert(`Simulación creada exitosamente!\n${data.points_created} puntos creados para IMEI: ${data.imei}`);
      setRoutePoints([]);
    },
    onError: (error: any) => {
      alert(`Error al crear simulación: ${error.response?.data?.detail || error.message}`);
    }
  });

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [20.6597, -103.3496], // Guadalajara
      zoom: 13,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    // Click handler to add points
    map.on('click', (e: L.LeafletMouseEvent) => {
      const newPoint: RoutePoint = {
        id: crypto.randomUUID(),
        lat: e.latlng.lat,
        lon: e.latlng.lng,
      };
      setRoutePoints(prev => [...prev, newPoint]);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers when points change
  useEffect(() => {
    if (!mapRef.current) return;

    const currentMarkers = markersRef.current;
    const pointIds = new Set(routePoints.map(p => p.id));

    // Remove markers for deleted points
    currentMarkers.forEach((marker, id) => {
      if (!pointIds.has(id)) {
        marker.remove();
        currentMarkers.delete(id);
      }
    });

    // Add or update markers
    routePoints.forEach((point, index) => {
      const existingMarker = currentMarkers.get(point.id);
      const isSelected = point.id === selectedPointId;

      const iconHtml = `
        <div style="
          width: ${isSelected ? '24px' : '20px'};
          height: ${isSelected ? '24px' : '20px'};
          background-color: ${index === 0 ? '#10b981' : index === routePoints.length - 1 ? '#ef4444' : '#3b82f6'};
          border-radius: 50%;
          border: ${isSelected ? '4px' : '2px'} solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 10px;
          font-weight: bold;
        ">${index + 1}</div>
      `;

      const icon = L.divIcon({
        html: iconHtml,
        className: 'route-point-marker',
        iconSize: [isSelected ? 24 : 20, isSelected ? 24 : 20],
        iconAnchor: [isSelected ? 12 : 10, isSelected ? 12 : 10],
      });

      if (existingMarker) {
        existingMarker.setLatLng([point.lat, point.lon]);
        existingMarker.setIcon(icon);
      } else {
        const marker = L.marker([point.lat, point.lon], {
          icon,
          draggable: true
        }).addTo(mapRef.current!);

        marker.on('click', () => {
          setSelectedPointId(prev => prev === point.id ? null : point.id);
        });

        marker.on('dragend', (e: L.DragEndEvent) => {
          const newLatLng = e.target.getLatLng();
          setRoutePoints(prev => prev.map(p =>
            p.id === point.id
              ? { ...p, lat: newLatLng.lat, lon: newLatLng.lng }
              : p
          ));
        });

        currentMarkers.set(point.id, marker);
      }
    });

    // Update polyline
    if (polylineRef.current) {
      polylineRef.current.remove();
    }

    if (routePoints.length > 1) {
      const latLngs: [number, number][] = routePoints.map(p => [p.lat, p.lon]);
      polylineRef.current = L.polyline(latLngs, {
        color: '#3b82f6',
        weight: 3,
        opacity: 0.7,
        dashArray: '10, 5',
      }).addTo(mapRef.current);
    }
  }, [routePoints, selectedPointId]);

  // Handle point deletion
  const handleDeletePoint = useCallback((pointId: string) => {
    setRoutePoints(prev => prev.filter(p => p.id !== pointId));
    if (selectedPointId === pointId) {
      setSelectedPointId(null);
    }
  }, [selectedPointId]);

  // Handle clear all points
  const handleClearPoints = useCallback(() => {
    setRoutePoints([]);
    setSelectedPointId(null);
  }, []);

  // Handle submit
  const handleSubmit = () => {
    if (!selectedEquipment) {
      alert('Por favor selecciona un equipo');
      return;
    }
    if (routePoints.length < 2) {
      alert('Se requieren al menos 2 puntos para crear una ruta');
      return;
    }

    const simulationData: RouteSimulationCreate = {
      imei: selectedEquipment.imei,
      device_model: `${selectedEquipment.brand} ${selectedEquipment.model}`,
      start_time: new Date(startTime).toISOString(),
      end_time: new Date(endTime).toISOString(),
      min_speed_kph: minSpeed,
      max_speed_kph: maxSpeed,
      points: routePoints.map(p => ({
        lat: p.lat,
        lon: p.lon,
        speed_kph: p.speed_kph,
      })),
    };

    createSimulationMutation.mutate(simulationData);
  };

  const selectedPoint = routePoints.find(p => p.id === selectedPointId);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Simulación de Ruta</h1>
        <p className="text-sm text-gray-500 mt-1">
          Haz clic en el mapa para agregar puntos de ruta. Los puntos son arrastrables.
        </p>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-96 bg-white border-r flex flex-col overflow-hidden">
          {/* Equipment Selection */}
          <div className="p-4 border-b">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Equipo GPS (con cliente asignado)
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={selectedEquipment?.id || ''}
              onChange={(e) => {
                const eq = equipments.find((eq: Equipment) => eq.id === e.target.value);
                setSelectedEquipment(eq || null);
              }}
              disabled={loadingEquipments}
            >
              <option value="">Seleccionar equipo...</option>
              {equipments.map((eq: Equipment) => (
                <option key={eq.id} value={eq.id}>
                  {eq.imei} - {eq.brand} {eq.model}
                </option>
              ))}
            </select>
            {selectedEquipment && (
              <div className="mt-2 text-xs text-gray-500">
                IMEI: <span className="font-mono">{selectedEquipment.imei}</span>
              </div>
            )}
            {!loadingEquipments && equipments.length === 0 && (
              <div className="mt-2 text-xs text-amber-600">
                No hay equipos con cliente asignado. Asigna un cliente a un equipo primero.
              </div>
            )}
          </div>

          {/* Time Range */}
          <div className="p-4 border-b space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <FiClock className="w-4 h-4" />
              Rango de Tiempo
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Inicio</label>
              <input
                type="datetime-local"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Fin</label>
              <input
                type="datetime-local"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          {/* Speed Range */}
          <div className="p-4 border-b space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <FiZap className="w-4 h-4" />
              Rango de Velocidad (km/h)
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Mínima</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={minSpeed}
                  onChange={(e) => setMinSpeed(Number(e.target.value))}
                  min={0}
                  max={maxSpeed}
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Máxima</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={maxSpeed}
                  onChange={(e) => setMaxSpeed(Number(e.target.value))}
                  min={minSpeed}
                  max={200}
                />
              </div>
            </div>
          </div>

          {/* Points List */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <FiList className="w-4 h-4" />
                Puntos de Ruta ({routePoints.length})
              </div>
              {routePoints.length > 0 && (
                <button
                  onClick={handleClearPoints}
                  className="text-xs text-red-600 hover:text-red-700"
                >
                  Limpiar todos
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              {routePoints.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  <FiMapPin className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  Haz clic en el mapa para agregar puntos
                </div>
              ) : (
                <div className="divide-y">
                  {routePoints.map((point, index) => (
                    <div
                      key={point.id}
                      className={`p-3 flex items-center gap-3 cursor-pointer transition-colors ${
                        point.id === selectedPointId ? 'bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedPointId(point.id === selectedPointId ? null : point.id)}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                          index === 0 ? 'bg-green-500' : index === routePoints.length - 1 ? 'bg-red-500' : 'bg-blue-500'
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-mono text-gray-600 truncate">
                          {point.lat.toFixed(6)}, {point.lon.toFixed(6)}
                        </div>
                        {point.speed_kph !== undefined && (
                          <div className="text-xs text-gray-400">
                            {point.speed_kph} km/h
                          </div>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePoint(point.id);
                        }}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Selected Point Editor */}
          {selectedPoint && (
            <div className="p-4 border-t bg-blue-50">
              <div className="text-sm font-medium text-blue-800 mb-2">
                Punto {routePoints.findIndex(p => p.id === selectedPoint.id) + 1} seleccionado
              </div>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-blue-600 mb-1">
                    Velocidad específica (km/h) - Opcional
                  </label>
                  <input
                    type="number"
                    placeholder="Usar velocidad aleatoria"
                    className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={selectedPoint.speed_kph ?? ''}
                    onChange={(e) => {
                      const value = e.target.value === '' ? undefined : Number(e.target.value);
                      setRoutePoints(prev => prev.map(p =>
                        p.id === selectedPoint.id ? { ...p, speed_kph: value } : p
                      ));
                    }}
                    min={0}
                    max={200}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="p-4 border-t">
            <button
              onClick={handleSubmit}
              disabled={!selectedEquipment || routePoints.length < 2 || createSimulationMutation.isPending}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {createSimulationMutation.isPending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creando simulación...
                </>
              ) : (
                <>
                  <FiSend className="w-5 h-5" />
                  Crear Simulación ({routePoints.length} puntos)
                </>
              )}
            </button>
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <div ref={containerRef} className="w-full h-full" />

          {/* Map Legend */}
          <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3">
            <div className="text-xs font-medium text-gray-700 mb-2">Leyenda</div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                Punto inicial
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                Punto intermedio
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                Punto final
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 max-w-xs">
            <div className="text-xs text-gray-600">
              <strong>Instrucciones:</strong>
              <ul className="mt-1 space-y-1 list-disc list-inside">
                <li>Clic en el mapa para agregar puntos</li>
                <li>Arrastra los puntos para moverlos</li>
                <li>Clic en un punto para seleccionarlo</li>
                <li>Mínimo 2 puntos para crear ruta</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RouteSimulationPage;
