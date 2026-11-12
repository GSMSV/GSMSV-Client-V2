export interface AppPermissions {
  view: boolean;
  update: boolean;
  extend: boolean;
  delete: boolean;
  [permission: string]: boolean;
}

export interface AppOwner {
  type: 'user' | 'team';
  id: string;
  name: string;
}

export interface AppSummary {
  grn: string;
  id: string;
  name: string;
  owner: AppOwner;
  status: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  expires_at: string;
  permissions: AppPermissions;
}

export interface AppPage {
  items: AppSummary[];
  next_cursor: string | null;
}
