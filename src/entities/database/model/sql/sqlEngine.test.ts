import { beforeAll, describe, expect, it } from 'vitest';
import initSqlJs from 'sql.js';
import { splitSqlStatements, translateMysqlStatement } from './mysqlCompat';
import { createEmptyDatabaseBytes, dumpDatabaseSql, runQueryBatch, type QueryBatchResult } from './sqlEngine';

type SqlJs = Awaited<ReturnType<typeof initSqlJs>>;
let SQL: SqlJs;
const context = { databaseName: 'db_abc', userName: 'u_abc', writeLocked: false };

beforeAll(async () => { SQL = await initSqlJs(); });

function ok(result: QueryBatchResult) {
  if (result.status !== 'ok') throw new Error(`expected ok, got ${result.status}: ${'message' in result ? result.message : ''}`);
  return result;
}

const createUsers = 'CREATE TABLE `users` (\n  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,\n  `name` VARCHAR(50) NOT NULL COMMENT \'이름\',\n  `email` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,\n  bio TEXT,\n  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,\n  PRIMARY KEY (`id`),\n  UNIQUE KEY `uk_email` (`email`),\n  KEY `idx_name` (`name`)\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 AUTO_INCREMENT=1';

describe('MySQL compatibility layer', () => {
  it('splits statements on ; but not inside strings or comments', () => {
    expect(splitSqlStatements("SELECT 'a;b'; -- c;d\nSELECT `x;y` FROM t; /* ; */ SELECT 3")).toEqual(["SELECT 'a;b'", 'SELECT `x;y` FROM t', 'SELECT 3']);
  });

  it('translates CREATE TABLE with AUTO_INCREMENT, UNSIGNED, keys and table options', () => {
    const translated = translateMysqlStatement(createUsers);
    expect(translated.kind).toBe('sql');
    if (translated.kind !== 'sql') return;
    expect(translated.sql[0]).toContain('`id` INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT');
    expect(translated.sql[0]).not.toMatch(/ENGINE|UNSIGNED|COMMENT|CHARSET|ON UPDATE/i);
    expect(translated.sql[1]).toContain('CREATE INDEX IF NOT EXISTS "users_idx_name"');
  });
});

describe('real SQL execution', () => {
  it('creates, inserts, selects, describes and lists tables in a persisted file', () => {
    const empty = createEmptyDatabaseBytes(SQL);
    const created = ok(runQueryBatch(SQL, empty, `${createUsers};\nINSERT INTO users (name, email) VALUES ('김지민', 'a@example.com'), ('한도윤', 'b@example.com');`, context));
    expect(created.result).toMatchObject({ kind: 'write', affectedRows: 2 });
    expect(created.bytes).toBeInstanceOf(Uint8Array);

    const selected = ok(runQueryBatch(SQL, created.bytes, 'SELECT id, name FROM `users` ORDER BY id DESC LIMIT 1', context));
    expect(selected.changed).toBe(false);
    expect(selected.result).toMatchObject({ columns: ['id', 'name'], rows: [[2, '한도윤']] });

    const described = ok(runQueryBatch(SQL, created.bytes, 'DESCRIBE users', context));
    expect(described.result.columns).toEqual(['Field', 'Type', 'Null', 'Key', 'Default', 'Extra']);
    expect(described.result.rows[0]).toEqual(['id', 'integer', 'NO', 'PRI', null, 'auto_increment']);
    expect(described.result.rows.find(row => row[0] === 'email')?.[3]).toBe('UNI');
    expect(described.result.rows.find(row => row[0] === 'created_at')?.[4]).toBe('CURRENT_TIMESTAMP');

    expect(ok(runQueryBatch(SQL, created.bytes, 'SHOW TABLES', context)).result).toMatchObject({ columns: ['Tables_in_db_abc'], rows: [['users']] });
    const functions = ok(runQueryBatch(SQL, created.bytes, 'SELECT DATABASE(), VERSION(), NOW() FROM DUAL', context)).result.rows[0];
    expect(functions[0]).toBe('db_abc');
    expect(String(functions[1])).toMatch(/^8\.0-compatible \(SQLite 3\./);
    expect(String(functions[2])).toMatch(/^\d{4}-\d\d-\d\d \d\d:\d\d:\d\d$/);
  });

  it('returns the real engine error, keeps earlier statements and reports which statement failed', () => {
    const empty = createEmptyDatabaseBytes(SQL);
    const failed = runQueryBatch(SQL, empty, 'CREATE TABLE t (id INT); INSERT INTO t VALUES (1); SELECT * FROM missing', context);
    expect(failed).toMatchObject({ status: 'error', message: 'no such table: missing', failedStatement: 3, changed: true });
    if (failed.status !== 'error') return;
    expect(ok(runQueryBatch(SQL, failed.bytes, 'SELECT COUNT(*) AS c FROM t', context)).result.rows).toEqual([[1]]);
    expect(runQueryBatch(SQL, empty, 'SHOW VARIABLES', context)).toMatchObject({ status: 'error', message: 'near "SHOW": syntax error' });
    expect(runQueryBatch(SQL, empty, 'USE other_db', context)).toMatchObject({ status: 'error' });
  });

  it('caps visible rows at 1,000 and blocks growing statements while write-locked', () => {
    const empty = createEmptyDatabaseBytes(SQL);
    const filled = ok(runQueryBatch(SQL, empty, 'CREATE TABLE n (v INT); WITH RECURSIVE c(x) AS (SELECT 1 UNION ALL SELECT x + 1 FROM c WHERE x < 1500) INSERT INTO n SELECT x FROM c', context));
    expect(filled.result.affectedRows).toBe(1500);
    const capped = ok(runQueryBatch(SQL, filled.bytes, 'SELECT * FROM n', context));
    expect(capped.result.rows).toHaveLength(1000);
    expect(capped.result.truncated).toBe('rows');

    const locked = { ...context, writeLocked: true };
    expect(runQueryBatch(SQL, filled.bytes, 'INSERT INTO n VALUES (1)', locked).status).toBe('write-locked');
    const shrunk = ok(runQueryBatch(SQL, filled.bytes, 'TRUNCATE TABLE n', locked));
    expect(shrunk.result.affectedRows).toBe(1500);
    expect(shrunk.bytes!.byteLength).toBeLessThan(filled.bytes!.byteLength);
  });

  it('dumps real tables and rows', () => {
    const filled = ok(runQueryBatch(SQL, createEmptyDatabaseBytes(SQL), "CREATE TABLE t (id INT, name TEXT); INSERT INTO t VALUES (1, 'it''s')", context));
    const dump = dumpDatabaseSql(SQL, filled.bytes!, '-- test');
    expect(dump).toContain('CREATE TABLE "t" (id INT, name TEXT);');
    expect(dump).toContain(`INSERT INTO "t" ("id", "name") VALUES (1, 'it''s');`);
  });
});
