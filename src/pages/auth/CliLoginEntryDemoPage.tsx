import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import styled from 'styled-components';
import { getDemoCliRequest, getDemoCliRequestByCode, isDemoCliRequestExpired, normalizeCliCode, reissueDemoCliRequest } from '../../entities/demo-workflows';
import { isDemoMode } from '../../shared/demo';
import { Button, TextField } from '../../shared/ui/controls';
import { Octicon } from '../../shared/ui/icons';
import { CliLoginFrame } from './CliLoginFrame';

const Title = styled.h1`
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0 0 8px;
  font: 700 24px/34px ${({ theme }) => theme.typography.h1.family}, sans-serif;
`;
const Description = styled.p`
  margin: 0 0 24px;
  color: ${({ theme }) => theme.colors.muted};
  font: 400 14px/22px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;
const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 24px;
`;

export default function CliLoginEntryDemoPage() {
  return <CliLoginFrame>
    {isDemoMode()
      ? <CliCodeForm />
      : <><Title>목데이터 CLI 미리보기</Title><Description>?demo=1 모드에서 CLI 로그인 흐름을 확인할 수 있습니다.</Description></>}
  </CliLoginFrame>;
}

export function CliCodeForm({ initialCode = '', initialError = '' }: { initialCode?: string; initialError?: string }) {
  const navigate = useNavigate();
  const [code, setCode] = useState(initialCode);
  const [error, setError] = useState(initialError);
  const [request, setRequest] = useState(getDemoCliRequest);
  const [now, setNow] = useState(Date.now);
  const canReissue = request.status !== '확인 대기' || isDemoCliRequestExpired(request, now);

  useEffect(() => {
    function sync(event: StorageEvent) {
      if (!event.key || event.key === 'gsmsv.demo.state.v1.auth.cliRequest') {
        setRequest(getDemoCliRequest());
        setNow(Date.now());
      }
    }
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  useEffect(() => {
    if (canReissue) return;
    const timer = window.setTimeout(() => setNow(Date.now()), Math.max(0, (request.expiresAtMs ?? 0) - Date.now()));
    return () => window.clearTimeout(timer);
  }, [canReissue, request.expiresAtMs]);

  function reissue() {
    const next = reissueDemoCliRequest();
    if (!next) {
      setError('새 기기 코드를 저장하지 못했습니다. 다시 시도해 주세요.');
      return;
    }
    setRequest(getDemoCliRequest());
    setNow(Date.now());
    setCode(next.code);
    setError('');
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isDemoMode()) return;
    const normalized = normalizeCliCode(code);
    if (!normalized) {
      setError('8자리 코드를 입력하세요.');
      return;
    }
    const enteredRequest = getDemoCliRequestByCode(normalized);
    if (!enteredRequest) {
      setError('코드를 다시 확인하세요. 계속 안 되면 터미널에서 gsmsv login을 다시 실행하세요.');
      return;
    }
    void navigate(`/cli/approve?code=${encodeURIComponent(enteredRequest.code)}`);
  }

  return <>
    <Title><Octicon name={error ? 'alert' : 'terminal'} size={24} />{error ? '코드를 찾을 수 없습니다' : '코드를 입력하세요'}</Title>
    {!error && <Description>브라우저가 자동으로 열리지 않았다면 gsmsv.site/cli에 직접 들어와 코드를 입력합니다.</Description>}
    <form onSubmit={submit}>
      <TextField label="기기 코드" autoComplete="one-time-code" autoCapitalize="characters" value={code} onChange={event => { setCode(event.target.value.toUpperCase()); setError(''); }} placeholder={request.code} hint="터미널의 gsmsv login이 보여준 8자리 코드" error={error} />
      <Actions>{canReissue && <Button type="button" variant="secondary" onClick={reissue}>새 데모 코드 받기</Button>}<Button type="submit" icon={<Octicon name="arrow-right" size={16} />}>다음</Button></Actions>
    </form>
  </>;
}
