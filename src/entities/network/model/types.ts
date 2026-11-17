export type NetworkProtocol = 'tcp' | 'udp';
export type FirewallProtocol = NetworkProtocol | 'icmp';
export type FirewallAction = 'accept' | 'drop' | 'reject';
export type FirewallDirection = 'in' | 'out';
export type NetworkSyncStatus = 'pending' | 'synced' | 'failed';

export interface PortForward {
  id: string;
  kind: 'ssh' | 'http' | 'svc' | 'custom';
  external_port: number;
  internal_port: number;
  protocol: NetworkProtocol;
  allowed_source: string | null;
  description: string | null;
}

export interface PortForwardList {
  items: PortForward[];
  public_host: string;
  limits: { custom: number };
}

export interface CreatePortForwardResponse {
  id: string;
  external_port: number;
  internal_port: number;
  protocol: NetworkProtocol;
  sync_status: NetworkSyncStatus;
}

export interface RestoreDefaultsResponse {
  restored: number;
  items: Array<{ id: string; kind: 'ssh' | 'http' | 'svc'; external_port: number }>;
}

export interface Domain {
  id: string;
  subdomain: string;
  url: string;
  internal_port: number;
  sync_status: NetworkSyncStatus;
}

export interface DomainList {
  items: Domain[];
  limits: { per_vm: number };
}

export interface CreateDomainResponse {
  id: string;
  url: string;
  sync_status: NetworkSyncStatus;
}

export interface UpdateDomainResponse {
  id: string;
  url: string;
  internal_port: number;
  sync_status: NetworkSyncStatus;
}

export interface FirewallRule {
  id: string;
  action: FirewallAction;
  direction: FirewallDirection;
  protocol: FirewallProtocol;
  dport: string | null;
  source: string | null;
}

export interface FirewallRulePage {
  enabled: boolean;
  items: FirewallRule[];
  limits: { per_vm: number };
  next_cursor: string | null;
}

export interface CreateFirewallRuleRequest {
  action?: FirewallAction;
  direction?: FirewallDirection;
  protocol?: FirewallProtocol;
  dport?: string;
  source?: string;
}
