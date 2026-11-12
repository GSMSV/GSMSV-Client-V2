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
