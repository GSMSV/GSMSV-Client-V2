import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import { loginCallbackLoader } from '../pages/auth/callback/loader';

const DesignSystemPage = lazy(() => import('../pages/design-system/DesignSystemPage'));
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const DatabaseListPage = lazy(() => import('../pages/database/DatabaseListPage'));

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
