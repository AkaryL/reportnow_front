import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import {
  Truck,
  Package,
  Container,
  User,
  Box,
  Edit2,
  Save,
  X,
  MapPin,
  Phone,
  Mail,
  Calendar,
  FileText,
  Ruler,
  Weight,
  DollarSign,
  CreditCard,
  Radio,
  UserCircle,
  Info
} from 'lucide-react';
import type { Asset, VehicleAsset, CargoAsset, ContainerAsset, PersonAsset, OtherAsset } from '../../lib/types';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../lib/constants';
import { driversApi } from '../../features/drivers/api';
import { equipmentsApi } from '../../features/equipments/api';

interface AssetDetailModalProps {
  asset: Asset | null;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (updatedAsset: Asset) => void;
}

export function AssetDetailModal({ asset, isOpen, onClose, onSave }: AssetDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedAsset, setEditedAsset] = useState<Asset | null>(asset);

  // Sincronizar editedAsset cuando asset cambia
  useEffect(() => {
    if (asset) {
      setEditedAsset(asset);
      setIsEditing(false);
    }
  }, [asset]);

  // Queries para obtener información relacionada
  const { data: drivers = [] } = useQuery({
    queryKey: QUERY_KEYS.DRIVERS,
    queryFn: driversApi.getAll,
    enabled: isOpen && asset?.type === 'vehicle',
  });

  const { data: equipments = [] } = useQuery({
    queryKey: QUERY_KEYS.EQUIPMENTS,
    queryFn: equipmentsApi.getAll,
    enabled: isOpen && !!asset?.equipment_id,
  });

  if (!asset || !editedAsset) return null;

  const equipment = equipments.find(eq => eq.id === asset.equipment_id);
  const driver = asset.type === 'vehicle' ? drivers.find(d => d.id === (asset as VehicleAsset).driver_id) : null;

  const getAssetIcon = () => {
    switch (asset.type) {
      case 'vehicle': return Truck;
      case 'cargo': return Package;
      case 'container': return Container;
      case 'person': return User;
      case 'other': return Box;
      default: return Box;
    }
  };

  const getAssetTypeLabel = () => {
    switch (asset.type) {
      case 'vehicle': return 'Vehículo';
      case 'cargo': return 'Carga';
      case 'container': return 'Contenedor';
      case 'person': return 'Persona';
      case 'other': return 'Otro';
      default: return 'Activo';
    }
  };

  const handleSave = () => {
    if (onSave && editedAsset) {
      onSave(editedAsset);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedAsset(asset);
    setIsEditing(false);
  };

  const Icon = getAssetIcon();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="space-y-6">
        {/* Header con tipo de activo */}
        <div className="flex items-start justify-between pb-4 border-b border-gray-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
              <Icon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold text-gray-900">{asset.name}</h3>
                <Badge variant={asset.status === 'active' ? 'success' : 'default'}>
                  {asset.status === 'active' ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
              <p className="text-sm text-gray-500">{getAssetTypeLabel()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="w-4 h-4" />
                Editar
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSave}
                >
                  <Save className="w-4 h-4" />
                  Guardar
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Información básica */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Info className="w-4 h-4" />
            Información General
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Nombre</label>
              {isEditing ? (
                <Input
                  value={editedAsset.name}
                  onChange={(e) => setEditedAsset({ ...editedAsset, name: e.target.value })}
                />
              ) : (
                <p className="text-sm text-gray-900">{asset.name}</p>
              )}
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Estado</label>
              {isEditing ? (
                <select
                  value={editedAsset.status}
                  onChange={(e) => setEditedAsset({ ...editedAsset, status: e.target.value as 'active' | 'inactive' })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                </select>
              ) : (
                <p className="text-sm text-gray-900">{asset.status === 'active' ? 'Activo' : 'Inactivo'}</p>
              )}
            </div>
          </div>

          {asset.description && (
            <div>
              <label className="text-xs text-gray-500 block mb-1">Descripción</label>
              {isEditing ? (
                <textarea
                  value={editedAsset.description || ''}
                  onChange={(e) => setEditedAsset({ ...editedAsset, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={2}
                />
              ) : (
                <p className="text-sm text-gray-900">{asset.description}</p>
              )}
            </div>
          )}

          {asset.notes && (
            <div>
              <label className="text-xs text-gray-500 block mb-1">Notas</label>
              {isEditing ? (
                <textarea
                  value={editedAsset.notes || ''}
                  onChange={(e) => setEditedAsset({ ...editedAsset, notes: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={2}
                />
              ) : (
                <p className="text-sm text-gray-900">{asset.notes}</p>
              )}
            </div>
          )}
        </div>

        {/* Información específica por tipo */}
        {asset.type === 'vehicle' && (
          <VehicleDetails
            asset={asset as VehicleAsset}
            editedAsset={editedAsset as VehicleAsset}
            setEditedAsset={setEditedAsset}
            isEditing={isEditing}
            driver={driver}
          />
        )}

        {asset.type === 'cargo' && (
          <CargoDetails
            asset={asset as CargoAsset}
            editedAsset={editedAsset as CargoAsset}
            setEditedAsset={setEditedAsset}
            isEditing={isEditing}
          />
        )}

        {asset.type === 'container' && (
          <ContainerDetails
            asset={asset as ContainerAsset}
            editedAsset={editedAsset as ContainerAsset}
            setEditedAsset={setEditedAsset}
            isEditing={isEditing}
          />
        )}

        {asset.type === 'person' && (
          <PersonDetails
            asset={asset as PersonAsset}
            editedAsset={editedAsset as PersonAsset}
            setEditedAsset={setEditedAsset}
            isEditing={isEditing}
          />
        )}

        {asset.type === 'other' && (
          <OtherDetails
            asset={asset as OtherAsset}
            editedAsset={editedAsset as OtherAsset}
            setEditedAsset={setEditedAsset}
            isEditing={isEditing}
          />
        )}

        {/* Equipo GPS asignado */}
        {equipment && (
          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-3">
              <Radio className="w-4 h-4" />
              Equipo GPS Asignado
            </h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Serial</label>
                  <p className="text-sm font-medium text-gray-900">{equipment.serial}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">IMEI</label>
                  <p className="text-sm text-gray-900">{equipment.imei}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Marca/Modelo</label>
                  <p className="text-sm text-gray-900">{equipment.brand} {equipment.model}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Estado</label>
                  <Badge variant={equipment.status === 'active' ? 'success' : 'default'}>
                    {equipment.status === 'active' ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Fecha de creación */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Calendar className="w-3.5 h-3.5" />
            <span>Creado el {new Date(asset.created_at).toLocaleDateString('es-MX', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</span>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// Componente para detalles de vehículo
function VehicleDetails({
  asset,
  editedAsset,
  setEditedAsset,
  isEditing,
  driver
}: {
  asset: VehicleAsset;
  editedAsset: VehicleAsset;
  setEditedAsset: (asset: Asset) => void;
  isEditing: boolean;
  driver?: any;
}) {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
        <Truck className="w-4 h-4" />
        Información del Vehículo
      </h4>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Marca</label>
          {isEditing ? (
            <Input
              value={editedAsset.brand}
              onChange={(e) => setEditedAsset({ ...editedAsset, brand: e.target.value })}
            />
          ) : (
            <p className="text-sm text-gray-900">{asset.brand}</p>
          )}
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Modelo</label>
          {isEditing ? (
            <Input
              value={editedAsset.model}
              onChange={(e) => setEditedAsset({ ...editedAsset, model: e.target.value })}
            />
          ) : (
            <p className="text-sm text-gray-900">{asset.model}</p>
          )}
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Año</label>
          {isEditing ? (
            <Input
              type="number"
              value={editedAsset.year}
              onChange={(e) => setEditedAsset({ ...editedAsset, year: parseInt(e.target.value) })}
            />
          ) : (
            <p className="text-sm text-gray-900">{asset.year}</p>
          )}
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Color</label>
          {isEditing ? (
            <Input
              value={editedAsset.color || ''}
              onChange={(e) => setEditedAsset({ ...editedAsset, color: e.target.value })}
            />
          ) : (
            <p className="text-sm text-gray-900">{asset.color}</p>
          )}
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Placa</label>
          {isEditing ? (
            <Input
              value={editedAsset.plate || ''}
              onChange={(e) => setEditedAsset({ ...editedAsset, plate: e.target.value })}
            />
          ) : (
            <p className="text-sm text-gray-900 font-medium">{asset.plate}</p>
          )}
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">ID Económico</label>
          {isEditing ? (
            <Input
              value={editedAsset.economic_id || ''}
              onChange={(e) => setEditedAsset({ ...editedAsset, economic_id: e.target.value })}
            />
          ) : (
            <p className="text-sm text-gray-900">{asset.economic_id}</p>
          )}
        </div>
        <div className="col-span-2">
          <label className="text-xs text-gray-500 block mb-1">VIN</label>
          {isEditing ? (
            <Input
              value={editedAsset.vin || ''}
              onChange={(e) => setEditedAsset({ ...editedAsset, vin: e.target.value })}
            />
          ) : (
            <p className="text-sm text-gray-900 font-mono">{asset.vin}</p>
          )}
        </div>
      </div>

      {/* Conductor asignado */}
      {driver && (
        <div className="pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-3">
            <UserCircle className="w-4 h-4" />
            Conductor Asignado
          </h4>
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-blue-600 block mb-1">Nombre</label>
                <p className="text-sm font-medium text-gray-900">{driver.name}</p>
              </div>
              <div>
                <label className="text-xs text-blue-600 block mb-1">Teléfono</label>
                <p className="text-sm text-gray-900">{driver.phone}</p>
              </div>
              <div>
                <label className="text-xs text-blue-600 block mb-1">No. Licencia</label>
                <p className="text-sm text-gray-900 font-mono">{driver.license_number}</p>
              </div>
              <div>
                <label className="text-xs text-blue-600 block mb-1">Estado</label>
                <Badge variant={driver.status === 'available' ? 'success' : driver.status === 'on_trip' ? 'warning' : 'default'}>
                  {driver.status === 'available' ? 'Disponible' : driver.status === 'on_trip' ? 'En viaje' : 'Inactivo'}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      )}

      {!driver && asset.driver_id && (
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <UserCircle className="w-4 h-4" />
            <span>Sin conductor asignado</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente para detalles de carga
function CargoDetails({
  asset,
  editedAsset,
  setEditedAsset,
  isEditing
}: {
  asset: CargoAsset;
  editedAsset: CargoAsset;
  setEditedAsset: (asset: Asset) => void;
  isEditing: boolean;
}) {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
        <Package className="w-4 h-4" />
        Información de Carga
      </h4>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Tipo de Carga</label>
          {isEditing ? (
            <Input
              value={editedAsset.cargo_type}
              onChange={(e) => setEditedAsset({ ...editedAsset, cargo_type: e.target.value })}
            />
          ) : (
            <p className="text-sm text-gray-900">{asset.cargo_type}</p>
          )}
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">ID de Caja</label>
          {isEditing ? (
            <Input
              value={editedAsset.box_id || ''}
              onChange={(e) => setEditedAsset({ ...editedAsset, box_id: e.target.value })}
            />
          ) : (
            <p className="text-sm text-gray-900 font-mono">{asset.box_id}</p>
          )}
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">No. Seguimiento</label>
          {isEditing ? (
            <Input
              value={editedAsset.tracking_number || ''}
              onChange={(e) => setEditedAsset({ ...editedAsset, tracking_number: e.target.value })}
            />
          ) : (
            <p className="text-sm text-gray-900 font-mono">{asset.tracking_number}</p>
          )}
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1 flex items-center gap-1">
            <Weight className="w-3 h-3" />
            Peso (kg)
          </label>
          {isEditing ? (
            <Input
              type="number"
              value={editedAsset.weight_kg || ''}
              onChange={(e) => setEditedAsset({ ...editedAsset, weight_kg: parseFloat(e.target.value) })}
            />
          ) : (
            <p className="text-sm text-gray-900">{asset.weight_kg ? `${asset.weight_kg} kg` : 'N/A'}</p>
          )}
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1 flex items-center gap-1">
            <Ruler className="w-3 h-3" />
            Dimensiones
          </label>
          {isEditing ? (
            <Input
              value={editedAsset.dimensions || ''}
              onChange={(e) => setEditedAsset({ ...editedAsset, dimensions: e.target.value })}
              placeholder="L x W x H"
            />
          ) : (
            <p className="text-sm text-gray-900">{asset.dimensions || 'N/A'}</p>
          )}
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1 flex items-center gap-1">
            <DollarSign className="w-3 h-3" />
            Valor ($)
          </label>
          {isEditing ? (
            <Input
              type="number"
              value={editedAsset.value || ''}
              onChange={(e) => setEditedAsset({ ...editedAsset, value: parseFloat(e.target.value) })}
            />
          ) : (
            <p className="text-sm text-gray-900">{asset.value ? `$${asset.value.toLocaleString('es-MX')}` : 'N/A'}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Componente para detalles de contenedor
function ContainerDetails({
  asset,
  editedAsset,
  setEditedAsset,
  isEditing
}: {
  asset: ContainerAsset;
  editedAsset: ContainerAsset;
  setEditedAsset: (asset: Asset) => void;
  isEditing: boolean;
}) {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
        <Container className="w-4 h-4" />
        Información del Contenedor
      </h4>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Tipo de Contenedor</label>
          {isEditing ? (
            <Input
              value={editedAsset.container_type}
              onChange={(e) => setEditedAsset({ ...editedAsset, container_type: e.target.value })}
            />
          ) : (
            <p className="text-sm text-gray-900">{asset.container_type}</p>
          )}
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">No. Contenedor</label>
          {isEditing ? (
            <Input
              value={editedAsset.container_number || ''}
              onChange={(e) => setEditedAsset({ ...editedAsset, container_number: e.target.value })}
            />
          ) : (
            <p className="text-sm text-gray-900 font-mono">{asset.container_number}</p>
          )}
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Placa de Caja</label>
          {isEditing ? (
            <Input
              value={editedAsset.box_plate || ''}
              onChange={(e) => setEditedAsset({ ...editedAsset, box_plate: e.target.value })}
            />
          ) : (
            <p className="text-sm text-gray-900 font-medium">{asset.box_plate}</p>
          )}
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">ID Económico</label>
          {isEditing ? (
            <Input
              value={editedAsset.economic_id || ''}
              onChange={(e) => setEditedAsset({ ...editedAsset, economic_id: e.target.value })}
            />
          ) : (
            <p className="text-sm text-gray-900">{asset.economic_id}</p>
          )}
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Color</label>
          {isEditing ? (
            <Input
              value={editedAsset.color || ''}
              onChange={(e) => setEditedAsset({ ...editedAsset, color: e.target.value })}
            />
          ) : (
            <p className="text-sm text-gray-900">{asset.color}</p>
          )}
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Tamaño (ft)</label>
          {isEditing ? (
            <Input
              type="number"
              value={editedAsset.size_ft || ''}
              onChange={(e) => setEditedAsset({ ...editedAsset, size_ft: parseInt(e.target.value) })}
            />
          ) : (
            <p className="text-sm text-gray-900">{asset.size_ft ? `${asset.size_ft} ft` : 'N/A'}</p>
          )}
        </div>
        {asset.seal_number && (
          <div className="col-span-2">
            <label className="text-xs text-gray-500 block mb-1">No. Sello</label>
            {isEditing ? (
              <Input
                value={editedAsset.seal_number || ''}
                onChange={(e) => setEditedAsset({ ...editedAsset, seal_number: e.target.value })}
              />
            ) : (
              <p className="text-sm text-gray-900 font-mono">{asset.seal_number}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Componente para detalles de persona
function PersonDetails({
  asset,
  editedAsset,
  setEditedAsset,
  isEditing
}: {
  asset: PersonAsset;
  editedAsset: PersonAsset;
  setEditedAsset: (asset: Asset) => void;
  isEditing: boolean;
}) {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
        <User className="w-4 h-4" />
        Información de la Persona
      </h4>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Nombre Completo</label>
          {isEditing ? (
            <Input
              value={editedAsset.person_name}
              onChange={(e) => setEditedAsset({ ...editedAsset, person_name: e.target.value })}
            />
          ) : (
            <p className="text-sm text-gray-900 font-medium">{asset.person_name}</p>
          )}
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Rol</label>
          {isEditing ? (
            <Input
              value={editedAsset.role || ''}
              onChange={(e) => setEditedAsset({ ...editedAsset, role: e.target.value })}
            />
          ) : (
            <p className="text-sm text-gray-900">{asset.role || 'N/A'}</p>
          )}
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1 flex items-center gap-1">
            <Phone className="w-3 h-3" />
            Teléfono
          </label>
          {isEditing ? (
            <Input
              value={editedAsset.phone}
              onChange={(e) => setEditedAsset({ ...editedAsset, phone: e.target.value })}
            />
          ) : (
            <p className="text-sm text-gray-900">{asset.phone}</p>
          )}
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1 flex items-center gap-1">
            <Mail className="w-3 h-3" />
            Email
          </label>
          {isEditing ? (
            <Input
              type="email"
              value={editedAsset.email || ''}
              onChange={(e) => setEditedAsset({ ...editedAsset, email: e.target.value })}
            />
          ) : (
            <p className="text-sm text-gray-900">{asset.email || 'N/A'}</p>
          )}
        </div>
        {asset.position && (
          <div>
            <label className="text-xs text-gray-500 block mb-1">Cargo</label>
            {isEditing ? (
              <Input
                value={editedAsset.position || ''}
                onChange={(e) => setEditedAsset({ ...editedAsset, position: e.target.value })}
              />
            ) : (
              <p className="text-sm text-gray-900">{asset.position}</p>
            )}
          </div>
        )}
        {asset.emergency_phone && (
          <div>
            <label className="text-xs text-gray-500 block mb-1">Teléfono de Emergencia</label>
            {isEditing ? (
              <Input
                value={editedAsset.emergency_phone || ''}
                onChange={(e) => setEditedAsset({ ...editedAsset, emergency_phone: e.target.value })}
              />
            ) : (
              <p className="text-sm text-gray-900">{asset.emergency_phone}</p>
            )}
          </div>
        )}
        {asset.address && (
          <div className="col-span-2">
            <label className="text-xs text-gray-500 block mb-1 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              Dirección
            </label>
            {isEditing ? (
              <Input
                value={editedAsset.address || ''}
                onChange={(e) => setEditedAsset({ ...editedAsset, address: e.target.value })}
              />
            ) : (
              <p className="text-sm text-gray-900">{asset.address}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Componente para detalles de otro tipo
function OtherDetails({
  asset,
  editedAsset,
  setEditedAsset,
  isEditing
}: {
  asset: OtherAsset;
  editedAsset: OtherAsset;
  setEditedAsset: (asset: Asset) => void;
  isEditing: boolean;
}) {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
        <Box className="w-4 h-4" />
        Información del Activo
      </h4>
      <div className="grid grid-cols-2 gap-4">
        {asset.asset_type && (
          <div>
            <label className="text-xs text-gray-500 block mb-1">Tipo de Activo</label>
            {isEditing ? (
              <Input
                value={editedAsset.asset_type || ''}
                onChange={(e) => setEditedAsset({ ...editedAsset, asset_type: e.target.value })}
              />
            ) : (
              <p className="text-sm text-gray-900">{asset.asset_type}</p>
            )}
          </div>
        )}
        {asset.category && (
          <div>
            <label className="text-xs text-gray-500 block mb-1">Categoría</label>
            {isEditing ? (
              <Input
                value={editedAsset.category || ''}
                onChange={(e) => setEditedAsset({ ...editedAsset, category: e.target.value })}
              />
            ) : (
              <p className="text-sm text-gray-900">{asset.category}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
