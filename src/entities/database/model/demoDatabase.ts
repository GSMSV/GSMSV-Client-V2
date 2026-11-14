import { readDemoState, writeDemoState } from '../../../shared/demo';
import type { DatabaseQuota } from '../../quota/model/types';
import type { DatabaseEngine } from './types';
import type { DatabaseBackup, DatabaseCredentials, DatabaseDetail, DatabaseSummary } from './types';

export interface DemoDatabaseState {
  databases: DatabaseDetail[];
  backups: Record<string, DatabaseBackup[]>;
  passwords: Record<string, string>;
  deletedBackups?: Record<string, { databaseId: string; databaseName: string; owner: DatabaseDetail['owner']; deletedAt: string; expiresAt: string; backups: DatabaseBackup[] }>;
  lockedFixtureInitialized?: boolean;
  welcomeFixtureInitialized?: boolean;
  welcomeBackupsFixtureInitialized?: boolean;
}

const legacyWelcomeGrn = 'grn:gsmsv:database:demo-student:student-db';
const welcomeGrn = 'grn:gsmsv:database:demo-student:welcome-db';
const lockedGrn = 'grn:gsmsv:database:demo-student:quota-locked-db';
const teamGrn = 'grn:gsmsv:database:demo-team:connect-db';
const demoDatabaseSeed: DemoDatabaseState = {
  lockedFixtureInitialized: true,
  welcomeFixtureInitialized: true,
  welcomeBackupsFixtureInitialized: true,
  databases: [
    {
      grn: welcomeGrn, id: 'welcome-db', name: 'welcome-db',
      owner: { type: 'user', id: 'demo-student', name: '김민수' },
      engine: 'mysql', isolation: 'shared', status: 'active', write_locked: false,
      connection: { host: 'db-demo.gs-msv.local', port: 3306, database: 'welcome_db', username: 'welcome_user', tls: true },
      storage: { used_gb: 0.3, owner_total_used_gb: 0.3, owner_limit_gb: 1 }, max_connections: 30,
      created_by: { name: '김민수' }, created_at: '2026-09-29T00:00:00.000Z', updated_at: '2026-10-01T04:00:00.000Z', expires_at: '2026-10-06T14:59:59.000Z',
      permissions: { view: true, update: true, rotate_password: true, delete: true, extend: true, read_backup: true, restore_backup: true },
    },
    {
      grn: lockedGrn, id: 'quota-locked-db', name: 'quota-locked-db',
      owner: { type: 'user', id: 'demo-student', name: '김민수' },
      engine: 'mysql', isolation: 'shared', status: 'active', write_locked: true,
      connection: { host: 'db-demo.gs-msv.local', port: 3306, database: 'quota_locked_db', username: 'student_user', tls: true },
      storage: { used_gb: 0.9, owner_total_used_gb: 1.2, owner_limit_gb: 1 }, max_connections: 30,
      created_by: { name: '김민수' }, created_at: '2026-10-05T00:00:00.000Z', updated_at: '2026-11-13T04:00:00.000Z', expires_at: '2026-12-31T14:59:59.000Z',
      permissions: { view: true, update: true, rotate_password: true, delete: true, extend: true, read_backup: true, restore_backup: true },
    },
    {
      grn: teamGrn, id: 'connect-db', name: 'connect-db',
      owner: { type: 'team', id: 'demo-team', name: 'GSM Connect' },
      engine: 'mysql', isolation: 'dedicated', status: 'active', write_locked: false,
      connection: { host: 'team-db-demo.gs-msv.local', port: 3306, database: 'connect_db', username: 'connect_admin', tls: true },
      storage: { used_gb: 7.4, owner_total_used_gb: 7.4, owner_limit_gb: 60 }, max_connections: 100,
      created_by: { name: '김민수' }, created_at: '2026-10-03T00:00:00.000Z', updated_at: '2026-11-12T04:00:00.000Z', expires_at: '2026-12-31T14:59:59.000Z',
      permissions: { view: true, update: true, rotate_password: true, delete: true, extend: true, read_backup: true, restore_backup: true },
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
    [lockedGrn]: [],
    [teamGrn]: [
      { id: 'connect-db-daily-20261114', kind: 'daily', created_at: '2026-11-14T00:00:00.000Z', size_mb: 936, expires_at: '2026-11-21T00:00:00.000Z' },
    ],
  },
  passwords: { [welcomeGrn]: 'demo-local-pass-welcome', [lockedGrn]: 'demo-local-pass-locked', [teamGrn]: 'demo-local-pass-team' },
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
  if (!validState.welcomeBackupsFixtureInitialized) {
    const seedBackups = demoDatabaseSeed.backups[welcomeGrn] ?? [];
    const seedIds = new Set(seedBackups.map(backup => backup.id));
    const staleSeedIds = new Set(['student-db-daily-20261114', 'student-db-daily-20261113', 'welcome-db-daily-20261006', 'welcome-db-daily-20261005']);
    const retainedBackups = (validState.backups[welcomeGrn] ?? []).filter(backup => !staleSeedIds.has(backup.id) && !seedIds.has(backup.id));
    validState.backups[welcomeGrn] = [...clone(seedBackups), ...retainedBackups];
    validState.welcomeBackupsFixtureInitialized = true;
    changed = true;
  }
  if (!validState.lockedFixtureInitialized) {
    const lockedDatabase = demoDatabaseSeed.databases.find(database => database.grn === lockedGrn);
    if (lockedDatabase && !validState.databases.some(database => database.grn === lockedGrn)) {
      validState.databases.push(clone(lockedDatabase));
    }
    validState.backups[lockedGrn] ??= [];
    validState.passwords[lockedGrn] ??= 'demo-local-pass-locked';
    validState.lockedFixtureInitialized = true;
    changed = true;
  }
  if (settleDemoDatabaseTransitions(validState, Date.now())) changed = true;
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
    .filter(database => database.id !== 'quota-locked-db' && (owner === 'me' ? database.owner.type === 'user' : database.owner.id === owner))
    .map(({ grn, name, engine, isolation, status, write_locked, storage, expires_at }) => ({ grn, name, engine, isolation, status, write_locked, storage: { used_gb: storage.used_gb }, expires_at }));
}

export function getDemoDatabase(grn: string): DatabaseDetail | null {
  return getDemoDatabaseState().databases.find(database => database.grn === grn || database.id === grn) ?? null;
}

export function getDemoDatabaseQuota(): DatabaseQuota {
  const personal = getDemoDatabaseState().databases.filter(database => database.owner.type === 'user' && database.id !== 'quota-locked-db');
  return {
    db: {
      count: { used: personal.length, limit: 2 },
      shared_storage_gb: { used: personal.reduce((total, database) => total + database.storage.used_gb, 0), limit: 1 },
    },
  };
}

export function createDemoDatabase(name: string, engine: DatabaseEngine, owner?: { id: string; name: string }): DatabaseDetail {
  const state = getDemoDatabaseState();
  const ownerInfo = owner
    ? { type: 'team' as const, id: owner.id, name: owner.name }
    : { type: 'user' as const, id: 'demo-student', name: '김민수' };
  const id = `demo-${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  const database: DatabaseDetail = {
    grn: `grn:gsmsv:database:${ownerInfo.id}:${id}`,
    id,
    name,
    owner: ownerInfo,
    engine,
    isolation: owner ? 'dedicated' : 'shared',
    status: 'creating',
    write_locked: false,
    connection: { host: owner ? 'team-db-demo.gs-msv.local' : 'db-demo.gs-msv.local', port: engine === 'mysql' ? 3306 : 5432, database: id.replaceAll('-', '_'), username: `${ownerInfo.id}_user`, tls: true },
    storage: { used_gb: 0, owner_total_used_gb: 0, owner_limit_gb: owner ? 60 : 10 },
    max_connections: owner ? 100 : 30,
    created_by: { name: '김민수' },
    created_at: now,
    updated_at: now,
    expires_at: new Date(Date.now() + (owner ? 30 : 7) * 86_400_000).toISOString(),
    permissions: { view: true, update: true, rotate_password: true, delete: true, extend: true, read_backup: true, restore_backup: true },
  };
  state.databases.unshift(database);
  state.backups[database.grn] = [];
  state.passwords[database.grn] = `demo-${crypto.randomUUID().slice(0, 18)}`;
  saveDemoDatabaseState(state);
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
  saveDemoDatabaseState(state);
  return database;
}

export function setDemoDatabasePassword(grn: string, password: string): void {
  const state = getDemoDatabaseState();
  const database = state.databases.find(item => item.grn === grn || item.id === grn);
  if (!database) return;
  state.passwords[database.grn] = password;
  saveDemoDatabaseState(state);
}

export function addDemoPreRestoreBackup(grn: string, backup: DatabaseBackup): void {
  const state = getDemoDatabaseState();
  state.backups[grn] = [backup, ...(state.backups[grn] ?? [])];
  saveDemoDatabaseState(state);
}

export function deleteDemoDatabase(grn: string): boolean {
  const state = getDemoDatabaseState();
  const database = state.databases.find(item => item.grn === grn || item.id === grn);
  if (!database) return false;
  database.status = 'deleting';
  database.updated_at = new Date().toISOString();
  saveDemoDatabaseState(state);
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
