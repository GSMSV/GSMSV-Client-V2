import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router';

const DesignSystemPage = lazy(() => import('../pages/design-system/DesignSystemPage'));
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/__design-system" replace />,
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
    path: '/__design-system',
    element: (
      <Suspense fallback={null}>
        <DesignSystemPage />
      </Suspense>
    ),
  },
]);
