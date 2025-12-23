import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '../features/auth/LoginPage';
import { ProtectedRoute, RequireRole } from '../features/auth/guard';
import { ROUTES } from '../lib/constants';
import { Layout } from '../components/Layout';

// Lazy load de páginas para mejorar code splitting
const HomePage = lazy(() => import('../pages/HomePage').then(m => ({ default: m.HomePage })));
const ClientsPage = lazy(() => import('../pages/ClientsPage').then(m => ({ default: m.ClientsPage })));
const ClientDetailPage = lazy(() => import('../pages/ClientDetailPage').then(m => ({ default: m.ClientDetailPage })));
const GeofencesPage = lazy(() => import('../pages/GeofencesPage').then(m => ({ default: m.GeofencesPage })));
const ReportsPage = lazy(() => import('../pages/ReportsPage').then(m => ({ default: m.ReportsPage })));
const NotificationsPage = lazy(() => import('../pages/NotificationsPage').then(m => ({ default: m.NotificationsPage })));
const RolesPage = lazy(() => import('../pages/RolesPage').then(m => ({ default: m.RolesPage })));
const AccountPage = lazy(() => import('../pages/AccountPage').then(m => ({ default: m.AccountPage })));
const AdminUsersPage = lazy(() => import('../pages/AdminUsersPage').then(m => ({ default: m.AdminUsersPage })));
const AdminProfilePage = lazy(() => import('../pages/AdminProfilePage').then(m => ({ default: m.AdminProfilePage })));
const EquipmentsPage = lazy(() => import('../pages/EquipmentsPage').then(m => ({ default: m.EquipmentsPage })));
const EquipmentDetailPage = lazy(() => import('../pages/EquipmentDetailPage').then(m => ({ default: m.EquipmentDetailPage })));
const AssetsPage = lazy(() => import('../pages/AssetsPage').then(m => ({ default: m.AssetsPage })));
const DriversPage = lazy(() => import('../pages/DriversPage').then(m => ({ default: m.DriversPage })));
const PlacesPage = lazy(() => import('../pages/PlacesPage').then(m => ({ default: m.PlacesPage })));
const SIMsPage = lazy(() => import('../pages/SIMsPage').then(m => ({ default: m.SIMsPage })));
const VehicleHistoryPage = lazy(() => import('../pages/VehicleHistoryPage'));
const RouteSimulationPage = lazy(() => import('../pages/RouteSimulationPage').then(m => ({ default: m.RouteSimulationPage })));
const NotificationSettingsPage = lazy(() => import('../pages/NotificationSettingsPage').then(m => ({ default: m.NotificationSettingsPage })));

// Loading spinner component
function PageLoader() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
}

export function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<HomePage />} />
          <Route path={ROUTES.GEOFENCES} element={<GeofencesPage />} />

          <Route
            path={ROUTES.CLIENTS}
            element={
              <RequireRole allowedRoles={['admin', 'superuser']}>
                <ClientsPage />
              </RequireRole>
            }
          />

          <Route
            path={ROUTES.CLIENT_DETAIL}
            element={
              <RequireRole allowedRoles={['admin', 'superuser']}>
                <ClientDetailPage />
              </RequireRole>
            }
          />

          <Route path={ROUTES.REPORTS} element={<ReportsPage />} />
          <Route path={ROUTES.NOTIFICATIONS} element={<NotificationsPage />} />

          {/* Redirigir /alertas a /notificaciones */}
          <Route path={ROUTES.ALERTS} element={<Navigate to={ROUTES.NOTIFICATIONS} replace />} />

          <Route path={ROUTES.ACCOUNT} element={<AccountPage />} />

          <Route
            path={ROUTES.ROLES}
            element={
              <RequireRole allowedRoles={['admin', 'superuser']}>
                <RolesPage />
              </RequireRole>
            }
          />

          {/* Users Management - Solo para superuser */}
          <Route
            path={ROUTES.USERS}
            element={
              <RequireRole allowedRoles={['superuser']}>
                <AdminUsersPage />
              </RequireRole>
            }
          />

          <Route
            path="/usuarios/:id"
            element={
              <RequireRole allowedRoles={['superuser']}>
                <AdminProfilePage />
              </RequireRole>
            }
          />

          {/* Equipos GPS - Solo para superuser */}
          <Route
            path={ROUTES.EQUIPMENTS}
            element={
              <RequireRole allowedRoles={['superuser']}>
                <EquipmentsPage />
              </RequireRole>
            }
          />

          {/* Detalle de Equipo GPS - Solo para superuser */}
          <Route
            path="/equipos/:id"
            element={
              <RequireRole allowedRoles={['superuser']}>
                <EquipmentDetailPage />
              </RequireRole>
            }
          />

          {/* SIMs - Solo para superuser */}
          <Route
            path={ROUTES.SIMS}
            element={
              <RequireRole allowedRoles={['superuser']}>
                <SIMsPage />
              </RequireRole>
            }
          />

          {/* Activos - Para superuser, admin y operators */}
          <Route
            path={ROUTES.ASSETS}
            element={
              <RequireRole allowedRoles={['superuser', 'admin', 'operator_admin', 'operator_monitor']}>
                <AssetsPage />
              </RequireRole>
            }
          />

          {/* Conductores - Para admin y operators */}
          <Route
            path={ROUTES.DRIVERS}
            element={
              <RequireRole allowedRoles={['admin', 'operator_admin', 'operator_monitor']}>
                <DriversPage />
              </RequireRole>
            }
          />

          {/* Lugares - Para admin y operators */}
          <Route
            path={ROUTES.PLACES}
            element={
              <RequireRole allowedRoles={['admin', 'operator_admin', 'operator_monitor']}>
                <PlacesPage />
              </RequireRole>
            }
          />

          {/* Historial de Vehículos - Temporal (acceso para todos) */}
          <Route path="/historial-rastreo" element={<VehicleHistoryPage />} />

          {/* Simulación de Ruta - Solo para superuser */}
          <Route
            path={ROUTES.ROUTE_SIMULATION}
            element={
              <RequireRole allowedRoles={['superuser']}>
                <RouteSimulationPage />
              </RequireRole>
            }
          />

          {/* Configuración - Solo para admin de organización */}
          <Route
            path={ROUTES.SETTINGS}
            element={
              <RequireRole allowedRoles={['operator_admin', 'admin', 'superuser']}>
                <NotificationSettingsPage />
              </RequireRole>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
      </Routes>
    </Suspense>
  );
}
