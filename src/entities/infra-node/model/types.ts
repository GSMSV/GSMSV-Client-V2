export interface InfraAllocation {
  allocated: number;
  allocatable: number;
}

export interface InfraNode {
  node: string;
  online: boolean;
  usage: {
    cpu_percent: number;
    memory_used_gb: number;
    memory_total_gb: number;
    uptime_sec: number;
  };
  allocation: {
    vcpu: InfraAllocation;
    ram_gb: InfraAllocation;
    ssd_gb: InfraAllocation;
  };
  clone_queue_length: number;
}

export interface InfraNodeList {
  items: InfraNode[];
}

export interface AdminResource {
  grn: string;
  type: 'vm' | 'fn' | 'db' | 'app';
  name: string;
  node: string | null;
  vmid: number | null;
  owner_email: string;
  status: string;
  power_state: string | null;
}

export interface AdminResourcePage {
  items: AdminResource[];
  next_cursor: string | null;
}

export interface NodeVm {
  vmid: number;
  proxmox_name: string;
  classification: 'managed' | 'orphan' | 'unmanaged';
  grn: string | null;
}

export interface NodeVmList {
  items: NodeVm[];
}
