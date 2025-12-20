import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { toPng } from 'html-to-image';
import {
  generateFullPDF,
  generateHistoryPDF,
  generateStatsPDF,
  type PDFGeneratorOptions,
  type StatsPDFData,
} from '../lib/pdfGenerator';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, CircleMarker, Polyline, Popup, Circle, Polygon, useMap } from 'react-leaflet';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { equipmentsApi } from '../features/equipments/api';
import { vehicleHistoryApi } from '../features/vehicle-history/api';
import type { RoutePoint, RouteStatsResponse } from '../features/vehicle-history/api';
import { alertsApi } from '../features/alerts/api';
import { driversApi } from '../features/drivers/api';
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
  BarChart3,
  Route,
  Power,
  Car,
  CircleStop,
  PowerOff,
  Download,
  Users,
  AlertTriangle,
  Trophy,
  Bell,
  LogIn,
  LogOut,
  User,
  Phone,
  Award,
  Square,
  CheckSquare,
  X
} from 'lucide-react';
import { formatRelativeTime, formatSpeed } from '../lib/utils';
import type { Equipment } from '../lib/types';
import { useAuth } from '../features/auth/hooks';
import { geofencesApi } from '../features/geofences/api';
import { useTheme } from '../contexts/ThemeContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import 'leaflet/dist/leaflet.css';

export function EquipmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDark } = useTheme();

  // Estados para filtros de fecha/hora
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Calcular ayer y antier
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const dayBeforeYesterday = new Date(today);
  dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);
  const dayBeforeYesterdayStr = dayBeforeYesterday.toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(dayBeforeYesterdayStr);
  const [endDate, setEndDate] = useState(yesterdayStr);
  const [startTime, setStartTime] = useState('00:00');
  const [endTime, setEndTime] = useState('23:59');
  const [showGeofences, setShowGeofences] = useState(false);
  const [activeTab, setActiveTab] = useState<'historial' | 'estadisticas'>('historial');
  const [routesPage, setRoutesPage] = useState(1);
  const routesPerPage = 10;
  // Estado para el intervalo de ruta seleccionado en historial (null = mostrar todas)
  const [selectedRouteInterval, setSelectedRouteInterval] = useState<number | null>(null);
  // Estado para secciones seleccionadas en estadísticas (para PDF)
  const [selectedStatsSections, setSelectedStatsSections] = useState<Set<string>>(new Set());

  // Toggle para seleccionar/deseleccionar una sección de estadísticas
  const toggleStatsSection = (sectionId: string) => {
    setSelectedStatsSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  // Resetear página y intervalo cuando cambian las fechas
  useEffect(() => {
    setRoutesPage(1);
    setSelectedRouteInterval(null);
  }, [startDate, startTime, endDate, endTime]);

  // Refs para capturas de pantalla en PDFs
  const mapRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  // Refs para secciones de estadísticas individuales
  const statsSummaryRef = useRef<HTMLDivElement>(null);
  const statsSpeedChartRef = useRef<HTMLDivElement>(null);
  const statsDistributionRef = useRef<HTMLDivElement>(null);
  const statsMovementRef = useRef<HTMLDivElement>(null);
  const statsAnalysisRef = useRef<HTMLDivElement>(null);
  const statsPeriodRef = useRef<HTMLDivElement>(null);
  const statsRankingRef = useRef<HTMLDivElement>(null);
  const routesTableFullRef = useRef<HTMLDivElement>(null);

  // Mapa de refs por sección para PDF selectivo
  const sectionRefs: Record<string, React.RefObject<HTMLDivElement | null>> = {
    resumen: statsSummaryRef,
    rutas: routesTableFullRef,
    velocidad: statsSpeedChartRef,
    distribucion: statsDistributionRef,
    movimiento: statsMovementRef,
    analisis: statsAnalysisRef,
    periodo: statsPeriodRef,
    ranking: statsRankingRef,
  };

  // Función para descargar imagen de una sección
  const downloadSectionAsImage = useCallback(async (ref: React.RefObject<HTMLDivElement | null>, filename: string) => {
    if (!ref.current) return;
    try {
      const dataUrl = await toPng(ref.current, {
        backgroundColor: isDark ? '#1f2937' : '#ffffff',
        pixelRatio: 2,
      });
      const link = document.createElement('a');
      link.download = `${filename}-${format(new Date(), 'yyyy-MM-dd-HHmm')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error al generar imagen:', error);
    }
  }, [isDark]);

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

  // Obtener estadísticas de rutas del equipo (también usado para intervalos en historial)
  const { data: routeStatsData, isLoading: isLoadingRouteStats } = useQuery({
    queryKey: ['vehicle-stats', 'routes', equipment?.imei, startDate, startTime, endDate, endTime],
    queryFn: () => vehicleHistoryApi.getRouteStats(equipment!.imei, {
      start_date: `${startDate}T${startTime}:00`,
      end_date: `${endDate}T${endTime}:59`,
    }),
    enabled: !!equipment?.imei && (activeTab === 'estadisticas' || activeTab === 'historial'),
  });

  // Obtener alertas del equipo
  const { data: equipmentAlerts = [] } = useQuery({
    queryKey: ['alerts', 'equipment', id],
    queryFn: () => alertsApi.getByEquipment(id!),
    enabled: !!id,
  });

  // Obtener conductores del cliente
  const { data: drivers = [] } = useQuery({
    queryKey: QUERY_KEYS.DRIVERS,
    queryFn: driversApi.getAll,
    enabled: !!equipment?.client_id,
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

  // Filtrar rutas según el intervalo seleccionado
  const filteredRoutes = useMemo(() => {
    if (selectedRouteInterval === null || !routeStatsData?.rutas) {
      return routes;
    }
    const selectedRuta = routeStatsData.rutas.find(r => r.ruta === selectedRouteInterval);
    if (!selectedRuta) {
      return routes;
    }
    const startTime = new Date(selectedRuta.inicio).getTime();
    const endTime = new Date(selectedRuta.fin).getTime();
    return routes.filter(point => {
      const pointTime = new Date(point.recv_time).getTime();
      return pointTime >= startTime && pointTime <= endTime;
    });
  }, [routes, selectedRouteInterval, routeStatsData?.rutas]);

  // Calcular el centro del mapa basado en las rutas filtradas
  const mapCenter: [number, number] = useMemo(() => {
    // Si hay rutas filtradas, centrar en el primer punto
    if (filteredRoutes.length > 0 && filteredRoutes[0].lat && filteredRoutes[0].lon) {
      return [filteredRoutes[0].lat, filteredRoutes[0].lon];
    }
    // Si hay rutas sin filtrar, usar el primer punto
    if (routes.length > 0 && routes[0].lat && routes[0].lon) {
      return [routes[0].lat, routes[0].lon];
    }
    // Usar ubicación del equipo
    if (equipment?.lat && equipment?.lng) {
      return [equipment.lat, equipment.lng];
    }
    // Default: Guadalajara
    return [20.6897, -103.3918];
  }, [filteredRoutes, routes, equipment?.lat, equipment?.lng]);

  // Componente para controlar el mapa (centrar cuando cambia el intervalo)
  const MapController = ({ center }: { center: [number, number] }) => {
    const map = useMap();
    useEffect(() => {
      if (center) {
        map.flyTo(center, 14, { duration: 0.5 });
      }
    }, [center, map]);
    return null;
  };

  // Convertir rutas filtradas a coordenadas para la polilínea
  const routeCoordinates: [number, number][] = filteredRoutes
    .filter(point => point.lat !== null && point.lon !== null)
    .map(point => [point.lat!, point.lon!]);

  // Determinar color del punto según velocidad
  const getPointColor = (speed: number | null): string => {
    if (!speed || speed === 0) return '#6b7280'; // Gris - detenido
    if (speed < 30) return '#0ea5e9'; // Azul - lento
    if (speed < 60) return '#10b981'; // Verde - medio
    return '#ef4444'; // Rojo - rápido
  };

  // Calcular estadísticas del recorrido (usando rutas filtradas)
  const routeStats = {
    totalPoints: filteredRoutes.length,
    maxSpeed: filteredRoutes.reduce((max, p) => Math.max(max, p.speed_kph || 0), 0),
    avgSpeed: filteredRoutes.length > 0
      ? filteredRoutes.reduce((sum, p) => sum + (p.speed_kph || 0), 0) / filteredRoutes.filter(p => p.speed_kph).length
      : 0,
    stoppedPoints: filteredRoutes.filter(p => !p.speed_kph || p.speed_kph === 0).length,
  };

  // Configuración de estados del vehículo (con soporte dark mode)
  const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: typeof Power }> = {
    engine_on: { label: 'Encendido de motor', color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900/40', icon: Power },
    moving: { label: 'En movimiento', color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-900/40', icon: Car },
    stopped: { label: 'Detenido', color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-100 dark:bg-amber-900/40', icon: CircleStop },
    engine_off: { label: 'Motor apagado', color: 'text-gray-600 dark:text-gray-400', bgColor: 'bg-gray-200 dark:bg-gray-700', icon: PowerOff },
  };

  // Inferir estado del vehículo basándose en velocidad e ignición
  const inferStatus = (point: RoutePoint, index: number): string => {
    // Si tiene un status válido, usarlo
    if (point.status &&
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

  // Agrupar estados consecutivos para el timeline (usando rutas filtradas)
  const getStatusSegments = () => {
    if (filteredRoutes.length === 0) return [];

    const segments: Array<{
      status: string;
      startTime: string;
      endTime: string;
      duration: number;
      pointCount: number;
    }> = [];

    let currentSegment: typeof segments[0] | null = null;

    filteredRoutes.forEach((point, index) => {
      const status = inferStatus(point, index);

      if (!currentSegment || currentSegment.status !== status) {
        // Cerrar segmento anterior
        if (currentSegment) {
          currentSegment.endTime = filteredRoutes[index - 1].recv_time;
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
      currentSegment.endTime = filteredRoutes[filteredRoutes.length - 1].recv_time;
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

  // Construir datos para PDF de estadísticas (generación nativa)
  const buildStatsPDFData = (): StatsPDFData | undefined => {
    if (!routeStatsData?.rutas || routeStatsData.rutas.length === 0) {
      return undefined;
    }

    const rutas = routeStatsData.rutas;

    // Calcular resumen
    const totalRutas = routeStatsData.total_rutas || rutas.length;
    const kmRecorridos = rutas.reduce((sum, r) => sum + r.km_recorridos, 0);
    const velMaxima = rutas.reduce((max, r) => Math.max(max, r.velocidad_maxima), 0);
    const velPromedio = rutas.length > 0
      ? rutas.reduce((sum, r) => sum + r.velocidad_promedio, 0) / rutas.length
      : 0;
    const horasMarcha = rutas.reduce((sum, r) => sum + r.tiempo_marcha_horas, 0);
    const horasRalenti = rutas.reduce((sum, r) => sum + r.tiempo_ralenti_horas, 0);
    const horasTotales = rutas.reduce((sum, r) => sum + r.tiempo_total_horas, 0);
    const puntosRegistrados = rutas.reduce((sum, r) => sum + r.puntos, 0);

    // Calcular distribución de velocidad desde routes (usando speed_kph)
    const speedDistribution = [
      {
        range: 'Detenido',
        count: routes.filter(p => !p.speed_kph || p.speed_kph === 0).length,
        color: '#6b7280'
      },
      {
        range: '1-30',
        count: routes.filter(p => p.speed_kph && p.speed_kph > 0 && p.speed_kph <= 30).length,
        color: '#0ea5e9'
      },
      {
        range: '31-60',
        count: routes.filter(p => p.speed_kph && p.speed_kph > 30 && p.speed_kph <= 60).length,
        color: '#10b981'
      },
      {
        range: '61-80',
        count: routes.filter(p => p.speed_kph && p.speed_kph > 60 && p.speed_kph <= 80).length,
        color: '#f59e0b'
      },
      {
        range: '>80',
        count: routes.filter(p => p.speed_kph && p.speed_kph > 80).length,
        color: '#ef4444'
      },
    ];

    // Calcular estado de movimiento (igual que UI)
    const movingPoints = routes.filter(p => p.speed_kph && p.speed_kph > 0).length;
    const stoppedPoints = routes.filter(p => !p.speed_kph || p.speed_kph === 0).length;
    const totalPoints = routes.length || 1;

    const movementState = [
      {
        label: 'En movimiento',
        value: movingPoints,
        color: '#10b981',
        percent: (movingPoints / totalPoints) * 100
      },
      {
        label: 'Detenido',
        value: stoppedPoints,
        color: '#6b7280',
        percent: (stoppedPoints / totalPoints) * 100
      },
    ];

    // Calcular análisis detallado (igual que UI)
    // Exceso de velocidad = > 60 km/h
    const speedExcessPoints = routes.filter(p => p.speed_kph && p.speed_kph > 60).length;
    // Alta velocidad = > 80 km/h
    const highSpeedPoints = routes.filter(p => p.speed_kph && p.speed_kph > 80).length;

    const analysis = {
      movingPoints,
      movingPercent: (movingPoints / totalPoints) * 100,
      speedExcessPoints,
      speedExcessPercent: (speedExcessPoints / totalPoints) * 100,
      highSpeedPoints,
      highSpeedPercent: (highSpeedPoints / totalPoints) * 100,
      stoppedPoints: routeStats.stoppedPoints, // Usar el mismo valor que el UI
      stoppedPercent: routes.length > 0 ? (routeStats.stoppedPoints / routes.length) * 100 : 0,
    };

    // Construir timeline de velocidad (samplear si hay muchos puntos, igual que UI)
    const maxTimelinePoints = 100;
    const step = Math.max(1, Math.floor(routes.length / maxTimelinePoints));
    const speedTimeline = routes
      .filter((_, i) => i % step === 0)
      .map(point => ({
        time: format(new Date(point.recv_time), 'HH:mm', { locale: es }),
        speed: point.speed_kph || 0,
      }));

    // Período (usar routes directamente sin ordenar, igual que UI)
    const period = {
      firstRecord: routes.length > 0
        ? format(new Date(routes[0].recv_time), 'dd/MM/yyyy HH:mm:ss', { locale: es })
        : 'Sin datos',
      lastRecord: routes.length > 0
        ? format(new Date(routes[routes.length - 1].recv_time), 'dd/MM/yyyy HH:mm:ss', { locale: es })
        : 'Sin datos',
    };

    // Ranking de conductores
    const clientDrivers = drivers.filter(d => d.client_id === equipment?.client_id);
    const currentDriver = equipment?.driver_id
      ? drivers.find(d => d.id === equipment.driver_id)
      : null;

    const ranking = {
      currentDriver: currentDriver ? {
        name: currentDriver.name,
        phone: currentDriver.phone,
        licenseNumber: currentDriver.license_number,
      } : null,
      otherDrivers: clientDrivers
        .filter(d => d.id !== equipment?.driver_id)
        .slice(0, 4)
        .map(d => ({
          name: d.name,
          status: d.status === 'available' ? 'Disponible' :
                  d.status === 'on_trip' ? 'En viaje' :
                  d.status === 'inactive' ? 'Inactivo' : d.status,
        })),
    };

    return {
      summary: {
        totalRutas,
        kmRecorridos,
        velMaxima,
        velPromedio,
        horasMarcha,
        horasRalenti,
        horasTotales,
        puntosRegistrados,
      },
      rutas: rutas.map(r => ({
        ruta: r.ruta,
        inicio: format(new Date(r.inicio), 'dd/MM/yyyy HH:mm'),
        fin: format(new Date(r.fin), 'dd/MM/yyyy HH:mm'),
        km_recorridos: r.km_recorridos,
        velocidad_maxima: r.velocidad_maxima,
        velocidad_promedio: r.velocidad_promedio,
        tiempo_marcha_horas: r.tiempo_marcha_horas,
        tiempo_ralenti_horas: r.tiempo_ralenti_horas,
        tiempo_total_horas: r.tiempo_total_horas,
        puntos: r.puntos,
      })),
      speedTimeline,
      speedDistribution,
      movementState,
      analysis,
      period,
      ranking,
    };
  };

  // Preparar opciones para generación de PDF
  const getPDFOptions = (): PDFGeneratorOptions => {
    const asset = getAssetInfo(equipment?.asset_id);
    const sim = getSimInfo(equipment?.sim_id);

    return {
      equipment: {
        brand: equipment?.brand || '',
        model: equipment?.model || '',
        imei: equipment?.imei || '',
        serial: equipment?.serial || '',
        status: equipment?.status || 'inactive',
        clientName: getClientName(equipment?.client_id),
        assetName: asset?.name || 'Sin activo asignado',
        simInfo: sim ? `${sim.phone_number} · ${sim.carrier}` : 'Sin SIM',
        lastSignal: equipment?.last_seen
          ? formatRelativeTime(Math.floor((Date.now() - new Date(equipment.last_seen).getTime()) / 60000))
          : 'Sin señal',
      },
      dateRange: `${startDate} ${startTime} - ${endDate} ${endTime}`,
      routeStats: routes.length > 0 ? routeStats : undefined,
      statusSegments: statusSegments.length > 0 ? statusSegments : undefined,
      mapElement: mapRef.current,
      timelineElement: timelineRef.current,
      statsElement: statsRef.current,
    };
  };

  // Funciones de descarga de PDF
  const handleDownloadAll = async () => {
    const options = getPDFOptions();
    await generateFullPDF(options);
  };

  const handleDownloadHistory = async () => {
    const options = getPDFOptions();
    await generateHistoryPDF(options);
  };

  const handleDownloadStats = async () => {
    const options = getPDFOptions();

    // Construir datos para generación nativa del PDF
    const statsData = buildStatsPDFData();
    if (statsData) {
      options.statsData = statsData;
    }

    // Convertir Set a array de secciones seleccionadas
    const selectedSections = selectedStatsSections.size > 0
      ? Array.from(selectedStatsSections)
      : undefined; // undefined = todas las secciones

    options.selectedSections = selectedSections;

    // Pasar el tema actual para el PDF
    options.darkMode = isDark;

    await generateStatsPDF(options);
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
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {equipment.brand} {equipment.model}
                </h1>
              </div>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                IMEI: {equipment.imei} • S/N: {equipment.serial}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleDownloadAll} variant="outline" size="sm">
              <Download className="w-4 h-4" />
              Descargar PDF
            </Button>
            <Badge
              className={`${EQUIPMENT_STATUS_CONFIG[equipment.status]?.bgColor} ${EQUIPMENT_STATUS_CONFIG[equipment.status]?.textColor}`}
            >
              {EQUIPMENT_STATUS_CONFIG[equipment.status]?.label || equipment.status}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Info Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cliente */}
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cliente</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                {getClientName(equipment.client_id)}
              </p>
            </div>
          </div>
        </Card>

        {/* Activo */}
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Box className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Activo Asignado</p>
              {asset ? (
                <div className="mt-1">
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{asset.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{getAssetTypeLabel(asset.type)}</p>
                </div>
              ) : (
                <p className="text-lg font-semibold text-gray-400 dark:text-gray-500 mt-1">Sin activo</p>
              )}
            </div>
          </div>
        </Card>

        {/* SIM */}
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Smartphone className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">SIM Asignada</p>
              {sim ? (
                <div className="mt-1">
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{sim.phone_number}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{sim.carrier}</p>
                </div>
              ) : (
                <p className="text-lg font-semibold text-gray-400 dark:text-gray-500 mt-1">Sin SIM</p>
              )}
            </div>
          </div>
        </Card>

        {/* Última señal */}
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Activity className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Última Señal</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                {equipment.last_seen
                  ? formatRelativeTime(Math.floor((Date.now() - new Date(equipment.last_seen).getTime()) / 60000))
                  : 'Nunca'}
              </p>
              {equipment.speed !== undefined && equipment.speed !== null && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formatSpeed(equipment.speed)}
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs de navegación */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('historial')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'historial'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
          }`}
        >
          <Route className="w-4 h-4" />
          Historial de Recorrido
        </button>
        <button
          onClick={() => setActiveTab('estadisticas')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'estadisticas'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Estadísticas
        </button>
      </div>

      {/* Tab: Historial de Recorrido */}
      {activeTab === 'historial' && (
      <Card>
        <CardHeader className="p-6 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Historial de Recorrido
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadHistory}
              >
                <Download className="w-4 h-4" />
                PDF Historial
              </Button>
              <Button
                variant={showGeofences ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setShowGeofences(!showGeofences)}
              >
                <MapPin className="w-4 h-4" />
                {showGeofences ? 'Ocultar geocercas' : 'Mostrar geocercas'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Filtros de Fecha y Hora */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filtrar por fecha y hora</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Fecha Inicio</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  max={todayStr}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Hora Inicio</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Fecha Fin</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  max={todayStr}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Hora Fin</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Estadísticas del recorrido */}
            {routes.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{routeStats.totalPoints}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Puntos registrados</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{routeStats.maxSpeed.toFixed(0)} km/h</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Velocidad máxima</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{routeStats.avgSpeed.toFixed(0)} km/h</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Velocidad promedio</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-600 dark:text-gray-300">{routeStats.stoppedPoints}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Puntos detenido</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Selector de intervalo de ruta */}
          {routeStatsData?.rutas && routeStatsData.rutas.length > 0 && (
            <div className="mb-4 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Route className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Ruta:</span>
              </div>
              <select
                value={selectedRouteInterval ?? ''}
                onChange={(e) => setSelectedRouteInterval(e.target.value === '' ? null : Number(e.target.value))}
                className="flex-1 max-w-md px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">
                  Todas las rutas ({routeStatsData.rutas.length} rutas, {routes.length} puntos)
                </option>
                {routeStatsData.rutas.map((ruta) => (
                  <option key={ruta.ruta} value={ruta.ruta}>
                    Ruta {ruta.ruta}: {format(new Date(ruta.inicio), 'HH:mm', { locale: es })} - {format(new Date(ruta.fin), 'HH:mm', { locale: es })} | {ruta.km_recorridos.toFixed(1)} km | {ruta.puntos} pts
                  </option>
                ))}
              </select>
              {selectedRouteInterval !== null && (() => {
                const selectedRuta = routeStatsData.rutas.find(r => r.ruta === selectedRouteInterval);
                if (!selectedRuta) return null;
                return (
                  <div className="hidden sm:flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {selectedRuta.tiempo_total_horas.toFixed(1)}h
                    </span>
                    <span className="flex items-center gap-1">
                      <Gauge className="w-3.5 h-3.5" />
                      {selectedRuta.velocidad_promedio.toFixed(0)} km/h prom
                    </span>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Mapa y Timeline */}
          <div className="flex gap-4 h-[500px]">
            {/* Mapa - 2/3 del ancho */}
            <div ref={mapRef} className="w-2/3 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
              {isLoadingRoutes ? (
                <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-800">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando historial...</p>
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
                    url={isDark ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
                  />

                  {/* Controlador para centrar el mapa al cambiar intervalo */}
                  <MapController center={mapCenter} />

                  {/* Polilínea de la ruta */}
                  <Polyline
                    positions={routeCoordinates}
                    color="#3b82f6"
                    weight={3}
                    opacity={0.7}
                  />

                  {/* Puntos de la ruta (filtrados por intervalo) */}
                  {filteredRoutes.map((point, index) => {
                    if (!point.lat || !point.lon) return null;

                    const color = getPointColor(point.speed_kph);
                    const isFirst = index === 0;
                    const isLast = index === filteredRoutes.length - 1;

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
                <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-800">
                  <div className="text-center">
                    <MapPin className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">No se encontraron puntos de ruta</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">para el período seleccionado</p>
                  </div>
                </div>
              )}
            </div>

            {/* Timeline de estados - 1/3 del ancho */}
            <div ref={timelineRef} className="w-1/3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden flex flex-col">
              <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
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
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-600"></div>

                    {/* Segmentos del timeline */}
                    <div className="space-y-3">
                      {statusSegments.map((segment, index) => {
                        const config = STATUS_CONFIG[segment.status] || STATUS_CONFIG.stopped;
                        const Icon = config.icon;

                        return (
                          <div key={index} className="relative pl-10">
                            {/* Icono del estado */}
                            <div className={`absolute left-0 w-8 h-8 rounded-full ${config.bgColor} flex items-center justify-center border-2 border-white dark:border-gray-700 shadow-sm`}>
                              <Icon className={`w-4 h-4 ${config.color}`} />
                            </div>

                            {/* Contenido del segmento */}
                            <div className={`p-2 rounded-lg ${config.bgColor} bg-opacity-30 dark:bg-opacity-20 border border-gray-100 dark:border-gray-700`}>
                              <div className={`font-medium text-sm ${config.color}`}>
                                {config.label}
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                                {format(new Date(segment.startTime), 'HH:mm:ss', { locale: es })}
                                {segment.duration > 0 && (
                                  <span className="text-gray-400 dark:text-gray-500"> - {format(new Date(segment.endTime), 'HH:mm:ss', { locale: es })}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                                <span className="font-medium">{formatDuration(segment.duration)}</span>
                                <span className="text-gray-400 dark:text-gray-500">•</span>
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
                    <div className="text-center text-gray-400 dark:text-gray-500">
                      <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Sin datos de estado</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Leyenda de estados */}
              {statusSegments.length > 0 && (
                <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(STATUS_CONFIG).map(([key, config]) => {
                      const Icon = config.icon;
                      return (
                        <div key={key} className="flex items-center gap-1.5">
                          <Icon className={`w-3 h-3 ${config.color}`} />
                          <span className="text-gray-600 dark:text-gray-400 truncate">{config.label}</span>
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
            <span className="text-gray-500 dark:text-gray-400">Leyenda:</span>
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
      )}

      {/* Tab: Estadísticas */}
      {activeTab === 'estadisticas' && (
      <Card>
        <CardHeader className="p-6 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Estadísticas del Equipo
            </CardTitle>
            <div className="flex items-center gap-3">
              {selectedStatsSections.size > 0 && (
                <>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedStatsSections.size} seleccionado{selectedStatsSections.size > 1 ? 's' : ''}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedStatsSections(new Set())}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <X className="w-4 h-4" />
                    Limpiar
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadStats}
              >
                <Download className="w-4 h-4" />
                {selectedStatsSections.size > 0
                  ? `PDF (${selectedStatsSections.size})`
                  : 'PDF Completo'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div ref={statsRef}>
          {/* Filtros de Fecha para estadísticas */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Período de análisis</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Fecha Inicio</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  max={todayStr}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Hora Inicio</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Fecha Fin</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  max={todayStr}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Hora Fin</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {isLoadingRouteStats ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando estadísticas...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Estadísticas principales desde el backend */}
              <div className="relative">
                <button
                  onClick={() => toggleStatsSection('resumen')}
                  className="absolute -top-1 -left-1 z-10 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title={selectedStatsSections.has('resumen') ? 'Quitar del PDF' : 'Incluir en PDF'}
                >
                  {selectedStatsSections.has('resumen') ? (
                    <CheckSquare className="w-5 h-5 text-primary" />
                  ) : (
                    <Square className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                  )}
                </button>
                <div ref={statsSummaryRef} className={`space-y-4 p-4 bg-white dark:bg-gray-800 rounded-lg border-2 transition-colors ${selectedStatsSections.has('resumen') ? 'border-primary' : 'border-transparent'}`}>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 text-center">
                      <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{routeStatsData?.total_rutas || 0}</p>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">Total de rutas</p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-4 text-center">
                      <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                        {routeStatsData?.rutas?.reduce((sum, r) => sum + r.km_recorridos, 0).toFixed(1) || '0'}
                      </p>
                      <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">Km recorridos</p>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/30 rounded-lg p-4 text-center">
                      <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                        {routeStatsData?.rutas?.reduce((max, r) => Math.max(max, r.velocidad_maxima), 0).toFixed(0) || '0'}
                      </p>
                      <p className="text-sm text-red-700 dark:text-red-300 mt-1">Vel. máxima (km/h)</p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-4 text-center">
                      <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                        {routeStatsData?.rutas && routeStatsData.rutas.length > 0
                          ? (routeStatsData.rutas.reduce((sum, r) => sum + r.velocidad_promedio, 0) / routeStatsData.rutas.length).toFixed(0)
                          : '0'}
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-300 mt-1">Vel. promedio (km/h)</p>
                    </div>
                  </div>

                  {/* Segunda fila de estadísticas */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-lg p-4 text-center">
                      <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                        {routeStatsData?.rutas?.reduce((sum, r) => sum + r.tiempo_marcha_horas, 0).toFixed(1) || '0'}
                      </p>
                      <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">Horas en marcha</p>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-900/30 rounded-lg p-4 text-center">
                      <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                        {routeStatsData?.rutas?.reduce((sum, r) => sum + r.tiempo_ralenti_horas, 0).toFixed(1) || '0'}
                      </p>
                      <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">Horas en ralentí</p>
                    </div>
                    <div className="bg-cyan-50 dark:bg-cyan-900/30 rounded-lg p-4 text-center">
                      <p className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">
                        {routeStatsData?.rutas?.reduce((sum, r) => sum + r.tiempo_total_horas, 0).toFixed(1) || '0'}
                      </p>
                      <p className="text-sm text-cyan-700 dark:text-cyan-300 mt-1">Horas totales</p>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 text-center">
                      <p className="text-3xl font-bold text-gray-600 dark:text-gray-300">
                        {routeStatsData?.rutas?.reduce((sum, r) => sum + r.puntos, 0) || 0}
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-400 mt-1">Puntos registrados</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabla de rutas con paginación */}
              {routeStatsData?.rutas && routeStatsData.rutas.length > 0 && (() => {
                const totalPages = Math.ceil(routeStatsData.rutas.length / routesPerPage);
                const startIndex = (routesPage - 1) * routesPerPage;
                const paginatedRoutes = routeStatsData.rutas.slice(startIndex, startIndex + routesPerPage);

                return (
                  <>
                    {/* Tabla oculta para captura de imagen (todas las rutas) */}
                    <div className="absolute -left-[9999px]" aria-hidden="true">
                      <div ref={routesTableFullRef} className="bg-white dark:bg-gray-800 rounded-lg p-4">
                        <div className="mb-4 flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <Route className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            Detalle de Rutas
                          </h3>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {routeStatsData.rutas.length} rutas
                          </span>
                        </div>
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">#</th>
                              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Inicio</th>
                              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Fin</th>
                              <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-300">Km</th>
                              <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-300">Vel. Prom.</th>
                              <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-300">Vel. Máx.</th>
                              <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-300">Marcha</th>
                              <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-300">Ralentí</th>
                              <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-300">Puntos</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {routeStatsData.rutas.map((ruta) => (
                              <tr key={ruta.ruta}>
                                <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">{ruta.ruta}</td>
                                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                  {format(new Date(ruta.inicio), 'dd/MM HH:mm', { locale: es })}
                                </td>
                                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                  {format(new Date(ruta.fin), 'dd/MM HH:mm', { locale: es })}
                                </td>
                                <td className="px-4 py-3 text-right text-gray-900 dark:text-white">{ruta.km_recorridos.toFixed(2)}</td>
                                <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">{ruta.velocidad_promedio.toFixed(1)}</td>
                                <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">{ruta.velocidad_maxima.toFixed(1)}</td>
                                <td className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400">{ruta.tiempo_marcha_horas.toFixed(2)}h</td>
                                <td className="px-4 py-3 text-right text-amber-600 dark:text-amber-400">{ruta.tiempo_ralenti_horas.toFixed(2)}h</td>
                                <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">{ruta.puntos}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Tabla visible con paginación */}
                    <div className="relative">
                      <button
                        onClick={() => toggleStatsSection('rutas')}
                        className="absolute -top-1 -left-1 z-10 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        title={selectedStatsSections.has('rutas') ? 'Quitar del PDF' : 'Incluir en PDF'}
                      >
                        {selectedStatsSections.has('rutas') ? (
                          <CheckSquare className="w-5 h-5 text-primary" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                        )}
                      </button>
                      <div className={`bg-white dark:bg-gray-800 rounded-lg overflow-hidden border-2 transition-colors ${selectedStatsSections.has('rutas') ? 'border-primary' : 'border-gray-200 dark:border-gray-700'}`}>
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <Route className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            Detalle de Rutas
                          </h3>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {routeStatsData.rutas.length} rutas
                          </span>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                              <tr>
                                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">#</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Inicio</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Fin</th>
                                <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-300">Km</th>
                                <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-300">Vel. Prom.</th>
                                <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-300">Vel. Máx.</th>
                                <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-300">Marcha</th>
                                <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-300">Ralentí</th>
                                <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-300">Puntos</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                              {paginatedRoutes.map((ruta) => (
                                <tr key={ruta.ruta} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                  <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">{ruta.ruta}</td>
                                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                    {format(new Date(ruta.inicio), 'dd/MM HH:mm', { locale: es })}
                                  </td>
                                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                    {format(new Date(ruta.fin), 'dd/MM HH:mm', { locale: es })}
                                  </td>
                                  <td className="px-4 py-3 text-right text-gray-900 dark:text-white">{ruta.km_recorridos.toFixed(2)}</td>
                                  <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">{ruta.velocidad_promedio.toFixed(1)}</td>
                                  <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">{ruta.velocidad_maxima.toFixed(1)}</td>
                                  <td className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400">{ruta.tiempo_marcha_horas.toFixed(2)}h</td>
                                  <td className="px-4 py-3 text-right text-amber-600 dark:text-amber-400">{ruta.tiempo_ralenti_horas.toFixed(2)}h</td>
                                  <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">{ruta.puntos}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {/* Paginación */}
                        {totalPages > 1 && (
                          <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              Mostrando {startIndex + 1}-{Math.min(startIndex + routesPerPage, routeStatsData.rutas.length)} de {routeStatsData.rutas.length}
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setRoutesPage(p => Math.max(1, p - 1))}
                                disabled={routesPage === 1}
                                className="px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Anterior
                              </button>
                              <span className="text-sm text-gray-600 dark:text-gray-300">
                                {routesPage} / {totalPages}
                              </span>
                              <button
                                onClick={() => setRoutesPage(p => Math.min(totalPages, p + 1))}
                                disabled={routesPage === totalPages}
                                className="px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Siguiente
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                );
              })()}

              {/* Gráfico de Velocidad en el Tiempo */}
              <div ref={statsSpeedChartRef} className={`relative bg-white dark:bg-gray-800 rounded-lg p-6 border-2 transition-colors ${selectedStatsSections.has('velocidad') ? 'border-primary' : 'border-gray-200 dark:border-gray-700'}`}>
                <button
                  onClick={() => toggleStatsSection('velocidad')}
                  className="absolute top-2 left-2 z-10 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title={selectedStatsSections.has('velocidad') ? 'Quitar del PDF' : 'Incluir en PDF'}
                >
                  {selectedStatsSections.has('velocidad') ? (
                    <CheckSquare className="w-5 h-5 text-primary" />
                  ) : (
                    <Square className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                  )}
                </button>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2 ml-8">
                  <Activity className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  Velocidad en el Tiempo
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={routes.filter((_, i) => i % Math.max(1, Math.floor(routes.length / 100)) === 0).map((point) => ({
                            time: format(new Date(point.recv_time), 'HH:mm', { locale: es }),
                            velocidad: point.speed_kph || 0,
                          }))
                      }
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorSpeed" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="time" tick={{ fontSize: 12 }} stroke="#6b7280" />
                      <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" unit=" km/h" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                        formatter={(value: number) => [`${value.toFixed(0)} km/h`, 'Velocidad']}
                      />
                      <Area type="monotone" dataKey="velocidad" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSpeed)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Gráficos de Distribución */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gráfico de Barras - Distribución de Velocidad */}
                <div ref={statsDistributionRef} className={`relative bg-white dark:bg-gray-800 rounded-lg p-6 border-2 transition-colors ${selectedStatsSections.has('distribucion') ? 'border-primary' : 'border-gray-200 dark:border-gray-700'}`}>
                  <button
                    onClick={() => toggleStatsSection('distribucion')}
                    className="absolute top-2 left-2 z-10 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title={selectedStatsSections.has('distribucion') ? 'Quitar del PDF' : 'Incluir en PDF'}
                  >
                    {selectedStatsSections.has('distribucion') ? (
                      <CheckSquare className="w-5 h-5 text-primary" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    )}
                  </button>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 ml-8">Distribución de Velocidad</h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                              { name: 'Detenido', value: routes.filter(p => !p.speed_kph || p.speed_kph === 0).length, fill: '#6b7280' },
                              { name: '1-30', value: routes.filter(p => p.speed_kph && p.speed_kph > 0 && p.speed_kph <= 30).length, fill: '#0ea5e9' },
                              { name: '31-60', value: routes.filter(p => p.speed_kph && p.speed_kph > 30 && p.speed_kph <= 60).length, fill: '#10b981' },
                              { name: '61-80', value: routes.filter(p => p.speed_kph && p.speed_kph > 60 && p.speed_kph <= 80).length, fill: '#f59e0b' },
                              { name: '>80', value: routes.filter(p => p.speed_kph && p.speed_kph > 80).length, fill: '#ef4444' },
                            ]
                        }
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#6b7280" />
                        <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                          formatter={(value: number) => [`${value} puntos`, 'Cantidad']}
                        />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {[
                            { name: 'Detenido', fill: '#6b7280' },
                            { name: '1-30', fill: '#0ea5e9' },
                            { name: '31-60', fill: '#10b981' },
                            { name: '61-80', fill: '#f59e0b' },
                            { name: '>80', fill: '#ef4444' },
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">Velocidad en km/h</p>
                </div>

                {/* Gráfico de Pie - Estado de Movimiento */}
                <div ref={statsMovementRef} className={`relative bg-white dark:bg-gray-800 rounded-lg p-6 border-2 transition-colors ${selectedStatsSections.has('movimiento') ? 'border-primary' : 'border-gray-200 dark:border-gray-700'}`}>
                  <button
                    onClick={() => toggleStatsSection('movimiento')}
                    className="absolute top-2 left-2 z-10 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title={selectedStatsSections.has('movimiento') ? 'Quitar del PDF' : 'Incluir en PDF'}
                  >
                    {selectedStatsSections.has('movimiento') ? (
                      <CheckSquare className="w-5 h-5 text-primary" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    )}
                  </button>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 ml-8">Estado de Movimiento</h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                                { name: 'En movimiento', value: routes.filter(p => p.speed_kph && p.speed_kph > 0).length, fill: '#10b981' },
                                { name: 'Detenido', value: routes.filter(p => !p.speed_kph || p.speed_kph === 0).length, fill: '#6b7280' },
                              ]
                          }
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }: any) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          <Cell fill="#10b981" />
                          <Cell fill="#6b7280" />
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                          formatter={(value: number) => [`${value} puntos`, 'Cantidad']}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Análisis de velocidad detallado */}
              <div ref={statsAnalysisRef} className={`relative bg-white dark:bg-gray-800 rounded-lg p-6 border-2 transition-colors ${selectedStatsSections.has('analisis') ? 'border-primary' : 'border-gray-200 dark:border-gray-700'}`}>
                <button
                  onClick={() => toggleStatsSection('analisis')}
                  className="absolute top-2 left-2 z-10 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title={selectedStatsSections.has('analisis') ? 'Quitar del PDF' : 'Incluir en PDF'}
                >
                  {selectedStatsSections.has('analisis') ? (
                    <CheckSquare className="w-5 h-5 text-primary" />
                  ) : (
                    <Square className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                  )}
                </button>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2 ml-8">
                  <Gauge className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  Análisis Detallado
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Puntos en movimiento</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {routes.filter(p => p.speed_kph && p.speed_kph > 0).length}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {routes.length > 0
                        ? ((routes.filter(p => p.speed_kph && p.speed_kph > 0).length / routes.length) * 100).toFixed(1)
                        : '0'}%
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Exceso de velocidad</p>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {routes.filter(p => p.speed_kph && p.speed_kph > 60).length}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {routes.length > 0
                        ? ((routes.filter(p => p.speed_kph && p.speed_kph > 60).length / routes.length) * 100).toFixed(1)
                        : '0'}%
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Alta velocidad (&gt;80)</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {routes.filter(p => p.speed_kph && p.speed_kph > 80).length}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {routes.length > 0
                        ? ((routes.filter(p => p.speed_kph && p.speed_kph > 80).length / routes.length) * 100).toFixed(1)
                        : '0'}%
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Tiempo detenido</p>
                    <p className="text-2xl font-bold text-gray-600 dark:text-gray-300">
                      {routeStats.stoppedPoints}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {routes.length > 0
                        ? ((routeStats.stoppedPoints / routes.length) * 100).toFixed(1)
                        : '0'}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Información del período */}
              <div ref={statsPeriodRef} className={`relative bg-white dark:bg-gray-800 rounded-lg p-6 border-2 transition-colors ${selectedStatsSections.has('periodo') ? 'border-primary' : 'border-gray-200 dark:border-gray-700'}`}>
                <button
                  onClick={() => toggleStatsSection('periodo')}
                  className="absolute top-2 left-2 z-10 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title={selectedStatsSections.has('periodo') ? 'Quitar del PDF' : 'Incluir en PDF'}
                >
                  {selectedStatsSections.has('periodo') ? (
                    <CheckSquare className="w-5 h-5 text-primary" />
                  ) : (
                    <Square className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                  )}
                </button>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2 ml-8">
                  <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  Información del Período
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Primer registro</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {routes.length > 0
                        ? format(new Date(routes[0].recv_time), "dd/MM/yyyy HH:mm:ss", { locale: es })
                        : 'Sin datos'}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Último registro</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {routes.length > 0
                        ? format(new Date(routes[routes.length - 1].recv_time), "dd/MM/yyyy HH:mm:ss", { locale: es })
                        : 'Sin datos'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Ranking de Conductores */}
              <div ref={statsRankingRef} className={`relative bg-white dark:bg-gray-800 rounded-lg p-6 border-2 transition-colors ${selectedStatsSections.has('ranking') ? 'border-primary' : 'border-gray-200 dark:border-gray-700'}`}>
                <button
                  onClick={() => toggleStatsSection('ranking')}
                  className="absolute top-2 left-2 z-10 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title={selectedStatsSections.has('ranking') ? 'Quitar del PDF' : 'Incluir en PDF'}
                >
                  {selectedStatsSections.has('ranking') ? (
                    <CheckSquare className="w-5 h-5 text-primary" />
                  ) : (
                    <Square className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                  )}
                </button>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2 ml-8">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  Ranking de Conductores
                </h3>
                {(() => {
                  // Filtrar conductores del mismo cliente
                  const clientDrivers = drivers.filter(d => d.client_id === equipment?.client_id);
                  const currentDriver = equipment?.driver_id
                    ? drivers.find(d => d.id === equipment.driver_id)
                    : null;

                  if (clientDrivers.length === 0) {
                    return (
                      <div className="text-center py-8">
                        <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-gray-400">No hay conductores registrados para este cliente</p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-3">
                      {/* Conductor actual asignado */}
                      {currentDriver && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-full">
                              <User className="w-5 h-5 text-green-600" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-green-800">{currentDriver.name}</p>
                                <Badge className="bg-green-600 text-white text-xs">Asignado</Badge>
                              </div>
                              <div className="flex items-center gap-4 mt-1 text-sm text-green-700">
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {currentDriver.phone}
                                </span>
                                <span>Lic: {currentDriver.license_number}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Otros conductores disponibles */}
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-4">
                        {currentDriver ? 'Otros conductores disponibles:' : 'Conductores disponibles:'}
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {clientDrivers
                          .filter(d => d.id !== equipment?.driver_id)
                          .slice(0, 4)
                          .map((driver, index) => (
                            <div
                              key={driver.id}
                              className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center gap-3"
                            >
                              <div className={`p-2 rounded-full ${
                                index === 0 ? 'bg-yellow-100' :
                                index === 1 ? 'bg-gray-200' :
                                index === 2 ? 'bg-orange-100' : 'bg-gray-100'
                              }`}>
                                {index < 3 ? (
                                  <Award className={`w-4 h-4 ${
                                    index === 0 ? 'text-yellow-600' :
                                    index === 1 ? 'text-gray-500' : 'text-orange-600'
                                  }`} />
                                ) : (
                                  <User className="w-4 h-4 text-gray-500" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 dark:text-white truncate">{driver.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {driver.status === 'available' ? 'Disponible' :
                                   driver.status === 'on_trip' ? 'En viaje' : 'Inactivo'}
                                </p>
                              </div>
                              <Badge className={`text-xs ${
                                driver.status === 'available' ? 'bg-green-100 text-green-700' :
                                driver.status === 'on_trip' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {driver.status === 'available' ? 'Libre' :
                                 driver.status === 'on_trip' ? 'Ocupado' : 'Inactivo'}
                              </Badge>
                            </div>
                          ))}
                      </div>
                      {clientDrivers.filter(d => d.id !== equipment?.driver_id).length > 4 && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-2">
                          +{clientDrivers.filter(d => d.id !== equipment?.driver_id).length - 4} conductores más
                        </p>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Top Alertas del Equipo */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-red-500" />
                  Top Alertas del Equipo
                </h3>
                {(() => {
                  if (equipmentAlerts.length === 0) {
                    return (
                      <div className="text-center py-8">
                        <AlertTriangle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-gray-400">No hay alertas registradas para este equipo</p>
                      </div>
                    );
                  }

                  // Agrupar alertas por geocerca
                  const alertsByGeofence = equipmentAlerts.reduce((acc, alert) => {
                    const geofenceId = alert.geofence_id || 'sin_geocerca';
                    if (!acc[geofenceId]) {
                      acc[geofenceId] = { enters: 0, exits: 0, total: 0, name: '' };
                    }
                    if (alert.type === 'geofence_enter') {
                      acc[geofenceId].enters++;
                    } else {
                      acc[geofenceId].exits++;
                    }
                    acc[geofenceId].total++;
                    // Obtener nombre de geocerca
                    const geofence = geofences.find(g => g.id === geofenceId);
                    acc[geofenceId].name = geofence?.name || 'Geocerca desconocida';
                    return acc;
                  }, {} as Record<string, { enters: number; exits: number; total: number; name: string }>);

                  // Ordenar por total de alertas
                  const sortedGeofences = Object.entries(alertsByGeofence)
                    .sort(([, a], [, b]) => b.total - a.total)
                    .slice(0, 5);

                  const totalEnters = equipmentAlerts.filter(a => a.type === 'geofence_enter').length;
                  const totalExits = equipmentAlerts.filter(a => a.type === 'geofence_exit').length;

                  return (
                    <div className="space-y-4">
                      {/* Resumen general */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">{equipmentAlerts.length}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Total alertas</p>
                        </div>
                        <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-lg text-center">
                          <div className="flex items-center justify-center gap-1">
                            <LogIn className="w-4 h-4 text-green-600" />
                            <p className="text-2xl font-bold text-green-600">{totalEnters}</p>
                          </div>
                          <p className="text-xs text-green-700 dark:text-green-400">Entradas</p>
                        </div>
                        <div className="p-3 bg-red-50 dark:bg-red-900/30 rounded-lg text-center">
                          <div className="flex items-center justify-center gap-1">
                            <LogOut className="w-4 h-4 text-red-600" />
                            <p className="text-2xl font-bold text-red-600">{totalExits}</p>
                          </div>
                          <p className="text-xs text-red-700 dark:text-red-400">Salidas</p>
                        </div>
                      </div>

                      {/* Top geocercas con más alertas */}
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-3">Geocercas con más actividad:</p>
                        <div className="space-y-2">
                          {sortedGeofences.map(([geofenceId, data], index) => (
                            <div
                              key={geofenceId}
                              className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                            >
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                index === 1 ? 'bg-gray-200 text-gray-600' :
                                index === 2 ? 'bg-orange-100 text-orange-700' :
                                'bg-gray-100 text-gray-500'
                              }`}>
                                {index + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 dark:text-white truncate">{data.name}</p>
                                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                                  <span className="flex items-center gap-1">
                                    <LogIn className="w-3 h-3 text-green-500" />
                                    {data.enters} entradas
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <LogOut className="w-3 h-3 text-red-500" />
                                    {data.exits} salidas
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-gray-900 dark:text-white">{data.total}</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500">alertas</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Últimas alertas */}
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-3">Últimas alertas:</p>
                        <div className="space-y-2">
                          {equipmentAlerts.slice(0, 3).map((alert) => {
                            const geofence = geofences.find(g => g.id === alert.geofence_id);
                            return (
                              <div
                                key={alert.id}
                                className="flex items-center gap-3 p-2 border border-gray-100 dark:border-gray-700 rounded-lg"
                              >
                                {alert.type === 'geofence_enter' ? (
                                  <div className="p-1.5 bg-green-100 rounded-full">
                                    <LogIn className="w-3 h-3 text-green-600" />
                                  </div>
                                ) : (
                                  <div className="p-1.5 bg-red-100 rounded-full">
                                    <LogOut className="w-3 h-3 text-red-600" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-gray-900 dark:text-white truncate">
                                    {alert.type === 'geofence_enter' ? 'Entrada a ' : 'Salida de '}
                                    {geofence?.name || 'geocerca'}
                                  </p>
                                  <p className="text-xs text-gray-400 dark:text-gray-500">
                                    {format(new Date(alert.created_at), "dd/MM/yyyy HH:mm", { locale: es })}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {routes.length === 0 && !routeStatsData?.rutas?.length && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-400 text-center">
                    No hay datos para el período seleccionado. Selecciona un rango de fechas diferente.
                  </p>
                </div>
              )}
            </div>
          )}
          </div>
        </CardContent>
      </Card>
      )}

      {/* Sección: Información detallada del equipo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Información del equipo */}
        <Card>
          <CardHeader className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <CardTitle className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              Información del Equipo
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400">IMEI</span>
                <span className="font-mono font-semibold text-gray-900 dark:text-white">{equipment.imei}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400">Número de Serie</span>
                <span className="font-mono font-semibold text-gray-900 dark:text-white">{equipment.serial}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400">Marca</span>
                <span className="font-semibold text-gray-900 dark:text-white">{equipment.brand}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400">Modelo</span>
                <span className="font-semibold text-gray-900 dark:text-white">{equipment.model}</span>
              </div>
              {equipment.firmware_version && (
                <div className="flex justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-500 dark:text-gray-400">Firmware</span>
                  <span className="font-mono text-gray-900 dark:text-white">{equipment.firmware_version}</span>
                </div>
              )}
              <div className="flex justify-between py-3">
                <span className="text-gray-500 dark:text-gray-400">Estado</span>
                <Badge className={`${EQUIPMENT_STATUS_CONFIG[equipment.status]?.bgColor} ${EQUIPMENT_STATUS_CONFIG[equipment.status]?.textColor}`}>
                  {EQUIPMENT_STATUS_CONFIG[equipment.status]?.label}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ubicación actual */}
        <Card>
          <CardHeader className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              Ubicación Actual
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400">Latitud</span>
                <span className="font-mono font-semibold text-gray-900 dark:text-white">
                  {equipment.lat != null ? Number(equipment.lat).toFixed(6) : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400">Longitud</span>
                <span className="font-mono font-semibold text-gray-900 dark:text-white">
                  {equipment.lng != null ? Number(equipment.lng).toFixed(6) : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400">Velocidad</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {equipment.speed != null
                    ? formatSpeed(Number(equipment.speed))
                    : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400">Dirección</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {equipment.bearing != null
                    ? `${Number(equipment.bearing).toFixed(0)}°`
                    : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-gray-500 dark:text-gray-400">Última actualización</span>
                <span className="text-gray-900 dark:text-white">
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
