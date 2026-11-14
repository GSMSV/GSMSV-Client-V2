import { lazy, Suspense } from 'react';
import type { RouteObject } from 'react-router';

const DemoAppOverviewPage = lazy(() => import('./DemoAppOverviewPage').then(module => ({ default: module.DemoAppOverviewPage })));
const DemoAppSettingsPage = lazy(() => import('./DemoAppOverviewPage').then(module => ({ default: module.DemoAppSettingsPage })));
const DemoAddServicePage = lazy(() => import('./DemoAppOverviewPage').then(module => ({ default: module.DemoAddServicePage })));
const DemoServicePage = lazy(() => import('./DemoServicePage'));
const DemoStoppedPublicAppPage = lazy(() => import('./DemoServicePage').then(module => ({ default: module.DemoStoppedPublicAppPage })));

export const demoAppRoutes: RouteObject[] = [
  { path: '/apps/:appId/demo', element: <Suspense fallback={null}><DemoAppOverviewPage /></Suspense> },
  { path: '/apps/:appId/demo-settings', element: <Suspense fallback={null}><DemoAppSettingsPage /></Suspense> },
  { path: '/apps/:appId/services/new', element: <Suspense fallback={null}><DemoAddServicePage /></Suspense> },
  { path: '/apps/:appId/services/:serviceId/:tab', element: <Suspense fallback={null}><DemoServicePage /></Suspense> },
  { path: '/public/:appId/stopped', element: <Suspense fallback={null}><DemoStoppedPublicAppPage /></Suspense> },
];

export {
  default as DemoServicePage,
  DemoStoppedPublicAppPage,
} from "./DemoServicePage";
export {
  DemoAppOverviewPage,
  DemoAppSettingsPage,
  DemoAddServicePage,
} from "./DemoAppOverviewPage";
