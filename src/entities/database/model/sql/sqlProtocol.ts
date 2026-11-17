import type { QueryBatchResult, QueryContext } from './sqlEngine';

export type SqlWorkerRequest =
  | { id: number; type: 'create'; seedSql?: string }
  | { id: number; type: 'run'; bytes: Uint8Array | null; sql: string; context: QueryContext }
  | { id: number; type: 'dump'; bytes: Uint8Array; header: string };

export type SqlWorkerResponse =
  | { id: number; ok: true; type: 'create'; bytes: Uint8Array }
  | { id: number; ok: true; type: 'run'; result: QueryBatchResult }
  | { id: number; ok: true; type: 'dump'; sql: string }
  | { id: number; ok: false; error: string };
