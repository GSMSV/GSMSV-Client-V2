import { lazy, Suspense } from 'react';
import type { RouteObject } from 'react-router';

const DatabaseQueryDemoPage = lazy(() => import('../database/DatabaseQueryDemoPage'));
const DedicatedDatabaseRequestPage = lazy(() => import('../database/DedicatedDatabaseRequestPage'));
const AdminDatabaseApprovalsDemoPage = lazy(() => import('../admin/AdminDatabaseApprovalsDemoPage'));
const AdminTeamApprovalsDemoPage = lazy(() => import('../admin/AdminTeamApprovalsDemoPage'));
const InquiryDemoPage = lazy(() => import('../support/InquiryDemoPage'));
const AdminInquiriesDemoPage = lazy(() => import('../admin/AdminInquiriesDemoPage'));
const DemoAdminAccountsPage = lazy(() => import('../admin/DemoAdminAccountsPage'));
const DemoAdminVmDetailPage = lazy(() => import('../admin/DemoAdminVmDetailPage'));
const CliLoginApprovalDemoPage = lazy(() => import('../auth/CliLoginApprovalDemoPage'));

function screen(Element: typeof DatabaseQueryDemoPage) {
  return <Suspense fallback={null}><Element /></Suspense>;
}

/** Routes for frontend-only Figma preview flows; merge into the central router after this slice lands. */
export const demoDatabaseSupportRoutes: RouteObject[] = [
  { path: '/databases/:databaseId/query', element: screen(DatabaseQueryDemoPage) },
  { path: '/databases/dedicated/new', element: screen(DedicatedDatabaseRequestPage) },
  { path: '/teams/:teamId/databases/dedicated/new', element: screen(DedicatedDatabaseRequestPage) },
  { path: '/admin/database-approvals', element: screen(AdminDatabaseApprovalsDemoPage) },
  { path: '/admin/team-approvals', element: screen(AdminTeamApprovalsDemoPage) },
  { path: '/support/inquiries', element: screen(InquiryDemoPage) },
  { path: '/admin/inquiries', element: screen(AdminInquiriesDemoPage) },
  { path: '/admin/accounts', element: screen(DemoAdminAccountsPage) },
  { path: '/admin/vms/:vmId', element: screen(DemoAdminVmDetailPage) },
  { path: '/cli/approve', element: screen(CliLoginApprovalDemoPage) },
];
