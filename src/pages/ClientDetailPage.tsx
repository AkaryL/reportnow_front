import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsApi } from '../features/clients/api';
import { equipmentsApi } from '../features/equipments/api';
import { geofencesApi } from '../features/geofences/api';
import { assetsApi } from '../features/assets/api';
import { QUERY_KEYS } from '../lib/constants';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { LeafletMap } from '../components/map/LeafletMap';
import { GeofenceModal } from '../components/GeofenceModal';
import { OperatorFormModal } from '../components/operators/OperatorFormModal';
import { ClientFormModal } from '../components/clients/ClientFormModal';
import { AssetFormModal } from '../components/assets/AssetFormModal';
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MessageCircle,
  Radio,
  MapPin,
  Plus,
  Trash2,
  AlertTriangle,
  Pencil,
  Eye,
  Users,
  FileText,
  MapPinned,
  Package,
} from 'lucide-react';
import { formatDate } from '../lib/utils';
import type { Equipment, User, Client, Asset } from '../lib/types';
import { useConfirm } from '../hooks/useConfirm';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../features/auth/hooks';

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const confirmDialog = useConfirm();
  const toast = useToast();
  const { user } = useAuth();

  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [isAddEquipmentModalOpen, setIsAddEquipmentModalOpen] = useState(false);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [showGeofences, setShowGeofences] = useState(true);
  const [isGeofenceModalOpen, setIsGeofenceModalOpen] = useState(false);
  const [editingGeofence, setEditingGeofence] = useState<any>(null);
  const [isOperatorModalOpen, setIsOperatorModalOpen] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState<User | null>(null);
  const [isEditClientModalOpen, setIsEditClientModalOpen] = useState(false);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  const { data: client, isLoading: isLoadingClient } = useQuery({
    queryKey: ['client', id],
    queryFn: () => clientsApi.getById(id!),
    enabled: !!id,
  });

  const { data: equipments = [], isLoading: isLoadingEquipments } = useQuery({
    queryKey: QUERY_KEYS.EQUIPMENTS,
    queryFn: equipmentsApi.getAll,
  });

  const { data: users = [] } = useQuery({
    queryKey: QUERY_KEYS.USERS,
    queryFn: async () => {
      const { usersApi } = await import('../features/users/api');
      return usersApi.getAll();
    },
  });

  const { data: geofences = [], isLoading: isLoadingGeofences } = useQuery({
    queryKey: ['client-geofences', id],
    queryFn: () => clientsApi.getGeofences(id!),
    enabled: !!id,
  });

  const { data: allAssets = [], isLoading: isLoadingAssets } = useQuery({
    queryKey: QUERY_KEYS.ASSETS,
    queryFn: assetsApi.getAll,
  });

  // Filtrar equipos del cliente
  const clientEquipments = equipments.filter((eq) => eq.client_id === id);

  // Filtrar operadores del cliente
  const clientOperators = users.filter(
    (u) => u.client_id === id && (u.role === 'operator-admin' || u.role === 'operator-monitor')
  );

  // Filtrar activos del cliente
  const clientAssets = allAssets.filter((asset) => asset.client_id === id);

  const sendAlertMutation = useMutation({
    mutationFn: (message: string) => clientsApi.sendAlert(id!, message),
    onSuccess: () => {
      setIsAlertModalOpen(false);
      setAlertMessage('');
      alert('Alerta enviada exitosamente por WhatsApp');
    },
  });

  const addEquipmentMutation = useMutation({
    mutationFn: async (equipmentId: string) => {
      await equipmentsApi.update(equipmentId, { client_id: id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.EQUIPMENTS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CLIENTS });
      setIsAddEquipmentModalOpen(false);
      setSelectedEquipmentId('');
    },
  });

  const removeEquipmentMutation = useMutation({
    mutationFn: async (equipmentId: string) => {
      await equipmentsApi.update(equipmentId, { client_id: null });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.EQUIPMENTS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CLIENTS });
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
      setEditingGeofence(null);
      toast.success('Geocerca creada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al crear la geocerca');
    },
  });

  const updateGeofenceMutation = useMutation({
    mutationFn: async ({ id: geofenceId, data }: { id: string; data: any }) => {
      const [lat, lng] = data.center;
      const updatedGeofence = {
        name: data.name,
        color: data.color,
        geom: {
          type: 'Circle',
          coordinates: [[[lng, lat]]],
        },
        alert_type: data.alert_type,
        is_global: data.is_global || false,
        client_id: data.client_id || id,
      };
      await geofencesApi.update(geofenceId, updatedGeofence);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-geofences', id] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GEOFENCES });
      setIsGeofenceModalOpen(false);
      setEditingGeofence(null);
      toast.success('Geocerca actualizada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al actualizar la geocerca');
    },
  });

  const createOperatorMutation = useMutation({
    mutationFn: async (data: any) => {
      const { usersApi } = await import('../features/users/api');
      return usersApi.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS });
      setIsOperatorModalOpen(false);
      setSelectedOperator(null);
      toast.success('Operador creado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al crear el operador');
    },
  });

  const updateOperatorMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { usersApi } = await import('../features/users/api');
      return usersApi.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS });
      setIsOperatorModalOpen(false);
      setSelectedOperator(null);
      toast.success('Operador actualizado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al actualizar el operador');
    },
  });

  const deleteOperatorMutation = useMutation({
    mutationFn: async (operatorId: string) => {
      const { usersApi } = await import('../features/users/api');
      return usersApi.delete(operatorId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS });
      toast.success('Operador eliminado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al eliminar el operador');
    },
  });

  const updateClientMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => clientsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client', id] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CLIENTS });
      setIsEditClientModalOpen(false);
      toast.success('Cliente actualizado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al actualizar el cliente');
    },
  });

  const changeClientStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'suspended' }) =>
      clientsApi.update(id, { status }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client', id] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CLIENTS });
      toast.success(
        variables.status === 'active'
          ? 'Servicio activado exitosamente'
          : 'Servicio suspendido exitosamente'
      );
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al cambiar el estatus del cliente');
    },
  });

  // Asset CRUD mutations
  const createAssetMutation = useMutation({
    mutationFn: async ({ type, data }: { type: string; data: any }) => {
      const assetData = { ...data, client_id: id };

      switch (type) {
        case 'vehicle':
          return assetsApi.createVehicle(assetData);
        case 'cargo':
          return assetsApi.createCargo(assetData);
        case 'container':
          return assetsApi.createContainer(assetData);
        case 'person':
          return assetsApi.createPerson(assetData);
        case 'other':
          return assetsApi.createOther(assetData);
        default:
          throw new Error('Tipo de activo no válido');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ASSETS });
      setIsAssetModalOpen(false);
      setSelectedAsset(null);
      toast.success('Activo creado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al crear el activo');
    },
  });

  const updateAssetMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => assetsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ASSETS });
      setIsAssetModalOpen(false);
      setSelectedAsset(null);
      toast.success('Activo actualizado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al actualizar el activo');
    },
  });

  const deleteAssetMutation = useMutation({
    mutationFn: assetsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ASSETS });
      toast.success('Activo eliminado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al eliminar el activo');
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
    if (editingGeofence) {
      updateGeofenceMutation.mutate({ id: editingGeofence.id, data: { ...geofenceData, client_id: id } });
    } else {
      createGeofenceMutation.mutate({ ...geofenceData, client_id: id });
    }
  };

  const handleEditGeofence = (geofence: any) => {
    setEditingGeofence(geofence);
    setIsGeofenceModalOpen(true);
  };

  const handleSendAlert = () => {
    if (alertMessage.trim()) {
      sendAlertMutation.mutate(alertMessage);
    }
  };

  const handleAddEquipment = () => {
    if (selectedEquipmentId) {
      addEquipmentMutation.mutate(selectedEquipmentId);
    }
  };

  const handleRemoveEquipment = (equipmentId: string) => {
    if (confirm('¿Estás seguro de que deseas desasignar este equipo?')) {
      removeEquipmentMutation.mutate(equipmentId);
    }
  };

  const handleCreateOperator = () => {
    setSelectedOperator(null);
    setIsOperatorModalOpen(true);
  };

  const handleEditOperator = (operator: User) => {
    setSelectedOperator(operator);
    setIsOperatorModalOpen(true);
  };

  const handleSubmitOperator = (data: any) => {
    if (selectedOperator) {
      // Don't send empty password when editing
      const updateData = { ...data };
      if (!updateData.password || updateData.password.trim() === '') {
        delete updateData.password;
      }
      updateOperatorMutation.mutate({ id: selectedOperator.id, data: updateData });
    } else {
      createOperatorMutation.mutate(data);
    }
  };

  const handleDeleteOperator = async (operatorId: string, operatorName: string) => {
    const confirmed = await confirmDialog.confirm({
      title: 'Eliminar Operador',
      message: `¿Estás seguro de que deseas eliminar al operador "${operatorName}"? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });

    if (confirmed) {
      deleteOperatorMutation.mutate(operatorId);
    }
  };

  const handleEditClient = () => {
    setIsEditClientModalOpen(true);
  };

  const handleSubmitClient = (data: any) => {
    // Don't send empty password when editing
    const updateData = { ...data };
    if (!updateData.password || updateData.password.trim() === '') {
      delete updateData.password;
    }
    updateClientMutation.mutate({ id: id!, data: updateData });
  };

  const handleToggleClientStatus = async () => {
    if (!client) return;

    const newStatus = client.status === 'active' ? 'suspended' : 'active';
    const confirmed = await confirmDialog.confirm({
      title: newStatus === 'suspended' ? 'Suspender Servicio' : 'Activar Servicio',
      message:
        newStatus === 'suspended'
          ? `¿Estás seguro de que deseas suspender el servicio del cliente "${client.company_name}"? Los equipos dejarán de funcionar.`
          : `¿Estás seguro de que deseas activar el servicio del cliente "${client.company_name}"?`,
      confirmText: newStatus === 'suspended' ? 'Suspender' : 'Activar',
      cancelText: 'Cancelar',
      variant: newStatus === 'suspended' ? 'danger' : 'default',
    });

    if (confirmed) {
      changeClientStatusMutation.mutate({ id: id!, status: newStatus });
    }
  };

  // Asset handlers
  const handleCreateAsset = () => {
    setSelectedAsset(null);
    setIsAssetModalOpen(true);
  };

  const handleEditAsset = (asset: Asset) => {
    setSelectedAsset(asset);
    setIsAssetModalOpen(true);
  };

  const handleSubmitAsset = (payload: any) => {
    if (selectedAsset) {
      updateAssetMutation.mutate({ id: selectedAsset.id, data: payload });
    } else {
      createAssetMutation.mutate(payload);
    }
  };

  const handleDeleteAsset = async (assetId: string, assetName: string) => {
    const confirmed = await confirmDialog.confirm({
      title: 'Eliminar Activo',
      message: `¿Estás seguro de que deseas eliminar el activo "${assetName}"? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });

    if (confirmed) {
      deleteAssetMutation.mutate(assetId);
    }
  };

  // Get available equipments (not yet assigned to any client)
  const availableEquipments = equipments.filter((eq) => !eq.client_id);

  const isSuperUser = user?.role === 'superuser';

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
            <h1 className="text-3xl font-bold text-gray-900">{client.company_name}</h1>
            <p className="text-gray-600 mt-2">{client.contact_name} • {clientEquipments.length} equipos • {clientOperators.length} operadores</p>
          </div>
        </div>
        <div className="flex gap-3">
          {client.authorized_phones && client.authorized_phones.length > 0 && (
            <Button
              variant="primary"
              onClick={() => setIsAlertModalOpen(true)}
              className="self-start sm:self-center"
            >
              <MessageCircle className="w-4 h-4" />
              Enviar Alerta WhatsApp
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleEditClient}
            className="self-start sm:self-center"
          >
            <Pencil className="w-4 h-4" />
            Editar Cliente
          </Button>
        </div>
      </div>

      {/* Client Info Card */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 p-6">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-3 text-gray-900">
              <Building2 className="w-6 h-6 text-blue-600" />
              Información del Cliente
            </CardTitle>
            {isSuperUser && (
              <Button
                variant={client.status === 'active' ? 'outline' : 'primary'}
                size="sm"
                onClick={handleToggleClientStatus}
                className={
                  client.status === 'active'
                    ? 'text-red-600 hover:text-red-700 hover:bg-red-50'
                    : ''
                }
              >
                {client.status === 'active' ? 'Suspender Servicio' : 'Activar Servicio'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Estatus */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-gray-200">
              <div
                className={`p-3 rounded-xl ${
                  client.status === 'active'
                    ? 'bg-green-100'
                    : client.status === 'suspended'
                    ? 'bg-red-100'
                    : 'bg-gray-100'
                }`}
              >
                <AlertTriangle
                  className={`w-5 h-5 ${
                    client.status === 'active'
                      ? 'text-green-600'
                      : client.status === 'suspended'
                      ? 'text-red-600'
                      : 'text-gray-600'
                  }`}
                />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Estatus</p>
                <Badge
                  variant={
                    client.status === 'active'
                      ? 'success'
                      : client.status === 'suspended'
                      ? 'danger'
                      : 'default'
                  }
                >
                  {client.status === 'active' ? 'Activo' : client.status === 'suspended' ? 'Suspendido' : 'Inactivo'}
                </Badge>
              </div>
            </div>

            {/* Fecha Alta */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-gray-200">
              <div className="p-3 rounded-xl bg-indigo-100">
                <Building2 className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Fecha Alta</p>
                <p className="text-sm font-semibold text-gray-900">{formatDate(client.created_at)}</p>
              </div>
            </div>

            {/* Nombre Empresa */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-gray-200">
              <div className="p-3 rounded-xl bg-blue-100">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Nombre Empresa</p>
                <p className="text-sm font-semibold text-gray-900">{client.company_name}</p>
              </div>
            </div>

            {/* Nombre Contacto */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-gray-200">
              <div className="p-3 rounded-xl bg-blue-100">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Nombre Contacto</p>
                <p className="text-sm font-semibold text-gray-900">{client.contact_name}</p>
              </div>
            </div>

            {/* Cargo de Contacto */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-gray-200">
              <div className="p-3 rounded-xl bg-purple-100">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Cargo de Contacto</p>
                <p className="text-sm font-semibold text-gray-900">{client.contact_position}</p>
              </div>
            </div>

            {/* Tel Contacto */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-gray-200">
              <div className="p-3 rounded-xl bg-green-100">
                <Phone className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Tel Contacto</p>
                <p className="text-sm font-semibold text-gray-900">{client.contact_phone}</p>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-gray-200">
              <div className="p-3 rounded-xl bg-blue-100">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Email</p>
                <p className="text-sm font-semibold text-gray-900">{client.email}</p>
              </div>
            </div>

            {/* Tels Autorizados */}
            {client.authorized_phones && client.authorized_phones.length > 0 && (
              <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 border border-gray-200 md:col-span-2">
                <div className="p-3 rounded-xl bg-emerald-100">
                  <Phone className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-600 mb-2">Teléfonos Autorizados</p>
                  <div className="flex flex-wrap gap-2">
                    {client.authorized_phones.map((phone, index) => (
                      <Badge key={index} variant="default" className="bg-emerald-50 text-emerald-700">
                        {phone}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Emails Autorizados */}
            {client.authorized_emails && client.authorized_emails.length > 0 && (
              <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 border border-gray-200 md:col-span-2 lg:col-span-3">
                <div className="p-3 rounded-xl bg-cyan-100">
                  <Mail className="w-5 h-5 text-cyan-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-600 mb-2">Emails Autorizados</p>
                  <div className="flex flex-wrap gap-2">
                    {client.authorized_emails.map((email, index) => (
                      <Badge key={index} variant="default" className="bg-cyan-50 text-cyan-700">
                        {email}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Map with Equipments and Geofences */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-gray-200 p-6">
          <div className="flex items-center justify-between gap-4">
            <CardTitle>
              <div className="flex items-center gap-3">
                <MapPin className="w-6 h-6 text-emerald-600" />
                Mapa de equipos y geocercas
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
          {clientEquipments.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Radio className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No hay equipos para mostrar en el mapa</p>
            </div>
          ) : (
            <div className="h-[500px] rounded-xl overflow-hidden shadow-md border border-gray-200">
              <LeafletMap
                vehicles={clientEquipments}
                geofences={showGeofences ? geofences : []}
                onVehicleClick={(eq) => setSelectedEquipment(eq as Equipment)}
                center={clientEquipments.length > 0 ? [clientEquipments[0].lat, clientEquipments[0].lng] : [20.7167, -103.3830]}
                zoom={13}
                showGeofences={showGeofences}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Equipments Card */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 border-b border-gray-200 p-6">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-3 text-gray-900">
              <Radio className="w-6 h-6 text-violet-600" />
              Equipos GPS Asignados ({clientEquipments.length})
            </CardTitle>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsAddEquipmentModalOpen(true)}
            >
              <Plus className="w-4 h-4" />
              Asignar Equipo
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {isLoadingEquipments ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : clientEquipments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No hay equipos asignados a este cliente</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-6">
              <div className="inline-block min-w-full align-middle">
                <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>IMEI</TableHead>
                  <TableHead>Marca/Modelo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Última señal</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientEquipments.map((equipment) => (
                  <TableRow key={equipment.id}>
                    <TableCell className="font-medium">{equipment.imei}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">{equipment.brand} {equipment.model}</p>
                        <p className="text-xs text-gray-500">S/N: {equipment.serial}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={equipment.status === 'active' ? 'success' : 'default'}>
                        {equipment.status === 'active' ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatDate(equipment.last_seen)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/equipos/${equipment.id}`)}
                          title="Ver detalles del equipo"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveEquipment(equipment.id)}
                          className="text-red-600 hover:text-red-700"
                          title="Desasignar equipo"
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

      {/* Operators Card */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-gray-200 p-6">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-3 text-gray-900">
              <Users className="w-6 h-6 text-amber-600" />
              Operadores ({clientOperators.length})
            </CardTitle>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreateOperator}
            >
              <Plus className="w-4 h-4" />
              Nuevo Operador
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {clientOperators.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No hay operadores asignados a este cliente</p>
              <Button
                variant="primary"
                size="sm"
                onClick={handleCreateOperator}
              >
                <Plus className="w-4 h-4" />
                Crear Primer Operador
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-6">
              <div className="inline-block min-w-full align-middle">
                <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Última actividad</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientOperators.map((operator) => (
                  <TableRow key={operator.id}>
                    <TableCell className="font-medium">{operator.name}</TableCell>
                    <TableCell>{operator.email}</TableCell>
                    <TableCell className="text-sm text-gray-600">{operator.username}</TableCell>
                    <TableCell>
                      {operator.role === 'operator-admin' ? (
                        <Badge variant="default" className="bg-purple-100 text-purple-700 border-purple-200">
                          Admin
                        </Badge>
                      ) : (
                        <Badge variant="default" className="bg-blue-100 text-blue-700 border-blue-200">
                          Monitor
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{operator.phone || '-'}</TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatDate(operator.last_activity || operator.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditOperator(operator)}
                          title="Editar operador"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteOperator(operator.id, operator.name)}
                          className="text-red-600 hover:text-red-700"
                          title="Eliminar operador"
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

      {/* Assets Card (Super User Only) */}
      {isSuperUser && (
        <Card>
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-200 p-6">
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-3 text-gray-900">
                <Package className="w-6 h-6 text-green-600" />
                Activos ({clientAssets.length})
              </CardTitle>
              <Button
                variant="primary"
                size="sm"
                onClick={handleCreateAsset}
              >
                <Plus className="w-4 h-4" />
                Nuevo Activo
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {isLoadingAssets ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : clientAssets.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">No hay activos asignados a este cliente</p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleCreateAsset}
                >
                  <Plus className="w-4 h-4" />
                  Crear Primer Activo
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-6">
                <div className="inline-block min-w-full align-middle">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Equipo Asignado</TableHead>
                        <TableHead>Fecha de creación</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clientAssets.map((asset) => {
                        const equipment = equipments.find((eq) => eq.id === asset.equipment_id);

                        return (
                          <TableRow key={asset.id}>
                            <TableCell className="font-medium">{asset.name}</TableCell>
                            <TableCell>
                              <Badge variant="default">
                                {asset.type === 'vehicle'
                                  ? 'Vehículo'
                                  : asset.type === 'cargo'
                                  ? 'Carga'
                                  : asset.type === 'container'
                                  ? 'Contenedor'
                                  : asset.type === 'person'
                                  ? 'Persona'
                                  : 'Otro'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {asset.status === 'active' ? (
                                <Badge variant="success">Activo</Badge>
                              ) : (
                                <Badge variant="default" className="bg-gray-100 text-gray-700">
                                  Inactivo
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {equipment ? (
                                <span>
                                  {equipment.imei} ({equipment.brand} {equipment.model})
                                </span>
                              ) : (
                                <span className="text-gray-400">Sin equipo</span>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {formatDate(asset.created_at)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-2 justify-end">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditAsset(asset)}
                                  title="Editar activo"
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteAsset(asset.id, asset.name)}
                                  className="text-red-600 hover:text-red-700"
                                  title="Eliminar activo"
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
      )}

      {/* Geofences Card */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50 border-b border-gray-200 p-6">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-3 text-gray-900">
              <MapPin className="w-6 h-6 text-cyan-600" />
              Geocercas ({geofences.length})
            </CardTitle>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setEditingGeofence(null);
                setIsGeofenceModalOpen(true);
              }}
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
                            onClick={() => handleEditGeofence(geofence)}
                            title="Editar geocerca"
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

      {/* Add Equipment Modal */}
      <Modal
        isOpen={isAddEquipmentModalOpen}
        onClose={() => setIsAddEquipmentModalOpen(false)}
        title="Asignar Equipo GPS"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Seleccionar Equipo *
            </label>
            <select
              value={selectedEquipmentId}
              onChange={(e) => setSelectedEquipmentId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Seleccionar...</option>
              {availableEquipments.map((equipment) => (
                <option key={equipment.id} value={equipment.id}>
                  {equipment.imei} - {equipment.brand} {equipment.model}
                </option>
              ))}
            </select>
            {availableEquipments.length === 0 && (
              <p className="text-xs text-amber-600 mt-2">
                No hay equipos disponibles. Todos los equipos ya están asignados.
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddEquipmentModalOpen(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleAddEquipment}
              className="flex-1"
              disabled={!selectedEquipmentId || addEquipmentMutation.isPending}
            >
              {addEquipmentMutation.isPending ? 'Asignando...' : 'Asignar Equipo'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Geofence Modal */}
      <GeofenceModal
        isOpen={isGeofenceModalOpen}
        onClose={() => {
          setIsGeofenceModalOpen(false);
          setEditingGeofence(null);
        }}
        onSave={handleSaveGeofence}
        defaultClientId={id}
        editingGeofence={editingGeofence}
      />

      {/* Operator Modal */}
      <OperatorFormModal
        isOpen={isOperatorModalOpen}
        onClose={() => {
          setIsOperatorModalOpen(false);
          setSelectedOperator(null);
        }}
        onSubmit={handleSubmitOperator}
        operator={selectedOperator}
        isLoading={createOperatorMutation.isPending || updateOperatorMutation.isPending}
        clientId={id!}
      />

      {/* Edit Client Modal */}
      <ClientFormModal
        isOpen={isEditClientModalOpen}
        onClose={() => setIsEditClientModalOpen(false)}
        onSubmit={handleSubmitClient}
        client={client}
        isLoading={updateClientMutation.isPending}
      />

      {/* Asset Modal */}
      <AssetFormModal
        isOpen={isAssetModalOpen}
        onClose={() => {
          setIsAssetModalOpen(false);
          setSelectedAsset(null);
        }}
        onSubmit={handleSubmitAsset}
        asset={selectedAsset}
        clientId={id!}
        isLoading={createAssetMutation.isPending || updateAssetMutation.isPending}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={confirmDialog.handleCancel}
        onConfirm={confirmDialog.handleConfirm}
        title={confirmDialog.options.title}
        message={confirmDialog.options.message}
        confirmText={confirmDialog.options.confirmText}
        cancelText={confirmDialog.options.cancelText}
        variant={confirmDialog.options.variant}
      />
    </div>
  );
}
