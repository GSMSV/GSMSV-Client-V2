import { requestJson } from '../../../../shared/api';
import type { AppSummary } from '../../../../entities/app/model/types';

export interface AppEnvironment {
  id: string;
  name: string;
}

export interface AppDetail extends AppSummary {
  envs: AppEnvironment[];
  services: string[];
  domains: string[];
  deployments: string[];
}

export function getApp(appGrn: string, signal?: AbortSignal) {
  return requestJson<AppDetail>(`/api/v2/apps/${encodeURIComponent(appGrn)}`, { signal });
}
