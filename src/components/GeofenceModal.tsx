import { useState } from 'react';
import { X, MapPin, Search } from 'lucide-react';
import { Button } from './ui/Button';

interface GeofenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (geofence: { name: string; color: string; center: [number, number]; radius: number }) => void;
}

export function GeofenceModal({ isOpen, onClose, onSave }: GeofenceModalProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3BA2E8');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [radius, setRadius] = useState('500');
  const [address, setAddress] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [useAddress, setUseAddress] = useState(true);

  if (!isOpen) return null;

  const handleSearchAddress = async () => {
    if (!address.trim()) {
      setSearchError('Por favor ingresa una dirección');
      return;
    }

    setIsSearching(true);
    setSearchError('');

    try {
      // Usar Nominatim de OpenStreetMap para geocodificación
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
        {
          headers: {
            'User-Agent': 'FleetWatch App',
          },
        }
      );

      const data = await response.json();

      if (data && data.length > 0) {
        const location = data[0];
        setLatitude(location.lat);
        setLongitude(location.lon);
        setSearchError('');
        alert(`📍 Ubicación encontrada: ${location.display_name}`);
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

    onSave({
      name,
      color,
      center: [lat, lng],
      radius: rad,
    });

    // Limpiar formulario
    setName('');
    setColor('#3BA2E8');
    setLatitude('');
    setLongitude('');
    setRadius('500');
    setAddress('');
    setSearchError('');
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
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6 z-[9999]">
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

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800">
                <strong>Nota:</strong> {useAddress
                  ? 'Ingresa una dirección y haz clic en "Buscar" para obtener las coordenadas automáticamente.'
                  : 'La geocerca se creará como un círculo con el centro en las coordenadas especificadas y el radio indicado.'}
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
