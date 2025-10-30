import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Building2 } from 'lucide-react';
import type { Client, Equipment } from '../../lib/types';

interface AssignEquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (clientId: string) => void;
  equipment: Equipment | null;
  clients: Client[];
  isLoading?: boolean;
}

export function AssignEquipmentModal({
  isOpen,
  onClose,
  onAssign,
  equipment,
  clients,
  isLoading = false,
}: AssignEquipmentModalProps) {
  const [selectedClientId, setSelectedClientId] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedClientId) {
      onAssign(selectedClientId);
      setSelectedClientId('');
    }
  };

  const handleClose = () => {
    setSelectedClientId('');
    onClose();
  };

  if (!equipment) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Asignar Equipo a Cliente">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Equipment Info */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Equipo a asignar</h4>
          <div>
            <p className="font-medium text-gray-900">{equipment.imei}</p>
            <p className="text-sm text-gray-500">
              {equipment.brand} {equipment.model}
            </p>
            <p className="text-xs text-gray-400">S/N: {equipment.serial}</p>
          </div>
        </div>

        {/* Client Selection */}
        <div>
          <label htmlFor="client" className="block text-sm font-medium text-gray-700 mb-2">
            Seleccionar Cliente
          </label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              id="client"
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900"
              required
            >
              <option value="">-- Seleccione un cliente --</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.company_name}
                </option>
              ))}
            </select>
          </div>
          {clients.length === 0 && (
            <p className="mt-2 text-sm text-gray-500">No hay clientes disponibles</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={!selectedClientId || isLoading}>
            {isLoading ? 'Asignando...' : 'Asignar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
