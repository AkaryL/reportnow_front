import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks';
import { ROUTES, APP_NAME } from '../lib/constants';
import { Button } from './ui/Button';
import { ThemeToggle } from './ThemeToggle';
import {
  LayoutDashboard,
  Truck,
  Users,
  FileText,
  Bell,
  AlertTriangle,
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
  { name: 'Inicio', href: ROUTES.HOME, icon: LayoutDashboard, roles: ['superuser', 'admin', 'operator_admin', 'operator_monitor'] },
  { name: 'Activos', href: ROUTES.ASSETS, icon: Box, roles: ['superuser', 'admin', 'operator_admin', 'operator_monitor'] },
  { name: 'Conductores', href: ROUTES.DRIVERS, icon: User, roles: ['admin', 'operator_admin', 'operator_monitor'] },
  { name: 'Lugares', href: ROUTES.PLACES, icon: MapPin, roles: ['admin', 'operator_admin', 'operator_monitor'] },
  { name: 'Geocercas', href: ROUTES.GEOFENCES, icon: MapPin, roles: ['superuser', 'admin', 'operator_admin', 'operator_monitor'] },
  { name: 'Equipos GPS', href: ROUTES.EQUIPMENTS, icon: Radio, roles: ['superuser'] },
  { name: 'Tarjetas SIM', href: ROUTES.SIMS, icon: CreditCard, roles: ['superuser'] },
  { name: 'Clientes', href: ROUTES.CLIENTS, icon: Users, roles: ['superuser'] },
  { name: 'Usuarios', href: ROUTES.USERS, icon: Shield, roles: ['superuser'] },
  { name: 'Reportes', href: ROUTES.REPORTS, icon: FileText, roles: ['superuser', 'admin', 'operator_admin'] },
  { name: 'Alertas', href: ROUTES.ALERTS, icon: AlertTriangle, roles: ['superuser', 'admin', 'operator_admin', 'operator_monitor'] },
  { name: 'Notificaciones', href: ROUTES.NOTIFICATIONS, icon: Bell, roles: ['superuser', 'admin', 'operator_admin', 'operator_monitor'] },
  { name: 'Mi Cuenta', href: ROUTES.ACCOUNT, icon: UserCircle, roles: ['admin', 'operator_admin', 'operator_monitor'] },
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
    <div className="min-h-screen flex overflow-x-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex lg:flex-col w-[200px] bg-white/0 dark:bg-gray-900/0 border-r border-app-border dark:border-gray-700 fixed left-0 top-0 bottom-0 z-40">
        {/* Header de marca */}
        <div className="p-4 pb-6">
          <div className="flex items-start gap-2">
            {/* Logotipo circular */}
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-info-500 flex items-center justify-center flex-shrink-0">
              <Truck className="w-3.5 h-3.5 text-white" />
            </div>
            {/* Texto en dos líneas */}
            <div className="flex flex-col leading-tight">
              <span className="text-[14px] font-semibold text-gray-900 dark:text-white">ReportNow</span>
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
                    ? 'bg-[#E8F4FD] dark:bg-primary/20 text-[#0B74C9] dark:text-primary-300 font-medium'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                )}
              >
                <Icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Info and Logout */}
        <div className="p-4 border-t border-app-border dark:border-gray-700">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-[12px] font-medium text-gray-900 dark:text-gray-100 truncate">{user?.name}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 capitalize mt-0.5">{user?.role}</p>
            </div>
            <ThemeToggle size="sm" />
          </div>
          <Button variant="ghost" size="sm" onClick={logout} className="w-full justify-start text-[12px] h-8 px-2">
            <LogOut className="w-3.5 h-3.5" />
            Salir
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-white dark:bg-gray-900 border-b border-app-border dark:border-gray-700">
        <div className="flex justify-between items-center h-16 px-4">
          <div className="flex items-center gap-4">
            <button
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <h1 className="text-xl font-bold text-primary">{APP_NAME}</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle size="sm" />
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="border-t border-app-border dark:border-gray-700 bg-white dark:bg-gray-900 max-h-[calc(100vh-4rem)] overflow-y-auto">
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
                        ? 'bg-primary-50 dark:bg-primary/20 text-primary dark:text-primary-300'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            <div className="px-4 py-4 border-t border-app-border dark:border-gray-700">
              <div className="text-sm font-medium text-gray-900 dark:text-white">{user?.name}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role}</div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <main className="flex-1 lg:ml-[200px] mt-16 lg:mt-0 bg-[#F6F8FB] dark:bg-gray-900 min-h-screen overflow-x-hidden w-full max-w-full">
        <div className="px-4 sm:px-6 lg:px-8 py-6 w-full max-w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
