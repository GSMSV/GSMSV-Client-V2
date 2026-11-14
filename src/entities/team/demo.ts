import type { TeamDetail, TeamSummary } from './model/types';
import { getSessionUser } from '../session';
import { isDemoMode, readDemoState, writeDemoState } from '../../shared/demo';

export interface DemoTeamInvitation {
  id: string;
  email: string;
  sent_at: string;
  expires_at: string;
  token?: string;
  teamId?: string;
}

export interface DemoTeamDetail extends TeamDetail {
  demoDisbandPending?: boolean;
}

interface DemoTeamState {
  schemaVersion?: number;
  teams: DemoTeamDetail[];
  invitations: DemoTeamInvitation[];
  nextTeamNumber: number;
}

const seedState: DemoTeamState = {
  schemaVersion: 1,
  teams: [{
    id: 'demo-team',
    name: 'GSM Connect',
    status: 'approved',
    rejection_reason: null,
    my_role: 'leader',
    members: [
      { member_id: 'demo-student', name: '김지민', email: 'jimin@example.com', role: 'leader', profile_image_url: null },
      { member_id: 'demo-member-1', name: '한도윤', email: 'doyoon@example.com', role: 'devops', profile_image_url: null },
      { member_id: 'demo-member-2', name: '윤채원', email: 'chaewon@example.com', role: 'member', profile_image_url: null },
    ],
    quota: { vm: { vcpu: { used: 4, limit: 4 }, ram_gb: { used: 6, limit: 8 }, ssd_gb: { used: 50, limit: 60 } } },
    permissions: { invite_member: true, remove_member: true, grant_devops: true, transfer_leader: true, disband_team: true, leave_team: true, resubmit_team: false },
  }],
  invitations: [{ id: 'demo-invite-token', token: 'demo-invite-token', teamId: 'demo-team', email: 'student@example.com', sent_at: '2026-11-12T09:00:00.000Z', expires_at: '2026-11-19T09:00:00.000Z' }],
  nextTeamNumber: 1,
};

function getState(): DemoTeamState {
  const state = readDemoState<unknown>('teams', seedState);
  if (!state || typeof state !== 'object') return seedState;
  const candidate = state as Partial<DemoTeamState>;
  if (!Array.isArray(candidate.teams) || !Array.isArray(candidate.invitations) || !Number.isInteger(candidate.nextTeamNumber)) return seedState;
  if ((candidate.schemaVersion ?? 0) >= 1) return candidate as DemoTeamState;

  const previousSeedMembers = [
    { member_id: 'demo-student', name: '김민수', email: 'minsu@example.com', role: 'leader' },
    { member_id: 'demo-member-1', name: '이지은', email: 'jieun@example.com', role: 'devops' },
    { member_id: 'demo-member-2', name: '박서준', email: 'seojun@example.com', role: 'member' },
    { member_id: 'demo-member-3', name: '최하은', email: 'haeun@example.com', role: 'member' },
  ];
  const existingInvitations = candidate.invitations as DemoTeamInvitation[];
  let changed = false;
  const teams = candidate.teams.map(team => {
    const id = team.id === 'gsm-connect' ? 'demo-team' : team.id;
    if (id !== team.id) changed = true;
    if (id !== 'demo-team') return id === team.id ? team : { ...team, id };

    const membersAreSeedOnly = team.members.length === previousSeedMembers.length && team.members.every(member => {
      const previous = previousSeedMembers.find(candidate => candidate.member_id === member.member_id);
      return Boolean(previous && previous.name === member.name && previous.email === member.email && previous.role === member.role);
    });
    const desiredMembers = seedState.teams[0].members;
    const membersMatchFigma = team.members.length === desiredMembers.length && team.members.every(member => {
      const desired = desiredMembers.find(candidate => candidate.member_id === member.member_id);
      return Boolean(desired && desired.name === member.name && desired.email === member.email && desired.role === member.role);
    });
    const members = membersAreSeedOnly && !membersMatchFigma ? desiredMembers : team.members;
    const oldSeedQuota = team.quota?.vm?.vcpu.used === 2 && team.quota.vm.vcpu.limit === 4
      && team.quota.vm.ram_gb.used === 4 && team.quota.vm.ram_gb.limit === 8
      && team.quota.vm.ssd_gb.used === 20 && team.quota.vm.ssd_gb.limit === 60;
    const quota = oldSeedQuota ? seedState.teams[0].quota : team.quota;
    if (members !== team.members || quota !== team.quota) changed = true;
    return { ...team, id, members, quota };
  });
  const invitations = existingInvitations.map(invitation => invitation.teamId === 'gsm-connect'
    ? { ...invitation, teamId: 'demo-team' }
    : invitation);
  if (invitations.some((invitation, index) => invitation !== existingInvitations[index])) changed = true;
  const nextState = { ...candidate, schemaVersion: 1, teams, invitations } as DemoTeamState;
  if (changed || (candidate.schemaVersion ?? 0) < 1) saveState(nextState);
  return nextState;
}

function saveState(state: DemoTeamState) {
  return isDemoMode() && writeDemoState('teams', state);
}

function summary(team: TeamDetail): TeamSummary {
  return { id: team.id, name: team.name, status: team.status, my_role: team.my_role ?? 'member', member_count: team.members.length };
}

export function listDemoTeams(): TeamSummary[] {
  return isDemoMode() ? getState().teams.filter(team => team.my_role !== null).map(summary) : [];
}

function resolveDemoTeamId(teamId: string) {
  return teamId === 'gsm-connect' ? 'demo-team' : teamId;
}

export function getDemoTeam(teamId: string): DemoTeamDetail | undefined {
  if (!isDemoMode()) return undefined;
  const resolvedTeamId = resolveDemoTeamId(teamId);
  const team = getState().teams.find(item => item.id === resolvedTeamId);
  // A former member must not regain access through a stale direct URL. Admin
  // workflows still need to inspect teams for approved disband requests.
  if (team?.my_role === null && getSessionUser()?.role !== 'admin') return undefined;
  return team;
}

export function createDemoTeam(name: string): TeamSummary {
  const state = getState();
  const number = state.nextTeamNumber;
  const team: TeamDetail = {
    id: `demo-team-${number}`,
    name,
    status: 'pending',
    rejection_reason: null,
    my_role: 'leader',
    members: [{ member_id: 'demo-student', name: '김민수', email: 'minsu@example.com', role: 'leader', profile_image_url: null }],
    quota: { vm: { vcpu: { used: 0, limit: 4 }, ram_gb: { used: 0, limit: 8 }, ssd_gb: { used: 0, limit: 60 } } },
    permissions: { invite_member: true, remove_member: true, grant_devops: true, transfer_leader: true, disband_team: true, leave_team: true, resubmit_team: true },
  };
  saveState({ ...state, teams: [...state.teams, team], nextTeamNumber: number + 1 });
  return summary(team);
}

export function listDemoTeamInvitations(teamId: string): DemoTeamInvitation[] {
  return isDemoMode() && getDemoTeam(teamId)?.permissions.invite_member
    ? getState().invitations.filter(invitation => invitation.teamId === teamId)
    : [];
}

export function inviteDemoTeamMember(teamId: string, email: string) {
  const state = getState();
  const team = state.teams.find(item => item.id === teamId);
  if (!isDemoMode() || !team?.permissions.invite_member || team.status === 'rejected') throw new Error('ACCESS_DENIED');
  const now = new Date().toISOString();
  const existing = state.invitations.find(invitation => invitation.teamId === teamId && invitation.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    const resent = { ...existing, sent_at: now, expires_at: new Date(Date.now() + 7 * 86_400_000).toISOString() };
    saveState({ ...state, invitations: state.invitations.map(invitation => invitation.id === existing.id ? resent : invitation) });
    return resent;
  }
  const id = crypto.randomUUID();
  const invitation = { id, token: id, teamId, email, sent_at: now, expires_at: new Date(Date.now() + 7 * 86_400_000).toISOString() };
  saveState({ ...state, invitations: [...state.invitations, invitation] });
  return invitation;
}

export function cancelDemoTeamInvitation(teamId: string, invitationId: string) {
  const state = getState();
  if (!isDemoMode() || !state.teams.some(team => team.id === teamId && team.permissions.invite_member)) return;
  saveState({ ...state, invitations: state.invitations.filter(invitation => !(invitation.teamId === teamId && invitation.id === invitationId)) });
}

export function acceptDemoTeamInvitation(token: string) {
  const state = getState();
  const invitation = state.invitations.find(item => item.id === token || item.token === token);
  const team = invitation ? state.teams.find(item => item.id === invitation.teamId) : undefined;
  if (!isDemoMode() || !invitation || !team) throw new Error('GONE');
  const updatedTeam = {
    ...team,
    members: [...team.members, { member_id: `demo-member-${crypto.randomUUID()}`, name: '데모 학생', email: invitation.email, role: 'member' as const, profile_image_url: null }],
  };
  saveState({ ...state, teams: state.teams.map(item => item.id === team.id ? updatedTeam : item), invitations: state.invitations.filter(item => item.id !== invitation.id) });
  return { team: { id: team.id, name: team.name }, my_role: 'member' as const };
}

export function transferDemoTeamLeadership(teamId: string, successorId: string): boolean {
  const state = getState();
  const id = resolveDemoTeamId(teamId);
  const team = state.teams.find(item => item.id === id);
  if (team?.my_role !== 'leader' || !team.permissions.transfer_leader || team.demoDisbandPending ||
      !team.members.some(member => member.member_id === successorId && member.role !== 'leader')) return false;

  const next: DemoTeamDetail = {
    ...team,
    my_role: 'member',
    members: team.members.map(member => ({
      ...member,
      role: member.member_id === successorId ? 'leader' : member.role === 'leader' ? 'member' : member.role,
    })),
    permissions: { ...team.permissions, invite_member: false, remove_member: false, grant_devops: false, transfer_leader: false, disband_team: false },
  };
  return saveState({ ...state, teams: state.teams.map(item => item.id === id ? next : item) });
}

export function leaveDemoTeam(teamId: string): boolean {
  const state = getState();
  const id = resolveDemoTeamId(teamId);
  const team = state.teams.find(item => item.id === id);
  if (!isDemoMode() || !team || team.my_role === 'leader' || team.my_role === null || team.demoDisbandPending || team.members.length <= 1) return false;
  const next: DemoTeamDetail = {
    ...team,
    my_role: null,
    members: team.members.filter(member => member.member_id !== 'demo-student'),
    permissions: { invite_member: false, remove_member: false, grant_devops: false, transfer_leader: false, disband_team: false, leave_team: false, resubmit_team: false },
  };
  return saveState({ ...state, teams: state.teams.map(item => item.id === id ? next : item) });
}

export function updateDemoTeamMemberRole(teamId: string, memberId: string, role: 'member' | 'devops'): boolean {
  const state = getState();
  const id = resolveDemoTeamId(teamId);
  const team = state.teams.find(item => item.id === id);
  if (!isDemoMode() || team?.my_role !== 'leader' || !team.permissions.grant_devops || team.demoDisbandPending ||
      !team.members.some(member => member.member_id === memberId && member.role !== 'leader')) return false;
  return saveState({ ...state, teams: state.teams.map(item => item.id === id ? {
    ...item,
    members: item.members.map(member => member.member_id === memberId ? { ...member, role } : member),
  } : item) });
}

export function removeDemoTeamMember(teamId: string, memberId: string): boolean {
  const state = getState();
  const id = resolveDemoTeamId(teamId);
  const team = state.teams.find(item => item.id === id);
  if (!isDemoMode() || team?.my_role !== 'leader' || !team.permissions.remove_member || team.demoDisbandPending ||
      !team.members.some(member => member.member_id === memberId && member.role !== 'leader')) return false;
  return saveState({ ...state, teams: state.teams.map(item => item.id === id ? {
    ...item,
    members: item.members.filter(member => member.member_id !== memberId),
  } : item) });
}

export function listDemoDisbandRequests(): DemoTeamDetail[] {
  return isDemoMode() ? getState().teams.filter(team => team.demoDisbandPending) : [];
}

export function setDemoDisbandRequest(teamId: string, pending: boolean): boolean {
  const state = getState();
  const id = resolveDemoTeamId(teamId);
  if (!state.teams.some(team => team.id === id && team.my_role === 'leader' && team.permissions.disband_team)) return false;
  return saveState({ ...state, teams: state.teams.map(team => team.id === id ? { ...team, demoDisbandPending: pending } : team) });
}

export function approveDemoDisbandRequest(teamId: string): boolean {
  const state = getState();
  if (getSessionUser()?.role !== 'admin' || !state.teams.some(team => team.id === teamId && team.demoDisbandPending)) return false;
  return saveState({
    ...state,
    teams: state.teams.filter(team => team.id !== teamId),
    invitations: state.invitations.filter(invitation => invitation.teamId !== teamId),
  });
}

export function leaveDemoTeamsForWithdrawal(): boolean {
  const state = getState();
  if (state.teams.some(team => team.my_role !== null && team.members.length <= 1)) return false;

  const teams = state.teams.map(team => {
    if (team.my_role === null) return team;
    const members = team.members.filter(member => member.member_id !== 'demo-student');
    if (team.my_role === 'leader' && members.length) {
      const successor = members.find(member => member.role === 'devops') ?? members[0];
      return {
        ...team,
        my_role: null,
        permissions: { invite_member: false, remove_member: false, grant_devops: false, transfer_leader: false, disband_team: false, leave_team: false, resubmit_team: false },
        members: members.map(member => member.member_id === successor.member_id ? { ...member, role: 'leader' as const } : member),
      };
    }
    return { ...team, my_role: null, members, permissions: { invite_member: false, remove_member: false, grant_devops: false, transfer_leader: false, disband_team: false, leave_team: false, resubmit_team: false } };
  });

  return saveState({ ...state, teams });
}
