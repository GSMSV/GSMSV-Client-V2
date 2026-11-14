import { requestBlob, requestJson } from '../../../shared/api';
import { isDemoMode } from '../../../shared/demo';
import {
  demoCreateDomain,
  demoCreateFirewallRule,
  demoCreatePort,
  demoDeleteDomain,
  demoDeleteFirewallRule,
  demoDeletePort,
  demoDomainList,
  demoFirewallList,
  demoPortList,
  demoRestorePorts,
  demoSetFirewallEnabled,
  demoUpdateDomain,
} from '../model/demoNetworkStore';
import type {
  CreateDomainResponse,
  CreateFirewallRuleRequest,
  CreatePortForwardResponse,
  DomainList,
  FirewallRulePage,
  PortForwardList,
  RestoreDefaultsResponse,
  UpdateDomainResponse,
} from '../model/types';

const vmPath = (vmGrn: string) => `/api/v2/vms/${encodeURIComponent(vmGrn)}`;

export function listPortForwards(vmGrn: string, signal?: AbortSignal) {
  if (isDemoMode()) return Promise.resolve(demoPortList(vmGrn));
  return requestJson<PortForwardList>(`${vmPath(vmGrn)}/port-forwards`, { signal });
}

export function createPortForward(
  vmGrn: string,
  input: { internal_port: number; protocol: 'tcp' | 'udp'; allowed_source?: string; description?: string },
  signal?: AbortSignal,
) {
  if (isDemoMode()) return Promise.resolve(demoCreatePort(vmGrn, input));
  return requestJson<CreatePortForwardResponse>(`${vmPath(vmGrn)}/port-forwards`, {
    method: 'POST', body: JSON.stringify(input), signal,
  });
}

export async function deletePortForward(vmGrn: string, portId: string, signal?: AbortSignal) {
  if (isDemoMode()) {
    demoDeletePort(vmGrn, portId);
    return;
  }
  await requestBlob(`${vmPath(vmGrn)}/port-forwards/${encodeURIComponent(portId)}`, { method: 'DELETE', signal });
}

export function restoreDefaultPortForwards(vmGrn: string, signal?: AbortSignal) {
  if (isDemoMode()) return Promise.resolve(demoRestorePorts(vmGrn));
  return requestJson<RestoreDefaultsResponse>(`${vmPath(vmGrn)}/port-forwards/restore-defaults`, {
    method: 'POST', signal,
  });
}

export function listDomains(vmGrn: string, signal?: AbortSignal) {
  if (isDemoMode()) return Promise.resolve(demoDomainList(vmGrn));
  return requestJson<DomainList>(`${vmPath(vmGrn)}/domains`, { signal });
}

export function createDomain(vmGrn: string, input: { subdomain: string; internal_port: number }, signal?: AbortSignal) {
  if (isDemoMode()) return Promise.resolve(demoCreateDomain(vmGrn, input));
  return requestJson<CreateDomainResponse>(`${vmPath(vmGrn)}/domains`, {
    method: 'POST', body: JSON.stringify(input), signal,
  });
}

export function updateDomain(vmGrn: string, domainId: string, input: { subdomain?: string; internal_port?: number }, signal?: AbortSignal) {
  if (isDemoMode()) return Promise.resolve(demoUpdateDomain(vmGrn, domainId, input));
  return requestJson<UpdateDomainResponse>(`${vmPath(vmGrn)}/domains/${encodeURIComponent(domainId)}`, {
    method: 'PATCH', body: JSON.stringify(input), signal,
  });
}

export async function deleteDomain(vmGrn: string, domainId: string, signal?: AbortSignal) {
  if (isDemoMode()) {
    demoDeleteDomain(vmGrn, domainId);
    return;
  }
  await requestBlob(`${vmPath(vmGrn)}/domains/${encodeURIComponent(domainId)}`, { method: 'DELETE', signal });
}

export async function listFirewallRules(vmGrn: string, signal?: AbortSignal) {
  if (isDemoMode()) return demoFirewallList(vmGrn);
  const items: FirewallRulePage['items'] = [];
  const seen = new Set<string>();
  let cursor: string | null = null;
  let enabled = false;
  const pageSize = 100;
  let perVmLimit = 20;

  do {
    const query = new URLSearchParams({ limit: String(pageSize) });
    if (cursor) query.set('cursor', cursor);
    const page = await requestJson<FirewallRulePage>(`${vmPath(vmGrn)}/firewall-rules?${query}`, { signal });
    enabled = page.enabled;
    perVmLimit = page.limits.per_vm;
    items.push(...page.items);
    cursor = page.next_cursor;
    if (cursor && seen.has(cursor)) throw new Error('Firewall rule list returned a repeated cursor');
    if (cursor) seen.add(cursor);
  } while (cursor);

  return { enabled, items, limits: { per_vm: perVmLimit } };
}

export async function setFirewallEnabled(vmGrn: string, enabled: boolean) {
  if (!isDemoMode()) throw new Error('방화벽 켜기/끄기 API를 사용할 수 없습니다.');
  if (!demoSetFirewallEnabled(vmGrn, enabled)) throw new Error('방화벽 상태를 저장하지 못했습니다.');
}

export function createFirewallRule(vmGrn: string, input: CreateFirewallRuleRequest, signal?: AbortSignal) {
  if (isDemoMode()) return Promise.resolve(demoCreateFirewallRule(vmGrn, {
    action: input.action ?? 'accept',
    direction: input.direction ?? 'in',
    protocol: input.protocol ?? 'tcp',
    dport: input.dport ?? null,
    source: input.source ?? null,
  }));
  return requestJson<{ id: string }>(`${vmPath(vmGrn)}/firewall-rules`, {
    method: 'POST', body: JSON.stringify(input), signal,
  });
}

export async function deleteFirewallRule(vmGrn: string, ruleId: string, signal?: AbortSignal) {
  if (isDemoMode()) {
    demoDeleteFirewallRule(vmGrn, ruleId);
    return;
  }
  await requestBlob(`${vmPath(vmGrn)}/firewall-rules/${encodeURIComponent(ruleId)}`, { method: 'DELETE', signal });
}
