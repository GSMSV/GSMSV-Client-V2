import { getDemoProfile } from '../../profile';
import { isDemoMode, readDemoState, writeDemoState } from '../../../shared/demo';

export type WorkflowStatus = '대기 중' | '검토 중' | '답변 완료' | '승인 완료' | '거절';

export interface Inquiry {
  id: string;
  title: string;
  author: string;
  studentId: string;
  createdAt: string;
  vmName: string;
  content: string;
  reply: string;
  status: WorkflowStatus;
  isMine: boolean;
}

export interface DedicatedDatabaseRequest {
  id: string;
  team: string;
  applicant: string;
  members: number;
  engine: 'MySQL' | 'PostgreSQL';
  reason: string;
  description: string;
  requestedAt: string;
  status: WorkflowStatus;
  rejectReason: string;
}

export interface TeamRequest {
  id: string;
  name: string;
  leader: string;
  members: number;
  purpose: string;
  requestedAt: string;
  status: WorkflowStatus;
  tier: string;
  vcpu: number;
  ram: number;
  ssd: number;
  rejectReason: string;
}

export interface DemoAccount {
  id: string;
  name: string;
  studentId: string;
  email: string;
  role: string;
  team: string;
  github: string;
  discord: string;
}

export interface DemoAdminVm {
  id: string;
  name: string;
  owner: string;
  status: '실행 중' | '중지';
  vcpu: number;
  ram: number;
  disk: number;
  purpose: string;
  createdAt: string;
  expiresAt: string;
  sshCommand: string;
}

export interface CliLoginRequest {
  code: string;
  device: string;
  requestedAt: string;
  expiresAt: string;
  status: '확인 대기' | '승인 완료' | '거부됨' | '만료됨';
}
export interface QueryAudit {
  actorId: string;
  executedAt: string;
  succeeded: boolean;
}

const demoInquiries: Inquiry[] = [
  { id: 'inquiry-3', title: 'Domain 등록 후 HTTPS 접속이 안 됩니다', author: '김민준', studentId: '2201', createdAt: '2026.09.29 09:12', vmName: 'portfolio-api', content: '도메인을 연결한 뒤 HTTPS 인증서가 발급되지 않습니다.', reply: '', status: '대기 중', isMine: false },
  { id: 'inquiry-4', title: '자동 Snapshot이 아직 보이지 않습니다', author: '박지우', studentId: '2118', createdAt: '2026.09.29 08:41', vmName: 'web-server', content: 'VM을 만든 지 하루가 지났는데 자동 Snapshot 목록에 항목이 없습니다.', reply: '', status: '대기 중', isMine: false },
  { id: 'inquiry-2', title: '팀 승인이 언제 되는지 알고 싶습니다', author: '김지민', studentId: '2107', createdAt: '2026.09.28 16:10', vmName: 'portfolio-api', content: '프로젝트 팀을 만들었는데 승인이 언제 완료되는지 알고 싶습니다.', reply: '', status: '대기 중', isMine: true },
  { id: 'inquiry-1', title: 'SSH 접속 시 연결 시간이 초과됩니다', author: '김지민', studentId: '2107', createdAt: '2026.09.28 15:32', vmName: 'portfolio-api', content: 'VM은 실행 중인데 SSH 접속이 안 됩니다. 포트를 정리한 뒤부터 연결 시간이 초과됩니다.', reply: 'Network 탭에서 SSH 22번 포트가 등록되어 있는지 확인해 주세요. 삭제했다면 기본 포트 복구를 실행한 뒤 다시 접속해 주세요.', status: '답변 완료', isMine: false },
  { id: 'inquiry-5', title: 'VM은 언제부터 연장할 수 있습니까?', author: '김지민', studentId: '2107', createdAt: '2026.09.27 10:24', vmName: 'portfolio-api', content: 'VM을 계속 사용하려고 합니다. 연장 버튼은 언제 활성화되나요?', reply: '만료일까지 7일 이하로 남으면 연장할 수 있습니다. 기존 만료일에 14일이 추가됩니다.', status: '답변 완료', isMine: true },
  { id: 'inquiry-6', title: 'Database 백업 파일을 내려받고 싶습니다', author: '이서준', studentId: '2214', createdAt: '2026.09.27 09:48', vmName: 'web-server', content: '최근 백업 파일을 어떻게 복구하는지 알고 싶습니다.', reply: '백업 탭에서 원하는 시점을 선택한 뒤 복원할 수 있습니다.', status: '답변 완료', isMine: false },
  { id: 'inquiry-7', title: '배포 상태가 계속 준비 중입니다', author: '윤채원', studentId: '2115', createdAt: '2026.09.26 17:30', vmName: 'portfolio-api', content: '코드를 push했는데 Apps 배포가 완료되지 않습니다.', reply: '최근 로그에서 빌드 오류를 확인해 주세요. 환경 변수가 누락되지 않았는지도 확인 바랍니다.', status: '답변 완료', isMine: false },
  { id: 'inquiry-8', title: '내부 포트 설정을 다시 확인하고 싶습니다', author: '한도윤', studentId: '2112', createdAt: '2026.09.26 13:14', vmName: 'portfolio-api', content: '외부 포트와 내부 포트가 연결되는 방식이 궁금합니다.', reply: 'Network 탭에서 규칙을 확인할 수 있습니다. SSH 접속은 내부 포트 22번을 사용합니다.', status: '답변 완료', isMine: false },
  { id: 'inquiry-9', title: '팀 Database 용량이 궁금합니다', author: '박지우', studentId: '2118', createdAt: '2026.09.25 15:20', vmName: 'web-server', content: '팀이 사용할 수 있는 Database 용량을 확인하고 싶습니다.', reply: 'Database 목록의 사용량 카드에서 팀 전체 용량을 확인할 수 있습니다.', status: '답변 완료', isMine: false },
  { id: 'inquiry-10', title: '계정 연결을 다시 설정하고 싶습니다', author: '김민준', studentId: '2201', createdAt: '2026.09.25 11:03', vmName: 'portfolio-api', content: 'GitHub 계정 연결을 해제한 다음 다시 연결하고 싶습니다.', reply: '계정 설정에서 연결 상태를 확인하고 다시 연결해 주세요.', status: '답변 완료', isMine: false },
  { id: 'inquiry-11', title: 'VM 시작 명령어를 찾을 수 없습니다', author: '정서연', studentId: '3104', createdAt: '2026.09.24 14:41', vmName: 'web-server', content: 'VM을 만들고 SSH에 접속할 때 필요한 명령어가 어디에 있나요?', reply: 'VM 상세 화면의 SSH 접속 정보에서 명령어를 복사할 수 있습니다.', status: '답변 완료', isMine: false },
];

const demoDbRequests: DedicatedDatabaseRequest[] = [{
  id: 'db-request-1', team: 'GSM Connect', applicant: '한도윤 · DevOps', members: 2,
  engine: 'MySQL', reason: '다른 학생의 부하와 성능을 떼어 놓아야 합니다',
  description: '실시간 매칭 기능 때문에 쿼리가 많습니다. 공유 서버의 다른 학생 Database에 영향을 주지 않도록 따로 쓰고 싶습니다.',
  requestedAt: '2026.09.29', status: '검토 중', rejectReason: '',
}];

const demoTeamRequests: TeamRequest[] = [
  { id: 'team-request-1', name: 'GSM Connect', leader: '김지민 · 2107', members: 2, purpose: '동아리·프로젝트 연결 서비스의 API와 DB 운영', requestedAt: '2026.09.29', status: '검토 중', tier: '소형', vcpu: 4, ram: 8, ssd: 60, rejectReason: '' },
  { id: 'team-request-2', name: '급식한입', leader: '이서준 · 2214', members: 3, purpose: '급식 알림 서비스의 웹 서버 운영', requestedAt: '2026.09.27', status: '대기 중', tier: '소형', vcpu: 4, ram: 8, ssd: 60, rejectReason: '' },
  { id: 'team-request-3', name: 'GSM 동아리', leader: '박지우 · 2118', members: 2, purpose: '동아리 모집 사이트와 파일 서버 운영', requestedAt: '2026.09.26', status: '대기 중', tier: '소형', vcpu: 4, ram: 8, ssd: 60, rejectReason: '' },
];

const demoAccounts: DemoAccount[] = [
  { id: 'account-1', name: '김지민', studentId: '2107', email: 'jimin@example.com', role: '일반 사용자', team: 'GSM Connect · 팀장', github: '@gsm-jimin', discord: '연결 안 됨' },
  { id: 'account-2', name: '한도윤', studentId: '2112', email: 'doyun@example.com', role: '일반 사용자', team: 'GSM Connect · DevOps', github: '@doyun-han', discord: '@doyun' },
  { id: 'account-3', name: '윤채원', studentId: '2115', email: 'chaewon@example.com', role: '일반 사용자', team: 'GSM Connect · 일반 팀원', github: '연결 안 됨', discord: '@chaewon' },
  { id: 'account-4', name: '정서연', studentId: '3104', email: 'seoyeon@example.com', role: '관리자', team: '—', github: '연결 안 됨', discord: '@seoyeon' },
];

const demoAdminVms: DemoAdminVm[] = [{
  id: 'demo-vm-1', name: 'portfolio-api', owner: '김지민', status: '실행 중', vcpu: 2, ram: 4, disk: 20,
  purpose: '포트폴리오 프로젝트의 API 서버 운영', createdAt: '2026.09.26 14:00', expiresAt: '2026.10.03 14:00', sshCommand: 'ssh ubuntu@ssh.gsmsv.site -p 32104',
}];

const demoCliRequest: CliLoginRequest = { code: 'WDJB-MJHT', device: 'MacBook-Air · macOS', requestedAt: '2026.09.30 14:30', expiresAt: '9분 남음', status: '확인 대기' };

function localState<T>(key: string, seed: T): T {
  return isDemoMode() ? readDemoState(key, seed) : seed;
}

function saveState<T>(key: string, value: T): boolean {
  return isDemoMode() && writeDemoState(key, value);
}

export function getDemoInquiries(): Inquiry[] { return localState('support.inquiries', demoInquiries); }
export function saveDemoInquiries(items: Inquiry[]): boolean { return saveState('support.inquiries', items); }
export function getDemoDbRequests(): DedicatedDatabaseRequest[] { return localState('admin.databaseRequests', demoDbRequests); }
export function saveDemoDbRequests(items: DedicatedDatabaseRequest[]): boolean { return saveState('admin.databaseRequests', items); }
export function getDemoTeamRequests(): TeamRequest[] { return localState('admin.teamRequests', demoTeamRequests); }
export function saveDemoTeamRequests(items: TeamRequest[]): boolean { return saveState('admin.teamRequests', items); }
export function getDemoAccounts(): DemoAccount[] {
  const accounts = getDemoAccountRecords();
  const profile = getDemoProfile();
  if (!profile) return accounts;

  return accounts.flatMap(account => {
    if (account.email !== profile.email) return [account];
    if (profile.accountDeleted) return [];
    return [{
      ...account,
      github: profile.github ?? '연결 안 됨',
      discord: profile.discordConnected ? '@jimin_2107' : '연결 안 됨',
    }];
  });
}
export function getDemoAccountRecords(): DemoAccount[] { return localState('admin.accounts', demoAccounts); }
export function saveDemoAccounts(items: DemoAccount[]): boolean { return saveState('admin.accounts', items); }
export function getDemoAdminVms(): DemoAdminVm[] { return localState('admin.vms', demoAdminVms); }
export function saveDemoAdminVms(items: DemoAdminVm[]): boolean { return saveState('admin.vms', items); }
export function getDemoCliRequest(): CliLoginRequest { return localState('auth.cliRequest', demoCliRequest); }
export function saveDemoCliRequest(item: CliLoginRequest): boolean { return saveState('auth.cliRequest', item); }
export function getDemoQueryAudit(): QueryAudit[] { return localState('database.queryAudit', []); }
export function saveDemoQueryAudit(items: QueryAudit[]): boolean { return saveState('database.queryAudit', items); }
