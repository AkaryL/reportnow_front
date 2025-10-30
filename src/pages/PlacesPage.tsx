import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { placesApi } from '../features/places/api';
import { QUERY_KEYS } from '../lib/constants';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { PlaceFormModal } from '../components/places/PlaceFormModal';
import {
  MapPin,
  Plus,
  Edit,
  Trash2,
  Search,
  Home,
  Building2,
  Warehouse,
  Factory,
  Store,
  Fuel,
  ParkingCircle,
  Circle,
  Globe,
} from 'lucide-react';
import type { Place } from '../lib/types';
import { useAuth } from '../features/auth/hooks';
import { useToast } from '../hooks/useToast';
import { useConfirm } from '../hooks/useConfirm';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

const ICON_MAP = {
  home: Home,
  office: Building2,
  warehouse: Warehouse,
  factory: Factory,
  store: Store,
  'gas-station': Fuel,
  parking: ParkingCircle,
  other: Circle,
};

export function PlacesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const toast = useToast();
  const confirmDialog = useConfirm();

  const { data: places = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.PLACES,
    queryFn: placesApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: placesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PLACES });
      setIsModalOpen(false);
      setSelectedPlace(null);
      toast.success('Lugar creado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al crear el lugar');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => placesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PLACES });
      setIsModalOpen(false);
      setSelectedPlace(null);
      toast.success('Lugar actualizado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al actualizar el lugar');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: placesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PLACES });
      toast.success('Lugar eliminado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al eliminar el lugar');
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: placesApi.toggleStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PLACES });
      toast.success('Estado actualizado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al cambiar el estado del lugar');
    },
  });

  // Filtrar lugares
  const filteredPlaces = places.filter((place) => {
    const matchesSearch = !searchQuery || place.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus === 'all' || place.status === filterStatus;

    const matchesType =
      filterType === 'all' ||
      (filterType === 'global' && place.is_global) ||
      (filterType === 'tenant' && !place.is_global);

    return matchesSearch && matchesStatus && matchesType;
  });

  const handleSubmit = (data: any) => {
    if (selectedPlace) {
      updateMutation.mutate({ id: selectedPlace.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (place: Place) => {
    setSelectedPlace(place);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await confirmDialog.confirm({
      title: 'Eliminar Lugar',
      message: `¿Estás seguro de que deseas eliminar el lugar "${name}"? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });

    if (confirmed) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPlace(null);
  };

  const handleToggleStatus = (id: string) => {
    toggleStatusMutation.mutate(id);
  };

  const getStatusBadge = (status: Place['status']) => {
    const config = {
      active: { label: 'Activo', color: 'bg-ok-50 text-ok-700' },
      inactive: { label: 'Inactivo', color: 'bg-gray-100 text-gray-700' },
    };
    const statusConfig = config[status];
    return (
      <Badge variant={status === 'active' ? 'success' : 'default'} className={statusConfig.color}>
        {statusConfig.label}
      </Badge>
    );
  };

  const getIconComponent = (iconName?: string) => {
    if (!iconName) return MapPin;
    return ICON_MAP[iconName as keyof typeof ICON_MAP] || MapPin;
  };

  const getEventTypeBadge = (eventType: Place['event_type']) => {
    const config = {
      entry: { label: 'Entrada', color: 'bg-info-50 text-info-700' },
      exit: { label: 'Salida', color: 'bg-warn-50 text-warn-700' },
      both: { label: 'Ambos', color: 'bg-purple-50 text-purple-700' },
    };
    const typeConfig = config[eventType];
    return <Badge className={typeConfig.color}>{typeConfig.label}</Badge>;
  };

  const stats = [
    {
      label: 'Total Lugares',
      value: places.length,
      color: 'bg-blue-50 text-blue-700',
    },
    {
      label: 'Activos',
      value: places.filter((p) => p.status === 'active').length,
      color: 'bg-ok-50 text-ok-700',
    },
    {
      label: 'Inactivos',
      value: places.filter((p) => p.status === 'inactive').length,
      color: 'bg-gray-100 text-gray-700',
    },
    {
      label: 'Globales',
      value: places.filter((p) => p.is_global).length,
      color: 'bg-purple-50 text-purple-700',
    },
    {
      label: 'Del Tenant',
      value: places.filter((p) => !p.is_global).length,
      color: 'bg-info-50 text-info-700',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lugares</h1>
          <p className="text-gray-600 mt-1">Gestión de lugares de interés • {filteredPlaces.length} lugares</p>
        </div>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Nuevo Lugar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.label}</p>
                <p className={`text-2xl font-bold mt-1 ${stat.color.split(' ')[1]}`}>{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-full ${stat.color} flex items-center justify-center`}>
                <MapPin className="w-6 h-6" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar por nombre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Todos los tipos</option>
            <option value="global">Globales</option>
            <option value="tenant">Del Tenant</option>
          </select>

          {/* Clear Filters */}
          {(searchQuery || filterStatus !== 'all' || filterType !== 'all') && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setFilterStatus('all');
                setFilterType('all');
              }}
            >
              Limpiar filtros
            </Button>
          )}
        </div>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de lugares</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lugar</TableHead>
                  <TableHead>Coordenadas</TableHead>
                  <TableHead>Radio</TableHead>
                  <TableHead>Tipo de Evento</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Alcance</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlaces.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No se encontraron lugares
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPlaces.map((place) => {
                    const IconComponent = getIconComponent(place.icon);

                    return (
                      <TableRow key={place.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: place.color + '20' }}
                            >
                              <IconComponent className="w-4 h-4" style={{ color: place.color }} />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{place.name}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <MapPin className="w-3 h-3" />
                            <span>
                              {place.lat.toFixed(6)}, {place.lng.toFixed(6)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">{place.radius}m</span>
                        </TableCell>
                        <TableCell>{getEventTypeBadge(place.event_type)}</TableCell>
                        <TableCell>{getStatusBadge(place.status)}</TableCell>
                        <TableCell>
                          {place.is_global ? (
                            <Badge className="bg-purple-50 text-purple-700">
                              <Globe className="w-3 h-3 mr-1" />
                              Global
                            </Badge>
                          ) : (
                            <Badge className="bg-info-50 text-info-700">Tenant</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {user?.role !== 'operator-monitor' && (
                              <>
                                {!place.is_global || user?.role === 'superuser' ? (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleToggleStatus(place.id)}
                                      title={place.status === 'inactive' ? 'Activar' : 'Desactivar'}
                                    >
                                      {place.status === 'inactive' ? 'Activar' : 'Desactivar'}
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEdit(place)}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDelete(place.id, place.name)}
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </>
                                ) : (
                                  <span className="text-xs text-gray-400">Solo lectura</span>
                                )}
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <PlaceFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        place={selectedPlace}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

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
