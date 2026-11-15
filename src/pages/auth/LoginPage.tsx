import styled from 'styled-components';
import { useNavigate, useSearchParams } from 'react-router';
import { LoginErrorDialog, type LoginErrorKind } from '../../features/auth/login-error/ui/LoginErrorDialog';
import { startDataGsmLogin } from '../../features/auth/start-login/model/startDataGsmLogin';
import { isDemoMode } from '../../shared/demo';
import { Button } from '../../shared/ui/controls';
import { Octicon } from '../../shared/ui/icons';

const Screen = styled.main`
  position: relative;
  width: 100%;
  min-width: 0;
  min-height: 1080px;
  height: max(100vh, 1080px);
  overflow: hidden;
  background: ${({ theme }) => theme.colors.canvas};

  @media (max-width: 1024px) {
    display: flex;
    min-height: 100svh;
    height: auto;
    overflow: visible;
    padding: 32px 24px;
  }

  @media (max-width: 480px) { padding: 24px 16px; }
`;

const IntroductionPanel = styled.aside`
  position: absolute;
  inset: 0 auto 0 0;
  width: 320px;
  min-height: 1080px;
  background: ${({ theme }) => theme.colors.sidebar};

  @media (max-width: 1024px) { display: none; }
`;

const BrandMark = styled.img`
  position: absolute;
  top: 50%;
  left: -240px;
  display: block;
  width: 800px;
  height: 800px;
  transform: translateY(-50%);

  @media (max-width: 1024px) { display: none; }
`;

const Content = styled.section`
  position: absolute;
  top: 50%;
  left: min(50%, calc(100% - 704px));
  display: flex;
  width: 480px;
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space[32]}px;
  transform: translateY(-50%);

  @media (max-width: 1024px) {
    position: relative;
    top: auto;
    left: auto;
    width: min(680px, 100%);
    margin: auto;
    transform: none;
  }

  @media (max-width: 480px) { gap: ${({ theme }) => theme.space[24]}px; }
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

  @media (max-width: 1024px) { width: 100%; }
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

  @media (max-width: 480px) { padding: 20px 16px; }
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

  @media (max-width: 1024px) { width: 100%; }
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

  @media (max-width: 1024px) { width: 100%; }
`;

const Actions = styled.div`
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.space[8]}px;

  @media (max-width: 620px) {
    flex-direction: column-reverse;
    align-items: stretch;
  }

  > button { min-width: 0; }
`;

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const errorKind = getLoginErrorKind(searchParams.get('error'));

  async function login() {
    if (isDemoMode()) {
      const { resumeDemoProfile } = await import('../../entities/profile');
      if (resumeDemoProfile()) {
        const returnTo = getDemoReturnPath(searchParams.get('returnTo'));
        if (returnTo) {
          const { selectDemoRole } = await import('../../features/auth/select-demo-role');
          if (selectDemoRole('user')) void navigate(returnTo, { replace: true });
        } else {
          void navigate('/__demo/role-selection', { replace: true });
        }
      }
      return;
    }
    startDataGsmLogin();
  }

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
            onClick={() => void login()}
          >
            DataGSM으로 계속하기
          </Button>
        </Actions>
      </Content>
      {errorKind && <LoginErrorDialog kind={errorKind} onClose={() => window.location.assign('/login')} onRetry={() => void login()} />}
    </Screen>
  );
}

function getDemoReturnPath(value: string | null): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return null;
  try {
    const target = new URL(value, window.location.origin);
    if (target.origin !== window.location.origin) return null;
    // 오류 시뮬레이션 플래그는 복귀한 화면에서 다시 열리지 않도록 항상 제거한다.
    target.searchParams.delete('demoError');
    if (target.pathname === '/cli') return '/cli';
    if (target.pathname === '/cli/approve') {
      if (!target.searchParams.get('code')?.trim()) return '/cli';
      return `${target.pathname}${target.search}`;
    }
    if (/^\/vms\/new(?:\/(?:details|review))?$/.test(target.pathname)) {
      return `${target.pathname}${target.search}${target.hash}`;
    }
    if (/^\/teams\/[^/]+\/vms\/new(?:\/(?:details|review))?$/.test(target.pathname)) {
      return `${target.pathname}${target.search}${target.hash}`;
    }
    if (target.pathname === '/docs' || target.pathname.startsWith('/docs/')) {
      return `${target.pathname}${target.search}${target.hash}`;
    }
    if (/^\/vms\/[^/]+(?:\/(?:network|monitoring|snapshots|settings))?$/.test(target.pathname)) {
      return `${target.pathname}${target.search}${target.hash}`;
    }
    // 세션 만료 뒤 다시 로그인하면 보던 화면으로 돌아간다(같은 출처의 앱 경로만, 로그인·역할 선택 제외).
    if (target.pathname !== '/' && !target.pathname.startsWith('/login') && !target.pathname.startsWith('/__demo') && target.pathname !== '/admin' && !target.pathname.startsWith('/admin/')) {
      return `${target.pathname}${target.search}${target.hash}`;
    }
  } catch {
    return null;
  }
  return null;
}

function getLoginErrorKind(error: string | null): LoginErrorKind | null {
  switch (error) {
    case 'OAUTH_STATE_INVALID':
      return 'expired';
    case 'NOT_ENROLLED':
      return 'not-enrolled';
    case 'ACCOUNT_INACTIVE':
      return 'inactive';
    case 'UPSTREAM_UNAVAILABLE':
      return 'unavailable';
    case 'OAUTH_EXCHANGE_FAILED':
    case 'RATE_LIMITED':
      return 'failed';
    case 'GONE':
      return 'expired';
    default:
      return error ? 'failed' : null;
  }
}

export default LoginPage;
