import styled from 'styled-components';
import { getAppStatusDisplay } from '../model/getAppStatusDisplay';
import type { AppListItem } from '../model/types';
import { Button } from '../../../shared/ui/controls';
import { Octicon } from '../../../shared/ui/icons';

const Card = styled.article<{ $demo: boolean }>`
  display: flex;
  width: calc((100% - 32px) / 3);
  min-width: 300px;
  min-height: 180px;
  flex-direction: column;
  gap: 16px;
  padding: ${({ $demo }) => $demo ? 24 : 16}px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};
`;

const CardActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 42px;
`;

const AppIcon = styled.span<{ $demo: boolean }>`
  display: inline-flex;
  width: ${({ $demo }) => $demo ? 42 : 32}px;
  height: ${({ $demo }) => $demo ? 42 : 32}px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.raised};
  color: ${({ theme }) => theme.colors.text};
`;

const AppName = styled.h3`
  overflow: hidden;
  width: 100%;
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.h2.weight} ${({ theme }) => theme.typography.h2.size}px/${({ theme }) => theme.typography.h2.lineHeight}px ${({ theme }) => theme.typography.h2.family}, sans-serif;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Metadata = styled.p`
  overflow: hidden;
  width: 100%;
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const CardFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 22px;
  margin-top: auto;
`;

const Expiry = styled.span`
  overflow: hidden;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StatusText = styled.span<{ $tone: 'warning' | 'neutral' | 'success' }>`
  flex: 0 0 auto;
  color: ${({ theme, $tone }) => $tone === 'success' ? theme.colors.primary : $tone === 'warning' ? theme.colors.warning : theme.colors.muted};
  font: ${({ theme }) => theme.typography.label.weight} ${({ theme }) => theme.typography.label.size}px/${({ theme }) => theme.typography.label.lineHeight}px ${({ theme }) => theme.typography.label.family}, sans-serif;
`;

function formatExpiry(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const [year, month, day] = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Asia/Seoul',
  }).format(date).split('-');
  return `만료 ${year}. ${month}. ${day}.`;
}

export function AppResourceCard({ app, onOpen }: { app: AppListItem; onOpen: () => void }) {
  const details = app.demoDetails;
  const demo = Boolean(details);
  const status = demo && app.status === 'active' ? { label: '실행 중', tone: 'success' as const } : getAppStatusDisplay(app.status);
  const source = details ? `${details.repository}${details.branch ? ` · ${details.branch} 브랜치` : ''}` : `소유자 ${app.owner.name} · 생성자 ${app.created_by}`;

  return (
    <Card $demo={demo}>
      <CardActions>
        <AppIcon $demo={demo} aria-hidden="true"><Octicon name="upload" size={16} /></AppIcon>
        <Button variant="secondary" icon={<Octicon name="arrow-right" size={16} />} onClick={onOpen}>열기</Button>
      </CardActions>
      <AppName title={app.name}>{app.name}</AppName>
      <Metadata title={source}>{source}</Metadata>
      {details && <Metadata>
        서비스 {details.serviceCount}개 · 환경 {details.environmentCount}개 · 메모리 {details.memoryMb >= 1024 ? `${details.memoryMb / 1024} GB` : `${details.memoryMb} MB`}
      </Metadata>}
      <CardFooter>
        <Expiry>{formatExpiry(app.expires_at)}</Expiry>
        <StatusText $tone={status.tone}>{status.label}</StatusText>
      </CardFooter>
    </Card>
  );
}
