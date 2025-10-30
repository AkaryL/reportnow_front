import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import type { AssetType } from '../../lib/types';

interface AssetFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  asset?: any;
  clientId: string;
  isLoading?: boolean;
}

export function AssetFormModal({ isOpen, onClose, onSubmit, asset, clientId, isLoading }: AssetFormModalProps) {
  const [formData, setFormData] = useState({
    type: 'vehicle' as AssetType,
    name: '',
    photo_url: '',
    icon: '',
    notes: '',
    // Vehicle specific
    brand: '',
    model: '',
    year: '',
    plate: '',
    economic_id: '',
    vin: '',
    color: '',
    // Cargo specific
    cargo_type: '',
    box_id: '',
    // Container specific
    container_type: '',
    box_plate: '',
    container_economic_id: '',
    container_color: '',
    // Person specific
    person_name: '',
    phone: '',
    address: '',
    emergency_phone: '',
    position: '',
    // Other specific
    asset_type: '',
  });

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setFormData({
        type: 'vehicle',
        name: '',
        photo_url: '',
        icon: '',
        notes: '',
        brand: '',
        model: '',
        year: '',
        plate: '',
        economic_id: '',
        vin: '',
        color: '',
        cargo_type: '',
        box_id: '',
        container_type: '',
        box_plate: '',
        container_economic_id: '',
        container_color: '',
        person_name: '',
        phone: '',
        address: '',
        emergency_phone: '',
        position: '',
        asset_type: '',
      });
    } else if (asset) {
      // Edit mode - load asset data
      const baseData: any = {
        type: asset.type,
        name: asset.name || '',
        photo_url: asset.photo_url || '',
        icon: asset.icon || '',
        notes: asset.notes || '',
        brand: '',
        model: '',
        year: '',
        plate: '',
        economic_id: '',
        vin: '',
        color: '',
        cargo_type: '',
        box_id: '',
        container_type: '',
        box_plate: '',
        container_economic_id: '',
        container_color: '',
        person_name: '',
        phone: '',
        address: '',
        emergency_phone: '',
        position: '',
        asset_type: '',
      };

      if (asset.type === 'vehicle') {
        baseData.brand = asset.brand || '';
        baseData.model = asset.model || '';
        baseData.year = asset.year ? String(asset.year) : '';
        baseData.plate = asset.plate || '';
        baseData.economic_id = asset.economic_id || '';
        baseData.vin = asset.vin || '';
        baseData.color = asset.color || '';
      } else if (asset.type === 'cargo') {
        baseData.cargo_type = asset.cargo_type || '';
        baseData.box_id = asset.box_id || '';
      } else if (asset.type === 'container') {
        baseData.container_type = asset.container_type || '';
        baseData.box_plate = asset.box_plate || '';
        baseData.container_economic_id = asset.economic_id || '';
        baseData.container_color = asset.color || '';
      } else if (asset.type === 'person') {
        baseData.person_name = asset.person_name || '';
        baseData.phone = asset.phone || '';
        baseData.address = asset.address || '';
        baseData.emergency_phone = asset.emergency_phone || '';
        baseData.position = asset.position || '';
      } else if (asset.type === 'other') {
        baseData.asset_type = asset.asset_type || '';
      }

      setFormData(baseData);
    }
  }, [isOpen, asset]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const basePayload: any = {
      client_id: clientId,
      photo_url: formData.photo_url || undefined,
      icon: formData.icon || undefined,
      notes: formData.notes || undefined,
    };

    let payload: any;

    switch (formData.type) {
      case 'vehicle':
        payload = {
          type: 'vehicle',
          data: {
            ...basePayload,
            name: formData.name,
            brand: formData.brand || undefined,
            model: formData.model || undefined,
            year: formData.year ? parseInt(formData.year) : undefined,
            plate: formData.plate || undefined,
            economic_id: formData.economic_id || undefined,
            vin: formData.vin || undefined,
            color: formData.color || undefined,
          },
        };
        break;
      case 'cargo':
        payload = {
          type: 'cargo',
          data: {
            ...basePayload,
            name: formData.name,
            cargo_type: formData.cargo_type || undefined,
            box_id: formData.box_id || undefined,
          },
        };
        break;
      case 'container':
        payload = {
          type: 'container',
          data: {
            ...basePayload,
            name: formData.name,
            container_type: formData.container_type || undefined,
            box_plate: formData.box_plate || undefined,
            economic_id: formData.container_economic_id || undefined,
            color: formData.container_color || undefined,
          },
        };
        break;
      case 'person':
        payload = {
          type: 'person',
          data: {
            ...basePayload,
            person_name: formData.person_name,
            phone: formData.phone || undefined,
            address: formData.address || undefined,
            emergency_phone: formData.emergency_phone || undefined,
            position: formData.position || undefined,
          },
        };
        break;
      case 'other':
        payload = {
          type: 'other',
          data: {
            ...basePayload,
            name: formData.name,
            asset_type: formData.asset_type || undefined,
          },
        };
        break;
    }

    onSubmit(payload);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={asset ? 'Editar Activo' : 'Nuevo Activo'}>
      <form onSubmit={handleSubmit} className="space-y-4 p-4">
        {/* Type Selector */}
        <div>
          <Label htmlFor="type">Tipo de activo *</Label>
          <select
            id="type"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as AssetType })}
            disabled={!!asset}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            required
          >
            <option value="vehicle">Vehículo</option>
            <option value="cargo">Mercancía</option>
            <option value="container">Contenedor</option>
            <option value="person">Persona</option>
            <option value="other">Otro</option>
          </select>
        </div>

        {/* Vehicle Fields */}
        {formData.type === 'vehicle' && (
          <>
            <div>
              <Label htmlFor="name">Nombre del activo *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="brand">Marca</Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="model">Modelo</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="year">Año</Label>
              <Input
                id="year"
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="plate">Placas</Label>
              <Input
                id="plate"
                value={formData.plate}
                onChange={(e) => setFormData({ ...formData, plate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="economic_id">ID Económico</Label>
              <Input
                id="economic_id"
                value={formData.economic_id}
                onChange={(e) => setFormData({ ...formData, economic_id: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="vin">VIN</Label>
              <Input
                id="vin"
                value={formData.vin}
                onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              />
            </div>
          </>
        )}

        {/* Cargo Fields */}
        {formData.type === 'cargo' && (
          <>
            <div>
              <Label htmlFor="name">Nombre del activo *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="cargo_type">Tipo de mercancía</Label>
              <Input
                id="cargo_type"
                value={formData.cargo_type}
                onChange={(e) => setFormData({ ...formData, cargo_type: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="box_id">ID de caja</Label>
              <Input
                id="box_id"
                value={formData.box_id}
                onChange={(e) => setFormData({ ...formData, box_id: e.target.value })}
              />
            </div>
          </>
        )}

        {/* Container Fields */}
        {formData.type === 'container' && (
          <>
            <div>
              <Label htmlFor="name">Nombre del activo *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="container_type">Tipo de contenedor</Label>
              <Input
                id="container_type"
                value={formData.container_type}
                onChange={(e) => setFormData({ ...formData, container_type: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="box_plate">Placa de caja</Label>
              <Input
                id="box_plate"
                value={formData.box_plate}
                onChange={(e) => setFormData({ ...formData, box_plate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="container_economic_id">ID Económico</Label>
              <Input
                id="container_economic_id"
                value={formData.container_economic_id}
                onChange={(e) => setFormData({ ...formData, container_economic_id: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="container_color">Color</Label>
              <Input
                id="container_color"
                value={formData.container_color}
                onChange={(e) => setFormData({ ...formData, container_color: e.target.value })}
              />
            </div>
          </>
        )}

        {/* Person Fields */}
        {formData.type === 'person' && (
          <>
            <div>
              <Label htmlFor="person_name">Nombre de persona *</Label>
              <Input
                id="person_name"
                value={formData.person_name}
                onChange={(e) => setFormData({ ...formData, person_name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="address">Dirección</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="emergency_phone">Tel. de emergencia</Label>
              <Input
                id="emergency_phone"
                value={formData.emergency_phone}
                onChange={(e) => setFormData({ ...formData, emergency_phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="position">Cargo</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              />
            </div>
          </>
        )}

        {/* Other Fields */}
        {formData.type === 'other' && (
          <>
            <div>
              <Label htmlFor="name">Nombre del activo *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="asset_type">Tipo</Label>
              <Input
                id="asset_type"
                value={formData.asset_type}
                onChange={(e) => setFormData({ ...formData, asset_type: e.target.value })}
              />
            </div>
          </>
        )}

        {/* Common Fields */}
        <div className="border-t pt-4 mt-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Datos adicionales</h3>
          <div className="space-y-3">
            <div>
              <Label htmlFor="icon">Ícono</Label>
              <Input
                id="icon"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="Nombre del ícono o emoji"
              />
            </div>
            <div>
              <Label htmlFor="photo_url">URL de foto</Label>
              <Input
                id="photo_url"
                type="url"
                value={formData.photo_url}
                onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label htmlFor="notes">Notas</Label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={isLoading}>
            {isLoading ? 'Guardando...' : asset ? 'Actualizar' : 'Crear'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
