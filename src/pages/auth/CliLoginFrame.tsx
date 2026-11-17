import type { ReactNode } from 'react';
import styled from 'styled-components';
import { Octicon } from '../../shared/ui/icons';

const Page = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.canvas};
  color: ${({ theme }) => theme.colors.text};
`;
const Header = styled.header`
  display: flex;
  height: 74px;
  align-items: center;
  justify-content: space-between;
  padding: 0 40px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  @media (max-width: 480px) {
    height: auto;
    min-height: 74px;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    gap: 8px;
    padding: 12px 16px;
  }
`;
const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font: 700 20px/28px ${({ theme }) => theme.typography.h2.family}, sans-serif;
`;
const LogoMark = styled.img`
  display: block;
  width: 24px;
  height: 24px;
`;
const SignedIn = styled.span`
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
  color: ${({ theme }) => theme.colors.muted};
  font: 400 14px/22px ${({ theme }) => theme.typography.body.family}, sans-serif;

  @media (max-width: 480px) {
    max-width: 100%;
    overflow-wrap: anywhere;
  }
`;
const Center = styled.main`
  display: flex;
  justify-content: center;
  padding: 80px 24px;
`;
const Panel = styled.section`
  width: min(560px, 100%);
  padding: 24px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};
`;
export function CliLoginFrame({ email, children }: { email?: string; children: ReactNode }) {
  return <Page>
    <Header>
      <Logo><LogoMark src="/assets/gsmsv-logo.svg" alt="" /> GSM SV</Logo>
      {email && <SignedIn><Octicon name="person" size={16} /> {email}으로 로그인됨</SignedIn>}
    </Header>
    <Center><Panel>{children}</Panel></Center>
  </Page>;
}
