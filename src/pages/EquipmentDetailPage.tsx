import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { equipmentsApi } from '../features/equipments/api';
import { QUERY_KEYS, EQUIPMENT_STATUS_CONFIG } from '../lib/constants';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { ClientCard } from '../components/ui/ClientCard';
import { Badge } from '../components/ui/Badge';
import { ClientBadge } from '../components/ui/ClientBadge';
import { Button } from '../components/ui/Button';
import { ClientButton } from '../components/ui/ClientButton';
import { LeafletMap } from '../components/map/LeafletMap';
import { ArrowLeft, MapPin, Clock, AlertTriangle, Gauge, Bell } from 'lucide-react';
import { formatRelativeTime, formatSpeed } from '../lib/utils';
import type { Equipment } from '../lib/types';
import { useAuth } from '../features/auth/hooks';
import { geofencesApi } from '../features/geofences/api';
import { mockNotifications } from '../data/mockData';

// Función para generar puntos de recorrido simulados
// Simula un comportamiento realista de vehículo con movimiento continuo y natural
const generateSimulatedTrack = (
  equipment: Equipment,
  startDate: Date,
  endDate: Date
): Array<{ lat: number; lng: number; ts: string; speed: number }> => {
  const points: Array<{ lat: number; lng: number; ts: string; speed: number }> = [];

  if (!equipment.lat || !equipment.lng) return points;

  // Generar entre 25-35 puntos
  const numPoints = Math.floor(Math.random() * 11) + 25;

  const startTime = startDate.getTime();
  const endTime = endDate.getTime();
  const timeInterval = (endTime - startTime) / (numPoints - 1);

  let currentLat = equipment.lat;
  let currentLng = equipment.lng;

  // Dirección inicial aleatoria pero consistente
  let direction = Math.random() * Math.PI * 2; // Ángulo en radianes
  let speed = Math.floor(Math.random() * 40) + 30; // Velocidad inicial 30-70 km/h

  for (let i = 0; i < numPoints; i++) {
    const time = startTime + (timeInterval * i);

    // Cambiar dirección gradualmente (simula giros suaves)
    // Cada punto puede cambiar la dirección hasta ±30 grados
    const directionChange = (Math.random() - 0.5) * (Math.PI / 6); // ±30 grados
    direction += directionChange;

    // Cambiar velocidad gradualmente (aceleración/desaceleración natural)
    const speedChange = (Math.random() - 0.5) * 10; // ±5 km/h
    speed = Math.max(20, Math.min(80, speed + speedChange)); // Mantener entre 20-80 km/h

    // Distancia entre puntos (~500 metros)
    // 0.0045 grados ≈ 500 metros
    const distance = 0.0045;

    // Calcular nuevo punto basado en dirección
    const deltaLat = Math.cos(direction) * distance;
    const deltaLng = Math.sin(direction) * distance;

    currentLat += deltaLat;
    currentLng += deltaLng;

    points.push({
      lat: currentLat,
      lng: currentLng,
      ts: new Date(time).toISOString(),
      speed: Math.floor(speed),
    });

    // Simular paradas ocasionales (5% de probabilidad)
    if (Math.random() < 0.05 && i > 0 && i < numPoints - 1) {
      // Agregar 2-3 puntos estacionarios
      const stopDuration = Math.floor(Math.random() * 2) + 2;
      for (let j = 1; j <= stopDuration; j++) {
        const stopTime = time + (timeInterval * j / (stopDuration + 1));
        points.push({
          lat: currentLat,
          lng: currentLng,
          ts: new Date(stopTime).toISOString(),
          speed: 0,
        });
      }
      i += stopDuration; // Saltar estos puntos en el loop principal
    }
  }

  return points;
};

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

  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [showGeofences, setShowGeofences] = useState(false);
  const [simulatedTrack, setSimulatedTrack] = useState<Array<{ lat: number; lng: number; ts: string; speed: number }>>([]);

  // Determine if current user is a client/admin for conditional styling
  const isClient = user?.role === 'admin';
  const CardComponent = isClient ? ClientCard : Card;
  const BadgeComponent = isClient ? ClientBadge : Badge;
  const ButtonComponent = isClient ? ClientButton : Button;

  // Obtener todos los equipos GPS
  const { data: equipments, isLoading } = useQuery({
    queryKey: QUERY_KEYS.EQUIPMENTS,
    queryFn: equipmentsApi.getAll,
    enabled: !!user,
  });

  // Encontrar el equipo GPS específico
  const equipment = equipments?.find((e) => e.id === id);

  // Obtener clientes
  const { data: clients = [] } = useQuery({
    queryKey: QUERY_KEYS.CLIENTS,
    queryFn: async () => {
      const { clientsApi } = await import('../features/clients/api');
      return clientsApi.getAll();
    },
    enabled: !!user?.role && user.role === 'superuser',
  });

  // Obtener activos
  const { data: assets = [] } = useQuery({
    queryKey: QUERY_KEYS.ASSETS,
    queryFn: async () => {
      const { assetsApi } = await import('../features/assets/api');
      return assetsApi.getAll();
    },
    enabled: !!user,
  });

  // Obtener geocercas filtradas según el rol del usuario
  const { data: geofences = [] } = useQuery({
    queryKey: (user?.role === 'admin' || user?.role === 'operator-admin' || user?.role === 'operator-monitor') ? ['geofences', 'all'] : ['geofences'],
    queryFn: async () => {
      const allGeofences = await geofencesApi.getAll();

      if ((user?.role === 'admin' || user?.role === 'operator-admin' || user?.role === 'operator-monitor') && user.client_id) {
        return allGeofences.filter(g => g.is_global || g.client_id === user.client_id);
      }
      return allGeofences;
    },
    enabled: !!user,
  });

  // Obtener notificaciones del equipo
  const equipmentNotifications = mockNotifications.filter(
    (n) => n.equipment_id === id
  ).slice(0, 10); // Últimas 10 notificaciones

  // Generar track simulado cuando cambian los filtros
  useEffect(() => {
    if (!equipment || !equipment.lat || !equipment.lng) return;

    const start = new Date(`${startDate}T${startTime}:00`);
    const end = new Date(`${endDate}T${endTime}:00`);

    if (start > end) return;

    const track = generateSimulatedTrack(equipment, start, end);
    setSimulatedTrack(track);
  }, [equipment, startDate, endDate, startTime, endTime]);

  useEffect(() => {
    if (equipment) {
      setSelectedEquipment(equipment);
    }
  }, [equipment]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!equipment) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className={isClient ? 'client-text-secondary' : 'text-gray-500'}>Equipo GPS no encontrado</p>
        <ButtonComponent onClick={() => navigate('/equipos')} variant="outline">
          <ArrowLeft className="w-4 h-4" />
          Volver a equipos GPS
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
            <ButtonComponent onClick={() => navigate('/equipos')} variant="ghost" size="sm" className={isClient ? '' : 'hover:bg-gray-100'}>
              <ArrowLeft className="w-5 h-5" />
            </ButtonComponent>
            <div>
              <h1 className={`text-3xl font-bold ${isClient ? 'client-heading' : 'text-gray-900'}`}>Equipo GPS - {equipment.imei}</h1>
              <p className={`mt-1.5 text-sm ${isClient ? 'client-text-secondary' : 'text-gray-500'}`}>
                Detalles completos y ubicación en tiempo real
              </p>
            </div>
          </div>
          <BadgeComponent variant={equipment.status === 'active' ? 'moving' : 'default'} className="self-start sm:self-center">
            {EQUIPMENT_STATUS_CONFIG[equipment.status]?.label || equipment.status}
          </BadgeComponent>
        </div>
      </CardComponent>

      {/* Mapa con Filtros */}
      <CardComponent className="overflow-hidden">
        <div className={`p-6 ${isClient ? 'border-b border-white/10' : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200'}`}>
          <h3 className={`flex items-center gap-2 text-xl font-semibold ${isClient ? 'client-heading' : 'text-gray-900'}`}>
            <MapPin className={`w-6 h-6 ${isClient ? 'text-cyan-400' : 'text-blue-600'}`} />
            Recorrido y Ubicación
          </h3>
        </div>
        <CardContent className="p-6">
          {/* Filtros de Fecha y Hora */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Filtros de Recorrido</h4>
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
            <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
              <Clock className="w-4 h-4" />
              <span>Simulación: {simulatedTrack.length} puntos generados • 1 punto cada ~500 metros recorridos</span>
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

          {equipment.lat && equipment.lng ? (
            <>
              <div className="h-[500px] rounded-xl overflow-hidden shadow-md border border-gray-200">
                {/* No mostrar marcador del vehículo, solo la línea del recorrido */}
                <LeafletMap
                  vehicles={[]}
                  geofences={showGeofences ? geofences : []}
                  onVehicleClick={(v: any) => setSelectedEquipment(v)}
                  center={simulatedTrack.length > 0 ? [simulatedTrack[0].lat, simulatedTrack[0].lng] : [equipment.lat, equipment.lng]}
                  zoom={15}
                  showGeofences={showGeofences}
                  routeHistory={simulatedTrack.map(p => ({ lat: p.lat, lng: p.lng, ts: p.ts }))}
                  showRoute={simulatedTrack.length > 0}
                />
              </div>
            </>
          ) : (
            <div className={`text-center py-12 ${isClient ? 'text-white/50' : 'text-gray-400'}`}>
              <MapPin className={`w-12 h-12 mx-auto mb-3 ${isClient ? 'text-white/30' : 'text-gray-300'}`} />
              <p className="text-sm">Este equipo no tiene ubicación registrada</p>
            </div>
          )}
        </CardContent>
      </CardComponent>

      {/* Información del equipo GPS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Información general */}
        <CardComponent>
          <div className={`p-6 ${isClient ? 'border-b border-white/10' : 'bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-200'}`}>
            <h3 className={`text-xl font-semibold ${isClient ? 'client-heading' : 'text-gray-900'}`}>Información del Equipo</h3>
          </div>
          <CardContent className="p-6">
            <div className="space-y-5">
              <div className={`flex justify-between items-center py-3 border-b ${isClient ? 'border-white/10' : 'border-gray-100'}`}>
                <span className={`font-medium ${isClient ? 'client-text-secondary' : 'text-gray-600'}`}>IMEI</span>
                <span className={`font-bold text-lg ${isClient ? 'client-text-primary' : 'text-gray-900'}`}>{equipment.imei}</span>
              </div>
              <div className={`flex justify-between items-center py-3 border-b ${isClient ? 'border-white/10' : 'border-gray-100'}`}>
                <span className={`font-medium ${isClient ? 'client-text-secondary' : 'text-gray-600'}`}>Serial</span>
                <span className={`font-bold text-lg ${isClient ? 'client-text-primary' : 'text-gray-900'}`}>{equipment.serial}</span>
              </div>
              <div className={`flex justify-between items-center py-3 border-b ${isClient ? 'border-white/10' : 'border-gray-100'}`}>
                <span className={`font-medium ${isClient ? 'client-text-secondary' : 'text-gray-600'}`}>Modelo</span>
                <span className={`font-bold text-lg ${isClient ? 'client-text-primary' : 'text-gray-900'}`}>{equipment.brand} {equipment.model}</span>
              </div>
              <div className={`flex justify-between items-start py-3 border-b ${isClient ? 'border-white/10' : 'border-gray-100'}`}>
                <span className={`font-medium ${isClient ? 'client-text-secondary' : 'text-gray-600'}`}>Asignado a</span>
                <div className="text-right">
                  {equipment.client_id ? (
                    <>
                      <div className={`font-bold text-lg ${isClient ? 'client-text-primary' : 'text-gray-900'}`}>
                        {clients.find(c => c.id === equipment.client_id)?.company_name || 'Cliente desconocido'}
                      </div>
                      {equipment.asset_id && (
                        <div className={`text-sm mt-1 ${isClient ? 'client-text-secondary' : 'text-gray-500'}`}>
                          {assets.find(a => a.id === equipment.asset_id)?.name || 'Activo no encontrado'}
                        </div>
                      )}
                    </>
                  ) : (
                    <span className={`font-bold text-lg ${isClient ? 'client-text-secondary' : 'text-gray-400'}`}>Sin asignar</span>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className={`font-medium ${isClient ? 'client-text-secondary' : 'text-gray-600'}`}>Estado</span>
                <BadgeComponent variant={equipment.status === 'active' ? 'moving' : 'default'} className="text-sm px-4 py-1">
                  {EQUIPMENT_STATUS_CONFIG[equipment.status]?.label || equipment.status}
                </BadgeComponent>
              </div>
            </div>
          </CardContent>
        </CardComponent>

        {/* Datos de Transmisión */}
        <CardComponent>
          <div className={`p-6 ${isClient ? 'border-b border-white/10' : 'bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-gray-200'}`}>
            <h3 className={`text-xl font-semibold ${isClient ? 'client-heading' : 'text-gray-900'}`}>Datos de Transmisión</h3>
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
                        {formatSpeed(equipment.speed || 0)}
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
                      {equipment.last_seen ? formatRelativeTime(
                        Math.floor((Date.now() - new Date(equipment.last_seen).getTime()) / 60000)
                      ) : 'Nunca'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </CardComponent>
      </div>

      {/* Notificaciones del Equipo */}
      {equipmentNotifications.length > 0 && (
        <CardComponent>
          <div className={`p-6 ${isClient ? 'border-b border-white/10' : 'bg-gradient-to-r from-amber-50 to-orange-50 border-b border-gray-200'}`}>
            <h3 className={`flex items-center gap-2 text-xl font-semibold ${isClient ? 'client-heading' : 'text-gray-900'}`}>
              <Bell className={`w-6 h-6 ${isClient ? 'text-amber-400' : 'text-amber-600'}`} />
              Últimas Notificaciones
            </h3>
          </div>
          <CardContent className="p-6">
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {equipmentNotifications.map((notification) => {
                const isUnread = !notification.read_by?.includes(user?.id || '');
                const timeDiff = Math.floor((Date.now() - new Date(notification.ts).getTime()) / 60000);

                return (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isUnread
                        ? 'bg-amber-50 border-amber-200 hover:bg-amber-100'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        notification.priority === 'high'
                          ? 'bg-red-100'
                          : 'bg-blue-100'
                      }`}>
                        <AlertTriangle className={`w-5 h-5 ${
                          notification.priority === 'high'
                            ? 'text-red-600'
                            : 'text-blue-600'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`font-semibold text-sm ${isUnread ? 'text-gray-900' : 'text-gray-600'}`}>
                            {notification.description}
                          </p>
                          <span className="text-xs text-gray-500 shrink-0">
                            {formatRelativeTime(timeDiff)}
                          </span>
                        </div>
                        {notification.resource_name && (
                          <p className="text-xs text-gray-500 mt-1">{notification.resource_name}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </CardComponent>
      )}
    </div>
  );
}
