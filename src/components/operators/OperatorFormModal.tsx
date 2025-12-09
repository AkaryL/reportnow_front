import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import type { User } from '../../lib/types';

interface OperatorFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  operator?: User | null;
  isLoading?: boolean;
  clientId: string;
}

export function OperatorFormModal({
  isOpen,
  onClose,
  onSubmit,
  operator,
  isLoading,
  clientId,
}: OperatorFormModalProps) {
  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    username: string;
    password: string;
    phone: string;
    role: 'operator_admin' | 'operator_monitor';
  }>({
    name: '',
    email: '',
    username: '',
    password: '',
    phone: '',
    role: 'operator_admin',
  });

  useEffect(() => {
    if (operator) {
      setFormData({
        name: operator.name,
        email: operator.email || '',
        username: operator.username,
        password: '',
        phone: operator.phone || '',
        role: (operator.role === 'operator_admin' || operator.role === 'operator_monitor')
          ? operator.role
          : 'operator_admin',
      });
    } else {
      setFormData({
        name: '',
        email: '',
        username: '',
        password: '',
        phone: '',
        role: 'operator_admin',
      });
    }
  }, [operator]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      client_id: clientId,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={operator ? 'Editar Operador' : 'Nuevo Operador'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre completo *
          </label>
          <Input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="Juan Pérez"
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
            placeholder="operador@cliente.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Usuario (nombre de usuario para login) *
          </label>
          <Input
            type="text"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            required
            placeholder="jperez"
            disabled={!!operator} // No permitir cambiar username al editar
          />
          {operator && (
            <p className="text-xs text-gray-500 mt-1">
              El nombre de usuario no se puede modificar
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {operator ? 'Nueva Contraseña (opcional)' : 'Contraseña *'}
          </label>
          <Input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required={!operator}
            placeholder={operator ? 'Dejar en blanco para mantener actual' : 'Contraseña'}
          />
          {operator && (
            <p className="text-xs text-gray-500 mt-1">
              Dejar en blanco si no desea cambiar la contraseña
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Teléfono
          </label>
          <Input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+52 33 1234 5678"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de Operador *
          </label>
          <select
            value={formData.role}
            onChange={(e) =>
              setFormData({
                ...formData,
                role: e.target.value as 'operator_admin' | 'operator_monitor',
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white"
            required
          >
            <option value="operator_admin">Operador Administrador</option>
            <option value="operator_monitor">Operador Monitor</option>
          </select>
          <div className="mt-2 space-y-2">
            <div className="text-xs text-gray-600">
              <strong className="text-purple-700">Operador Administrador:</strong> Puede ver, editar y gestionar equipos, activos y configuraciones del cliente.
            </div>
            <div className="text-xs text-gray-600">
              <strong className="text-blue-700">Operador Monitor:</strong> Solo puede ver y monitorear equipos. No puede hacer cambios.
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-800">
            <strong>Nota:</strong> Los operadores solo tendrán acceso a los equipos y datos de este cliente específico.
          </p>
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
            {isLoading ? 'Guardando...' : operator ? 'Actualizar Operador' : 'Crear Operador'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
