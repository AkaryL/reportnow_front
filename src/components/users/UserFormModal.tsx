import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { clientsApi } from '../../features/clients/api';
import { QUERY_KEYS } from '../../lib/constants';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
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
    role: 'operator-monitor' as 'superuser' | 'admin' | 'operator-admin' | 'operator-monitor',
    email: '',
    client_id: '',
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
    } else {
      setFormData({
        username: '',
        password: '',
        name: '',
        role: 'operator-monitor',
        email: '',
        client_id: '',
      });
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      // Los operadores no tienen vehículos asignados específicamente
      // Tienen acceso a todos los equipos del cliente
    });
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
            <option value="operator-monitor">Operador Monitor (Solo lectura)</option>
            <option value="operator-admin">Operador Administrador</option>
            {currentUser?.role === 'superuser' && (
              <>
                <option value="admin">Administrador (Cliente)</option>
                <option value="superuser">Superusuario</option>
              </>
            )}
          </select>
        </div>

        {(formData.role === 'admin' || formData.role === 'operator-admin' || formData.role === 'operator-monitor') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cliente *
            </label>
            <select
              value={formData.client_id}
              onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              required
            >
              <option value="">Seleccionar cliente</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.company_name}
                </option>
              ))}
            </select>
          </div>
        )}

        {(formData.role === 'operator-admin' || formData.role === 'operator-monitor') && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800">
              <strong>Nota:</strong> Los operadores tendrán acceso a todos los equipos y activos asignados al cliente.
              {formData.role === 'operator-monitor' && ' Los operadores monitor solo podrán visualizar la información, sin permisos de edición.'}
            </p>
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
