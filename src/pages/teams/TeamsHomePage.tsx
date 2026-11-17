import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import styled from 'styled-components';
import { listTeamApps } from '../../entities/app';
import { listDatabases } from '../../entities/database';
import { getTeam, listMyTeams, type TeamDetail, type TeamRole, type TeamSummary, type TeamQuotaUsage } from '../../entities/team';
import type { DemoVm } from '../../entities/vm';
import { getSessionUser } from '../../entities/session';
import { isDemoMode, simulateDemoRequest } from '../../shared/demo';
import type { DemoTeamDetail } from '../../entities/team/demo';
import { AccountDialog } from '../../features/settings/demo-account/ui/AccountDialog';
import { TeamQuotaRequestDialog } from '../../features/team/request-quota';
import { listTeamInvitations, type TeamInvitation } from '../../features/team/manage-invitations';
import { Button } from '../../shared/ui/controls';
import { UsageCard } from '../../shared/ui/data-display';
import { Banner, ErrorCard, LoadingCard } from '../../shared/ui/feedback';
import { Octicon } from '../../shared/ui/icons';
import { StudentShell, type StudentNavigationKey } from '../../widgets/student-shell';

const Page = styled.div`
  box-sizing: border-box;
  display: flex;
  width: 100%;
  max-width: 1224px;
  flex-direction: column;
  gap: 24px;
  padding: 40px;
  container: team-home / inline-size;

  @media (max-width: 960px) { padding: 24px; }
  @media (max-width: 600px) { padding: 16px; gap: 20px; }
`;

const Breadcrumb = styled.p`
  width: 100%;
  margin: 0;
  color: ${({ theme }) => theme.colors.faint};
  font: 400 12px/18px ${({ theme }) => theme.typography.body.family}, sans-serif;
`;

const Heading = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;

  @container team-home (max-width: 760px) {
    align-items: flex-start;
    flex-direction: column;
    gap: 16px;
  }
`;

const TitleBlock = styled.div`
  display: flex;
  min-width: 0;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 8px;
`;

const Title = styled.h1`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.h1.weight} ${({ theme }) => theme.typography.h1.size}px/${({ theme }) => theme.typography.h1.lineHeight}px ${({ theme }) => theme.typography.h1.family}, sans-serif;
`;

const Subtitle = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.body.weight} ${({ theme }) => theme.typography.body.size}px/${({ theme }) => theme.typography.body.lineHeight}px ${({ theme }) => theme.typography.body.family}, sans-serif;
`;

const MemberCount = styled.strong`
  color: ${({ theme }) => theme.colors.primary};
  font-weight: 500;
`;

const TeamWarning = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.warning};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const Actions = styled.div`
  display: flex;
  min-width: 0;
  flex: 0 0 auto;
  flex-wrap: wrap;
  gap: 8px;
`;

const QuotaPanel = styled.section`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  padding: 24px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};

  @container team-home (max-width: 560px) { padding: 16px; }
`;

const SectionHeading = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
`;

const SectionTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.title.weight} ${({ theme }) => theme.typography.title.size}px/${({ theme }) => theme.typography.title.lineHeight}px ${({ theme }) => theme.typography.title.family}, sans-serif;
`;

const QuotaRows = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const QuotaRow = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 8px 16px;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const QuotaValue = styled.span<{ $tone?: 'warning' | 'danger' }>`
  color: ${({ theme, $tone }) => $tone === 'danger' ? theme.colors.danger : $tone === 'warning' ? theme.colors.warning : theme.colors.muted};
`;

const MeterTrack = styled.div`
  grid-column: 1 / -1;
  height: 6px;
  overflow: hidden;
  border-radius: 3px;
  background: ${({ theme }) => theme.colors.raised};
`;

const MeterFill = styled.div<{ $value: number; $tone: 'primary' | 'warning' | 'danger' }>`
  width: ${({ $value }) => `${Math.max(0, Math.min($value, 100))}%`};
  height: 100%;
  border-radius: inherit;
  background: ${({ theme, $tone }) => $tone === 'danger' ? theme.colors.danger : $tone === 'warning' ? theme.colors.warning : theme.colors.primary};
`;

const QuotaFoot = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  color: ${({ theme }) => theme.colors.faint};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;

  @container team-home (max-width: 700px) {
    align-items: flex-start;
    flex-direction: column;
  }
`;

const VmPanel = styled.section`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  padding: 24px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};

  @container team-home (max-width: 560px) { padding: 16px; }
`;

const VmTable = styled.div`
  display: grid;
  grid-template-columns: 1.15fr 0.75fr 1.35fr 1fr 1fr 56px;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 16px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.raised};
  color: ${({ theme }) => theme.colors.faint};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;

  @container team-home (max-width: 700px) { display: none; }
`;

const VmNotice = styled.div`
  display: flex;
  min-height: 74px;
  align-items: center;
  justify-content: center;
  padding: 16px;
  border: 1px dashed ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.base}px;
  color: ${({ theme }) => theme.colors.faint};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
  text-align: center;
`;

const VmDataRow = styled.div`
  display: grid;
  grid-template-columns: 1.15fr 0.75fr 1.35fr 1fr 1fr 56px;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 58px;
  padding: 8px 16px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;

  &:last-child { border-bottom: 0; }

  @container team-home (max-width: 700px) {
    grid-template-columns: minmax(0, 1fr);
    gap: 10px;
    padding: 16px 0;
  }
`;

const VmCell = styled.div`
  min-width: 0;
  overflow-wrap: anywhere;

  @container team-home (max-width: 700px) {
    display: grid;
    grid-template-columns: minmax(84px, 0.35fr) minmax(0, 1fr);
    align-items: start;
    gap: 8px;
    color: ${({ theme }) => theme.colors.text};

    &::before {
      content: attr(data-label);
      color: ${({ theme }) => theme.colors.faint};
    }
  }
`;

const VmNameButton = styled.button`
  justify-self: start;
  border: 0;
  padding: 0;
  background: transparent;
  color: ${({ theme }) => theme.colors.primary};
  font: inherit;
  text-align: left;
  cursor: pointer;

  &:focus-visible { outline: 2px solid ${({ theme }) => theme.colors.primary}; outline-offset: 3px; }
`;

const ServiceSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
`;

const ServiceCards = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;

  @container team-home (max-width: 900px) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  @container team-home (max-width: 600px) { grid-template-columns: minmax(0, 1fr); }
`;

const DatabaseUsageCard = styled(UsageCard)`
  width: 100%;
`;

const ServiceCard = styled.article`
  display: flex;
  min-height: 130px;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};
`;

const ServiceCardLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const ServiceCount = styled.strong`
  color: ${({ theme }) => theme.colors.faint};
  font: ${({ theme }) => theme.typography.h2.weight} ${({ theme }) => theme.typography.h2.size}px/${({ theme }) => theme.typography.h2.lineHeight}px ${({ theme }) => theme.typography.h2.family}, sans-serif;
`;

const MutedCaption = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.faint};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const BottomGrid = styled.div`
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  align-items: start;
  gap: 16px;
  width: 100%;

  @container team-home (max-width: 760px) { grid-template-columns: minmax(0, 1fr); }
`;

const MemberPanel = styled.section`
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  padding: 24px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};

  @container team-home (max-width: 560px) { padding: 16px; }
`;

const MemberList = styled.ul`
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;
`;

const Member = styled.li`
  display: flex;
  min-height: 56px;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.text};
`;

const MemberIcon = styled.span`
  display: inline-flex;
  width: 20px;
  height: 20px;
  flex: 0 0 20px;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.muted};
`;

const MemberCopy = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
`;

const MemberName = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

const MemberRole = styled.span`
  color: ${({ theme }) => theme.colors.faint};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const EmptyState = styled.section`
  display: flex;
  width: min(100%, 512px);
  flex-direction: column;
  gap: 12px;
  margin: 0 auto;
  padding: 24px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};
`;

const EmptyTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.h2.weight} ${({ theme }) => theme.typography.h2.size}px/${({ theme }) => theme.typography.h2.lineHeight}px ${({ theme }) => theme.typography.h2.family}, sans-serif;
`;

const EmptyCopy = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const DotList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 0;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
  list-style: none;
`;

const EmptyActions = styled.div`
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
`;

const SkeletonStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
`;

const SkeletonServices = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;

  @container team-home (max-width: 900px) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  @container team-home (max-width: 600px) { grid-template-columns: minmax(0, 1fr); }
`;

// Figma 25 승인 대기: 요약 카드 3개 + 팀원 표 + 팀 VM 만들기 안내 카드.
const PendingStats = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;

  @container team-home (max-width: 760px) { grid-template-columns: minmax(0, 1fr); }
`;

const PendingStat = styled.article`
  display: flex;
  min-width: 0;
  min-height: 150px;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};
`;

const PendingStatLabel = styled.span`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.label.weight} ${({ theme }) => theme.typography.label.size}px/${({ theme }) => theme.typography.label.lineHeight}px ${({ theme }) => theme.typography.label.family}, sans-serif;
`;

const PendingStatValue = styled.strong`
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.h2.weight} ${({ theme }) => theme.typography.h2.size}px/${({ theme }) => theme.typography.h2.lineHeight}px ${({ theme }) => theme.typography.h2.family}, sans-serif;
`;

const PendingMemberTable = styled.div`
  width: 100%;
  overflow-x: auto;
`;

const PendingMemberGrid = styled.div<{ $header?: boolean }>`
  display: grid;
  min-width: 560px;
  grid-template-columns: 1.2fr 1fr 1.1fr 0.8fr;
  align-items: center;
  min-height: ${({ $header }) => $header ? '36px' : '46px'};
  padding: 0 12px;
  border-radius: ${({ theme, $header }) => $header ? `${theme.radii.base}px` : '0'};
  border-bottom: ${({ theme, $header }) => $header ? '0' : `1px solid ${theme.colors.border}`};
  background: ${({ theme, $header }) => $header ? theme.colors.raised : 'transparent'};
  color: ${({ theme, $header }) => $header ? theme.colors.faint : theme.colors.muted};
  font: ${({ theme, $header }) => $header
    ? `${theme.typography.caption.weight} ${theme.typography.caption.size}px/${theme.typography.caption.lineHeight}px ${theme.typography.caption.family}`
    : `${theme.typography.bodySmall.weight} ${theme.typography.bodySmall.size}px/${theme.typography.bodySmall.lineHeight}px ${theme.typography.bodySmall.family}`}, sans-serif;

  > span:first-child { color: ${({ theme, $header }) => $header ? theme.colors.faint : theme.colors.text}; }
`;

const PendingTone = styled.span<{ $tone: 'primary' | 'warning' }>`
  color: ${({ theme, $tone }) => $tone === 'primary' ? theme.colors.primary : theme.colors.warning};
`;

const PendingVmCard = styled.section`
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.muted};

  @container team-home (max-width: 600px) {
    grid-template-columns: 20px minmax(0, 1fr);
    > button { grid-column: 1 / -1; justify-self: start; }
  }
`;

const PendingVmCopy = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;

  strong { color: ${({ theme }) => theme.colors.text}; font: 500 14px/20px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif; }
  span { font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif; }
`;

function formatKoreanDate(value: string | null | undefined, withTime: boolean) {
  if (!value) return null;
  const date = new Date(value.length === 10 ? `${value}T00:00:00+09:00` : value);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(date);
  const part = (type: string) => parts.find(item => item.type === type)?.value ?? '';
  const day = `${part('year')}년 ${part('month')}월 ${part('day')}일`;
  return withTime && value.length > 10 ? `${day} ${part('hour')}:${part('minute')}` : day;
}

function formatDotDate(value: string | null | undefined) {
  if (!value) return '—';
  const date = new Date(value.length === 10 ? `${value}T00:00:00+09:00` : value);
  if (Number.isNaN(date.getTime())) return '—';
  const parts = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const part = (type: string) => parts.find(item => item.type === type)?.value ?? '';
  return `${part('year')}.${part('month')}.${part('day')}`;
}

function formatMonthDay(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: 'long', day: 'numeric' }).format(date);
}

interface Loadable<T> { value: T | null; loading: boolean; error: boolean; }
const initialLoadable = <T,>(): Loadable<T> => ({ value: null, loading: true, error: false });

const roleLabel: Record<TeamRole, string> = {
  leader: '팀장',
  devops: 'DevOps 엔지니어',
  member: '일반 팀원',
};

function quotaState(quota: TeamQuotaUsage | undefined) {
  if (!quota) return { value: '—', percent: 0, tone: 'primary' as const, unavailable: true };
  const percent = quota.limit > 0 ? quota.used / quota.limit * 100 : quota.used > 0 ? 100 : 0;
  // Figma 32: 한도를 모두 쓴 vCPU(4/4)는 경고색, 한도를 넘었을 때만 위험색이다.
  const tone = percent > 100 ? 'danger' as const : percent >= 100 ? 'warning' as const : 'primary' as const;
  return { value: `${quota.used} / ${quota.limit}`, percent, tone, unavailable: false };
}

function QuotaLine({ label, usage, suffix = '' }: { label: string; usage: TeamQuotaUsage | undefined; suffix?: string }) {
  const state = quotaState(usage);
  return (
    <QuotaRow>
      <span>{label}</span>
      <QuotaValue $tone={state.tone === 'danger' ? 'danger' : state.tone === 'warning' ? 'warning' : undefined}>
        {state.unavailable ? '—' : `${state.value}${suffix}`}
      </QuotaValue>
      <MeterTrack aria-label={`${label} 사용량`}>
        {usage && <MeterFill $value={state.percent} $tone={state.tone} />}
      </MeterTrack>
    </QuotaRow>
  );
}

interface TeamDatabaseUsage {
  count: number;
  storageGb: number;
  dedicatedCount: number;
}

const databaseStorageFormat = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 2 });

function TeamDatabaseCard({ teamId }: { teamId: string }) {
  const [usage, setUsage] = useState<TeamDatabaseUsage | null>();

  useEffect(() => {
    if (isDemoMode()) {
      setUsage(teamId === 'demo-team' ? { count: 1, storageGb: 3.2, dedicatedCount: 0 } : { count: 0, storageGb: 0, dedicatedCount: 0 });
      return;
    }
    const controller = new AbortController();
    void listDatabases({ owner: teamId, signal: controller.signal }).then(databases => {
      if (controller.signal.aborted) return;
      setUsage({
        count: databases.length,
        storageGb: databases.reduce((total, database) => total + database.storage.used_gb, 0),
        dedicatedCount: databases.filter(database => database.isolation === 'dedicated').length,
      });
    }).catch(() => {
      if (!controller.signal.aborted) setUsage(null);
    });
    return () => controller.abort();
  }, [teamId]);

  const loading = usage === undefined;
  const caption = usage
    ? `용량 ${databaseStorageFormat.format(usage.storageGb)} / — GB · 전용형 ${usage.dedicatedCount}개`
    : loading ? '사용량을 불러오는 중…' : '사용량 정보 없음';

  return (
    <DatabaseUsageCard
      label="Database"
      icon={<Octicon name="database" size={16} />}
      value={<span aria-busy={loading}>{usage?.count ?? '—'} / —</span>}
      caption={<span role="status">{caption}</span>}
    />
  );
}

function TeamAppsCard({ teamId }: { teamId: string }) {
  const [count, setCount] = useState<number | null>();

  useEffect(() => {
    if (isDemoMode()) {
      let cancelled = false;
      setCount(undefined);
      void import('../../entities/app/demo').then(({ getDemoAppSummaries }) => {
        if (!cancelled) setCount(getDemoAppSummaries({ type: 'team', id: teamId, name: 'GSM Connect' }).length);
      });
      return () => { cancelled = true; };
    }
    const controller = new AbortController();
    setCount(undefined);
    void listTeamApps({ teamId, signal: controller.signal }).then(apps => {
      if (!controller.signal.aborted) setCount(apps.length);
    }).catch(() => {
      if (!controller.signal.aborted) setCount(null);
    });
    return () => controller.abort();
  }, [teamId]);

  const loading = count === undefined;
  return (
    <ServiceCard>
      <ServiceCardLabel><Octicon name="code" size={16} />Apps</ServiceCardLabel>
      <ServiceCount aria-busy={loading}>{count ?? '—'} / —</ServiceCount>
      <MutedCaption role="status">{loading ? '사용량을 불러오는 중…' : count === null ? '사용량 정보 없음' : '등록된 Apps · 전체 한도 정보 없음'}</MutedCaption>
    </ServiceCard>
  );
}

function quotaTierLabel(vcpuLimit: number | undefined) {
  if (vcpuLimit === 4) return '소형';
  if (vcpuLimit === 8) return '중형';
  if (vcpuLimit === 16) return '대형';
  return '맞춤';
}

function getStatusMessage(team: TeamDetail) {
  if (team.status === 'pending') return { tone: 'warning' as const, title: '팀 승인 대기 중입니다', description: '팀 승인이 완료되면 팀 Resources를 사용할 수 있습니다.' };
  if (team.status === 'rejected') return { tone: 'danger' as const, title: '팀 승인이 거절되었습니다', description: team.rejection_reason || '팀 설정에서 거절 사유를 확인해 주세요.' };
  return null;
}

export interface TeamsHomePageProps {
  /** Optional active team selected by the app shell or a team route. */
  teamId?: string;
}

export default function TeamsHomePage({ teamId }: TeamsHomePageProps) {
  const navigate = useNavigate();
  const user = getSessionUser();
  const [teams, setTeams] = useState<Loadable<TeamSummary[]>>(initialLoadable);
  const [detail, setDetail] = useState<Loadable<TeamDetail>>(initialLoadable);
  const [pendingInvitations, setPendingInvitations] = useState<Loadable<TeamInvitation[]>>(initialLoadable);
  const [demoTeamVms, setDemoTeamVms] = useState<DemoVm[]>([]);
  const [demoVmQuota, setDemoVmQuota] = useState<TeamDetail['quota']>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(teamId ?? null);
  const [retryKey, setRetryKey] = useState(0);
  const [showQuotaRequest, setShowQuotaRequest] = useState(false);
  // null = 아직 확인 전. 확인 전에는 버튼을 눌러 중복 요청하지 못하게 막는다.
  const [quotaRequestSent, setQuotaRequestSent] = useState<boolean | null>(null);
  const [dismissedDecision, setDismissedDecision] = useState<string | null>(null);
  const demoMode = isDemoMode();

  useEffect(() => {
    if (!demoMode || !selectedTeamId) { setQuotaRequestSent(false); return; }
    setQuotaRequestSent(null);
    let cancelled = false;
    void import('../../entities/team/demo').then(({ listDemoTeamQuotaRequests }) => {
      if (!cancelled) setQuotaRequestSent(listDemoTeamQuotaRequests(selectedTeamId).length > 0);
    });
    return () => { cancelled = true; };
  }, [demoMode, retryKey, selectedTeamId]);

  const submitQuotaRequest = async (tier: '소형' | '중형' | '대형', reason: string) => {
    if (!demoMode || !selectedTeamId) return false;
    const { createDemoTeamQuotaRequest } = await import('../../entities/team/demo');
    if (!createDemoTeamQuotaRequest(selectedTeamId, tier, reason)) return false;
    setQuotaRequestSent(true);
    setShowQuotaRequest(false);
    return true;
  };

  const dismissDecision = (teamIdToDismiss: string) => {
    setDismissedDecision(teamIdToDismiss);
    void import('../../entities/team/demo').then(({ dismissDemoTeamDecisionNotice }) => dismissDemoTeamDecisionNotice(teamIdToDismiss));
  };

  useEffect(() => {
    if (!(demoMode && selectedTeamId)) {
      setDemoTeamVms([]);
      setDemoVmQuota(null);
      return;
    }
    let cancelled = false;
    void import('../../entities/vm').then(({ getDemoVmQuota, getDemoVmState, listDemoTeamVms }) => {
      if (cancelled) return;
      const state = getDemoVmState();
      const quota = getDemoVmQuota(state, selectedTeamId);
      setDemoTeamVms(listDemoTeamVms(state, selectedTeamId));
      setDemoVmQuota({ vm: {
        vcpu: { used: quota.cpu, limit: quota.cpuLimit },
        ram_gb: { used: quota.memory, limit: quota.memoryLimit },
        ssd_gb: { used: quota.disk, limit: quota.diskLimit },
      } });
    });
    return () => { cancelled = true; };
  }, [demoMode, retryKey, selectedTeamId]);

  const hasPendingVmRequests = demoTeamVms.some(vm => vm.status === 'queued' && vm.requestedAtMs !== undefined);
  useEffect(() => {
    if (!demoMode || !selectedTeamId || !hasPendingVmRequests) return;
    const timer = window.setInterval(async () => {
      const { getDemoVmState, listDemoTeamVms } = await import('../../entities/vm');
      setDemoTeamVms(listDemoTeamVms(getDemoVmState(), selectedTeamId));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [demoMode, hasPendingVmRequests, selectedTeamId]);

  useEffect(() => {
    setSelectedTeamId(teamId ?? null);
  }, [teamId]);

  useEffect(() => {
    if (demoMode) {
      let cancelled = false;
      setTeams(current => ({ ...current, loading: true, error: false }));
      void import('../../entities/team/demo').then(({ listDemoTeams }) => {
        if (cancelled) return;
        const value = listDemoTeams();
        setTeams({ value, loading: false, error: false });
        if (!teamId && value.length > 0) setSelectedTeamId(current => current ?? value[0].id);
      });
      return () => { cancelled = true; };
    }
    const controller = new AbortController();
    setTeams(current => ({ ...current, loading: true, error: false }));
    void listMyTeams(controller.signal).then(value => {
      if (controller.signal.aborted) return;
      setTeams({ value, loading: false, error: false });
      if (!teamId && !selectedTeamId && value.length > 0) setSelectedTeamId(value[0].id);
    }).catch(() => {
      if (!controller.signal.aborted) setTeams({ value: null, loading: false, error: true });
    });
    return () => controller.abort();
  }, [demoMode, retryKey, teamId]);

  useEffect(() => {
    if (!selectedTeamId) {
      setDetail({ value: null, loading: false, error: false });
      return;
    }
    if (demoMode) {
      const controller = new AbortController();
      setDetail(current => ({ ...current, loading: true, error: false }));
      // 목데이터에서도 Figma 25-03/32-05 로딩과 25-04/32-06 오류(?demoError=team)를 볼 수 있게 한다.
      void Promise.all([import('../../entities/team/demo'), simulateDemoRequest('team', controller.signal)]).then(([{ getDemoTeam }]) => {
        if (controller.signal.aborted) return;
        const value = getDemoTeam(selectedTeamId);
        setDetail(value ? { value, loading: false, error: false } : { value: null, loading: false, error: true });
      }, () => {
        if (!controller.signal.aborted) setDetail({ value: null, loading: false, error: true });
      });
      return () => controller.abort();
    }
    const controller = new AbortController();
    setDetail(current => ({ ...current, loading: true, error: false }));
    void getTeam(selectedTeamId, controller.signal).then(value => {
      if (!controller.signal.aborted) setDetail({ value, loading: false, error: false });
    }).catch(() => {
      if (!controller.signal.aborted) setDetail({ value: null, loading: false, error: true });
    });
    return () => controller.abort();
  }, [demoMode, selectedTeamId, retryKey]);

  useEffect(() => {
    const team = detail.value;
    if (!selectedTeamId || team?.id !== selectedTeamId || team.status !== 'pending' || !team.permissions.invite_member) {
      setPendingInvitations({ value: [], loading: false, error: false });
      return;
    }

    if (demoMode) {
      let cancelled = false;
      setPendingInvitations(current => ({ ...current, loading: true, error: false }));
      void import('../../entities/team/demo').then(({ listDemoTeamInvitations }) => {
        if (!cancelled) setPendingInvitations({ value: listDemoTeamInvitations(selectedTeamId), loading: false, error: false });
      });
      return () => { cancelled = true; };
    }
    const controller = new AbortController();
    setPendingInvitations(current => ({ ...current, loading: true, error: false }));
    void listTeamInvitations(selectedTeamId, controller.signal).then(value => {
      if (!controller.signal.aborted) setPendingInvitations({ value, loading: false, error: false });
    }).catch(() => {
      if (!controller.signal.aborted) setPendingInvitations({ value: null, loading: false, error: true });
    });
    return () => controller.abort();
  }, [demoMode, detail.value, retryKey, selectedTeamId]);

  const selectedSummary = useMemo(
    () => teams.value?.find(team => team.id === selectedTeamId),
    [selectedTeamId, teams.value],
  );
  const currentTeam = detail.value;
  const invitedMembers = currentTeam?.status === 'pending' ? pendingInvitations.value ?? [] : [];
  const scopeLabel = currentTeam
    ? `${currentTeam.name} · ${currentTeam.my_role ? roleLabel[currentTeam.my_role] : '관리자'}`
    : selectedSummary ? `${selectedSummary.name} · ${roleLabel[selectedSummary.my_role]}` : '내 Resources';
  const scopeOptions = useMemo(() => [
    {
      id: 'personal',
      label: '내 Resources',
      selected: !selectedTeamId,
      onSelect: () => navigate('/'),
    },
    ...(teams.value ?? []).map(team => ({
      id: team.id,
      label: `${team.name} · ${currentTeam && currentTeam.id === team.id && currentTeam.my_role === null ? '관리자' : roleLabel[team.my_role]}`,
      selected: team.id === selectedTeamId,
      onSelect: () => navigate(`/teams/${encodeURIComponent(team.id)}`),
    })),
  ], [currentTeam, navigate, selectedTeamId, teams.value]);

  const navigateFromShell = (item: Exclude<StudentNavigationKey, 'none'>) => {
    if (item === 'home' || item === 'team') navigate(selectedTeamId ? `/teams/${encodeURIComponent(selectedTeamId)}` : '/teams');
    else if (item === 'database') navigate(selectedTeamId ? `/databases?owner=${encodeURIComponent(selectedTeamId)}` : '/databases');
    else if (item === 'apps') navigate(selectedTeamId ? `/teams/${encodeURIComponent(selectedTeamId)}/apps` : '/apps');

    return ['home', 'team', 'database', 'apps'].includes(item);
  };

  const retry = useCallback(() => setRetryKey(value => value + 1), []);

  const empty = !teamId && !teams.loading && !teams.error && teams.value?.length === 0;
  const loading = teams.loading || (!selectedTeamId && !empty && !teams.error) || detail.loading;
  const role = currentTeam
    ? currentTeam.my_role ? roleLabel[currentTeam.my_role] : '관리자'
    : selectedSummary ? roleLabel[selectedSummary.my_role] : '';
  const quota = (demoMode ? demoVmQuota?.vm : undefined) ?? currentTeam?.quota?.vm;
  const vcpu = quotaState(quota?.vcpu);
  const statusMessage = currentTeam ? getStatusMessage(currentTeam) : null;
  const canCreateTeamVm = Boolean(currentTeam?.status === 'approved' && (currentTeam.my_role === 'leader' || currentTeam.my_role === 'devops'));

  let content;
  if (empty) {
    content = (
      <Page>
        <EmptyState>
          <EmptyTitle><Octicon name="people" size={20} />아직 속한 팀이 없습니다</EmptyTitle>
          <EmptyCopy>팀을 만들거나 팀장에게 초대를 받으면 팀 VM을 함께 관리할 수 있습니다.</EmptyCopy>
          <DotList>
            <li>· 초대 메일의 링크를 누르면 바로 합류합니다.</li>
            <li>· 개인 Resource는 지금처럼 사용할 수 있습니다.</li>
          </DotList>
          <EmptyActions>
            <Button variant="secondary" icon={<Octicon name="book" size={16} />} onClick={() => navigate('/docs')}>팀 사용법</Button>
            <Button variant="primary" icon={<Octicon name="people" size={16} />} onClick={() => navigate('/teams/new')}>팀 만들기</Button>
          </EmptyActions>
        </EmptyState>
      </Page>
    );
  } else if (teams.error && !teamId) {
    content = <Page><Breadcrumb>팀 Resources</Breadcrumb><ErrorCard onRetry={retry} /></Page>;
  } else if (loading) {
    content = (
      <Page>
        <Breadcrumb>{scopeLabel} / 팀 Resources</Breadcrumb>
        <Heading>
          <TitleBlock><Title>{selectedSummary?.name ?? '팀'}</Title><Subtitle>팀 Resources · 팀원 정보를 불러오는 중입니다</Subtitle></TitleBlock>
        </Heading>
        <SkeletonStack aria-label="팀 정보를 불러오는 중입니다" aria-busy="true">
          <LoadingCard height={205} />
          <LoadingCard height={210} />
          <section><SectionTitle>팀 서비스</SectionTitle><SkeletonServices><LoadingCard height={130} /><LoadingCard height={130} /><LoadingCard height={130} /></SkeletonServices></section>
          <LoadingCard height={220} />
        </SkeletonStack>
      </Page>
    );
  } else if (detail.error || !currentTeam) {
    content = (
      <Page>
        <Breadcrumb>{scopeLabel} / 팀 Resources</Breadcrumb>
        <Heading><TitleBlock><Title>{selectedSummary?.name ?? '팀'}</Title><Subtitle>팀 정보를 확인할 수 없습니다.</Subtitle></TitleBlock></Heading>
        <ErrorCard onRetry={retry} />
        <Button variant="secondary" onClick={() => navigate('/teams')}>팀 목록</Button>
      </Page>
    );
  } else {
    const teamSettingsPath = `/teams/${encodeURIComponent(currentTeam.id)}/settings`;
    const warningText = vcpu.unavailable
      ? undefined
      : quota!.vcpu.used >= quota!.vcpu.limit
        ? `팀 vCPU ${quota!.vcpu.used}/${quota!.vcpu.limit} 사용 중 · 팀 설정에서 할당량 늘리기를 요청하세요.`
        : undefined;
    const createQuotaReason = !quota?.vcpu || !quota.ram_gb || !quota.ssd_gb
      ? '팀 할당량 정보를 확인할 수 없습니다.'
      : quota.vcpu.used >= quota.vcpu.limit
        ? '팀 vCPU를 모두 사용 중입니다. 팀 설정에서 할당량 늘리기를 요청하세요.'
        : quota.ram_gb.used + 1 > quota.ram_gb.limit
          ? '팀 RAM 할당량이 부족합니다. 팀 설정에서 할당량 늘리기를 요청하세요.'
          : quota.ssd_gb.used + 10 > quota.ssd_gb.limit
            ? '팀 SSD 할당량이 부족합니다. 팀 설정에서 할당량 늘리기를 요청하세요.'
            : undefined;
    const teamVmCreateDisabled = !canCreateTeamVm || Boolean(createQuotaReason);
    // Figma 25-01/25-02: 관리자 결정 뒤 팀장이 처음 팀 홈을 열면 결과 안내를 한 번 띄운다.
    const pendingDecision = demoMode && currentTeam.my_role === 'leader' && dismissedDecision !== currentTeam.id
      ? (currentTeam as DemoTeamDetail).demoDecisionNotice
      : undefined;
    const decision = pendingDecision === currentTeam.status ? pendingDecision : undefined;
    const leader = currentTeam.members.find(member => member.role === 'leader');
    const requestedAt = formatKoreanDate(leader?.joined_at, true);
    content = currentTeam.status === 'pending' ? (
      <Page>
        <Breadcrumb>{currentTeam.name} / 팀 정보</Breadcrumb>
        <Heading>
          <TitleBlock>
            <Title>{currentTeam.name}</Title>
            <Subtitle>승인 대기 중 · 내 역할 {role || '확인 중'}</Subtitle>
          </TitleBlock>
          <Actions>
            <Button variant="secondary" icon={<Octicon name="gear" size={16} />} onClick={() => navigate(teamSettingsPath)}>팀 설정</Button>
            {currentTeam.permissions.invite_member && <Button variant="primary" icon={<Octicon name="plus" size={16} />} onClick={() => navigate(teamSettingsPath)}>팀원 초대</Button>}
          </Actions>
        </Heading>
        <Banner
          tone="warning"
          icon={<Octicon name="clock" size={20} />}
          title="관리자 승인을 기다리고 있습니다"
          description={`${requestedAt ? `${requestedAt}에 신청했습니다. ` : ''}승인되면 팀 할당량이 정해지고 VM·Database·Serverless·Apps를 만들 수 있습니다. 팀원 초대와 팀장 넘기기는 지금도 할 수 있습니다.`}
        />
        <PendingStats>
          <PendingStat><PendingStatLabel><Octicon name="people" size={16} />팀원</PendingStatLabel><PendingStatValue>{currentTeam.members.length}명</PendingStatValue><MutedCaption>초대 대기 <MemberCount>{invitedMembers.length}명</MemberCount></MutedCaption></PendingStat>
          <PendingStat><PendingStatLabel><Octicon name="server" size={16} />팀 VM</PendingStatLabel><PendingStatValue>0개</PendingStatValue><MutedCaption>승인 후 만들 수 있습니다</MutedCaption></PendingStat>
          <PendingStat><PendingStatLabel><Octicon name="cpu" size={16} />팀 할당량</PendingStatLabel><PendingStatValue>승인 대기</PendingStatValue><MutedCaption>관리자가 승인할 때 정합니다</MutedCaption></PendingStat>
        </PendingStats>
        <QuotaPanel aria-label="팀원">
          <SectionTitle>팀원</SectionTitle>
          <PendingMemberTable>
            <PendingMemberGrid $header aria-hidden="true"><span>이름</span><span>역할</span><span>상태</span><span>합류일</span></PendingMemberGrid>
            {currentTeam.members.map(member => (
              <PendingMemberGrid key={member.member_id}>
                <span>{member.name}{member.role === currentTeam.my_role ? ' (나)' : ''}</span>
                <span>{member.role === 'leader' ? <PendingTone $tone="primary">{roleLabel[member.role]}</PendingTone> : roleLabel[member.role]}</span>
                <span>합류</span>
                <span>{formatDotDate(member.joined_at)}</span>
              </PendingMemberGrid>
            ))}
            {invitedMembers.map(invitation => (
              <PendingMemberGrid key={invitation.id}>
                <span>{invitation.email}</span>
                <span>{roleLabel.member}</span>
                <span><PendingTone $tone="warning">초대 대기{formatMonthDay(invitation.expires_at) ? ` · ${formatMonthDay(invitation.expires_at)} 만료` : ''}</PendingTone></span>
                <span>—</span>
              </PendingMemberGrid>
            ))}
          </PendingMemberTable>
          {pendingInvitations.error && currentTeam.permissions.invite_member && <TeamWarning role="alert">초대 중인 팀원을 불러오지 못했습니다. <Button variant="ghost" onClick={retry}>다시 시도</Button></TeamWarning>}
        </QuotaPanel>
        <PendingVmCard>
          <Octicon name="server" size={20} />
          <PendingVmCopy><strong>팀 VM 만들기</strong><span>승인 대기 중인 팀은 VM을 만들 수 없습니다. 승인 알림을 받으면 이 화면에서 바로 만들 수 있습니다.</span></PendingVmCopy>
          <Button variant="secondary" icon={<Octicon name="plus" size={16} />} disabled>팀 VM 만들기</Button>
        </PendingVmCard>
      </Page>
    ) : (
      <Page>
        <Breadcrumb>{currentTeam.name} / 팀 Resources</Breadcrumb>
        <Heading>
          <TitleBlock>
            <Title>{currentTeam.name}</Title>
            <Subtitle>팀 Resources · 내 역할 {role || '확인 중'} · 팀원 <MemberCount>{currentTeam.members.length + invitedMembers.length}명</MemberCount></Subtitle>
            {warningText && <TeamWarning>{warningText}</TeamWarning>}
          </TitleBlock>
          <Actions>
            <Button variant="secondary" icon={<Octicon name="gear" size={16} />} onClick={() => navigate(teamSettingsPath)}>팀 설정</Button>
            {canCreateTeamVm && <Button variant="secondary" icon={<Octicon name="plus" size={16} />} disabled={teamVmCreateDisabled} title={createQuotaReason} onClick={() => navigate(`/teams/${encodeURIComponent(currentTeam.id)}/vms/new`)}>팀 VM 만들기</Button>}
          </Actions>
        </Heading>

        {statusMessage && <Banner title={statusMessage.title} description={statusMessage.description} tone={statusMessage.tone} icon={<Octicon name="alert" size={20} />} />}

        <QuotaPanel aria-label="팀 할당량">
          <SectionTitle>팀 할당량{currentTeam.quota?.vm.vcpu.limit ? ` · ${quotaTierLabel(currentTeam.quota.vm.vcpu.limit)}` : ''}</SectionTitle>
          <QuotaRows>
            <QuotaLine label="vCPU" usage={quota?.vcpu} />
            <QuotaLine label="RAM" usage={quota?.ram_gb} suffix=" GB" />
            <QuotaLine label="SSD" usage={quota?.ssd_gb} suffix=" GB" />
          </QuotaRows>
          <QuotaFoot>
            <span>{quota ? (quota.vcpu.used >= quota.vcpu.limit ? 'vCPU를 모두 쓰고 있습니다. 더 필요하면 팀 설정에서 할당량 늘리기를 요청하세요.' : 'VM 할당량 사용량') : '승인된 팀의 VM 할당량이 표시됩니다.'}</span>
            {currentTeam.status === 'approved' && currentTeam.my_role === 'leader' && (
              <Button variant="secondary" icon={<Octicon name="graph" size={16} />} disabled={demoMode && quotaRequestSent !== false}
                onClick={() => demoMode ? setShowQuotaRequest(true) : navigate(`/teams/${encodeURIComponent(currentTeam.id)}/settings`)}>
                {demoMode && quotaRequestSent ? '요청 검토 중' : '할당량 늘리기 요청'}
              </Button>
            )}
          </QuotaFoot>
        </QuotaPanel>

        <VmPanel>
          <SectionHeading><SectionTitle>팀 VM{demoMode ? <> · <MemberCount>{demoTeamVms.length}개</MemberCount></> : null}</SectionTitle></SectionHeading>
          <VmTable aria-hidden="true"><span>VM</span><span>상태</span><span>Resources</span><span>만든 사람</span><span>만료</span><span>관리</span></VmTable>
          {demoMode
            ? demoTeamVms.length > 0
              ? demoTeamVms.map(vm => <VmDataRow key={vm.id}>
                <VmCell data-label="VM"><VmNameButton onClick={() => navigate(`/teams/${encodeURIComponent(currentTeam.id)}/vms/${encodeURIComponent(vm.id)}`)}>{vm.name}</VmNameButton></VmCell>
                <VmCell data-label="상태">{vm.status === 'running' ? <MemberCount as="span" style={{ fontWeight: 400 }}>실행 중</MemberCount> : vm.status === 'stopped' ? '정지됨' : '대기 중'}</VmCell>
                <VmCell data-label="리소스">{vm.cpu} vCPU · RAM {vm.memory} GB · SSD {vm.disk} GB</VmCell>
                <VmCell data-label="만든 사람">{vm.creator}</VmCell>
                <VmCell data-label="만료">{vm.expiresAt.split(' ')[0]}</VmCell>
                <VmCell data-label="관리"><Button variant="ghost" aria-label={`${vm.name} 관리`} onClick={() => navigate(`/teams/${encodeURIComponent(currentTeam.id)}/vms/${encodeURIComponent(vm.id)}`)}><Octicon name="chevron-right" size={16} /></Button></VmCell>
              </VmDataRow>)
              : <VmNotice>팀 VM이 없습니다.</VmNotice>
            : <VmNotice>팀 VM 목록 정보가 제공되지 않습니다.</VmNotice>}
        </VmPanel>

        <ServiceSection>
          <SectionTitle>팀 서비스</SectionTitle>
          <ServiceCards>
            <TeamDatabaseCard key={currentTeam.id} teamId={currentTeam.id} />
            <ServiceCard><ServiceCardLabel><Octicon name="zap" size={16} />Serverless</ServiceCardLabel><ServiceCount>— / —</ServiceCount><MutedCaption>사용량 정보 없음</MutedCaption></ServiceCard>
            <TeamAppsCard key={currentTeam.id} teamId={currentTeam.id} />
          </ServiceCards>
        </ServiceSection>

        <BottomGrid>
          <MemberPanel>
            <SectionTitle>팀원 · <MemberCount>{currentTeam.members.length + invitedMembers.length}명</MemberCount></SectionTitle>
            <MemberList>
              {currentTeam.members.map(member => (
                <Member key={member.member_id}>
                  <MemberIcon aria-hidden="true"><Octicon name="person" size={18} /></MemberIcon>
                  <MemberCopy><MemberName>{member.name}{member.role === currentTeam.my_role ? ' (나)' : ''}</MemberName><MemberRole>{roleLabel[member.role]}</MemberRole></MemberCopy>
                </Member>
              ))}
              {invitedMembers.map(invitation => (
                <Member key={invitation.id}>
                  <MemberIcon aria-hidden="true"><Octicon name="person" size={18} /></MemberIcon>
                  <MemberCopy><MemberName>{invitation.email}</MemberName><MemberRole>초대 대기</MemberRole></MemberCopy>
                </Member>
              ))}
            </MemberList>
            {pendingInvitations.error && currentTeam.permissions.invite_member && <TeamWarning role="alert">초대 중인 팀원을 불러오지 못했습니다. <Button variant="ghost" onClick={retry}>다시 시도</Button></TeamWarning>}
          </MemberPanel>
          <Banner
            title="팀 VM 사용 기간"
            description="첫 달은 VM 생성 시각부터 31일입니다. 이후 만료 7일 전부터 팀원 누구나 14일씩 연장할 수 있고, 알림은 팀원 전원에게 갑니다."
            tone="neutral"
            icon={<Octicon name="calendar" size={20} />}
          />
        </BottomGrid>
        {demoMode && showQuotaRequest && <TeamQuotaRequestDialog onDismiss={() => setShowQuotaRequest(false)} onSubmit={submitQuotaRequest} />}
        {decision === 'approved' && <AccountDialog title={`${currentTeam.name} 팀이 승인됐습니다`} icon="check-circle"
          description={`· 할당량 · ${quotaTierLabel(currentTeam.quota?.vm.vcpu.limit)} · vCPU ${currentTeam.quota?.vm.vcpu.limit ?? '—'} · RAM ${currentTeam.quota?.vm.ram_gb.limit ?? '—'}GB · SSD ${currentTeam.quota?.vm.ssd_gb.limit ?? '—'}GB\n· 이제 팀장과 DevOps가 팀 VM을 만들 수 있습니다.`}
          onDismiss={() => dismissDecision(currentTeam.id)}
          actions={<Button icon={<Octicon name="plus" size={16} />} onClick={() => { dismissDecision(currentTeam.id); navigate(`/teams/${encodeURIComponent(currentTeam.id)}/vms/new`); }}>팀 VM 만들기</Button>} />}
        {decision === 'rejected' && <AccountDialog title="팀 승인이 거절됐습니다" icon="alert"
          description={`${currentTeam.rejection_reason ? `사유: ${currentTeam.rejection_reason}\n` : ''}· 팀원과 보낸 초대가 해제됐고, 팀은 7일 뒤 삭제됩니다.`}
          onDismiss={() => dismissDecision(currentTeam.id)}
          actions={<Button icon={<Octicon name="people" size={16} />} onClick={() => { dismissDecision(currentTeam.id); navigate('/teams/new'); }}>새 팀 만들기</Button>} />}
      </Page>
    );
  }

  return (
    <StudentShell
      activeItem={currentTeam?.status === 'pending' ? 'team' : 'home'}
      scopeLabel={scopeLabel}
      scopeOptions={scopeOptions}
      userName={user?.name ?? '사용자'}
      onNavigate={navigateFromShell}
      onCreateTeam={() => navigate('/teams/new')}
      onOpenStatus={() => navigate('/status')}
      onSelectScope={() => undefined}
      onSearch={() => undefined}
      onOpenNotifications={() => undefined}
    >
      {content}
    </StudentShell>
  );
}
