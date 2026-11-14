import type { TeamDetail, TeamSummary } from './model/types';
import { isDemoMode, readDemoState, writeDemoState } from '../../shared/demo';

export interface DemoTeamInvitation {
  id: string;
  email: string;
  sent_at: string;
  expires_at: string;
  token?: string;
  teamId?: string;
}

interface DemoTeamState {
  teams: TeamDetail[];
  invitations: DemoTeamInvitation[];
  nextTeamNumber: number;
}

const seedState: DemoTeamState = {
  teams: [{
    id: 'demo-team',
    name: 'GSM Connect',
    status: 'approved',
    rejection_reason: null,
    my_role: 'leader',
    members: [
      { member_id: 'demo-student', name: '김민수', email: 'minsu@example.com', role: 'leader', profile_image_url: null },
      { member_id: 'demo-member-1', name: '이지은', email: 'jieun@example.com', role: 'devops', profile_image_url: null },
      { member_id: 'demo-member-2', name: '박서준', email: 'seojun@example.com', role: 'member', profile_image_url: null },
      { member_id: 'demo-member-3', name: '최하은', email: 'haeun@example.com', role: 'member', profile_image_url: null },
    ],
    quota: { vm: { vcpu: { used: 2, limit: 4 }, ram_gb: { used: 4, limit: 8 }, ssd_gb: { used: 20, limit: 60 } } },
    permissions: { invite_member: true, remove_member: true, grant_devops: true, transfer_leader: true, disband_team: true, leave_team: true, resubmit_team: false },
  }],
  invitations: [{ id: 'demo-invite-token', token: 'demo-invite-token', teamId: 'demo-team', email: 'student@example.com', sent_at: '2026-11-12T09:00:00.000Z', expires_at: '2026-11-19T09:00:00.000Z' }],
  nextTeamNumber: 1,
};

function getState(): DemoTeamState {
  const state = readDemoState<unknown>('teams', seedState);
  if (!state || typeof state !== 'object') return seedState;
  const candidate = state as Partial<DemoTeamState>;
  return Array.isArray(candidate.teams) && Array.isArray(candidate.invitations) && Number.isInteger(candidate.nextTeamNumber)
    ? candidate as DemoTeamState
    : seedState;
}

function saveState(state: DemoTeamState) {
  return isDemoMode() && writeDemoState('teams', state);
}

function summary(team: TeamDetail): TeamSummary {
  return { id: team.id, name: team.name, status: team.status, my_role: team.my_role ?? 'member', member_count: team.members.length };
}

export function listDemoTeams(): TeamSummary[] {
  return isDemoMode() ? getState().teams.map(summary) : [];
}

export function getDemoTeam(teamId: string): TeamDetail | undefined {
  return isDemoMode() ? getState().teams.find(team => team.id === teamId) : undefined;
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
