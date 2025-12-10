import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Radio, AlertCircle } from 'lucide-react';
import type { Asset, Equipment } from '../../lib/types';

interface AssignEquipmentToAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (equipmentId: string) => void;
  onUnassign: (equipmentId: string) => void;
  asset: Asset | null;
  availableEquipments: Equipment[];
  currentEquipment: Equipment | null;
  isLoading?: boolean;
}

export function AssignEquipmentToAssetModal({
  isOpen,
  onClose,
  onAssign,
  onUnassign,
  asset,
  availableEquipments,
  currentEquipment,
  isLoading = false,
}: AssignEquipmentToAssetModalProps) {
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedEquipmentId) {
      onAssign(selectedEquipmentId);
      setSelectedEquipmentId('');
    }
  };

  const handleUnassign = () => {
    if (currentEquipment) {
      onUnassign(currentEquipment.id);
    }
  };

  const handleClose = () => {
    setSelectedEquipmentId('');
    onClose();
  };

  if (!asset) return null;

  const getAssetTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      vehiculo: 'Vehículo',
      cargo: 'Mercancía',
      container: 'Contenedor',
      person: 'Persona',
      other: 'Otro',
    };
    return labels[type] || type;
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Asignar Equipo GPS a Activo">
      <div className="space-y-6">
        {/* Asset Info */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Activo seleccionado</h4>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{asset.name}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{getAssetTypeLabel(asset.type)}</p>
          </div>
        </div>

        {/* Current Equipment Info */}
        {currentEquipment && (
          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <h4 className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-2">Equipo GPS asignado actualmente</h4>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-300">
                  {currentEquipment.brand} {currentEquipment.model}
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-400">IMEI: {currentEquipment.imei}</p>
                {currentEquipment.serial && (
                  <p className="text-xs text-blue-600 dark:text-blue-500">Serial: {currentEquipment.serial}</p>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleUnassign}
                disabled={isLoading}
                className="text-red-600 dark:text-red-400 border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/30"
              >
                {isLoading ? 'Desasignando...' : 'Desasignar'}
              </Button>
            </div>
          </div>
        )}

        {/* Equipment Selection Form */}
        {!currentEquipment && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="equipment" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Seleccionar Equipo GPS
              </label>
              {availableEquipments.length > 0 ? (
                <>
                  <div className="relative">
                    <Radio className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <select
                      id="equipment"
                      value={selectedEquipmentId}
                      onChange={(e) => setSelectedEquipmentId(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-gray-100"
                      required
                    >
                      <option value="">-- Seleccione un equipo --</option>
                      {availableEquipments.map((equipment) => (
                        <option key={equipment.id} value={equipment.id}>
                          {equipment.imei} - {equipment.brand} {equipment.model}
                          {equipment.serial ? ` (${equipment.serial})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Solo se muestran equipos que no tienen un activo asignado
                  </p>
                </>
              ) : (
                <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-400">No hay equipos disponibles</p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-500 mt-1">
                      Todos los equipos ya tienen un activo asignado o no hay equipos registrados en el sistema.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
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
        )}

        {/* Close button when equipment is already assigned */}
        {currentEquipment && (
          <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cerrar
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
