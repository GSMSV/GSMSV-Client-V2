import { requestJson } from '../../../shared/api';
import type { InfraNodeList } from '../model/types';

export async function listInfraNodes(signal?: AbortSignal) {
  const response = await requestJson<InfraNodeList>('/api/v2/admin/infra/nodes', { signal });
  return response.items;
}
