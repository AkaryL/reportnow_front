import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import type { Place } from '../../lib/types';
import { PLACE_ICONS } from '../../lib/types';

interface PlaceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  place?: Place | null;
  isLoading?: boolean;
}

export function PlaceFormModal({ isOpen, onClose, onSubmit, place, isLoading }: PlaceFormModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    lat: '',
    lng: '',
    address: '',
    radius: '100',
    color: '#3b82f6',
    icon: 'home' as string,
    status: 'active' as Place['status'],
    event_type: 'both' as Place['event_type'],
    is_global: false,
    notify_entry: true,
    notify_exit: false,
  });

  useEffect(() => {
    if (place) {
      setFormData({
        name: place.name,
        lat: place.lat.toString(),
        lng: place.lng.toString(),
        address: place.address || '',
        radius: place.radius.toString(),
        color: place.color,
        icon: place.icon || 'home',
        status: place.status,
        event_type: place.event_type,
        is_global: place.is_global || false,
        notify_entry: place.notify_entry ?? true,
        notify_exit: place.notify_exit ?? false,
      });
    } else {
      setFormData({
        name: '',
        lat: '',
        lng: '',
        address: '',
        radius: '100',
        color: '#3b82f6',
        icon: 'home',
        status: 'active',
        event_type: 'both',
        is_global: false,
        notify_entry: true,
        notify_exit: false,
      });
    }
  }, [place]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      lat: Number(formData.lat),
      lng: Number(formData.lng),
      radius: Number(formData.radius),
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={place ? 'Editar Lugar' : 'Nuevo Lugar'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nombre *
          </label>
          <Input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="Bodega Central"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Latitud *
            </label>
            <Input
              type="number"
              step="any"
              value={formData.lat}
              onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
              required
              placeholder="25.6866"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Longitud *
            </label>
            <Input
              type="number"
              step="any"
              value={formData.lng}
              onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
              required
              placeholder="-100.3161"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Dirección
          </label>
          <Input
            type="text"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Calle, número, colonia, ciudad"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Radio (metros) *
            </label>
            <Input
              type="number"
              value={formData.radius}
              onChange={(e) => setFormData({ ...formData, radius: e.target.value })}
              required
              min="10"
              placeholder="100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Color *
            </label>
            <Input
              type="color"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Ícono *
            </label>
            <select
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
              required
            >
              {PLACE_ICONS.map((icon) => (
                <option key={icon} value={icon}>
                  {icon}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tipo de Evento *
            </label>
            <select
              value={formData.event_type}
              onChange={(e) => setFormData({ ...formData, event_type: e.target.value as Place['event_type'] })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
              required
            >
              <option value="entry">Solo Entrada</option>
              <option value="exit">Solo Salida</option>
              <option value="both">Entrada y Salida</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Estado *
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as Place['status'] })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
            required
          >
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
          </select>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_global"
              checked={formData.is_global}
              onChange={(e) => setFormData({ ...formData, is_global: e.target.checked })}
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <label htmlFor="is_global" className="text-sm text-gray-700 dark:text-gray-300">
              Lugar global (visible para todos los clientes)
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="notify_entry"
              checked={formData.notify_entry}
              onChange={(e) => setFormData({ ...formData, notify_entry: e.target.checked })}
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <label htmlFor="notify_entry" className="text-sm text-gray-700 dark:text-gray-300">
              Notificar al entrar
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="notify_exit"
              checked={formData.notify_exit}
              onChange={(e) => setFormData({ ...formData, notify_exit: e.target.checked })}
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <label htmlFor="notify_exit" className="text-sm text-gray-700 dark:text-gray-300">
              Notificar al salir
            </label>
          </div>
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
            {isLoading ? 'Guardando...' : place ? 'Actualizar' : 'Crear Lugar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
