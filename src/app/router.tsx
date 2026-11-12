import { lazy, Suspense } from 'react';
import { createBrowserRouter, useParams } from 'react-router';
import { loginCallbackLoader } from '../pages/auth/callback/loader';

const DesignSystemPage = lazy(() => import('../pages/design-system/DesignSystemPage'));
const PersonalResourcesPage = lazy(() => import('../pages/home/PersonalResourcesPage'));
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const DatabaseListPage = lazy(() => import('../pages/database/DatabaseListPage'));
const DatabaseCreatePage = lazy(() => import('../pages/database/DatabaseCreatePage'));
const DatabaseDetailPage = lazy(() => import('../pages/database/DatabaseDetailPage'));
const DatabaseBackupsPage = lazy(() => import('../pages/database/DatabaseBackupsPage'));
const DatabaseSettingsPage = lazy(() => import('../pages/database/DatabaseSettingsPage'));
const AppsListPage = lazy(() => import('../pages/apps/AppsListPage'));
const AppCreateSourcePage = lazy(() => import('../pages/apps/AppCreateSourcePage'));
const AppCreateServicePage = lazy(() => import('../pages/apps/AppCreateServicePage'));
const AppSettingsPage = lazy(() => import('../pages/apps/AppSettingsPage'));
const AppOverviewPage = lazy(() => import('../pages/apps/AppOverviewPage'));

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <Suspense fallback={null}>
        <PersonalResourcesPage />
      </Suspense>
    ),
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
    path: '/apps/new/service',
    element: (
      <Suspense fallback={null}>
        <AppCreateServicePage />
      </Suspense>
    ),
  },
  {
    path: '/apps/new',
    element: (
      <Suspense fallback={null}>
        <AppCreateSourcePage />
      </Suspense>
    ),
  },
  {
    path: '/apps/:appGrn/settings',
    element: (
      <Suspense fallback={null}>
        <AppSettingsRoute />
      </Suspense>
    ),
  },
  {
    path: '/apps/:appGrn',
    element: (
      <Suspense fallback={null}>
        <AppOverviewRoute />
      </Suspense>
    ),
  },
  {
    path: '/apps',
    element: (
      <Suspense fallback={null}>
        <AppsListPage />
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

function AppSettingsRoute() {
  const { appGrn } = useParams<{ appGrn: string }>();
  return <AppSettingsPage key={appGrn} />;
}

function AppOverviewRoute() {
  const { appGrn } = useParams<{ appGrn: string }>();
  return <AppOverviewPage key={appGrn} />;
}

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
