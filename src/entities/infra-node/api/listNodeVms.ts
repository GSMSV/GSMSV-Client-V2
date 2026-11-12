import { requestJson } from '../../../shared/api';
import type { NodeVmList } from '../model/types';

export async function listNodeVms(node: string, signal?: AbortSignal) {
  const response = await requestJson<NodeVmList>(`/api/v2/admin/infra/nodes/${encodeURIComponent(node)}/vms`, { signal });
  return response.items;
}
