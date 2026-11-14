import { useLayoutEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import styled from 'styled-components';
import { getSessionUser } from '../../entities/session';
import { acceptInvitation, getInvitationAcceptanceError } from '../../features/team/accept-invitation';
import { isDemoMode } from '../../shared/demo';
import { Button } from '../../shared/ui/controls';
import { Octicon } from '../../shared/ui/icons';

const Screen = styled.main`
  display: flex;
  width: 1440px;
  min-height: 1080px;
  background: ${({ theme }) => theme.colors.canvas};
`;

const IntroductionPanel = styled.aside`
  display: flex;
  width: 600px;
  min-height: 1080px;
  flex: 0 0 600px;
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space[24]}px;
  padding: 48px 64px;
  background: ${({ theme }) => theme.colors.sidebar};
`;

const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[8] + theme.space[4]}px;
`;

const BrandLogo = styled.img`
  display: block;
  width: 32px;
  height: 32px;
`;

const BrandName = styled.span`
  color: ${({ theme }) => theme.colors.text};
  font-family: ${({ theme }) => theme.typography.h2.family}, sans-serif;
  font-size: ${({ theme }) => theme.typography.h2.size}px;
  font-weight: 700;
  line-height: ${({ theme }) => theme.typography.h2.lineHeight}px;
`;

const BreathingSpace = styled.div`
  height: 88px;
  flex: 0 0 88px;
`;

const HeroTitle = styled.h1`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font-family: ${({ theme }) => theme.typography.body.family}, sans-serif;
  font-size: 44px;
  font-weight: 700;
  line-height: 54px;
`;

const IntroCopy = styled.p`
  margin: -8px 0 0;
  color: ${({ theme }) => theme.colors.muted};
  font-family: ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
  font-size: ${({ theme }) => theme.typography.bodySmall.size}px;
  font-weight: ${({ theme }) => theme.typography.bodySmall.weight};
  line-height: 24px;
`;

const BenefitsCard = styled.section`
  display: flex;
  width: 472px;
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space[16]}px;
  padding: ${({ theme }) => theme.space[24]}px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};
`;

const BenefitsTitle = styled.h2`
  width: 100%;
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
  flex-direction: column;
  gap: ${({ theme }) => theme.space[8]}px;
  color: ${({ theme }) => theme.colors.text};
  font-family: ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
  font-size: ${({ theme }) => theme.typography.bodySmall.size}px;
  line-height: ${({ theme }) => theme.typography.bodySmall.lineHeight}px;
`;

const BenefitHeading = styled.p`
  margin: 0;
  font-weight: 500;
`;

const BenefitDescription = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font-weight: 400;
`;

const Divider = styled.div`
  width: 424px;
  height: 1px;
  flex: 0 0 1px;
  background: ${({ theme }) => theme.colors.border};
`;

const Content = styled.section`
  display: flex;
  width: 840px;
  min-height: 1080px;
  flex: 0 0 840px;
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space[32]}px;
  padding: 160px 80px 80px;
`;

const Heading = styled.div`
  display: flex;
  width: 680px;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[16]}px;
`;

const Title = styled.h1`
  width: 100%;
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font-family: ${({ theme }) => theme.typography.h1.family}, sans-serif;
  font-size: ${({ theme }) => theme.typography.h1.size}px;
  font-weight: ${({ theme }) => theme.typography.h1.weight};
  line-height: ${({ theme }) => theme.typography.h1.lineHeight}px;
`;

const Subtitle = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font-family: ${({ theme }) => theme.typography.body.family}, sans-serif;
  font-size: ${({ theme }) => theme.typography.body.size}px;
  font-weight: ${({ theme }) => theme.typography.body.weight};
  line-height: ${({ theme }) => theme.typography.body.lineHeight}px;
`;

const DetailsCard = styled.section`
  display: flex;
  width: 680px;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[16]}px;
  padding: ${({ theme }) => theme.space[24]}px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};
`;

const CardTitle = styled.h2`
  width: 100%;
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font-family: ${({ theme }) => theme.typography.title.family}, sans-serif;
  font-size: ${({ theme }) => theme.typography.title.size}px;
  font-weight: ${({ theme }) => theme.typography.title.weight};
  line-height: ${({ theme }) => theme.typography.title.lineHeight}px;
`;

const DetailRow = styled.div`
  display: flex;
  width: 632px;
  align-items: center;
  gap: ${({ theme }) => theme.space[16]}px;
`;

const DetailIcon = styled.span`
  display: inline-flex;
  width: 16px;
  height: 16px;
  flex: 0 0 16px;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.muted};
`;

const DetailValue = styled.div`
  display: flex;
  min-width: 0;
  flex: 1 1 auto;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]}px;
`;

const DetailLabel = styled.span`
  color: ${({ theme }) => theme.colors.faint};
  font-family: ${({ theme }) => theme.typography.label.family}, sans-serif;
  font-size: ${({ theme }) => theme.typography.label.size}px;
  font-weight: ${({ theme }) => theme.typography.label.weight};
  line-height: ${({ theme }) => theme.typography.label.lineHeight}px;
`;

const DetailText = styled.span`
  color: ${({ theme }) => theme.colors.text};
  font-family: ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
  font-size: ${({ theme }) => theme.typography.bodySmall.size}px;
  font-weight: ${({ theme }) => theme.typography.bodySmall.weight};
  line-height: ${({ theme }) => theme.typography.bodySmall.lineHeight}px;
`;

const UnknownValue = styled(DetailText)`
  color: ${({ theme }) => theme.colors.muted};
`;

const AccountCard = styled.section`
  display: flex;
  width: 680px;
  align-items: center;
  gap: ${({ theme }) => theme.space[16]}px;
  padding: ${({ theme }) => theme.space[16]}px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};
`;

const AccountCopy = styled.div`
  display: flex;
  min-width: 0;
  flex: 1 1 auto;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[8]}px;
  font-family: ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
  font-size: ${({ theme }) => theme.typography.bodySmall.size}px;
  line-height: ${({ theme }) => theme.typography.bodySmall.lineHeight}px;
`;

const AccountTitle = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font-weight: 500;
`;

const AccountIdentity = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
`;

const ContractNotice = styled.p`
  width: 100%;
  margin: -16px 0 0;
  color: ${({ theme }) => theme.colors.muted};
  font-family: ${({ theme }) => theme.typography.caption.family}, sans-serif;
  font-size: ${({ theme }) => theme.typography.caption.size}px;
  line-height: ${({ theme }) => theme.typography.caption.lineHeight}px;
`;

const ErrorMessage = styled.p`
  width: 100%;
  margin: -16px 0 0;
  color: ${({ theme }) => theme.colors.danger};
  font-family: ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
  font-size: ${({ theme }) => theme.typography.bodySmall.size}px;
  line-height: ${({ theme }) => theme.typography.bodySmall.lineHeight}px;
`;

const Actions = styled.div`
  display: flex;
  width: 680px;
  align-items: center;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.space[8]}px;
`;

const DisabledAction = styled(Button)`
  opacity: 0.55;
`;

const FormError = styled.div`
  width: 680px;
  padding: ${({ theme }) => theme.space[16]}px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  color: ${({ theme }) => theme.colors.danger};
  background: ${({ theme }) => theme.colors.dangerSoft};
  font-family: ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
  font-size: ${({ theme }) => theme.typography.bodySmall.size}px;
  line-height: ${({ theme }) => theme.typography.bodySmall.lineHeight}px;
`;

const LoginLink = styled.a`
  display: inline-flex;
  min-height: 42px;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.raised};
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.label.weight} ${({ theme }) => theme.typography.label.size}px/${({ theme }) => theme.typography.label.lineHeight}px ${({ theme }) => theme.typography.label.family}, sans-serif;
  text-decoration: none;

  &:focus-visible { outline: 2px solid ${({ theme }) => theme.colors.primary}; outline-offset: 2px; }
`;

export default function TeamInvitationAcceptPage() {
  const navigate = useNavigate();
  const [token] = useState(() => new URLSearchParams(window.location.search).get('token') ?? '');
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loginRequired, setLoginRequired] = useState(false);
  const currentUser = getSessionUser();

  useLayoutEffect(() => {
    const currentUrl = new URL(window.location.href);
    if (currentUrl.searchParams.has('token')) {
      currentUrl.searchParams.delete('token');
      window.history.replaceState(window.history.state, '', `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`);
    }
  }, []);

  async function handleAccept() {
    if (!token || pending) return;
    setPending(true);
    setErrorMessage(null);

    try {
      const result = import.meta.env.DEV && isDemoMode()
        ? await import('../../entities/team/demo').then(({ acceptDemoTeamInvitation }) => acceptDemoTeamInvitation(token))
        : await acceptInvitation(token);
      navigate(`/teams/${encodeURIComponent(result.team.id)}`, { replace: true });
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error && error.status === 401) {
        setLoginRequired(true);
        setErrorMessage('학교 계정으로 로그인한 뒤 이 탭으로 돌아와 초대를 다시 수락해 주세요. 초대 정보는 이 탭에만 유지됩니다.');
        return;
      }
      setErrorMessage(import.meta.env.DEV && isDemoMode() && error instanceof Error && error.message === 'GONE'
        ? '이 초대는 만료되었거나 이미 사용 또는 취소되었습니다.'
        : getInvitationAcceptanceError(error));
    } finally {
      setPending(false);
    }
  }

  async function handleReject() {
    if (!token || pending || !(import.meta.env.DEV && isDemoMode())) return;
    setPending(true);
    setErrorMessage(null);
    try {
      const rejected = await import('../../entities/team/demo').then(({ rejectDemoTeamInvitation }) => rejectDemoTeamInvitation(token));
      if (!rejected) throw new Error('GONE');
      navigate('/teams', { replace: true });
    } catch {
      setErrorMessage('이 초대는 만료되었거나 이미 사용 또는 취소되었습니다.');
    } finally {
      setPending(false);
    }
  }

  const hasToken = token.length > 0;

  return (
    <Screen>
      <IntroductionPanel aria-label="GSM SV 소개">
        <Brand>
          <BrandLogo src="/assets/gsmsv-logo.svg" alt="" />
          <BrandName>GSM SV</BrandName>
        </Brand>
        <BreathingSpace aria-hidden="true" />
        <HeroTitle>아이디어가<br />서비스가 되는 곳.</HeroTitle>
        <IntroCopy>당신의 다음 프로젝트,<br />GSM의 클라우드에서 시작하세요.</IntroCopy>
        <BenefitsCard aria-labelledby="benefits-title">
          <BenefitsTitle id="benefits-title">만들기에 집중하세요</BenefitsTitle>
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
      </IntroductionPanel>

      <Content aria-labelledby="invitation-title">
        <Heading>
          <Title id="invitation-title">팀 초대가 도착했습니다</Title>
          <Subtitle>초대를 수락하면 일반 팀원으로 팀에 참여합니다.</Subtitle>
        </Heading>

        <DetailsCard aria-labelledby="invitation-details-title">
          <CardTitle id="invitation-details-title">초대 내용</CardTitle>
          <DetailRow>
            <DetailIcon aria-hidden="true"><Octicon name="people" size={16} /></DetailIcon>
            <DetailValue>
              <DetailLabel>팀</DetailLabel>
              <UnknownValue>초대 내용을 미리 보여 주는 API가 없어 확인할 수 없습니다</UnknownValue>
            </DetailValue>
          </DetailRow>
          <DetailRow>
            <DetailIcon aria-hidden="true"><Octicon name="person" size={16} /></DetailIcon>
            <DetailValue>
              <DetailLabel>초대한 사람</DetailLabel>
              <UnknownValue>초대 내용을 미리 보여 주는 API가 없어 확인할 수 없습니다</UnknownValue>
            </DetailValue>
          </DetailRow>
          <DetailRow>
            <DetailIcon aria-hidden="true"><Octicon name="shield" size={16} /></DetailIcon>
            <DetailValue>
              <DetailLabel>내 역할</DetailLabel>
              <DetailText>일반 팀원</DetailText>
            </DetailValue>
          </DetailRow>
          <DetailRow>
            <DetailIcon aria-hidden="true"><Octicon name="clock" size={16} /></DetailIcon>
            <DetailValue>
              <DetailLabel>만료</DetailLabel>
              <DetailText>발송 후 7일 · 초대 발송일은 확인할 수 없습니다</DetailText>
            </DetailValue>
          </DetailRow>
        </DetailsCard>

        <AccountCard>
          <DetailIcon aria-hidden="true"><Octicon name="info" size={20} /></DetailIcon>
          <AccountCopy>
            <AccountTitle>로그인한 계정으로 합류합니다</AccountTitle>
            <AccountIdentity>{currentUser?.name ?? '학교 계정으로 로그인한 후 초대를 수락할 수 있습니다'}</AccountIdentity>
          </AccountCopy>
        </AccountCard>

        <ContractNotice>
          {import.meta.env.DEV && isDemoMode()
            ? '초대 수락과 거절은 현재 로컬 미리보기에서만 적용됩니다.'
            : '초대 상세 조회와 거절 API가 아직 없습니다. 수락 전에 팀 이름과 초대한 사람을 확인할 수 없으며, 수락은 로그인한 학교 계정으로 요청됩니다.'}
        </ContractNotice>
        {!hasToken && <FormError role="alert">초대 링크에 유효한 토큰이 없습니다. 초대 링크를 다시 확인해 주세요.</FormError>}
        {errorMessage && <ErrorMessage role="alert">{errorMessage}</ErrorMessage>}

        <Actions>
          {loginRequired && <LoginLink href={invitationLoginUrl()} target="_blank" rel="noreferrer">학교 계정으로 로그인</LoginLink>}
          {import.meta.env.DEV && isDemoMode()
            ? <Button variant="ghost" icon={<Octicon name="x" size={16} />} disabled={!hasToken || pending} onClick={handleReject}>거절</Button>
            : <DisabledAction variant="ghost" icon={<Octicon name="x" size={16} />} disabled title="현재 공개 API에 초대 거절 operation이 없습니다.">거절</DisabledAction>}
          <Button
            variant="primary"
            icon={<Octicon name="check" size={16} />}
            disabled={!hasToken || pending}
            onClick={handleAccept}
          >
            {pending ? '초대 수락 중' : '초대 수락'}
          </Button>
        </Actions>
      </Content>
    </Screen>
  );
}

function invitationLoginUrl() {
  const apiOrigin = import.meta.env.VITE_API_ORIGIN?.replace(/\/+$/, '') ?? '';
  const authorizeParams = new URLSearchParams({ redirect: '/' });
  return `${apiOrigin}/api/v2/auth/datagsm/authorize?${authorizeParams}`;
}
