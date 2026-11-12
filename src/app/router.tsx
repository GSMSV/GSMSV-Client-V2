import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, useParams } from 'react-router';
import { loginCallbackLoader } from '../pages/auth/callback/loader';

const DesignSystemPage = lazy(() => import('../pages/design-system/DesignSystemPage'));
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const DatabaseListPage = lazy(() => import('../pages/database/DatabaseListPage'));
const DatabaseCreatePage = lazy(() => import('../pages/database/DatabaseCreatePage'));
const DatabaseDetailPage = lazy(() => import('../pages/database/DatabaseDetailPage'));
const DatabaseBackupsPage = lazy(() => import('../pages/database/DatabaseBackupsPage'));
const DatabaseSettingsPage = lazy(() => import('../pages/database/DatabaseSettingsPage'));

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/__design-system" replace />,
  },
  {
    path: '/login/callback',
    loader: loginCallbackLoader,
  },
  {
    path: '/login',
    element: (
      <Suspense fallback={null}>
        <LoginPage />
      </Suspense>
    ),
  },
  {
    path: '/databases/new',
    element: (
      <Suspense fallback={null}>
        <DatabaseCreatePage />
      </Suspense>
    ),
  },
  {
    path: '/databases/:databaseGrn/settings',
    element: (
      <Suspense fallback={null}>
        <DatabaseSettingsRoute />
      </Suspense>
    ),
  },
  {
    path: '/databases/:databaseGrn/backups',
    element: (
      <Suspense fallback={null}>
        <DatabaseBackupsRoute />
      </Suspense>
    ),
  },
  {
    path: '/databases/:databaseGrn',
    element: (
      <Suspense fallback={null}>
        <DatabaseDetailRoute />
      </Suspense>
    ),
  },
  {
    path: '/databases',
    element: (
      <Suspense fallback={null}>
        <DatabaseListPage />
      </Suspense>
    ),
  },
  {
    path: '/__design-system',
    element: (
      <Suspense fallback={null}>
        <DesignSystemPage />
      </Suspense>
    ),
  },
]);

function DatabaseDetailRoute() {
  const { databaseGrn } = useParams<{ databaseGrn: string }>();
  return <DatabaseDetailPage key={databaseGrn} />;
}

function DatabaseBackupsRoute() {
  const { databaseGrn } = useParams<{ databaseGrn: string }>();
  return <DatabaseBackupsPage key={databaseGrn} />;
}

function DatabaseSettingsRoute() {
  const { databaseGrn } = useParams<{ databaseGrn: string }>();
  return <DatabaseSettingsPage key={databaseGrn} />;
}
