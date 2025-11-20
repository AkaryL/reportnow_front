import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { equipmentsApi } from '../../features/equipments/api';
import { QUERY_KEYS } from '../../lib/constants';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Search, X, Check } from 'lucide-react';
import type { Client } from '../../lib/types';

interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  client?: Client | null;
  isLoading?: boolean;
}

export function ClientFormModal({ isOpen, onClose, onSubmit, client, isLoading }: ClientFormModalProps) {
  const [formData, setFormData] = useState({
    company_name: '',
    name: '',
    email: '',
    phone: '',
    whatsapp: '',
    password: '',
    rfc: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
  });

  const [selectedEquipments, setSelectedEquipments] = useState<string[]>([]);
  const [equipmentSearch, setEquipmentSearch] = useState('');
  const [showEquipmentPicker, setShowEquipmentPicker] = useState(false);

  const { data: equipments = [] } = useQuery({
    queryKey: QUERY_KEYS.EQUIPMENTS,
    queryFn: equipmentsApi.getAll,
  });

  useEffect(() => {
    if (client) {
      setFormData({
        company_name: client.company_name,
        name: client.contact_name,
        email: client.email,
        phone: client.contact_phone,
        whatsapp: (client as any).whatsapp || '',
        password: '',
        rfc: (client as any).rfc || '',
        address: (client as any).address || '',
        city: (client as any).city || '',
        state: (client as any).state || '',
        zip_code: (client as any).zip_code || '',
      });
      // Load assigned equipments for this client
      const clientEquipments = equipments.filter((eq) => eq.client_id === client.id).map((eq) => eq.id);
      setSelectedEquipments(clientEquipments);
    } else {
      setFormData({
        company_name: '',
        name: '',
        email: '',
        phone: '',
        whatsapp: '',
        password: '',
        rfc: '',
        address: '',
        city: '',
        state: '',
        zip_code: '',
      });
      setSelectedEquipments([]);
    }
  }, [client]);

  // Filtrar equipos disponibles (sin cliente asignado) o los ya asignados a este cliente
  const availableEquipments = equipments.filter(
    (eq) => !eq.client_id || (client && eq.client_id === client.id)
  );

  const filteredEquipments = availableEquipments.filter((eq) =>
    eq.imei.toLowerCase().includes(equipmentSearch.toLowerCase()) ||
    eq.serial.toLowerCase().includes(equipmentSearch.toLowerCase()) ||
    `${eq.brand} ${eq.model}`.toLowerCase().includes(equipmentSearch.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      equipment_ids: selectedEquipments,
    });
  };

  const toggleEquipment = (equipmentId: string) => {
    setSelectedEquipments((prev) =>
      prev.includes(equipmentId)
        ? prev.filter((id) => id !== equipmentId)
        : [...prev, equipmentId]
    );
  };

  const getSelectedEquipmentsInfo = () => {
    return equipments.filter((eq) => selectedEquipments.includes(eq.id));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={client ? 'Editar Cliente' : 'Nuevo Cliente'}
    >
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de la Empresa *
            </label>
            <Input
              type="text"
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              required
              placeholder="Ej: Coca-Cola, Barcel, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Contacto *
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Nombre del administrador"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              placeholder="contacto@cliente.com"
            />
            <p className="text-xs text-gray-500 mt-1">
              Se usará como nombre de usuario para iniciar sesión
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {client ? 'Nueva Contraseña (opcional)' : 'Contraseña *'}
            </label>
            <Input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!client}
              placeholder={client ? 'Dejar en blanco para mantener actual' : 'Contraseña'}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono *
            </label>
            <Input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
              placeholder="+52 33 1234 5678"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              WhatsApp
            </label>
            <Input
              type="tel"
              value={formData.whatsapp}
              onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
              placeholder="+52 33 1234 5678"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            RFC
          </label>
          <Input
            type="text"
            value={formData.rfc}
            onChange={(e) => setFormData({ ...formData, rfc: e.target.value.toUpperCase() })}
            placeholder="ABC123456XYZ"
            maxLength={13}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Dirección
          </label>
          <Input
            type="text"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Calle, número, colonia"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ciudad
            </label>
            <Input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="Guadalajara"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <Input
              type="text"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              placeholder="Jalisco"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Código Postal
            </label>
            <Input
              type="text"
              value={formData.zip_code}
              onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
              placeholder="44100"
              maxLength={5}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Equipos GPS Asignados ({selectedEquipments.length})
          </label>

          {/* Selected Equipments */}
          {selectedEquipments.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {getSelectedEquipmentsInfo().map((equipment) => (
                <Badge key={equipment.id} variant="default" className="flex items-center gap-1">
                  {equipment.imei}
                  <button
                    type="button"
                    onClick={() => toggleEquipment(equipment.id)}
                    className="ml-1 hover:text-crit-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {/* Equipment Picker */}
          <div className="border border-gray-300 rounded-md p-3">
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar equipos por IMEI, serial o modelo..."
                value={equipmentSearch}
                onChange={(e) => {
                  setEquipmentSearch(e.target.value);
                  setShowEquipmentPicker(true);
                }}
                onFocus={() => setShowEquipmentPicker(true)}
                className="pl-9"
              />
            </div>

            {showEquipmentPicker && (
              <div className="max-h-48 overflow-y-auto space-y-1">
                {filteredEquipments.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-2">
                    {availableEquipments.length === 0
                      ? 'No hay equipos disponibles'
                      : 'No se encontraron equipos'}
                  </p>
                ) : (
                  filteredEquipments.map((equipment) => {
                    const isSelected = selectedEquipments.includes(equipment.id);
                    return (
                      <div
                        key={equipment.id}
                        onClick={() => toggleEquipment(equipment.id)}
                        className={`p-2 rounded cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-primary-50 border border-primary-200'
                            : 'hover:bg-gray-50 border border-transparent'
                        }`}
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">{equipment.imei}</p>
                          <p className="text-xs text-gray-500">
                            {equipment.brand} {equipment.model} • S/N: {equipment.serial}
                          </p>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-primary-600" />}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {selectedEquipments.length === 0 && (
            <p className="text-xs text-gray-500 mt-1">
              Este cliente no tendrá equipos asignados
            </p>
          )}
          <p className="text-xs text-info-600 mt-1">
            Solo se muestran equipos disponibles (sin cliente asignado)
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
            {isLoading ? 'Guardando...' : client ? 'Actualizar Cliente' : 'Crear Cliente'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
