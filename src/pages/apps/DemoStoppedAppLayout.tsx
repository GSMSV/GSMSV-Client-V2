import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import styled from 'styled-components';
import { Button } from '../../shared/ui/controls';
import { LoadingCard } from '../../shared/ui/feedback';
import { Octicon } from '../../shared/ui/icons';

const PublicPage = styled.main`
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.canvas};
  color: ${({ theme }) => theme.colors.text};
`;
const PublicHeader = styled.header`
  display: flex;
  min-height: 74px;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  column-gap: 16px;
  row-gap: 8px;
  padding: 16px 40px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  @media (max-width: 600px) { padding: 12px 16px; }
`;
const PublicBrand = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.title.weight} ${({ theme }) => theme.typography.title.size}px/${({ theme }) => theme.typography.title.lineHeight}px ${({ theme }) => theme.typography.title.family}, sans-serif;
  text-decoration: none;

  img { display: block; width: 24px; height: 24px; }
`;

const StoppedAppLoadingCard = styled(LoadingCard)`
  margin: 80px auto;

  @media (max-width: 600px) { margin: 40px auto; }
`;

export function DemoStoppedAppLoading() {
  return <StoppedAppLoadingCard width="min(560px, calc(100% - 32px))" height={182} />;
}

export function DemoStoppedAppLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  return (
    <PublicPage>
      <PublicHeader>
        <PublicBrand to="/" aria-label="GSM SV 홈">
          <img src="/assets/gsmsv-logo.svg" alt="" />GSM SV
        </PublicBrand>
        <Button variant="secondary" icon={<Octicon name="link-external" size={16} />} onClick={() => navigate("/")}>
          GSM SV 열기
        </Button>
      </PublicHeader>
      {children}
    </PublicPage>
  );
}
