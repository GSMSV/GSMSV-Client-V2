import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import styled from 'styled-components';
import { getDemoCliRequest } from '../../entities/demo-workflows';
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
  const request = getDemoCliRequest();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isDemoMode()) return;
    const normalized = normalizeCliCode(code);
    if (!normalized) {
      setError('8자리 코드를 입력하세요.');
      return;
    }
    if (normalized !== normalizeCliCode(request.code)) {
      setError('코드를 다시 확인하세요. 계속 안 되면 터미널에서 gsmsv login을 다시 실행하세요.');
      return;
    }
    void navigate(`/cli/approve?code=${encodeURIComponent(request.code)}`);
  }

  return <>
    <Title><Octicon name={error ? 'alert' : 'terminal'} size={24} />{error ? '코드를 찾을 수 없습니다' : '코드를 입력하세요'}</Title>
    {!error && <Description>브라우저가 자동으로 열리지 않았다면 gsmsv.site/cli에 직접 들어와 코드를 입력합니다.</Description>}
    <form onSubmit={submit}>
      <TextField label="기기 코드" autoComplete="one-time-code" autoCapitalize="characters" value={code} onChange={event => { setCode(event.target.value.toUpperCase()); setError(''); }} placeholder={request.code} hint="터미널의 gsmsv login이 보여준 8자리 코드" error={error} />
      <Actions><Button type="submit" icon={<Octicon name="arrow-right" size={16} />}>다음</Button></Actions>
    </form>
  </>;
}

export function normalizeCliCode(value: string): string | null {
  const normalized = value.replace(/[-\s]/g, '').toUpperCase();
  return /^[A-Z0-9]{8}$/.test(normalized) ? normalized : null;
}
