export type DatabaseEngine = 'mysql' | 'postgresql';
export type DatabaseIsolation = 'shared' | 'dedicated';
export type DatabaseStatus = 'creating' | 'active' | 'suspended' | 'deleting' | 'failed';

export interface DatabaseSummary {
  grn: string;
  name: string;
  engine: DatabaseEngine;
  isolation: DatabaseIsolation;
  status: DatabaseStatus;
  write_locked: boolean;
  storage: {
    used_gb: number;
  };
  expires_at: string;
}

export interface DatabaseSummaryPage {
  items: DatabaseSummary[];
  next_cursor: string | null;
}

export interface DatabaseDetail {
  grn: string;
  id: string;
  name: string;
  owner: { type: 'user' | 'team'; id: string; name: string };
  engine: DatabaseEngine;
  isolation: DatabaseIsolation;
  status: DatabaseStatus;
  write_locked: boolean;
  connection: { host: string; port: number; database: string; username: string; tls: boolean };
  storage: { used_gb: number; owner_total_used_gb: number; owner_limit_gb: number };
  max_connections: number;
  created_by: { name: string };
  created_at: string;
  updated_at: string;
  expires_at: string;
  permissions: Record<string, boolean>;
}

export interface DatabaseCredentials {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  jdbc_url: string;
}

export interface DatabaseBackup {
  id: string;
  kind: 'daily' | 'pre_restore';
  created_at: string;
  size_mb: number;
  expires_at: string;
}

export interface DatabasePasswordRotation {
  password: string;
  rotated_at: string;
  reconnected: { functions: number; app_cells: number };
}

export interface DatabaseOperation {
  operation: { id: string; type: string; status: string };
  resource: { grn: string; status: DatabaseStatus };
}
