import { lazy, Suspense } from 'react';
import { Navigate, Outlet, type RouteObject } from 'react-router';
import { isDemoMode } from '../../shared/demo';
import { DemoAppRouteLoading, DemoStoppedAppRouteLoading } from './DemoAppRouteLoading';

const DemoAppOverviewPage = lazy(() => import('./DemoAppOverviewPage').then(module => ({ default: module.DemoAppOverviewPage })));
const DemoAppSettingsPage = lazy(() => import('./DemoAppOverviewPage').then(module => ({ default: module.DemoAppSettingsPage })));
const DemoAddServicePage = lazy(() => import('./DemoAppOverviewPage').then(module => ({ default: module.DemoAddServicePage })));
const DemoServicePage = lazy(() => import('./DemoServicePage'));
const DemoStoppedPublicAppPage = lazy(() => import('./DemoServicePage').then(module => ({ default: module.DemoStoppedPublicAppPage })));

function DemoAppsRoute() {
  return isDemoMode() ? <Outlet /> : <Navigate to="/apps" replace />;
}

export const demoAppRoutes: RouteObject[] = [{
  Component: DemoAppsRoute,
  children: [
    { path: '/apps/:appId/demo', element: <Suspense fallback={<DemoAppRouteLoading page="overview" />}><DemoAppOverviewPage /></Suspense> },
    { path: '/apps/:appId/demo-settings', element: <Suspense fallback={<DemoAppRouteLoading page="app-settings" />}><DemoAppSettingsPage /></Suspense> },
    { path: '/apps/:appId/services/new', element: <Suspense fallback={<DemoAppRouteLoading page="add-service" />}><DemoAddServicePage /></Suspense> },
    { path: '/apps/:appId/services/:serviceId/:tab?', element: <Suspense fallback={<DemoAppRouteLoading page="service" />}><DemoServicePage /></Suspense> },
    { path: '/public/:appId/stopped', element: <Suspense fallback={<DemoStoppedAppRouteLoading />}><DemoStoppedPublicAppPage /></Suspense> },
  ],
}];
