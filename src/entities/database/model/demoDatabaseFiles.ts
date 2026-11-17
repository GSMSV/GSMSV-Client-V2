import { getDemoResetGeneration, isDemoFixtureMode } from '../../../shared/demo';
import {
  getDemoDatabaseState,
  isDemoDatabaseFixtureSeed,
  recordDemoDatabaseUsage,
  saveDemoDatabaseState,
} from './demoDatabase';
import { getSqlRunner, SqlTimeoutError } from './sql/sqlClient';
import type { QueryBatchResult } from './sql/sqlEngine';
import type { DatabaseBackup, DatabaseDetail } from './types';

/**
 * 발급한 Database마다 SQLite 파일 하나를 IndexedDB에 둔다.
 * 새로고침·다시 로그인해도 테이블과 행이 남고, Database를 지우면 파일과 백업도 지운다.
 */
const idbName = 'gsmsv-demo-database-files';
const idbVersion = 1;
const fileStore = 'files';
const snapshotStore = 'snapshots';
const BACKUP_RETENTION_MS = 7 * 86_400_000;
const DAILY_BACKUP_INTERVAL_MS = 86_400_000;

type StoredBytes = { key: string; generation: string; bytes: Uint8Array; savedAt: string };

export class DemoDatabaseFileError extends Error {
  constructor(message = 'Database 파일을 브라우저에 저장하지 못했습니다. 저장 공간을 확인한 뒤 다시 시도해 주세요.') {
    super(message);
    this.name = 'DemoDatabaseFileError';
  }
}

let idbPromise: Promise<IDBDatabase> | undefined;

function openIdb(): Promise<IDBDatabase> {
  const factory = typeof window !== 'undefined' ? window.indexedDB : undefined;
  if (!factory) return Promise.reject(new DemoDatabaseFileError());
  idbPromise ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = factory.open(idbName, idbVersion);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(fileStore)) request.result.createObjectStore(fileStore, { keyPath: 'key' });
      if (!request.result.objectStoreNames.contains(snapshotStore)) request.result.createObjectStore(snapshotStore, { keyPath: 'key' });
    };
    request.onsuccess = () => {
      request.result.onversionchange = () => { request.result.close(); idbPromise = undefined; };
      resolve(request.result);
    };
    request.onerror = () => reject(new DemoDatabaseFileError());
    request.onblocked = () => reject(new DemoDatabaseFileError());
  }).catch(error => {
    idbPromise = undefined;
    throw error;
  });
  return idbPromise;
}

function transact<T>(store: string, mode: IDBTransactionMode, work: (objectStore: IDBObjectStore) => IDBRequest<T> | void): Promise<T | undefined> {
  return openIdb().then(db => new Promise<T | undefined>((resolve, reject) => {
    const transaction = db.transaction(store, mode);
    const request = work(transaction.objectStore(store));
    transaction.oncomplete = () => resolve(request ? request.result : undefined);
    transaction.onerror = () => reject(new DemoDatabaseFileError());
    transaction.onabort = () => reject(new DemoDatabaseFileError());
  }));
}

const scope = () => (isDemoFixtureMode() ? 'fixture' : 'workspace');
const fileKey = (grn: string) => `${scope()}:${grn}`;
const snapshotKey = (grn: string, backupId: string) => `${scope()}:${grn}:${backupId}`;

async function readBytes(store: string, key: string): Promise<Uint8Array | null> {
  const record = await transact<StoredBytes | undefined>(store, 'readonly', objectStore => objectStore.get(key));
  if (!record) return null;
  // 체험 초기화 전에 저장된 파일은 쓰지 않고 지운다.
  if (record.generation !== getDemoResetGeneration()) {
    await transact(store, 'readwrite', objectStore => { objectStore.delete(key); });
    return null;
  }
  return record.bytes;
}

async function writeBytes(store: string, key: string, bytes: Uint8Array): Promise<void> {
  const record: StoredBytes = { key, generation: getDemoResetGeneration(), bytes, savedAt: new Date().toISOString() };
  await transact(store, 'readwrite', objectStore => { objectStore.put(record); });
}

/** 저장된 Database 파일. 없으면 null. */
export function readDemoDatabaseFile(grn: string): Promise<Uint8Array | null> {
  return readBytes(fileStore, fileKey(grn));
}

/** 목데이터 Database의 첫 파일: Figma 쿼리 콘솔 예시와 같은 users 테이블. */
const fixtureSeedSql = `CREATE TABLE \`users\` (\`id\` INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, \`name\` VARCHAR(50) NOT NULL, \`email\` VARCHAR(100) NOT NULL, \`created_at\` DATETIME NOT NULL);
INSERT INTO \`users\` (\`id\`, \`name\`, \`email\`, \`created_at\`) VALUES
  (1, '김지민', 'jimin@example.com', '2026-09-28 10:21'),
  (2, '한도윤', 'doyun@example.com', '2026-09-28 11:02'),
  (3, '윤채원', 'chaewon@example.com', '2026-09-29 09:40');`;

function findDatabase(grn: string): DatabaseDetail | null {
  return getDemoDatabaseState().databases.find(item => item.grn === grn || item.id === grn) ?? null;
}

async function createFileFor(database: DatabaseDetail): Promise<Uint8Array> {
  const bytes = await getSqlRunner().create(isDemoFixtureMode() && isDemoDatabaseFixtureSeed(database.grn) ? fixtureSeedSql : undefined);
  await writeBytes(fileStore, fileKey(database.grn), bytes);
  return bytes;
}

/** Database 파일을 읽고, 아직 없으면 빈 파일을 만들어 저장한다. */
export async function ensureDemoDatabaseFile(grn: string): Promise<Uint8Array> {
  const database = findDatabase(grn);
  if (!database) throw new DemoDatabaseFileError('Database를 찾을 수 없습니다.');
  return (await readDemoDatabaseFile(database.grn)) ?? createFileFor(database);
}

/**
 * 발급 직후 실제 Database 파일을 만들어 저장한 뒤에야 '사용 중'으로 바꾼다.
 * 실패하면 만들던 Database와 계정을 지운다.
 */
export async function provisionDemoDatabase(grn: string): Promise<DatabaseDetail> {
  const database = findDatabase(grn);
  if (!database) throw new DemoDatabaseFileError('Database를 찾을 수 없습니다.');
  try {
    const bytes = await createFileFor(database);
    const state = getDemoDatabaseState();
    const current = state.databases.find(item => item.grn === database.grn);
    if (!current) throw new DemoDatabaseFileError('Database를 찾을 수 없습니다.');
    if (current.status === 'creating') current.status = 'active';
    current.updated_at = new Date().toISOString();
    if (!saveDemoDatabaseState(state)) throw new DemoDatabaseFileError();
    return recordDemoDatabaseUsage(database.grn, bytes.byteLength) ?? current;
  } catch (error) {
    await deleteDemoDatabaseFiles(database.grn).catch(() => undefined);
    const state = getDemoDatabaseState();
    state.databases = state.databases.filter(item => item.grn !== database.grn);
    delete state.passwords[database.grn];
    delete state.backups[database.grn];
    saveDemoDatabaseState(state);
    throw error;
  }
}

/**
 * Database 파일을 지운다. 백업 사본은 삭제 안내대로 7일 동안 남기고,
 * 더 이상 어느 Database나 삭제 보관 목록에도 없는 사본만 함께 지운다.
 */
export async function deleteDemoDatabaseFiles(grn: string): Promise<void> {
  await transact(fileStore, 'readwrite', objectStore => { objectStore.delete(fileKey(grn)); });
  await pruneDemoDatabaseSnapshots();
}

/** 어떤 Database에도, 삭제 후 보관 중인 백업에도 속하지 않는 백업 사본을 지운다. */
export async function pruneDemoDatabaseSnapshots(): Promise<void> {
  const state = getDemoDatabaseState();
  const kept = new Set<string>();
  for (const [grn, backups] of Object.entries(state.backups)) for (const backup of backups) kept.add(snapshotKey(grn, backup.id));
  for (const [grn, archive] of Object.entries(state.deletedBackups ?? {})) for (const backup of archive.backups) kept.add(snapshotKey(grn, backup.id));
  const prefix = `${scope()}:`;
  const keys = await transact<IDBValidKey[]>(snapshotStore, 'readonly', objectStore => objectStore.getAllKeys(IDBKeyRange.bound(prefix, `${prefix}\uffff`))) ?? [];
  const stale = keys.filter(key => !kept.has(String(key)));
  if (stale.length > 0) await transact(snapshotStore, 'readwrite', objectStore => { for (const key of stale) objectStore.delete(key); });
}

function backupStamp(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

async function saveSnapshot(database: DatabaseDetail, kind: DatabaseBackup['kind'], bytes: Uint8Array): Promise<DatabaseBackup> {
  const now = new Date();
  const backup: DatabaseBackup = {
    id: `${database.id}-${kind === 'daily' ? 'daily' : 'pre-restore'}-${backupStamp(now)}-${crypto.getRandomValues(new Uint16Array(1))[0].toString(16).padStart(4, '0')}`,
    kind,
    created_at: now.toISOString(),
    size_mb: bytes.byteLength / 1_048_576,
    expires_at: new Date(now.getTime() + BACKUP_RETENTION_MS).toISOString(),
  };
  await writeBytes(snapshotStore, snapshotKey(database.grn, backup.id), bytes);
  const state = getDemoDatabaseState();
  state.backups[database.grn] = [backup, ...(state.backups[database.grn] ?? []).filter(item => item.id !== backup.id)];
  if (!saveDemoDatabaseState(state)) throw new DemoDatabaseFileError();
  return backup;
}

/**
 * 하루에 한 번 실제 파일 사본을 '매일 자동' 백업으로 남기고, 7일 지난 백업은 지운다.
 * 서버가 없으므로 그날 처음 Database를 열거나 쿼리를 실행할 때 만든다. 목데이터 Database는 건드리지 않는다.
 */
export async function ensureDemoDailyBackup(grn: string): Promise<boolean> {
  const database = findDatabase(grn);
  if (!database || database.vm_slot === undefined || database.status !== 'active') return false;
  const now = Date.now();
  const backups = getDemoDatabaseState().backups[database.grn] ?? [];
  const expired = backups.filter(backup => new Date(backup.expires_at).getTime() <= now);
  if (expired.length > 0) {
    await transact(snapshotStore, 'readwrite', objectStore => { for (const backup of expired) objectStore.delete(snapshotKey(database.grn, backup.id)); });
    const state = getDemoDatabaseState();
    state.backups[database.grn] = (state.backups[database.grn] ?? []).filter(backup => !expired.some(item => item.id === backup.id));
    saveDemoDatabaseState(state);
  }
  const latestDaily = backups.filter(backup => backup.kind === 'daily' && !expired.includes(backup))
    .reduce((latest, backup) => Math.max(latest, new Date(backup.created_at).getTime()), 0);
  if (now - latestDaily < DAILY_BACKUP_INTERVAL_MS) return expired.length > 0;
  await saveSnapshot(database, 'daily', await ensureDemoDatabaseFile(database.grn));
  return true;
}

async function backupBytes(database: DatabaseDetail, backupId: string): Promise<Uint8Array> {
  const stored = await readBytes(snapshotStore, snapshotKey(database.grn, backupId));
  if (stored) return stored;
  // 목데이터 백업은 사본이 없으므로 목데이터 첫 파일로 대신한다.
  if (isDemoDatabaseFixtureSeed(database.grn)) return getSqlRunner().create(isDemoFixtureMode() ? fixtureSeedSql : undefined);
  throw new DemoDatabaseFileError('백업 사본을 찾을 수 없습니다.');
}

/** 복원 직전 사본을 남긴 뒤 선택한 백업으로 Database 파일을 실제로 바꾼다. */
export async function restoreDemoDatabaseBackup(grn: string, backupId: string): Promise<{ preRestoreBackup: DatabaseBackup; database: DatabaseDetail | null }> {
  const database = findDatabase(grn);
  if (!database) throw new DemoDatabaseFileError('Database를 찾을 수 없습니다.');
  const restored = await backupBytes(database, backupId);
  const preRestoreBackup = await saveSnapshot(database, 'pre_restore', await ensureDemoDatabaseFile(database.grn));
  await writeBytes(fileStore, fileKey(database.grn), restored);
  return { preRestoreBackup, database: recordDemoDatabaseUsage(database.grn, restored.byteLength) };
}

/** 백업 사본의 실제 테이블·행을 SQL 덤프(gzip)로 만든다. */
export async function downloadDemoDatabaseBackup(grn: string, backupId: string): Promise<Blob> {
  const database = findDatabase(grn);
  if (!database) throw new DemoDatabaseFileError('Database를 찾을 수 없습니다.');
  const sql = await getSqlRunner().dump(await backupBytes(database, backupId), `-- GSMSV Database backup ${backupId}\n-- Database: ${database.connection.database} (${database.name})\n-- Dumped from the browser SQLite file at ${new Date().toISOString()}`);
  const compressed = await new Response(new Blob([sql]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer();
  return new Blob([compressed], { type: 'application/gzip' });
}

export type DemoQueryOutcome =
  | (QueryBatchResult & { database: DatabaseDetail | null })
  | { status: 'timeout'; database: DatabaseDetail | null };

/**
 * 쿼리 콘솔의 SQL을 이 Database 파일에서 실제로 실행한다(Web Worker 안의 SQLite).
 * 파일이 바뀌면 IndexedDB에 저장하고, 실제 파일 크기로 사용량·쓰기 금지를 다시 계산한다.
 */
export async function runDemoDatabaseQuery(grn: string, sql: string): Promise<DemoQueryOutcome> {
  const database = findDatabase(grn);
  if (!database) throw new DemoDatabaseFileError('Database를 찾을 수 없습니다.');
  await ensureDemoDailyBackup(database.grn).catch(() => false);
  const bytes = await ensureDemoDatabaseFile(database.grn);
  let result: QueryBatchResult;
  try {
    result = await getSqlRunner().run(bytes, sql, {
      databaseName: database.connection.database,
      userName: database.connection.username,
      writeLocked: database.write_locked,
    });
  } catch (error) {
    if (error instanceof SqlTimeoutError) return { status: 'timeout', database };
    throw error;
  }
  if ((result.status === 'ok' || result.status === 'error') && result.changed && result.bytes) {
    await writeBytes(fileStore, fileKey(database.grn), result.bytes);
    return { ...result, database: recordDemoDatabaseUsage(database.grn, result.bytes.byteLength) };
  }
  return { ...result, database };
}
