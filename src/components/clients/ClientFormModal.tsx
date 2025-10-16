import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { vehiclesApi } from '../../features/vehicles/api';
import { QUERY_KEYS } from '../../lib/constants';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Search, X, Check } from 'lucide-react';
import type { Client } from '../../lib/types';

interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  client?: Client | null;
  isLoading?: boolean;
}

export function ClientFormModal({ isOpen, onClose, onSubmit, client, isLoading }: ClientFormModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    whatsapp: '',
    password: '',
  });

  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [showVehiclePicker, setShowVehiclePicker] = useState(false);

  const { data: vehicles = [] } = useQuery({
    queryKey: QUERY_KEYS.VEHICLES,
    queryFn: vehiclesApi.getAll,
  });

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name,
        email: client.email,
        phone: client.phone,
        whatsapp: (client as any).whatsapp || '',
        password: '',
      });
      // TODO: Load assigned vehicles for this client
      setSelectedVehicles([]);
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        whatsapp: '',
        password: '',
      });
      setSelectedVehicles([]);
    }
  }, [client]);

  const filteredVehicles = vehicles.filter((v) =>
    v.plate.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
    v.driver.toLowerCase().includes(vehicleSearch.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      vehicle_ids: selectedVehicles,
    });
  };

  const toggleVehicle = (vehicleId: string) => {
    setSelectedVehicles((prev) =>
      prev.includes(vehicleId)
        ? prev.filter((id) => id !== vehicleId)
        : [...prev, vehicleId]
    );
  };

  const getSelectedVehiclesInfo = () => {
    return vehicles.filter((v) => selectedVehicles.includes(v.id));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={client ? 'Editar Cliente' : 'Nuevo Cliente'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre del Cliente *
          </label>
          <Input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="Ej: Coca-Cola, Barcel, etc."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            placeholder="contacto@cliente.com"
          />
          <p className="text-xs text-gray-500 mt-1">
            Se usará como nombre de usuario para iniciar sesión
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {client ? 'Nueva Contraseña (opcional)' : 'Contraseña *'}
          </label>
          <Input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required={!client}
            placeholder={client ? 'Dejar en blanco para mantener actual' : 'Por defecto: 123'}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono *
            </label>
            <Input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
              placeholder="+52 33 1234 5678"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              WhatsApp
            </label>
            <Input
              type="tel"
              value={formData.whatsapp}
              onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
              placeholder="+523312345678"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Vehículos Asignados ({selectedVehicles.length})
          </label>

          {/* Selected Vehicles */}
          {selectedVehicles.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {getSelectedVehiclesInfo().map((vehicle) => (
                <Badge key={vehicle.id} variant="default" className="flex items-center gap-1">
                  {vehicle.plate}
                  <button
                    type="button"
                    onClick={() => toggleVehicle(vehicle.id)}
                    className="ml-1 hover:text-crit-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {/* Vehicle Picker */}
          <div className="border border-gray-300 rounded-md p-3">
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar vehículos por placa o conductor..."
                value={vehicleSearch}
                onChange={(e) => {
                  setVehicleSearch(e.target.value);
                  setShowVehiclePicker(true);
                }}
                onFocus={() => setShowVehiclePicker(true)}
                className="pl-9"
              />
            </div>

            {showVehiclePicker && (
              <div className="max-h-48 overflow-y-auto space-y-1">
                {filteredVehicles.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-2">
                    No se encontraron vehículos
                  </p>
                ) : (
                  filteredVehicles.map((vehicle) => {
                    const isSelected = selectedVehicles.includes(vehicle.id);
                    return (
                      <div
                        key={vehicle.id}
                        onClick={() => toggleVehicle(vehicle.id)}
                        className={`p-2 rounded cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-primary-50 border border-primary-200'
                            : 'hover:bg-gray-50 border border-transparent'
                        }`}
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">{vehicle.plate}</p>
                          <p className="text-xs text-gray-500">{vehicle.driver}</p>
                        </div>
                        {isSelected && (
                          <Check className="w-4 h-4 text-primary-600" />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {selectedVehicles.length === 0 && (
            <p className="text-xs text-gray-500 mt-1">
              Este cliente no tendrá vehículos asignados
            </p>
          )}
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="flex-1"
            disabled={isLoading}
          >
            {isLoading ? 'Guardando...' : client ? 'Actualizar Cliente' : 'Crear Cliente'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
