import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { geofencesApi } from '../features/geofences/api';
import { clientsApi } from '../features/clients/api';
import { QUERY_KEYS } from '../lib/constants';
import { Card } from '../components/ui/Card';
import { ClientCard } from '../components/ui/ClientCard';
import { Button } from '../components/ui/Button';
import { ClientButton } from '../components/ui/ClientButton';
import { Topbar } from '../components/Topbar';
import { GeofenceModal } from '../components/GeofenceModal';
import { LeafletMap } from '../components/map/LeafletMap';
import { MapPin, Trash2, Edit, Plus, Navigation, Filter } from 'lucide-react';
import { useAuth } from '../features/auth/hooks';

interface Geofence {
  id: string;
  name: string;
  type: string;
  color: string;
  geom: {
    type: string;
    coordinates: number[][][];
  };
  created_at: string;
  permission?: string;
}

export function GeofencesPage() {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGeofence, setEditingGeofence] = useState<Geofence | null>(null);
  const [selectedGeofence, setSelectedGeofence] = useState<Geofence | null>(null);
  const [focusedGeofenceId, setFocusedGeofenceId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'own' | 'assigned' | 'all'>('own');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const queryClient = useQueryClient();

  const isAdmin = user?.role === 'admin' || user?.role === 'superuser';
  const isClient = user?.role === 'client';

  // Componentes condicionales para glassmorphism
  const CardComponent = isClient ? ClientCard : Card;
  const ButtonComponent = isClient ? ClientButton : Button;

  // Obtener lista de clientes (solo para admin/superuser)
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsApi.getAll(),
    enabled: isAdmin,
  });

  const { data: geofences = [], isLoading } = useQuery({
    queryKey: ['geofences', filter, selectedClientId],
    queryFn: async () => {
      // For mock API, we just get all geofences and filter client-side
      const allGeofences = await geofencesApi.getAll();

      // Filter based on user role and selections
      if (selectedClientId) {
        return allGeofences.filter(g =>
          g.is_global || g.client_id === selectedClientId
        );
      }

      // For clients, show their own + global geofences
      if (isClient && user?.id) {
        if (filter === 'own') {
          return allGeofences.filter(g => g.client_id === user.id && !g.is_global);
        } else if (filter === 'assigned') {
          return allGeofences.filter(g => g.client_id !== user.id && g.is_global);
        }
        return allGeofences.filter(g => g.is_global || g.client_id === user.id);
      }

      return allGeofences;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => geofencesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GEOFENCES });
      alert('Geocerca eliminada exitosamente');
    },
    onError: () => {
      alert('Error al eliminar la geocerca');
    },
  });

  const handleSaveGeofence = async (geofenceData: {
    name: string;
    color: string;
    center: [number, number];
    radius: number;
    alert_type: 'entry' | 'exit' | 'both';
    is_global?: boolean;
    client_id?: string;
  }) => {
    try {
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
        is_global: geofenceData.is_global,
        client_id: geofenceData.client_id,
      };

      await geofencesApi.create(geofence);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GEOFENCES });
      alert('Geocerca creada exitosamente');
      setIsModalOpen(false);
    } catch (error: any) {
      console.error('Error al crear geocerca:', error);
      const errorMessage = error.message || 'Error al crear la geocerca';
      alert(errorMessage);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta geocerca?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (geofence: Geofence) => {
    setEditingGeofence(geofence);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* Topbar - solo para admin/superuser */}
      {!isClient && (
        <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-6">
          <Topbar
            title="Geocercas"
            subtitle="Gestiona las zonas de interés"
          />
        </div>
      )}

      <div className={isClient ? 'space-y-5' : 'pt-6 space-y-5'}>
        {/* Header para cliente */}
        {isClient && (
          <div className="mb-6">
            <h1 className="client-heading text-3xl mb-2">Geocercas</h1>
            <p className="client-subheading">Gestiona tus zonas de interés</p>
          </div>
        )}

        {/* Header con botón de crear */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              {!isClient && (
                <>
                  <h2 className="text-2xl font-bold text-gray-900">Geocercas</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {geofences.length} geocerca{geofences.length !== 1 ? 's' : ''} registrada{geofences.length !== 1 ? 's' : ''}
                  </p>
                </>
              )}
              {isClient && (
                <p className="client-text-secondary text-sm">
                  {geofences.length} geocerca{geofences.length !== 1 ? 's' : ''} registrada{geofences.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            <ButtonComponent
              onClick={() => {
                setEditingGeofence(null);
                setIsModalOpen(true);
              }}
              variant={isClient ? 'primary' : 'primary'}
              className={`flex items-center gap-2 ${isClient ? '' : ''}`}
            >
              <Plus className="w-4 h-4" />
              Nueva Geocerca
            </ButtonComponent>
          </div>

          {/* Filtros */}
          <CardComponent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className={`w-4 h-4 ${isClient ? 'text-cyan-400' : 'text-gray-600'}`} />
              <span className={`text-sm font-medium ${isClient ? 'client-text-primary' : 'text-gray-700'}`}>Filtros</span>
            </div>

            <div className="space-y-3">
              {/* Filtro de tipo */}
              {!isAdmin ? (
                <div className="flex gap-2">
                  <ButtonComponent
                    variant={filter === 'own' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setFilter('own')}
                  >
                    Propias
                  </ButtonComponent>
                  <ButtonComponent
                    variant={filter === 'assigned' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setFilter('assigned')}
                  >
                    Asignadas
                  </ButtonComponent>
                  <ButtonComponent
                    variant={filter === 'all' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setFilter('all')}
                  >
                    Todas
                  </ButtonComponent>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Selector de cliente para admin */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ver geocercas de:
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={selectedClientId}
                        onChange={(e) => {
                          setSelectedClientId(e.target.value);
                          setFilter('all');
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                      >
                        <option value="">Solo geocercas globales</option>
                        {clients.map((client: any) => (
                          <option key={client.id} value={client.id}>
                            {client.name}
                          </option>
                        ))}
                      </select>
                      {selectedClientId && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedClientId('')}
                        >
                          Limpiar
                        </Button>
                      )}
                    </div>
                    {selectedClientId && (
                      <p className="text-xs text-gray-500 mt-2">
                        Mostrando geocercas del cliente seleccionado + geocercas globales
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardComponent>
        </div>

        {/* Grid: Mapa + Lista */}
        <div className="grid grid-cols-1 lg:grid-cols-[60%_40%] gap-5">
          {/* Mapa */}
          <CardComponent className="h-[600px] p-5">
            <div className="pb-4">
              <h3 className={`text-base font-semibold ${isClient ? 'client-heading' : 'text-gray-900'}`}>Mapa de Geocercas</h3>
              <p className={`text-xs mt-1 ${isClient ? 'client-text-tertiary' : 'text-gray-500'}`}>
                Visualiza todas las geocercas en el mapa
              </p>
            </div>
            <div className="h-[calc(100%-70px)]">
              <LeafletMap
                vehicles={[]}
                geofences={geofences}
                onVehicleClick={() => {}}
                showGeofences={true}
                focusGeofenceId={focusedGeofenceId}
              />
            </div>
          </CardComponent>

          {/* Lista de Geocercas */}
          <CardComponent className="h-[600px] p-5">
            <div className={`pb-4 ${isClient ? '' : 'border-b border-gray-200'}`}>
              <h3 className={`text-base font-semibold ${isClient ? 'client-heading' : 'text-gray-900'}`}>Lista de Geocercas</h3>
            </div>
            <div className="overflow-y-auto h-[calc(100%-60px)] space-y-3 pt-4">
              {geofences.length === 0 ? (
                <div className="text-center py-12">
                  <MapPin className={`w-12 h-12 mx-auto mb-3 ${isClient ? 'text-white/30' : 'text-gray-300'}`} />
                  <p className={`text-sm ${isClient ? 'client-text-secondary' : 'text-gray-500'}`}>No hay geocercas registradas</p>
                  <p className={`text-xs mt-1 ${isClient ? 'client-text-tertiary' : 'text-gray-400'}`}>
                    Crea tu primera geocerca haciendo clic en "Nueva Geocerca"
                  </p>
                </div>
              ) : (
                geofences.map((geofence: any) => (
                  <div
                    key={geofence.id}
                    className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                      isClient
                        ? selectedGeofence?.id === geofence.id
                          ? 'border-cyan-500/50 bg-white/10'
                          : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                        : selectedGeofence?.id === geofence.id
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }`}
                    onClick={() => setSelectedGeofence(geofence)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        {/* Color indicator */}
                        <div
                          className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0 mt-0.5"
                          style={{ backgroundColor: geofence.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className={`font-semibold text-sm truncate ${isClient ? 'client-text-primary' : 'text-gray-900'}`}>
                            {geofence.name}
                          </h4>
                          <div className="flex items-center gap-3 mt-1">
                            <span className={`text-xs ${isClient ? 'client-text-secondary' : 'text-gray-500'}`}>
                              Tipo: {geofence.type}
                            </span>
                            <span className={`text-xs ${isClient ? 'client-text-tertiary' : 'text-gray-400'}`}>
                              {new Date(geofence.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setFocusedGeofenceId(geofence.id);
                          }}
                          className={`p-2 rounded-lg transition-colors ${
                            isClient
                              ? 'text-cyan-400 hover:text-cyan-300 hover:bg-white/5'
                              : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
                          }`}
                          title="Centrar en mapa"
                        >
                          <Navigation className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(geofence);
                          }}
                          className={`p-2 rounded-lg transition-colors ${
                            isClient
                              ? 'text-cyan-400 hover:text-cyan-300 hover:bg-white/5'
                              : 'text-gray-500 hover:text-primary hover:bg-primary/10'
                          }`}
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(geofence.id);
                          }}
                          className={`p-2 rounded-lg transition-colors ${
                            isClient
                              ? 'text-red-400 hover:text-red-300 hover:bg-white/5'
                              : 'text-gray-500 hover:text-red-600 hover:bg-red-50'
                          }`}
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {selectedGeofence?.id === geofence.id && (
                      <div className={`mt-3 pt-3 ${isClient ? 'border-t border-white/10' : 'border-t border-gray-200'}`}>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className={isClient ? 'client-text-secondary' : 'text-gray-500'}>Color:</span>
                            <div className="flex items-center gap-2 mt-1">
                              <div
                                className="w-6 h-6 rounded border border-gray-300"
                                style={{ backgroundColor: geofence.color }}
                              />
                              <span className={`font-mono ${isClient ? 'client-text-primary' : 'text-gray-700'}`}>{geofence.color}</span>
                            </div>
                          </div>
                          <div>
                            <span className={isClient ? 'client-text-secondary' : 'text-gray-500'}>Puntos:</span>
                            <p className={`font-semibold mt-1 ${isClient ? 'client-text-primary' : 'text-gray-900'}`}>
                              {geofence.geom?.coordinates?.[0]?.length || 0}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardComponent>
        </div>
      </div>

      {/* Modal */}
      <GeofenceModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingGeofence(null);
        }}
        onSave={handleSaveGeofence}
      />
    </div>
  );
}
