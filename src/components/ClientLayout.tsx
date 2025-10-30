import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks';
import { ROUTES } from '../lib/constants';
import {
  LayoutDashboard,
  Truck,
  Bell,
  UserCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  MapPin,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '../lib/utils';

const navigation = [
  { name: 'Inicio', href: ROUTES.HOME, icon: LayoutDashboard },
  { name: 'Vehículos', href: ROUTES.VEHICLES, icon: Truck },
  { name: 'Geocercas', href: ROUTES.GEOFENCES, icon: MapPin },
  { name: 'Notificaciones', href: ROUTES.NOTIFICATIONS, icon: Bell },
  { name: 'Mi Cuenta', href: ROUTES.ACCOUNT, icon: UserCircle },
];

export function ClientLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="client-view-bg min-h-screen flex">
      {/* Glassmorphism Sidebar */}
      <aside
        className={cn(
          'glass-sidebar fixed left-0 top-0 bottom-0 z-40 flex flex-col',
          isCollapsed ? 'w-[72px]' : 'w-[280px]'
        )}
      >
        {/* Header with logo and collapse toggle */}
        <div className="p-4">
          <div className="glass-header-pill flex items-center justify-between">
            {!isCollapsed && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-green-500 flex items-center justify-center flex-shrink-0">
                  <Truck className="w-4 h-4 text-white" strokeWidth={2.5} />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-white">ReportNow</span>
                  <span className="text-xs text-white/60">Cliente</span>
                </div>
              </div>
            )}
            {isCollapsed && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-green-500 flex items-center justify-center mx-auto">
                <Truck className="w-4 h-4 text-white" strokeWidth={2.5} />
              </div>
            )}
          </div>

          {/* Collapse toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="glass-collapse-toggle mt-3 ml-auto"
            aria-label={isCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation section */}
        <nav className="flex-1 px-4 overflow-y-auto scrollbar-hide">
          {!isCollapsed && (
            <div className="glass-section-title">Navegación</div>
          )}

          <div className="space-y-2 mb-6">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'glass-nav-item',
                    isActive && 'active'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="flex-shrink-0" />
                  {!isCollapsed && (
                    <span className="nav-text">{item.name}</span>
                  )}
                </Link>
              );
            })}
          </div>

          {!isCollapsed && <div className="glass-divider" />}
        </nav>

        {/* Footer - User Info */}
        <div className="p-4 space-y-2">
          {/* User info */}
          <div className="glass-header-pill">
            {!isCollapsed ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold text-white">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {user?.name}
                    </p>
                    <p className="text-xs text-white/60 truncate">
                      Cliente
                    </p>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="glass-chip w-full justify-start text-red-400 hover:text-red-300"
                >
                  <LogOut className="flex-shrink-0" />
                  <span>Cerrar sesión</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center mx-auto">
                  <span className="text-xs font-semibold text-white">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="glass-chip w-full justify-center text-red-400 hover:text-red-300"
                  aria-label="Cerrar sesión"
                >
                  <LogOut className="flex-shrink-0" />
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={cn(
          'flex-1 min-h-screen relative z-10 transition-all duration-200',
          isCollapsed ? 'ml-[72px]' : 'ml-[280px]'
        )}
      >
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
