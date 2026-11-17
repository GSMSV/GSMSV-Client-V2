import 'fake-indexeddb/auto';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import initSqlJs from 'sql.js';
import { createDemoDatabase, DEMO_DATABASES_PER_VM, DemoDatabaseCapacityError, generateDemoDatabasePassword, getDemoDatabase, getDemoDatabaseCapacity, getDemoDatabaseCredentials, recordDemoDatabaseUsage } from './demoDatabase';
import { deleteDemoDatabaseFiles, downloadDemoDatabaseBackup, ensureDemoDailyBackup, provisionDemoDatabase, readDemoDatabaseFile, restoreDemoDatabaseBackup, runDemoDatabaseQuery } from './demoDatabaseFiles';
import { setSqlRunnerForTests } from './sql/sqlClient';
import { createEmptyDatabaseBytes, dumpDatabaseSql, runQueryBatch } from './sql/sqlEngine';
import { configuredDemoSshTargets, demoVmPoolRoles } from '../../vm/model/demoSshSlots';

let SQL: Awaited<ReturnType<typeof initSqlJs>>;
const storage = new Map<string, string>();

beforeAll(async () => {
  SQL = await initSqlJs();
  setSqlRunnerForTests({
    create: async seedSql => createEmptyDatabaseBytes(SQL, seedSql),
    run: async (bytes, sql, context) => runQueryBatch(SQL, bytes, sql, context),
    dump: async (bytes, header) => dumpDatabaseSql(SQL, bytes, header),
  });
});

beforeEach(() => {
  storage.clear();
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      location: { search: '?demo=1' },
      indexedDB,
      addEventListener: () => undefined,
      dispatchEvent: () => true,
      localStorage: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => { storage.set(key, value); },
        removeItem: (key: string) => { storage.delete(key); },
        key: (index: number) => [...storage.keys()][index] ?? null,
        get length() { return storage.size; },
      },
    },
  });
});

afterEach(() => { Reflect.deleteProperty(globalThis, 'window'); });

function rows(outcome: Awaited<ReturnType<typeof runDemoDatabaseQuery>>) {
  if (outcome.status !== 'ok') throw new Error(`expected ok, got ${outcome.status}`);
  return outcome.result.rows;
}

describe('issued MySQL databases', () => {
  it('places databases on the Database VMs with generated credentials and reports a real shortage when full', () => {
    const targets = configuredDemoSshTargets();
    const created = Array.from({ length: demoVmPoolRoles.database.length * DEMO_DATABASES_PER_VM }, (_, index) => createDemoDatabase(`db-${index}`, 'mysql', index < 2 ? undefined : { id: 'team-a', name: 'Team A' }, 'shared'));
    expect(created.map(database => database.vm_slot)).toEqual([7, 7, 8, 8]);
    const first = created[0];
    expect(first.connection).toMatchObject({ host: targets[7].host, port: 3306, database: `db_${first.id.slice(3)}`, username: `u_${first.id.slice(3)}` });
    const password = getDemoDatabaseCredentials(first.grn)?.password ?? '';
    expect(password).toMatch(/^[A-Za-z0-9]{24}$/);
    expect(getDemoDatabaseCredentials(created[1].grn)?.password).not.toBe(password);
    expect(generateDemoDatabasePassword()).not.toBe(generateDemoDatabasePassword());
    expect(getDemoDatabaseCapacity()).toMatchObject({ available: false, vms: [{ vmNumber: 8, used: 2, limit: 2 }, { vmNumber: 9, used: 2, limit: 2 }] });
    expect(() => createDemoDatabase('one-more', 'mysql', { id: 'team-a', name: 'Team A' }, 'shared')).toThrow(DemoDatabaseCapacityError);
  });

  it('keeps tables and rows in a per-database IndexedDB file and removes the file on delete', async () => {
    const shop = createDemoDatabase('shop', 'mysql');
    const blog = createDemoDatabase('blog', 'mysql');
    await provisionDemoDatabase(shop.grn);
    await provisionDemoDatabase(blog.grn);
    expect(getDemoDatabase(shop.grn)?.status).toBe('active');

    const written = await runDemoDatabaseQuery(shop.grn, 'CREATE TABLE items (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(20)) ENGINE=InnoDB; INSERT INTO items (name) VALUES (\'pen\'), (\'cup\')');
    expect(written).toMatchObject({ status: 'ok', result: { kind: 'write', affectedRows: 2 } });
    const file = await readDemoDatabaseFile(shop.grn);
    expect(getDemoDatabase(shop.grn)?.storage.used_bytes).toBe(file?.byteLength);

    expect(rows(await runDemoDatabaseQuery(shop.grn, 'SELECT name FROM items ORDER BY id'))).toEqual([['pen'], ['cup']]);
    expect(await runDemoDatabaseQuery(blog.grn, 'SELECT * FROM items')).toMatchObject({ status: 'error', message: 'no such table: items' });

    await deleteDemoDatabaseFiles(shop.grn);
    expect(await readDemoDatabaseFile(shop.grn)).toBeNull();
    expect(await readDemoDatabaseFile(blog.grn)).not.toBeNull();
  });

  it('locks writes from the real file size over the quota and unlocks after shrinking', async () => {
    const database = createDemoDatabase('big', 'mysql');
    await provisionDemoDatabase(database.grn);
    expect(recordDemoDatabaseUsage(database.grn, 2 * 1024 ** 3)?.write_locked).toBe(true);
    expect(await runDemoDatabaseQuery(database.grn, 'CREATE TABLE t (id INT)')).toMatchObject({ status: 'write-locked' });
    const unlocked = recordDemoDatabaseUsage(database.grn, 8192);
    expect(unlocked?.write_locked).toBe(false);
  });

  it('backs up the real file daily, restores it and dumps real rows', async () => {
    const database = createDemoDatabase('restore-me', 'mysql');
    await provisionDemoDatabase(database.grn);
    // 그날 첫 실행 전에 빈 파일 사본이 '매일 자동' 백업으로 남는다.
    await runDemoDatabaseQuery(database.grn, "CREATE TABLE notes (body TEXT); INSERT INTO notes VALUES ('first')");
    expect(await ensureDemoDailyBackup(database.grn)).toBe(false);
    const backups = () => JSON.parse(storage.get('gsmsv.demo.state.v2.database.resources') ?? '{}').value.backups[database.grn] as { id: string; kind: string }[];
    const daily = backups()[0];
    expect(daily.kind).toBe('daily');

    const restored = await restoreDemoDatabaseBackup(database.grn, daily.id);
    expect(await runDemoDatabaseQuery(database.grn, 'SELECT * FROM notes')).toMatchObject({ status: 'error', message: 'no such table: notes' });
    await restoreDemoDatabaseBackup(database.grn, restored.preRestoreBackup.id);
    expect(rows(await runDemoDatabaseQuery(database.grn, 'SELECT body FROM notes'))).toEqual([['first']]);

    const dump = await downloadDemoDatabaseBackup(database.grn, restored.preRestoreBackup.id);
    const text = await new Response(dump.stream().pipeThrough(new DecompressionStream('gzip'))).text();
    expect(text).toContain(`INSERT INTO "notes" ("body") VALUES ('first');`);
  });
});
