export interface QuotaAmount {
  used: number;
  limit: number;
}

export interface VmQuotaAmount {
  used: number;
  limit: number | null;
}

export interface MaxCreatableVm {
  vcpu: number | null;
  ram_gb: number | null;
  ssd_gb: number | null;
}

export interface MyQuota {
  vm: {
    vcpu: VmQuotaAmount;
    ram_gb: VmQuotaAmount;
    ssd_gb: VmQuotaAmount;
    max_creatable: MaxCreatableVm;
  };
  db: {
    count: QuotaAmount;
    shared_storage_gb: QuotaAmount;
  };
  fn: {
    count: QuotaAmount;
    daily_executions: QuotaAmount;
  };
  app: {
    count: QuotaAmount;
    memory_mb: QuotaAmount;
    always_on: QuotaAmount;
  };
}

export type DatabaseQuota = Pick<MyQuota, 'db'>;
