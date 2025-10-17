import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsApi } from '../features/clients/api';
import { vehiclesApi } from '../features/vehicles/api';
import { geofencesApi } from '../features/geofences/api';
import { QUERY_KEYS } from '../lib/constants';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { LeafletMap } from '../components/map/LeafletMap';
import { GeofenceModal } from '../components/GeofenceModal';
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MessageCircle,
  Truck,
  MapPin,
  Plus,
  Trash2,
  AlertTriangle,
  Pencil,
  Eye,
} from 'lucide-react';
import { formatDate } from '../lib/utils';
import { VEHICLE_STATUS_CONFIG } from '../lib/constants';
import type { Vehicle } from '../lib/types';

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [isAddVehicleModalOpen, setIsAddVehicleModalOpen] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showGeofences, setShowGeofences] = useState(true);
  const [isGeofenceModalOpen, setIsGeofenceModalOpen] = useState(false);

  const { data: client, isLoading: isLoadingClient } = useQuery({
    queryKey: ['client', id],
    queryFn: () => clientsApi.getById(id!),
    enabled: !!id,
  });

  const { data: vehicles = [], isLoading: isLoadingVehicles } = useQuery({
    queryKey: ['client-vehicles', id],
    queryFn: () => clientsApi.getVehicles(id!),
    enabled: !!id,
  });

  const { data: geofences = [], isLoading: isLoadingGeofences } = useQuery({
    queryKey: ['client-geofences', id],
    queryFn: () => clientsApi.getGeofences(id!),
    enabled: !!id,
  });

  const { data: allVehicles = [] } = useQuery({
    queryKey: QUERY_KEYS.VEHICLES,
    queryFn: vehiclesApi.getAll,
  });

  const sendAlertMutation = useMutation({
    mutationFn: (message: string) => clientsApi.sendAlert(id!, message),
    onSuccess: () => {
      setIsAlertModalOpen(false);
      setAlertMessage('');
      alert('Alerta enviada exitosamente por WhatsApp');
    },
  });

  const addVehicleMutation = useMutation({
    mutationFn: (vehicleId: string) =>
      clientsApi.update(id!, {
        ...client,
        vehicle_ids: [...vehicles.map((v: any) => v.id), vehicleId],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-vehicles', id] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CLIENTS });
      setIsAddVehicleModalOpen(false);
      setSelectedVehicleId('');
    },
  });

  const removeVehicleMutation = useMutation({
    mutationFn: async (vehicleId: string) => {
      await vehiclesApi.update(vehicleId, { clientId: null });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-vehicles', id] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CLIENTS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.VEHICLES });
    },
  });

  const deleteGeofenceMutation = useMutation({
    mutationFn: async (geofenceId: string) => {
      await geofencesApi.delete(geofenceId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-geofences', id] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GEOFENCES });
    },
  });

  const createGeofenceMutation = useMutation({
    mutationFn: async (geofenceData: {
      name: string;
      color: string;
      center: [number, number];
      radius: number;
      alert_type: 'entry' | 'exit' | 'both';
      is_global?: boolean;
      client_id?: string;
    }) => {
      const [lat, lng] = geofenceData.center;
      const geofence = {
        name: geofenceData.name,
        type: 'zona-permitida',
        color: geofenceData.color,
        geom: {
          type: 'Circle',
          coordinates: [[[lng, lat]]],
        },
        created_at: new Date().toISOString(),
        is_global: geofenceData.is_global || false,
        client_id: geofenceData.client_id || id,
      };
      await geofencesApi.create(geofence);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-geofences', id] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GEOFENCES });
      setIsGeofenceModalOpen(false);
      alert('Geocerca creada exitosamente');
    },
    onError: (error: any) => {
      const errorMessage = error.message || 'Error al crear la geocerca';
      alert(errorMessage);
    },
  });

  const handleSaveGeofence = (geofenceData: {
    name: string;
    color: string;
    center: [number, number];
    radius: number;
    alert_type: 'entry' | 'exit' | 'both';
    is_global?: boolean;
    client_id?: string;
  }) => {
    createGeofenceMutation.mutate({ ...geofenceData, client_id: id });
  };

  const handleSendAlert = () => {
    if (alertMessage.trim()) {
      sendAlertMutation.mutate(alertMessage);
    }
  };

  const handleAddVehicle = () => {
    if (selectedVehicleId) {
      addVehicleMutation.mutate(selectedVehicleId);
    }
  };

  const handleRemoveVehicle = (vehicleId: string) => {
    if (confirm('¿Estás seguro de que deseas desasignar este vehículo?')) {
      removeVehicleMutation.mutate(vehicleId);
    }
  };

  // Get available vehicles (not yet assigned to this client)
  const availableVehicles = allVehicles.filter(
    (v) => !vehicles.some((cv: any) => cv.id === v.id)
  );

  if (isLoadingClient) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-gray-600 mb-4">Cliente no encontrado</p>
        <Button variant="outline" onClick={() => navigate('/clientes')}>
          <ArrowLeft className="w-4 h-4" />
          Volver a Clientes
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/clientes')}
            className="mt-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{client.name}</h1>
            <p className="text-gray-600 mt-2">Detalles del cliente y sus recursos</p>
          </div>
        </div>
        {client.whatsapp && (
          <Button
            variant="primary"
            onClick={() => setIsAlertModalOpen(true)}
            className="self-start sm:self-center"
          >
            <MessageCircle className="w-4 h-4" />
            Enviar Alerta WhatsApp
          </Button>
        )}
      </div>

      {/* Client Info Card */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Building2 className="w-6 h-6 text-blue-600" />
            Información del Cliente
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-gray-200">
              <div className="p-3 rounded-xl bg-blue-100">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Email</p>
                <p className="text-sm font-semibold text-gray-900">{client.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-gray-200">
              <div className="p-3 rounded-xl bg-green-100">
                <Phone className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Teléfono</p>
                <p className="text-sm font-semibold text-gray-900">{client.phone}</p>
              </div>
            </div>

            {client.whatsapp && (
              <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-gray-200">
                <div className="p-3 rounded-xl bg-emerald-100">
                  <MessageCircle className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1">WhatsApp</p>
                  <p className="text-sm font-semibold text-gray-900">{client.whatsapp}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Map with Vehicles and Geofences */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <CardTitle>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600" />
                Mapa de vehículos y geocercas
              </div>
            </CardTitle>
            <Button
              variant={showGeofences ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setShowGeofences(!showGeofences)}
            >
              {showGeofences ? 'Ocultar geocercas' : 'Mostrar geocercas'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {vehicles.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No hay vehículos para mostrar en el mapa</p>
            </div>
          ) : (
            <div className="h-[500px] rounded-xl overflow-hidden shadow-md border border-gray-200">
              <LeafletMap
                vehicles={vehicles}
                geofences={showGeofences ? geofences : []}
                onVehicleClick={setSelectedVehicle}
                center={vehicles.length > 0 ? [vehicles[0].lat, vehicles[0].lng] : [20.7167, -103.3830]}
                zoom={13}
                showGeofences={showGeofences}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vehicles Card */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Truck className="w-6 h-6 text-violet-600" />
              Vehículos Asignados ({vehicles.length})
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddVehicleModalOpen(true)}
            >
              <Plus className="w-4 h-4" />
              Asignar Vehículo
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {isLoadingVehicles ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : vehicles.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No hay vehículos asignados a este cliente</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-6">
              <div className="inline-block min-w-full align-middle">
                <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Placa</TableHead>
                  <TableHead>Conductor</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Última señal</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicles.map((vehicle: any) => (
                  <TableRow key={vehicle.id}>
                    <TableCell className="font-medium">{vehicle.plate}</TableCell>
                    <TableCell>{vehicle.driver}</TableCell>
                    <TableCell>
                      <Badge variant={vehicle.status}>
                        {VEHICLE_STATUS_CONFIG[vehicle.status as keyof typeof VEHICLE_STATUS_CONFIG]?.label || vehicle.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      Hace {vehicle.last_seen_min || 0} min
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/vehiculos/${vehicle.id}`)}
                          title="Ver detalles del vehículo"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveVehicle(vehicle.id)}
                          className="text-red-600 hover:text-red-700"
                          title="Desasignar vehículo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Geofences Card */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <MapPin className="w-6 h-6 text-cyan-600" />
              Geocercas ({geofences.length})
            </CardTitle>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsGeofenceModalOpen(true)}
            >
              <Plus className="w-4 h-4" />
              Crear Geocerca
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {isLoadingGeofences ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : geofences.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No hay geocercas asignadas a este cliente</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-6">
              <div className="inline-block min-w-full align-middle">
                <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Propiedad</TableHead>
                  <TableHead>Fecha de creación</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {geofences.map((geofence: any) => {
                  const isOwnGeofence = geofence.client_id === id;
                  const isGlobal = geofence.is_global;

                  return (
                    <TableRow key={geofence.id}>
                      <TableCell className="font-medium">{geofence.name}</TableCell>
                      <TableCell>
                        <Badge variant="default">{geofence.type}</Badge>
                      </TableCell>
                      <TableCell>
                        {isGlobal ? (
                          <Badge variant="info">Global</Badge>
                        ) : isOwnGeofence ? (
                          <Badge variant="success">Propia</Badge>
                        ) : (
                          <Badge variant="default">Asignada</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatDate(geofence.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/geocercas/${geofence.id}`)}
                            title="Ver detalles"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate('/geocercas')}
                            title="Ir a geocercas para editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm(`¿Eliminar la geocerca "${geofence.name}"?`)) {
                                deleteGeofenceMutation.mutate(geofence.id);
                              }
                            }}
                            disabled={!isOwnGeofence}
                            className="text-red-600 hover:text-red-700 disabled:opacity-30"
                            title={isOwnGeofence ? "Eliminar geocerca" : "Solo puedes eliminar geocercas propias del cliente"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* WhatsApp Alert Modal */}
      <Modal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        title="Enviar Alerta por WhatsApp"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mensaje de Alerta *
            </label>
            <textarea
              value={alertMessage}
              onChange={(e) => setAlertMessage(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Escribe el mensaje de alerta aquí..."
            />
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAlertModalOpen(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleSendAlert}
              className="flex-1"
              disabled={!alertMessage.trim() || sendAlertMutation.isPending}
            >
              {sendAlertMutation.isPending ? 'Enviando...' : 'Enviar Alerta'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Vehicle Modal */}
      <Modal
        isOpen={isAddVehicleModalOpen}
        onClose={() => setIsAddVehicleModalOpen(false)}
        title="Asignar Vehículo"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Seleccionar Vehículo *
            </label>
            <select
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Seleccionar...</option>
              {availableVehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.plate} - {vehicle.driver}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddVehicleModalOpen(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleAddVehicle}
              className="flex-1"
              disabled={!selectedVehicleId || addVehicleMutation.isPending}
            >
              {addVehicleMutation.isPending ? 'Asignando...' : 'Asignar Vehículo'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Geofence Modal */}
      <GeofenceModal
        isOpen={isGeofenceModalOpen}
        onClose={() => setIsGeofenceModalOpen(false)}
        onSave={handleSaveGeofence}
        defaultClientId={id}
      />
    </div>
  );
}
