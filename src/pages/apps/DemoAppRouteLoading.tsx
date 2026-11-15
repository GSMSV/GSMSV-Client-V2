import { useNavigate, useParams } from 'react-router';
import styled from 'styled-components';
import { getSessionUser } from '../../entities/session';
import { LoadingCard } from '../../shared/ui/feedback';
import { ResourceListCards, ResourceListPage, ResourceListSummary } from '../../shared/ui/layout/ResourceListLayout';
import { StudentShell } from '../../widgets/student-shell';
import { DemoCreateFormState } from './DemoCreateFormState';

const Breadcrumb = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.faint};
  font-size: ${({ theme }) => theme.typography.caption.size}px;
  line-height: ${({ theme }) => theme.typography.caption.lineHeight}px;
`;

const Heading = styled.div`
  display: grid;
  min-height: 74px;
  gap: 8px;
  align-content: center;
`;

const serviceHeights = {
  deployments: [450, 282],
  logs: [348],
  metrics: [338, 338],
  variables: [270, 314, 200, 216],
  settings: [530, 328, 146],
  domains: [200, 254],
  shell: [326],
};

function ServiceLoadingCards() {
  const { tab = 'deployments' } = useParams<{ tab: string }>();
  const heights = Object.hasOwn(serviceHeights, tab)
    ? serviceHeights[tab as keyof typeof serviceHeights]
    : serviceHeights.deployments;
  const cards = heights.map((height, index) => <LoadingCard key={index} height={height} />);
  return tab === 'metrics' ? <ResourceListSummary>{cards}</ResourceListSummary> : cards;
}

export function DemoAppRouteLoading({ page }: { page: 'overview' | 'app-settings' | 'add-service' | 'service' }) {
  const navigate = useNavigate();
  return (
    <StudentShell
      activeItem="apps"
      scopeLabel="내 Resources"
      userName={getSessionUser()?.name ?? '김민수'}
      onNavigate={() => false}
      onCreateTeam={() => navigate('/teams/new')}
      onOpenStatus={() => navigate('/status')}
      onSelectScope={() => undefined}
      onSearch={() => undefined}
      onOpenNotifications={() => undefined}
    >
      <ResourceListPage aria-busy="true">
        <Breadcrumb>Apps</Breadcrumb>
        <Heading>
          <LoadingCard width="min(240px, 100%)" height={42} />
          <LoadingCard width="min(220px, 100%)" height={22} />
        </Heading>
        <LoadingCard width="min(447px, 100%)" height={42} />
        {page === 'overview' && <>
          <LoadingCard height={182} />
          <ResourceListSummary>
            <LoadingCard height={150} />
            <LoadingCard height={174} />
            <LoadingCard height={174} />
          </ResourceListSummary>
          <ResourceListCards>
            <LoadingCard width="calc((100% - 32px) / 3)" height={254} />
            <LoadingCard width="calc((100% - 32px) / 3)" height={254} />
          </ResourceListCards>
        </>}
        {page === 'app-settings' && [316, 320, 172, 172].map((height, index) => <LoadingCard key={index} height={height} />)}
        {page === 'add-service' && <DemoCreateFormState step="service" />}
        {page === 'service' && <ServiceLoadingCards />}
      </ResourceListPage>
    </StudentShell>
  );
}
