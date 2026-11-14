import { lazy, Suspense, useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import styled from 'styled-components';
import { getTeam, listMyTeams, type TeamRole, type TeamSummary } from '../../entities/team';
import { getSessionUser } from '../../entities/session';
import { Button, TextField } from '../../shared/ui/controls';
import { Banner, ErrorCard, LoadingCard } from '../../shared/ui/feedback';
import { Octicon } from '../../shared/ui/icons';
import { StudentShell, type StudentNavigationKey } from '../../widgets/student-shell';
import { cancelTeamInvitation, inviteTeamMember, listTeamInvitations, type TeamInvitation } from '../../features/team/manage-invitations';
import { ApiRequestError } from '../../shared/api';
import { TeamQuotaRequestDialog } from '../../features/team/request-quota';
import type { DemoTeamDetail } from '../../entities/team/demo';
import type { TeamMember } from '../../entities/team';
import { isDemoMode } from '../../shared/demo';

const TransferDemoTeamLeader = import.meta.env.DEV ? lazy(() => import('../../features/settings/demo-account/ui/DemoTeamWithdrawalActions').then(module => ({ default: module.TransferDemoTeamLeader }))) : null;
const DemoTeamDisbandRequest = import.meta.env.DEV ? lazy(() => import('../../features/settings/demo-account/ui/DemoTeamWithdrawalActions').then(module => ({ default: module.DemoTeamDisbandRequest }))) : null;
const LeaveDemoTeam = import.meta.env.DEV ? lazy(() => import('../../features/settings/demo-account/ui/DemoTeamWithdrawalActions').then(module => ({ default: module.LeaveDemoTeam }))) : null;
const DemoTeamMemberAction = import.meta.env.DEV ? lazy(() => import('../../features/settings/demo-account/ui/DemoTeamWithdrawalActions').then(module => ({ default: module.DemoTeamMemberAction }))) : null;

const Page = styled.div`
  box-sizing: border-box;
  display: flex;
  width: 100%;
  max-width: 1224px;
  flex-direction: column;
  gap: 24px;
  padding: 40px;
`;

const Breadcrumb = styled.p`
  width: 100%; margin: 0; color: ${({ theme }) => theme.colors.faint};
  font: 400 12px/18px ${({ theme }) => theme.typography.body.family}, sans-serif;
`;

const Heading = styled.header`
  display: flex; align-items: flex-end; justify-content: space-between; gap: 24px;
`;

const TitleBlock = styled.div`display: flex; min-width: 0; flex-direction: column; gap: 8px;`;
const Title = styled.h1`
  margin: 0; color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.h1.weight} ${({ theme }) => theme.typography.h1.size}px/${({ theme }) => theme.typography.h1.lineHeight}px ${({ theme }) => theme.typography.h1.family}, sans-serif;
`;
const Subtitle = styled.p`
  margin: 0; color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.body.weight} ${({ theme }) => theme.typography.body.size}px/${({ theme }) => theme.typography.body.lineHeight}px ${({ theme }) => theme.typography.body.family}, sans-serif;
`;
const RoleName = styled.strong`color: ${({ theme }) => theme.colors.primary}; font-weight: 500;`;

const Panel = styled.section`
  box-sizing: border-box; display: flex; min-width: 0; flex-direction: column; gap: 16px;
  padding: 24px; border-radius: ${({ theme }) => theme.radii.base}px; background: ${({ theme }) => theme.colors.surface};
`;
const PanelTitle = styled.h2`
  margin: 0; color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.title.weight} ${({ theme }) => theme.typography.title.size}px/${({ theme }) => theme.typography.title.lineHeight}px ${({ theme }) => theme.typography.title.family}, sans-serif;
`;
const Muted = styled.p`
  margin: 0; color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;
const MemberTable = styled.div`display: flex; flex-direction: column; width: 100%;`;
const TableHeader = styled.div`
  display: grid; grid-template-columns: minmax(220px, 1fr) minmax(160px, 1fr) minmax(140px, .7fr) minmax(160px, .8fr);
  gap: 12px; padding: 12px 16px; border-radius: ${({ theme }) => theme.radii.base}px; background: ${({ theme }) => theme.colors.raised};
  color: ${({ theme }) => theme.colors.faint}; font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;
const MemberRow = styled.div`
  display: grid; grid-template-columns: minmax(220px, 1fr) minmax(160px, 1fr) minmax(140px, .7fr) minmax(160px, .8fr);
  gap: 12px; align-items: center; min-height: 56px; padding: 8px 16px; border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.text}; font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;
const MemberIdentity = styled.div`display: flex; min-width: 0; align-items: center; gap: 8px;`;
const Avatar = styled.img`width: 28px; height: 28px; flex: 0 0 28px; border-radius: 50%; object-fit: cover;`;
const AvatarFallback = styled.span`
  display: inline-grid; width: 28px; height: 28px; flex: 0 0 28px; place-items: center; border-radius: 50%; background: ${({ theme }) => theme.colors.raised}; color: ${({ theme }) => theme.colors.muted};
`;
const MemberLabel = styled.span`overflow: hidden; text-overflow: ellipsis; white-space: nowrap;`;
const RoleText = styled.span<{ $leader?: boolean }>`color: ${({ theme, $leader }) => $leader ? theme.colors.primary : theme.colors.muted};`;
const RowActions = styled.div`display: flex; justify-content: flex-start; gap: 8px;`;
const TwoColumns = styled.div`display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 16px; width: 100%;`;
const InviteHeader = styled.div`display: flex; align-items: center; justify-content: space-between; gap: 12px;`;
const InviteForm = styled.form`display: flex; flex-direction: column; gap: 12px; width: 100%;`;
const Hint = styled.p`
  margin: 0; color: ${({ theme }) => theme.colors.muted}; white-space: pre-line;
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;
const InvitationList = styled.ul`display: flex; flex-direction: column; gap: 0; margin: 0; padding: 0; list-style: none;`;
const InvitationRow = styled.li`
  display: flex; min-width: 0; align-items: flex-start; gap: 12px; padding: 16px 0; border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  &:last-child { border-bottom: 0; }
`;
const InvitationCopy = styled.div`display: flex; min-width: 0; flex: 1; flex-direction: column; gap: 8px;`;
const InvitationEmail = styled.strong`
  overflow-wrap: anywhere; color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;
const InvitationMeta = styled.span`
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;
const InviteRowActions = styled.div`display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 4px;`;
const QuotaRows = styled.div`display: flex; flex-direction: column; gap: 16px;`;
const QuotaRow = styled.div`display: flex; flex-direction: column; gap: 8px;`;
const QuotaLabel = styled.div`display: flex; justify-content: space-between; gap: 16px; color: ${({ theme }) => theme.colors.muted}; font-size: 12px;`;
const Meter = styled.div`height: 8px; overflow: hidden; border-radius: ${({ theme }) => theme.radii.base}px; background: ${({ theme }) => theme.colors.field};`;
const MeterFill = styled.div<{ $percent: number; $warning: boolean }>`height: 100%; width: ${({ $percent }) => `${$percent}%`}; background: ${({ theme, $warning }) => $warning ? theme.colors.warning : theme.colors.primary};`;
const QuotaFooter = styled.div`display: flex; align-items: center; justify-content: space-between; gap: 16px;`;
const RoleCards = styled.div`display: flex; flex-direction: column; gap: 16px;`;
const RoleCard = styled.div`display: grid; grid-template-columns: 20px minmax(0, 1fr); gap: 16px; align-items: start;`;
const RoleIcon = styled.span`display: inline-flex; justify-content: center; color: ${({ theme }) => theme.colors.muted};`;
const RoleCopy = styled.div`display: flex; flex-direction: column; gap: 4px;`;
const RoleLabel = styled.strong`color: ${({ theme }) => theme.colors.faint}; font-size: 12px;`;
const RoleDescription = styled.span`color: ${({ theme }) => theme.colors.text}; font-size: 14px; line-height: 22px;`;
const DangerPanel = styled.section`
  display: flex; align-items: center; gap: 16px; padding: 16px; border-radius: ${({ theme }) => theme.radii.base}px; background: ${({ theme }) => theme.colors.dangerSoft};
`;
const DangerIcon = styled.span`display: inline-flex; flex: 0 0 20px; color: ${({ theme }) => theme.colors.danger};`;
const DangerCopy = styled.div`display: flex; min-width: 0; flex: 1; flex-direction: column; gap: 8px;`;
const DangerTitle = styled.strong`color: ${({ theme }) => theme.colors.danger}; font-size: 14px; line-height: 20px;`;
const DangerActions = styled.div`display: flex; gap: 8px;`;
const InlineError = styled.p`
  margin: 0; color: ${({ theme }) => theme.colors.danger};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const roleLabels: Record<TeamRole, string> = { leader: '팀장', devops: 'DevOps 엔지니어', member: '일반 팀원' };

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '날짜 확인 불가' : new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric' }).format(date);
}

function getQuotaLabel(value: { used: number; limit: number } | undefined) {
  if (!value || !Number.isFinite(value.used) || !Number.isFinite(value.limit)) return '할당량 정보 없음';
  return `${value.used} / ${value.limit}`;
}

function quotaPercent(value: { used: number; limit: number } | undefined) {
  return value && value.limit > 0 ? Math.min(100, Math.max(0, value.used / value.limit * 100)) : 0;
}

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiRequestError && error.status === 400 && error.code === 'VALIDATION_FAILED') {
    return '학교 이메일 주소를 확인해 주세요.';
  }
  const code = error instanceof Error ? error.message : '';
  if (code === 'ALREADY_MEMBER') return '이미 팀원인 계정입니다.';
  if (code === 'TEAM_NOT_APPROVED') return '거절된 팀은 초대를 보낼 수 없습니다.';
  if (code === 'ACCESS_DENIED') return '팀 초대 권한이 없습니다.';
  if (code === 'NETWORK_ERROR') return '네트워크 연결을 확인하고 다시 시도해 주세요.';
  return fallback;
}

export interface TeamSettingsPageProps { teamId?: string; }

export default function TeamSettingsPage({ teamId: routeTeamId }: TeamSettingsPageProps) {
  const navigate = useNavigate();
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [team, setTeam] = useState<DemoTeamDetail | null>(null);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [userName, setUserName] = useState('사용자');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [inviteLoadError, setInviteLoadError] = useState(false);
  const [email, setEmail] = useState('');
  const [formError, setFormError] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [successor, setSuccessor] = useState<TeamMember | null>(null);
  const [showDisband, setShowDisband] = useState(false);
  const [showQuotaRequest, setShowQuotaRequest] = useState(false);
  const [quotaRequestSent, setQuotaRequestSent] = useState(false);
  const [showLeave, setShowLeave] = useState(false);
  const [memberAction, setMemberAction] = useState<{ member: TeamMember; action: 'grant' | 'revoke' | 'remove' } | null>(null);
  const demoMode = import.meta.env.DEV && isDemoMode();
  const [confirmCancel, setConfirmCancel] = useState<TeamInvitation | null>(null);

  const selectedTeamId = routeTeamId ?? null;
  const scopeLabel = team ? `${team.name} · ${team.my_role ? roleLabels[team.my_role] : '관리자'}` : '팀 설정';
  const scopeOptions = useMemo(() => [
    { id: 'personal', label: '내 Resources', selected: false, onSelect: () => navigate('/') },
    ...teams.map(item => ({
      id: item.id,
      label: `${item.name} · ${roleLabels[item.my_role]}`,
      selected: item.id === selectedTeamId,
      onSelect: () => navigate(`/teams/${encodeURIComponent(item.id)}/settings`),
    })),
  ], [navigate, selectedTeamId, teams]);

  const load = useCallback(async (signal?: AbortSignal) => {
    if (!selectedTeamId) { setLoading(false); return; }
    setLoading(true); setError(false); setInviteLoadError(false);
    if (import.meta.env.DEV && isDemoMode()) {
      const demo = await import('../../entities/team/demo');
      const vmRepository = await import('../../entities/vm');
      if (signal?.aborted) return;
      const detail = demo.getDemoTeam(selectedTeamId);
      const myTeams = demo.listDemoTeams();
      if (!detail) { setError(true); setTeam(null); setLoading(false); return; }
      const vmQuota = vmRepository.getDemoVmQuota(vmRepository.getDemoVmState(), selectedTeamId);
      const syncedDetail = detail.quota ? { ...detail, quota: { vm: {
        vcpu: { used: vmQuota.cpu, limit: vmQuota.cpuLimit },
        ram_gb: { used: vmQuota.memory, limit: vmQuota.memoryLimit },
        ssd_gb: { used: vmQuota.disk, limit: vmQuota.diskLimit },
      } } } : detail;
      setTeam(syncedDetail); setTeams(myTeams);
      setInvitations(demo.listDemoTeamInvitations(selectedTeamId));
      setQuotaRequestSent(demo.listDemoTeamQuotaRequests(selectedTeamId).length > 0);
      setLoading(false);
      return;
    }
    try {
      const [detail, myTeams] = await Promise.all([getTeam(selectedTeamId, signal), listMyTeams(signal)]);
      if (signal?.aborted) return;
      setTeam(detail); setTeams(myTeams);
      if (detail.permissions.invite_member) {
        try {
          setInvitations(await listTeamInvitations(selectedTeamId, signal));
        } catch {
          if (signal?.aborted) return;
          setInviteLoadError(true); setInvitations([]);
        }
      } else setInvitations([]);
    } catch {
      if (signal?.aborted) return;
      setError(true); setTeam(null);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [selectedTeamId]);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load, refreshKey]);

  useEffect(() => {
    const user = getSessionUser();
    setUserName(user?.name ?? '사용자');
  }, []);

  const refresh = useCallback(() => setRefreshKey(value => value + 1), []);
  const canInvite = Boolean(team?.permissions.invite_member && team.status !== 'rejected');

  const handleInvite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setFormError('학교 이메일을 입력해 주세요.');
      return;
    }
    setBusyAction('invite'); setFormError(''); setInviteError('');
    try {
      if (import.meta.env.DEV && isDemoMode()) {
        const { inviteDemoTeamMember } = await import('../../entities/team/demo');
        inviteDemoTeamMember(selectedTeamId!, trimmed);
        setEmail('');
        refresh();
        return;
      }
      await inviteTeamMember(selectedTeamId!, trimmed);
      setEmail('');
      refresh();
    } catch (cause) {
      setInviteError(errorMessage(cause, '초대를 보내지 못했습니다. 잠시 후 다시 시도해 주세요.'));
    } finally { setBusyAction(null); }
  };

  const handleCancel = async () => {
    if (!confirmCancel || !selectedTeamId) return;
    setBusyAction(confirmCancel.id); setInviteError('');
    try {
      if (import.meta.env.DEV && isDemoMode()) {
        const { cancelDemoTeamInvitation } = await import('../../entities/team/demo');
        cancelDemoTeamInvitation(selectedTeamId, confirmCancel.id);
        setConfirmCancel(null);
        refresh();
        return;
      }
      await cancelTeamInvitation(selectedTeamId, confirmCancel.id);
      setConfirmCancel(null);
      refresh();
    } catch (cause) {
      setInviteError(errorMessage(cause, '초대를 취소하지 못했습니다. 목록을 새로고침해 주세요.'));
    } finally { setBusyAction(null); }
  };

  const handleResend = async (invitation: TeamInvitation) => {
    if (!selectedTeamId) return;
    setBusyAction(invitation.id); setInviteError('');
    try {
      if (import.meta.env.DEV && isDemoMode()) {
        const { inviteDemoTeamMember } = await import('../../entities/team/demo');
        inviteDemoTeamMember(selectedTeamId, invitation.email);
        refresh();
        return;
      }
      await inviteTeamMember(selectedTeamId, invitation.email);
      refresh();
    } catch (cause) {
      setInviteError(errorMessage(cause, '초대를 다시 보내지 못했습니다.'));
    } finally { setBusyAction(null); }
  };

  const submitQuotaRequest = async (tier: '소형' | '중형' | '대형', reason: string) => {
    if (!demoMode || !selectedTeamId) return false;
    const { createDemoTeamQuotaRequest } = await import('../../entities/team/demo');
    const request = createDemoTeamQuotaRequest(selectedTeamId, tier, reason);
    if (!request) return false;
    setQuotaRequestSent(true);
    setShowQuotaRequest(false);
    return true;
  };

  const navigateFromShell = (item: Exclude<StudentNavigationKey, 'none'>) => {
    if (item === 'home' || item === 'team') navigate(selectedTeamId ? `/teams/${encodeURIComponent(selectedTeamId)}` : '/teams');
    else if (item === 'database') navigate(selectedTeamId ? `/databases?owner=${encodeURIComponent(selectedTeamId)}` : '/databases');
    else if (item === 'apps') navigate(selectedTeamId ? `/teams/${encodeURIComponent(selectedTeamId)}/apps` : '/apps');
  };

  let content;
  if (loading) {
    content = <Page><Breadcrumb>{scopeLabel} / 팀 설정</Breadcrumb><Heading><TitleBlock><Title>팀 설정</Title><Subtitle>팀 설정을 불러오는 중입니다.</Subtitle></TitleBlock></Heading><LoadingCard height={260} /><LoadingCard height={210} /><LoadingCard height={180} /></Page>;
  } else if (error || !team || !selectedTeamId) {
    content = <Page><Breadcrumb>팀 / 설정</Breadcrumb><Heading><TitleBlock><Title>팀 설정</Title><Subtitle>팀 정보를 불러오지 못했습니다.</Subtitle></TitleBlock></Heading><ErrorCard onRetry={refresh} /><Button variant="secondary" onClick={() => navigate('/teams')}>팀 목록</Button></Page>;
  } else {
    const quota = team.quota?.vm;
    const inviteAllowed = canInvite;
    const permissionMessage = team.status === 'rejected'
      ? '거절된 팀은 초대할 수 없습니다.'
      : team.permissions.invite_member ? '팀장만 초대를 보낼 수 있습니다.' : '현재 계정에는 초대 권한이 없습니다.';

    content = (
      <Page>
        <Breadcrumb>{team.name} / 팀 설정</Breadcrumb>
        <Heading>
          <TitleBlock><Title>팀 설정</Title><Subtitle>{team.name} · 내 역할 <RoleName>{team.my_role ? roleLabels[team.my_role] : '관리자'}</RoleName></Subtitle></TitleBlock>
        </Heading>

        {team.status === 'pending' && <Banner title="팀 승인 대기 중" description="승인 전에는 팀 자원을 만들 수 없습니다. 초대 관리와 팀 설정을 계속 이용할 수 있습니다." tone="warning" icon={<Octicon name="clock" size={20} />} />}
        {team.status === 'rejected' && <Banner title="팀 승인이 거절되었습니다" description={team.rejection_reason ?? '거절 사유가 제공되지 않았습니다.'} tone="danger" icon={<Octicon name="alert" size={20} />} />}

        <Panel aria-labelledby="team-members-title">
          <PanelTitle id="team-members-title">팀원 · <RoleName>{team.members.length}명</RoleName></PanelTitle>
          <MemberTable>
            <TableHeader><span>이름</span><span>역할</span><span>합류일</span><span>관리</span></TableHeader>
            {team.members.map(member => (
              <MemberRow key={member.member_id}>
                <MemberIdentity>
                  {member.profile_image_url ? <Avatar src={member.profile_image_url} alt="" /> : <AvatarFallback aria-hidden="true"><Octicon name="person" size={16} /></AvatarFallback>}
                  <MemberLabel>{member.name}</MemberLabel>
                </MemberIdentity>
                <RoleText $leader={member.role === 'leader'}>{roleLabels[member.role]}</RoleText>
                <Muted>계약 정보 없음</Muted>
                <RowActions>
                  {demoMode && team.my_role === 'leader' && member.role !== 'leader' && !team.demoDisbandPending && <>
                    <Button variant="ghost" onClick={() => setMemberAction({ member, action: member.role === 'devops' ? 'revoke' : 'grant' })}>{member.role === 'devops' ? 'DevOps 회수' : 'DevOps 부여'}</Button>
                    <Button variant="ghost" onClick={() => setMemberAction({ member, action: 'remove' })}>팀에서 제외</Button>
                  </>}
                  {member.role !== 'leader' && !demoMode && <Button variant="ghost" disabled title="팀원 역할 변경·제외 API가 없습니다.">역할 변경</Button>}
                  {member.role === 'leader' && <Muted>팀장</Muted>}
                  {demoMode && team.my_role === 'leader' && member.role !== 'leader' && !team.demoDisbandPending &&
                    <Button variant="ghost" onClick={() => setSuccessor(member)}>팀장 넘기기</Button>}
                </RowActions>
              </MemberRow>
            ))}
          </MemberTable>
          <Muted>{demoMode ? '팀장은 DevOps 권한을 부여·회수하거나 팀원을 제외할 수 있습니다.' : '팀원 역할 변경·제외 API가 아직 공개 계약에 없어 관리 동작을 사용할 수 없습니다.'}</Muted>
        </Panel>

        <TwoColumns>
          <Panel aria-labelledby="invite-form-title">
            <InviteHeader><PanelTitle id="invite-form-title">팀원 초대</PanelTitle><Button type="submit" form="team-invite-form" variant="primary" icon={<Octicon name="plus" size={16} />} disabled={!inviteAllowed || busyAction === 'invite'}>{busyAction === 'invite' ? '보내는 중…' : '초대 보내기'}</Button></InviteHeader>
            <InviteForm id="team-invite-form" onSubmit={handleInvite}>
              <TextField label="학교 이메일" type="email" autoComplete="email" value={email} onChange={event => { setEmail(event.currentTarget.value); setFormError(''); }} placeholder="student@school.example" error={formError || undefined} disabled={!inviteAllowed || busyAction === 'invite'} />
              <Hint>초대할 학생의 학교 이메일 전체를 입력하세요. 가입 여부는 공개되지 않으며 학교 도메인은 서버가 확인합니다.</Hint>
              {!inviteAllowed && <Hint>{permissionMessage}</Hint>}
              {inviteError && <InlineError role="alert">{inviteError}</InlineError>}
            </InviteForm>
          </Panel>

          <Panel aria-labelledby="pending-invites-title">
            <InviteHeader><PanelTitle id="pending-invites-title">대기 중인 초대 · <RoleName>{invitations.length}</RoleName></PanelTitle><Button variant="ghost" icon={<Octicon name="sync" size={16} />} onClick={refresh} disabled={loading || inviteLoadError}>새로고침</Button></InviteHeader>
            {!team.permissions.invite_member ? <Muted>초대 목록은 팀장 권한으로만 확인할 수 있습니다.</Muted> : inviteLoadError ? <ErrorCard onRetry={refresh} size="compact" /> : invitations.length === 0 ? <Muted>보낸 초대가 없습니다.</Muted> : (
              <InvitationList>
                {invitations.map(invitation => (
                  <InvitationRow key={invitation.id}>
                    <RoleIcon aria-hidden="true"><Octicon name="clock" size={20} /></RoleIcon>
                    <InvitationCopy><InvitationEmail>{invitation.email}</InvitationEmail><InvitationMeta>{formatDate(invitation.expires_at)} 만료 · 보낸 날짜 {formatDate(invitation.sent_at)}</InvitationMeta></InvitationCopy>
                    <InviteRowActions>
                      <Button variant="ghost" icon={<Octicon name="sync" size={16} />} disabled={!inviteAllowed || busyAction === invitation.id} onClick={() => void handleResend(invitation)}>다시 보내기</Button>
                      {confirmCancel?.id === invitation.id ? <><Button variant="danger" disabled={busyAction === invitation.id} onClick={() => void handleCancel()}>{busyAction === invitation.id ? '취소 중…' : '취소 확인'}</Button><Button variant="ghost" onClick={() => setConfirmCancel(null)} disabled={busyAction === invitation.id}>닫기</Button></> : <Button variant="ghost" icon={<Octicon name="x" size={16} />} disabled={!inviteAllowed || busyAction === invitation.id} onClick={() => setConfirmCancel(invitation)}>초대 취소</Button>}
                    </InviteRowActions>
                  </InvitationRow>
                ))}
              </InvitationList>
            )}
            <Hint>다시 보내면 새 초대 링크와 7일 만료 기간이 적용되고, 이전 링크는 사용할 수 없습니다.</Hint>
          </Panel>
        </TwoColumns>

        <Panel aria-labelledby="team-quota-title">
          <PanelTitle id="team-quota-title">팀 할당량 · {team.status === 'approved' ? 'VM' : '승인 대기'}</PanelTitle>
          {!quota ? <Muted>팀이 승인되면 VM 할당량이 표시됩니다.</Muted> : <QuotaRows>
            {([['vCPU', quota.vcpu, ''], ['RAM', quota.ram_gb, ' GB'], ['SSD', quota.ssd_gb, ' GB']] as const).map(([label, usage, suffix]) => {
              const percent = quotaPercent(usage);
              const warning = percent >= 80;
              return <QuotaRow key={label}><QuotaLabel><span>{label}</span><span>{getQuotaLabel(usage)}{suffix}</span></QuotaLabel><Meter role="meter" aria-label={`${label} 할당량`} aria-valuemin={0} aria-valuemax={usage.limit} aria-valuenow={usage.used}><MeterFill $percent={percent} $warning={warning} /></Meter></QuotaRow>;
            })}
          </QuotaRows>}
          <QuotaFooter>
            <Muted role={quotaRequestSent ? 'status' : undefined}>{demoMode ? (quotaRequestSent ? '할당량 요청을 보냈습니다. 관리자가 승인하면 팀원 전원에게 알립니다.' : '팀 운영에 더 많은 자원이 필요하면 관리자에게 요청하세요.') : '할당량 요청 API가 아직 공개 계약에 없습니다.'}</Muted>
            <Button variant="secondary" disabled={!demoMode || team.status !== 'approved' || (team.my_role !== 'leader' && team.my_role !== 'devops') || quotaRequestSent}
              title={!demoMode ? '팀 할당량 요청 API가 없습니다.' : undefined}
              onClick={() => setShowQuotaRequest(true)} icon={<Octicon name="graph" size={16} />}>
              {quotaRequestSent ? '요청 검토 중' : '할당량 늘리기 요청'}
            </Button>
          </QuotaFooter>
        </Panel>

        <Panel aria-labelledby="role-descriptions-title">
          <PanelTitle id="role-descriptions-title">역할별 권한</PanelTitle>
          <RoleCards>
            <RoleCard><RoleIcon><Octicon name="shield" size={16} /></RoleIcon><RoleCopy><RoleLabel>팀장</RoleLabel><RoleDescription>{demoMode ? '팀원 초대·제외, DevOps 부여, 팀장 넘기기, 해체 요청과 DevOps의 모든 권한' : '초대 관리 및 팀 구성의 책임자입니다. 역할 변경·팀장 이전은 관련 API 계약이 없어 사용할 수 없습니다.'}</RoleDescription></RoleCopy></RoleCard>
            <RoleCard><RoleIcon><Octicon name="terminal" size={16} /></RoleIcon><RoleCopy><RoleLabel>DevOps 엔지니어</RoleLabel><RoleDescription>팀 VM과 인프라 설정 권한은 API가 확인된 기능에서만 적용됩니다.</RoleDescription></RoleCopy></RoleCard>
            <RoleCard><RoleIcon><Octicon name="person" size={16} /></RoleIcon><RoleCopy><RoleLabel>일반 팀원</RoleLabel><RoleDescription>팀 리소스 조회 권한은 서버에서 확인합니다.</RoleDescription></RoleCopy></RoleCard>
          </RoleCards>
        </Panel>

        <DangerPanel>
          <DangerIcon aria-hidden="true"><Octicon name="alert" size={20} /></DangerIcon>
          <DangerCopy><DangerTitle>위험 구역 · 팀 해체</DangerTitle><Muted>{demoMode
            ? '관리자가 승인하면 팀의 VM·Database·함수·앱이 모두 삭제되고 복구할 수 없습니다. 팀장은 다른 팀원에게 팀장을 넘긴 뒤 탈퇴할 수 있습니다.'
            : '팀 탈퇴와 해체 요청 API가 아직 공개 계약에 없어 이 기능은 사용할 수 없습니다.'}</Muted></DangerCopy>
          <DangerActions><Button variant="secondary" disabled={!demoMode || team.my_role === null || (team.my_role === 'leader' && team.members.length > 1)} title={team.my_role === 'leader' && team.members.length > 1 ? '팀장 권한을 넘긴 뒤 탈퇴할 수 있습니다.' : undefined} onClick={() => setShowLeave(true)}>팀 탈퇴</Button>{demoMode
            ? <Button variant="danger" disabled={team.my_role !== 'leader'} onClick={() => setShowDisband(true)}>{team.demoDisbandPending ? '요청 취소' : '해체 요청'}</Button>
            : <Button variant="danger" disabled title="팀 해체 API가 없습니다.">해체 요청</Button>}</DangerActions>
        </DangerPanel>
        {demoMode && successor && TransferDemoTeamLeader && <Suspense fallback={null}>
          <TransferDemoTeamLeader teamId={team.id} successor={successor} onDismiss={() => setSuccessor(null)}
            onSave={() => { setSuccessor(null); refresh(); }} />
        </Suspense>}
        {demoMode && showDisband && DemoTeamDisbandRequest && <Suspense fallback={null}>
          <DemoTeamDisbandRequest team={team} onDismiss={() => setShowDisband(false)}
            onSave={() => { setShowDisband(false); refresh(); }} />
        </Suspense>}
        {demoMode && showQuotaRequest && <TeamQuotaRequestDialog
          onDismiss={() => setShowQuotaRequest(false)} onSubmit={submitQuotaRequest} />}
        {demoMode && showLeave && LeaveDemoTeam && <Suspense fallback={null}>
          <LeaveDemoTeam team={team} onDismiss={() => setShowLeave(false)}
            onLeave={() => { setShowLeave(false); navigate('/teams'); }}
            onRequestDisband={() => { setShowLeave(false); setShowDisband(true); }} />
        </Suspense>}
        {demoMode && memberAction && DemoTeamMemberAction && <Suspense fallback={null}>
          <DemoTeamMemberAction teamId={team.id} member={memberAction.member} action={memberAction.action}
            onDismiss={() => setMemberAction(null)} onSave={() => { setMemberAction(null); refresh(); }} />
        </Suspense>}
      </Page>
    );
  }

  return (
    <StudentShell
      activeItem="team"
      scopeLabel={scopeLabel}
      scopeOptions={scopeOptions}
      userName={userName}
      onNavigate={navigateFromShell}
      onCreateTeam={() => navigate('/teams/new')}
      onOpenStatus={() => navigate('/status')}
      onSelectScope={() => undefined}
      onSearch={() => undefined}
      onOpenNotifications={() => undefined}
      hasUnsavedInput={Boolean(email)}
    >
      {content}
    </StudentShell>
  );
}
