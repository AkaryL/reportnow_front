import { useAuth } from '../features/auth/hooks';
import { Card } from '../components/ui/Card';
import { ClientCard } from '../components/ui/ClientCard';
import { Topbar } from '../components/Topbar';
import { UserCircle, Mail, Building2, Shield, Calendar } from 'lucide-react';
import { formatDate } from '../lib/utils';

export function AccountPage() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  const isClient = user.role === 'admin';
  const CardComponent = isClient ? ClientCard : Card;

  return (
    <div className="space-y-0">
      {/* Topbar - solo para admin/superuser */}
      {!isClient && (
        <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-6">
          <Topbar
            title="Mi Cuenta"
            subtitle="Información de tu perfil y organización"
          />
        </div>
      )}

      <div className={isClient ? 'space-y-5' : 'pt-6 space-y-5'}>
        {/* Header para cliente */}
        {isClient && (
          <div className="mb-6">
            <h1 className="client-heading text-3xl mb-2">Mi Cuenta</h1>
            <p className="client-subheading">Información de tu perfil y organización</p>
          </div>
        )}

        {/* Información del Usuario */}
        <CardComponent className={isClient ? 'p-6' : 'p-6'}>
          <div className="flex items-start gap-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 ${
              isClient ? 'bg-gradient-to-br from-cyan-500 to-blue-500' : 'bg-primary/10'
            }`}>
              <UserCircle className={`w-10 h-10 ${isClient ? 'text-white' : 'text-primary'}`} />
            </div>
            <div className="flex-1">
              <h2 className={`text-2xl font-bold ${isClient ? 'client-text-primary' : 'text-gray-900'}`}>
                {user.name}
              </h2>
              <p className={`text-sm capitalize mt-1 ${isClient ? 'client-text-secondary' : 'text-gray-500'}`}>
                {user.role === 'admin' ? 'Administrador (Cliente)' : user.role === 'operator-admin' ? 'Operador Administrador' : user.role === 'operator-monitor' ? 'Operador Monitor' : user.role}
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email */}
            <div className={`flex items-start gap-3 p-4 rounded-lg ${
              isClient ? 'bg-white/5 border border-white/10' : 'bg-gray-50'
            }`}>
              <Mail className={`w-5 h-5 mt-0.5 ${isClient ? 'text-cyan-400' : 'text-gray-500'}`} />
              <div>
                <p className={`text-xs mb-1 ${isClient ? 'client-text-tertiary' : 'text-gray-500'}`}>
                  Correo electrónico
                </p>
                <p className={`text-sm font-medium ${isClient ? 'client-text-primary' : 'text-gray-900'}`}>
                  {user.email}
                </p>
              </div>
            </div>

            {/* Cliente/Organización */}
            {user.client_name && (
              <div className={`flex items-start gap-3 p-4 rounded-lg ${
                isClient ? 'bg-white/5 border border-white/10' : 'bg-gray-50'
              }`}>
                <Building2 className={`w-5 h-5 mt-0.5 ${isClient ? 'text-green-400' : 'text-gray-500'}`} />
                <div>
                  <p className={`text-xs mb-1 ${isClient ? 'client-text-tertiary' : 'text-gray-500'}`}>
                    Organización
                  </p>
                  <p className={`text-sm font-medium ${isClient ? 'client-text-primary' : 'text-gray-900'}`}>
                    {user.client_name}
                  </p>
                </div>
              </div>
            )}

            {/* Rol */}
            <div className={`flex items-start gap-3 p-4 rounded-lg ${
              isClient ? 'bg-white/5 border border-white/10' : 'bg-gray-50'
            }`}>
              <Shield className={`w-5 h-5 mt-0.5 ${isClient ? 'text-blue-400' : 'text-gray-500'}`} />
              <div>
                <p className={`text-xs mb-1 ${isClient ? 'client-text-tertiary' : 'text-gray-500'}`}>
                  Rol
                </p>
                <p className={`text-sm font-medium capitalize ${isClient ? 'client-text-primary' : 'text-gray-900'}`}>
                  {user.role === 'admin' ? 'Administrador (Cliente)' : user.role === 'operator-admin' ? 'Operador Administrador' : user.role === 'operator-monitor' ? 'Operador Monitor' : user.role}
                </p>
              </div>
            </div>

            {/* Fecha de creación */}
            {user.created_at && (
              <div className={`flex items-start gap-3 p-4 rounded-lg ${
                isClient ? 'bg-white/5 border border-white/10' : 'bg-gray-50'
              }`}>
                <Calendar className={`w-5 h-5 mt-0.5 ${isClient ? 'text-purple-400' : 'text-gray-500'}`} />
                <div>
                  <p className={`text-xs mb-1 ${isClient ? 'client-text-tertiary' : 'text-gray-500'}`}>
                    Miembro desde
                  </p>
                  <p className={`text-sm font-medium ${isClient ? 'client-text-primary' : 'text-gray-900'}`}>
                    {formatDate(user.created_at)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardComponent>

        {/* Información Adicional */}
        <CardComponent className="p-6">
          <h3 className={`text-lg font-semibold mb-4 ${isClient ? 'client-heading' : 'text-gray-900'}`}>
            Información de Acceso
          </h3>
          <div className="space-y-3">
            <div className={`flex items-center justify-between py-2 border-b ${
              isClient ? 'border-white/8' : 'border-gray-100'
            }`}>
              <span className={`text-sm ${isClient ? 'client-text-secondary' : 'text-gray-600'}`}>
                ID de Usuario
              </span>
              <span className={`text-sm font-mono font-medium ${isClient ? 'client-text-primary' : 'text-gray-900'}`}>
                {user.id}
              </span>
            </div>
            {user.client_id && (
              <div className={`flex items-center justify-between py-2 border-b ${
                isClient ? 'border-white/8' : 'border-gray-100'
              }`}>
                <span className={`text-sm ${isClient ? 'client-text-secondary' : 'text-gray-600'}`}>
                  ID de Cliente
                </span>
                <span className={`text-sm font-mono font-medium ${isClient ? 'client-text-primary' : 'text-gray-900'}`}>
                  {user.client_id}
                </span>
              </div>
            )}
          </div>
        </CardComponent>

        {/* Información de Contacto */}
        <CardComponent className="p-6">
          <h3 className={`text-lg font-semibold mb-4 ${isClient ? 'client-heading' : 'text-gray-900'}`}>
            Ayuda y Soporte
          </h3>
          <p className={`text-sm mb-4 ${isClient ? 'client-text-secondary' : 'text-gray-600'}`}>
            Si necesitas ayuda o tienes alguna pregunta sobre tu cuenta, contacta a tu administrador.
          </p>
          <div className={`rounded-lg p-4 ${
            isClient
              ? 'bg-cyan-500/10 border border-cyan-500/30'
              : 'bg-blue-50 border border-blue-200'
          }`}>
            <p className={`text-sm ${isClient ? 'text-cyan-300' : 'text-blue-800'}`}>
              <strong>Nota:</strong> Para actualizar tu información de perfil o cambiar tu contraseña,
              contacta al administrador del sistema.
            </p>
          </div>
        </CardComponent>
      </div>
    </div>
  );
}
