import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import styled from 'styled-components';
import { extendDatabase, getDatabase, getDatabaseCredentials, listDatabaseBackups } from '../../entities/database';
import type { DatabaseBackup, DatabaseCredentials, DatabaseDetail } from '../../entities/database';
import { getSessionUser } from '../../entities/session';
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
const HeadingRow = styled.div`display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; width: 100%;`;
const TitleBlock = styled.div`display: flex; min-width: 0; flex-direction: column; gap: 8px;`;
const Title = styled.h1`
  margin: 0; color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.h1.weight} ${({ theme }) => theme.typography.h1.size}px/${({ theme }) => theme.typography.h1.lineHeight}px ${({ theme }) => theme.typography.h1.family}, sans-serif;
`;
const Subtitle = styled.p`
  margin: 0; color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.body.weight} ${({ theme }) => theme.typography.body.size}px/${({ theme }) => theme.typography.body.lineHeight}px ${({ theme }) => theme.typography.body.family}, sans-serif;
`;
const Metadata = styled.div`
  display: flex; flex-wrap: wrap; align-items: center; gap: 8px;
  color: ${({ theme }) => theme.colors.faint};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;
const Dot = styled.span`width: 3px; height: 3px; border-radius: 50%; background: ${({ theme }) => theme.colors.faint};`;
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
const EmptyValue = styled.span`color: ${({ theme }) => theme.colors.faint}; font-family: ${({ theme }) => theme.typography.bodySmall.family};`;
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
function statusText(database: DatabaseDetail) {
  if (database.status === 'suspended') return '정지됨';
  if (database.status === 'creating') return '생성 중';
  if (database.status === 'deleting') return '삭제 중';
  if (database.status === 'failed') return '실패';
  return database.write_locked ? '쓰기 잠김' : '사용 중';
}

export default function DatabaseDetailPage() {
  const { databaseGrn = '' } = useParams();
  const navigate = useNavigate();
  const user = getSessionUser();
  const [detail, setDetail] = useState<Loadable<DatabaseDetail>>(initial);
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

  const load = useCallback(async (signal: AbortSignal) => {
    setDetail(current => ({ ...current, loading: true, error: false }));
    setBackups(current => ({ ...current, loading: true, error: false }));
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

  const latestBackup = useMemo(() => backups.value?.reduce<DatabaseBackup | null>((latest, backup) => {
    if (!latest || new Date(backup.created_at).getTime() > new Date(latest.created_at).getTime()) return backup;
    return latest;
  }, null) ?? null, [backups.value]);
  const daysLeft = detail.value ? remainingDays(detail.value.expires_at) : null;
  const databaseSql = detail.value ? sqlExample(detail.value) : null;
  const navigateFromShell = (item: Exclude<StudentNavigationKey, 'none'>) => { if (item === 'database') navigate('/databases'); };

  const ensureCredentials = useCallback(async () => {
    if (credential || credentialLoading) return credential;
    setCredentialLoading(true);
    setCredentialError(false);
    try {
      const value = await getDatabaseCredentials(databaseGrn);
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
      const result = await extendDatabase(databaseGrn);
      setExtendedUntil(result.expires_at);
      setDetail(current => current.value ? { ...current, value: { ...current.value, expires_at: result.expires_at } } : current);
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
    <StudentShell activeItem="database" scopeLabel="내 Resources" userName={user?.name ?? '사용자'} onNavigate={navigateFromShell} onCreateTeam={() => undefined} onOpenStatus={() => undefined} onSelectScope={() => undefined} onSearch={() => undefined} onOpenNotifications={() => undefined} onOpenProfile={() => undefined}>
      <Page>
        <Breadcrumb type="button" onClick={() => navigate('/databases')}>Database</Breadcrumb>
        {detail.loading && !detail.value ? <LoadingCard height={300} /> : detail.error && !detail.value ? (
          <Card>
            <CardHeading>Database를 찾을 수 없습니다</CardHeading>
            <HelpText>삭제됐거나 볼 수 있는 권한이 없습니다. 계약상 두 경우를 구분하지 않습니다.</HelpText>
            <ErrorCard onRetry={() => setRetry(value => value + 1)} />
            <Button variant="secondary" icon={<Octicon name="arrow-left" size={16} />} onClick={() => navigate('/databases')}>Database 목록</Button>
          </Card>
        ) : detail.value && (
          <>
            <Heading>
              <HeadingRow><TitleBlock><Title>{detail.value.name}</Title><Subtitle>{engineName(detail.value.engine)} · {detail.value.isolation === 'shared' ? '공유형' : '전용형'}</Subtitle></TitleBlock><Button variant="secondary" onClick={() => navigate('/databases')}>목록으로</Button></HeadingRow>
              <Metadata><span>{detail.value.owner.name}</span><Dot /><span>{statusText(detail.value)}</span><Dot /><span>생성 {dateTime(detail.value.created_at)}</span></Metadata>
            </Heading>
            <Tabs aria-label="Database 상세 메뉴">
              <Tab type="button" $active aria-current="page">접속 정보</Tab>
              <Tab type="button" title="쿼리 실행 API가 계약에 없어 아직 제공되지 않습니다" disabled>쿼리 콘솔</Tab>
              <Tab type="button" onClick={() => navigate(`/databases/${encodeURIComponent(detail.value!.grn)}/backups`)}>백업</Tab>
              <Tab type="button" onClick={() => navigate(`/databases/${encodeURIComponent(detail.value!.grn)}/settings`)}>설정</Tab>
            </Tabs>
            {detail.value.write_locked && <Banner title="용량을 넘어 쓰기가 막혔습니다" description={`소유자 전체 사용량 ${formatNumber(detail.value.storage.owner_total_used_gb)} / ${formatNumber(detail.value.storage.owner_limit_gb)} GB입니다. 읽기 및 삭제는 데이터베이스에서 허용됩니다.`} tone="danger" icon={<Octicon name="alert" size={20} />} />}
            {detail.value.status === 'suspended' && <Banner title="Database가 정지됐습니다" description={`만료일은 ${dateTime(detail.value.expires_at)}입니다. 삭제까지 남은 기간은 API에서 제공하지 않습니다.`} tone="danger" icon={<Octicon name="clock" size={20} />} action={detail.value.permissions.extend ? <Button variant="secondary" disabled={isExtending} onClick={() => void extend()}>{isExtending ? '연장 중' : '사용 기간 연장'}</Button> : undefined} />}
            {daysLeft !== null && daysLeft >= 0 && daysLeft <= 14 && detail.value.status !== 'suspended' && <Banner title={`만료까지 ${daysLeft}일 남았습니다`} description={`만료 시각은 ${dateTime(detail.value.expires_at)}입니다.`} tone="primary" icon={<Octicon name="clock" size={20} />} action={detail.value.permissions.extend ? <Button variant="primary" disabled={isExtending} onClick={() => void extend()}>{isExtending ? '연장 중' : '사용 기간 연장'}</Button> : undefined} />}
            {extendedUntil && <Banner title="사용 기간을 연장했습니다" description={`${dateTime(extendedUntil)}까지 사용할 수 있습니다.`} tone="primary" icon={<Octicon name="check-circle" size={20} />} />}
            {extendError && <ErrorCard size="compact" onRetry={() => void extend()} />}
            <Summary aria-label="Database 요약">
              <FlexibleUsageCard label="사용 용량" icon={<Octicon name="graph" size={16} />} value={`${formatNumber(detail.value.storage.owner_total_used_gb)} / ${formatNumber(detail.value.storage.owner_limit_gb)} GB`} caption="내 Database를 모두 합해 세요" meter={{ value: detail.value.storage.owner_limit_gb > 0 ? Math.min(100, detail.value.storage.owner_total_used_gb / detail.value.storage.owner_limit_gb * 100) : 0, tone: detail.value.write_locked ? 'danger' : 'primary', label: 'Database 전체 용량 사용량' }} />
              <FlexibleUsageCard label="동시 연결" icon={<Octicon name="link" size={16} />} value={`— / ${formatNumber(detail.value.max_connections)}`} caption="현재 연결 수는 API에서 제공하지 않습니다" />
              <FlexibleUsageCard label="최근 백업" icon={<Octicon name="history" size={16} />} value={backups.loading ? '불러오는 중' : backups.error ? '확인 불가' : latestBackup ? dateTime(latestBackup.created_at) : '백업 없음'} caption={latestBackup ? `자동 백업 · ${formatNumber(latestBackup.size_mb)} MB · 7일 보관` : backups.error ? '백업 목록을 불러오지 못했습니다' : '매일 자동 백업 · 7일 보관'} />
            </Summary>
            <Section><SectionTitle>접속 정보</SectionTitle>
              <Card>
                <CardHeading>연결 설정</CardHeading>
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
            <Section><SectionTitle>SQL에서 이름 쓰기</SectionTitle>
              <Card><CardHeading>{detail.value.engine === 'mysql' ? 'Database 선택 예시' : '테이블 조회 예시'}</CardHeading><Code>{databaseSql?.code}</Code><HelpText>{databaseSql?.help} 쿼리 실행은 현재 API 계약에서 제공되지 않습니다.</HelpText></Card>
            </Section>
            <Section><SectionTitle>SSH 터널</SectionTitle>
              <Card><CardHeading>VM을 통해 연결</CardHeading><Code>{`ssh -L 13306:${detail.value.connection.host}:${detail.value.connection.port} ubuntu@{VM 접속 주소} -p {SSH 포트}`}</Code><HelpText>SSH 터널의 VM 주소·계정·포트는 이 API에서 제공하지 않습니다. DB 도구에서 터널을 연 뒤 127.0.0.1:13306으로 연결하세요.</HelpText></Card>
            </Section>
            <Section><SectionTitle>세부 정보</SectionTitle><Card><DetailGrid><Field><Label>소유자</Label><PlainValue>{detail.value.owner.name} · {detail.value.owner.type === 'team' ? '팀' : '개인'}</PlainValue></Field><Field><Label>생성자</Label><PlainValue>{detail.value.created_by.name}</PlainValue></Field><Field><Label>생성일</Label><PlainValue>{dateTime(detail.value.created_at)}</PlainValue></Field><Field><Label>만료일</Label><PlainValue>{dateTime(detail.value.expires_at)}</PlainValue></Field><Field><Label>최근 업데이트</Label><PlainValue>{dateTime(detail.value.updated_at)}</PlainValue></Field><Field><Label>최근 백업</Label><PlainValue>{latestBackup ? dateTime(latestBackup.created_at) : backups.loading ? '불러오는 중' : backups.error ? '확인 불가' : <EmptyValue>백업 없음</EmptyValue>}</PlainValue></Field></DetailGrid></Card></Section>
          </>
        )}
      </Page>
    </StudentShell>
  );
}
