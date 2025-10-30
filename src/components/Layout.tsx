import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks';
import { ROUTES, APP_NAME } from '../lib/constants';
import { Button } from './ui/Button';
import {
  LayoutDashboard,
  Truck,
  Users,
  FileText,
  Bell,
  Shield,
  LogOut,
  Menu,
  X,
  MapPin,
  UserCircle,
  Radio,
  Box,
  User,
  CreditCard,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '../lib/utils';

const navigation = [
  { name: 'Inicio', href: ROUTES.HOME, icon: LayoutDashboard, roles: ['superuser', 'admin', 'operator-admin', 'operator-monitor'] },
  { name: 'Activos', href: ROUTES.ASSETS, icon: Box, roles: ['admin', 'operator-admin', 'operator-monitor'] },
  { name: 'Conductores', href: ROUTES.DRIVERS, icon: User, roles: ['admin', 'operator-admin', 'operator-monitor'] },
  { name: 'Lugares', href: ROUTES.PLACES, icon: MapPin, roles: ['admin', 'operator-admin', 'operator-monitor'] },
  { name: 'Geocercas', href: ROUTES.GEOFENCES, icon: MapPin, roles: ['superuser', 'admin', 'operator-admin', 'operator-monitor'] },
  { name: 'Equipos GPS', href: ROUTES.EQUIPMENTS, icon: Radio, roles: ['superuser'] },
  { name: 'Tarjetas SIM', href: ROUTES.SIMS, icon: CreditCard, roles: ['superuser'] },
  { name: 'Clientes', href: ROUTES.CLIENTS, icon: Users, roles: ['superuser'] },
  { name: 'Usuarios', href: ROUTES.USERS, icon: Shield, roles: ['superuser', 'admin', 'operator-admin'] },
  { name: 'Reportes', href: ROUTES.REPORTS, icon: FileText, roles: ['superuser', 'admin', 'operator-admin'] },
  { name: 'Notificaciones', href: ROUTES.NOTIFICATIONS, icon: Bell, roles: ['superuser', 'admin', 'operator-admin', 'operator-monitor'] },
  { name: 'Mi Cuenta', href: ROUTES.ACCOUNT, icon: UserCircle, roles: ['admin', 'operator-admin', 'operator-monitor'] },
];

export function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const filteredNavigation = navigation.filter((item) =>
    item.roles.includes(user?.role || '')
  );

  // Ya no usamos ClientLayout separado - todos usan el mismo layout
  // (Podemos eliminarlo o modificarlo si es necesario después)

  return (
    <div className="min-h-screen flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex lg:flex-col w-[200px] bg-white/0 border-r border-app-border fixed left-0 top-0 bottom-0 z-40">
        {/* Header de marca */}
        <div className="p-4 pb-6">
          <div className="flex items-start gap-2">
            {/* Logotipo circular */}
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-info-500 flex items-center justify-center flex-shrink-0">
              <Truck className="w-3.5 h-3.5 text-white" />
            </div>
            {/* Texto en dos líneas */}
            <div className="flex flex-col leading-tight">
              <span className="text-[14px] font-semibold text-gray-900">ReportNow</span>
              <span className="text-[12px] text-slate-400">Monitoreo</span>
            </div>
          </div>
        </div>

        {/* Menú vertical */}
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          {filteredNavigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;

            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-xl text-[14px] transition-colors',
                  isActive
                    ? 'bg-[#E8F4FD] text-[#0B74C9] font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <Icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Info and Logout */}
        <div className="p-4 border-t border-app-border">
          <div className="mb-3">
            <p className="text-[12px] font-medium text-gray-900 truncate">{user?.name}</p>
            <p className="text-[11px] text-slate-500 capitalize mt-0.5">{user?.role}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={logout} className="w-full justify-start text-[12px] h-8 px-2">
            <LogOut className="w-3.5 h-3.5" />
            Salir
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-app-border">
        <div className="flex justify-between items-center h-16 px-4">
          <div className="flex items-center gap-4">
            <button
              className="text-gray-600 hover:text-gray-900"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <h1 className="text-xl font-bold text-primary">{APP_NAME}</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="border-t border-app-border bg-white max-h-[calc(100vh-4rem)] overflow-y-auto">
            <nav className="px-4 py-4 space-y-1">
              {filteredNavigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;

                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary-50 text-primary'
                        : 'text-gray-600 hover:bg-gray-100'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            <div className="px-4 py-4 border-t border-app-border">
              <div className="text-sm font-medium text-gray-900">{user?.name}</div>
              <div className="text-xs text-gray-500 capitalize">{user?.role}</div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <main className="flex-1 lg:ml-[200px] mt-16 lg:mt-0 bg-[#F6F8FB] min-h-screen">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
