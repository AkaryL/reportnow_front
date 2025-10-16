import { useState, useEffect } from 'react';
import { X, MapPin, Search } from 'lucide-react';
import { Button } from './ui/Button';
import { useAuth } from '../features/auth/hooks';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';

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
}

export function GeofenceModal({ isOpen, onClose, onSave }: GeofenceModalProps) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3BA2E8');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [radius, setRadius] = useState('500');
  const [address, setAddress] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [useAddress, setUseAddress] = useState(true);
  const [alertType, setAlertType] = useState<'entry' | 'exit' | 'both'>('both');
  const [assignmentType, setAssignmentType] = useState<'global' | 'client'>('global');
  const [selectedClientId, setSelectedClientId] = useState('');

  // Obtener lista de clientes (solo para admin/superuser)
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const response = await apiClient.get('/api/clients');
      return response.data;
    },
    enabled: isOpen && (user?.role === 'admin' || user?.role === 'superuser'),
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'superuser';

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

    const geofenceData: any = {
      name,
      color,
      center: [lat, lng] as [number, number],
      radius: rad,
      alert_type: alertType,
    };

    // Solo admin/superuser puede asignar
    if (isAdmin) {
      if (assignmentType === 'global') {
        geofenceData.is_global = true;
      } else if (assignmentType === 'client' && selectedClientId) {
        geofenceData.client_id = selectedClientId;
        geofenceData.is_global = false;
      }
    }

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
            <h2 className="text-xl font-semibold text-gray-900">Nueva Geocerca</h2>
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
              onClick={() => setUseAddress(true)}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                useAddress
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <MapPin className="w-4 h-4 inline mr-2" />
              Por dirección
            </button>
            <button
              type="button"
              onClick={() => setUseAddress(false)}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                !useAddress
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Search className="w-4 h-4 inline mr-2" />
              Por coordenadas
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

            {useAddress ? (
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
            ) : (
              // Entrada manual de coordenadas
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="latitude" className="block text-sm font-medium text-gray-700 mb-1">
                    Latitud
                  </label>
                  <input
                    id="latitude"
                    type="number"
                    step="any"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    placeholder="Ej: 20.7215"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="longitude" className="block text-sm font-medium text-gray-700 mb-1">
                    Longitud
                  </label>
                  <input
                    id="longitude"
                    type="number"
                    step="any"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    placeholder="Ej: -103.3915"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  />
                </div>
              </div>
            )}

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
                  className={`px-3 py-2 text-sm rounded-lg border-2 transition-colors ${
                    alertType === 'entry'
                      ? 'border-primary bg-primary text-white'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  Solo entrada
                </button>
                <button
                  type="button"
                  onClick={() => setAlertType('exit')}
                  className={`px-3 py-2 text-sm rounded-lg border-2 transition-colors ${
                    alertType === 'exit'
                      ? 'border-primary bg-primary text-white'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  Solo salida
                </button>
                <button
                  type="button"
                  onClick={() => setAlertType('both')}
                  className={`px-3 py-2 text-sm rounded-lg border-2 transition-colors ${
                    alertType === 'both'
                      ? 'border-primary bg-primary text-white'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  Ambas
                </button>
              </div>
            </div>

            {/* Asignación (solo para admin/superuser) */}
            {isAdmin && (
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

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800">
                <strong>Nota:</strong> La geocerca generará alertas cuando un vehículo {
                  alertType === 'entry' ? 'entre en' :
                  alertType === 'exit' ? 'salga de' :
                  'entre o salga de'
                } esta zona.
              </p>
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
                Crear Geocerca
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
