import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router';
import styled from 'styled-components';
import { extendDatabase, getDatabase, getDatabaseCredentials, listDatabaseBackups } from '../../entities/database';
import type { DatabaseBackup, DatabaseCredentials, DatabaseDetail } from '../../entities/database';
import { getSessionUser } from '../../entities/session';
import { DemoSimulatedError, isDemoMode, simulateDemoRequest } from '../../shared/demo';
import { listMyTeams, type TeamRole, type TeamSummary } from '../../entities/team';
import { Button } from '../../shared/ui/controls';
import { UsageCard } from '../../shared/ui/data-display';
import { Banner, ErrorCard, LoadingCard } from '../../shared/ui/feedback';
import { Octicon, type OcticonName } from '../../shared/ui/icons';
import { StudentShell, type StudentNavigationKey } from '../../widgets/student-shell';
import { DatabaseTab as Tab, DatabaseTabs as Tabs } from './DatabaseTabs';

const Page = styled.div`
  display: flex;
  width: 100%;
  max-width: 1224px;
  flex-direction: column;
  gap: 24px;
  padding: 40px;

  @media (max-width: 720px) { padding: 24px 16px; }
`;
const Breadcrumb = styled.button`
  width: fit-content;
  padding: 0;
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.colors.faint};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
  cursor: pointer;
  &:hover { color: ${({ theme }) => theme.colors.text}; }
  &:disabled { opacity: 1; cursor: not-allowed; }
  &:focus-visible { outline: 2px solid ${({ theme }) => theme.colors.primary}; outline-offset: 3px; }
`;
const Heading = styled.section`display: flex; flex-direction: column; gap: 8px; width: 100%;`;
const Title = styled.h1`
  margin: 0; color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.h1.weight} ${({ theme }) => theme.typography.h1.size}px/${({ theme }) => theme.typography.h1.lineHeight}px ${({ theme }) => theme.typography.h1.family}, sans-serif;
`;
const Subtitle = styled.p`
  margin: 0; color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.body.weight} ${({ theme }) => theme.typography.body.size}px/${({ theme }) => theme.typography.body.lineHeight}px ${({ theme }) => theme.typography.body.family}, sans-serif;
`;
const Summary = styled.section`
  display: flex; align-items: stretch; gap: 16px; width: 100%;
  @media (max-width: 720px) { flex-wrap: wrap; }
`;
const FlexibleUsageCard = styled(UsageCard)`
  width: auto; min-width: 0; flex: 1 1 0;
  @media (max-width: 720px) { flex-basis: 100%; }
`;
const Section = styled.section`display: flex; flex-direction: column; gap: 16px; width: 100%;`;
const SectionTitle = styled.h2`
  margin: 0; color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.title.weight} ${({ theme }) => theme.typography.title.size}px/${({ theme }) => theme.typography.title.lineHeight}px ${({ theme }) => theme.typography.title.family}, sans-serif;
`;
const Card = styled.section`display: flex; width: 100%; flex-direction: column; gap: 16px; padding: 24px; border-radius: ${({ theme }) => theme.radii.base}px; background: ${({ theme }) => theme.colors.surface};`;
const NotFoundHeader = styled.div`display: flex; align-items: center; gap: 12px; color: ${({ theme }) => theme.colors.primary};`;
const NotFoundTitle = styled.h2`
  margin: 0; color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.h2.weight} ${({ theme }) => theme.typography.h2.size}px/${({ theme }) => theme.typography.h2.lineHeight}px ${({ theme }) => theme.typography.h2.family}, sans-serif;
`;
const InfoRow = styled.div`
  display: flex; min-height: 44px; align-items: center; gap: 16px; width: 100%;
  @media (max-width: 560px) { gap: 12px; }
`;
const InfoIcon = styled.span`display: inline-flex; flex: 0 0 16px; color: ${({ theme }) => theme.colors.muted};`;
const InfoValue = styled.div`display: flex; min-width: 0; flex: 1 1 0; flex-direction: column; gap: 4px;`;
const InfoActions = styled.div`
  display: flex; flex: 0 0 auto; gap: 8px; margin-left: auto;
  @media (max-width: 560px) { gap: 0; }
`;
const Label = styled.span`
  color: ${({ theme }) => theme.colors.faint};
  font: ${({ theme }) => theme.typography.label.weight} ${({ theme }) => theme.typography.label.size}px/${({ theme }) => theme.typography.label.lineHeight}px ${({ theme }) => theme.typography.label.family}, sans-serif;
`;
const PlainValue = styled.span`
  overflow-wrap: anywhere; color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;
const EditorHeader = styled.div`
  display: flex; align-items: center; gap: 12px; color: ${({ theme }) => theme.colors.primary};
`;
const Code = styled.div`
  display: flex; gap: 16px; overflow-x: auto; padding: 16px; border-radius: ${({ theme }) => theme.radii.base}px; background: ${({ theme }) => theme.colors.sidebar}; color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.code.weight} ${({ theme }) => theme.typography.code.size}px/${({ theme }) => theme.typography.code.lineHeight}px ${({ theme }) => theme.typography.code.family}, monospace;
`;
const LineNumbers = styled.span`flex: 0 0 28px; color: ${({ theme }) => theme.colors.faint}; white-space: pre; user-select: none;`;
const CodeLines = styled.code`min-width: 0; flex: 1 1 auto; font: inherit; white-space: pre;`;
const CodeHelp = styled.p`
  margin: 0; color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;
const HelpText = styled.p`
  margin: 0; color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;
const ActionRow = styled.div`display: flex; justify-content: flex-end;`;
const TallErrorCard = styled(ErrorCard)`height: 276px;`;

interface Loadable<T> { value: T | null; loading: boolean; error: boolean; }
const initial = <T,>(): Loadable<T> => ({ value: null, loading: true, error: false });

function formatNumber(value: number) { return new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 2 }).format(value); }
function dateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Seoul' }).format(date);
}
const kstParts = (date: Date) => Object.fromEntries(new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'Asia/Seoul' })
  .formatToParts(date).map(part => [part.type, part.value]));
function monthDayTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const parts = kstParts(date);
  return `${parts.month}월 ${parts.day}일 ${parts.hour}:${parts.minute}`;
}
function backupTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const parts = kstParts(date);
  const sameDay = (other: Record<string, string>) => other.year === parts.year && other.month === parts.month && other.day === parts.day;
  if (sameDay(kstParts(new Date()))) return `오늘 ${parts.hour}:${parts.minute}`;
  if (sameDay(kstParts(new Date(Date.now() - 86_400_000)))) return `어제 ${parts.hour}:${parts.minute}`;
  return dateTime(value);
}
const DEMO_EXTENSION_MS = 14 * 86_400_000;
function demoExtendedExpiry(expiresAt: string) {
  const time = new Date(expiresAt).getTime();
  return new Date(Math.max(Number.isNaN(time) ? 0 : time, Date.now()) + DEMO_EXTENSION_MS).toISOString();
}
function remainingDays(value: string) {
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : Math.ceil((time - Date.now()) / 86_400_000);
}
function engineName(value: DatabaseDetail['engine']) { return value === 'mysql' ? 'MySQL' : 'PostgreSQL'; }
function sqlExample(database: DatabaseDetail) {
  if (database.engine === 'mysql') {
    const escapedName = database.connection.database.replaceAll('`', '``');
    return {
      code: `USE \`${escapedName}\`;\nSHOW TABLES;`,
      help: database.connection.database.includes('-')
        ? '이름에 하이픈이 있어서 따옴표로 감싸야 합니다. 따옴표 없이 쓰면 문법 오류가 납니다.'
        : '이름에 하이픈이 있어도 MySQL 식별자 표기법으로 감싸서 사용할 수 있습니다.',
    };
  }
  return {
    code: `SELECT table_name\nFROM information_schema.tables\nWHERE table_schema = 'public';`,
    help: 'PostgreSQL에 연결된 뒤 public 스키마의 테이블을 조회하는 예시입니다.',
  };
}
interface DemoMetrics {
  currentConnections: number | null;
  suspensionInfo: { deleteInDays: number; deleteAt: string } | null;
  unlockedAt: string | null;
  departedMembers: string[];
}
const emptyDemoMetrics: DemoMetrics = { currentConnections: null, suspensionInfo: null, unlockedAt: null, departedMembers: [] };

export default function DatabaseDetailPage() {
  const { databaseGrn = '' } = useParams();
  const navigate = useNavigate();
  const user = getSessionUser();
  const [detail, setDetail] = useState<Loadable<DatabaseDetail>>(initial);
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [backups, setBackups] = useState<Loadable<DatabaseBackup[]>>(initial);
  const [retry, setRetry] = useState(0);
  const [credential, setCredential] = useState<DatabaseCredentials | null>(null);
  const [credentialVisible, setCredentialVisible] = useState(false);
  const [credentialLoading, setCredentialLoading] = useState(false);
  const [credentialError, setCredentialError] = useState(false);
  const [isExtending, setIsExtending] = useState(false);
  const [extendError, setExtendError] = useState(false);
  const [extendedUntil, setExtendedUntil] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [demoMetrics, setDemoMetrics] = useState<DemoMetrics>(emptyDemoMetrics);

  const load = useCallback(async (signal: AbortSignal) => {
    setDetail(current => ({ ...current, loading: true, error: false }));
    setBackups(current => ({ ...current, loading: true, error: false }));
    setLoadFailed(false);
    if (isDemoMode()) {
      try {
        await simulateDemoRequest('database', signal);
      } catch (error) {
        if (signal.aborted || !(error instanceof DemoSimulatedError)) return;
        setLoadFailed(true);
        setDetail({ value: null, loading: false, error: true });
        setBackups({ value: null, loading: false, error: true });
        return;
      }
      const demo = await import('../../entities/database/demo');
      if (signal.aborted) return;
      const value = demo.getDemoDatabase(databaseGrn);
      const backupItems = value ? demo.getDemoDatabaseBackups(value.grn) : [];
      setDetail(value ? { value, loading: false, error: false } : { value: null, loading: false, error: true });
      setBackups({ value: backupItems, loading: false, error: false });
      return;
    }
    const detailRequest = getDatabase(databaseGrn, signal).then(value => {
      if (!signal.aborted) setDetail({ value, loading: false, error: false });
    }).catch(() => {
      if (!signal.aborted) setDetail({ value: null, loading: false, error: true });
    });
    const backupRequest = listDatabaseBackups(databaseGrn, signal).then(value => {
      if (!signal.aborted) setBackups({ value, loading: false, error: false });
    }).catch(() => {
      if (!signal.aborted) setBackups({ value: null, loading: false, error: true });
    });
    await Promise.all([detailRequest, backupRequest]);
  }, [databaseGrn]);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load, retry]);

  useEffect(() => {
    if (!isDemoMode()) return;
    const refresh = () => setRetry(value => value + 1);
    window.addEventListener('gsmsv:demo-database-state-change', refresh);
    return () => window.removeEventListener('gsmsv:demo-database-state-change', refresh);
  }, []);

  useEffect(() => {
    const current = detail.value;
    if (!isDemoMode() || !current) { setDemoMetrics(emptyDemoMetrics); return; }
    let active = true;
    void Promise.all([import('../../entities/database/demo'), import('../../entities/team/demo')]).then(([demo, teamDemo]) => {
      if (!active) return;
      const team = current.owner.type === 'team' ? teamDemo.getDemoTeam(current.owner.id) : undefined;
      setDemoMetrics({
        currentConnections: demo.getDemoDatabaseCurrentConnections(current.grn),
        suspensionInfo: demo.getDemoDatabaseSuspensionInfo(current.grn),
        unlockedAt: demo.getDemoDatabaseUnlockedAt(current.grn),
        departedMembers: team ? demo.getDemoDatabaseDepartedMembers(current.grn, team.members.map(member => member.name)) : [],
      });
    });
    return () => { active = false; };
  }, [detail.value]);

  useEffect(() => {
    if (isDemoMode()) {
      let cancelled = false;
      void import('../../entities/home').then(({ demoHomeTeams }) => {
        if (!cancelled) setTeams(demoHomeTeams);
      });
      return () => { cancelled = true; };
    }
    const controller = new AbortController();
    void listMyTeams(controller.signal).then(value => {
      if (!controller.signal.aborted) setTeams(value);
    }).catch(() => {
      if (!controller.signal.aborted) setTeams([]);
    });
    return () => controller.abort();
  }, []);

  const latestBackup = useMemo(() => backups.value?.reduce<DatabaseBackup | null>((latest, backup) => {
    if (!latest || new Date(backup.created_at).getTime() > new Date(latest.created_at).getTime()) return backup;
    return latest;
  }, null) ?? null, [backups.value]);
  const daysLeft = detail.value ? remainingDays(detail.value.expires_at) : null;
  const demoMode = isDemoMode();
  const currentConnections = detail.value && demoMode ? demoMetrics.currentConnections : null;
  const suspensionInfo = detail.value && demoMode ? demoMetrics.suspensionInfo : null;
  const databaseSql = detail.value ? sqlExample(detail.value) : null;
  const unlockedAt = detail.value && demoMode ? demoMetrics.unlockedAt : null;
  const departedMembers = detail.value && demoMode ? demoMetrics.departedMembers : [];
  const storageWarning = Boolean(detail.value && detail.value.storage.owner_limit_gb > 0 && detail.value.storage.owner_total_used_gb / detail.value.storage.owner_limit_gb >= 0.8);
  const memberReadOnly = Boolean(detail.value && detail.value.owner.type === 'team' && !detail.value.permissions.rotate_password && !detail.value.permissions.delete);
  const databaseListPath = (database: DatabaseDetail) => database.owner.type === 'team'
    ? `/databases?owner=${encodeURIComponent(database.owner.id)}`
    : '/databases';
  const teamPath = (database: DatabaseDetail, suffix = '') => `/teams/${encodeURIComponent(database.owner.id)}${suffix}`;
  const scopeOptions = useMemo(() => {
    const owner = detail.value?.owner;
    const roleLabels: Record<TeamRole, string> = { leader: '팀장', devops: 'DevOps', member: '팀원' };
    const options = [
      { id: 'personal', label: '내 Resources', selected: owner?.type !== 'team', onSelect: () => navigate('/databases') },
      ...teams.map(team => ({
        id: team.id,
        label: `${team.name} · ${roleLabels[team.my_role]}`,
        selected: owner?.type === 'team' && team.id === owner.id,
        onSelect: () => navigate(`/databases?owner=${encodeURIComponent(team.id)}`),
      })),
    ];
    if (owner?.type === 'team' && !options.some(option => option.id === owner.id)) {
      options.push({
        id: owner.id,
        label: `${owner.name} · 팀`,
        selected: true,
        onSelect: () => navigate(`/databases?owner=${encodeURIComponent(owner.id)}`),
      });
    }
    return options;
  }, [detail.value?.owner, navigate, teams]);
  const navigateFromShell = (item: Exclude<StudentNavigationKey, 'none'>) => {
    const current = detail.value;
    if (item === 'database') navigate(current ? databaseListPath(current) : '/databases');
    if (item === 'apps') navigate(current?.owner.type === 'team' ? teamPath(current, '/apps') : '/apps');
    if (item === 'home') navigate(current?.owner.type === 'team' ? teamPath(current) : '/');
    if (item === 'team') navigate(current?.owner.type === 'team' ? teamPath(current) : '/teams');

    return ['database', 'apps', 'home', 'team'].includes(item);
  };

  const ensureCredentials = useCallback(async () => {
    if (credential || credentialLoading) return credential;
    setCredentialLoading(true);
    setCredentialError(false);
    try {
      const value = isDemoMode()
        ? await import('../../entities/database/demo').then(demo => demo.getDemoDatabaseCredentials(databaseGrn))
        : await getDatabaseCredentials(databaseGrn);
      if (!value) throw new Error('Database credentials are unavailable');
      setCredential(value);
      return value;
    } catch {
      setCredentialError(true);
      return null;
    } finally {
      setCredentialLoading(false);
    }
  }, [credential, credentialLoading, databaseGrn]);

  const copy = async (label: string, value?: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(label);
      window.setTimeout(() => setCopiedField(current => current === label ? null : current), 1800);
    } catch { setCopiedField(null); }
  };

  const copyCredential = async (key: keyof DatabaseCredentials, label: string) => {
    const values = credential ?? await ensureCredentials();
    if (values) await copy(label, String(values[key]));
  };

  const toggleCredentialVisibility = async () => {
    if (credentialVisible) {
      setCredentialVisible(false);
      return;
    }
    if (credential || await ensureCredentials()) setCredentialVisible(true);
  };

  const extend = async () => {
    if (isExtending) return;
    setIsExtending(true);
    setExtendError(false);
    try {
      if (isDemoMode()) {
        const expiresAt = demoExtendedExpiry(detail.value?.expires_at ?? new Date().toISOString());
        const demo = await import('../../entities/database/demo');
        const status = detail.value?.status === 'suspended' ? 'active' : detail.value?.status;
        const result = demo.updateDemoDatabase(databaseGrn, { expires_at: expiresAt, ...(status ? { status } : {}) });
        if (!result) throw new Error('Database not found');
        setExtendedUntil(expiresAt);
        setDetail(current => current.value ? { ...current, value: { ...current.value, expires_at: expiresAt, ...(status ? { status } : {}) } } : current);
      } else {
        const result = await extendDatabase(databaseGrn);
        setExtendedUntil(result.expires_at);
        setDetail(current => current.value ? { ...current, value: { ...current.value, expires_at: result.expires_at } } : current);
      }
    } catch { setExtendError(true); }
    finally { setIsExtending(false); }
  };

  const copyLabel = (label: string) => copiedField === label ? '복사됨' : '복사';
  const infoRow = (icon: OcticonName, label: string, value: ReactNode, actions?: ReactNode) => (
    <InfoRow key={label}>
      <InfoIcon aria-hidden="true"><Octicon name={icon} size={16} /></InfoIcon>
      <InfoValue><Label>{label}</Label><PlainValue>{value}</PlainValue></InfoValue>
      {actions && <InfoActions>{actions}</InfoActions>}
    </InfoRow>
  );
  const copyableField = (icon: OcticonName, label: string, value: string) => infoRow(icon, label, value,
    <Button variant="ghost" icon={<Octicon name="copy" size={16} />} aria-label={`${label} 복사`} onClick={() => void copy(label, value)}>{copyLabel(label)}</Button>);
  const codeBlock = (code: string) => (
    <Code><LineNumbers aria-hidden="true">{code.split('\n').map((_, index) => index + 1).join('\n')}</LineNumbers><CodeLines>{code}</CodeLines></Code>
  );

  return (
    <StudentShell activeItem="database" scopeLabel={scopeOptions.find(option => option.selected)?.label ?? (detail.value?.owner.type === 'team' ? `${detail.value.owner.name} · 팀` : '내 Resources')} scopeOptions={scopeOptions} userName={user?.name ?? '사용자'} onNavigate={navigateFromShell} onCreateTeam={() => navigate('/teams/new')} onOpenStatus={() => navigate('/status')} onSelectScope={() => undefined} onSearch={() => undefined} onOpenNotifications={() => undefined}>
      <Page>
        <Breadcrumb type="button" onClick={() => navigate(detail.value ? databaseListPath(detail.value) : '/databases')}>Database</Breadcrumb>
        {detail.loading && !detail.value ? <LoadingCard height={300} /> : loadFailed && !detail.value ? (
          <>
            <Summary aria-label="Database 요약">
              <ErrorCard onRetry={() => setRetry(value => value + 1)} />
              <ErrorCard onRetry={() => setRetry(value => value + 1)} />
              <ErrorCard onRetry={() => setRetry(value => value + 1)} />
            </Summary>
            <TallErrorCard onRetry={() => setRetry(value => value + 1)} />
            <ErrorCard onRetry={() => setRetry(value => value + 1)} />
            <ErrorCard onRetry={() => setRetry(value => value + 1)} />
          </>
        ) : detail.error && !detail.value ? (
          <Card>
            <NotFoundHeader><Octicon name="search" size={24} /><NotFoundTitle>Database를 찾을 수 없습니다</NotFoundTitle></NotFoundHeader>
            <HelpText>삭제됐거나 볼 수 있는 권한이 없습니다. 7일 안에 삭제한 Database는 문의로 되살릴 수 있습니다.</HelpText>
            <ActionRow><Button variant="primary" icon={<Octicon name="database" size={16} />} onClick={() => navigate('/databases')}>Database 목록</Button></ActionRow>
          </Card>
        ) : detail.value && (
          <>
            <Heading>
              <Title>{detail.value.name}</Title>
              <Subtitle>{engineName(detail.value.engine)} · {detail.value.isolation === 'shared' ? '공유형' : '전용형'}</Subtitle>
            </Heading>
            <Tabs aria-label="Database 상세 메뉴">
              <Tab type="button" $active aria-current="page">접속 정보</Tab>
              {(!demoMode || detail.value.isolation === 'shared') && <Tab type="button" title={demoMode ? undefined : '쿼리 실행 API가 계약에 없어 아직 제공되지 않습니다'} disabled={!demoMode} onClick={() => navigate(`/databases/${encodeURIComponent(detail.value!.grn)}/query`)}>쿼리 콘솔</Tab>}
              <Tab type="button" onClick={() => navigate(`/databases/${encodeURIComponent(detail.value!.grn)}/backups`)}>백업</Tab>
              <Tab type="button" onClick={() => navigate(`/databases/${encodeURIComponent(detail.value!.grn)}/settings`)}>설정</Tab>
            </Tabs>
            {memberReadOnly && <Banner title="일반 팀원으로 보고 있습니다" description="접속 정보, 쿼리 콘솔, 백업 내려받기, 사용 기간 연장을 할 수 있습니다. 복원·비밀번호 교체·삭제는 팀장 또는 DevOps가 합니다." tone="neutral" icon={<Octicon name="shield" size={20} />} />}
            {detail.value.write_locked ? <Banner title="용량을 넘어 쓰기가 막혔습니다" description="읽기와 DELETE · TRUNCATE · DROP TABLE은 할 수 있습니다. 지워도 크기가 바로 줄지 않을 수 있습니다." tone="danger" icon={<Octicon name="alert" size={20} />} action={<Button variant="secondary" icon={<Octicon name="book" size={16} />} onClick={() => navigate('/docs')}>용량 줄이는 방법</Button>} />
              : storageWarning ? <Banner title="용량을 80% 넘게 쓰고 있습니다" description={`${formatNumber(detail.value.storage.owner_total_used_gb)} / ${formatNumber(detail.value.storage.owner_limit_gb)} GB · ${formatNumber(detail.value.storage.owner_limit_gb)} GB를 넘으면 쓰기가 막힙니다. 쓰지 않는 데이터를 정리해 주세요.`} tone="warning" icon={<Octicon name="alert" size={20} />} /> : null}
            {!detail.value.write_locked && unlockedAt && <Banner title="다시 쓸 수 있습니다" description={`용량이 ${formatNumber(detail.value.storage.owner_limit_gb)} GB 아래로 내려가서 쓰기 금지를 풀었습니다.`} tone="primary" icon={<Octicon name="check-circle" size={20} />} />}
            {detail.value.status === 'suspended' && <Banner title={suspensionInfo ? `정지됐습니다 · ${suspensionInfo.deleteInDays}일 뒤 삭제됩니다` : 'Database가 정지됐습니다'} description={suspensionInfo ? `${monthDayTime(detail.value.expires_at)}에 만료돼 접속이 막혔습니다. ${monthDayTime(suspensionInfo.deleteAt)} 전에 연장하면 다시 쓸 수 있습니다.` : `만료일은 ${dateTime(detail.value.expires_at)}입니다. 삭제까지 남은 기간은 API에서 제공하지 않습니다.`} tone="danger" icon={<Octicon name="clock" size={20} />} action={detail.value.permissions.extend ? <Button variant="secondary" icon={<Octicon name="calendar" size={16} />} disabled={isExtending} onClick={() => void extend()}>{isExtending ? '연장 중' : '사용 기간 연장'}</Button> : undefined} />}
            {departedMembers.length > 0 && <Banner title="비밀번호 교체를 권합니다" description={`${departedMembers.join(', ')} 님이 팀을 나갔습니다. 이 Database의 비밀번호를 알고 있을 수 있습니다.`} tone="warning" icon={<Octicon name="key" size={20} />} action={detail.value.permissions.rotate_password ? <Button variant="secondary" icon={<Octicon name="sync" size={16} />} onClick={() => navigate(`/databases/${encodeURIComponent(detail.value!.grn)}/settings`)}>비밀번호 교체</Button> : undefined} />}
            {daysLeft !== null && daysLeft >= 0 && daysLeft <= 14 && detail.value.status !== 'suspended' && <Banner title={`만료까지 ${daysLeft}일 남았습니다`} description={demoMode ? `${monthDayTime(detail.value.expires_at)}에 정지됩니다. 지금 연장하면 ${monthDayTime(demoExtendedExpiry(detail.value.expires_at))}까지 사용할 수 있습니다.` : `만료 시각은 ${dateTime(detail.value.expires_at)}입니다.`} tone="primary" icon={<Octicon name="clock" size={20} />} action={detail.value.permissions.extend ? <Button variant="secondary" icon={<Octicon name="calendar" size={16} />} disabled={isExtending} onClick={() => void extend()}>{isExtending ? '연장 중' : '사용 기간 연장'}</Button> : undefined} />}
            {extendedUntil && <Banner title="사용 기간을 연장했습니다" description={`${dateTime(extendedUntil)}까지 사용할 수 있습니다.`} tone="primary" icon={<Octicon name="check-circle" size={20} />} />}
            {extendError && <ErrorCard size="compact" onRetry={() => void extend()} />}
            <Summary aria-label="Database 요약">
              <FlexibleUsageCard label="사용 용량" icon={<Octicon name="graph" size={16} />} value={`${formatNumber(detail.value.storage.owner_total_used_gb)} / ${formatNumber(detail.value.storage.owner_limit_gb)} GB`} caption="내 Database를 모두 합해 세요" meter={{ value: detail.value.storage.owner_limit_gb > 0 ? Math.min(100, detail.value.storage.owner_total_used_gb / detail.value.storage.owner_limit_gb * 100) : 0, tone: detail.value.write_locked ? 'danger' : storageWarning ? 'warning' : 'primary', label: 'Database 전체 용량 사용량' }} />
              <FlexibleUsageCard label="동시 연결" icon={<Octicon name="link" size={16} />} value={`${currentConnections ?? '—'} / ${formatNumber(detail.value.max_connections)}`} caption={currentConnections !== null ? `계정당 ${formatNumber(detail.value.max_connections)}개까지 · 넘으면 거절됩니다` : '현재 연결 수는 API에서 제공하지 않습니다'} meter={currentConnections !== null && detail.value.max_connections > 0 ? { value: Math.min(100, currentConnections / detail.value.max_connections * 100), tone: currentConnections >= detail.value.max_connections ? 'danger' : currentConnections / detail.value.max_connections >= 0.8 ? 'warning' : 'primary', label: '동시 연결 사용량' } : undefined} />
              <FlexibleUsageCard label="최근 백업" icon={<Octicon name="history" size={16} />} value={backups.loading ? '불러오는 중' : backups.error ? '확인 불가' : latestBackup ? backupTime(latestBackup.created_at) : '백업 없음'} caption={latestBackup ? '매일 1회 · 7일 보관' : backups.error ? '백업 목록을 불러오지 못했습니다' : '매일 자동 백업 · 7일 보관'} />
            </Summary>
            <Section>
              <Card>
                <SectionTitle>접속 정보</SectionTitle>
                {copyableField('globe', '호스트', detail.value.connection.host)}
                {copyableField('link', '포트', String(detail.value.connection.port))}
                {copyableField('database', 'database', detail.value.connection.database)}
                {copyableField('person', '계정', detail.value.connection.username)}
                {detail.value.permissions.view_credentials
                  ? infoRow('key', '비밀번호', credentialVisible && credential ? credential.password : credentialLoading ? '불러오는 중…' : credentialError ? '접속 정보를 불러오지 못했습니다' : '••••••••••••', <>
                    <Button variant="ghost" icon={<Octicon name={credentialVisible ? 'eye-closed' : 'eye'} size={16} />} disabled={credentialLoading} aria-pressed={credentialVisible} onClick={() => void toggleCredentialVisibility()}>{credentialVisible ? '숨기기' : '표시'}</Button>
                    <Button variant="ghost" icon={<Octicon name="copy" size={16} />} aria-label="비밀번호 복사" disabled={credentialLoading} onClick={() => void copyCredential('password', '비밀번호')}>{copyLabel('비밀번호')}</Button>
                  </>)
                  : infoRow('key', '비밀번호', '접속 정보를 조회할 권한이 없습니다.')}
                {infoRow('shield', 'TLS', detail.value.connection.tls ? '암호화된 연결만 받습니다. 접속 도구에서 SSL/TLS를 켜 주세요.' : 'TLS를 쓰지 않습니다.')}
              </Card>
            </Section>
            <Section>
              <Card><EditorHeader><Octicon name="code" size={16} /><SectionTitle>SQL에서 이름 쓰기</SectionTitle></EditorHeader>{codeBlock(databaseSql?.code ?? '')}<CodeHelp>{databaseSql?.help}{demoMode ? '' : ' 쿼리 실행은 현재 API 계약에서 제공되지 않습니다.'}</CodeHelp></Card>
            </Section>
            <Section>
              <Card><EditorHeader><Octicon name="code" size={16} /><SectionTitle>PC의 DB 도구에서 접속하기</SectionTitle></EditorHeader>{codeBlock(`ssh -L 13306:${detail.value.connection.host}:${detail.value.connection.port} ubuntu@{VM 접속 주소} -p {SSH 포트}`)}<CodeHelp>{demoMode ? '실행한 뒤 DB 도구에서 127.0.0.1:13306으로 접속하세요. VM이 없으면 쿼리 콘솔과 백업 내려받기를 쓰세요.' : 'SSH 터널의 VM 주소·계정·포트는 이 API에서 제공하지 않습니다. DB 도구에서 터널을 연 뒤 127.0.0.1:13306으로 연결하세요.'}</CodeHelp></Card>
            </Section>
          </>
        )}
      </Page>
    </StudentShell>
  );
}
