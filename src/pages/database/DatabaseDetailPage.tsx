import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import styled from 'styled-components';
import { extendDatabase, getDatabase, getDatabaseCredentials, listDatabaseBackups } from '../../entities/database';
import type { DatabaseBackup, DatabaseCredentials, DatabaseDetail } from '../../entities/database';
import { getSessionUser } from '../../entities/session';
import { isDemoMode } from '../../shared/demo';
import { listMyTeams, type TeamRole, type TeamSummary } from '../../entities/team';
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
const Tabs = styled.nav`display: flex; width: 100%; gap: 8px;`;
const Tab = styled.button<{ $active?: boolean }>`
  display: inline-flex; min-height: 42px; align-items: center; padding: 0 12px; border: 0; border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme, $active }) => $active ? theme.colors.primarySoft : 'transparent'};
  color: ${({ theme, $active }) => $active ? theme.colors.primary : theme.colors.muted};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
  cursor: pointer;
  &:hover:not(:disabled) { background: ${({ theme, $active }) => $active ? theme.colors.primarySoft : theme.colors.overlayHover}; color: ${({ theme }) => theme.colors.text}; }
  &:focus-visible { outline: 2px solid ${({ theme }) => theme.colors.primary}; outline-offset: 2px; }
`;
const Summary = styled.section`display: flex; align-items: stretch; gap: 16px; width: 100%;`;
const FlexibleUsageCard = styled(UsageCard)`width: auto; min-width: 0; flex: 1 1 0;`;
const Section = styled.section`display: flex; flex-direction: column; gap: 16px; width: 100%;`;
const SectionTitle = styled.h2`
  margin: 0; color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.title.weight} ${({ theme }) => theme.typography.title.size}px/${({ theme }) => theme.typography.title.lineHeight}px ${({ theme }) => theme.typography.title.family}, sans-serif;
`;
const Card = styled.section`display: flex; width: 100%; flex-direction: column; gap: 16px; padding: 24px; border-radius: ${({ theme }) => theme.radii.base}px; background: ${({ theme }) => theme.colors.surface};`;
const CardHeading = styled.h3`
  margin: 0; color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.body.weight} ${({ theme }) => theme.typography.body.size}px/${({ theme }) => theme.typography.body.lineHeight}px ${({ theme }) => theme.typography.body.family}, sans-serif;
`;
const DetailGrid = styled.div`display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px 40px;`;
const Field = styled.div`display: flex; min-width: 0; flex-direction: column; gap: 6px;`;
const Label = styled.span`
  color: ${({ theme }) => theme.colors.faint};
  font: ${({ theme }) => theme.typography.label.weight} ${({ theme }) => theme.typography.label.size}px/${({ theme }) => theme.typography.label.lineHeight}px ${({ theme }) => theme.typography.label.family}, sans-serif;
`;
const PlainValue = styled.span`
  overflow-wrap: anywhere; color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.code.weight} ${({ theme }) => theme.typography.code.size}px/${({ theme }) => theme.typography.code.lineHeight}px ${({ theme }) => theme.typography.code.family}, monospace;
`;
const Code = styled.pre`
  overflow-x: auto; margin: 0; padding: 16px; border-radius: ${({ theme }) => theme.radii.base}px; background: ${({ theme }) => theme.colors.canvas}; color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.code.weight} ${({ theme }) => theme.typography.code.size}px/${({ theme }) => theme.typography.code.lineHeight}px ${({ theme }) => theme.typography.code.family}, monospace;
`;
const HelpText = styled.p`
  margin: 0; color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;
const FieldValueRow = styled.div`display: flex; align-items: center; justify-content: space-between; gap: 12px; min-width: 0;`;
const CopyButton = styled.button`
  flex: 0 0 auto; padding: 0; border: 0; background: transparent; color: ${({ theme }) => theme.colors.primary};
  font: ${({ theme }) => theme.typography.button.weight} ${({ theme }) => theme.typography.button.size}px/${({ theme }) => theme.typography.button.lineHeight}px ${({ theme }) => theme.typography.button.family}, sans-serif;
  cursor: pointer;
  &:focus-visible { outline: 2px solid ${({ theme }) => theme.colors.primary}; outline-offset: 3px; }
`;

interface Loadable<T> { value: T | null; loading: boolean; error: boolean; }
const initial = <T,>(): Loadable<T> => ({ value: null, loading: true, error: false });

function formatNumber(value: number) { return new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 2 }).format(value); }
function dateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Seoul' }).format(date);
}
function remainingDays(value: string) {
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : Math.ceil((time - Date.now()) / 86_400_000);
}
function engineName(value: DatabaseDetail['engine']) { return value === 'mysql' ? 'MySQL' : 'PostgreSQL'; }
function sqlExample(database: DatabaseDetail) {
  if (database.engine === 'mysql') {
    const escapedName = database.connection.database.replaceAll('`', '``');
    return { code: `USE \`${escapedName}\`;\nSHOW TABLES;`, help: '이름에 하이픈이 있어도 MySQL 식별자 표기법으로 감싸서 사용할 수 있습니다.' };
  }
  return {
    code: `SELECT table_name\nFROM information_schema.tables\nWHERE table_schema = 'public';`,
    help: 'PostgreSQL에 연결된 뒤 public 스키마의 테이블을 조회하는 예시입니다.',
  };
}
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
  const [demoMetrics, setDemoMetrics] = useState<{ currentConnections: number | null; suspensionInfo: { deleteInDays: number; deleteAt: string } | null }>({ currentConnections: null, suspensionInfo: null });

  const load = useCallback(async (signal: AbortSignal) => {
    setDetail(current => ({ ...current, loading: true, error: false }));
    setBackups(current => ({ ...current, loading: true, error: false }));
    if (import.meta.env.DEV && isDemoMode()) {
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
    if (!import.meta.env.DEV || !isDemoMode()) return;
    const refresh = () => setRetry(value => value + 1);
    window.addEventListener('gsmsv:demo-database-state-change', refresh);
    return () => window.removeEventListener('gsmsv:demo-database-state-change', refresh);
  }, []);

  useEffect(() => {
    const current = detail.value;
    if (!import.meta.env.DEV || !isDemoMode() || !current) { setDemoMetrics({ currentConnections: null, suspensionInfo: null }); return; }
    let active = true;
    void import('../../entities/database/demo').then(demo => {
      if (!active) return;
      setDemoMetrics({ currentConnections: demo.getDemoDatabaseCurrentConnections(current.grn), suspensionInfo: demo.getDemoDatabaseSuspensionInfo(current.grn) });
    });
    return () => { active = false; };
  }, [detail.value]);

  useEffect(() => {
    if (import.meta.env.DEV && isDemoMode()) {
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
  const demoMode = import.meta.env.DEV && isDemoMode();
  const currentConnections = detail.value && demoMode ? demoMetrics.currentConnections : null;
  const suspensionInfo = detail.value && demoMode ? demoMetrics.suspensionInfo : null;
  const databaseSql = detail.value ? sqlExample(detail.value) : null;
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
  };

  const ensureCredentials = useCallback(async () => {
    if (credential || credentialLoading) return credential;
    setCredentialLoading(true);
    setCredentialError(false);
    try {
      const value = import.meta.env.DEV && isDemoMode()
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
      if (import.meta.env.DEV && isDemoMode()) {
        const expiresAt = new Date(Date.now() + 30 * 86_400_000).toISOString();
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

  const copyableField = (label: string, value: string) => (
    <Field key={label}>
      <Label>{label}</Label>
      <FieldValueRow><PlainValue>{value}</PlainValue><CopyButton type="button" onClick={() => void copy(label, value)}>{copiedField === label ? '복사됨' : '복사'}</CopyButton></FieldValueRow>
    </Field>
  );

  return (
    <StudentShell activeItem="database" scopeLabel={detail.value?.owner.type === 'team' ? `${detail.value.owner.name} · 팀` : '내 Resources'} scopeOptions={scopeOptions} userName={user?.name ?? '사용자'} onNavigate={navigateFromShell} onCreateTeam={() => navigate('/teams/new')} onOpenStatus={() => navigate('/status')} onSelectScope={() => undefined} onSearch={() => undefined} onOpenNotifications={() => undefined}>
      <Page>
        <Breadcrumb type="button" onClick={() => navigate(detail.value ? databaseListPath(detail.value) : '/databases')}>Database</Breadcrumb>
        {detail.loading && !detail.value ? <LoadingCard height={300} /> : detail.error && !detail.value ? (
          <Card>
            <CardHeading>Database를 찾을 수 없습니다</CardHeading>
            <HelpText>삭제됐거나 볼 수 있는 권한이 없습니다. 계약상 두 경우를 구분하지 않습니다.</HelpText>
            <ErrorCard onRetry={() => setRetry(value => value + 1)} />
            <Button variant="secondary" icon={<Octicon name="arrow-left" size={16} />} onClick={() => navigate(detail.value ? databaseListPath(detail.value) : '/databases')}>Database 목록</Button>
          </Card>
        ) : detail.value && (
          <>
            <Heading>
              <Title>{detail.value.name}</Title>
              <Subtitle>{engineName(detail.value.engine)} · {detail.value.isolation === 'shared' ? '공유형' : '전용형'}</Subtitle>
            </Heading>
            <Tabs aria-label="Database 상세 메뉴">
              <Tab type="button" $active aria-current="page">접속 정보</Tab>
              <Tab type="button" title={isDemoMode() ? undefined : '쿼리 실행 API가 계약에 없어 아직 제공되지 않습니다'} disabled={!isDemoMode()} onClick={() => { if (isDemoMode()) navigate(`/databases/${encodeURIComponent(detail.value!.grn)}/query`); }}>쿼리 콘솔</Tab>
              <Tab type="button" onClick={() => navigate(`/databases/${encodeURIComponent(detail.value!.grn)}/backups`)}>백업</Tab>
              <Tab type="button" onClick={() => navigate(`/databases/${encodeURIComponent(detail.value!.grn)}/settings`)}>설정</Tab>
            </Tabs>
            {detail.value.write_locked && <Banner title="용량을 넘어 쓰기가 막혔습니다" description={`소유자 전체 사용량 ${formatNumber(detail.value.storage.owner_total_used_gb)} / ${formatNumber(detail.value.storage.owner_limit_gb)} GB입니다. 읽기 및 삭제는 데이터베이스에서 허용됩니다.`} tone="danger" icon={<Octicon name="alert" size={20} />} />}
            {detail.value.status === 'suspended' && <Banner title={suspensionInfo ? `정지됐습니다 · ${suspensionInfo.deleteInDays}일 뒤 삭제됩니다` : 'Database가 정지됐습니다'} description={suspensionInfo ? `${dateTime(detail.value.expires_at)}에 만료돼 접속이 막혔습니다. ${dateTime(suspensionInfo.deleteAt)} 전에 연장하면 다시 쓸 수 있습니다.` : `만료일은 ${dateTime(detail.value.expires_at)}입니다. 삭제까지 남은 기간은 API에서 제공하지 않습니다.`} tone="danger" icon={<Octicon name="clock" size={20} />} action={detail.value.permissions.extend ? <Button variant="secondary" disabled={isExtending} onClick={() => void extend()}>{isExtending ? '연장 중' : '사용 기간 연장'}</Button> : undefined} />}
            {daysLeft !== null && daysLeft >= 0 && daysLeft <= 14 && detail.value.status !== 'suspended' && <Banner title={`만료까지 ${daysLeft}일 남았습니다`} description={`만료 시각은 ${dateTime(detail.value.expires_at)}입니다.`} tone="primary" icon={<Octicon name="clock" size={20} />} action={detail.value.permissions.extend ? <Button variant="primary" disabled={isExtending} onClick={() => void extend()}>{isExtending ? '연장 중' : '사용 기간 연장'}</Button> : undefined} />}
            {extendedUntil && <Banner title="사용 기간을 연장했습니다" description={`${dateTime(extendedUntil)}까지 사용할 수 있습니다.`} tone="primary" icon={<Octicon name="check-circle" size={20} />} />}
            {extendError && <ErrorCard size="compact" onRetry={() => void extend()} />}
            <Summary aria-label="Database 요약">
              <FlexibleUsageCard label="사용 용량" icon={<Octicon name="graph" size={16} />} value={`${formatNumber(detail.value.storage.owner_total_used_gb)} / ${formatNumber(detail.value.storage.owner_limit_gb)} GB`} caption="내 Database를 모두 합해 세요" meter={{ value: detail.value.storage.owner_limit_gb > 0 ? Math.min(100, detail.value.storage.owner_total_used_gb / detail.value.storage.owner_limit_gb * 100) : 0, tone: detail.value.write_locked ? 'danger' : 'primary', label: 'Database 전체 용량 사용량' }} />
              <FlexibleUsageCard label="동시 연결" icon={<Octicon name="link" size={16} />} value={`${currentConnections ?? '—'} / ${formatNumber(detail.value.max_connections)}`} caption={currentConnections !== null ? `계정당 ${formatNumber(detail.value.max_connections)}개까지 · 넘으면 거절됩니다` : '현재 연결 수는 API에서 제공하지 않습니다'} />
              <FlexibleUsageCard label="최근 백업" icon={<Octicon name="history" size={16} />} value={backups.loading ? '불러오는 중' : backups.error ? '확인 불가' : latestBackup ? dateTime(latestBackup.created_at) : '백업 없음'} caption={latestBackup ? `자동 백업 · ${formatNumber(latestBackup.size_mb)} MB · 7일 보관` : backups.error ? '백업 목록을 불러오지 못했습니다' : '매일 자동 백업 · 7일 보관'} />
            </Summary>
            <Section>
              <Card>
                <SectionTitle>접속 정보</SectionTitle>
                <DetailGrid>
                  {copyableField('Host', detail.value.connection.host)}
                  {copyableField('Port', String(detail.value.connection.port))}
                  {copyableField('Database', detail.value.connection.database)}
                  {copyableField('Username', detail.value.connection.username)}
                  <Field><Label>Password</Label>{detail.value.permissions.view_credentials ? <FieldValueRow><PlainValue>{credentialVisible && credential ? credential.password : credentialLoading ? '불러오는 중…' : credentialError ? '접속 정보를 불러오지 못했습니다' : '••••••••••••'}</PlainValue><Button variant="ghost" disabled={credentialLoading} onClick={() => void toggleCredentialVisibility()}>{credentialVisible ? '숨기기' : '표시'}</Button><CopyButton type="button" disabled={credentialLoading} onClick={() => void copyCredential('password', 'Password')}>{copiedField === 'Password' ? '복사됨' : '복사'}</CopyButton></FieldValueRow> : <HelpText>접속 정보를 조회할 권한이 없습니다.</HelpText>}</Field>
                  <Field><Label>암호화</Label><PlainValue>{detail.value.connection.tls ? 'TLS 사용' : 'TLS 미사용'}</PlainValue></Field>
                </DetailGrid>
                <Banner title="암호화된 연결만 받습니다" description="접속 도구에서 SSL/TLS를 켜 주세요." tone="neutral" icon={<Octicon name="shield" size={20} />} />
              </Card>
            </Section>
            <Section>
              <Card><SectionTitle>SQL에서 이름 쓰기</SectionTitle><Code>{databaseSql?.code}</Code><HelpText>{databaseSql?.help} 쿼리 실행은 현재 API 계약에서 제공되지 않습니다.</HelpText></Card>
            </Section>
            <Section>
              <Card><SectionTitle>PC의 DB 도구에서 접속하기</SectionTitle><Code>{`ssh -L 13306:${detail.value.connection.host}:${detail.value.connection.port} ubuntu@{VM 접속 주소} -p {SSH 포트}`}</Code><HelpText>SSH 터널의 VM 주소·계정·포트는 이 API에서 제공하지 않습니다. DB 도구에서 터널을 연 뒤 127.0.0.1:13306으로 연결하세요.</HelpText></Card>
            </Section>
          </>
        )}
      </Page>
    </StudentShell>
  );
}
