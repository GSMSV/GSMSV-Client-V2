import { readDemoState, writeDemoState } from '../../../shared/demo';
import type { DatabaseQuota } from '../../quota/model/types';
import type { DatabaseBackup, DatabaseCredentials, DatabaseDetail, DatabaseEngine, DatabaseSummary } from './types';

export interface DemoDatabaseState {
  databases: DatabaseDetail[];
  backups: Record<string, DatabaseBackup[]>;
  passwords: Record<string, string>;
  deletedBackups?: Record<string, { databaseId: string; databaseName: string; owner: DatabaseDetail['owner']; deletedAt: string; expiresAt: string; backups: DatabaseBackup[] }>;
  lockedFixtureInitialized?: boolean;
  suspendedFixtureInitialized?: boolean;
  welcomeFixtureInitialized?: boolean;
  welcomeBackupsFixtureInitialized?: boolean;
  /** 개인 상태 fixture를 팀 fixture로 옮긴 뒤 true. */
  teamStateFixturesInitialized?: boolean;
  /** 비밀번호를 마지막으로 교체할 때 팀에 있던 사람들. 이후 나간 사람이 있으면 교체를 권한다. */
  knownMembers?: Record<string, string[]>;
  /** 쓰기 금지가 풀린 시각. 다시 용량이 늘거나 잠기면 지운다. */
  unlockedAt?: Record<string, string>;
}

const legacyWelcomeGrn = 'grn:gsmsv:database:demo-student:student-db';
const welcomeGrn = 'grn:gsmsv:database:demo-student:welcome-db';
const legacyLockedGrn = 'grn:gsmsv:database:demo-student:quota-locked-db';
const legacySuspendedGrn = 'grn:gsmsv:database:demo-student:suspended-welcome-db';
const teamGrn = 'grn:gsmsv:database:demo-team:connect-db';
const teamSuspendedGrn = 'grn:gsmsv:database:demo-team:connect-legacy-db';
const teamMemberViewGrn = 'grn:gsmsv:database:demo-team:connect-stats-db';
const teamFixtureGrns = [teamSuspendedGrn, teamMemberViewGrn];
const demoTeamMemberNames = ['김지민', '한도윤', '윤채원'];
/** 쿼리 콘솔에서 INSERT·UPDATE 한 번이 늘리는(DELETE·TRUNCATE·DROP 한 번이 줄이는) 용량. */
export const DEMO_DATABASE_WRITE_STEP_GB = 0.26;
const fullPermissions = { view: true, view_credentials: true, update: true, rotate_password: true, delete: true, extend: true, read_backup: true, restore_backup: true };
const memberPermissions = { view: true, view_credentials: true, update: false, rotate_password: false, delete: false, extend: true, read_backup: true, restore_backup: false };
const demoDatabaseSeed: DemoDatabaseState = {
  welcomeFixtureInitialized: true,
  welcomeBackupsFixtureInitialized: true,
  teamStateFixturesInitialized: true,
  knownMembers: { [teamGrn]: demoTeamMemberNames },
  unlockedAt: {},
  databases: [
    {
      grn: welcomeGrn, id: 'welcome-db', name: 'welcome-db',
      owner: { type: 'user', id: 'demo-student', name: '김민수' },
      engine: 'mysql', isolation: 'shared', status: 'active', write_locked: false,
      connection: { host: 'db-demo.gs-msv.local', port: 3306, database: 'welcome_db', username: 'welcome_user', tls: true },
      storage: { used_gb: 0.3, owner_total_used_gb: 0.3, owner_limit_gb: 1 }, max_connections: 10,
      created_by: { name: '김민수' }, created_at: '2026-09-29T00:00:00.000Z', updated_at: '2026-10-01T04:00:00.000Z', expires_at: '2026-10-06T14:59:59.000Z',
      permissions: { view: true, view_credentials: true, update: true, rotate_password: true, delete: true, extend: true, read_backup: true, restore_backup: true },
    },
    {
      grn: teamGrn, id: 'connect-db', name: 'connect-db',
      owner: { type: 'team', id: 'demo-team', name: 'GSM Connect' },
      engine: 'mysql', isolation: 'shared', status: 'active', write_locked: false,
      connection: { host: 'team-db-demo.gs-msv.local', port: 3306, database: 'connect_db', username: 'connect_admin', tls: true },
      storage: { used_gb: 7.4, owner_total_used_gb: 10.7, owner_limit_gb: 60 }, max_connections: 100,
      created_by: { name: '김민수' }, created_at: '2026-10-03T00:00:00.000Z', updated_at: '2026-11-12T04:00:00.000Z', expires_at: '2026-12-31T14:59:59.000Z',
      permissions: { ...fullPermissions },
    },
    {
      grn: teamSuspendedGrn, id: 'connect-legacy-db', name: 'connect-legacy-db',
      owner: { type: 'team', id: 'demo-team', name: 'GSM Connect' },
      engine: 'mysql', isolation: 'shared', status: 'suspended', write_locked: false,
      connection: { host: 'team-db-demo.gs-msv.local', port: 3306, database: 'connect_legacy_db', username: 'connect_legacy', tls: true },
      storage: { used_gb: 1.2, owner_total_used_gb: 10.7, owner_limit_gb: 60 }, max_connections: 100,
      created_by: { name: '김지민' }, created_at: '2026-09-06T05:00:00.000Z', updated_at: '2026-10-06T05:00:00.000Z', expires_at: '2026-10-06T05:00:00.000Z',
      permissions: { ...fullPermissions },
    },
    {
      grn: teamMemberViewGrn, id: 'connect-stats-db', name: 'connect-stats-db',
      owner: { type: 'team', id: 'demo-team', name: 'GSM Connect' },
      engine: 'mysql', isolation: 'shared', status: 'active', write_locked: false,
      connection: { host: 'team-db-demo.gs-msv.local', port: 3306, database: 'connect_stats_db', username: 'connect_stats', tls: true },
      storage: { used_gb: 2.1, owner_total_used_gb: 10.7, owner_limit_gb: 60 }, max_connections: 100,
      created_by: { name: '한도윤' }, created_at: '2026-10-04T00:00:00.000Z', updated_at: '2026-11-12T04:00:00.000Z', expires_at: '2026-12-31T14:59:59.000Z',
      permissions: { ...memberPermissions },
    },
  ],
  deletedBackups: {},
  backups: {
    [welcomeGrn]: [
      { id: 'welcome-db-daily-20260929', kind: 'daily', created_at: '2026-09-28T19:00:00.000Z', size_mb: 307, expires_at: '2026-10-05T19:00:00.000Z' },
      { id: 'welcome-db-daily-20260928', kind: 'daily', created_at: '2026-09-27T19:00:00.000Z', size_mb: 307, expires_at: '2026-10-04T19:00:00.000Z' },
      { id: 'welcome-db-pre-restore-20260927-1512', kind: 'pre_restore', created_at: '2026-09-27T06:12:00.000Z', size_mb: 205, expires_at: '2026-10-04T06:12:00.000Z' },
      { id: 'welcome-db-daily-20260927', kind: 'daily', created_at: '2026-09-26T19:00:00.000Z', size_mb: 205, expires_at: '2026-10-03T19:00:00.000Z' },
      { id: 'welcome-db-daily-20260926', kind: 'daily', created_at: '2026-09-25T19:00:00.000Z', size_mb: 205, expires_at: '2026-10-02T19:00:00.000Z' },
      { id: 'welcome-db-daily-20260925', kind: 'daily', created_at: '2026-09-24T19:00:00.000Z', size_mb: 205, expires_at: '2026-10-01T19:00:00.000Z' },
      { id: 'welcome-db-daily-20260924', kind: 'daily', created_at: '2026-09-23T19:00:00.000Z', size_mb: 205, expires_at: '2026-09-30T19:00:00.000Z' },
    ],
    [teamGrn]: [
      { id: 'connect-db-daily-20261114', kind: 'daily', created_at: '2026-11-14T00:00:00.000Z', size_mb: 936, expires_at: '2026-11-21T00:00:00.000Z' },
    ],
    [teamSuspendedGrn]: [
      { id: 'connect-legacy-db-daily-20261006', kind: 'daily', created_at: '2026-10-05T19:00:00.000Z', size_mb: 1229, expires_at: '2026-10-12T19:00:00.000Z' },
    ],
    [teamMemberViewGrn]: [
      { id: 'connect-stats-db-daily-20261114', kind: 'daily', created_at: '2026-11-14T00:00:00.000Z', size_mb: 2150, expires_at: '2026-11-21T00:00:00.000Z' },
    ],
  },
  passwords: { [welcomeGrn]: 'demo-local-pass-welcome', [teamGrn]: 'demo-local-pass-team', [teamSuspendedGrn]: 'demo-local-pass-legacy', [teamMemberViewGrn]: 'demo-local-pass-stats' },
};

const clone = <T,>(value: T): T => structuredClone(value);

function settleDemoDatabaseTransitions(state: DemoDatabaseState, now: number): boolean {
  let changed = false;
  for (const database of state.databases) {
    const elapsed = now - new Date(database.updated_at).getTime();
    if (database.status === 'creating' && elapsed >= 2_000) {
      database.status = 'active';
      database.updated_at = new Date(now).toISOString();
      changed = true;
    } else if (database.status === 'deleting' && elapsed >= 4_000) {
      const backups = state.backups[database.grn] ?? [];
      if (backups.length > 0) {
        const deletionDeadline = new Date(database.updated_at).getTime() + 4_000;
        state.deletedBackups ??= {};
        state.deletedBackups[database.grn] = {
          databaseId: database.id,
          databaseName: database.name,
          owner: clone(database.owner),
          deletedAt: new Date(deletionDeadline).toISOString(),
          expiresAt: new Date(deletionDeadline + 7 * 86_400_000).toISOString(),
          backups: clone(backups),
        };
      }
      state.databases = state.databases.filter(item => item.grn !== database.grn);
      delete state.backups[database.grn];
      delete state.passwords[database.grn];
      changed = true;
    }
  }
  for (const [grn, archive] of Object.entries(state.deletedBackups ?? {})) {
    if (new Date(archive.expiresAt).getTime() <= now) {
      delete state.deletedBackups?.[grn];
      changed = true;
    }
  }
  return changed;
}

const roundGb = (value: number) => Math.round(value * 100) / 100;

function ownerKey(owner: DatabaseDetail['owner']) {
  return `${owner.type}:${owner.id}`;
}

/** 소유자 전체 사용량(owner_total_used_gb)을 같은 소유자 Database 크기의 합으로 맞춘다. */
function syncDemoOwnerTotals(state: DemoDatabaseState): boolean {
  const totals = new Map<string, number>();
  for (const database of state.databases) {
    const key = ownerKey(database.owner);
    totals.set(key, roundGb((totals.get(key) ?? 0) + database.storage.used_gb));
  }
  let changed = false;
  for (const database of state.databases) {
    const total = totals.get(ownerKey(database.owner)) ?? 0;
    if (database.storage.owner_total_used_gb !== total) {
      database.storage.owner_total_used_gb = total;
      changed = true;
    }
  }
  return changed;
}

export function getDemoDatabaseState(): DemoDatabaseState {
  const value = readDemoState<unknown>('database.resources', clone(demoDatabaseSeed));
  if (!value || typeof value !== 'object') return clone(demoDatabaseSeed);
  const state = value as Partial<DemoDatabaseState>;
  if (!Array.isArray(state.databases) || !state.backups || typeof state.backups !== 'object' || !state.passwords || typeof state.passwords !== 'object') {
    return clone(demoDatabaseSeed);
  }
  const validState = state as DemoDatabaseState;
  let changed = false;
  if (!validState.welcomeFixtureInitialized) {
    const welcomeSeed = demoDatabaseSeed.databases.find(database => database.grn === welcomeGrn);
    const legacyIndex = validState.databases.findIndex(database => database.grn === legacyWelcomeGrn || database.id === 'student-db');
    const canonicalIndex = validState.databases.findIndex(database => database.grn === welcomeGrn || database.id === 'welcome-db');
    const sourceIndex = legacyIndex >= 0 ? legacyIndex : canonicalIndex;
    const source = sourceIndex >= 0 ? validState.databases[sourceIndex] : null;
    if (welcomeSeed && source) {
      const isLegacyWelcome = source.grn === legacyWelcomeGrn || source.id === 'student-db';
      const canonical = {
        ...source,
        grn: welcomeGrn,
        id: 'welcome-db',
        name: isLegacyWelcome && source.name === 'student-db' ? 'welcome-db' : source.name,
        engine: welcomeSeed.engine,
        isolation: welcomeSeed.isolation,
        connection: clone(welcomeSeed.connection),
        storage: {
          ...source.storage,
          used_gb: isLegacyWelcome && source.storage.used_gb === 3.2 ? welcomeSeed.storage.used_gb : source.storage.used_gb,
          owner_total_used_gb: isLegacyWelcome && source.storage.owner_total_used_gb === 3.2 ? welcomeSeed.storage.owner_total_used_gb : source.storage.owner_total_used_gb,
          owner_limit_gb: isLegacyWelcome && source.storage.owner_limit_gb === 10 ? welcomeSeed.storage.owner_limit_gb : source.storage.owner_limit_gb,
        },
        created_at: isLegacyWelcome && source.created_at === '2026-10-01T00:00:00.000Z' ? welcomeSeed.created_at : source.created_at,
        updated_at: isLegacyWelcome && source.updated_at === '2026-11-13T04:00:00.000Z' ? welcomeSeed.updated_at : source.updated_at,
        expires_at: isLegacyWelcome && source.expires_at === '2026-12-31T14:59:59.000Z' ? welcomeSeed.expires_at : source.expires_at,
        max_connections: welcomeSeed.max_connections,
      };
      validState.databases[sourceIndex] = canonical;
      const duplicateIndex = validState.databases.findIndex((database, index) => index !== sourceIndex && (database.grn === welcomeGrn || database.id === 'welcome-db'));
      if (duplicateIndex >= 0) validState.databases.splice(duplicateIndex, 1);
      const staleSeedBackupIds = new Set(['student-db-daily-20261114', 'student-db-daily-20261113', 'welcome-db-daily-20261006', 'welcome-db-daily-20261005']);
      const sourceBackups = (validState.backups[source.grn] ?? []).filter(backup => !staleSeedBackupIds.has(backup.id));
      const canonicalBackups = (validState.backups[welcomeGrn] ?? []).filter(backup => !staleSeedBackupIds.has(backup.id));
      const userBackups = [...sourceBackups, ...canonicalBackups];
      validState.backups[welcomeGrn] = [
        ...clone(demoDatabaseSeed.backups[welcomeGrn]),
        ...new Map(userBackups.map(backup => [backup.id, backup])).values(),
      ];
      const sourcePassword = validState.passwords[source.grn];
      validState.passwords[welcomeGrn] = isLegacyWelcome && sourcePassword === 'demo-local-pass-student'
        ? 'demo-local-pass-welcome'
        : sourcePassword ?? validState.passwords[welcomeGrn] ?? 'demo-local-pass-welcome';
      if (source.grn !== welcomeGrn) {
        delete validState.backups[source.grn];
        delete validState.passwords[source.grn];
      }
    } else if (welcomeSeed) {
      validState.databases.push(clone(welcomeSeed));
      validState.backups[welcomeGrn] ??= clone(demoDatabaseSeed.backups[welcomeGrn]);
      validState.passwords[welcomeGrn] ??= 'demo-local-pass-welcome';
    }
    validState.welcomeFixtureInitialized = true;
    changed = true;
  }
  for (const database of validState.databases) {
    if (database.grn === teamGrn && database.isolation === 'dedicated') {
      database.isolation = 'shared';
      changed = true;
    }
    if (database.permissions && typeof database.permissions === 'object' && typeof database.permissions.view_credentials !== 'boolean') {
      database.permissions.view_credentials = true;
      changed = true;
    }
    if (database.grn === welcomeGrn && database.max_connections === 30) {
      database.max_connections = 10;
      changed = true;
    }
  }
  if (!validState.welcomeBackupsFixtureInitialized) {
    const seedBackups = demoDatabaseSeed.backups[welcomeGrn] ?? [];
    const seedIds = new Set(seedBackups.map(backup => backup.id));
    const staleSeedIds = new Set(['student-db-daily-20261114', 'student-db-daily-20261113', 'welcome-db-daily-20261006', 'welcome-db-daily-20261005']);
    const retainedBackups = (validState.backups[welcomeGrn] ?? []).filter(backup => !staleSeedIds.has(backup.id) && !seedIds.has(backup.id));
    validState.backups[welcomeGrn] = [...clone(seedBackups), ...retainedBackups];
    validState.welcomeBackupsFixtureInitialized = true;
    changed = true;
  }
  if (!validState.teamStateFixturesInitialized) {
    // 예전 개인 fixture(쓰기 금지·정지)는 목록에 나오지 않아 닿을 수 없었다.
    // 개인 용량 상태는 쿼리 콘솔의 쓰기로 만들고, 정지·일반 팀원 상태는 팀 fixture로 옮긴다.
    const legacyGrns = [legacyLockedGrn, legacySuspendedGrn];
    validState.databases = validState.databases.filter(database => !legacyGrns.includes(database.grn));
    for (const grn of legacyGrns) {
      delete validState.backups[grn];
      delete validState.passwords[grn];
    }
    for (const grn of teamFixtureGrns) {
      const fixture = demoDatabaseSeed.databases.find(database => database.grn === grn);
      if (fixture && !validState.databases.some(database => database.grn === grn)) validState.databases.push(clone(fixture));
      validState.backups[grn] ??= clone(demoDatabaseSeed.backups[grn] ?? []);
      validState.passwords[grn] ??= demoDatabaseSeed.passwords[grn];
    }
    validState.knownMembers = { [teamGrn]: [...demoTeamMemberNames], ...validState.knownMembers };
    validState.unlockedAt ??= {};
    validState.teamStateFixturesInitialized = true;
    changed = true;
  }
  if (settleDemoDatabaseTransitions(validState, Date.now())) changed = true;
  if (syncDemoOwnerTotals(validState)) changed = true;
  if (changed) saveDemoDatabaseState(validState);
  return validState;
}

export function saveDemoDatabaseState(state: DemoDatabaseState): boolean {
  const saved = writeDemoState('database.resources', state);
  if (saved && typeof window !== 'undefined') {
    window.dispatchEvent(new Event('gsmsv:demo-database-state-change'));
  }
  return saved;
}

export function listDemoDatabases(owner = 'me'): DatabaseSummary[] {
  return getDemoDatabaseState().databases
    .filter(database => owner === 'me' ? database.owner.type === 'user' : database.owner.id === owner)
    .map(({ grn, name, engine, isolation, status, write_locked, storage, expires_at }) => ({ grn, name, engine, isolation, status, write_locked, storage: { used_gb: storage.used_gb }, expires_at }));
}

export function getDemoDatabase(grn: string): DatabaseDetail | null {
  return getDemoDatabaseState().databases.find(database => database.grn === grn || database.id === grn) ?? null;
}

const demoCurrentConnections: Record<string, number> = { [welcomeGrn]: 3, [teamGrn]: 12, [teamMemberViewGrn]: 4 };

export function getDemoDatabaseCurrentConnections(grn: string): number {
  const database = getDemoDatabase(grn);
  return database ? demoCurrentConnections[database.grn] ?? 0 : 0;
}

/** 정지된 Database는 정지 3일 뒤 삭제된다(정책). 목데이터 시점은 정지 당일로 고정한다. */
export function getDemoDatabaseSuspensionInfo(grn: string): { deleteInDays: number; deleteAt: string } | null {
  const database = getDemoDatabase(grn);
  if (!database || database.status !== 'suspended') return null;
  const suspendedAt = new Date(database.expires_at).getTime();
  if (Number.isNaN(suspendedAt)) return null;
  return { deleteInDays: 3, deleteAt: new Date(suspendedAt + 3 * 86_400_000).toISOString() };
}

export function getDemoDatabaseConnectedFunctions(grn: string): string[] {
  const database = getDemoDatabase(grn);
  return database?.grn === welcomeGrn ? ['welcome-api'] : [];
}

/** 쓰기 금지가 풀린 시각. 풀린 적이 없거나 다시 잠기면 null. */
export function getDemoDatabaseUnlockedAt(grn: string): string | null {
  const database = getDemoDatabase(grn);
  return database ? getDemoDatabaseState().unlockedAt?.[database.grn] ?? null : null;
}

/**
 * 쿼리 콘솔의 쓰기 쿼리를 용량에 반영한다. INSERT·UPDATE는 늘리고 DELETE·TRUNCATE·DROP은 줄인다.
 * 소유자 전체 사용량이 한도를 넘으면 그 소유자의 Database 전부가 쓰기 금지되고,
 * 다시 한도 아래로 내려가면 풀리면서 '다시 쓸 수 있습니다' 상태가 된다.
 */
export function applyDemoDatabaseWrite(grn: string, direction: 'grow' | 'shrink'): DatabaseDetail | null {
  const state = getDemoDatabaseState();
  const database = state.databases.find(item => item.grn === grn || item.id === grn);
  if (!database || database.status !== 'active') return null;
  if (direction === 'grow' && database.write_locked) return null;
  const delta = direction === 'grow' ? DEMO_DATABASE_WRITE_STEP_GB : -DEMO_DATABASE_WRITE_STEP_GB;
  database.storage.used_gb = Math.max(0, roundGb(database.storage.used_gb + delta));
  database.updated_at = new Date().toISOString();
  syncDemoOwnerTotals(state);
  const siblings = state.databases.filter(item => ownerKey(item.owner) === ownerKey(database.owner));
  const wasLocked = siblings.some(item => item.write_locked);
  const nowLocked = database.storage.owner_total_used_gb > database.storage.owner_limit_gb;
  const unlockedAt = { ...state.unlockedAt };
  for (const item of siblings) {
    item.write_locked = nowLocked;
    if (nowLocked || direction === 'grow') delete unlockedAt[item.grn];
    else if (wasLocked) unlockedAt[item.grn] = new Date().toISOString();
  }
  state.unlockedAt = unlockedAt;
  if (!saveDemoDatabaseState(state)) return null;
  return clone(database);
}

/**
 * 팀 Database의 비밀번호를 알던 사람 중 팀을 나간 사람. 비밀번호를 교체하면 비운다.
 * 현재 팀원 이름은 화면에서 팀 저장소를 읽어 넘긴다.
 */
export function getDemoDatabaseDepartedMembers(grn: string, currentMemberNames: readonly string[]): string[] {
  const database = getDemoDatabase(grn);
  if (!database || database.owner.type !== 'team') return [];
  const known = getDemoDatabaseState().knownMembers?.[database.grn] ?? [];
  return known.filter(name => !currentMemberNames.includes(name));
}

export function acknowledgeDemoDatabaseMembers(grn: string, currentMemberNames: readonly string[]): boolean {
  const state = getDemoDatabaseState();
  const database = state.databases.find(item => item.grn === grn || item.id === grn);
  if (!database || database.owner.type !== 'team') return false;
  state.knownMembers = { ...state.knownMembers, [database.grn]: [...currentMemberNames] };
  return saveDemoDatabaseState(state);
}

export function getDemoDatabaseQuota(): DatabaseQuota {
  const personal = getDemoDatabaseState().databases.filter(database => database.owner.type === 'user');
  return {
    db: {
      count: { used: personal.length, limit: 2 },
      shared_storage_gb: { used: roundGb(personal.reduce((total, database) => total + database.storage.used_gb, 0)), limit: 1 },
    },
  };
}

export function createDemoDatabase(
  name: string,
  engine: DatabaseEngine,
  owner?: { id: string; name: string },
  isolation: DatabaseDetail['isolation'] = owner ? 'dedicated' : 'shared',
): DatabaseDetail {
  const state = getDemoDatabaseState();
  const ownerInfo = owner
    ? { type: 'team' as const, id: owner.id, name: owner.name }
    : { type: 'user' as const, id: 'demo-student', name: '김민수' };
  const id = `demo-${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  const dedicated = isolation === 'dedicated';
  const database: DatabaseDetail = {
    grn: `grn:gsmsv:database:${ownerInfo.id}:${id}`,
    id,
    name,
    owner: ownerInfo,
    engine,
    isolation,
    status: 'creating',
    write_locked: false,
    connection: { host: dedicated ? 'team-db-demo.gs-msv.local' : 'db-demo.gs-msv.local', port: engine === 'mysql' ? 3306 : 5432, database: id.replaceAll('-', '_'), username: `${ownerInfo.id}_user`, tls: true },
    storage: { used_gb: 0, owner_total_used_gb: 0, owner_limit_gb: owner ? 60 : 1 },
    max_connections: dedicated ? 100 : 10,
    created_by: { name: '김민수' },
    created_at: now,
    updated_at: now,
    expires_at: new Date(Date.now() + (dedicated ? 31 : 7) * 86_400_000).toISOString(),
    permissions: { ...fullPermissions },
  };
  if (state.databases.some(item => ownerKey(item.owner) === ownerKey(ownerInfo) && item.write_locked)) database.write_locked = true;
  state.databases.unshift(database);
  syncDemoOwnerTotals(state);
  state.backups[database.grn] = [];
  state.passwords[database.grn] = `demo-${crypto.randomUUID().slice(0, 18)}`;
  if (!saveDemoDatabaseState(state)) throw new Error('DEMO_DATABASE_SAVE_FAILED');
  setTimeout(() => { getDemoDatabaseState(); }, 2_000);
  return database;
}

export function getDemoDatabaseBackups(grn: string): DatabaseBackup[] {
  return clone(getDemoDatabaseState().backups[grn] ?? []);
}

export function getDemoDatabaseCredentials(grn: string): DatabaseCredentials | null {
  const state = getDemoDatabaseState();
  const database = state.databases.find(item => item.grn === grn || item.id === grn);
  if (!database) return null;
  const password = state.passwords[database.grn] ?? 'demo-local-pass';
  return {
    ...database.connection,
    password,
    jdbc_url: `jdbc:${database.engine}://${database.connection.host}:${database.connection.port}/${database.connection.database}?sslmode=require`,
  };
}

export function updateDemoDatabase(grn: string, patch: Partial<DatabaseDetail>): DatabaseDetail | null {
  const state = getDemoDatabaseState();
  const database = state.databases.find(item => item.grn === grn || item.id === grn);
  if (!database) return null;
  Object.assign(database, patch);
  if (!saveDemoDatabaseState(state)) return null;
  return database;
}

export function setDemoDatabasePassword(grn: string, password: string): boolean {
  const state = getDemoDatabaseState();
  const database = state.databases.find(item => item.grn === grn || item.id === grn);
  if (!database) return false;
  state.passwords[database.grn] = password;
  return saveDemoDatabaseState(state);
}

export function addDemoPreRestoreBackup(grn: string, backup: DatabaseBackup): boolean {
  const state = getDemoDatabaseState();
  if (!state.databases.some(item => item.grn === grn || item.id === grn)) return false;
  state.backups[grn] = [backup, ...(state.backups[grn] ?? [])];
  return saveDemoDatabaseState(state);
}

export function deleteDemoDatabase(grn: string): boolean {
  const state = getDemoDatabaseState();
  const database = state.databases.find(item => item.grn === grn || item.id === grn);
  if (!database) return false;
  database.status = 'deleting';
  database.updated_at = new Date().toISOString();
  if (!saveDemoDatabaseState(state)) return false;
  setTimeout(() => { getDemoDatabaseState(); }, 4_000);
  return true;
}

export function removeDemoDatabasesByOwner(owner: DatabaseDetail['owner']['type'], ownerId: string, excludeIds: readonly string[] = []): boolean {
  const state = getDemoDatabaseState();
  const belongsToOwner = (item: DatabaseDetail['owner']) => item.type === owner && item.id === ownerId;
  const removed = new Set(state.databases.filter(database => belongsToOwner(database.owner) && !excludeIds.includes(database.id)).map(database => database.grn));
  return saveDemoDatabaseState({
    ...state,
    databases: state.databases.filter(database => !removed.has(database.grn)),
    backups: Object.fromEntries(Object.entries(state.backups).filter(([grn]) => !removed.has(grn))),
    passwords: Object.fromEntries(Object.entries(state.passwords).filter(([grn]) => !removed.has(grn))),
    deletedBackups: Object.fromEntries(Object.entries(state.deletedBackups ?? {}).filter(([, backup]) => !belongsToOwner(backup.owner) || excludeIds.includes(backup.databaseId))),
  });
}
