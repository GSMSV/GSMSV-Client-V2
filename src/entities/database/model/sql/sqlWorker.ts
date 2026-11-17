/// <reference lib="webworker" />
import initSqlJs from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm-browser.wasm?url';
import { createEmptyDatabaseBytes, dumpDatabaseSql, runQueryBatch } from './sqlEngine';
import type { SqlWorkerRequest, SqlWorkerResponse } from './sqlProtocol';

let sqlPromise: ReturnType<typeof initSqlJs> | null = null;
const loadSql = () => {
  sqlPromise ??= initSqlJs({ locateFile: () => wasmUrl });
  return sqlPromise;
};

const scope = self as unknown as DedicatedWorkerGlobalScope;

scope.onmessage = async (event: MessageEvent<SqlWorkerRequest>) => {
  const request = event.data;
  try {
    const SQL = await loadSql();
    let response: SqlWorkerResponse;
    if (request.type === 'create') {
      response = { id: request.id, ok: true, type: 'create', bytes: createEmptyDatabaseBytes(SQL, request.seedSql) };
    } else if (request.type === 'dump') {
      response = { id: request.id, ok: true, type: 'dump', sql: dumpDatabaseSql(SQL, request.bytes, request.header) };
    } else {
      response = { id: request.id, ok: true, type: 'run', result: runQueryBatch(SQL, request.bytes, request.sql, request.context) };
    }
    const transfer = response.type === 'create' ? [response.bytes.buffer]
      : response.type === 'run' && 'bytes' in response.result && response.result.bytes ? [response.result.bytes.buffer] : [];
    scope.postMessage(response, transfer as Transferable[]);
  } catch (error) {
    scope.postMessage({ id: request.id, ok: false, error: error instanceof Error ? error.message : String(error) } satisfies SqlWorkerResponse);
  }
};
