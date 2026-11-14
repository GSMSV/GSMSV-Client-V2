import { readDemoState, writeDemoState } from '../../../shared/demo';
import type { DomainList, FirewallRule, FirewallRulePage, NetworkProtocol, PortForward, PortForwardList } from './types';

export interface DemoNetworkState {
  ports: PortForward[];
  domains: DomainList['items'];
  rules: FirewallRule[];
  firewallEnabled: boolean;
  sequence: number;
}

const reservedSubdomains = new Set(['admin', 'api', 'www', 'status', 'app', 'mail', 'ftp', 'gsmsv']);

const stateKey = (vmGrn: string) => `network-${vmGrn}`;
const defaultHost = 'ssh.gsmsv.site';

function seed(vmGrn: string): DemoNetworkState {
  const team = vmGrn.includes('team-vm');
  const ssh = team ? 32117 : 32104;
  const hostname = vmGrn.replace(/^grn:gsmsv:vm:/, '').replace(/^(team-vm-|vm-)/, '').replace(/^team-/, '') || 'demo-vm';
  return {
    ports: [
      { id: `${vmGrn}-ssh`, kind: 'ssh', external_port: ssh, internal_port: 22, protocol: 'tcp', allowed_source: null, description: 'SSH 기본 포트' },
      { id: `${vmGrn}-http`, kind: 'http', external_port: ssh + 1, internal_port: 80, protocol: 'tcp', allowed_source: null, description: 'HTTP 기본 포트' },
      { id: `${vmGrn}-svc`, kind: 'svc', external_port: ssh + 2, internal_port: 8080, protocol: 'tcp', allowed_source: null, description: '서비스 기본 포트' },
    ],
    domains: [{ id: `${vmGrn}-domain`, subdomain: hostname, url: `https://${hostname}.gsmsv.site`, internal_port: 8080, sync_status: 'synced' }],
    rules: [
      { id: `${vmGrn}-rule-ssh`, action: 'accept', direction: 'in', protocol: 'tcp', dport: '22', source: null },
      { id: `${vmGrn}-rule-http`, action: 'accept', direction: 'in', protocol: 'tcp', dport: '80', source: null },
    ],
    firewallEnabled: true,
    sequence: 1,
  };
}

export function getDemoNetworkState(vmGrn: string): DemoNetworkState {
  const stored = readDemoState<DemoNetworkState | null>(stateKey(vmGrn), null);
  return stored && Array.isArray(stored.ports) && Array.isArray(stored.domains) && Array.isArray(stored.rules)
    ? stored
    : seed(vmGrn);
}

export function saveDemoNetworkState(vmGrn: string, state: DemoNetworkState): boolean {
  return writeDemoState(stateKey(vmGrn), state);
}

export function clearDemoNetworkState(vmGrn: string): boolean {
  return writeDemoState(stateKey(vmGrn), { ports: [], domains: [], rules: [], firewallEnabled: false, sequence: 1 });
}

export function demoPortList(vmGrn: string): PortForwardList {
  return { items: getDemoNetworkState(vmGrn).ports, public_host: defaultHost, limits: { custom: 30 } };
}

export function demoDomainList(vmGrn: string): DomainList {
  return { items: getDemoNetworkState(vmGrn).domains, limits: { per_vm: 2 } };
}

export function getDemoDomainValidationError(
  vmGrn: string,
  subdomain: string,
  internalPort: number,
  otherSubdomains: readonly string[] = [],
): string | null {
  if (!/^[a-z0-9-]{1,63}$/.test(subdomain)) return '서브도메인은 영문 소문자, 숫자, 하이픈으로 1~63자 입력해 주세요.';
  if (reservedSubdomains.has(subdomain.toLowerCase())) return '이 서브도메인은 예약되어 있어 사용할 수 없습니다.';

  const state = getDemoNetworkState(vmGrn);
  if (state.domains.length >= 2) return 'VM 하나에는 HTTPS Domain을 2개까지만 연결할 수 있습니다.';
  if ([...state.domains.map(domain => domain.subdomain), ...otherSubdomains]
    .some(existing => existing.toLowerCase() === subdomain.toLowerCase())) {
    return '이미 사용 중인 서브도메인입니다.';
  }
  if (!Number.isInteger(internalPort) || internalPort < 1 || internalPort > 65535) {
    return '내부 포트는 1부터 65535 사이의 숫자여야 합니다.';
  }
  if (!state.ports.some(port => port.kind !== 'ssh' && port.internal_port === internalPort)) {
    return '실행 중인 서비스의 내부 포트를 입력해 주세요.';
  }
  return null;
}

export function demoFirewallList(vmGrn: string): FirewallRulePage {
  const state = getDemoNetworkState(vmGrn);
  return { enabled: state.firewallEnabled, items: state.rules, limits: { per_vm: 20 }, next_cursor: null };
}

export function demoCreatePort(vmGrn: string, input: { internal_port: number; protocol: NetworkProtocol; allowed_source?: string; description?: string }) {
  const state = getDemoNetworkState(vmGrn);
  const externalPort = Math.max(32000, ...state.ports.map(port => port.external_port)) + 1;
  const id = `${vmGrn}-custom-${state.sequence}`;
  saveDemoNetworkState(vmGrn, {
    ...state,
    sequence: state.sequence + 1,
    ports: [...state.ports, { id, kind: 'custom', external_port: externalPort, internal_port: input.internal_port, protocol: input.protocol, allowed_source: input.allowed_source ?? null, description: input.description ?? null }],
  });
  return { id, external_port: externalPort, internal_port: input.internal_port, protocol: input.protocol, sync_status: 'synced' as const };
}

export function demoDeletePort(vmGrn: string, portId: string): void {
  const state = getDemoNetworkState(vmGrn);
  saveDemoNetworkState(vmGrn, { ...state, ports: state.ports.filter(port => port.id !== portId) });
}

export function demoRestorePorts(vmGrn: string) {
  const state = getDemoNetworkState(vmGrn);
  const presentKinds = new Set(state.ports.map(port => port.kind));
  const template = seed(vmGrn).ports;
  const missing = template.filter(port => !presentKinds.has(port.kind as PortForward['kind']));
  saveDemoNetworkState(vmGrn, { ...state, ports: [...state.ports, ...missing] });
  return { restored: missing.length, items: missing.map(({ id, kind, external_port }) => ({ id, kind: kind as 'ssh' | 'http' | 'svc', external_port })) };
}

export function demoCreateDomain(vmGrn: string, input: { subdomain: string; internal_port: number }) {
  const validationError = getDemoDomainValidationError(vmGrn, input.subdomain, input.internal_port);
  if (validationError) throw new Error(validationError);
  const state = getDemoNetworkState(vmGrn);
  const id = `${vmGrn}-domain-${state.sequence}`;
  const domain = { id, subdomain: input.subdomain, url: `https://${input.subdomain}.gsmsv.site`, internal_port: input.internal_port, sync_status: 'synced' as const };
  if (!saveDemoNetworkState(vmGrn, { ...state, sequence: state.sequence + 1, domains: [...state.domains, domain] })) {
    throw new Error('HTTPS Domain 정보를 저장하지 못했습니다.');
  }
  return { id, url: domain.url, sync_status: domain.sync_status };
}

export function demoUpdateDomain(vmGrn: string, domainId: string, input: { subdomain?: string; internal_port?: number }) {
  const state = getDemoNetworkState(vmGrn);
  const old = state.domains.find(domain => domain.id === domainId);
  if (!old) throw new Error('Domain을 찾을 수 없습니다.');
  const next = { ...old, ...(input.subdomain ? { subdomain: input.subdomain, url: `https://${input.subdomain}.gsmsv.site` } : {}), ...(input.internal_port ? { internal_port: input.internal_port } : {}) };
  saveDemoNetworkState(vmGrn, { ...state, domains: state.domains.map(domain => domain.id === domainId ? next : domain) });
  return { id: next.id, url: next.url, internal_port: next.internal_port, sync_status: next.sync_status };
}

export function demoDeleteDomain(vmGrn: string, domainId: string): void {
  const state = getDemoNetworkState(vmGrn);
  saveDemoNetworkState(vmGrn, { ...state, domains: state.domains.filter(domain => domain.id !== domainId) });
}

export function demoCreateFirewallRule(vmGrn: string, input: Omit<FirewallRule, 'id'>) {
  const state = getDemoNetworkState(vmGrn);
  const id = `${vmGrn}-rule-${state.sequence}`;
  saveDemoNetworkState(vmGrn, { ...state, sequence: state.sequence + 1, firewallEnabled: true, rules: [...state.rules, { ...input, id }] });
  return { id };
}

export function demoDeleteFirewallRule(vmGrn: string, ruleId: string): void {
  const state = getDemoNetworkState(vmGrn);
  saveDemoNetworkState(vmGrn, { ...state, rules: state.rules.filter(rule => rule.id !== ruleId) });
}

export function demoSetFirewallEnabled(vmGrn: string, enabled: boolean): boolean {
  const state = getDemoNetworkState(vmGrn);
  return saveDemoNetworkState(vmGrn, { ...state, firewallEnabled: enabled });
}
