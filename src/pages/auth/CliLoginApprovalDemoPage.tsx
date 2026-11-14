import { useState } from 'react';
import { useSearchParams } from 'react-router';
import styled from 'styled-components';
import { getDemoCliRequest, saveDemoCliRequest, type CliLoginRequest } from '../../entities/demo-workflows';
import { getSessionUser } from '../../entities/session';
import { isDemoMode } from '../../shared/demo';
import { Button } from '../../shared/ui/controls';
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
  align-items: center;
  gap: 8px;
  color: ${({ theme }) => theme.colors.muted};
  font: 400 14px/22px ${({ theme }) => theme.typography.body.family}, sans-serif;
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

export default function CliLoginApprovalDemoPage() {
  const [searchParams] = useSearchParams();
  const [request, setRequest] = useState(() => getDemoCliRequest());
  const [notice, setNotice] = useState('');
  const user = getSessionUser();
  const email = user?.id === 'demo-admin' ? 'admin@example.com' : 'jimin@example.com';
  const requestedCode = searchParams.get('code');
  const codeMatches = !requestedCode || requestedCode.toUpperCase() === request.code;
  const active = isDemoMode() && codeMatches && request.status === '확인 대기';

  function decide(status: CliLoginRequest['status']) {
    if (!active) return;
    const updated = { ...request, status };
    saveDemoCliRequest(updated);
    setRequest(updated);
    setNotice(status === '승인 완료' ? 'CLI 로그인을 승인했습니다. 이 기기는 로컬 미리보기에서 연결된 것으로 표시됩니다.' : 'CLI 로그인 요청을 거부했습니다.');
  }

  return <Page><Header><Logo><LogoMark src="/assets/gsmsv-logo.svg" alt="" /> GSM SV</Logo><SignedIn><Octicon name="person" size={16} /> {email}으로 로그인됨</SignedIn></Header><Center><Panel>
    {!isDemoMode() ? <><Title>로컬 미리보기 전용</Title><Description>?demo=1 모드에서만 목데이터 승인 흐름을 확인할 수 있습니다.</Description></> : <>
      <Title>{request.status === '확인 대기' ? 'CLI 로그인을 승인하시겠습니까?' : `CLI 로그인 ${request.status}`}</Title>
      <Description>터미널에 표시된 코드와 같은지 확인하세요.</Description>
      <CodeCard><CodeText>{request.code}</CodeText><Description style={{ margin: 0, fontSize: 12 }}>코드는 요청 후 10분 동안 쓸 수 있습니다 · {request.expiresAt}</Description></CodeCard>
      {!codeMatches && <Warning role="alert"><Octicon name="alert" size={18} />요청이 만료되었거나 코드가 일치하지 않습니다. 터미널에서 새 코드를 요청하세요.</Warning>}
      <Warning><Octicon name="alert" size={20} /><span><strong>직접 실행한 요청이 아니면 거부하세요</strong><br />승인하면 이 기기에서 내 계정으로 VM과 함수를 다룰 수 있고, 로그인은 30일 동안 유지됩니다. 계정 설정 · 연결된 CLI 기기에서 언제든 해제할 수 있습니다.</span></Warning>
      <InfoLine><Octicon name="terminal" size={16} /><span><Label>기기</Label><Value>{request.device}</Value></span></InfoLine>
      <InfoLine><Octicon name="clock" size={16} /><span><Label>요청 시각</Label><Value>{request.requestedAt} · 방금</Value></span></InfoLine>
      <InfoLine><Octicon name="person" size={16} /><span><Label>로그인 계정</Label><Value>김지민 · {email}</Value></span></InfoLine>
      <InfoLine><Octicon name="key" size={16} /><span><Label>받는 권한</Label><Value>웹과 같은 권한 · VM·함수 조회, 생성, 전원, 연장</Value></span></InfoLine>
      {notice && <Warning role="status"><Octicon name="info" size={18} />{notice}</Warning>}
      <Actions><Button variant="secondary" disabled={!active} icon={<Octicon name="x" size={16} />} onClick={() => decide('거부됨')}>거부</Button><Button disabled={!active} icon={<Octicon name="check" size={16} />} onClick={() => decide('승인 완료')}>승인</Button></Actions>
    </>}
  </Panel></Center></Page>;
}
