import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import styled from 'styled-components';
import { getAppStatusDisplay } from '../../entities/app';
import { deleteApp, extendApp, getApp, updateApp, type AppDetail } from '../../features/app/manage-app';
import { getSessionUser } from '../../entities/session';
import { listMyTeams, type TeamRole, type TeamSummary } from '../../entities/team';
import { ApiRequestError } from '../../shared/api';
import { Button } from '../../shared/ui/controls';
import { Banner, ErrorCard, LoadingCard } from '../../shared/ui/feedback';
import { DeleteConfirmDialog } from '../../shared/ui/feedback/DeleteConfirmDialog';
import { Octicon } from '../../shared/ui/icons';
import { StudentShell, type StudentNavigationKey } from '../../widgets/student-shell';

const Page = styled.div`
  display: flex;
  width: 100%;
  max-width: 1224px;
  flex-direction: column;
  gap: 16px;
  padding: 28px 40px;
`;

const Breadcrumb = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.faint};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const HeadingRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
`;

const HeadingContent = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 8px;
`;

const NameInput = styled.input`
  width: min(560px, 100%);
  min-height: 34px;
  padding: 0;
  border: 0;
  border-radius: 4px;
  outline: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.h2.weight} ${({ theme }) => theme.typography.h2.size}px/${({ theme }) => theme.typography.h2.lineHeight}px ${({ theme }) => theme.typography.h2.family}, sans-serif;

  &:focus-visible { outline: 2px solid ${({ theme }) => theme.colors.primary}; outline-offset: 4px; }
  &:disabled { opacity: 1; color: ${({ theme }) => theme.colors.text}; }
`;

const Subtitle = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

const HeadingActions = styled.div`
  display: flex;
  flex: 0 0 auto;
  gap: 8px;
`;

const Tabs = styled.nav`
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 42px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const Tab = styled.button<{ $active?: boolean }>`
  min-width: 64px;
  min-height: 42px;
  padding: 0 12px;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme, $active }) => $active ? theme.colors.primarySoft : 'transparent'};
  color: ${({ theme, $active }) => $active ? theme.colors.primary : theme.colors.muted};
  font: ${({ theme }) => theme.typography.label.weight} ${({ theme }) => theme.typography.label.size}px/${({ theme }) => theme.typography.label.lineHeight}px ${({ theme }) => theme.typography.label.family}, sans-serif;
  cursor: ${({ $active }) => $active ? 'default' : 'pointer'};
`;

const Card = styled.section`
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
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

const CardCopy = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.faint};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const Table = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const TableHead = styled.div`
  display: grid;
  grid-template-columns: minmax(120px, 1fr) minmax(100px, 1fr) 160px 140px;
  align-items: center;
  gap: 16px;
  min-height: 30px;
  padding: 0 12px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.raised};
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const EnvRow = styled.div`
  display: grid;
  grid-template-columns: minmax(120px, 1fr) minmax(100px, 1fr) 160px 140px;
  align-items: center;
  gap: 16px;
  min-height: 48px;
  padding: 0 12px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

const Mono = styled.code`
  overflow: hidden;
  color: ${({ theme }) => theme.colors.faint};
  font: ${({ theme }) => theme.typography.code.weight} ${({ theme }) => theme.typography.code.size}px/${({ theme }) => theme.typography.code.lineHeight}px ${({ theme }) => theme.typography.code.family}, monospace;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const PRSettings = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const SettingRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
`;

const SettingText = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
`;

const SettingLabel = styled.strong`
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

const DisabledSwitch = styled.span`
  position: relative;
  display: inline-flex;
  width: 32px;
  height: 18px;
  flex: 0 0 32px;
  align-items: center;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.raised};
  opacity: .65;

  &::after {
    position: absolute;
    left: 3px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.faint};
    content: '';
  }
`;

const ExpiryRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 46px;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

const DeleteCard = styled(Card)`
  margin-bottom: 24px;
`;

const DeleteWarning = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const Overlay = styled.div`
  position: fixed;
  z-index: 40;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 24px;
  background: #0009;
`;

const DeleteDialogContent = styled.div`
  display: flex;
  width: 480px;
  flex-direction: column;
  gap: 12px;
`;

const DeleteFailure = styled.p`
  margin: 0;
  padding: 12px 16px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.dangerSoft};
  color: ${({ theme }) => theme.colors.danger};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

interface Loadable<T> { value: T | null; loading: boolean; error: boolean; }
const initialLoadable = <T,>(): Loadable<T> => ({ value: null, loading: true, error: false });
const roleLabel: Record<TeamRole, string> = { leader: '팀장', devops: 'DevOps', member: '팀원' };

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Seoul',
  }).format(date);
}

function getStatusLabel(status: string) {
  return getAppStatusDisplay(status).label;
}

function canExtendNow(app: AppDetail) {
  const expiresAt = Date.parse(app.expires_at);
  if (Number.isNaN(expiresAt)) return false;
  const daysRemaining = Math.ceil((expiresAt - Date.now()) / 86_400_000);
  return app.permissions.extend && daysRemaining <= 7 && daysRemaining >= -3 && app.status !== 'deleting';
}

function getApiMessage(error: unknown, fallback: string) {
  if (!(error instanceof ApiRequestError)) return fallback;
  if (error.code === 'EXTENSION_NOT_YET_AVAILABLE') return '만료 7일 전부터 사용 기간을 연장할 수 있습니다.';
  if (error.code === 'ACCESS_DENIED') return '이 작업을 수행할 권한이 없습니다.';
  if (error.code === 'CONFIRMATION_MISMATCH') return '입력한 앱 이름이 일치하지 않습니다.';
  if (error.status === null) return '네트워크 연결을 확인한 뒤 다시 시도해 주세요.';
  return fallback;
}

export default function AppSettingsPage() {
  const navigate = useNavigate();
  const { appGrn } = useParams<{ appGrn: string }>();
  const user = getSessionUser();
  const [app, setApp] = useState<Loadable<AppDetail>>(initialLoadable);
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [retryKey, setRetryKey] = useState(0);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [extending, setExtending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState('');
  const [confirmationName, setConfirmationName] = useState('');
  const [mutationMessage, setMutationMessage] = useState('');

  const loadApp = useCallback(async (signal: AbortSignal) => {
    if (!appGrn) {
      setApp({ value: null, loading: false, error: true });
      return;
    }
    setApp(current => ({ ...current, loading: true, error: false }));
    try {
      const value = await getApp(appGrn, signal);
      if (!signal.aborted) {
        setApp({ value, loading: false, error: false });
        setName(value.name);
      }
    } catch {
      if (!signal.aborted) setApp({ value: null, loading: false, error: true });
    }
  }, [appGrn]);

  useEffect(() => {
    const controller = new AbortController();
    void loadApp(controller.signal);
    return () => controller.abort();
  }, [loadApp, retryKey]);

  useEffect(() => {
    const controller = new AbortController();
    void listMyTeams(controller.signal)
      .then(value => { if (!controller.signal.aborted) setTeams(value); })
      .catch(() => { if (!controller.signal.aborted) setTeams([]); });
    return () => controller.abort();
  }, []);

  const navigateFromShell = (item: Exclude<StudentNavigationKey, 'none'>) => {
    const teamId = app.value?.owner.type === 'team' ? app.value.owner.id : undefined;
    if (item === 'home') navigate(teamId ? `/teams/${encodeURIComponent(teamId)}` : '/');
    if (item === 'team') navigate(teamId ? `/teams/${encodeURIComponent(teamId)}` : '/teams');
    if (item === 'apps') navigate(teamId ? `/teams/${encodeURIComponent(teamId)}/apps` : '/apps');
    if (item === 'database') navigate(teamId ? `/databases?owner=${encodeURIComponent(teamId)}` : '/databases');
  };

  const current = app.value;
  const scopeOptions = useMemo(() => {
    const owner = current?.owner;
    const options = [
      { id: 'personal', label: '내 Resources', selected: owner?.type !== 'team', onSelect: () => navigate('/apps') },
      ...teams.map(team => ({
        id: team.id,
        label: `${team.name} · ${roleLabel[team.my_role]}`,
        selected: owner?.type === 'team' && owner.id === team.id,
        onSelect: () => navigate(`/teams/${encodeURIComponent(team.id)}/apps`),
      })),
    ];
    if (owner?.type === 'team' && !teams.some(team => team.id === owner.id)) {
      options.push({
        id: owner.id,
        label: `${owner.name} · 팀`,
        selected: true,
        onSelect: () => navigate(`/teams/${encodeURIComponent(owner.id)}/apps`),
      });
    }
    return options;
  }, [current?.owner, navigate, teams]);
  const canSaveName = Boolean(current?.permissions.update && name.trim() && name.trim() !== current.name && name.trim().length <= 30 && !saving);
  const envLabel = useMemo(() => current ? `환경 · ${current.envs.length}개` : '환경', [current]);
  const serviceCounts = current ? `${current.services.length}개 서비스 · ${current.envs.length}개 환경 · ${current.deployments.length}개 배포 기록` : '';

  const saveName = async () => {
    if (!appGrn || !current || !canSaveName) return;
    setSaving(true);
    setMutationMessage('');
    try {
      const updated = await updateApp(appGrn, name.trim());
      setApp({ value: updated, loading: false, error: false });
      setName(updated.name);
      setMutationMessage('앱 이름을 저장했습니다.');
    } catch (error) {
      setMutationMessage(getApiMessage(error, '앱 이름을 저장하지 못했습니다.'));
    } finally {
      setSaving(false);
    }
  };

  const extendUse = async () => {
    if (!appGrn || !current || !canExtendNow(current) || extending) return;
    setExtending(true);
    setMutationMessage('');
    try {
      const updated = await extendApp(appGrn);
      setApp({ value: updated, loading: false, error: false });
      setName(updated.name);
      setMutationMessage('앱 사용 기간을 연장했습니다.');
    } catch (error) {
      setMutationMessage(getApiMessage(error, '앱 사용 기간을 연장하지 못했습니다.'));
    } finally {
      setExtending(false);
    }
  };

  const confirmDelete = async () => {
    if (!appGrn || !current?.permissions.delete || confirmationName !== current.name || deleting) return;
    setDeleting(true);
    setDeleteMessage('');
    setMutationMessage('');
    try {
      await deleteApp(appGrn, current.name);
      navigate(current.owner.type === 'team'
        ? `/teams/${encodeURIComponent(current.owner.id)}/apps`
        : '/apps');
    } catch (error) {
      setDeleteMessage(getApiMessage(error, '앱 삭제를 요청하지 못했습니다.'));
    } finally {
      setDeleting(false);
    }
  };

  const scopeLabel = current?.owner.type === 'team' ? `${current.owner.name} · 팀` : '내 Resources';

  return (
    <StudentShell
      activeItem="apps"
      scopeLabel={scopeLabel}
      scopeOptions={scopeOptions}
      userName={user?.name ?? '사용자'}
      onNavigate={navigateFromShell}
      onCreateTeam={() => navigate('/teams/new')}
      onOpenStatus={() => navigate('/status')}
      onSelectScope={() => undefined}
      onSearch={() => undefined}
      onOpenNotifications={() => undefined}
      hasUnsavedInput={Boolean((current && name !== current.name) || (deleteOpen && confirmationName))}
    >
      <Page>
        <Breadcrumb>Apps</Breadcrumb>
        {app.loading ? (
          <><LoadingCard height={156} /><LoadingCard height={225} /><LoadingCard height={220} /></>
        ) : app.error || !current ? (
          <ErrorCard onRetry={() => setRetryKey(value => value + 1)} />
        ) : <>
          <HeadingRow>
            <HeadingContent>
              <NameInput
                aria-label="앱 이름"
                value={name}
                maxLength={30}
                disabled={!current.permissions.update}
                onChange={event => { setName(event.currentTarget.value); setMutationMessage(''); }}
                onKeyDown={event => { if (event.key === 'Enter') void saveName(); }}
              />
              <Subtitle>{current.owner.name} · {getStatusLabel(current.status)}</Subtitle>
              <Tabs aria-label="앱 화면">
                <Tab type="button" onClick={() => navigate(`/apps/${encodeURIComponent(current.grn)}`)}>개요</Tab>
                <Tab type="button" $active aria-current="page">설정</Tab>
              </Tabs>
            </HeadingContent>
            <HeadingActions>
              <Button variant="primary" icon={<Octicon name="check" size={16} />} onClick={() => void saveName()} disabled={!canSaveName}>
                {saving ? '저장 중…' : '설정 저장'}
              </Button>
            </HeadingActions>
          </HeadingRow>

          {mutationMessage && <Banner title={mutationMessage} tone={mutationMessage.includes('못') || mutationMessage.includes('권한') || mutationMessage.includes('7일') ? 'warning' : 'primary'} icon={<Octicon name={mutationMessage.includes('못') ? 'alert' : 'check'} size={20} />} />}

          <Card>
            <CardHeader>
              <CardTitle>{envLabel}</CardTitle>
              <Button variant="secondary" icon={<Octicon name="plus" size={16} />} disabled title="환경 관리 API 계약이 제공되지 않습니다.">환경 추가</Button>
            </CardHeader>
            <Table role="table" aria-label="앱 환경">
              <TableHead role="row"><span role="columnheader">환경</span><span role="columnheader">브랜치</span><span role="columnheader">자동 재배포</span><span role="columnheader">작업</span></TableHead>
              {current.envs.map(environment => (
                <EnvRow role="row" key={environment.id}>
                  <span>{environment.name}</span>
                  <Mono title="브랜치 정보 API 계약 미제공">—</Mono>
                  <span>—</span>
                  <Button variant="ghost" icon={<Octicon name="pencil" size={16} />} disabled title="환경 설정 API 계약이 제공되지 않습니다.">편집</Button>
                </EnvRow>
              ))}
            </Table>
            <CardCopy>서비스·브랜치별 설정 API 계약이 제공되지 않아 환경 편집은 사용할 수 없습니다.</CardCopy>
          </Card>

          <Card>
            <CardTitle>PR 미리보기</CardTitle>
            <PRSettings>
              <SettingRow>
                <SettingText>
                  <SettingLabel>PR마다 미리보기 환경 만들기</SettingLabel>
                  <CardCopy>Pull request를 열면 기존 환경 설정으로 미리보기를 만듭니다.</CardCopy>
                </SettingText>
                <DisabledSwitch role="img" aria-label="PR 미리보기 설정 정보를 제공하는 API가 없습니다." />
              </SettingRow>
              <SettingRow>
                <SettingText>
                  <SettingLabel>봇이 연 PR은 미리보기</SettingLabel>
                  <CardCopy>봇이 연 PR은 기본으로 미리보기를 만들지 않습니다.</CardCopy>
                </SettingText>
                <DisabledSwitch role="img" aria-label="봇 PR 미리보기 설정 정보를 제공하는 API가 없습니다." />
              </SettingRow>
            </PRSettings>
            <CardCopy>PR 미리보기 설정 API 계약이 제공되지 않습니다.</CardCopy>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>사용 기간</CardTitle>
              <Button variant="secondary" icon={<Octicon name="calendar" size={16} />} onClick={() => void extendUse()} disabled={!canExtendNow(current) || extending}>
                {extending ? '연장 중…' : '사용 기간 연장'}
              </Button>
            </CardHeader>
            <ExpiryRow><Octicon name="calendar" size={16} /><span><CardCopy>만료</CardCopy>{formatDate(current.expires_at)}</span></ExpiryRow>
            <CardCopy>{canExtendNow(current) ? '연결한 Database도 앱 만료일에 맞춰 함께 연장됩니다.' : '만료 7일 전부터 만료 후 3일 이내에 사용 기간을 연장할 수 있습니다.'}</CardCopy>
          </Card>

          <DeleteCard>
            <CardHeader>
              <CardTitle>앱 삭제</CardTitle>
              <Button variant="danger" icon={<Octicon name="trashcan" size={16} />} onClick={() => { setConfirmationName(''); setDeleteMessage(''); setDeleteOpen(true); }} disabled={!current.permissions.delete}>앱 삭제</Button>
            </CardHeader>
            <DeleteWarning>
              <Octicon name="alert" size={16} />
              <span>삭제하면 {serviceCounts}가 정리됩니다. 연결된 Database는 삭제되지 않고 앱과의 연결만 끊깁니다.</span>
            </DeleteWarning>
          </DeleteCard>
        </>}
      </Page>

      {deleteOpen && current && <Overlay onMouseDown={event => { if (event.target === event.currentTarget && !deleting) setDeleteOpen(false); }}>
        <DeleteDialogContent>
          {deleteMessage && <DeleteFailure role="alert">{deleteMessage}</DeleteFailure>}
        <DeleteConfirmDialog
          open
          title="앱을 삭제할까요?"
          description="삭제 작업을 시작하면 앱이 삭제 중 상태로 바뀝니다. 삭제를 확인하려면 앱 이름을 정확히 입력해 주세요."
          items={`서비스 ${current.services.length}개 · 환경 ${current.envs.length}개 · 배포 기록 ${current.deployments.length}개`}
          fieldLabel="앱 이름 입력"
          confirmationName={current.name}
          value={confirmationName}
          onValueChange={setConfirmationName}
          onConfirm={() => void confirmDelete()}
          onCancel={() => setDeleteOpen(false)}
          confirmLabel={deleting ? '요청 중…' : '앱 삭제'}
          confirmDisabled={deleting}
          hint="앱 이름을 대소문자까지 정확히 입력해 주세요."
        />
        </DeleteDialogContent>
      </Overlay>}
    </StudentShell>
  );
}
