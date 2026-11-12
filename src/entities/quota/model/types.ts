export interface QuotaAmount {
  used: number;
  limit: number;
}

export interface DatabaseQuota {
  db: {
    count: QuotaAmount;
    shared_storage_gb: QuotaAmount;
  };
}
