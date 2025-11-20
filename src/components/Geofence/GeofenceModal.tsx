import { useState, useEffect, useRef } from 'react';
import { X, MapPin, Search, Map } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../../features/auth/hooks';
import { useQuery } from '@tanstack/react-query';
import { clientsApi } from '../../features/clients/api';
import L from 'leaflet';
import { PolygonDrawMap } from '../map/PolygonDrawMap';
import { longFormatters } from 'date-fns';

interface GeofenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (geofence: {
    name: string;
    color: string;
    center: [number, number];
    radius: number;
    alert_type: 'entry' | 'exit' | 'both';
    is_global?: boolean;
    client_id?: string;
  }) => void;
  defaultClientId?: string;
  editingGeofence?: any;
}

export function GeofenceModal({ isOpen, onClose, onSave, defaultClientId, editingGeofence }: GeofenceModalProps) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3BA2E8');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [radius, setRadius] = useState('500');
  const [address, setAddress] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [selectedTab, setSelectedTab] = useState<'address' | 'coordinates' | 'map'>('address');
  const [alertType, setAlertType] = useState<'entry' | 'exit' | 'both'>('both');
  const [assignmentType, setAssignmentType] = useState<'global' | 'client'>('global');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [mapSelectedLocation, setMapSelectedLocation] = useState<[number, number] | null>(null);
  const [polygonCoordinates, setPolygonCoordinates] = useState<[number, number][]>([]);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Circle | null>(null);

  // Obtener lista de clientes (solo para superuser)
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsApi.getAll(),
    enabled: isOpen && user?.role === 'superuser',
  });

  const isSuperuser = user?.role === 'superuser';
  const isAdmin = user?.role === 'admin';

  // Pre-seleccionar el cliente si se pasa defaultClientId
  useEffect(() => {
    if (isOpen && defaultClientId) {
      setAssignmentType('client');
      setSelectedClientId(defaultClientId);
    }
  }, [isOpen, defaultClientId]);

  // Cargar datos de geocerca cuando se está editando
  useEffect(() => {
    if (isOpen && editingGeofence) {
      setName(editingGeofence.name || '');
      setColor(editingGeofence.color || '#3BA2E8');

      // Extraer coordenadas del geom
      if (editingGeofence.geom && editingGeofence.geom.coordinates) {
        const coords = editingGeofence.geom.coordinates[0][0];
        if (coords && coords.length >= 2) {
          setLongitude(String(coords[0]));
          setLatitude(String(coords[1]));
        }
      }

      // El radio no está almacenado en el mock actual, usar default
      setRadius('500');

      // Cargar tipo de alerta si existe
      if (editingGeofence.alert_type) {
        setAlertType(editingGeofence.alert_type);
      }

      // Si hay defaultClientId, forzar asignación a cliente
      if (defaultClientId) {
        setAssignmentType('client');
        setSelectedClientId(defaultClientId);
      } else {
        // Cargar tipo de asignación normal
        if (editingGeofence.is_global) {
          setAssignmentType('global');
        } else if (editingGeofence.client_id) {
          setAssignmentType('client');
          setSelectedClientId(editingGeofence.client_id);
        }
      }
    } else if (isOpen && !editingGeofence) {
      // Limpiar formulario al abrir para crear nueva geocerca
      setName('');
      setColor('#3BA2E8');
      setLatitude('');
      setLongitude('');
      setRadius('500');
      setAddress('');
      setAlertType('both');
      setSelectedTab('address');
      setMapSelectedLocation(null);
      setPolygonCoordinates([]);

      // Si hay defaultClientId, forzar asignación a cliente
      if (defaultClientId) {
        setAssignmentType('client');
        setSelectedClientId(defaultClientId);
      } else {
        setAssignmentType('global');
        setSelectedClientId('');
      }
    }
  }, [isOpen, editingGeofence, defaultClientId]);

  // Initialize map when tab changes to map
  useEffect(() => {
    if (selectedTab === 'map' && mapContainerRef.current && !mapInstanceRef.current && isOpen) {
      // Small timeout to ensure container is rendered
      setTimeout(() => {
        if (!mapContainerRef.current) return;

        const map = L.map(mapContainerRef.current, {
          center: [20.7167, -103.3830], // Zapopan, Jalisco
          zoom: 13,
          zoomControl: true,
          attributionControl: false,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
        }).addTo(map);

        // Add click handler
        map.on('click', (e: L.LeafletMouseEvent) => {
          const { lat, lng } = e.latlng;
          setMapSelectedLocation([lat, lng]);
          setLatitude(lat.toString());
          setLongitude(lng.toString());

          // Remove existing marker
          if (markerRef.current) {
            markerRef.current.remove();
          }

          // Add new marker
          const rad = parseFloat(radius) || 500;
          markerRef.current = L.circle([lat, lng], {
            radius: rad,
            color: color,
            fillColor: color,
            fillOpacity: 0.2,
            weight: 2,
          }).addTo(map);

          markerRef.current.bindPopup(`
            <div class="p-2">
              <div class="text-sm font-semibold">${name || 'Nueva Geocerca'}</div>
              <div class="text-xs text-gray-600 mt-1">Radio: ${rad}m</div>
            </div>
          `).openPopup();
        });

        mapInstanceRef.current = map;
      }, 100);
    }

    // Cleanup when modal closes or tab changes
    return () => {
      if (selectedTab !== 'map' && mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [selectedTab, isOpen]);

  // Update marker when radius or color changes
  useEffect(() => {
    if (mapSelectedLocation && markerRef.current && mapInstanceRef.current) {
      markerRef.current.remove();

      const rad = parseFloat(radius) || 500;
      markerRef.current = L.circle(mapSelectedLocation, {
        radius: rad,
        color: color,
        fillColor: color,
        fillOpacity: 0.2,
        weight: 2,
      }).addTo(mapInstanceRef.current);

      markerRef.current.bindPopup(`
        <div class="p-2">
          <div class="text-sm font-semibold">${name || 'Nueva Geocerca'}</div>
          <div class="text-xs text-gray-600 mt-1">Radio: ${rad}m</div>
        </div>
      `);
    }
  }, [radius, color, name, mapSelectedLocation]);

  if (!isOpen) return null;

  const handleSearchAddress = async () => {
    if (!address.trim()) {
      setSearchError('Por favor ingresa una dirección');
      return;
    }

    setIsSearching(true);
    setSearchError('');

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
        {
          headers: {
            'User-Agent': 'ReportNow App',
          },
        }
      );

      const data = await response.json();

      if (data && data.length > 0) {
        const location = data[0];
        setLatitude(location.lat);
        setLongitude(location.lon);
        setSearchError('');
      } else {
        setSearchError('No se encontró la dirección. Intenta ser más específico.');
      }
    } catch (error) {
      console.error('Error al buscar dirección:', error);
      setSearchError('Error al buscar la dirección. Intenta de nuevo.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const geofenceData: any = {
      name,
      color,
      alert_type: alertType,
      creation_mode: selectedTab, // 'address', 'coordinates' o 'map'
    };

    // Manejo diferenciado según el tab seleccionado
    if (selectedTab === 'coordinates') {
      // Geocerca de tipo polígono
      if (polygonCoordinates.length < 3) {
        alert('Debes crear un polígono con al menos 3 puntos');
        return;
      }

      // Enviar coordenadas en formato array directo [lat, lng]
      geofenceData.polygon_coordinates = polygonCoordinates;

      // Calcular centro del polígono (promedio de todas las coordenadas)
      const centerLat = polygonCoordinates.reduce((sum, coord) => sum + coord[0], 0) / polygonCoordinates.length;
      const centerLng = polygonCoordinates.reduce((sum, coord) => sum + coord[1], 0) / polygonCoordinates.length;

      geofenceData.center = [centerLat, centerLng] as [number, number];
      geofenceData.radius = null;
    } else {
      // Geocerca de tipo círculo (tabs: address o map)
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      const rad = parseFloat(radius);

      // Validar que los valores sean números válidos
      if (isNaN(lat) || isNaN(lng) || isNaN(rad)) {
        alert('Por favor ingresa valores numéricos válidos');
        return;
      }

      // Validar rangos razonables
      if (lat < -90 || lat > 90) {
        alert('La latitud debe estar entre -90 y 90');
        return;
      }

      if (lng < -180 || lng > 180) {
        alert('La longitud debe estar entre -180 y 180');
        return;
      }

      if (rad <= 0) {
        alert('El radio debe ser mayor a 0');
        return;
      }

      geofenceData.center = [lat, lng] as [number, number];
      geofenceData.radius = rad;
      geofenceData.polygon_coordinates = null;
    }

    // Asignación según rol
    if (isSuperuser) {
      // Superuser puede elegir entre global o cliente específico
      if (assignmentType === 'global') {
        geofenceData.is_global = true;
      } else if (assignmentType === 'client' && selectedClientId) {
        geofenceData.client_id = selectedClientId;
        geofenceData.is_global = false;
      }
    } else if (isAdmin && user?.client_id) {
      // Admin solo puede crear para su propio cliente
      geofenceData.client_id = user.client_id;
      geofenceData.is_global = false;
    }

    console.log("Si llegaaa", geofenceData);
    onSave(geofenceData);

    // Limpiar formulario
    setName('');
    setColor('#3BA2E8');
    setLatitude('');
    setLongitude('');
    setRadius('500');
    setAddress('');
    setSearchError('');
    setAlertType('both');
    setAssignmentType('global');
    setSelectedClientId('');
    setSelectedTab('address');
    setMapSelectedLocation(null);
    setPolygonCoordinates([]);

    // Clean up map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    }

    onClose();
  };

  const handleClose = () => {
    setName('');
    setColor('#3BA2E8');
    setLatitude('');
    setLongitude('');
    setRadius('500');
    setAddress('');
    setSearchError('');
    setAlertType('both');
    setAssignmentType('global');
    setSelectedClientId('');
    setSelectedTab('address');
    setMapSelectedLocation(null);
    setPolygonCoordinates([]);

    // Clean up map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Overlay */}
        <div
          className="fixed inset-0 bg-black/50 transition-opacity z-[9998]"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full p-6 z-[9999] max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {editingGeofence ? 'Editar Geocerca' : 'Nueva Geocerca'}
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-4 border-b border-gray-200">
            <button
              type="button"
              onClick={() => setSelectedTab('address')}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                selectedTab === 'address'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <MapPin className="w-4 h-4 inline mr-2" />
              Por dirección
            </button>
            <button
              type="button"
              onClick={() => setSelectedTab('coordinates')}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                selectedTab === 'coordinates'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Search className="w-4 h-4 inline mr-2" />
              Por coordenadas
            </button>
            <button
              type="button"
              onClick={() => setSelectedTab('map')}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                selectedTab === 'map'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Map className="w-4 h-4 inline mr-2" />
              Seleccionar en mapa
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de la geocerca
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Zona Industrial"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
              />
            </div>

            {selectedTab === 'address' ? (
              // Búsqueda por dirección
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección
                </label>
                <div className="flex gap-2">
                  <input
                    id="address"
                    type="text"
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      setSearchError('');
                    }}
                    placeholder="Ej: Av. Chapultepec 480, Guadalajara, Jalisco"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  />
                  <Button
                    type="button"
                    onClick={handleSearchAddress}
                    disabled={isSearching}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    {isSearching ? (
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                    Buscar
                  </Button>
                </div>
                {searchError && (
                  <p className="text-xs text-red-600 mt-1">{searchError}</p>
                )}
                {latitude && longitude && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-800">
                    ✓ Coordenadas encontradas: {parseFloat(latitude).toFixed(4)}, {parseFloat(longitude).toFixed(4)}
                  </div>
                )}
              </div>
            ) : selectedTab === 'coordinates' ? (
              // Dibujo de polígono por coordenadas
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dibuja la geocerca en el mapa
                </label>
                <PolygonDrawMap
                  onPolygonComplete={(coords) => setPolygonCoordinates(coords)}
                  color={color}
                  initialCoordinates={polygonCoordinates}
                />
              </div>
            ) : (
              // Selección en mapa
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Haz clic en el mapa para seleccionar la ubicación
                </label>
                <div
                  ref={mapContainerRef}
                  className="w-full h-[300px] rounded-lg border border-gray-300"
                />
                {mapSelectedLocation && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-800">
                    ✓ Ubicación seleccionada: {mapSelectedLocation[0].toFixed(4)}, {mapSelectedLocation[1].toFixed(4)}
                  </div>
                )}
              </div>
            )}

            {/* Radio solo para círculos (tabs: address y map) */}
            {selectedTab !== 'coordinates' && (
              <div>
                <label htmlFor="radius" className="block text-sm font-medium text-gray-700 mb-1">
                  Radio (metros)
                </label>
                <input
                  id="radius"
                  type="number"
                  value={radius}
                  onChange={(e) => setRadius(e.target.value)}
                  placeholder="Ej: 500"
                  required
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                />
              </div>
            )}

            <div>
              <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">
                Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="color"
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
                />
                <span className="text-sm text-gray-600">{color}</span>
              </div>
            </div>

            {/* Tipo de Alerta */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de alerta
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setAlertType('entry')}
                  className={`px-3 py-2 text-sm font-medium rounded-lg border-2 transition-colors ${
                    alertType === 'entry'
                      ? 'border-primary-600 bg-primary-600 text-white'
                      : 'border-gray-300 bg-white text-gray-900 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                >
                  Solo entrada
                </button>
                <button
                  type="button"
                  onClick={() => setAlertType('exit')}
                  className={`px-3 py-2 text-sm font-medium rounded-lg border-2 transition-colors ${
                    alertType === 'exit'
                      ? 'border-primary-600 bg-primary-600 text-white'
                      : 'border-gray-300 bg-white text-gray-900 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                >
                  Solo salida
                </button>
                <button
                  type="button"
                  onClick={() => setAlertType('both')}
                  className={`px-3 py-2 text-sm font-medium rounded-lg border-2 transition-colors ${
                    alertType === 'both'
                      ? 'border-primary-600 bg-primary-600 text-white'
                      : 'border-gray-300 bg-white text-gray-900 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                >
                  Ambas
                </button>
              </div>
            </div>

            {/* Asignación (solo para superuser y cuando no hay defaultClientId) */}
            {isSuperuser && !defaultClientId && (
              <div className="border-t border-gray-200 pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Asignación
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={assignmentType === 'global'}
                      onChange={() => setAssignmentType('global')}
                      className="w-4 h-4 text-primary"
                    />
                    <span className="text-sm">Global (visible para todos)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={assignmentType === 'client'}
                      onChange={() => setAssignmentType('client')}
                      className="w-4 h-4 text-primary"
                    />
                    <span className="text-sm">Asignar a cliente específico</span>
                  </label>
                </div>

                {assignmentType === 'client' && (
                  <div className="mt-3">
                    <label htmlFor="client" className="block text-sm font-medium text-gray-700 mb-1">
                      Seleccionar cliente
                    </label>
                    <select
                      id="client"
                      value={selectedClientId}
                      onChange={(e) => setSelectedClientId(e.target.value)}
                      required={assignmentType === 'client'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                    >
                      <option value="">Selecciona un cliente...</option>
                      {clients.map((client: any) => (
                        <option key={client.id} value={client.id}>
                          {client.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
              <p className="text-xs text-blue-800">
                <strong>Nota:</strong> La geocerca generará alertas cuando un vehículo {
                  alertType === 'entry' ? 'entre en' :
                  alertType === 'exit' ? 'salga de' :
                  'entre o salga de'
                } esta zona.
              </p>
              {isAdmin && (
                <p className="text-xs text-blue-800">
                  <strong>Info:</strong> Esta geocerca se creará automáticamente para tu cliente.
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="flex-1"
              >
                {editingGeofence ? 'Actualizar Geocerca' : 'Crear Geocerca'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
