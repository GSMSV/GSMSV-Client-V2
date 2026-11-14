import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import styled from 'styled-components';
import { createPersonalApp, createTeamApp } from '../../features/app/create-app';
import { checkAppSubdomain, useAppServiceDraft, type AppServiceType } from '../../features/app/create-app/service';
import { getSessionUser } from '../../entities/session';
import { getTeam, listMyTeams, type TeamDetail, type TeamRole, type TeamStatus, type TeamSummary } from '../../entities/team';
import { ApiRequestError } from '../../shared/api';
import { Button, SegmentedControl, SliderField, StepIndicator, TextField } from '../../shared/ui/controls';
import { Octicon } from '../../shared/ui/icons';
import { StudentShell, type StudentNavigationKey } from '../../widgets/student-shell';
import { isDemoMode } from '../../shared/demo';
import { getDemoTeam, listDemoTeams } from '../../entities/team/demo';
import { getDemoProfile } from '../../entities/profile';
import { addDemoApp, demoPersonalAppOwner, getDemoAppQuota, isDemoAppSubdomainAvailable } from '../../entities/app/demo';
import { getDemoInstalledRepositories, isDemoRepositoryAccessible, readDemoAppDraft, saveDemoAppDraft } from '../../features/apps/createDemoAppDraft';

const roleLabel: Record<TeamRole, string> = { leader: '팀장', devops: 'DevOps', member: '팀원' };

const Page = styled.div`
  display: flex;
  width: 100%;
  max-width: 1224px;
  flex-direction: column;
  gap: 24px;
  padding: 40px;

  @media (max-width: 760px) { padding: 24px; }
`;

const PageMeta = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
`;

const Breadcrumb = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.faint};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const Heading = styled.h1`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.h1.weight} ${({ theme }) => theme.typography.h1.size}px/${({ theme }) => theme.typography.h1.lineHeight}px ${({ theme }) => theme.typography.h1.family}, sans-serif;
`;

const StepRow = styled.div`
  display: flex;
  min-height: 42px;
  align-items: center;
  justify-content: space-between;
  gap: 24px;

  @media (max-width: 760px) { flex-wrap: wrap; }
`;

const Steps = styled.div`
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 12px;
`;

const StepLine = styled.span`
  width: 36px;
  height: 1px;
  flex: 0 0 36px;
  background: ${({ theme }) => theme.colors.border};
`;

const StepActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Card = styled.section`
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
`;

const CardTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.title.weight} ${({ theme }) => theme.typography.title.size}px/${({ theme }) => theme.typography.title.lineHeight}px ${({ theme }) => theme.typography.title.family}, sans-serif;
`;

const QuotaMeta = styled.span`
  color: ${({ theme }) => theme.colors.faint};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
  text-align: right;
`;

const Hint = styled.p<{ $tone?: 'normal' | 'error' | 'success' }>`
  margin: 0;
  color: ${({ theme, $tone }) => $tone === 'error' ? theme.colors.danger : $tone === 'success' ? theme.colors.primary : theme.colors.faint};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const ResourceFields = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const PreviewBlock = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.raised};
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const DialogBackdrop = styled.div`
  position: fixed;
  z-index: 20;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 24px;
  background: #0009;
`;

const Dialog = styled.section`
  display: flex;
  width: min(100%, 480px);
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: 0 16px 48px #0006;
`;

const DialogHeading = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const DialogIcon = styled.span<{ $tone: 'warning' | 'neutral' }>`
  display: inline-flex;
  flex: 0 0 24px;
  align-items: center;
  justify-content: center;
  color: ${({ theme, $tone }) => $tone === 'warning' ? theme.colors.warning : theme.colors.primary};
`;

const DialogTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.h2.weight} ${({ theme }) => theme.typography.h2.size}px/${({ theme }) => theme.typography.h2.lineHeight}px ${({ theme }) => theme.typography.h2.family}, sans-serif;
`;

const DialogCopy = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

const DialogActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
`;

type DialogKind = 'domain-unavailable' | 'memory' | 'quota' | 'team-pending' | null;
type AvailabilityState = 'idle' | 'loading' | 'available' | 'unavailable' | 'error';

const serviceOptions = [
  { value: 'web', label: '웹' },
  { value: 'worker', label: '워커' },
  { value: 'cron', label: '크론' },
] as const;

function isValidSubdomain(value: string) {
  return value.length >= 3 && value.length <= 63 && /^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(value) && !value.includes('--');
}

function serviceDescription(type: AppServiceType) {
  if (type === 'worker') return '워커는 주소 없이 계속 실행됩니다.';
  if (type === 'cron') return '크론은 정한 시간에 실행됩니다.';
  return '웹은 주소로 요청을 받습니다.';
}

export default function AppCreateServicePage({ teamId }: { teamId?: string }) {
  const navigate = useNavigate();
  const user = getSessionUser();
  const demoMode = import.meta.env.DEV && isDemoMode();
  const sourceDraftKey = teamId ? `gsmsv.app-create-source-draft:team:${teamId}` : 'gsmsv.app-create-source-draft';
  const source = import.meta.env.DEV && demoMode ? readDemoAppDraft(teamId) : null;
  const { draft: serviceDraft, update, hasUnsavedInput } = useAppServiceDraft(sourceDraftKey);
  const draft = demoMode ? { ...serviceDraft, appName: source?.name ?? '' } : serviceDraft;
  const owner = import.meta.env.DEV ? (teamId ? { type: 'team' as const, id: teamId, name: '' } : demoPersonalAppOwner) : null;
  const quota = import.meta.env.DEV && demoMode && owner ? getDemoAppQuota(owner) : null;
  const listPath = teamId ? `/teams/${encodeURIComponent(teamId)}/apps` : '/apps';
  const sourcePath = `${listPath}/new`;
  const [dialog, setDialog] = useState<DialogKind>(() => import.meta.env.DEV && demoMode && teamId && getDemoTeam(teamId)?.status === 'pending' ? 'team-pending' : null);
  const [availability, setAvailability] = useState<AvailabilityState>('idle');
  const [availabilityError, setAvailabilityError] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<{ message: string; login?: boolean } | null>(null);
  const [teamStatus, setTeamStatus] = useState<TeamStatus | 'loading' | 'error'>(teamId ? 'loading' : 'approved');
  const [teamStatusRetry, setTeamStatusRetry] = useState(0);
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [currentTeam, setCurrentTeam] = useState<TeamDetail | null>(null);
  const requestController = useRef<AbortController | null>(null);
  const subdomainInputId = 'app-service-subdomain';
  const [demoDomain, setDemoDomain] = useState(() => source?.name.toLowerCase().replace(/[^a-z0-9-]/g, '-') ?? '');
  const subdomainValue = demoMode ? demoDomain : draft.subdomain;

  useEffect(() => () => requestController.current?.abort(), []);

  useEffect(() => {
    if (import.meta.env.DEV && demoMode) { setTeams(listDemoTeams()); return; }
    const controller = new AbortController();
    void listMyTeams(controller.signal)
      .then(value => { if (!controller.signal.aborted) setTeams(value); })
      .catch(() => { if (!controller.signal.aborted) setTeams([]); });
    return () => controller.abort();
  }, [demoMode]);

  useEffect(() => {
    if (import.meta.env.DEV && demoMode) {
      const team = teamId ? getDemoTeam(teamId) : undefined;
      setCurrentTeam(team ?? null);
      setTeamStatus(team?.status ?? (teamId ? 'error' : 'approved'));
      return;
    }
    if (!teamId) {
      setTeamStatus('approved');
      setCurrentTeam(null);
      return;
    }

    const controller = new AbortController();
    setCurrentTeam(null);
    setTeamStatus('loading');
    void getTeam(teamId, controller.signal).then(team => {
      if (!controller.signal.aborted) {
        setCurrentTeam(team);
        setTeamStatus(team.status);
      }
    }).catch(() => {
      if (!controller.signal.aborted) setTeamStatus('error');
    });
    return () => controller.abort();
  }, [demoMode, teamId, teamStatusRetry]);

  const navigateFromShell = (item: Exclude<StudentNavigationKey, 'none'>) => {
    if (item === 'apps') navigate(teamId ? `/teams/${encodeURIComponent(teamId)}/apps` : '/apps');
  };

  const scopeOptions = useMemo(() => {
    const options = [
      { id: 'personal', label: '내 Resources', selected: !teamId, onSelect: () => navigate('/apps/new/service') },
      ...teams.map(team => ({
        id: team.id,
        label: `${team.name} · ${roleLabel[team.my_role]}`,
        selected: team.id === teamId,
        onSelect: () => navigate(`/teams/${encodeURIComponent(team.id)}/apps/new/service`),
      })),
    ];
    if (teamId && !teams.some(team => team.id === teamId)) {
      options.push({
        id: teamId,
        label: currentTeam ? `${currentTeam.name} · ${currentTeam.my_role ? roleLabel[currentTeam.my_role] : '관리자'}` : '팀 Resources',
        selected: true,
        onSelect: () => navigate(`/teams/${encodeURIComponent(teamId)}/apps/new/service`),
      });
    }
    return options;
  }, [currentTeam, navigate, teamId, teams]);

  const checkSubdomain = useCallback(async () => {
    const value = subdomainValue.trim();
    if (!isValidSubdomain(value)) {
      setAvailability('unavailable');
      setAvailabilityError('영문 소문자와 숫자로 시작·끝나는 3~63자의 이름을 입력해 주세요. 하이픈은 중간에만 쓸 수 있습니다.');
      return;
    }

    requestController.current?.abort();
    if (import.meta.env.DEV && demoMode) {
      const available = isDemoAppSubdomainAvailable(value);
      setAvailability(available ? 'available' : 'unavailable');
      setAvailabilityError(available ? '' : '현재 사용할 수 없는 주소입니다.');
      return;
    }
    const controller = new AbortController();
    requestController.current = controller;
    setAvailability('loading');
    setAvailabilityError('');
    try {
      const result = await checkAppSubdomain(value, controller.signal);
      if (controller.signal.aborted) return;
      if (!result.available) {
        setAvailability('unavailable');
        setAvailabilityError(result.reason === 'invalid_format' ? '주소 형식이 올바르지 않습니다.' : '현재 사용할 수 없는 주소입니다.');
        setDialog('domain-unavailable');
      } else {
        setAvailability('available');
      }
    } catch (error) {
      if (controller.signal.aborted) return;
      setAvailability('error');
      setAvailabilityError(error instanceof ApiRequestError && error.status === 429
        ? '주소 확인 요청이 많습니다. 잠시 후 다시 확인해 주세요.'
        : '주소 사용 가능 여부를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    }
  }, [demoMode, subdomainValue]);

  const handleCreate = async () => {
    const name = draft.appName.trim();
    if (creating || (teamId && teamStatus !== 'approved') || name.length < 1 || name.length > 30) return;
    setCreating(true);
    setCreateError(null);
    try {
      if (import.meta.env.DEV && demoMode && owner) {
        if (!source) { navigate(sourcePath); return; }
        if (teamId && (!currentTeam || currentTeam.status !== 'approved' || currentTeam.my_role === 'member')) return;
        if (source.sourceType === 'github' && (!getDemoProfile()?.github ||
          !isDemoRepositoryAccessible(source.repository, getDemoInstalledRepositories()))) {
          navigate(sourcePath);
          return;
        }
        const currentQuota = getDemoAppQuota(owner);
        if (currentQuota.count >= currentQuota.limit) { setDialog('quota'); return; }
        if (draft.memoryMb > currentQuota.freeMemory) { setDialog('memory'); return; }
        const subdomain = draft.serviceType === 'web' ? subdomainValue.trim() : '';
        if (draft.serviceType === 'web' && !isDemoAppSubdomainAvailable(subdomain)) { setDialog('domain-unavailable'); return; }
        const type = serviceOptions.find(option => option.value === draft.serviceType)?.label ?? '웹';
        const appId = addDemoApp({
          ...source,
          name,
          owner: { ...owner, name: currentTeam?.name ?? user?.name ?? owner.name },
          service: { name: draft.serviceName.trim() || type, type, subdomain, memoryMb: draft.memoryMb, cpu: draft.cpu, watchPaths: source.watchPaths },
        });
        if (!appId) { setCreateError({ message: '앱을 저장하지 못했습니다. 다시 시도해 주세요.' }); return; }
        saveDemoAppDraft(teamId, null);
        navigate(`/apps/${encodeURIComponent(appId)}/demo`);
        return;
      }
      const app = teamId ? await createTeamApp(teamId, name) : await createPersonalApp(name);
      sessionStorage.removeItem(sourceDraftKey);
      navigate(`/apps/${encodeURIComponent(app.grn)}`);
    } catch (error) {
      setCreateError(error instanceof ApiRequestError && error.status === 401
        ? { message: '로그인이 필요합니다. 로그인한 뒤 다시 시도해 주세요.', login: true }
        : teamId && error instanceof ApiRequestError && error.code === 'TEAM_NOT_APPROVED'
          ? { message: '팀이 승인되면 앱을 만들 수 있어요' }
          : teamId && error instanceof ApiRequestError && error.code === 'ACCESS_DENIED'
            ? { message: '현재 팀에서 앱을 만들 권한이 없습니다. 팀 권한을 확인해 주세요.' }
            : error instanceof ApiRequestError && error.status === 409
          ? { message: teamId ? '팀 Apps 생성 한도에 도달했거나 요청이 충돌했습니다. 팀 Apps 목록에서 사용량을 확인해 주세요.' : '개인 앱 생성 한도에 도달했거나 요청이 충돌했습니다. Apps 목록에서 사용량을 확인해 주세요.' }
          : error instanceof ApiRequestError && error.status === 400
            ? { message: '앱 이름을 확인해 주세요. 앞뒤 공백을 제외하고 1~30자로 입력할 수 있습니다.' }
            : { message: '앱을 만들지 못했습니다. 네트워크 연결을 확인하고 다시 시도해 주세요.' });
    } finally {
      setCreating(false);
    }
  };

  const updateSubdomain = (value: string) => {
    if (demoMode) setDemoDomain(value.toLowerCase());
    else update('subdomain', value.toLowerCase());
    setAvailability('idle');
    setAvailabilityError('');
  };

  const dialogCopy = dialog === 'memory' ? {
    title: '메모리 할당량이 모자랍니다',
    description: `· 이 서비스에 ${draft.memoryMb} MB가 필요한데 남은 할당량은 ${quota?.freeMemory ?? 0} MB입니다.
· 잠든 서비스도 설정한 메모리만큼 세요.
· 메모리를 줄이거나 쓰지 않는 앱을 지워 주세요.`,
    tone: 'warning' as const,
  } : dialog === 'team-pending' ? {
    title: '팀이 승인되면 앱을 만들 수 있습니다',
    description: '· 관리자 승인을 기다리는 팀은 VM·Database·Serverless·Apps를 만들 수 없습니다.\n· 팀원 초대와 팀장 넘기기는 지금도 할 수 있습니다.',
    tone: 'warning' as const,
  } : dialog === 'quota' ? {
    title: '앱을 더 만들 수 없습니다',
    description: `· ${teamId ? '팀 앱을 모두 쓰고 있습니다.' : '내 앱 2개를 모두 쓰고 있습니다.'}
· 쓰지 않는 앱을 지우면 다시 만들 수 있습니다.${teamId ? '' : '\n· 더 필요하면 팀을 만들어 팀 앱을 쓰세요.'}`,
    tone: 'warning' as const,
  } : {
    title: '서브도메인을 쓸 수 없습니다',
    description: demoMode
      ? `· ${subdomainValue}은 사용할 수 없습니다.
· GSMSV가 쓰려고 남겨 둔 이름도 쓸 수 없습니다.`
      : '현재 사용할 수 없는 주소입니다. 다른 이름을 선택해 주세요. 주소를 점유한 사용자나 앱 정보는 공개할 수 없습니다.',
    tone: 'warning' as const,
  };

  return (
    <StudentShell
      activeItem="apps"
      scopeLabel={teamId ? '팀 Resources' : '내 Resources'}
      scopeOptions={scopeOptions}
      userName={user?.name ?? '사용자'}
      onNavigate={navigateFromShell}
      onCreateTeam={() => navigate('/teams/new')}
      onOpenStatus={() => navigate('/status')}
      onSelectScope={() => undefined}
      onSearch={() => undefined}
      onOpenNotifications={() => undefined}
      hasUnsavedInput={hasUnsavedInput}
    >
      <Page>
        <PageMeta>
          <Breadcrumb>{teamId ? '팀 Apps' : 'Apps'}</Breadcrumb>
        </PageMeta>
        <Heading>어떤 서비스로 실행하시겠습니까?</Heading>

        <StepRow>
          <Steps aria-label="앱 만들기 단계">
            <StepIndicator number={1} label="소스" />
            <StepLine role="presentation" />
            <StepIndicator number={2} label="서비스" active />
          </Steps>
          <StepActions>
            <Button variant="ghost" icon={<Octicon name="arrow-left" size={16} />} onClick={() => navigate(teamId ? `/teams/${encodeURIComponent(teamId)}/apps/new` : '/apps/new')}>이전: 소스</Button>
            <Button variant="primary" icon={<Octicon name={creating ? 'sync' : 'check'} size={16} />} onClick={() => void handleCreate()} disabled={creating || Boolean(teamId && teamStatus !== 'approved') || draft.appName.trim().length < 1 || draft.appName.trim().length > 30 || (demoMode && currentTeam?.my_role === 'member')}>{creating ? '앱 만드는 중' : '앱 만들기'}</Button>
          </StepActions>
        </StepRow>

        {teamId && teamStatus !== 'approved' && teamStatus !== 'loading' && <PreviewBlock role={teamStatus === 'error' ? 'alert' : 'note'}>
          <Octicon name={teamStatus === 'error' ? 'alert' : 'info'} size={16} aria-hidden="true" />
          <span>{teamStatus === 'error' ? '팀 승인 상태를 확인하지 못해 앱을 만들 수 없습니다. 다시 시도해 주세요.' : '팀이 승인되면 앱을 만들 수 있어요'}</span>
          {teamStatus === 'error' && <Button variant="ghost" onClick={() => setTeamStatusRetry(value => value + 1)}>다시 시도</Button>}
        </PreviewBlock>}

        {createError && <PreviewBlock role="alert">
          <Octicon name="alert" size={16} aria-hidden="true" />
          <span>{createError.message}</span>
          {createError.login && <Button variant="secondary" onClick={() => navigate('/login')}>로그인</Button>}
        </PreviewBlock>}

        {!demoMode && <PreviewBlock role="note">
          <Octicon name="info" size={16} aria-hidden="true" />
          <span>{`앱 이름 ${draft.appName || '미입력'}으로 만들 수 있습니다. 현재 API 계약은 이름만 저장하고 기본 production 환경을 만들며, 이 화면의 소스와 서비스 설정은 전송되지 않습니다.`}</span>
        </PreviewBlock>}

        <Card>
          <CardTitle>서비스</CardTitle>
          <SegmentedControl
            label="서비스 유형"
            options={[...serviceOptions]}
            value={draft.serviceType}
            disabled={!demoMode}
            onChange={value => update('serviceType', value as AppServiceType)}
          />
          <Hint>{demoMode ? '웹은 주소로 요청을 받습니다. 워커는 주소 없이 계속 실행되고, 크론은 정한 시각에 실행됩니다.' : serviceDescription(draft.serviceType)}</Hint>
          <TextField
            label="서비스 이름"
            value={draft.serviceName}
            maxLength={30}
            disabled={!demoMode}
            onChange={event => update('serviceName', event.currentTarget.value)}
            hint="앱 안에서 서비스를 구분하는 이름입니다."
          />
        </Card>

        {draft.serviceType === 'web' && <Card>
          <CardTitle>주소</CardTitle>
          <TextField
            id={subdomainInputId}
            label="서브도메인"
            value={subdomainValue}
            maxLength={63}
            disabled={!demoMode}
            onChange={event => updateSubdomain(event.currentTarget.value)}
            onBlur={() => { if (subdomainValue.trim()) void checkSubdomain(); }}
            hint={demoMode ? `production 주소는 https://${subdomainValue}.{앱 도메인}입니다. staging·PR 환경에는 이름이 자동으로 붙습니다.` : 'production 주소의 이름입니다. 실제 도메인 주소는 계약에 정의되어 있지 않습니다.'}
            error={availability === 'unavailable' ? availabilityError : undefined}
          />
          {availability === 'loading' && <Hint role="status">주소를 확인하고 있습니다…</Hint>}
          {availability === 'available' && <Hint $tone="success" role="status">현재 사용할 수 있는 이름입니다.</Hint>}
          {availability === 'error' && <Hint $tone="error" role="alert">{availabilityError}</Hint>}
        </Card>}

        <Card>
          <CardHeader>
            <CardTitle>자원</CardTitle>
            <QuotaMeta>{quota ? `메모리 할당량 ${quota.usedMemory} MB / 2 GB 사용 중 · 남은 할당량 ${quota.freeMemory} MB` : '메모리 할당량 API가 없어 값을 확인할 수 없습니다.'}</QuotaMeta>
          </CardHeader>
          <ResourceFields>
            <SliderField
              label="메모리"
              value={draft.memoryMb}
              min={256}
              max={1024}
              step={128}
              minLabel="최소 256 MB"
              maxLabel="최대 1 GB"
              valueLabel={draft.memoryMb >= 1024 ? '1 GB' : `${draft.memoryMb} MB`}
              disabled={!demoMode}
              onChange={value => update('memoryMb', value)}
            />
            <SliderField
              label="CPU"
              value={draft.cpu}
              min={0.25}
              max={1}
              step={0.25}
              minLabel="최소 0.25 vCPU"
              maxLabel="최대 1 vCPU"
              valueLabel={`${draft.cpu} vCPU`}
              disabled={!demoMode}
              onChange={value => update('cpu', value)}
            />
          </ResourceFields>
          <Hint>컨테이너 안 파일은 재시작하면 사라집니다. 남길 데이터는 Database에 저장하세요.</Hint>
        </Card>
      </Page>

      {dialog && <DialogBackdrop onMouseDown={event => { if (event.target === event.currentTarget) setDialog(null); }}>
        <Dialog role="dialog" aria-modal="true" aria-labelledby="app-service-dialog-title" aria-describedby="app-service-dialog-copy">
          <DialogHeading>
            <DialogIcon $tone={dialogCopy.tone} aria-hidden="true">
              <Octicon name={dialogCopy.tone === 'warning' ? 'globe' : 'info'} size={20} />
            </DialogIcon>
            <DialogTitle id="app-service-dialog-title">{dialogCopy.title}</DialogTitle>
          </DialogHeading>
          <DialogCopy id="app-service-dialog-copy" style={demoMode ? { whiteSpace: 'pre-line' } : undefined}>{dialogCopy.description}</DialogCopy>
          <DialogActions>
            {dialog === 'memory' || dialog === 'quota' ? <>
              <Button variant="secondary" onClick={() => navigate(listPath)}>Apps 목록</Button>
              {dialog === 'quota' && !teamId && <Button onClick={() => navigate('/teams/new')}>팀 만들기</Button>}
            </> : dialog === 'team-pending'
              ? <Button variant="secondary" onClick={() => navigate(`/teams/${encodeURIComponent(teamId ?? '')}`)}>팀 홈으로</Button>
              : dialog === 'domain-unavailable'
              ? <Button variant="secondary" onClick={() => { setDialog(null); document.getElementById(subdomainInputId)?.focus(); }}>다른 이름 쓰기</Button>
              : <Button variant="secondary" onClick={() => setDialog(null)}>확인</Button>}
          </DialogActions>
        </Dialog>
      </DialogBackdrop>}
    </StudentShell>
  );
}
