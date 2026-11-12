import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import styled from 'styled-components';
import { getSessionUser } from '../../entities/session';
import { listMyTeams, type TeamRole, type TeamSummary } from '../../entities/team';
import { getNotificationSettings, updateNotificationSettings, type NotificationSettings } from '../../features/settings/notification-settings';
import { Button, Switch } from '../../shared/ui/controls';
import { Banner, ErrorCard, LoadingCard } from '../../shared/ui/feedback';
import { Octicon } from '../../shared/ui/icons';
import { ApiRequestError } from '../../shared/api';
import { StudentShell, type StudentNavigationKey } from '../../widgets/student-shell';

const Page = styled.div`
  display: flex;
  width: 100%;
  max-width: 1224px;
  flex-direction: column;
  gap: 24px;
  padding: 40px;
`;

const Breadcrumb = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.faint};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const TitleBlock = styled.div`
  display: flex;
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
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

const Panel = styled.section`
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};
`;

const PanelHeading = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
`;

const PanelTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.title.weight} ${({ theme }) => theme.typography.title.size}px/${({ theme }) => theme.typography.title.lineHeight}px ${({ theme }) => theme.typography.title.family}, sans-serif;
`;

const Rows = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) repeat(2, 180px);
  align-items: center;
  gap: 16px;
  min-height: 32px;
`;

const RowLabel = styled.span`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.label.weight} ${({ theme }) => theme.typography.label.size}px/${({ theme }) => theme.typography.label.lineHeight}px ${({ theme }) => theme.typography.label.family}, sans-serif;
  overflow-wrap: anywhere;
`;

const LockedHint = styled.span`
  color: ${({ theme }) => theme.colors.faint};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const ChannelHeader = styled.span`
  justify-self: end;
  color: ${({ theme }) => theme.colors.faint};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const ToggleCell = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const ChannelSwitch = styled(Switch)`
  position: relative;

  & > span:nth-of-type(2) {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
`;

const SaveError = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.danger};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

const StatusMessage = styled.p<{ $success?: boolean }>`
  margin: 0;
  color: ${({ theme, $success }) => $success ? theme.colors.primary : theme.colors.muted};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

const GroupHint = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.faint};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

export default function NotificationSettingsPage() {
  const navigate = useNavigate();
  const user = getSessionUser();
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [draft, setDraft] = useState<NotificationSettings['items']>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    void listMyTeams(controller.signal).then(value => {
      if (!controller.signal.aborted) setTeams(value);
    }).catch(() => {
      if (!controller.signal.aborted) setTeams([]);
    });
    return () => controller.abort();
  }, []);

  const scopeOptions = useMemo(() => {
    const roleLabels: Record<TeamRole, string> = { leader: '팀장', devops: 'DevOps', member: '팀원' };
    return [
      { id: 'personal', label: '내 Resources', selected: true, onSelect: () => navigate('/') },
      ...teams.map(team => ({
        id: team.id,
        label: `${team.name} · ${roleLabels[team.my_role]}`,
        selected: false,
        onSelect: () => navigate(`/teams/${encodeURIComponent(team.id)}`),
      })),
    ];
  }, [navigate, teams]);

  const load = useCallback(async (signal: AbortSignal) => {
    setLoading(true);
    setLoadError(false);
    try {
      const result = await getNotificationSettings(signal);
      if (!signal.aborted) {
        setSettings(result);
        setDraft(result.items);
        setLoading(false);
      }
    } catch {
      if (!signal.aborted) {
        setLoadError(true);
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load, retryKey]);

  const hasChanges = Boolean(settings && draft.some((item, index) => {
    const original = settings.items[index];
    return !original || original.email !== item.email || original.discord !== item.discord;
  }));

  const updateDraft = (group: string, channel: 'email' | 'discord', value: boolean) => {
    setDraft(items => items.map(item => item.group === group && !item.locked ? { ...item, [channel]: value } : item));
    setSaved(false);
    setSaveError(null);
  };

  const save = async () => {
    if (!settings || !hasChanges || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      const result = await updateNotificationSettings(draft.map(({ group, email, discord }) => ({ group, email, discord })));
      setSettings(current => current ? { ...current, items: result.items } : current);
      setDraft(result.items);
      setSaved(true);
    } catch (error) {
      setSaveError(error instanceof ApiRequestError && error.code === 'LOCKED_CATEGORY'
        ? '필수 알림 설정은 끌 수 없습니다. 최신 설정을 다시 불러와 주세요.'
        : '알림 설정을 저장하지 못했습니다. 변경 내용은 유지됩니다.');
    } finally {
      setSaving(false);
    }
  };

  const onNavigate = (item: Exclude<StudentNavigationKey, 'none'>) => {
    if (item === 'home') navigate('/');
    else if (item === 'database') navigate('/databases');
    else if (item === 'apps') navigate('/apps');
    else if (item === 'team') navigate('/teams');
  };

  return (
    <StudentShell
      activeItem="settings"
      scopeLabel="내 Resources"
      scopeOptions={scopeOptions}
      userName={user?.name ?? '사용자'}
      onNavigate={onNavigate}
      onCreateTeam={() => navigate('/teams/new')}
      onOpenStatus={() => navigate('/status')}
      onSelectScope={() => undefined}
      onSearch={() => undefined}
      onOpenNotifications={() => undefined}
      hasUnsavedInput={hasChanges}
    >
      <Page>
        <Breadcrumb>설정 / 알림 설정</Breadcrumb>
        <TitleBlock>
          <Title>알림 설정</Title>
          <Description>계약된 알림 그룹의 이메일 및 Discord 수신 여부를 관리합니다.</Description>
        </TitleBlock>
        <Banner
          title="이메일 수신 주소는 DataGSM에서 관리합니다"
          description={settings ? `이메일 ${settings.channels.email}${settings.channels.discord.connected ? ' · Discord 연결됨' : ' · Discord 연결 안 됨'}` : '전체 계정 설정 중 알림 수신 설정만 제공됩니다.'}
          tone="neutral"
          icon={<Octicon name="info" size={20} />}
        />

        <Panel aria-labelledby="notification-settings-title">
          <PanelHeading>
            <TitleBlock>
              <PanelTitle id="notification-settings-title">알림 받기</PanelTitle>
              <Description>필수 알림은 이메일로 계속 보냅니다. Discord를 연결하면 Discord로도 받습니다.</Description>
            </TitleBlock>
            <Button variant="primary" icon={<Octicon name="check" size={16} />} disabled={!hasChanges || saving || loading || loadError} onClick={() => void save()}>
              {saving ? '저장 중…' : '알림 설정 저장'}
            </Button>
          </PanelHeading>

          {loadError ? <ErrorCard onRetry={() => setRetryKey(value => value + 1)} /> : loading ? <LoadingCard height={220} /> : settings && (
            <>
              <Rows>
                <Row aria-hidden="true">
                  <span />
                  <ChannelHeader>이메일</ChannelHeader>
                  <ChannelHeader>Discord</ChannelHeader>
                </Row>
                {draft.map(item => <Row key={item.group}>
                  <RowLabel>
                    <span>{item.group}</span>
                    {item.locked && <LockedHint>필수 알림 · 해제할 수 없습니다</LockedHint>}
                  </RowLabel>
                  <ToggleCell><ChannelSwitch label={`${item.group} 이메일 수신`} checked={item.email} disabled={item.locked || saving} onChange={value => updateDraft(item.group, 'email', value)} /></ToggleCell>
                  <ToggleCell><ChannelSwitch label={`${item.group} Discord 수신`} checked={item.discord} disabled={item.locked || saving} onChange={value => updateDraft(item.group, 'discord', value)} /></ToggleCell>
                </Row>)}
                {draft.length === 0 && <GroupHint>설정할 알림 그룹이 없습니다.</GroupHint>}
              </Rows>
              {saveError && <SaveError role="alert">{saveError}</SaveError>}
              {saved && <StatusMessage role="status" $success>알림 설정을 저장했습니다.</StatusMessage>}
              <GroupHint>API에서 반환한 알림 그룹 이름을 그대로 표시합니다. 그룹과 알림 종류의 연결 정보는 공개 계약에 정의되어 있지 않습니다.</GroupHint>
            </>
          )}
        </Panel>
      </Page>
    </StudentShell>
  );
}
