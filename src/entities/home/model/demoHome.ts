import type { AppSummary } from '../../app/model/types';
import type { MyQuota } from '../../quota/model/types';
import type { TeamSummary } from '../../team/model/types';
import { isDemoFixtureMode, isDemoMode, readDemoState, writeDemoState } from '../../../shared/demo';
import { getDemoVmState } from '../../vm/model/demoVmStore';
import { getDemoServerlessFunctions } from '../../serverless/model/demoServerless';
import { getDemoDatabaseState } from '../../database/model/demoDatabase';
import { getDemoApps } from '../../app/model/demoAppState';

export interface DemoFunctionSummary {
  id: string;
  name: string;
  runtime: string;
  status: 'active' | 'paused';
  executionsToday: number;
  description?: string;
  /** 표시용 만료일(예: 2026. 10. 06.). */
  expiresAt?: string;
}

/** 홈 「VM을 만들지 못했어요」 배너에 다시 보여 줄 생성 요청 설정. */
export interface DemoVmCreateFailure {
  name: string;
  purpose: string;
  cpu: number;
  memory: number;
  disk: number;
  os: 'Linux Ubuntu 22.04 LTS' | 'Ubuntu Server';
}

export interface DemoHomeState {
  firstVisit: boolean;
  functions: DemoFunctionSummary[];
  vmCreateFailure?: DemoVmCreateFailure | null;
  /** 졸업 안내를 닫은 졸업일(YYYY.MM.DD). 관리자가 날짜를 바꾸면 다시 안내한다. */
  graduationNoticeDismissedFor?: string;
}

export const demoVmCreateFailureSeed: DemoVmCreateFailure = {
  name: 'library-api',
  purpose: '도서관 대출 현황 API 서버 운영',
  cpu: 2,
  memory: 4,
  disk: 20,
  os: 'Linux Ubuntu 22.04 LTS',
};

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
  grn: 'grn:gsmsv:app:demo-student:portfolio', id: 'app-portfolio', name: 'portfolio', owner: { type: 'user', id: 'demo-student', name: '김지민' }, status: 'active',
  created_by: 'demo-student', created_at: '2026-10-01T00:00:00.000Z', updated_at: '2026-11-13T04:00:00.000Z', expires_at: '2026-12-31T14:59:59.000Z',
  permissions: { view: true, update: true, extend: true, delete: true },
}];

export function getDemoHomeState(): DemoHomeState | null {
  return isDemoMode() ? readDemoState('home', isDemoFixtureMode() ? seedHome : { firstVisit: true, functions: [] }) : null;
}

export function isDemoWorkspaceFirstVisit(): boolean {
  return getDemoVmState().vms.every(vm => vm.owner !== 'personal')
    && getDemoServerlessFunctions().length === 0
    && getDemoDatabaseState().databases.every(database => database.owner.type !== 'user')
    && getDemoApps().every(app => app.owner?.type !== 'user');
}

export function saveDemoHomeState(value: DemoHomeState): boolean {
  return isDemoMode() && writeDemoState('home', value);
}

export function setDemoFirstVisit(firstVisit: boolean): boolean {
  const current = getDemoHomeState();
  return current ? saveDemoHomeState({ ...current, firstVisit }) : false;
}

function updateDemoHomeState(changes: Partial<DemoHomeState>): boolean {
  const current = getDemoHomeState();
  return current ? saveDemoHomeState({ ...current, ...changes }) : false;
}

/** VM 생성 요청이 자원 부족으로 실패했음을 기록한다. 홈에 실패 배너가 나타난다. */
export function recordDemoVmCreateFailure(failure: DemoVmCreateFailure): boolean {
  return updateDemoHomeState({ vmCreateFailure: failure });
}

export function clearDemoVmCreateFailure(): boolean {
  return updateDemoHomeState({ vmCreateFailure: null });
}

export function dismissDemoGraduationNotice(graduationDate: string): boolean {
  return updateDemoHomeState({ graduationNoticeDismissedFor: graduationDate });
}
