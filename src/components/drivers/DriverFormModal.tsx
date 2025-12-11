import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import type { Driver } from '../../lib/types';

interface DriverFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  driver?: Driver | null;
  isLoading?: boolean;
}

export function DriverFormModal({ isOpen, onClose, onSubmit, driver, isLoading }: DriverFormModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    license_number: '',
    license_expiry: '',
    status: 'available' as Driver['status'],
    emergency_phone: '',
    address: '',
  });

  useEffect(() => {
    if (driver) {
      setFormData({
        name: driver.name,
        phone: driver.phone,
        email: driver.email || '',
        license_number: driver.license_number,
        license_expiry: driver.license_expiry,
        status: driver.status,
        emergency_phone: driver.emergency_phone,
        address: driver.address,
      });
    } else {
      setFormData({
        name: '',
        phone: '',
        email: '',
        license_number: '',
        license_expiry: '',
        status: 'available',
        emergency_phone: '',
        address: '',
      });
    }
  }, [driver]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={driver ? 'Editar Conductor' : 'Nuevo Conductor'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nombre Completo *
          </label>
          <Input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="Juan Pérez García"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Número de Licencia *
            </label>
            <Input
              type="text"
              value={formData.license_number}
              onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
              required
              placeholder="ABC123456"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Vencimiento de Licencia *
            </label>
            <Input
              type="date"
              value={formData.license_expiry}
              onChange={(e) => setFormData({ ...formData, license_expiry: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Teléfono *
            </label>
            <Input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
              placeholder="+52 123 456 7890"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Teléfono de Emergencia *
            </label>
            <Input
              type="tel"
              value={formData.emergency_phone}
              onChange={(e) => setFormData({ ...formData, emergency_phone: e.target.value })}
              required
              placeholder="+52 123 456 7890"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email
          </label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="conductor@ejemplo.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Dirección *
          </label>
          <Input
            type="text"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            required
            placeholder="Calle, número, colonia, ciudad"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Estado *
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as Driver['status'] })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
            required
          >
            <option value="available">Disponible</option>
            <option value="on_trip">En viaje</option>
            <option value="inactive">Inactivo</option>
          </select>
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
            {isLoading ? 'Guardando...' : driver ? 'Actualizar' : 'Crear Conductor'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
