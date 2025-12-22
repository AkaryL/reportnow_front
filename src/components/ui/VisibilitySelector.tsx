import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usersApi } from '../../features/users/api';
import { useAuth } from '../../features/auth/hooks';
import type { VisibilityType, AssignedUser } from '../../lib/types';
import { FiGlobe, FiUser, FiUsers, FiX, FiCheck } from 'react-icons/fi';

interface VisibilitySelectorProps {
  visibility: VisibilityType;
  assignedUserIds: string[];
  clientId?: string;
  onVisibilityChange: (visibility: VisibilityType) => void;
  onAssignedUsersChange: (userIds: string[]) => void;
  existingAssignedUsers?: AssignedUser[];
}

export function VisibilitySelector({
  visibility,
  assignedUserIds,
  clientId,
  onVisibilityChange,
  onAssignedUsersChange,
  existingAssignedUsers = [],
}: VisibilitySelectorProps) {
  const { user: currentUser } = useAuth();
  const [showUserSelector, setShowUserSelector] = useState(false);

  // Obtener usuarios del cliente
  const effectiveClientId = clientId || currentUser?.client_id;
  const canSeeAllUsers = currentUser?.role === 'superuser' || currentUser?.role === 'admin';

  // Si es superuser/admin, obtener todos los usuarios y filtrar por client_id
  // Si no, usar el endpoint con filtro
  const { data: allUsers = [] } = useQuery({
    queryKey: ['users', 'all'],
    queryFn: () => usersApi.getAll(),
    enabled: canSeeAllUsers && visibility === 'assigned',
  });

  const { data: clientUsersFromApi = [] } = useQuery({
    queryKey: ['users', 'client', effectiveClientId],
    queryFn: () => effectiveClientId ? usersApi.getByClientId(effectiveClientId) : Promise.resolve([]),
    enabled: !canSeeAllUsers && !!effectiveClientId && visibility === 'assigned',
  });

  // Combinar: si es superuser/admin, filtrar todos por client_id, si no usar los del API
  const clientUsers = canSeeAllUsers
    ? allUsers.filter(u => u.client_id === effectiveClientId)
    : clientUsersFromApi;

  // Todos los usuarios del cliente (incluyendo el actual)
  const selectableUsers = clientUsers;

  const handleUserToggle = (userId: string) => {
    if (assignedUserIds.includes(userId)) {
      onAssignedUsersChange(assignedUserIds.filter(id => id !== userId));
    } else {
      onAssignedUsersChange([...assignedUserIds, userId]);
    }
  };

  const handleSelectAll = () => {
    onAssignedUsersChange(selectableUsers.map(u => u.id));
  };

  const handleDeselectAll = () => {
    onAssignedUsersChange([]);
  };

  const visibilityOptions: { value: VisibilityType; label: string; description: string; icon: React.ReactNode }[] = [
    {
      value: 'all',
      label: 'Todos',
      description: 'Visible para todos los usuarios de la organización',
      icon: <FiGlobe className="w-5 h-5" />,
    },
    {
      value: 'owner_only',
      label: 'Solo yo',
      description: 'Solo visible para mí',
      icon: <FiUser className="w-5 h-5" />,
    },
    {
      value: 'assigned',
      label: 'Usuarios específicos',
      description: 'Visible solo para usuarios seleccionados',
      icon: <FiUsers className="w-5 h-5" />,
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Visibilidad
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {visibilityOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onVisibilityChange(option.value)}
              className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                visibility === option.value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
              }`}
            >
              <div className={`mb-2 ${visibility === option.value ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`}>
                {option.icon}
              </div>
              <span className={`text-sm font-medium ${
                visibility === option.value ? 'text-primary' : 'text-gray-700 dark:text-gray-300'
              }`}>
                {option.label}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
                {option.description}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Selector de usuarios cuando visibility === 'assigned' */}
      {visibility === 'assigned' && (
        <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Usuarios asignados ({assignedUserIds.length})
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs text-primary hover:text-primary/80"
              >
                Seleccionar todos
              </button>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <button
                type="button"
                onClick={handleDeselectAll}
                className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                Deseleccionar
              </button>
            </div>
          </div>

          {selectableUsers.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              No hay otros usuarios en esta organización
            </p>
          ) : (
            <div className="max-h-48 overflow-y-auto space-y-2">
              {selectableUsers.map((user) => (
                <label
                  key={user.id}
                  className={`flex items-center p-2 rounded-md cursor-pointer transition-colors ${
                    assignedUserIds.includes(user.id)
                      ? 'bg-primary/10 border border-primary'
                      : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-transparent'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={assignedUserIds.includes(user.id)}
                    onChange={() => handleUserToggle(user.id)}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center mr-3 ${
                    assignedUserIds.includes(user.id)
                      ? 'bg-primary border-primary text-white'
                      : 'border-gray-300 dark:border-gray-500'
                  }`}>
                    {assignedUserIds.includes(user.id) && <FiCheck className="w-3 h-3" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {user.email} - {
                        user.role === 'superuser' ? 'Superusuario' :
                        user.role === 'admin' ? 'Administrador' :
                        user.role === 'operator_admin' ? 'Operador Admin' :
                        user.role === 'operator_monitor' ? 'Operador Monitor' :
                        user.role
                      }
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}

          {/* Mostrar usuarios asignados actualmente (de la BD) */}
          {existingAssignedUsers.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Usuarios actualmente asignados:
              </p>
              <div className="flex flex-wrap gap-1">
                {existingAssignedUsers.map((user) => (
                  <span
                    key={user.id}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  >
                    {user.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
