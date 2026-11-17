import type initSqlJs from 'sql.js';
import { isGrowingStatement, isReadOnlyStatement, quoteIdentifier, splitSqlStatements, translateMysqlStatement, type CompatStatement } from './mysqlCompat';

type SqlJsStatic = initSqlJs.SqlJsStatic;
type SqlDatabase = initSqlJs.Database;

/** 쿼리 콘솔이 화면에 보여 주는 결과 한도. 넘는 행은 실제로 읽지 않는다. */
export const QUERY_ROW_CAP = 1_000;
export const QUERY_BYTE_CAP = 1_048_576;
/** 이 시간이 지나면 Worker를 멈춰 쿼리를 중단한다. */
export const QUERY_TIMEOUT_MS = 45_000;

export type SqlCell = string | number | null;

export interface QueryResultSet {
  columns: string[];
  rows: SqlCell[][];
  /** INSERT·UPDATE·DELETE가 실제로 바꾼 행 수. */
  affectedRows: number;
  kind: 'rows' | 'write';
  truncated: 'rows' | 'bytes' | null;
}

export type QueryBatchResult =
  | { status: 'ok'; result: QueryResultSet; statements: number; changed: boolean; bytes: Uint8Array | null; elapsedMs: number }
  | { status: 'error'; message: string; failedStatement: number; statements: number; changed: boolean; bytes: Uint8Array | null; elapsedMs: number }
  | { status: 'write-locked'; statements: number }
  | { status: 'empty' };

export interface QueryContext {
  databaseName: string;
  userName: string;
  writeLocked: boolean;
  rowCap?: number;
  byteCap?: number;
}

export const SQLITE_VERSION_LABEL = (db: SqlDatabase) => String(db.exec('SELECT sqlite_version()')[0]?.values[0]?.[0] ?? '');

function pad(value: number) {
  return String(value).padStart(2, '0');
}
function localDate(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
function localTime(date: Date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

/** MySQL에서 자주 쓰는 함수를 SQLite 연결에 등록한다. */
function registerMysqlFunctions(db: SqlDatabase, context: Pick<QueryContext, 'databaseName' | 'userName'>) {
  const version = `8.0-compatible (SQLite ${SQLITE_VERSION_LABEL(db)})`;
  db.create_function('NOW', () => `${localDate(new Date())} ${localTime(new Date())}`);
  db.create_function('SYSDATE', () => `${localDate(new Date())} ${localTime(new Date())}`);
  db.create_function('CURDATE', () => localDate(new Date()));
  db.create_function('CURTIME', () => localTime(new Date()));
  db.create_function('UTC_TIMESTAMP', () => new Date().toISOString().slice(0, 19).replace('T', ' '));
  db.create_function('UNIX_TIMESTAMP', () => Math.floor(Date.now() / 1000));
  db.create_function('DATABASE', () => context.databaseName);
  db.create_function('SCHEMA', () => context.databaseName);
  db.create_function('USER', () => `${context.userName}@%`);
  db.create_function('CURRENT_USER', () => `${context.userName}@%`);
  db.create_function('VERSION', () => version);
  db.create_function('UUID', () => crypto.randomUUID());
}

function openDatabase(SQL: SqlJsStatic, bytes: Uint8Array | null, context?: Pick<QueryContext, 'databaseName' | 'userName'>) {
  const db = bytes && bytes.byteLength > 0 ? new SQL.Database(bytes) : new SQL.Database();
  if (context) registerMysqlFunctions(db, context);
  return db;
}

/**
 * 새 Database 파일을 만든다. auto_vacuum=FULL이라 행을 지우면 파일도 실제로 줄어든다.
 * seedSql이 있으면 그 내용을 넣은 뒤 저장한다.
 */
export function createEmptyDatabaseBytes(SQL: SqlJsStatic, seedSql?: string): Uint8Array {
  const db = new SQL.Database();
  try {
    db.run('PRAGMA page_size = 4096; PRAGMA auto_vacuum = FULL; VACUUM;');
    if (seedSql) db.run(seedSql);
    return db.export();
  } finally {
    db.close();
  }
}

function cellValue(value: unknown): SqlCell {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number' || typeof value === 'string') return value;
  if (value instanceof Uint8Array) return `[BLOB ${value.byteLength} bytes]`;
  return String(value);
}

function totalChanges(db: SqlDatabase): number {
  return Number(db.exec('SELECT total_changes()')[0]?.values[0]?.[0] ?? 0);
}

function rowsResult(columns: string[], rows: SqlCell[][]): QueryResultSet {
  return { columns, rows, affectedRows: 0, kind: 'rows', truncated: null };
}

function tableExists(db: SqlDatabase, table: string): boolean {
  const statement = db.prepare("SELECT 1 FROM sqlite_master WHERE type IN ('table','view') AND name = ? AND name NOT LIKE 'sqlite_%'");
  try {
    statement.bind([table]);
    return statement.step();
  } finally {
    statement.free();
  }
}

function describeTable(db: SqlDatabase, table: string, databaseName: string): QueryResultSet {
  if (!tableExists(db, table)) throw new Error(`Table '${databaseName}.${table}' doesn't exist`);
  const quoted = quoteIdentifier(table);
  const createSql = String(db.exec(`SELECT sql FROM sqlite_master WHERE name = '${table.replaceAll("'", "''")}'`)[0]?.values[0]?.[0] ?? '');
  const autoIncrement = /AUTOINCREMENT/i.test(createSql);
  const uniqueColumns = new Set<string>();
  const indexedColumns = new Set<string>();
  for (const [, indexName, unique] of db.exec(`PRAGMA index_list(${quoted})`)[0]?.values ?? []) {
    const indexColumns = (db.exec(`PRAGMA index_info(${quoteIdentifier(String(indexName))})`)[0]?.values ?? []).map(row => String(row[2]));
    if (Number(unique) === 1 && indexColumns.length === 1) uniqueColumns.add(indexColumns[0]);
    else if (indexColumns[0]) indexedColumns.add(indexColumns[0]);
  }
  const rows = (db.exec(`PRAGMA table_info(${quoted})`)[0]?.values ?? []).map(([, name, type, notNull, defaultValue, primaryKey]): SqlCell[] => {
    const column = String(name);
    const key = Number(primaryKey) > 0 ? 'PRI' : uniqueColumns.has(column) ? 'UNI' : indexedColumns.has(column) ? 'MUL' : '';
    const rawDefault = defaultValue === null ? null : String(defaultValue);
    const shownDefault = rawDefault === null ? null
      : /strftime\('%Y-%m-%d %H:%M:%S','now','localtime'\)/.test(rawDefault) ? 'CURRENT_TIMESTAMP'
        : rawDefault.replace(/^'(.*)'$/s, '$1').replaceAll("''", "'");
    const extra = Number(primaryKey) > 0 && autoIncrement && /^INTEGER$/i.test(String(type)) ? 'auto_increment' : '';
    return [column, String(type).toLowerCase(), Number(notNull) || Number(primaryKey) > 0 ? 'NO' : 'YES', key, shownDefault, extra];
  });
  return rowsResult(['Field', 'Type', 'Null', 'Key', 'Default', 'Extra'], rows);
}

function runStatement(db: SqlDatabase, sql: string, rowCap: number, byteCap: number): QueryResultSet {
  const before = totalChanges(db);
  const statement = db.prepare(sql);
  try {
    const columns = statement.getColumnNames();
    const rows: SqlCell[][] = [];
    const encoder = new TextEncoder();
    let bytes = 0;
    let truncated: QueryResultSet['truncated'] = null;
    while (statement.step()) {
      if (columns.length === 0) continue;
      if (rows.length >= rowCap) { truncated = 'rows'; break; }
      const row = statement.get().map(cellValue);
      const rowBytes = encoder.encode(JSON.stringify(row)).byteLength;
      if (bytes + rowBytes > byteCap) { truncated = 'bytes'; break; }
      bytes += rowBytes;
      rows.push(row);
    }
    if (columns.length > 0) return { columns, rows, affectedRows: 0, kind: 'rows', truncated };
    return { columns: [], rows: [], affectedRows: totalChanges(db) - before, kind: 'write', truncated: null };
  } finally {
    statement.free();
  }
}

function runCompatStatement(db: SqlDatabase, statement: CompatStatement, context: QueryContext, rowCap: number, byteCap: number): QueryResultSet {
  switch (statement.kind) {
    case 'error':
      throw new Error(statement.message);
    case 'show-tables': {
      const rows = (db.exec("SELECT name, type FROM sqlite_master WHERE type IN ('table','view') AND name NOT LIKE 'sqlite_%' ORDER BY name")[0]?.values ?? [])
        .map(([name, type]) => statement.full ? [String(name), type === 'view' ? 'VIEW' : 'BASE TABLE'] : [String(name)]);
      return rowsResult(statement.full ? [`Tables_in_${context.databaseName}`, 'Table_type'] : [`Tables_in_${context.databaseName}`], rows);
    }
    case 'show-databases':
      return rowsResult(['Database'], [[context.databaseName]]);
    case 'describe':
      return describeTable(db, statement.table, context.databaseName);
    case 'show-create': {
      if (!tableExists(db, statement.table)) throw new Error(`Table '${context.databaseName}.${statement.table}' doesn't exist`);
      const sql = db.exec(`SELECT sql FROM sqlite_master WHERE name = '${statement.table.replaceAll("'", "''")}'`)[0]?.values[0]?.[0];
      return rowsResult(['Table', 'Create Table'], [[statement.table, cellValue(sql)]]);
    }
    case 'use':
      if (statement.database !== context.databaseName) throw new Error(`Access denied for user '${context.userName}'@'%' to database '${statement.database}'`);
      return { columns: [], rows: [], affectedRows: 0, kind: 'write', truncated: null };
    case 'truncate': {
      if (!tableExists(db, statement.table)) throw new Error(`no such table: ${statement.table}`);
      const before = totalChanges(db);
      db.run(`DELETE FROM ${quoteIdentifier(statement.table)}`);
      const affectedRows = totalChanges(db) - before;
      if (db.exec("SELECT 1 FROM sqlite_master WHERE name = 'sqlite_sequence'").length > 0) {
        db.run('DELETE FROM sqlite_sequence WHERE name = ?', [statement.table]);
      }
      return { columns: [], rows: [], affectedRows, kind: 'write', truncated: null };
    }
    case 'sql': {
      let result: QueryResultSet = { columns: [], rows: [], affectedRows: 0, kind: 'write', truncated: null };
      for (const sql of statement.sql) result = runStatement(db, sql, rowCap, byteCap);
      return result;
    }
  }
}

/**
 * Database 파일(bytes)을 열고 `;`로 나뉜 문장을 차례로 실제 실행한다.
 * 첫 오류에서 멈추고(그 전 문장은 MySQL autocommit처럼 반영), 마지막 결과를 돌려준다.
 * 파일이 바뀌었으면 새 파일 bytes를 함께 돌려준다.
 */
export function runQueryBatch(SQL: SqlJsStatic, bytes: Uint8Array | null, input: string, context: QueryContext): QueryBatchResult {
  const statements = splitSqlStatements(input);
  if (statements.length === 0) return { status: 'empty' };
  if (context.writeLocked && statements.some(isGrowingStatement)) return { status: 'write-locked', statements: statements.length };
  const rowCap = context.rowCap ?? QUERY_ROW_CAP;
  const byteCap = context.byteCap ?? QUERY_BYTE_CAP;
  const started = performance.now();
  const db = openDatabase(SQL, bytes, context);
  let changed = false;
  try {
    let result: QueryResultSet | null = null;
    for (const [index, statement] of statements.entries()) {
      try {
        if (!isReadOnlyStatement(statement)) changed = true;
        result = runCompatStatement(db, translateMysqlStatement(statement), context, rowCap, byteCap);
      } catch (error) {
        return {
          status: 'error',
          message: error instanceof Error ? error.message : String(error),
          failedStatement: index + 1,
          statements: statements.length,
          changed,
          bytes: changed ? db.export() : null,
          elapsedMs: performance.now() - started,
        };
      }
    }
    return { status: 'ok', result: result!, statements: statements.length, changed, bytes: changed ? db.export() : null, elapsedMs: performance.now() - started };
  } finally {
    db.close();
  }
}

function sqlLiteral(value: unknown): string {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'NULL';
  if (value instanceof Uint8Array) return `X'${Array.from(value, byte => byte.toString(16).padStart(2, '0')).join('')}'`;
  return `'${String(value).replaceAll("'", "''")}'`;
}

/** 백업 내려받기용 SQL 덤프. 파일의 실제 테이블·행으로 만든다. */
export function dumpDatabaseSql(SQL: SqlJsStatic, bytes: Uint8Array, header: string): string {
  const db = openDatabase(SQL, bytes);
  try {
    const lines = [header, ''];
    const objects = db.exec("SELECT type, name, sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' AND sql IS NOT NULL ORDER BY CASE type WHEN 'table' THEN 0 ELSE 1 END, name")[0]?.values ?? [];
    for (const [type, name, sql] of objects) {
      if (type !== 'table') continue;
      lines.push(`DROP TABLE IF EXISTS ${quoteIdentifier(String(name))};`, `${String(sql)};`);
      const data = db.exec(`SELECT * FROM ${quoteIdentifier(String(name))}`)[0];
      if (data) {
        const columns = data.columns.map(quoteIdentifier).join(', ');
        for (const row of data.values) lines.push(`INSERT INTO ${quoteIdentifier(String(name))} (${columns}) VALUES (${row.map(sqlLiteral).join(', ')});`);
      }
      lines.push('');
    }
    for (const [type, , sql] of objects) if (type !== 'table') lines.push(`${String(sql)};`);
    return `${lines.join('\n')}\n`;
  } finally {
    db.close();
  }
}
