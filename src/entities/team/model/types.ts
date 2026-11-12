export type TeamStatus = 'pending' | 'approved' | 'rejected';
export type TeamRole = 'leader' | 'devops' | 'member';

export interface TeamSummary {
  id: string;
  name: string;
  status: TeamStatus;
  my_role: TeamRole;
  member_count: number;
}

export interface TeamSummaryPage {
  items: TeamSummary[];
  next_cursor: string | null;
}

export interface TeamMember {
  member_id: string;
  name: string;
  email: string;
  role: TeamRole;
  profile_image_url: string | null;
}

export interface TeamQuotaUsage {
  used: number;
  limit: number;
}

export interface TeamQuota {
  vm: {
    vcpu: TeamQuotaUsage;
    ram_gb: TeamQuotaUsage;
    ssd_gb: TeamQuotaUsage;
  };
}

export interface TeamPermissions {
  invite_member: boolean;
  remove_member: boolean;
  grant_devops: boolean;
  transfer_leader: boolean;
  disband_team: boolean;
  leave_team: boolean;
  resubmit_team: boolean;
  [permission: string]: boolean;
}

export interface TeamDetail {
  id: string;
  name: string;
  status: TeamStatus;
  rejection_reason: string | null;
  my_role: TeamRole | null;
  members: TeamMember[];
  quota: TeamQuota | null;
  permissions: TeamPermissions;
}
