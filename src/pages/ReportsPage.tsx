import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { equipmentsApi } from '../features/equipments/api';
import { assetsApi } from '../features/assets/api';
import { geofencesApi } from '../features/geofences/api';
import { clientsApi } from '../features/clients/api';
import { usersApi } from '../features/users/api';
import { notificationsApi } from '../features/notifications/api';
import { QUERY_KEYS } from '../lib/constants';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Download, FileText, Radio, Package, MapPin, Users, Shield, Bell, Calendar, Clock, X } from 'lucide-react';
import { exportToCSV, exportToExcel, formatDate } from '../lib/utils';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../features/auth/hooks';

type ReportType = 'equipments' | 'assets' | 'geofences' | 'clients' | 'users' | 'notifications';

export function ReportsPage() {
  const toast = useToast();
  const { user } = useAuth();
  const [selectedReport, setSelectedReport] = useState<ReportType>('equipments');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  // Si el usuario no es superuser, usar su client_id automáticamente
  const [selectedClientId, setSelectedClientId] = useState(user?.role !== 'superuser' && user?.client_id ? user.client_id : '');

  // Fetch all data
  const { data: equipments = [] } = useQuery({
    queryKey: QUERY_KEYS.EQUIPMENTS,
    queryFn: equipmentsApi.getAll,
  });

  const { data: assets = [] } = useQuery({
    queryKey: QUERY_KEYS.ASSETS,
    queryFn: assetsApi.getAll,
  });

  const { data: geofences = [] } = useQuery({
    queryKey: QUERY_KEYS.GEOFENCES,
    queryFn: geofencesApi.getAll,
  });

  const { data: clients = [] } = useQuery({
    queryKey: QUERY_KEYS.CLIENTS,
    queryFn: clientsApi.getAll,
  });

  const { data: users = [] } = useQuery({
    queryKey: QUERY_KEYS.USERS,
    queryFn: usersApi.getAll,
  });

  const { data: notifications = [] } = useQuery({
    queryKey: QUERY_KEYS.NOTIFICATIONS,
    queryFn: notificationsApi.getAll,
  });

  // Filtrar datos por cliente si no es superuser
  const filteredEquipments = equipments.filter(eq =>
    user?.role === 'superuser' || !user?.client_id || eq.client_id === user.client_id
  );
  const filteredAssets = assets.filter(a =>
    user?.role === 'superuser' || !user?.client_id || a.client_id === user.client_id
  );
  const filteredGeofences = geofences.filter(g =>
    user?.role === 'superuser' || !user?.client_id || g.is_global || g.client_id === user.client_id
  );
  const filteredUsers = users.filter(u =>
    user?.role === 'superuser' || !user?.client_id || u.client_id === user.client_id
  );
  const filteredNotifications = notifications.filter(n => {
    if (user?.role === 'superuser') return true;
    if (!user?.client_id) return true;
    // Filtrar notificaciones de equipos del cliente
    const equipment = equipments.find(eq => eq.id === n.equipment_id);
    return equipment && equipment.client_id === user.client_id;
  });

  const allReportTypes = [
    {
      id: 'equipments' as ReportType,
      title: 'Equipos GPS',
      description: 'Reporte de todos los equipos GPS registrados',
      icon: Radio,
      color: 'bg-purple-100 text-purple-600',
      count: filteredEquipments.length,
    },
    {
      id: 'assets' as ReportType,
      title: 'Activos',
      description: 'Reporte de vehículos, personas, contenedores, etc.',
      icon: Package,
      color: 'bg-blue-100 text-blue-600',
      count: filteredAssets.length,
    },
    {
      id: 'geofences' as ReportType,
      title: 'Geocercas',
      description: 'Reporte de todas las geocercas configuradas',
      icon: MapPin,
      color: 'bg-green-100 text-green-600',
      count: filteredGeofences.length,
    },
    {
      id: 'clients' as ReportType,
      title: 'Clientes',
      description: 'Reporte de todos los clientes del sistema',
      icon: Users,
      color: 'bg-yellow-100 text-yellow-600',
      count: clients.length,
    },
    {
      id: 'users' as ReportType,
      title: 'Usuarios',
      description: 'Reporte de administradores y operadores',
      icon: Shield,
      color: 'bg-indigo-100 text-indigo-600',
      count: filteredUsers.length,
    },
    {
      id: 'notifications' as ReportType,
      title: 'Notificaciones',
      description: 'Historial de notificaciones del sistema',
      icon: Bell,
      color: 'bg-red-100 text-red-600',
      count: filteredNotifications.length,
    },
  ];

  // Ocultar reporte de clientes si no es superuser
  const reportTypes = user?.role === 'superuser'
    ? allReportTypes
    : allReportTypes.filter(r => r.id !== 'clients');

  // Filter data by date range and client
  const filterByDateAndClient = (data: any[], dateField: string) => {
    return data.filter((item) => {
      // Filtro de cliente
      const clientMatch = !selectedClientId || item.client_id === selectedClientId;

      // Filtro de fecha (opcional)
      if (!startDate || !endDate) {
        // Si no hay fechas, solo aplicar filtro de cliente
        return clientMatch;
      }

      const itemDate = new Date(item[dateField]);
      const start = new Date(startDate + (startTime ? `T${startTime}` : 'T00:00:00'));
      const end = new Date(endDate + (endTime ? `T${endTime}` : 'T23:59:59'));
      const dateMatch = itemDate >= start && itemDate <= end;

      return dateMatch && clientMatch;
    });
  };

  // Get filtered data for selected report
  const getFilteredData = () => {
    switch (selectedReport) {
      case 'equipments':
        return filterByDateAndClient(equipments, 'created_at');
      case 'assets':
        return filterByDateAndClient(assets, 'created_at');
      case 'geofences':
        return filterByDateAndClient(geofences, 'created_at');
      case 'clients':
        return filterByDateAndClient(clients, 'created_at');
      case 'users':
        return filterByDateAndClient(users, 'created_at');
      case 'notifications':
        return filterByDateAndClient(notifications, 'ts');
      default:
        return [];
    }
  };

  const handleExport = () => {
    // Si hay un cliente seleccionado, generar reporte completo de ese cliente
    if (selectedClientId) {
      handleComprehensiveClientReport();
      return;
    }

    // Si no hay cliente, exportar solo el tipo de reporte seleccionado
    const filteredData = getFilteredData();

    if (filteredData.length === 0) {
      toast.error('No hay datos para exportar con los filtros seleccionados');
      return;
    }

    let csvData: any[] = [];
    let filename = '';

    switch (selectedReport) {
      case 'equipments':
        csvData = filteredData.map((eq: any) => ({
          IMEI: eq.imei,
          Serial: eq.serial,
          Marca: eq.brand,
          Modelo: eq.model,
          Estado: eq.status === 'active' ? 'Activo' : 'Inactivo',
          Cliente: clients.find(c => c.id === eq.client_id)?.company_name || 'Sin asignar',
          Activo: assets.find(a => a.id === eq.asset_id)?.name || 'Sin asignar',
          'Última Señal': eq.last_seen ? formatDate(eq.last_seen) : 'N/A',
          Latitud: eq.lat || 'N/A',
          Longitud: eq.lng || 'N/A',
          'Fecha Creación': formatDate(eq.created_at),
        }));
        filename = 'Reporte_Equipos';
        break;

      case 'assets':
        csvData = filteredData.map((asset: any) => ({
          Nombre: asset.name,
          Tipo: asset.type,
          Cliente: clients.find(c => c.id === asset.client_id)?.company_name || 'Sin asignar',
          'Placa/ID': asset.plate || asset.economic_id || 'N/A',
          Estado: asset.status || 'N/A',
          'Fecha Creación': formatDate(asset.created_at),
        }));
        filename = 'Reporte_Activos';
        break;

      case 'geofences':
        csvData = filteredData.map((geo: any) => ({
          Nombre: geo.name,
          Descripción: geo.description || 'Sin descripción',
          Tipo: geo.geom_type || 'N/A',
          Cliente: clients.find(c => c.id === geo.client_id)?.company_name || 'Sin asignar',
          'Fecha Creación': formatDate(geo.created_at),
        }));
        filename = 'Reporte_Geocercas';
        break;

      case 'clients':
        csvData = filteredData.map((client: any) => ({
          'Nombre Empresa': client.company_name,
          'Contacto': client.contact_name,
          'Email': client.email,
          'Teléfono': client.contact_phone,
          'Estado': client.status === 'active' ? 'Activo' : 'Suspendido',
          'Fecha Alta': formatDate(client.created_at),
        }));
        filename = 'Reporte_Clientes';
        break;

      case 'users':
        csvData = filteredData.map((user: any) => ({
          Nombre: user.name,
          Usuario: user.username,
          Email: user.email || 'N/A',
          Rol: user.role,
          Cliente: clients.find(c => c.id === user.client_id)?.company_name || 'Sin cliente',
          'Fecha Creación': formatDate(user.created_at),
        }));
        filename = 'Reporte_Usuarios';
        break;

      case 'notifications':
        csvData = filteredData.map((notif: any) => ({
          Título: notif.title,
          Descripción: notif.description,
          Prioridad: notif.priority,
          Equipo: notif.equipment_id || 'N/A',
          'Recurso': notif.resource_name || 'N/A',
          'Fecha': formatDate(notif.ts),
        }));
        filename = 'Reporte_Notificaciones';
        break;
    }

    const dateRange = startDate && endDate ? `${startDate}_${endDate}` : 'todos';
    exportToCSV(csvData, `${filename}_${dateRange}`);
    toast.success(`Reporte exportado exitosamente: ${csvData.length} registros`);
  };

  const handleComprehensiveClientReport = () => {
    const client = clients.find(c => c.id === selectedClientId);
    if (!client) {
      toast.error('Cliente no encontrado');
      return;
    }

    // Helper function to filter and sort by date range
    const filterAndSortByDate = (items: any[], dateField: string) => {
      let filtered = items;

      // Apply date filter if dates are selected
      if (startDate && endDate) {
        const start = new Date(startDate + (startTime ? `T${startTime}` : 'T00:00:00'));
        const end = new Date(endDate + (endTime ? `T${endTime}` : 'T23:59:59'));

        filtered = items.filter((item) => {
          const itemDate = new Date(item[dateField]);
          return itemDate >= start && itemDate <= end;
        });
      }

      // Sort chronologically (oldest first)
      return filtered.sort((a, b) => {
        const dateA = new Date(a[dateField]).getTime();
        const dateB = new Date(b[dateField]).getTime();
        return dateA - dateB;
      });
    };

    // Helper function to format date as "DD/MM/YYYY"
    const formatDateOnly = (dateStr: string) => {
      const date = new Date(dateStr);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };

    // Helper function to format time as "HH:MM"
    const formatTimeOnly = (dateStr: string) => {
      const date = new Date(dateStr);
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    };

    const sheets = [];

    // 1. Sheet de Equipos GPS con toda la información
    let clientEquipments = equipments.filter(eq => eq.client_id === selectedClientId);
    clientEquipments = filterAndSortByDate(clientEquipments, 'created_at');

    const equipmentsData = clientEquipments.map((eq: any) => {
      const asset = assets.find(a => a.id === eq.asset_id);
      return {
        'Fecha': formatDateOnly(eq.created_at),
        'Hora': formatTimeOnly(eq.created_at),
        IMEI: eq.imei,
        Serial: eq.serial,
        Marca: eq.brand,
        Modelo: eq.model,
        Estado: eq.status === 'active' ? 'Activo' : 'Inactivo',
        'Activo Asignado': asset?.name || 'Sin asignar',
        'Tipo de Activo': asset?.type || 'N/A',
        'Placa del Activo': (asset && asset.type === 'vehicle' ? asset.plate : 'N/A') || 'N/A',
        Cliente: client.company_name,
        'Email Cliente': client.email,
        'Teléfono Cliente': client.contact_phone,
        'Última Señal': eq.last_seen ? formatDate(eq.last_seen) : 'N/A',
        Latitud: eq.lat || 'N/A',
        Longitud: eq.lng || 'N/A',
        Velocidad: eq.speed || 0,
      };
    });
    sheets.push({ sheetName: 'Equipos GPS', data: equipmentsData });

    // 2. Sheet de Activos del cliente
    let clientAssets = assets.filter(a => a.client_id === selectedClientId);
    clientAssets = filterAndSortByDate(clientAssets, 'created_at');

    const assetsData = clientAssets.map((asset: any) => {
      const equipment = equipments.find(eq => eq.asset_id === asset.id);
      return {
        'Fecha': formatDateOnly(asset.created_at),
        'Hora': formatTimeOnly(asset.created_at),
        Nombre: asset.name,
        Tipo: asset.type,
        'Placa/Número Económico': (asset.type === 'vehicle' ? asset.plate : asset.type === 'container' ? asset.box_plate : undefined) || asset.economic_id || 'N/A',
        Estado: asset.status || 'Activo',
        Marca: asset.brand || 'N/A',
        Modelo: asset.model || 'N/A',
        Año: asset.year || 'N/A',
        Color: asset.color || 'N/A',
        VIN: asset.vin || 'N/A',
        'Equipo GPS Asignado': equipment?.imei || 'Sin equipo',
      };
    });
    sheets.push({ sheetName: 'Activos', data: assetsData });

    // 3. Sheet de Operadores (usuarios del cliente)
    let clientUsers = users.filter(u => u.client_id === selectedClientId);
    clientUsers = filterAndSortByDate(clientUsers, 'created_at');

    const usersData = clientUsers.map((user: any) => ({
      'Fecha': formatDateOnly(user.created_at),
      'Hora': formatTimeOnly(user.created_at),
      Nombre: user.name,
      Usuario: user.username,
      Email: user.email || 'N/A',
      Rol: user.role,
      'Último Acceso': user.last_login ? formatDate(user.last_login) : 'Nunca',
    }));
    sheets.push({ sheetName: 'Operadores', data: usersData });

    // 4. Sheet de Geocercas del cliente
    let clientGeofences = geofences.filter(g => g.client_id === selectedClientId);
    clientGeofences = filterAndSortByDate(clientGeofences, 'created_at');

    const geofencesData = clientGeofences.map((geo: any) => ({
      'Fecha': formatDateOnly(geo.created_at),
      'Hora': formatTimeOnly(geo.created_at),
      Nombre: geo.name,
      Descripción: geo.description || 'Sin descripción',
      Tipo: geo.geom_type || 'N/A',
    }));
    sheets.push({ sheetName: 'Geocercas', data: geofencesData });

    // 5. Sheet de Notificaciones relacionadas al cliente
    // Obtener notificaciones de equipos del cliente
    const clientEquipmentIds = clientEquipments.map((eq: any) => eq.id);
    let clientNotifications = notifications.filter(n =>
      clientEquipmentIds.includes(n.equipment_id || '')
    );
    clientNotifications = filterAndSortByDate(clientNotifications, 'ts');

    const notificationsData = clientNotifications.map((notif: any) => {
      const equipment = equipments.find(eq => eq.id === notif.equipment_id);
      return {
        'Fecha': formatDateOnly(notif.ts),
        'Hora': formatTimeOnly(notif.ts),
        Título: notif.title,
        Descripción: notif.description,
        Prioridad: notif.priority,
        'Equipo IMEI': equipment?.imei || 'N/A',
        Recurso: notif.resource_name || 'N/A',
      };
    });
    sheets.push({ sheetName: 'Notificaciones', data: notificationsData });

    // 6. Sheet de Información del Cliente
    const clientInfo = [{
      'Nombre Empresa': client.company_name,
      'Nombre de Contacto': client.contact_name,
      Email: client.email,
      Teléfono: client.contact_phone,
      Dirección: client.address || 'N/A',
      Estado: client.status === 'active' ? 'Activo' : 'Suspendido',
      'Fecha de Alta': formatDateOnly(client.created_at),
      'Rango de Reporte': startDate && endDate
        ? `${formatDateOnly(startDate)} - ${formatDateOnly(endDate)}`
        : 'Sin filtro de fecha',
      'Total Equipos': equipmentsData.length,
      'Equipos Activos': equipmentsData.filter((eq: any) => eq.Estado === 'Activo').length,
      'Total Activos': assetsData.length,
      'Total Operadores': usersData.length,
      'Total Geocercas': geofencesData.length,
      'Total Notificaciones': notificationsData.length,
    }];
    sheets.push({ sheetName: 'Info del Cliente', data: clientInfo });

    const dateRange = startDate && endDate
      ? `${formatDateOnly(startDate)}_al_${formatDateOnly(endDate)}`.replace(/\//g, '-')
      : 'completo';
    const filename = `Reporte_Completo_${client.company_name.replace(/\s+/g, '_')}_${dateRange}`;

    exportToExcel(sheets, filename);

    const totalRecords = equipmentsData.length + assetsData.length + usersData.length +
                        geofencesData.length + notificationsData.length;

    let message = `Reporte completo exportado: ${totalRecords} registros en 6 hojas`;
    if (startDate && endDate) {
      message += ` • Filtrado del ${formatDateOnly(startDate)} al ${formatDateOnly(endDate)}`;
    }
    toast.success(message);
  };

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setStartTime('');
    setEndTime('');
    setSelectedClientId('');
    toast.success('Filtros limpiados correctamente');
  };

  const hasActiveFilters = startDate || endDate || startTime || endTime || selectedClientId;

  const filteredData = getFilteredData();
  const previewData = filteredData.slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
        <p className="text-gray-600 mt-1">
          Generación y exportación de reportes con filtros personalizados
        </p>
      </div>

      {/* Report Type Selection */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Selecciona el tipo de reporte</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportTypes.map((report) => {
            const Icon = report.icon;
            const isSelected = selectedReport === report.id;
            return (
              <button
                key={report.id}
                onClick={() => setSelectedReport(report.id)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${report.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-gray-900">{report.title}</h3>
                      <Badge variant="default" className="ml-2">{report.count}</Badge>
                    </div>
                    <p className="text-xs text-gray-600">{report.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Filters */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Filtros <span className="text-sm font-normal text-gray-500">(Opcionales - Sin filtros se exporta todo)</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Fecha Inicio - OPCIONAL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Fecha Inicio
            </label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          {/* Fecha Fin - OPCIONAL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Fecha Fin
            </label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          {/* Hora Inicio - OPCIONAL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="w-4 h-4 inline mr-1" />
              Hora Inicio (opcional)
            </label>
            <Input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>

          {/* Hora Fin - OPCIONAL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="w-4 h-4 inline mr-1" />
              Hora Fin (opcional)
            </label>
            <Input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>

          {/* Cliente - OPCIONAL (solo para superuser) */}
          {user?.role === 'superuser' && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Users className="w-4 h-4 inline mr-1" />
                Cliente (opcional)
              </label>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Todos los clientes</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.company_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Action Buttons */}
          <div className="md:col-span-2 flex items-end gap-3">
            <Button
              variant="outline"
              onClick={handleClearFilters}
              disabled={!hasActiveFilters}
              className="flex-shrink-0"
              title="Limpiar todos los filtros"
            >
              <X className="w-4 h-4" />
              Limpiar Filtros
            </Button>
            <Button
              variant="primary"
              onClick={handleExport}
              className="flex-1"
            >
              <Download className="w-4 h-4" />
              {selectedClientId ? 'Descargar Reporte Completo (Excel)' : 'Descargar Reporte CSV'}
            </Button>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            {selectedClientId ? (
              <>
                <strong>Modo Reporte Completo</strong> • Se generará un archivo Excel con 6 hojas: Equipos GPS, Activos, Operadores, Geocercas, Notificaciones e Información del Cliente
                <br />
                Cliente seleccionado: <strong>{clients.find(c => c.id === selectedClientId)?.company_name}</strong>
              </>
            ) : (
              <>
                <strong>{filteredData.length} registros</strong> encontrados con los filtros aplicados
                {!startDate && !endDate && ' • Mostrando todos los registros'}
              </>
            )}
          </p>
        </div>
      </Card>

      {/* Preview Table */}
      {filteredData.length > 0 && (
        <Card>
          <CardHeader className="p-6">
            <CardTitle>
              Vista Previa - Mostrando {Math.min(10, filteredData.length)} de {filteredData.length} registros
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {selectedReport === 'equipments' && (
                      <>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">IMEI</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marca/Modelo</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                      </>
                    )}
                    {selectedReport === 'assets' && (
                      <>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                      </>
                    )}
                    {selectedReport === 'geofences' && (
                      <>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                      </>
                    )}
                    {selectedReport === 'clients' && (
                      <>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Empresa</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contacto</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                      </>
                    )}
                    {selectedReport === 'users' && (
                      <>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                      </>
                    )}
                    {selectedReport === 'notifications' && (
                      <>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Título</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prioridad</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recurso</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {previewData.map((item: any, index) => (
                    <tr key={index}>
                      {selectedReport === 'equipments' && (
                        <>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.imei}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{item.brand} {item.model}</td>
                          <td className="px-4 py-3 text-sm">
                            <Badge variant={item.status === 'active' ? 'success' : 'default'}>
                              {item.status === 'active' ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {clients.find(c => c.id === item.client_id)?.company_name || 'Sin asignar'}
                          </td>
                        </>
                      )}
                      {selectedReport === 'assets' && (
                        <>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{item.type}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {clients.find(c => c.id === item.client_id)?.company_name || 'Sin asignar'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{formatDate(item.created_at)}</td>
                        </>
                      )}
                      {selectedReport === 'geofences' && (
                        <>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{item.geom_type || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {clients.find(c => c.id === item.client_id)?.company_name || 'Sin asignar'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{formatDate(item.created_at)}</td>
                        </>
                      )}
                      {selectedReport === 'clients' && (
                        <>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.company_name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{item.contact_name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{item.email}</td>
                          <td className="px-4 py-3 text-sm">
                            <Badge variant={item.status === 'active' ? 'success' : 'danger'}>
                              {item.status === 'active' ? 'Activo' : 'Suspendido'}
                            </Badge>
                          </td>
                        </>
                      )}
                      {selectedReport === 'users' && (
                        <>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{item.role}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{item.email || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {clients.find(c => c.id === item.client_id)?.company_name || 'Sin cliente'}
                          </td>
                        </>
                      )}
                      {selectedReport === 'notifications' && (
                        <>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.title}</td>
                          <td className="px-4 py-3 text-sm">
                            <Badge variant={item.priority === 'high' ? 'danger' : 'default'}>
                              {item.priority}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{item.resource_name || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{formatDate(item.ts)}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {filteredData.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay datos para mostrar</h3>
            <p className="text-gray-600">
              No se encontraron registros con los filtros aplicados
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
