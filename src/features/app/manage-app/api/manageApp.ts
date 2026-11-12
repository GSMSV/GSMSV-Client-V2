import { requestJson } from '../../../../shared/api';

export interface AppPermissions {
  view: boolean;
  update: boolean;
  extend: boolean;
  delete: boolean;
  [permission: string]: boolean;
}

export interface AppDetail {
  grn: string;
  id: string;
  name: string;
  owner: { type: 'user' | 'team'; id: string; name: string };
  status: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  expires_at: string;
  permissions: AppPermissions;
  envs: Array<{ id: string; name: string }>;
  services: string[];
  domains: string[];
  deployments: string[];
}

export interface AppOperationResponse {
  operation: { id: string; status: string; stage: string | null };
  resource: AppDetail;
}

function appPath(appGrn: string) {
  return `/api/v2/apps/${encodeURIComponent(appGrn)}`;
}

export function getApp(appGrn: string, signal?: AbortSignal) {
  return requestJson<AppDetail>(appPath(appGrn), { signal });
}

export function updateApp(appGrn: string, name: string, signal?: AbortSignal) {
  return requestJson<AppDetail>(appPath(appGrn), {
    method: 'PATCH',
    body: JSON.stringify({ name }),
    signal,
  });
}

export function deleteApp(appGrn: string, name: string, signal?: AbortSignal) {
  return requestJson<AppOperationResponse>(appPath(appGrn), {
    method: 'DELETE',
    headers: { 'X-Confirm-Name': encodeURIComponent(name) },
    signal,
  });
}

export function extendApp(appGrn: string, signal?: AbortSignal) {
  return requestJson<AppDetail>(`${appPath(appGrn)}/extend`, {
    method: 'POST',
    signal,
  });
}
