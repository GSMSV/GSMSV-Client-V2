import { QUERY_TIMEOUT_MS, type QueryBatchResult, type QueryContext } from './sqlEngine';
import type { SqlWorkerRequest, SqlWorkerResponse } from './sqlProtocol';

/** 45초 안에 끝나지 않아 Worker를 멈춘 쿼리. 파일에는 아무것도 저장되지 않는다. */
export class SqlTimeoutError extends Error {
  constructor() {
    super('QUERY_TIMEOUT');
    this.name = 'SqlTimeoutError';
  }
}

export interface SqlRunner {
  create(seedSql?: string): Promise<Uint8Array>;
  run(bytes: Uint8Array | null, sql: string, context: QueryContext): Promise<QueryBatchResult>;
  dump(bytes: Uint8Array, header: string): Promise<string>;
}

type Pending = { resolve: (response: SqlWorkerResponse) => void; reject: (error: Error) => void; timer: ReturnType<typeof setTimeout> | null };
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

let worker: Worker | null = null;
let nextId = 1;
const pending = new Map<number, Pending>();

function rejectAll(error: Error) {
  for (const [id, item] of pending) {
    if (item.timer) clearTimeout(item.timer);
    item.reject(error);
    pending.delete(id);
  }
}

function getWorker(): Worker {
  if (worker) return worker;
  if (typeof Worker === 'undefined') throw new Error('이 브라우저에서는 쿼리를 실행할 수 없습니다.');
  // sql.js(SQLite WASM)는 이 Worker 안에서만 불러온다. 첫 실행 전까지 내려받지 않는다.
  worker = new Worker(new URL('./sqlWorker.ts', import.meta.url), { type: 'module', name: 'gsmsv-sql' });
  worker.onmessage = (event: MessageEvent<SqlWorkerResponse>) => {
    const item = pending.get(event.data.id);
    if (!item) return;
    pending.delete(event.data.id);
    if (item.timer) clearTimeout(item.timer);
    item.resolve(event.data);
  };
  worker.onerror = event => {
    event.preventDefault();
    worker?.terminate();
    worker = null;
    rejectAll(new Error(event.message || 'SQL Worker를 시작하지 못했습니다.'));
  };
  return worker;
}

function send(request: DistributiveOmit<SqlWorkerRequest, 'id'>, timeoutMs: number | null): Promise<SqlWorkerResponse> {
  const target = getWorker();
  const id = nextId++;
  return new Promise<SqlWorkerResponse>((resolve, reject) => {
    const timer = timeoutMs === null ? null : setTimeout(() => {
      // Worker 안에서 도는 SQLite는 밖에서 끊을 수 없으므로 Worker째 멈춘다.
      target.terminate();
      if (worker === target) worker = null;
      rejectAll(new SqlTimeoutError());
    }, timeoutMs);
    pending.set(id, { resolve, reject, timer });
    target.postMessage({ ...request, id } as SqlWorkerRequest);
  }).then(response => {
    if (!response.ok) throw new Error(response.error);
    return response;
  });
}

const workerRunner: SqlRunner = {
  async create(seedSql) {
    const response = await send({ type: 'create', seedSql }, 30_000);
    if (response.ok && response.type === 'create') return response.bytes;
    throw new Error('UNEXPECTED_SQL_RESPONSE');
  },
  async run(bytes, sql, context) {
    const response = await send({ type: 'run', bytes, sql, context }, QUERY_TIMEOUT_MS);
    if (response.ok && response.type === 'run') return response.result;
    throw new Error('UNEXPECTED_SQL_RESPONSE');
  },
  async dump(bytes, header) {
    const response = await send({ type: 'dump', bytes, header }, QUERY_TIMEOUT_MS);
    if (response.ok && response.type === 'dump') return response.sql;
    throw new Error('UNEXPECTED_SQL_RESPONSE');
  },
};

let activeRunner: SqlRunner = workerRunner;

export function getSqlRunner(): SqlRunner {
  return activeRunner;
}

/** 테스트에서 Worker 대신 같은 엔진을 직접 돌린다. */
export function setSqlRunnerForTests(runner: SqlRunner | null) {
  activeRunner = runner ?? workerRunner;
}
