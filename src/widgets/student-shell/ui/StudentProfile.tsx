import { useEffect, useId, useRef, useState, type FocusEvent, type KeyboardEvent } from 'react';
import { useLocation, useNavigate } from 'react-router';
import styled from 'styled-components';
import { clearSessionUser, getSessionUser } from '../../../entities/session';
import { listMyTeams, type TeamRole, type TeamSummary } from '../../../entities/team';
import { logout } from '../../../features/auth/logout/api/logout';
import { Button } from '../../../shared/ui/controls';
import { Octicon } from '../../../shared/ui/icons';

const Profile = styled.div`
  position: relative;
`;

const Panel = styled.aside`
  position: absolute;
  z-index: 40;
  top: calc(100% + 8px);
  right: 0;
  display: flex;
  width: min(480px, calc(100vw - 32px));
  max-height: calc(100vh - 82px);
  flex-direction: column;
  gap: ${({ theme }) => theme.space[16]}px;
  overflow-y: auto;
  padding: ${({ theme }) => theme.space[24]}px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};

  &:focus { outline: none; }
`;

const Row = styled.div`
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 12px;
  overflow-wrap: anywhere;

  > svg {
    flex: 0 0 auto;
  }
`;

const Heading = styled(Row)`
  > svg {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const Title = styled.h2`
  margin: 0;
  font: ${({ theme }) => theme.typography.h2.weight} ${({ theme }) => theme.typography.h2.size}px/${({ theme }) => theme.typography.h2.lineHeight}px ${({ theme }) => theme.typography.h2.family}, sans-serif;
`;

const Copy = styled.p`
  flex: 0 0 auto;
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

const Detail = styled.div`
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 2px;
`;

const Label = styled(Copy)`
  color: ${({ theme }) => theme.colors.text};
`;

const Caption = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.faint};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const ErrorText = styled(Caption)`
  color: ${({ theme }) => theme.colors.danger};
`;

const Actions = styled.div`
  display: flex;
  flex: 0 0 auto;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.space[8]}px;
`;

const Action = styled(Button)<{ $minWidth: number }>`
  min-width: ${({ $minWidth }) => $minWidth}px;
`;

const teamRoleLabel: Record<TeamRole, string> = {
  leader: '팀장',
  devops: 'DevOps',
  member: '팀원',
};

type TeamsState =
  | { status: 'loading' | 'error' }
  | { status: 'ready'; teams: TeamSummary[] };

interface StudentProfileProps {
  userName: string;
  activeTeamId?: string;
  hasUnsavedInput: boolean;
  onOpen: () => void;
  onLogoutPendingChange?: (pending: boolean) => void;
}

export function StudentProfile({ userName, activeTeamId, hasUnsavedInput, onOpen, onLogoutPendingChange }: StudentProfileProps) {
  const navigate = useNavigate();
  const { key: locationKey, pathname } = useLocation();
  const panelId = useId();
  const profileRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const [teamsState, setTeamsState] = useState<TeamsState>({ status: 'loading' });
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [locationKey]);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    void listMyTeams(controller.signal).then(teams => {
      if (!controller.signal.aborted) setTeamsState({ status: 'ready', teams });
    }).catch(() => {
      if (!controller.signal.aborted) setTeamsState({ status: 'error' });
    });

    const dismissOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !profileRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', dismissOutside);
    panelRef.current?.focus();
    return () => {
      controller.abort();
      document.removeEventListener('pointerdown', dismissOutside);
    };
  }, [open]);

  const user = getSessionUser();
  const isAdmin = user?.role === 'admin';
  const roleLabel = isAdmin ? '관리자' : user ? '일반 사용자' : '역할 확인 불가';
  const teams = teamsState.status === 'ready' ? teamsState.teams : [];
  const activeTeam = teams.find(team => team.id === activeTeamId);
  const settingsTeamId = activeTeamId ?? (teams.length === 1 ? teams[0].id : undefined);
  const teamSettingsPath = settingsTeamId
    ? `/teams/${encodeURIComponent(settingsTeamId)}/settings`
    : teams.length > 1 ? '/teams' : null;
  const visibleTeams = activeTeam ? [activeTeam] : teams;
  const teamStatusLabel = teamsState.status === 'loading' ? '소속 팀을 불러오는 중입니다.'
    : teamsState.status === 'error' ? '소속 팀을 불러오지 못했습니다.'
      : '소속된 팀이 없습니다.';

  const toggle = () => {
    if (!open) {
      onOpen();
      setTeamsState({ status: 'loading' });
    }
    setOpen(!open);
  };

  const dismissOnEscape = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Escape' || !open) return;
    event.preventDefault();
    setOpen(false);
    profileRef.current?.querySelector('button')?.focus();
  };

  const dismissOnBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) setOpen(false);
  };

  const openAdmin = () => {
    if (!confirmNavigation('/admin/infra', '관리자 콘솔')) return;
    setOpen(false);
    void navigate('/admin/infra');
  };

  const confirmNavigation = (path: string, destination: string) => {
    if (hasUnsavedInput && pathname !== path && !window.confirm(`저장하지 않은 입력이 있습니다. ${destination}(으)로 이동할까요?`)) return false;
    return true;
  };

  const handleLogout = async () => {
    if (loggingOut) return;
    if (!confirmNavigation('/login', '로그인 화면')) return;
    setLoggingOut(true);
    onLogoutPendingChange?.(true);
    setLogoutError(false);
    try {
      await logout();
      clearSessionUser();
      setOpen(false);
      void navigate('/login', { replace: true });
    } catch {
      setLogoutError(true);
    } finally {
      setLoggingOut(false);
      onLogoutPendingChange?.(false);
    }
  };

  return (
    <Profile ref={profileRef} onBlur={dismissOnBlur} onKeyDown={dismissOnEscape}>
      <Button
        variant="ghost"
        icon={<Octicon name="person" size={16} />}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={toggle}
      >
        {userName}
      </Button>
      {open && (
        <Panel id={panelId} ref={panelRef} role="dialog" aria-labelledby={`${panelId}-title`} tabIndex={-1}>
          <Heading>
            <Octicon name="person" size={24} aria-hidden="true" />
            <Title id={`${panelId}-title`}>{user?.name ?? userName}</Title>
          </Heading>
          <Copy>현재 역할을 확인하거나 다른 역할로 전환하세요.</Copy>
          <Row>
            <Octicon name="check-circle" size={16} aria-hidden="true" />
            <Detail><Label>{roleLabel}</Label><Caption>현재 역할</Caption></Detail>
          </Row>
          <Row>
            <Octicon name="people" size={16} aria-hidden="true" />
            <Detail>
              <Label>소속 팀</Label>
              {visibleTeams.length > 0
                ? visibleTeams.map(team => <Caption key={team.id}>{team.name} · {teamRoleLabel[team.my_role]}</Caption>)
                : <Caption aria-live="polite">{teamStatusLabel}</Caption>}
            </Detail>
          </Row>
          <Copy>· 관리자로 전환하면 관리자 콘솔로 이동합니다.</Copy>
          <Copy>· 저장하지 않은 입력이 있으면 전환하기 전에 알려드립니다.</Copy>
          {logoutError && <ErrorText role="alert">로그아웃하지 못했습니다. 다시 시도해 주세요.</ErrorText>}
          <Actions>
            <Action $minWidth={108} variant="ghost" icon={<Octicon name="sign-out" size={16} />} onClick={() => void handleLogout()} disabled={loggingOut}>
              {loggingOut ? '로그아웃 중' : '로그아웃'}
            </Action>
            <Action
              $minWidth={98}
              variant="secondary"
              icon={<Octicon name="gear" size={16} />}
              disabled={!teamSettingsPath || loggingOut}
              onClick={() => {
                if (!teamSettingsPath) return;
                if (!confirmNavigation(teamSettingsPath, '팀 설정')) return;
                setOpen(false);
                void navigate(teamSettingsPath);
              }}
            >
              팀 설정
            </Action>
            <Action
              $minWidth={137}
              variant="secondary"
              icon={<Octicon name="shield" size={16} />}
              disabled={loggingOut}
              onClick={openAdmin}
            >
              관리자로 전환
            </Action>
            <Action
              $minWidth={111}
              variant="secondary"
              icon={<Octicon name="gear" size={16} />}
              disabled={loggingOut}
              onClick={() => {
                if (!confirmNavigation('/settings', '계정 설정')) return;
                setOpen(false);
                void navigate('/settings');
              }}
            >
              계정 설정
            </Action>
          </Actions>
        </Panel>
      )}
    </Profile>
  );
}
