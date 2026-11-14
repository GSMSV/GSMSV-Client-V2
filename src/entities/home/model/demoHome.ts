import type { AppSummary } from '../../app/model/types';
import type { MyQuota } from '../../quota/model/types';
import type { TeamSummary } from '../../team/model/types';
import { isDemoMode, readDemoState, writeDemoState } from '../../../shared/demo';

export interface DemoFunctionSummary {
  id: string;
  name: string;
  runtime: string;
  status: 'active' | 'paused';
  executionsToday: number;
}

export interface DemoHomeState {
  firstVisit: boolean;
  functions: DemoFunctionSummary[];
}

const seedHome: DemoHomeState = {
  firstVisit: false,
  functions: [
    { id: 'fn-weather-api', name: 'weather-api', runtime: 'Node.js 22', status: 'active', executionsToday: 128 },
    { id: 'fn-daily-report', name: 'daily-report', runtime: 'Node.js 22', status: 'paused', executionsToday: 0 },
  ],
};

export const demoHomeQuota: MyQuota = {
  vm: { vcpu: { used: 4, limit: 4 }, ram_gb: { used: 8, limit: 8 }, ssd_gb: { used: 40, limit: 50 }, max_creatable: { vcpu: 2, ram_gb: 4, ssd_gb: 20 } },
  db: { count: { used: 1, limit: 2 }, shared_storage_gb: { used: 0.3, limit: 1 } },
  fn: { count: { used: 2, limit: 5 }, daily_executions: { used: 128, limit: 1000 } },
  app: { count: { used: 1, limit: 3 }, memory_mb: { used: 1024, limit: 4096 }, always_on: { used: 0, limit: 1 } },
};

export const demoHomeTeams: TeamSummary[] = [{ id: 'demo-team', name: 'GSM Connect', status: 'approved', my_role: 'leader', member_count: 4 }];

export const demoHomeApps: AppSummary[] = [{
  grn: 'grn:gsmsv:app:demo-student:portfolio', id: 'app-portfolio', name: 'portfolio', owner: { type: 'user', id: 'demo-student', name: '김민수' }, status: 'active',
  created_by: 'demo-student', created_at: '2026-10-01T00:00:00.000Z', updated_at: '2026-11-13T04:00:00.000Z', expires_at: '2026-12-31T14:59:59.000Z',
  permissions: { view: true, update: true, extend: true, delete: true },
}];

export function getDemoHomeState(): DemoHomeState | null {
  return isDemoMode() ? readDemoState('home', seedHome) : null;
}

export function saveDemoHomeState(value: DemoHomeState): boolean {
  return isDemoMode() && writeDemoState('home', value);
}

export function setDemoFirstVisit(firstVisit: boolean): boolean {
  const current = getDemoHomeState();
  return current ? saveDemoHomeState({ ...current, firstVisit }) : false;
}
