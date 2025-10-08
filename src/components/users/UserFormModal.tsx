import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { vehiclesApi } from '../../features/vehicles/api';
import { clientsApi } from '../../features/clients/api';
import { QUERY_KEYS } from '../../lib/constants';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Search, X, Check } from 'lucide-react';
import type { UserWithVehicles } from '../../features/users/api';
import { useAuth } from '../../features/auth/hooks';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  user?: UserWithVehicles | null;
  isLoading?: boolean;
}

export function UserFormModal({ isOpen, onClose, onSubmit, user, isLoading }: UserFormModalProps) {
  const { user: currentUser } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'client' as 'superuser' | 'admin' | 'client',
    email: '',
    client_id: '',
  });

  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [showVehiclePicker, setShowVehiclePicker] = useState(false);

  const { data: vehicles = [] } = useQuery({
    queryKey: QUERY_KEYS.VEHICLES,
    queryFn: vehiclesApi.getAll,
    enabled: formData.role === 'client',
  });

  const { data: clients = [] } = useQuery({
    queryKey: QUERY_KEYS.CLIENTS,
    queryFn: clientsApi.getAll,
  });

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        password: '',
        name: user.name,
        role: user.role as any,
        email: user.email || '',
        client_id: user.client_id || '',
      });
      if (user.vehicles) {
        setSelectedVehicles(user.vehicles.map((v: any) => v.id));
      }
    } else {
      setFormData({
        username: '',
        password: '',
        name: '',
        role: 'client',
        email: '',
        client_id: '',
      });
      setSelectedVehicles([]);
    }
  }, [user]);

  const filteredVehicles = vehicles.filter((v) =>
    v.plate.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
    v.driver.toLowerCase().includes(vehicleSearch.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      vehicle_ids: formData.role === 'client' ? selectedVehicles : undefined,
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
      title={user ? 'Editar Usuario' : 'Nuevo Usuario'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Usuario *
          </label>
          <Input
            type="text"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            required
            disabled={!!user}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {user ? 'Nueva Contraseña (opcional)' : 'Contraseña *'}
          </label>
          <Input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required={!user}
            placeholder={user ? 'Dejar en blanco para mantener actual' : ''}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre Completo *
          </label>
          <Input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rol *
          </label>
          <select
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            required
          >
            <option value="client">Cliente</option>
            {currentUser?.role === 'superuser' && (
              <>
                <option value="admin">Administrador</option>
                <option value="superuser">Super Usuario</option>
              </>
            )}
          </select>
        </div>

        {formData.role === 'client' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cliente
            </label>
            <select
              value={formData.client_id}
              onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Sin cliente asignado</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {formData.role === 'client' && (
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
                Este usuario no tendrá acceso a ningún vehículo
              </p>
            )}
          </div>
        )}

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
            {isLoading ? 'Guardando...' : user ? 'Actualizar' : 'Crear Usuario'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
