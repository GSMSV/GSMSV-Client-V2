import { readDemoState, writeDemoState } from '../../../shared/demo';
import type { DatabaseQuota } from '../../quota/model/types';
import type { DatabaseEngine } from './types';
import type { DatabaseBackup, DatabaseCredentials, DatabaseDetail, DatabaseSummary } from './types';

export interface DemoDatabaseState {
  databases: DatabaseDetail[];
  backups: Record<string, DatabaseBackup[]>;
  passwords: Record<string, string>;
}

const personalGrn = 'grn:gsmsv:database:demo-student:student-db';
const teamGrn = 'grn:gsmsv:database:demo-team:connect-db';
const demoDatabaseSeed: DemoDatabaseState = {
  databases: [
    {
      grn: personalGrn, id: 'student-db', name: 'student-db',
      owner: { type: 'user', id: 'demo-student', name: '김민수' },
      engine: 'postgresql', isolation: 'shared', status: 'active', write_locked: false,
      connection: { host: 'db-demo.gs-msv.local', port: 5432, database: 'student_db', username: 'student_user', tls: true },
      storage: { used_gb: 3.2, owner_total_used_gb: 3.2, owner_limit_gb: 10 }, max_connections: 30,
      created_by: { name: '김민수' }, created_at: '2026-10-01T00:00:00.000Z', updated_at: '2026-11-13T04:00:00.000Z', expires_at: '2026-12-31T14:59:59.000Z',
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
  backups: {
    [personalGrn]: [
      { id: 'student-db-daily-20261114', kind: 'daily', created_at: '2026-11-14T00:00:00.000Z', size_mb: 428, expires_at: '2026-11-21T00:00:00.000Z' },
      { id: 'student-db-daily-20261113', kind: 'daily', created_at: '2026-11-13T00:00:00.000Z', size_mb: 412, expires_at: '2026-11-20T00:00:00.000Z' },
    ],
    [teamGrn]: [
      { id: 'connect-db-daily-20261114', kind: 'daily', created_at: '2026-11-14T00:00:00.000Z', size_mb: 936, expires_at: '2026-11-21T00:00:00.000Z' },
    ],
  },
  passwords: { [personalGrn]: 'demo-local-pass-student', [teamGrn]: 'demo-local-pass-team' },
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
      state.databases = state.databases.filter(item => item.grn !== database.grn);
      delete state.backups[database.grn];
      delete state.passwords[database.grn];
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
  if (settleDemoDatabaseTransitions(validState, Date.now())) saveDemoDatabaseState(validState);
  return validState;
}

export function saveDemoDatabaseState(state: DemoDatabaseState): boolean {
  return writeDemoState('database.resources', state);
}

export function listDemoDatabases(owner = 'me'): DatabaseSummary[] {
  return getDemoDatabaseState().databases
    .filter(database => owner === 'me' ? database.owner.type === 'user' : database.owner.id === owner)
    .map(({ grn, name, engine, isolation, status, write_locked, storage, expires_at }) => ({ grn, name, engine, isolation, status, write_locked, storage: { used_gb: storage.used_gb }, expires_at }));
}

export function getDemoDatabase(grn: string): DatabaseDetail | null {
  return getDemoDatabaseState().databases.find(database => database.grn === grn || database.id === grn) ?? null;
}

export function getDemoDatabaseQuota(): DatabaseQuota {
  const personal = getDemoDatabaseState().databases.filter(database => database.owner.type === 'user');
  return {
    db: {
      count: { used: personal.length, limit: 3 },
      shared_storage_gb: { used: personal.reduce((total, database) => total + database.storage.used_gb, 0), limit: 10 },
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
