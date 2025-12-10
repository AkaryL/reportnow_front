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
      <aside className="hidden lg:flex lg:flex-col w-[200px] !bg-white dark:!bg-gray-900 border-r border-gray-200 dark:border-gray-800 fixed left-0 top-0 bottom-0 z-40 transition-colors duration-200">
        {/* Header de marca */}
        <div className="p-4 pb-6">
          <div className="flex items-start gap-2">
            {/* Logotipo circular */}
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-info-500 flex items-center justify-center flex-shrink-0">
              <Truck className="w-3.5 h-3.5 text-white" />
            </div>
            {/* Texto en dos líneas */}
            <div className="flex flex-col leading-tight">
              <span className="text-[14px] font-semibold text-gray-900 dark:text-gray-50">ReportNow</span>
              <span className="text-[12px] text-gray-500 dark:text-gray-400">Monitoreo</span>
            </div>
          </div>
        </div>

        {/* Menú vertical */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {filteredNavigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;

            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150',
                  isActive
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
                )}
              >
                <Icon className={cn(
                  'w-4 h-4',
                  isActive ? 'text-primary-500 dark:text-primary-400' : ''
                )} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Info and Logout */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <div className="mb-3 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-medium text-gray-900 dark:text-gray-100 truncate">{user?.name}</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 capitalize mt-0.5">{user?.role}</p>
            </div>
            <ThemeToggle size="sm" />
          </div>
          <Button variant="ghost" size="sm" onClick={logout} className="w-full justify-start text-[12px] h-8 px-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800">
            <LogOut className="w-3.5 h-3.5" />
            Salir
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 transition-colors duration-200">
        <div className="flex justify-between items-center h-16 px-4">
          <div className="flex items-center gap-4">
            <button
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <h1 className="text-xl font-bold text-primary-600 dark:text-primary-400">{APP_NAME}</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle size="sm" />
            <Button variant="ghost" size="sm" onClick={logout} className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 max-h-[calc(100vh-4rem)] overflow-y-auto transition-colors duration-200">
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
                      'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150',
                      isActive
                        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
                    )}
                  >
                    <Icon className={cn(
                      'w-5 h-5',
                      isActive ? 'text-primary-500 dark:text-primary-400' : ''
                    )} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-800">
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{user?.name}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role}</div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <main className="flex-1 lg:ml-[200px] mt-16 lg:mt-0 !bg-[#f5f7fb] dark:!bg-gray-950 min-h-screen overflow-x-hidden w-full max-w-full transition-colors duration-200">
        <div className="px-4 sm:px-6 lg:px-8 py-6 w-full max-w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
