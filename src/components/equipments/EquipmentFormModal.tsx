import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { simsApi } from '../../features/sims/api';
import { QUERY_KEYS } from '../../lib/constants';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { VisibilitySelector } from '../ui/VisibilitySelector';
import { useAuth } from '../../features/auth/hooks';
import type { Equipment, VisibilityType } from '../../lib/types';

interface EquipmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  equipment?: Equipment | null;
  isLoading?: boolean;
  clientId?: string;
}

export function EquipmentFormModal({ isOpen, onClose, onSubmit, equipment, isLoading, clientId }: EquipmentFormModalProps) {
  const { user: currentUser } = useAuth();

  const [formData, setFormData] = useState({
    imei: '',
    serial: '',
    brand: '',
    model: '',
    sim_id: '',
    status: 'available' as Equipment['status'],
    firmware_version: '',
    purchase_date: '',
    warranty_expiry: '',
    notes: '',
    visibility: 'all' as VisibilityType,
    assigned_user_ids: [] as string[],
  });

  const { data: sims = [] } = useQuery({
    queryKey: QUERY_KEYS.SIMS,
    queryFn: simsApi.getAll,
  });

  useEffect(() => {
    if (equipment) {
      setFormData({
        imei: equipment.imei,
        serial: equipment.serial,
        brand: equipment.brand,
        model: equipment.model,
        sim_id: equipment.sim_id,
        status: equipment.status,
        firmware_version: equipment.firmware_version || '',
        purchase_date: equipment.purchase_date || '',
        warranty_expiry: equipment.warranty_expiry || '',
        notes: equipment.notes || '',
        visibility: equipment.visibility || 'all',
        assigned_user_ids: equipment.assigned_users?.map(u => u.id) || [],
      });
    } else {
      setFormData({
        imei: '',
        serial: '',
        brand: '',
        model: '',
        sim_id: '',
        status: 'active',
        firmware_version: '',
        purchase_date: '',
        warranty_expiry: '',
        notes: '',
        visibility: 'all',
        assigned_user_ids: [],
      });
    }
  }, [equipment]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  // Solo mostrar selector de visibilidad para roles que pueden crear equipos
  const canSetVisibility = currentUser?.role && ['admin', 'superuser', 'operator_admin'].includes(currentUser.role);
  const effectiveClientId = clientId || currentUser?.client_id;

  const availableSims = sims.filter(sim => !sim.equipment_id || sim.id === equipment?.sim_id);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={equipment ? 'Editar Equipo' : 'Nuevo Equipo'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              IMEI *
            </label>
            <Input
              type="text"
              value={formData.imei}
              onChange={(e) => setFormData({ ...formData, imei: e.target.value })}
              required
              placeholder="123456789012345"
              maxLength={15}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Número de Serie *
            </label>
            <Input
              type="text"
              value={formData.serial}
              onChange={(e) => setFormData({ ...formData, serial: e.target.value })}
              required
              placeholder="SN123456"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Marca *
            </label>
            <Input
              type="text"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              required
              placeholder="Teltonika, Queclink, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Modelo *
            </label>
            <Input
              type="text"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              required
              placeholder="FMB920, GV300, etc."
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            SIM Asignada *
          </label>
          <select
            value={formData.sim_id}
            onChange={(e) => setFormData({ ...formData, sim_id: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
            required
          >
            <option value="">Seleccionar SIM</option>
            {availableSims.map((sim) => (
              <option key={sim.id} value={sim.id}>
                {sim.iccid} - {sim.phone_number} ({sim.carrier})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Estado *
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as Equipment['status'] })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
              required
            >
              <option value="available">Disponible</option>
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Versión de Firmware
            </label>
            <Input
              type="text"
              value={formData.firmware_version}
              onChange={(e) => setFormData({ ...formData, firmware_version: e.target.value })}
              placeholder="v1.2.3"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fecha de Compra
            </label>
            <Input
              type="date"
              value={formData.purchase_date}
              onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Vencimiento de Garantía
            </label>
            <Input
              type="date"
              value={formData.warranty_expiry}
              onChange={(e) => setFormData({ ...formData, warranty_expiry: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Notas
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
            rows={3}
            placeholder="Notas adicionales sobre el equipo..."
          />
        </div>

        {/* Selector de Visibilidad */}
        {canSetVisibility && (
          <div className="border-t border-gray-200 dark:border-gray-600 pt-4 mt-4">
            <VisibilitySelector
              visibility={formData.visibility}
              assignedUserIds={formData.assigned_user_ids}
              clientId={effectiveClientId}
              onVisibilityChange={(v) => setFormData({ ...formData, visibility: v })}
              onAssignedUsersChange={(ids) => setFormData({ ...formData, assigned_user_ids: ids })}
              existingAssignedUsers={equipment?.assigned_users}
            />
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
            {isLoading ? 'Guardando...' : equipment ? 'Actualizar' : 'Crear Equipo'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
