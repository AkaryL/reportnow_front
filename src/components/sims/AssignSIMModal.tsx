import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Radio, AlertCircle } from 'lucide-react';
import type { SIM, Equipment } from '../../lib/types';

interface AssignSIMModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (equipmentId: string) => void;
  sim: SIM | null;
  availableEquipments: Equipment[];
  isLoading?: boolean;
}

export function AssignSIMModal({
  isOpen,
  onClose,
  onAssign,
  sim,
  availableEquipments,
  isLoading = false,
}: AssignSIMModalProps) {
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedEquipmentId) {
      onAssign(selectedEquipmentId);
      setSelectedEquipmentId('');
    }
  };

  const handleClose = () => {
    setSelectedEquipmentId('');
    onClose();
  };

  if (!sim) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Asignar SIM a Equipo">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SIM Info */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">SIM a asignar</h4>
          <div>
            <p className="font-medium text-gray-900">{sim.iccid}</p>
            <p className="text-sm text-gray-500">{sim.phone_number}</p>
            <p className="text-xs text-gray-400">{sim.carrier}</p>
          </div>
        </div>

        {/* Equipment Selection */}
        <div>
          <label htmlFor="equipment" className="block text-sm font-medium text-gray-700 mb-2">
            Seleccionar Equipo GPS
          </label>
          {availableEquipments.length > 0 ? (
            <>
              <div className="relative">
                <Radio className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  id="equipment"
                  value={selectedEquipmentId}
                  onChange={(e) => setSelectedEquipmentId(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900"
                  required
                >
                  <option value="">-- Seleccione un equipo --</option>
                  {availableEquipments.map((equipment) => (
                    <option key={equipment.id} value={equipment.id}>
                      {equipment.imei} - {equipment.brand} {equipment.model}
                    </option>
                  ))}
                </select>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Solo se muestran equipos que no tienen una SIM asignada
              </p>
            </>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">No hay equipos disponibles</p>
                <p className="text-xs text-yellow-700 mt-1">
                  Todos los equipos ya tienen una SIM asignada o no hay equipos registrados en el sistema.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={!selectedEquipmentId || isLoading || availableEquipments.length === 0}
          >
            {isLoading ? 'Asignando...' : 'Asignar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
