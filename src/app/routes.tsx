import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '../features/auth/LoginPage';
import { ProtectedRoute, RequireRole } from '../features/auth/guard';
import { ROUTES } from '../lib/constants';
import { Layout } from '../components/Layout';
import { HomePage } from '../pages/HomePage';
import { VehiclesPage } from '../pages/VehiclesPage';
import { VehicleDetailPage } from '../pages/VehicleDetailPage';
import { ClientsPage } from '../pages/ClientsPage';
import { ClientDetailPage } from '../pages/ClientDetailPage';
import { GeofencesPage } from '../pages/GeofencesPage';
import { ReportsPage } from '../pages/ReportsPage';
import { NotificationsPage } from '../pages/NotificationsPage';
import { RolesPage } from '../pages/RolesPage';
import { AccountPage } from '../pages/AccountPage';

export function AppRoutes() {
  return (
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
        <Route path={ROUTES.VEHICLES} element={<VehiclesPage />} />
        <Route path={ROUTES.VEHICLE_DETAIL} element={<VehicleDetailPage />} />
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
        <Route path={ROUTES.ACCOUNT} element={<AccountPage />} />

        <Route
          path={ROUTES.ROLES}
          element={
            <RequireRole allowedRoles={['admin', 'superuser']}>
              <RolesPage />
            </RequireRole>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
    </Routes>
  );
}
