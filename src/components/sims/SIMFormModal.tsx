import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { equipmentsApi } from '../../features/equipments/api';
import { QUERY_KEYS } from '../../lib/constants';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import type { SIM } from '../../lib/types';

interface SIMFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  sim?: SIM | null;
  isLoading?: boolean;
}

export function SIMFormModal({ isOpen, onClose, onSubmit, sim, isLoading }: SIMFormModalProps) {
  const [formData, setFormData] = useState({
    iccid: '',
    phone_number: '',
    carrier: '',
    apn: '',
    status: 'Active' as SIM['status'],
    data_limit_mb: '',
    // activation_date: '',
    equipment_id: '',
  });

  const [isCustomCarrier, setIsCustomCarrier] = useState(false);
  const [customCarrierValue, setCustomCarrierValue] = useState('');

  // Compañías comunes en México
  const commonCarriers = [
    'Telcel',
    'AT&T',
    'Movistar',
    'Unefon',
    'Virgin Mobile',
    'Weex',
    'Cierto',
  ];

  const { data: equipments = [] } = useQuery({
    queryKey: QUERY_KEYS.EQUIPMENTS,
    queryFn: equipmentsApi.getAll,
  });

  useEffect(() => {
    if (sim) {
      const isCommonCarrier = commonCarriers.includes(sim.carrier);
      setFormData({
        iccid: sim.iccid,
        phone_number: sim.phone_number,
        carrier: isCommonCarrier ? sim.carrier : 'other',
        apn: sim.apn || '',
        status: sim.status,
        data_limit_mb: sim.data_limit_mb?.toString() || '',
        // activation_date: sim.activation_date || '',
        equipment_id: sim.equipment_id || '',
      });
      if (!isCommonCarrier) {
        setIsCustomCarrier(true);
        setCustomCarrierValue(sim.carrier);
      } else {
        setIsCustomCarrier(false);
        setCustomCarrierValue('');
      }
    } else {
      setFormData({
        iccid: '',
        phone_number: '',
        carrier: '',
        apn: '',
        status: 'Active',
        data_limit_mb: '',
        // activation_date: '',
        equipment_id: '',
      });
      setIsCustomCarrier(false);
      setCustomCarrierValue('');
    }
  }, [sim]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCarrier = isCustomCarrier ? customCarrierValue : formData.carrier;
    onSubmit({
      ...formData,
      carrier: finalCarrier,
      data_limit_mb: formData.data_limit_mb ? Number(formData.data_limit_mb) : undefined,
      equipment_id: formData.equipment_id || null,
    });
  };

  const handleCarrierChange = (value: string) => {
    if (value === 'other') {
      setIsCustomCarrier(true);
      setFormData({ ...formData, carrier: 'other' });
    } else {
      setIsCustomCarrier(false);
      setCustomCarrierValue('');
      setFormData({ ...formData, carrier: value });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={sim ? 'Editar SIM' : 'Nueva SIM'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              ICCID *
            </label>
            <Input
              type="text"
              value={formData.iccid}
              onChange={(e) => setFormData({ ...formData, iccid: e.target.value })}
              required
              placeholder="89XX..."
              maxLength={20}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Número de Teléfono *
            </label>
            <Input
              type="tel"
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              required
              placeholder="+52..."
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Compañía *
            </label>
            <select
              value={formData.carrier}
              onChange={(e) => handleCarrierChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              required={!isCustomCarrier}
            >
              <option value="">-- Seleccionar compañía --</option>
              {commonCarriers.map((carrier) => (
                <option key={carrier} value={carrier}>
                  {carrier}
                </option>
              ))}
              <option value="other">Otra compañía...</option>
            </select>
            {isCustomCarrier && (
              <div className="mt-2">
                <Input
                  type="text"
                  value={customCarrierValue}
                  onChange={(e) => setCustomCarrierValue(e.target.value)}
                  placeholder="Ingrese el nombre de la compañía"
                  required
                  className="border-blue-300 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Ingrese el nombre de la nueva compañía</p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              APN
            </label>
            <Input
              type="text"
              value={formData.apn}
              onChange={(e) => setFormData({ ...formData, apn: e.target.value })}
              placeholder="internet.itelcel.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Estado *
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as SIM['status'] })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            required
          >
            <option value="active">Activa</option>
            <option value="inactive">Inactiva</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Equipo Asignado
          </label>
          <select
            value={formData.equipment_id}
            onChange={(e) => setFormData({ ...formData, equipment_id: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Sin asignar</option>
            {equipments.map((equipment) => (
              <option key={equipment.id} value={equipment.id}>
                {equipment.imei} - {equipment.brand} {equipment.model}
              </option>
            ))}
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
            {isLoading ? 'Guardando...' : sim ? 'Actualizar' : 'Crear SIM'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
