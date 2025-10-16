import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsApi } from '../features/clients/api';
import { vehiclesApi } from '../features/vehicles/api';
import { QUERY_KEYS } from '../lib/constants';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
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
} from 'lucide-react';
import { formatDate } from '../lib/utils';
import { VEHICLE_STATUS_CONFIG } from '../lib/constants';

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [isAddVehicleModalOpen, setIsAddVehicleModalOpen] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');

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
    mutationFn: (vehicleId: string) =>
      clientsApi.update(id!, {
        ...client,
        vehicle_ids: vehicles.filter((v: any) => v.id !== vehicleId).map((v: any) => v.id),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-vehicles', id] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CLIENTS });
    },
  });

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/clientes')}
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
            <p className="text-gray-600 mt-1">Detalles del cliente y vehículos asignados</p>
          </div>
        </div>
        {client.whatsapp && (
          <Button
            variant="primary"
            onClick={() => setIsAlertModalOpen(true)}
          >
            <MessageCircle className="w-4 h-4" />
            Enviar Alerta WhatsApp
          </Button>
        )}
      </div>

      {/* Client Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Building2 className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Nombre</p>
                <p className="font-medium text-gray-900">{client.name}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{client.email}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Teléfono</p>
                <p className="font-medium text-gray-900">{client.phone}</p>
              </div>
            </div>
            {client.whatsapp && (
              <div className="flex items-start gap-3">
                <MessageCircle className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">WhatsApp</p>
                  <p className="font-medium text-gray-900">{client.whatsapp}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Vehicles Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Vehículos Asignados ({vehicles.length})
              </div>
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
        <CardContent className="p-0">
          {isLoadingVehicles ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : vehicles.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No hay vehículos asignados a este cliente</p>
            </div>
          ) : (
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveVehicle(vehicle.id)}
                        className="text-crit-600 hover:text-crit-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Geofences Card */}
      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Geocercas ({geofences.length})
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoadingGeofences ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : geofences.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No hay geocercas asignadas a este cliente</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Global</TableHead>
                  <TableHead>Fecha de creación</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {geofences.map((geofence: any) => (
                  <TableRow key={geofence.id}>
                    <TableCell className="font-medium">{geofence.name}</TableCell>
                    <TableCell>
                      <Badge variant="default">{geofence.type}</Badge>
                    </TableCell>
                    <TableCell>
                      {geofence.is_global ? (
                        <Badge variant="info">Global</Badge>
                      ) : (
                        <Badge variant="default">Cliente</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatDate(geofence.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
    </div>
  );
}
