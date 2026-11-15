import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import styled from 'styled-components';
import {
  createPersonalDatabase,
  createTeamDatabase,
  listDatabases,
  type DatabaseEngine,
  type DatabaseSummary,
} from '../../entities/database';
import { getMyDatabaseQuota, type DatabaseQuota } from '../../entities/quota';
import { getSessionUser } from '../../entities/session';
import { getTeam, listMyTeams, type TeamDetail, type TeamRole, type TeamSummary } from '../../entities/team';
import { ApiRequestError } from '../../shared/api';
import { consumeDemoFailure, isDemoMode, simulateDemoRequest } from '../../shared/demo';
import { Button } from '../../shared/ui/controls';
import { UsageCard } from '../../shared/ui/data-display';
import { Banner, ErrorCard, LoadingCard } from '../../shared/ui/feedback';
import { Octicon } from '../../shared/ui/icons';
import { StudentShell, type StudentNavigationKey } from '../../widgets/student-shell';

const Page = styled.div`
  display: flex;
  width: 100%;
  max-width: 1224px;
  flex-direction: column;
  gap: 24px;
  padding: 40px;

  @media (max-width: 720px) { padding: 24px 16px; }
`;

const Breadcrumb = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.faint};
  font: 400 12px/18px ${({ theme }) => theme.typography.body.family}, sans-serif;
`;

const Heading = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;

  @media (max-width: 720px) {
    align-items: flex-start;
    flex-direction: column;
    gap: 12px;
  }
`;

const TitleGroup = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 8px;
`;

const Title = styled.h1`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.h1.weight} ${({ theme }) => theme.typography.h1.size}px/${({ theme }) => theme.typography.h1.lineHeight}px ${({ theme }) => theme.typography.h1.family}, sans-serif;
`;

const Description = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.body.weight} ${({ theme }) => theme.typography.body.size}px/${({ theme }) => theme.typography.body.lineHeight}px ${({ theme }) => theme.typography.body.family}, sans-serif;
`;

const Actions = styled.div`
  display: flex;
  flex: 0 0 auto;
  gap: 8px;
`;

const Summary = styled.section`
  display: flex;
  gap: 16px;

  @media (max-width: 960px) { flex-wrap: wrap; }
`;

const FlexibleUsageCard = styled(UsageCard)`
  min-width: 0;
  flex: 1 1 0;
`;

const FormCard = styled.section`
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};
`;

const FormTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.title.weight} ${({ theme }) => theme.typography.title.size}px/${({ theme }) => theme.typography.title.lineHeight}px ${({ theme }) => theme.typography.title.family}, sans-serif;
`;

const FormSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.label.weight} ${({ theme }) => theme.typography.label.size}px/${({ theme }) => theme.typography.label.lineHeight}px ${({ theme }) => theme.typography.label.family}, sans-serif;
`;

const EngineChoices = styled.div`
  display: flex;
  width: 100%;
  height: ${({ theme }) => theme.size.control}px;
  gap: 4px;
  padding: 4px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.field};
`;

const EngineButton = styled.button<{ $selected: boolean }>`
  display: inline-flex;
  min-width: 0;
  flex: 1 1 0;
  align-items: center;
  justify-content: center;
  padding: 0 12px;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme, $selected }) => $selected ? theme.colors.primarySoft : 'transparent'};
  color: ${({ theme, $selected }) => $selected ? theme.colors.primary : theme.colors.muted};
  font: ${({ theme }) => theme.typography.button.weight} ${({ theme }) => theme.typography.button.size}px/${({ theme }) => theme.typography.button.lineHeight}px ${({ theme }) => theme.typography.button.family}, sans-serif;
  cursor: pointer;

  &:focus-visible { outline: 2px solid ${({ theme }) => theme.colors.primary}; outline-offset: 2px; }
  &:disabled { color: ${({ theme }) => theme.colors.faint}; cursor: not-allowed; }
`;

const Field = styled.input`
  width: 100%;
  height: ${({ theme }) => theme.size.control}px;
  padding: 0 16px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.base}px;
  outline: none;
  background: ${({ theme }) => theme.colors.field};
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;

  &::placeholder { color: ${({ theme }) => theme.colors.faint}; }
  &:focus { border-color: ${({ theme }) => theme.colors.primary}; }
`;

const Help = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.faint};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const Notice = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  width: 100%;
  padding: 16px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.primarySoft};
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

const Quiet = styled.span`
  color: ${({ theme }) => theme.colors.faint};
`;

const Retry = styled.button`
  margin-left: 8px;
  padding: 0;
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.colors.primary};
  font: inherit;
  cursor: pointer;
`;

const DialogBackdrop = styled.div`
  position: fixed;
  z-index: 10;
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
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: 0 16px 48px #0005;
`;

const DialogHeader = styled.header`
  display: flex;
  align-items: center;
  gap: 12px;
  color: ${({ theme }) => theme.colors.warning};
`;

const DialogTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.h2.weight} ${({ theme }) => theme.typography.h2.size}px/${({ theme }) => theme.typography.h2.lineHeight}px ${({ theme }) => theme.typography.h2.family}, sans-serif;
`;

const DialogCopy = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

const DialogLine = styled.span`
  display: block;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

const DialogActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
`;

type DialogState = 'count' | 'teamLimit' | 'storage' | 'postgres' | 'permission' | 'notApproved' | 'failure' | 'accepted' | null;
interface Loadable<T> { value: T | null; loading: boolean; error: boolean; }
const initialLoadable = <T,>(): Loadable<T> => ({ value: null, loading: true, error: false });

function formatNumber(value: number) {
  return new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 2 }).format(value);
}

function newIdempotencyKey() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function DatabaseCreatePage() {
  const navigate = useNavigate();
  const demo = isDemoMode();
  const [searchParams] = useSearchParams();
  const owner = searchParams.get('owner') ?? 'me';
  const teamId = (owner.startsWith('team-') || owner === 'demo-team') ? owner : undefined;
  const invalidOwner = owner !== 'me' && !teamId;
  const listPath = teamId ? `/databases?owner=${encodeURIComponent(teamId)}` : '/databases';
  const user = getSessionUser();
  const [quota, setQuota] = useState<Loadable<DatabaseQuota>>(initialLoadable);
  const [databases, setDatabases] = useState<Loadable<DatabaseSummary[]>>(initialLoadable);
  const [team, setTeam] = useState<Loadable<TeamDetail>>(initialLoadable);
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [retryKey, setRetryKey] = useState(0);
  const [name, setName] = useState('');
  const [engine, setEngine] = useState<DatabaseEngine>('mysql');
  const [dialog, setDialog] = useState<DialogState>(null);
  const [submitting, setSubmitting] = useState(false);
  const [nameError, setNameError] = useState('');
  const requestKeyRef = useRef<{ fingerprint: string; key: string } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    if (isDemoMode()) {
      let cancelled = false;
      void import('../../entities/team/demo').then(({ listDemoTeams }) => { if (!cancelled) setTeams(listDemoTeams()); });
      return () => { cancelled = true; };
    }
    void listMyTeams(controller.signal).then(value => {
      if (!controller.signal.aborted) setTeams(value);
    }).catch(() => {
      if (!controller.signal.aborted) setTeams([]);
    });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    if (invalidOwner) {
      setQuota({ value: null, loading: false, error: false });
      setDatabases({ value: null, loading: false, error: false });
      setTeam({ value: null, loading: false, error: false });
      return () => controller.abort();
    }
    if (isDemoMode()) {
      let cancelled = false;
      setDatabases(current => ({ ...current, loading: true, error: false }));
      setQuota(current => ({ ...current, loading: true, error: false }));
      void simulateDemoRequest('database-new').then(() => Promise.all([import('../../entities/database/demo'), import('../../entities/team/demo')])).then(([demo, teams]) => {
        if (cancelled) return;
        setDatabases({ value: demo.listDemoDatabases(teamId ?? 'me'), loading: false, error: false });
        if (teamId) {
          const value = teams.getDemoTeam(teamId);
          setTeam(value ? { value, loading: false, error: false } : { value: null, loading: false, error: true });
          setQuota({ value: null, loading: false, error: false });
        } else {
          setTeam({ value: null, loading: false, error: false });
          setQuota({ value: demo.getDemoDatabaseQuota(), loading: false, error: false });
        }
      }).catch(() => {
        if (cancelled) return;
        setDatabases({ value: null, loading: false, error: true });
        setTeam({ value: null, loading: false, error: true });
        setQuota({ value: null, loading: false, error: true });
      });
      return () => { cancelled = true; };
    }
    setDatabases(current => ({ ...current, loading: true, error: false }));
    if (teamId) {
      setQuota({ value: null, loading: false, error: false });
      setTeam(current => ({ ...current, loading: true, error: false }));
      void getTeam(teamId, controller.signal).then(value => {
        if (!controller.signal.aborted) setTeam({ value, loading: false, error: false });
      }).catch(() => {
        if (!controller.signal.aborted) setTeam({ value: null, loading: false, error: true });
      });
    } else {
      setTeam({ value: null, loading: false, error: false });
      setQuota(current => ({ ...current, loading: true, error: false }));
      void getMyDatabaseQuota(controller.signal).then(value => {
        if (!controller.signal.aborted) setQuota({ value, loading: false, error: false });
      }).catch(() => {
        if (!controller.signal.aborted) setQuota({ value: null, loading: false, error: true });
      });
    }
    void listDatabases({ owner: teamId ?? 'me', signal: controller.signal }).then(value => {
      if (!controller.signal.aborted) setDatabases({ value, loading: false, error: false });
    }).catch(() => {
      if (!controller.signal.aborted) setDatabases({ value: null, loading: false, error: true });
    });
    return () => controller.abort();
  }, [invalidOwner, retryKey, teamId]);

  const count = quota.value?.db.count;
  const storage = quota.value?.db.shared_storage_gb;
  const writeLocked = databases.value?.some(database => database.write_locked) ?? false;
  const needsQuotaCheck = invalidOwner || (teamId
    ? team.loading || databases.loading || team.error || databases.error
    : quota.loading || databases.loading || quota.error || databases.error);
  const nameIsValid = name.trim().length >= 1 && name.trim().length <= 30;
  // 승인 전 팀도 발급을 누를 수 있어야 '팀이 승인되면 발급할 수 있습니다' 안내가 열린다.
  const canSubmit = useMemo(() => nameIsValid && !submitting && !needsQuotaCheck, [nameIsValid, needsQuotaCheck, submitting]);

  const navigateFromShell = (item: Exclude<StudentNavigationKey, 'none'>) => {
    if (item === 'database') navigate(listPath);

    return ['database'].includes(item);
  };

  const submit = useCallback(async () => {
    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length > 30) {
      setNameError('이름은 1자 이상 30자 이하로 입력해 주세요.');
      return;
    }
    setNameError('');
    if (needsQuotaCheck) {
      setNameError(teamId ? '팀 정보와 Database 상태를 확인한 뒤 발급할 수 있습니다.' : '사용량 정보를 확인한 뒤 발급할 수 있습니다.');
      return;
    }
    if (!teamId && count && count.used >= count.limit) { setDialog('count'); return; }
    if ((storage && storage.used > storage.limit) || writeLocked) { setDialog('storage'); return; }
    if (teamId && team.value?.status !== 'approved') { setDialog('notApproved'); return; }

    setSubmitting(true);
    if (isDemoMode()) {
      if (teamId && team.value?.my_role !== 'leader' && team.value?.my_role !== 'devops') {
        setDialog('permission');
        setSubmitting(false);
        return;
      }
      // ?demoError=database-issue: 아무것도 만들기 전에 실패시킨다. 다시 시도하면 성공한다.
      if (consumeDemoFailure('database-issue')) {
        setDialog('failure');
        setSubmitting(false);
        return;
      }
      let createdGrn: string;
      try {
        const { createDemoDatabase, getDemoDatabaseCredentials, listDemoDatabases } = await import('../../entities/database/demo');
        if (teamId && listDemoDatabases(teamId).length >= 4) {
          setDialog('teamLimit');
          setSubmitting(false);
          return;
        }
        const owner = teamId ? { id: teamId, name: team.value?.name ?? 'GSM Connect' } : undefined;
        const created = createDemoDatabase(trimmedName, engine, owner, 'shared');
        if (!getDemoDatabaseCredentials(created.grn)) throw new Error('DEMO_DATABASE_CREDENTIALS_UNAVAILABLE');
        createdGrn = created.grn;
      } catch {
        setDialog('failure');
        setSubmitting(false);
        return;
      }
      try {
        await navigate(`/databases/${encodeURIComponent(createdGrn)}`);
      } catch {
        setDialog('accepted');
      } finally {
        setSubmitting(false);
      }
      return;
    }
    const fingerprint = `${teamId ?? 'me'}\u0000${engine}\u0000${trimmedName}`;
    if (requestKeyRef.current?.fingerprint !== fingerprint) {
      requestKeyRef.current = { fingerprint, key: newIdempotencyKey() };
    }
    try {
      if (teamId) await createTeamDatabase(teamId, trimmedName, engine, { idempotencyKey: requestKeyRef.current.key });
      else await createPersonalDatabase(trimmedName, engine, { idempotencyKey: requestKeyRef.current.key });
      requestKeyRef.current = null;
      setDialog('accepted');
    } catch (error) {
      if (error instanceof ApiRequestError && error.status !== null && error.status < 500) {
        requestKeyRef.current = null;
      }
      if (error instanceof ApiRequestError && error.code === 'TEAM_NOT_APPROVED') setDialog('notApproved');
      else if (error instanceof ApiRequestError && error.code === 'ACCESS_DENIED') setDialog('permission');
      else if (error instanceof ApiRequestError && error.code === 'QUOTA_EXCEEDED') setDialog(teamId ? 'teamLimit' : 'count');
      else if (error instanceof ApiRequestError && error.code === 'WRITE_LOCKED_OWNER') setDialog('storage');
      else setDialog('failure');
    } finally {
      setSubmitting(false);
    }
  }, [count, engine, name, needsQuotaCheck, storage, teamId, team.value?.name, team.value?.status, writeLocked]);

  const roleLabels: Record<TeamRole, string> = { leader: '팀장', devops: 'DevOps', member: '팀원' };
  const scopeLabel = team.value
    ? `${team.value.name} · ${team.value.my_role ? roleLabels[team.value.my_role] : '관리자'}`
    : teamId ? '팀 Resources' : '내 Resources';
  const scopeOptions = useMemo(() => {
    const options = [
      { id: 'personal', label: '내 Resources', selected: !teamId, onSelect: () => navigate('/databases/new') },
      ...teams.map(item => ({
        id: item.id,
        label: `${item.name} · ${roleLabels[item.my_role]}`,
        selected: item.id === teamId,
        onSelect: () => navigate(`/databases/new?owner=${encodeURIComponent(item.id)}`),
      })),
    ];
    if (team.value && !options.some(option => option.id === team.value?.id)) {
      options.push({
        id: team.value.id,
        label: `${team.value.name} · ${team.value.my_role ? roleLabels[team.value.my_role] : '관리자'}`,
        selected: true,
        onSelect: () => navigate(`/databases/new?owner=${encodeURIComponent(team.value!.id)}`),
      });
    }
    return options;
  }, [navigate, team.value, teamId, teams]);

  const storageLimit = storage ? `${formatNumber(storage.limit)} GB` : '한도';
  const dialogIcons: Record<Exclude<DialogState, null>, Parameters<typeof Octicon>[0]['name']> = {
    count: 'database', teamLimit: 'database', storage: 'alert', postgres: 'database', permission: 'lock', notApproved: 'clock', failure: 'alert', accepted: 'check-circle',
  };
  const dialogContent: Record<Exclude<DialogState, null>, { title: string; copy: string; lines?: string[] }> = {
    count: { title: 'Database를 더 발급할 수 없습니다', copy: `· 내 Database ${count ? formatNumber(count.limit) : ''}개를 모두 쓰고 있습니다.${count ? ` 개인 ${formatNumber(count.used)} / ${formatNumber(count.limit)}` : ''}`, lines: ['쓰지 않는 Database를 지우면 다시 발급할 수 있습니다.', '더 필요하면 팀을 만들어 팀 Database를 쓰세요.'] },
    teamLimit: { title: '팀 Database를 더 발급할 수 없습니다', copy: '현재 팀의 Database 발급 한도에 도달했습니다. 기존 Database를 확인한 뒤 다시 시도해 주세요.' },
    storage: { title: '용량을 먼저 줄여 주세요', copy: '쓰기 금지 중인 Database가 있어서 새 Database를 발급할 수 없습니다.', lines: [...(!teamId && storage ? [`사용 용량 ${formatNumber(storage.used)} / ${formatNumber(storage.limit)} GB`] : []), `${teamId ? '팀 용량을 한도' : storageLimit} 아래로 줄이면 쓰기 금지가 풀리고 다시 발급할 수 있습니다.`] },
    postgres: { title: 'PostgreSQL은 준비 중입니다', copy: '지금은 MySQL만 발급할 수 있습니다.' },
    permission: { title: 'Database를 발급할 권한이 없습니다', copy: '팀장 또는 DevOps만 팀 Database를 발급할 수 있습니다.' },
    notApproved: { title: '팀이 승인되면 발급할 수 있습니다', copy: '승인을 기다리는 팀은 Database를 만들 수 없습니다.', lines: ['팀원 초대와 팀장 넘기기는 지금도 할 수 있습니다.'] },
    failure: { title: '발급하지 못했습니다', copy: '잠깐 문제가 생겨 만들던 Database와 계정을 정리했습니다.', lines: ['개수와 용량은 그대로입니다. 다시 시도해 주세요.'] },
    accepted: { title: '발급 요청을 보냈습니다', copy: 'Database가 준비되는 동안 목록에서 상태를 확인할 수 있습니다. 준비가 끝나면 상세 화면에서 접속 정보를 확인하세요.' },
  };

  return (
    <StudentShell
      activeItem="database"
      scopeLabel={scopeLabel}
      scopeOptions={scopeOptions}
      teamScopeId={teamId}
      userName={user?.name ?? '사용자'}
      onNavigate={navigateFromShell}
      onCreateTeam={() => navigate('/teams/new')}
      onOpenStatus={() => navigate('/status')}
      onSelectScope={() => undefined}
      onSearch={() => undefined}
      onOpenNotifications={() => undefined}
      hasUnsavedInput={Boolean(name)}
    >
      <Page>
        <Breadcrumb>Database</Breadcrumb>
        <Heading>
          <TitleGroup>
            <Title>새 Database 발급</Title>
            <Description>{demo ? '엔진과 이름을 정하면 바로 발급됩니다.' : '엔진과 이름을 정하면 발급 요청을 보냅니다.'}</Description>
          </TitleGroup>
          <Actions>
            <Button variant="secondary" icon={<Octicon name="x" size={16} />} onClick={() => navigate(listPath)}>취소</Button>
            <Button variant="primary" icon={<Octicon name="plus" size={16} />} onClick={() => void submit()} disabled={!canSubmit || needsQuotaCheck}>
              {submitting ? '요청 중…' : '발급'}
            </Button>
          </Actions>
        </Heading>

        {demo ? (
          <Banner
            tone="neutral"
            icon={<Octicon name="info" size={20} />}
            title="발급하면 접속 정보를 바로 보여 드립니다"
            description="이 Database만 쓸 수 있는 계정을 함께 만듭니다. 인터넷에서는 바로 접속할 수 없고, 내 VM이나 쿼리 콘솔에서 씁니다."
          />
        ) : (
          <Banner
            tone="neutral"
            icon={<Octicon name="info" size={20} />}
            title={teamId ? `${team.value?.name ?? '팀'} Database를 발급합니다` : '개인 Database를 발급합니다'}
            description={`요청이 접수된 뒤 준비 상태가 ${teamId ? '팀 ' : ''}목록에 표시되며, 접속 정보는 준비 완료 후 상세 화면에서 확인할 수 있습니다.`}
          />
        )}

        {invalidOwner && <Notice role="alert">유효하지 않은 Database 소유 범위입니다. Database 목록으로 돌아가 주세요.</Notice>}
        {teamId && team.error && <ErrorCard onRetry={() => setRetryKey(value => value + 1)} />}
        {teamId && team.value && team.value.status !== 'approved' && <Notice role="status">팀이 승인된 뒤 Database를 발급할 수 있습니다.</Notice>}

        {!teamId && <Summary aria-label="Database 사용량">
          {quota.loading ? <><LoadingCard height={152} /><LoadingCard height={152} /></> : (
            <>
              <FlexibleUsageCard
                label="내 Database"
                icon={<Octicon name="database" size={16} />}
                value={count ? `${formatNumber(count.used)} / ${formatNumber(count.limit)}` : <Quiet>— / —</Quiet>}
                meter={count && count.limit > 0 ? { value: Math.min(100, count.used / count.limit * 100), tone: count.used >= count.limit ? 'danger' : 'primary', label: 'Database 개수 사용량' } : undefined}
                caption={quota.error ? <>사용량을 불러오지 못했습니다<Retry type="button" onClick={() => setRetryKey(value => value + 1)}>다시 시도</Retry></> : count ? `발급하면 ${formatNumber(count.used + 1)} / ${formatNumber(count.limit)}가 됩니다` : '개인 Database 발급 한도'}
              />
              <FlexibleUsageCard
                label="사용 용량"
                icon={<Octicon name="graph" size={16} />}
                value={storage ? `${formatNumber(storage.used)} / ${formatNumber(storage.limit)} GB` : <Quiet>— / — GB</Quiet>}
                meter={storage && storage.limit > 0 ? { value: Math.min(100, storage.used / storage.limit * 100), tone: storage.used > storage.limit ? 'danger' : 'primary', label: 'Database 용량 사용량' } : undefined}
                caption={quota.error ? <>사용량을 불러오지 못했습니다<Retry type="button" onClick={() => setRetryKey(value => value + 1)}>다시 시도</Retry></> : '새 Database는 0 GB에서 시작합니다'}
              />
            </>
          )}
        </Summary>}

        {databases.error && <ErrorCard onRetry={() => setRetryKey(value => value + 1)} />}

        <FormCard>
          <FormTitle>Database 정보</FormTitle>
          <FormSection>
            <Label>엔진</Label>
            <EngineChoices role="group" aria-label="Database 엔진">
              <EngineButton type="button" $selected={engine === 'mysql'} aria-pressed={engine === 'mysql'} onClick={() => setEngine('mysql')}>MySQL</EngineButton>
              <EngineButton
                type="button"
                $selected={engine === 'postgresql'}
                aria-pressed={engine === 'postgresql'}
                aria-disabled="true"
                onClick={() => setDialog('postgres')}
              >PostgreSQL</EngineButton>
            </EngineChoices>
          </FormSection>
          <FormSection>
            <Label htmlFor="database-name">이름</Label>
            <Field
              id="database-name"
              value={name}
              placeholder="예: shop-db"
              maxLength={30}
              aria-invalid={Boolean(nameError)}
              aria-describedby={nameError ? 'database-name-help database-name-error' : 'database-name-help'}
              onChange={event => { setName(event.target.value); setNameError(''); }}
              onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); void submit(); } }}
            />
            <Help id="database-name-help">{demo ? 'Database를 알아볼 이름입니다. 서버에는 db-로 시작하는 id로 만들어집니다.' : '1~30자. 앞뒤 공백은 저장 전에 제거됩니다. 이름은 발급 후에도 설정에서 바꿀 수 있습니다.'}</Help>
            {nameError && <Help id="database-name-error" role="alert">{nameError}</Help>}
          </FormSection>
        </FormCard>
      </Page>

      {dialog && <DialogBackdrop onMouseDown={event => { if (event.target === event.currentTarget) setDialog(null); }}>
        <Dialog role="dialog" aria-modal="true" aria-labelledby="database-dialog-title" aria-describedby="database-dialog-copy">
          <DialogHeader><Octicon name={dialogIcons[dialog]} size={24} /><DialogTitle id="database-dialog-title">{dialogContent[dialog].title}</DialogTitle></DialogHeader>
          <DialogCopy id="database-dialog-copy">{dialogContent[dialog].copy}</DialogCopy>
          {dialogContent[dialog].lines?.map(line => <DialogLine key={line}>· {line}</DialogLine>)}
          {dialog === 'postgres' ? (
            <FormSection>
              <Label as="span">엔진</Label>
              <EngineChoices role="group" aria-label="Database 엔진">
                <EngineButton type="button" $selected aria-pressed="true" onClick={() => { setEngine('mysql'); setDialog(null); }}>MySQL</EngineButton>
                <EngineButton type="button" $selected={false} disabled aria-disabled="true">PostgreSQL · 준비 중</EngineButton>
              </EngineChoices>
            </FormSection>
          ) : <DialogActions>
            {dialog === 'count' ? <>
              <Button variant="secondary" icon={<Octicon name="database" size={16} />} onClick={() => { setDialog(null); navigate(listPath); }}>Database 목록</Button>
              <Button variant="primary" icon={<Octicon name="people" size={16} />} onClick={() => { setDialog(null); navigate('/teams/new'); }}>팀 만들기</Button>
            </> : dialog === 'storage' ? <>
              <Button variant="secondary" icon={<Octicon name="book" size={16} />} onClick={() => { setDialog(null); navigate('/docs'); }}>용량 줄이는 방법</Button>
              <Button variant="primary" icon={<Octicon name="database" size={16} />} onClick={() => { setDialog(null); navigate(listPath); }}>Database 목록</Button>
            </> : dialog === 'notApproved' && teamId ? (
              <Button variant="primary" icon={<Octicon name="gear" size={16} />} onClick={() => { setDialog(null); navigate(`/teams/${encodeURIComponent(teamId)}/settings`); }}>팀 설정</Button>
            ) : dialog === 'failure' ? <>
              <Button variant="secondary" icon={<Octicon name="x" size={16} />} onClick={() => setDialog(null)}>닫기</Button>
              <Button variant="primary" icon={<Octicon name="sync" size={16} />} onClick={() => { setDialog(null); void submit(); }}>다시 시도</Button>
            </> : dialog === 'accepted' ? (
              <Button variant="primary" onClick={() => navigate(listPath)}>Database 목록</Button>
            ) : <Button variant="primary" onClick={() => setDialog(null)}>확인</Button>}
          </DialogActions>}
        </Dialog>
      </DialogBackdrop>}
    </StudentShell>
  );
}
