import styled from 'styled-components';
import { Button } from '../../shared/ui/controls';
import { Octicon } from '../../shared/ui/icons';

const Screen = styled.main`
  position: relative;
  width: 100%;
  min-width: 1200px;
  min-height: 1080px;
  height: max(100vh, 1080px);
  overflow: hidden;
  background: ${({ theme }) => theme.colors.canvas};
`;

const IntroductionPanel = styled.aside`
  position: absolute;
  inset: 0 auto 0 0;
  width: 320px;
  min-height: 1080px;
  background: ${({ theme }) => theme.colors.sidebar};
`;

const BrandMark = styled.img`
  position: absolute;
  top: 50%;
  left: -240px;
  display: block;
  width: 800px;
  height: 800px;
  transform: translateY(-50%);
`;

const Content = styled.section`
  position: absolute;
  top: 50%;
  left: 50%;
  display: flex;
  width: 480px;
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space[32]}px;
  transform: translateY(-50%);
`;

const BrandTitle = styled.h1`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font-family: ${({ theme }) => theme.typography.body.family}, sans-serif;
  font-size: 64px;
  font-weight: 700;
  line-height: 72px;
`;

const Introduction = styled.div`
  display: flex;
  width: 680px;
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space[32]}px;
  color: ${({ theme }) => theme.colors.muted};
`;

const Tagline = styled.p`
  margin: 0;
  font-family: ${({ theme }) => theme.typography.body.family}, sans-serif;
  font-size: ${({ theme }) => theme.typography.body.size}px;
  font-weight: ${({ theme }) => theme.typography.body.weight};
  line-height: ${({ theme }) => theme.typography.body.lineHeight}px;
`;

const AccountExplanation = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space[8]}px;
  font-family: ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
  font-size: ${({ theme }) => theme.typography.bodySmall.size}px;
`;

const ExplanationTitle = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font-weight: 500;
  line-height: 20px;
`;

const ExplanationBody = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font-weight: ${({ theme }) => theme.typography.bodySmall.weight};
  line-height: ${({ theme }) => theme.typography.bodySmall.lineHeight}px;
`;

const BenefitsCard = styled.section`
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space[16]}px;
  padding: ${({ theme }) => theme.space[24]}px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};
`;

const BenefitsTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font-family: ${({ theme }) => theme.typography.title.family}, sans-serif;
  font-size: ${({ theme }) => theme.typography.title.size}px;
  font-weight: ${({ theme }) => theme.typography.title.weight};
  line-height: ${({ theme }) => theme.typography.title.lineHeight}px;
`;

const BenefitRow = styled.div`
  display: flex;
  width: 424px;
  align-items: center;
  gap: ${({ theme }) => theme.space[16]}px;
`;

const BenefitIcon = styled.span`
  display: inline-flex;
  width: 20px;
  height: 20px;
  flex: 0 0 20px;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.muted};
`;

const BenefitCopy = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space[8]}px;
  font-family: ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
  font-size: ${({ theme }) => theme.typography.bodySmall.size}px;
`;

const BenefitHeading = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font-weight: 500;
  line-height: ${({ theme }) => theme.typography.button.lineHeight}px;
`;

const BenefitDescription = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font-weight: ${({ theme }) => theme.typography.bodySmall.weight};
  line-height: ${({ theme }) => theme.typography.bodySmall.lineHeight}px;
`;

const Divider = styled.div`
  width: 424px;
  height: 1px;
  flex: 0 0 1px;
  background: ${({ theme }) => theme.colors.border};
`;

const Actions = styled.div`
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.space[8]}px;
`;

export function LoginPage() {
  const apiOrigin = import.meta.env.VITE_API_ORIGIN?.replace(/\/+$/, '') ?? '';
  const authorizeUrl = `${apiOrigin}/api/v2/auth/datagsm/authorize?redirect=%2F`;

  return (
    <Screen>
      <IntroductionPanel aria-hidden="true" />
      <BrandMark src="/assets/gsmsv-logo.svg" alt="" aria-hidden="true" />
      <Content aria-labelledby="login-title">
        <BrandTitle id="login-title">GSM SV</BrandTitle>
        <Introduction>
          <Tagline>GSM SV에서 나만의 개발 환경을 시작하세요.</Tagline>
          <AccountExplanation>
            <ExplanationTitle>학교 계정 하나로 시작하세요</ExplanationTitle>
            <ExplanationBody>재학생은 첫 로그인 시 일반 계정이 자동으로 만들어집니다.</ExplanationBody>
          </AccountExplanation>
        </Introduction>
        <BenefitsCard aria-labelledby="benefits-title">
          <BenefitsTitle id="benefits-title">아이디어가 서비스가 되는 곳</BenefitsTitle>
          <BenefitRow>
            <BenefitIcon aria-hidden="true"><Octicon name="server" size={20} /></BenefitIcon>
            <BenefitCopy>
              <BenefitHeading>작은 실험부터 서비스까지</BenefitHeading>
              <BenefitDescription>Ubuntu VM과 Serverless 함수를 한곳에서.</BenefitDescription>
            </BenefitCopy>
          </BenefitRow>
          <Divider aria-hidden="true" />
          <BenefitRow>
            <BenefitIcon aria-hidden="true"><Octicon name="shield" size={20} /></BenefitIcon>
            <BenefitCopy>
              <BenefitHeading>학교 계정 하나로</BenefitHeading>
              <BenefitDescription>DataGSM으로 간편하게 시작합니다.</BenefitDescription>
            </BenefitCopy>
          </BenefitRow>
          <Divider aria-hidden="true" />
        </BenefitsCard>
        <Actions>
          <Button
            variant="ghost"
            icon={<Octicon name="pulse" size={16} />}
            onClick={() => window.location.assign('/status')}
          >
            서비스 상태
          </Button>
          <Button
            variant="primary"
            icon={<Octicon name="sign-in" size={16} />}
            onClick={() => window.location.assign(authorizeUrl)}
          >
            DataGSM으로 계속하기
          </Button>
        </Actions>
      </Content>
    </Screen>
  );
}

export default LoginPage;
