import styled from 'styled-components';
import type { AppSummary } from '../model/types';
import { Button } from '../../../shared/ui/controls';
import { Octicon } from '../../../shared/ui/icons';

const Card = styled.article`
  display: flex;
  width: calc((100% - 32px) / 3);
  min-width: 300px;
  min-height: 180px;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
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

const AppIcon = styled.span`
  display: inline-flex;
  width: 32px;
  height: 32px;
  flex: 0 0 32px;
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

const StatusText = styled.span<{ $tone: 'warning' | 'neutral' }>`
  flex: 0 0 auto;
  color: ${({ theme, $tone }) => $tone === 'warning' ? theme.colors.warning : theme.colors.muted};
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

export function AppResourceCard({ app, onOpen }: { app: AppSummary; onOpen: () => void }) {
  const normalizedStatus = app.status.toLowerCase();
  const statusLabels: Record<string, string> = {
    active: '실행 중',
    running: '실행 중',
    stopped: '정지',
    suspended: '정지',
    creating: '생성 중',
    deploying: '배포 중',
    failed: '오류',
    expired: '만료',
    deleting: '삭제 중',
  };
  const statusLabel = statusLabels[normalizedStatus] ?? app.status;
  const isWarning = ['failed', 'expired', 'deleting'].includes(normalizedStatus);

  return (
    <Card>
      <CardActions>
        <AppIcon aria-hidden="true"><Octicon name="upload" size={16} /></AppIcon>
        <Button variant="secondary" icon={<Octicon name="arrow-right" size={16} />} onClick={onOpen}>열기</Button>
      </CardActions>
      <AppName title={app.name}>{app.name}</AppName>
      <Metadata title={`소유자 ${app.owner.name} · 생성자 ${app.created_by}`}>
        소유자 {app.owner.name} · 생성자 {app.created_by}
      </Metadata>
      <CardFooter>
        <Expiry>{formatExpiry(app.expires_at)}</Expiry>
        <StatusText $tone={isWarning ? 'warning' : 'neutral'}>{statusLabel}</StatusText>
      </CardFooter>
    </Card>
  );
}
