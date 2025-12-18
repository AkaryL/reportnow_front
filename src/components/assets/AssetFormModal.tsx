import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import type { AssetType, Client, User } from '../../lib/types';

interface AssetFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  asset?: any;
  clientId?: string;
  isLoading?: boolean;
  user?: User;
  clients?: Client[];
}

export function AssetFormModal({ isOpen, onClose, onSubmit, asset, clientId, isLoading, user, clients = [] }: AssetFormModalProps) {
  const [formData, setFormData] = useState({
    type: 'vehiculo' as AssetType,
    name: '',
    photo_url: '',
    icon: '',
    notes: '',
    client_id: clientId || '',
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
    tracking_number: '',
    weight_kg: '',
    dimensions: '',
    value: '',
    // Container specific
    container_type: '',
    box_plate: '',
    container_economic_id: '',
    container_color: '',
    container_number: '',
    size_ft: '',
    status: '',
    // Person specific
    person_name: '',
    phone: '',
    address: '',
    emergency_phone: '',
    position: '',
    role: '',
    email: '',
    // Other specific
    asset_type: '',
    equipment_id: '',
    category: '',
  });

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setFormData({
        type: 'vehiculo',
        name: '',
        photo_url: '',
        icon: '',
        notes: '',
        client_id: clientId || '',
        brand: '',
        model: '',
        year: '',
        plate: '',
        economic_id: '',
        vin: '',
        color: '',
        cargo_type: '',
        box_id: '',
        tracking_number: '',
        weight_kg: '',
        dimensions: '',
        value: '',
        container_type: '',
        box_plate: '',
        container_economic_id: '',
        container_color: '',
        container_number: '',
        size_ft: '',
        status: '',
        person_name: '',
        phone: '',
        address: '',
        emergency_phone: '',
        position: '',
        role: '',
        email: '',
        asset_type: '',
        equipment_id: '',
        category: '',
      });
    } else if (asset) {
      // Edit mode - load asset data
      const baseData: any = {
        type: asset.type,
        name: asset.name || '',
        photo_url: asset.photo_url || '',
        icon: asset.icon || '',
        notes: asset.notes || '',
        client_id: asset.client_id || clientId || '',
        brand: '',
        model: '',
        year: '',
        plate: '',
        economic_id: '',
        vin: '',
        color: '',
        cargo_type: '',
        box_id: '',
        tracking_number: '',
        weight_kg: '',
        dimensions: '',
        value: '',
        container_type: '',
        box_plate: '',
        container_economic_id: '',
        container_color: '',
        container_number: '',
        size_ft: '',
        status: '',
        person_name: '',
        phone: '',
        address: '',
        emergency_phone: '',
        position: '',
        role: '',
        email: '',
        asset_type: '',
        equipment_id: '',
        category: '',
      };

      if (asset.type === 'vehiculo') {
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
      client_id: formData.client_id || clientId,
      photo_url: formData.photo_url || undefined,
      icon: formData.icon || undefined,
      notes: formData.notes || undefined,
    };

    let payload: any;

    switch (formData.type) {
      case 'vehiculo':
        payload = {
          // type: 'vehiculo',
          // data: {
          //   ...basePayload,
          //   name: formData.name,
          //   brand: formData.brand || undefined,
          //   model: formData.model || undefined,
          //   year: formData.year ? parseInt(formData.year) : undefined,
          //   plate: formData.plate || undefined,
          //   economic_id: formData.economic_id || undefined,
          //   vin: formData.vin || undefined,
          //   color: formData.color || undefined,
          //   asset_type: 'vehiculo'
          // },
          ...basePayload,
          type: 'vehiculo',
          name: formData.name,
          brand: formData.brand || undefined,
          model: formData.model || undefined,
          year: formData.year ? parseInt(formData.year) : undefined,
          plate: formData.plate || undefined,
          economic_id: formData.economic_id || undefined,
          vin: formData.vin || undefined,
          color: formData.color || undefined,
          asset_type: 'vehiculo'
        };
        break;
      case 'cargo':
        payload = {
          // type: 'cargo',
          // data: {
          //   name: formData.name,
          //   cargo_type: formData.cargo_type || undefined,
          //   box_id: formData.box_id || undefined,
          //   asset_type: 'cargo'
          // },
          ...basePayload,
          type: 'cargo',
          name: formData.name || undefined,
          client_id: formData.client_id || undefined,
          cargo_type: formData.cargo_type || undefined,
          box_id: formData.box_id || undefined,
          tracking_number: formData.tracking_number || undefined,
          weight_kg: formData.weight_kg || undefined,
          dimensions: formData.dimensions || undefined,
          value: formData.value || undefined,
          status: 'active',
          asset_type: 'cargo'
        };
        break;
      case 'container':
        payload = {
          // type: 'container',
          // data: {
          //   ...basePayload,
          //   name: formData.name,
          //   container_type: formData.container_type || undefined,
          //   box_plate: formData.box_plate || undefined,
          //   economic_id: formData.container_economic_id || undefined,
          //   color: formData.container_color || undefined,
          //   asset_type: 'container'
          // },
          ...basePayload,
          type: 'container',
          name: formData.name,
          client_id: formData.client_id || undefined,
          container_type: formData.container_type || undefined,
          container_number: formData.container_number || undefined,
          box_plate: formData.box_plate || undefined,
          economic_id: formData.economic_id || undefined,
          color: formData.color || undefined,
          size_ft: formData.size_ft || undefined,
          status: formData.status || undefined
        };
        break;
      case 'person':
        payload = {
          // type: 'person',
          // data: {
          //   ...basePayload,
          //   person_name: formData.person_name,
          //   phone: formData.phone || undefined,
          //   address: formData.address || undefined,
          //   emergency_phone: formData.emergency_phone || undefined,
          //   position: formData.position || undefined,
          //   asset_type: 'person'
          // },
          ...basePayload,
          type: 'person', 
          client_id: formData.client_id || undefined,
          name: formData.person_name || undefined,
          role: formData.role || undefined,
          phone: formData.phone || undefined,
          email: formData.email || undefined,
          position: formData.position || undefined,
          emergency_phone: formData.emergency_phone || undefined
        };
        break;
      case 'other':
        payload = {
          // type: 'other',
          // data: {
          //   ...basePayload,
          //   name: formData.name,
          //   asset_type: formData.asset_type || undefined,
          // },
          
          ...basePayload,
          type: 'other',
          name: formData.name,
          client_id: formData.client_id || undefined,
          equipment_id: formData.equipment_id || undefined,
          asset_type: 'other',
          category: formData.category || undefined, 
          notes: formData.notes || undefined
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
            onChange={(e) => {setFormData({ ...formData, type: e.target.value as AssetType });console.log(e.target.value)} }
            disabled={!!asset}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            required
          >
            <option value="vehiculo">Vehículo</option>
            <option value="cargo">Mercancía</option>
            <option value="container">Contenedor</option>
            <option value="person">Persona</option>
            <option value="other">Otro</option>
          </select>
        </div>

        {/* Client Selector (only for superuser) */}
        {user?.role === 'superuser' && (
          <div>
            <Label htmlFor="client_id">Cliente *</Label>
            <select
              id="client_id"
              value={formData.client_id}
              onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            >
              <option value="">Seleccionar cliente...</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.company_name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Vehicle Fields */}
        {formData.type === 'vehiculo' && (
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
        <div className="border-t dark:border-gray-700 pt-4 mt-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Datos adicionales</h3>
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t dark:border-gray-700">
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
