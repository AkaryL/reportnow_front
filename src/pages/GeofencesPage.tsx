import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { geofencesApi } from '../features/geofences/api';
import { QUERY_KEYS } from '../lib/constants';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Topbar } from '../components/Topbar';
import { GeofenceModal } from '../components/GeofenceModal';
import { LeafletMap } from '../components/map/LeafletMap';
import { MapPin, Trash2, Edit, Plus, Navigation } from 'lucide-react';
import { apiClient } from '../lib/apiClient';

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
}

export function GeofencesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGeofence, setEditingGeofence] = useState<Geofence | null>(null);
  const [selectedGeofence, setSelectedGeofence] = useState<Geofence | null>(null);
  const [focusedGeofenceId, setFocusedGeofenceId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: geofences = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.GEOFENCES,
    queryFn: geofencesApi.getAll,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/geofences/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GEOFENCES });
      alert('Geocerca eliminada exitosamente');
    },
    onError: () => {
      alert('Error al eliminar la geocerca');
    },
  });

  const handleSaveGeofence = async (geofenceData: { name: string; color: string; center: [number, number]; radius: number }) => {
    try {
      // Convertir el círculo a un polígono aproximado para el backend
      const numPoints = 32;
      const coordinates: [number, number][] = [];
      const [lat, lng] = geofenceData.center;

      const latRadius = geofenceData.radius / 111320;
      const lngRadius = geofenceData.radius / (111320 * Math.cos(lat * Math.PI / 180));

      for (let i = 0; i < numPoints; i++) {
        const angle = (i / numPoints) * 2 * Math.PI;
        const pointLat = lat + latRadius * Math.sin(angle);
        const pointLng = lng + lngRadius * Math.cos(angle);
        coordinates.push([pointLng, pointLat]); // GeoJSON format [lng, lat]
      }

      coordinates.push(coordinates[0]);

      const payload = {
        name: geofenceData.name,
        type: 'zone',
        color: geofenceData.color,
        geom: {
          type: 'Polygon',
          coordinates: [coordinates],
        },
      };

      await apiClient.post('/api/geofences', payload);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GEOFENCES });
      alert('Geocerca creada exitosamente');
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error al crear geocerca:', error);
      alert('Error al crear la geocerca');
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
      {/* Topbar */}
      <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-6">
        <Topbar
          title="Geocercas"
          subtitle="Gestiona las zonas de interés"
        />
      </div>

      <div className="pt-6 space-y-5">
        {/* Header con botón de crear */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Geocercas</h2>
            <p className="text-sm text-gray-600 mt-1">
              {geofences.length} geocerca{geofences.length !== 1 ? 's' : ''} registrada{geofences.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button
            onClick={() => {
              setEditingGeofence(null);
              setIsModalOpen(true);
            }}
            variant="primary"
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nueva Geocerca
          </Button>
        </div>

        {/* Grid: Mapa + Lista */}
        <div className="grid grid-cols-1 lg:grid-cols-[60%_40%] gap-5">
          {/* Mapa */}
          <Card className="h-[600px] p-5">
            <div className="pb-4">
              <h3 className="text-base font-semibold text-gray-900">Mapa de Geocercas</h3>
              <p className="text-xs text-gray-500 mt-1">
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
          </Card>

          {/* Lista de Geocercas */}
          <Card className="h-[600px] p-5">
            <div className="pb-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900">Lista de Geocercas</h3>
            </div>
            <div className="overflow-y-auto h-[calc(100%-60px)] space-y-3 pt-4">
              {geofences.length === 0 ? (
                <div className="text-center py-12">
                  <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No hay geocercas registradas</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Crea tu primera geocerca haciendo clic en "Nueva Geocerca"
                  </p>
                </div>
              ) : (
                geofences.map((geofence: any) => (
                  <div
                    key={geofence.id}
                    className={`p-4 rounded-lg border-2 transition-all cursor-pointer hover:shadow-md ${
                      selectedGeofence?.id === geofence.id
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
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
                          <h4 className="font-semibold text-gray-900 text-sm truncate">
                            {geofence.name}
                          </h4>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-gray-500">
                              Tipo: {geofence.type}
                            </span>
                            <span className="text-xs text-gray-400">
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
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Centrar en mapa"
                        >
                          <Navigation className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(geofence);
                          }}
                          className="p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(geofence.id);
                          }}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {selectedGeofence?.id === geofence.id && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-500">Color:</span>
                            <div className="flex items-center gap-2 mt-1">
                              <div
                                className="w-6 h-6 rounded border border-gray-300"
                                style={{ backgroundColor: geofence.color }}
                              />
                              <span className="font-mono text-gray-700">{geofence.color}</span>
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500">Puntos:</span>
                            <p className="font-semibold text-gray-900 mt-1">
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
          </Card>
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
