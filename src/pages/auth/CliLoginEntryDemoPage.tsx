import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import styled from 'styled-components';
import { getDemoCliRequest } from '../../entities/demo-workflows';
import { getSessionUser } from '../../entities/session';
import { isDemoMode } from '../../shared/demo';
import { Button } from '../../shared/ui/controls';

const Page = styled.main`
  display: grid;
  min-height: 100vh;
  place-items: center;
  padding: 24px;
  background: ${({ theme }) => theme.colors.canvas};
  color: ${({ theme }) => theme.colors.text};
`;
const Panel = styled.section`
  width: min(480px, 100%);
  padding: 32px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};
`;
const Title = styled.h1`
  margin: 0 0 8px;
  font: 700 28px/36px ${({ theme }) => theme.typography.h1.family}, sans-serif;
`;
const Description = styled.p`
  margin: 0 0 24px;
  color: ${({ theme }) => theme.colors.muted};
  font: 400 14px/22px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;
const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font: 500 14px/20px ${({ theme }) => theme.typography.body.family}, sans-serif;
`;
const CodeInput = styled.input`
  width: 100%;
  padding: 14px 16px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.canvas};
  color: ${({ theme }) => theme.colors.text};
  font: 500 24px/32px 'DM Mono', monospace;
  letter-spacing: 3px;
  text-align: center;
`;
const Error = styled.p`
  margin: 12px 0 0;
  color: ${({ theme }) => theme.colors.danger};
  font: 400 14px/22px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;
const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
`;

export default function CliLoginEntryDemoPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isDemoMode()) return;
    const normalized = normalizeCode(code);
    if (!normalized) {
      setError('8자리 코드를 입력하세요.');
      return;
    }
    const request = getDemoCliRequest();
    if (normalized !== request.code.replace(/-/g, '').toUpperCase()) {
      setError('코드를 찾을 수 없습니다. 터미널에 표시된 코드를 확인하세요.');
      return;
    }
    const expired = request.status === '만료됨' || (request.status === '확인 대기' && Date.now() >= (request.expiresAtMs ?? 0));
    if (expired) {
      setError('코드가 만료되었습니다. 터미널에서 새 코드를 요청하세요.');
      return;
    }
    if (request.status !== '확인 대기') {
      setError('이미 사용했거나 거부된 코드입니다. 터미널에서 새 코드를 요청하세요.');
      return;
    }
    const approvalPath = `/cli/approve?code=${encodeURIComponent(request.code)}`;
    const loggedIn = Boolean(getSessionUser());
    void navigate(loggedIn ? approvalPath : `/login?returnTo=${encodeURIComponent(approvalPath)}`);
  }

  return <Page><Panel>
    {!isDemoMode() ? <><Title>로컬 미리보기 전용</Title><Description>?demo=1 모드에서만 목데이터 CLI 로그인 흐름을 확인할 수 있습니다.</Description></> : <>
      <Title>CLI 로그인</Title>
      <Description>터미널에 표시된 8자리 코드를 입력해 계정 연결을 계속하세요.</Description>
      <form onSubmit={submit}>
        <Label htmlFor="cli-code">기기 코드</Label>
        <CodeInput id="cli-code" autoComplete="one-time-code" autoCapitalize="characters" maxLength={9} value={code} onChange={event => { setCode(event.target.value.toUpperCase()); setError(''); }} placeholder="ABCD-EFGH" />
        {error && <Error role="alert">{error}</Error>}
        <Actions><Button type="submit">계속</Button></Actions>
      </form>
    </>}
  </Panel></Page>;
}

function normalizeCode(value: string): string | null {
  const normalized = value.replace(/-/g, '').replace(/\s/g, '').toUpperCase();
  return /^[A-Z0-9]{8}$/.test(normalized) ? normalized : null;
}
