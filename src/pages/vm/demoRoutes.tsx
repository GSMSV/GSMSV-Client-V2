import type { RouteObject } from 'react-router';
import VMNetworkPage from '../network/VMNetworkPage';
import { VmCreatePage, type VmCreateStep } from './VmCreatePage';
import { VmMonitoringPage } from './VmMonitoringPage';
import { VmOverviewPage } from './VmOverviewPage';
import { VmSettingsPage } from './VmSettingsPage';
import { VmSnapshotsPage } from './VmSnapshotsPage';
import { TeamVmListPage } from './TeamVmListPage';

function CreateRoute({ owner, step }: { owner: 'personal' | 'team'; step: VmCreateStep }) {
  return <VmCreatePage owner={owner} step={step} />;
}

export const demoVmRoutes: RouteObject[] = [
  { path: '/vms/new', element: <CreateRoute owner="personal" step="spec" /> },
  { path: '/vms/new/details', element: <CreateRoute owner="personal" step="details" /> },
  { path: '/vms/new/review', element: <CreateRoute owner="personal" step="review" /> },
  { path: '/vms/:vmId/monitoring', element: <VmMonitoringPage /> },
  { path: '/vms/:vmId/snapshots', element: <VmSnapshotsPage /> },
  { path: '/vms/:vmId/settings', element: <VmSettingsPage /> },
  { path: '/vms/:vmId', element: <VmOverviewPage /> },
  { path: '/teams/:teamId/vms', element: <TeamVmListPage /> },
  { path: '/teams/:teamId/vms/new', element: <CreateRoute owner="team" step="spec" /> },
  { path: '/teams/:teamId/vms/new/details', element: <CreateRoute owner="team" step="details" /> },
  { path: '/teams/:teamId/vms/new/review', element: <CreateRoute owner="team" step="review" /> },
  { path: '/teams/:teamId/vms/:vmId/monitoring', element: <VmMonitoringPage /> },
  { path: '/teams/:teamId/vms/:vmGrn/network', element: <VMNetworkPage /> },
  { path: '/teams/:teamId/vms/:vmId/snapshots', element: <VmSnapshotsPage /> },
  { path: '/teams/:teamId/vms/:vmId/settings', element: <VmSettingsPage /> },
  { path: '/teams/:teamId/vms/:vmId', element: <VmOverviewPage /> },
];
