import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import styled from 'styled-components';
import { getDemoCliRequest, saveDemoCliRequest, type CliLoginRequest } from '../../entities/demo-workflows';
import { getDemoProfile, saveDemoProfile, updateDemoProfile } from '../../entities/profile';
import { clearSessionUser, getSessionUser } from '../../entities/session';
import { isDemoMode } from '../../shared/demo';
import { Button } from '../../shared/ui/controls';
import { Octicon } from '../../shared/ui/icons';
import { CliCodeForm, normalizeCliCode } from './CliLoginEntryDemoPage';
import { CliLoginFrame } from './CliLoginFrame';

const Title = styled.h1`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: 700 32px/42px ${({ theme }) => theme.typography.h1.family}, sans-serif;
`;
const Description = styled.p`
  margin: 8px 0 16px;
  color: ${({ theme }) => theme.colors.muted};
  font: 400 14px/22px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;
const CodeCard = styled.div`
  display: flex;
  min-height: 114px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: #211f24;
`;
const CodeText = styled.code`
  color: ${({ theme }) => theme.colors.text};
  font: 500 30px/40px 'DM Mono', monospace;
  letter-spacing: 2px;
`;
const Warning = styled.div`
  display: flex;
  gap: 12px;
  margin: 16px 0;
  padding: 16px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.warningSoft};
  color: ${({ theme }) => theme.colors.warning};
  font: 400 14px/22px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;
const InfoLine = styled.div`
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr);
  gap: 12px;
  margin: 16px 0;
  color: ${({ theme }) => theme.colors.muted};
`;
const Label = styled.span`
  display: block;
  margin-bottom: 2px;
  color: ${({ theme }) => theme.colors.faint};
  font: 400 12px/18px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;
const Value = styled.span`
  color: ${({ theme }) => theme.colors.text};
  font: 400 14px/22px ${({ theme }) => theme.typography.body.family}, sans-serif;
`;
const Actions = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 20px;
`;

const StateTitle = styled(Title)`
  display: flex;
  align-items: center;
  gap: 12px;
  font: 700 24px/34px ${({ theme }) => theme.typography.h2.family}, sans-serif;
`;

const StateActions = styled(Actions)`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
`;

export default function CliLoginApprovalDemoPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [request, setRequest] = useState(getDemoCliRequest);
  const [outcome, setOutcome] = useState<'승인 완료' | '거부됨'>();
  const [notice, setNotice] = useState('');
  const [now, setNow] = useState(Date.now);
  const profile = getDemoProfile();
  const user = profile?.signedOut ? null : getSessionUser();
  const email = user?.id === 'demo-admin' ? 'admin@example.com' : profile?.email;
  const requestedCode = searchParams.get('code') ?? '';
  const codeMatches = normalizeCliCode(requestedCode) === normalizeCliCode(request.code);
  const expired = request.status === '만료됨'
    || (request.status === '확인 대기' && now >= (request.expiresAtMs ?? 0));
  const consumed = request.status === '승인 완료' || request.status === '거부됨';

  useEffect(() => {
    if (request.status !== '확인 대기' || expired) return;
    const timer = window.setInterval(() => {
      setNow(Date.now());
      setRequest(getDemoCliRequest());
    }, 1_000);
    return () => window.clearInterval(timer);
  }, [expired, request.status]);

  function decide(status: '승인 완료' | '거부됨') {
    if (!isDemoMode() || !user || !codeMatches || outcome) return;
    const latest = getDemoCliRequest();
    if (latest.status !== '확인 대기' || latest.code !== request.code || Date.now() >= (latest.expiresAtMs ?? 0)) {
      setNow(Date.now());
      setRequest(latest);
      return;
    }

    const updated = { ...latest, status } satisfies CliLoginRequest;
    const latestProfile = getDemoProfile();
    if (status === '승인 완료') {
      if (!latestProfile || latestProfile.signedOut) return;
      const device = { id: 'device-macbook', name: 'MacBook-Air', platform: 'macOS', lastUsed: '마지막 사용 방금' };
      const cliDevices = [...latestProfile.cliDevices.filter(item => item.id !== device.id), device];
      if (!updateDemoProfile({ cliDevices })) {
        setNotice('CLI 기기를 저장하지 못했습니다. 다시 시도해 주세요.');
        return;
      }
    }

    if (!saveDemoCliRequest(updated)) {
      if (status === '승인 완료' && latestProfile) saveDemoProfile(latestProfile);
      setNotice('요청을 저장하지 못했습니다. 다시 시도해 주세요.');
      return;
    }
    setRequest(updated);
    setOutcome(status);
    setNotice('');
  }

  function logOutDevices() {
    if (!updateDemoProfile({ cliDevices: [], signedOut: true })) {
      setNotice('로그아웃 상태를 저장하지 못했습니다. 다시 시도해 주세요.');
      return;
    }
    clearSessionUser();
    void navigate('/login', { replace: true });
  }

  const goToEntry = () => void navigate('/cli');
  const close = <Button variant="secondary" onClick={goToEntry}>닫기</Button>;
  const requestSummary = <Description>· 코드 {request.code} · {request.device}</Description>;
  const error = notice && <Warning role="alert"><Octicon name="alert" size={18} />{notice}</Warning>;

  if (!isDemoMode()) return <CliLoginFrame><StateTitle>목데이터 CLI 미리보기</StateTitle><Description>?demo=1 모드에서 CLI 로그인 승인을 확인할 수 있습니다.</Description></CliLoginFrame>;

  let content;
  if (!codeMatches) {
    content = <CliCodeForm initialCode={requestedCode} initialError={requestedCode.trim() ? '코드를 다시 확인하세요. 계속 안 되면 터미널에서 gsmsv login을 다시 실행하세요.' : ''} />;
  } else if (outcome === '승인 완료') {
    content = <>
      <StateTitle><Octicon name="check-circle" size={24} />승인했습니다</StateTitle>
      <Description>목데이터 CLI 기기가 연결되었습니다. 계정 설정에서 연결을 해제할 수 있습니다.</Description>
      <Description>· 기기 · {request.device}</Description>
      <StateActions><Button variant="secondary" icon={<Octicon name="gear" size={16} />} onClick={() => void navigate('/settings')}>연결된 CLI 기기 보기</Button></StateActions>
    </>;
  } else if (outcome === '거부됨') {
    content = <>
      <StateTitle><Octicon name="x" size={24} />요청을 거부했습니다</StateTitle>
      <Description>이 기기는 로그인되지 않았습니다. 직접 실행한 요청이 아니었다면 모든 기기에서 로그아웃하고 문의해 주세요.</Description>
      {error}
      <StateActions><Button variant="secondary" onClick={() => void navigate('/support/inquiries')}>문의하기</Button><Button variant="danger" onClick={logOutDevices}>모든 기기에서 로그아웃</Button></StateActions>
    </>;
  } else if (consumed) {
    content = <>
      <StateTitle><Octicon name="check" size={24} />이미 처리된 코드입니다</StateTitle>
      <Description>같은 코드는 한 번만 쓸 수 있습니다. 터미널이 로그인됐는지 확인하세요.</Description>
      {requestSummary}
      <StateActions>{close}</StateActions>
    </>;
  } else if (expired) {
    content = <>
      <StateTitle><Octicon name="clock" size={24} />코드가 만료됐습니다</StateTitle>
      <Description>코드는 요청 후 10분 동안만 쓸 수 있습니다. 터미널에서 gsmsv login을 다시 실행해 새 코드를 받으세요.</Description>
      {requestSummary}
      <StateActions>{close}</StateActions>
    </>;
  } else if (!user) {
    const target = `/cli/approve?code=${encodeURIComponent(request.code)}`;
    content = <>
      <StateTitle><Octicon name="sign-in" size={24} />로그인하면 승인 화면으로 돌아옵니다</StateTitle>
      <Description>CLI 승인은 로그인한 계정으로만 할 수 있습니다. DataGSM 로그인이 끝나면 코드가 입력된 승인 화면으로 돌아옵니다.</Description>
      {requestSummary}
      <StateActions><Button icon={<Octicon name="sign-in" size={16} />} onClick={() => void navigate(`/login?returnTo=${encodeURIComponent(target)}`)}>DataGSM으로 로그인</Button></StateActions>
    </>;
  } else {
    const remainingMinutes = Math.max(1, Math.ceil(((request.expiresAtMs ?? now) - now) / 60_000));
    content = <>
      <Title>CLI 로그인을 승인하시겠습니까?</Title>
      <Description>터미널에 표시된 코드와 같은지 확인하세요.</Description>
      <CodeCard><CodeText>{request.code}</CodeText><Description style={{ margin: 0, fontSize: 12 }}>코드는 요청 후 10분 동안 쓸 수 있습니다 · {remainingMinutes}분 남음</Description></CodeCard>
      <Warning><Octicon name="alert" size={20} /><span><strong>직접 실행한 요청이 아니면 거부하세요</strong><br />승인하면 이 기기에서 내 계정으로 VM과 함수를 다룰 수 있고, 로그인은 30일 동안 유지됩니다. 계정 설정 · 연결된 CLI 기기에서 언제든 해제할 수 있습니다.</span></Warning>
      <InfoLine><Octicon name="terminal" size={16} /><span><Label>기기</Label><Value>{request.device}</Value></span></InfoLine>
      <InfoLine><Octicon name="clock" size={16} /><span><Label>요청 시각</Label><Value>{request.requestedAt} · 방금</Value></span></InfoLine>
      <InfoLine><Octicon name="person" size={16} /><span><Label>로그인 계정</Label><Value>{user.id === 'demo-admin' ? user.name : profile?.name} · {email}</Value></span></InfoLine>
      <InfoLine><Octicon name="key" size={16} /><span><Label>받는 권한</Label><Value>웹과 같은 권한 · VM·함수 조회, 생성, 전원, 연장</Value></span></InfoLine>
      {error}
      <Actions>
        <Button variant="secondary" icon={<Octicon name="x" size={16} />} onClick={() => decide('거부됨')}>거부</Button>
        <Button icon={<Octicon name="check" size={16} />} onClick={() => decide('승인 완료')}>승인</Button>
      </Actions>
    </>;
  }
  return <CliLoginFrame email={user ? email : undefined}>{content}</CliLoginFrame>;
}
