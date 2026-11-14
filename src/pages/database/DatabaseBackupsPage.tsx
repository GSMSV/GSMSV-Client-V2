import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import styled from 'styled-components';
import { downloadDatabaseBackup, getDatabase, listDatabaseBackups, restoreDatabaseBackup } from '../../entities/database';
import type { DatabaseBackup, DatabaseDetail, RestoreDatabaseBackupResponse } from '../../entities/database';
import { getSessionUser } from '../../entities/session';
import { listMyTeams, type TeamRole, type TeamSummary } from '../../entities/team';
import { isDemoMode } from '../../shared/demo';
import { Button } from '../../shared/ui/controls';
import { Banner, DeleteConfirmDialog, ErrorCard, LoadingCard } from '../../shared/ui/feedback';
import { Octicon } from '../../shared/ui/icons';
import { StudentShell, type StudentNavigationKey } from '../../widgets/student-shell';

const Page = styled.div`
  display: flex; width: 100%; max-width: 1224px; flex-direction: column; gap: 24px; padding: 40px;
`;
const Breadcrumb = styled.button`
  width: fit-content; padding: 0; border: 0; background: transparent; color: ${({ theme }) => theme.colors.faint};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
  cursor: pointer;
  &:hover { color: ${({ theme }) => theme.colors.text}; }
  &:focus-visible { outline: 2px solid ${({ theme }) => theme.colors.primary}; outline-offset: 3px; }
`;
const HeadingGroup = styled.section`display: flex; flex-direction: column; gap: 8px; width: 100%;`;
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
const Tabs = styled.nav`display: flex; width: 100%; gap: 8px;`;
const Tab = styled.button<{ $active?: boolean }>`
  display: inline-flex; min-height: 42px; align-items: center; padding: 0 12px; border: 0; border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme, $active }) => $active ? theme.colors.primarySoft : 'transparent'};
  color: ${({ theme, $active }) => $active ? theme.colors.primary : theme.colors.muted};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
  cursor: pointer;
  &:hover:not(:disabled) { background: ${({ theme, $active }) => $active ? theme.colors.primarySoft : theme.colors.overlayHover}; color: ${({ theme }) => theme.colors.text}; }
  &:disabled { opacity: 1; cursor: not-allowed; }
  &:focus-visible { outline: 2px solid ${({ theme }) => theme.colors.primary}; outline-offset: 2px; }
`;
const Section = styled.section`display: flex; width: 100%; flex-direction: column; gap: 16px;`;
const BackupCard = styled.section`display: flex; width: 100%; min-height: 416px; flex-direction: column; gap: 16px; padding: 24px; border-radius: ${({ theme }) => theme.radii.base}px; background: ${({ theme }) => theme.colors.surface};`;
const BackupError = styled(ErrorCard)`width: 100%; height: 416px; background: ${({ theme }) => theme.colors.surface};`;
const CardHeading = styled.h2`
  margin: 0; color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.title.weight} ${({ theme }) => theme.typography.title.size}px/${({ theme }) => theme.typography.title.lineHeight}px ${({ theme }) => theme.typography.title.family}, sans-serif;
`;
const Accent = styled.span`color: ${({ theme }) => theme.colors.primary};`;
const TableScroll = styled.div`width: 100%; max-height: 310px; overflow: auto;`;
const Table = styled.table`
  width: 100%; min-width: 900px; border-collapse: collapse; table-layout: fixed;
  th { position: sticky; top: 0; z-index: 1; height: 42px; padding: 12px; background: ${({ theme }) => theme.colors.raised}; color: ${({ theme }) => theme.colors.muted}; text-align: left; font: ${({ theme }) => theme.typography.label.weight} ${({ theme }) => theme.typography.label.size}px/${({ theme }) => theme.typography.label.lineHeight}px ${({ theme }) => theme.typography.label.family}, sans-serif; }
  th:first-child { width: 200px; border-radius: ${({ theme }) => theme.radii.base}px 0 0 ${({ theme }) => theme.radii.base}px; }
  th:nth-child(2) { width: 34.3%; }
  th:nth-child(3) { width: 200px; }
  th:last-child { width: 320px; border-radius: 0 ${({ theme }) => theme.radii.base}px ${({ theme }) => theme.radii.base}px 0; }
  td { height: 66px; padding: 12px; border-bottom: 1px solid ${({ theme }) => theme.colors.border}; color: ${({ theme }) => theme.colors.text}; vertical-align: middle; font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif; }
  tbody tr:hover { background: ${({ theme }) => theme.colors.overlayHover}; }
  td:nth-child(2) { color: ${({ theme }) => theme.colors.muted}; }
`;
const Actions = styled.div`display: flex; align-items: center; gap: 8px;`;
const QuietAction = styled(Button)`padding-right: 10px; padding-left: 10px;`;
const EmptyState = styled.div`display: grid; min-height: 330px; flex: 1; place-items: center; color: ${({ theme }) => theme.colors.muted}; text-align: center;`;
const NoticeCopy = styled.div`display: flex; flex-direction: column; gap: 8px; width: 100%;`;
const NoticeTitle = styled.p`
  margin: 0; color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;
const NoticeDescription = styled.p`
  margin: 0; color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;
const RestoreOverlay = styled.div`
  position: fixed; z-index: 1000; inset: 0; display: grid; place-items: center; padding: 24px;
  background: rgba(0, 0, 0, 0.45);
`;
const DialogWrap = styled.div`width: min(480px, 100%); & > section { width: 100%; }`;
const ModalItems = styled.div`display: flex; flex-direction: column; gap: 4px;`;
const RestoreError = styled.span`
  color: ${({ theme }) => theme.colors.danger};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;
const OperationDetails = styled.div`
  display: flex; flex-direction: column; gap: 4px; padding: 12px 16px; border-radius: ${({ theme }) => theme.radii.base}px; background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.muted}; font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;
const ScreenReaderOnly = styled.span`
  position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap;
`;

interface Loadable<T> { value: T | null; loading: boolean; error: boolean; }
const initial = <T,>(): Loadable<T> => ({ value: null, loading: true, error: false });

function dateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Seoul' }).format(date);
}
function fileSize(value: number) {
  return value >= 1024 ? `${(value / 1024).toFixed(1)} GB` : `${new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 1 }).format(value)} MB`;
}
function backupKind(kind: DatabaseBackup['kind']) { return kind === 'pre_restore' ? '복원 직전' : '매일 자동'; }

export default function DatabaseBackupsPage() {
  const { databaseGrn = '' } = useParams();
  const navigate = useNavigate();
  const user = getSessionUser();
  const [detail, setDetail] = useState<Loadable<DatabaseDetail>>(initial);
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [backups, setBackups] = useState<Loadable<DatabaseBackup[]>>(initial);
  const [retryKey, setRetryKey] = useState(0);
  const [selectedBackup, setSelectedBackup] = useState<DatabaseBackup | null>(null);
  const [confirmName, setConfirmName] = useState('');
  const [restoreError, setRestoreError] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoreOperation, setRestoreOperation] = useState<RestoreDatabaseBackupResponse | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [failedDownloadBackup, setFailedDownloadBackup] = useState<DatabaseBackup | null>(null);

  const load = useCallback(async (signal: AbortSignal) => {
    setDetail(current => ({ ...current, loading: true, error: false }));
    setBackups(current => ({ ...current, loading: true, error: false }));
    if (import.meta.env.DEV && isDemoMode()) {
      const demo = await import('../../entities/database/demo');
      if (signal.aborted) return;
      const value = demo.getDemoDatabase(databaseGrn);
      setDetail(value ? { value, loading: false, error: false } : { value: null, loading: false, error: true });
      setBackups({ value: value ? demo.getDemoDatabaseBackups(value.grn) : [], loading: false, error: false });
      return;
    }
    const detailRequest = getDatabase(databaseGrn, signal).then(value => {
      if (!signal.aborted) setDetail({ value, loading: false, error: false });
    }).catch(() => {
      if (!signal.aborted) setDetail({ value: null, loading: false, error: true });
    });
    const backupsRequest = listDatabaseBackups(databaseGrn, signal).then(value => {
      if (!signal.aborted) setBackups({ value, loading: false, error: false });
    }).catch(() => {
      if (!signal.aborted) setBackups({ value: null, loading: false, error: true });
    });
    await Promise.all([detailRequest, backupsRequest]);
  }, [databaseGrn]);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load, retryKey]);

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

  useEffect(() => {
    if (!selectedBackup) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape' && !restoring) setSelectedBackup(null); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedBackup, restoring]);

  const sortedBackups = useMemo(() => [...(backups.value ?? [])].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()), [backups.value]);
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

  const download = async (backup: DatabaseBackup) => {
    if (downloadingId) return;
    setDownloadingId(backup.id);
    setFailedDownloadBackup(null);
    try {
      const blob = import.meta.env.DEV && isDemoMode()
        ? new Blob([`-- Local demo backup: ${backup.id}\n-- Database: ${detail.value?.name ?? databaseGrn}\nSELECT 1;\n`], { type: 'application/gzip' })
        : await downloadDatabaseBackup(databaseGrn, backup.id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${backup.id}.sql.gz`;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setFailedDownloadBackup(null);
    } catch { setFailedDownloadBackup(backup); }
    finally { setDownloadingId(null); }
  };

  const restore = async () => {
    if (!selectedBackup || !detail.value || confirmName !== detail.value.name || restoring) return;
    setRestoring(true);
    setRestoreError(false);
    try {
      let result: RestoreDatabaseBackupResponse;
      if (import.meta.env.DEV && isDemoMode()) {
        const demo = await import('../../entities/database/demo');
        const preRestoreId = `pre-restore-${crypto.randomUUID()}`;
        demo.addDemoPreRestoreBackup(databaseGrn, {
          id: preRestoreId,
          kind: 'pre_restore',
          created_at: new Date().toISOString(),
          size_mb: detail.value.storage.used_gb * 128,
          expires_at: new Date(Date.now() + 7 * 86_400_000).toISOString(),
        });
        result = {
          operation: { id: `demo-op-${crypto.randomUUID()}`, type: 'restore', status: 'queued' },
          resource: { grn: detail.value.grn },
          pre_restore_backup: { id: preRestoreId },
        };
        setBackups(current => current.value
          ? { ...current, value: demo.getDemoDatabaseBackups(databaseGrn) }
          : current);
      } else {
        result = await restoreDatabaseBackup(databaseGrn, selectedBackup.id, confirmName);
      }
      setRestoreOperation(result);
      setSelectedBackup(null);
      setConfirmName('');
    } catch { setRestoreError(true); }
    finally { setRestoring(false); }
  };

  const openRestore = (backup: DatabaseBackup) => {
    setSelectedBackup(backup);
    setConfirmName('');
    setRestoreError(false);
  };

  const downloadAllowed = Boolean(detail.value?.permissions.read_backup);
  const restoreAllowed = Boolean(detail.value?.permissions.restore_backup);
  const backupTable = backups.value && backups.value.length > 0;

  return (
    <StudentShell activeItem="database" scopeLabel={detail.value?.owner.type === 'team' ? `${detail.value.owner.name} · 팀` : '내 Resources'} scopeOptions={scopeOptions} userName={user?.name ?? '사용자'} onNavigate={navigateFromShell} onCreateTeam={() => navigate('/teams/new')} onOpenStatus={() => navigate('/status')} onSelectScope={() => undefined} onSearch={() => undefined} onOpenNotifications={() => undefined} hasUnsavedInput={Boolean(selectedBackup && confirmName)}>
      <Page>
        <Breadcrumb type="button" onClick={() => navigate(detail.value ? databaseListPath(detail.value) : '/databases')}>Database</Breadcrumb>
        {detail.loading && !detail.value ? <LoadingCard width="100%" height={416} /> : detail.error || !detail.value ? (
          <BackupError onRetry={() => setRetryKey(value => value + 1)} />
        ) : <>
          <HeadingGroup><HeadingRow><TitleBlock><Title>{detail.value.name}</Title><Subtitle>{detail.value.engine === 'mysql' ? 'MySQL' : 'PostgreSQL'} · {detail.value.isolation === 'shared' ? '공유형' : '전용형'}</Subtitle></TitleBlock></HeadingRow></HeadingGroup>
          <Tabs aria-label="Database 상세 메뉴">
            <Tab type="button" onClick={() => navigate(`/databases/${encodeURIComponent(detail.value!.grn)}`)}>접속 정보</Tab>
            <Tab type="button" title="쿼리 실행 API가 계약에 없어 아직 제공되지 않습니다" disabled>쿼리 콘솔</Tab>
            <Tab type="button" $active aria-current="page">백업</Tab>
            <Tab type="button" onClick={() => navigate(`/databases/${encodeURIComponent(detail.value!.grn)}/settings`)}>설정</Tab>
          </Tabs>
          <Banner title="매일 한 번 백업하고 7일 동안 보관합니다" description="복원하면 지금 데이터를 덮어씁니다. 덮어쓰기 전 상태는 「복원 직전」 백업으로 먼저 남깁니다." tone="neutral" icon={<Octicon name="history" size={20} />} />
          <Section>
            {backups.loading ? <LoadingCard width="100%" height={416} /> : backups.error || !backups.value ? <BackupError onRetry={() => setRetryKey(value => value + 1)} /> : (
              <BackupCard>
                <CardHeading>백업 · <Accent>{backups.value.length}개</Accent></CardHeading>
                {failedDownloadBackup && <ErrorCard size="compact" onRetry={() => void download(failedDownloadBackup)} />}
                {backupTable ? <TableScroll><Table aria-label="Database 백업 목록"><thead><tr><th scope="col">종류</th><th scope="col">만든 시각</th><th scope="col">크기</th><th scope="col">관리</th></tr></thead>
                  <tbody>{sortedBackups.map(backup => <tr key={backup.id}>
                    <td>{backupKind(backup.kind)}</td><td>{dateTime(backup.created_at)}</td><td>{fileSize(backup.size_mb)}</td>
                    <td><Actions>
                      {downloadAllowed && <QuietAction variant="ghost" icon={<Octicon name="download" size={16} />} disabled={downloadingId !== null} onClick={() => void download(backup)}>{downloadingId === backup.id ? '내려받는 중' : '내려받기'}</QuietAction>}
                      {restoreAllowed && <QuietAction variant="ghost" icon={<Octicon name="history" size={16} />} onClick={() => openRestore(backup)}>복원</QuietAction>}
                      {!downloadAllowed && !restoreAllowed && <ScreenReaderOnly>사용 가능한 작업이 없습니다</ScreenReaderOnly>}
                    </Actions></td>
                  </tr>)}</tbody></Table></TableScroll> : <EmptyState>아직 백업이 없습니다.</EmptyState>}
              </BackupCard>
            )}
          </Section>
          {restoreOperation && <OperationDetails role="status"><strong>복원을 시작했습니다</strong><span>상태: {restoreOperation.operation.status} · 작업 ID: {restoreOperation.operation.id}</span><span>복원 전 백업: {restoreOperation.pre_restore_backup.id}</span><span>완료 여부는 서버 작업 상태에서 확인할 수 있습니다.</span></OperationDetails>}
          <NoticeCopy><NoticeTitle>삭제한 Database의 백업도 7일 동안 남습니다</NoticeTitle><NoticeDescription>그 안에 문의를 남기면 관리자가 되살려 드립니다. 7일이 지나면 백업도 지워집니다.</NoticeDescription></NoticeCopy>
        </>}
      </Page>
      {selectedBackup && detail.value && <RestoreOverlay onMouseDown={event => { if (event.target === event.currentTarget && !restoring) setSelectedBackup(null); }}>
        <DialogWrap>
          <DeleteConfirmDialog
            open
            title={`${dateTime(selectedBackup.created_at)} 백업으로 되돌리시겠습니까?`}
            description="지금 데이터를 이 백업으로 덮어씁니다. 덮어쓰기 전 상태는 「복원 직전」 백업으로 먼저 남깁니다."
            items={<ModalItems><span>· 백업 시각 {dateTime(selectedBackup.created_at)}</span><span>· 크기 {fileSize(selectedBackup.size_mb)}</span>{restoreError && <RestoreError role="alert">복원을 시작하지 못했습니다. 다시 시도해 주세요.</RestoreError>}</ModalItems>}
            fieldLabel="확인하려면 Database 이름을 입력하세요"
            confirmationName={detail.value.name}
            value={confirmName}
            onValueChange={setConfirmName}
            onConfirm={() => void restore()}
            onCancel={() => { if (!restoring) setSelectedBackup(null); }}
            caption="복원하는 동안 접속이 잠깐 끊깁니다."
            confirmLabel={restoring ? '복원 중' : '복원'}
            confirmIcon={<Octicon name="history" size={16} />}
            confirmDisabled={restoring}
          />
        </DialogWrap>
      </RestoreOverlay>}
    </StudentShell>
  );
}
