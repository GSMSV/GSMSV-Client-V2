import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import styled from 'styled-components';
import type { DemoProfile } from '../../../../entities/profile';
import { Button } from '../../../../shared/ui/controls';
import { Octicon } from '../../../../shared/ui/icons';
import { AccountDialog, DialogCopy } from './AccountDialog';

const ConnectionRow = styled.div`
  display: flex;
  min-height: 44px;
  align-items: center;
  gap: ${({ theme }) => theme.space[16]}px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  &:last-of-type { border-bottom: 0; }
`;

const AllDevicesAction = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const ConnectionCopy = styled.div`
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]}px;
  font: ${({ theme: { typography: { bodySmall } } }) => `${bodySmall.weight} ${bodySmall.size}px/${bodySmall.lineHeight}px ${bodySmall.family}`}, sans-serif;

  span:first-child {
    color: ${({ theme }) => theme.colors.faint};
    font: ${({ theme: { typography: { label } } }) => `${label.weight} ${label.size}px/${label.lineHeight}px ${label.family}`}, sans-serif;
  }
`;

type ConnectionDialog =
  | 'github-progress' | 'github-success' | 'github-error' | 'github-conflict' | 'github-unlink'
  | 'discord-connect' | 'discord-success' | 'discord-error' | 'discord-unlink'
  | 'cli-devices' | 'cli-logout';

export function DemoAccountConnections({ profile, onSave, onLogout }: {
  profile: DemoProfile;
  onSave: (changes: Partial<DemoProfile>) => boolean;
  onLogout: () => void;
}) {
  const [params] = useSearchParams();
  const [dialog, setDialog] = useState<ConnectionDialog | null>(null);
  const [cliReturn, setCliReturn] = useState<'cli-devices' | null>(null);
  const [tryOtherGithub, setTryOtherGithub] = useState(false);
  const [tryDiscordAgain, setTryDiscordAgain] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const githubOutcome = params.get('github');
  const discordOutcome = params.get('discord');

  function show(next: ConnectionDialog | null) {
    setSaveFailed(false);
    setDialog(next);
  }

  function save(changes: Partial<DemoProfile>, next: ConnectionDialog | null) {
    if (onSave(changes)) show(next);
    else setSaveFailed(true);
  }

  useEffect(() => {
    if (dialog !== 'github-progress') return;
    const timer = window.setTimeout(() => {
      if (githubOutcome === 'conflict' && !tryOtherGithub) {
        setDialog('github-conflict');
      } else if (githubOutcome === 'expired' && !tryOtherGithub) {
        setDialog('github-error');
      } else if (onSave({ github: githubOutcome === 'conflict' && tryOtherGithub ? '@gsm-jimin-alt' : '@gsm-jimin' })) {
        setDialog('github-success');
      } else {
        setDialog('github-error');
      }
    }, 900);
    return () => window.clearTimeout(timer);
  }, [dialog, githubOutcome, onSave, tryOtherGithub]);

  const saveError = saveFailed && <DialogCopy role="alert">변경 내용을 저장하지 못했습니다.</DialogCopy>;
  const dismiss = () => show(null);
  const secondary = (label: string, onClick = dismiss) => <Button variant="secondary" onClick={onClick}>{label}</Button>;
  const devices = profile.cliDevices;
  const deviceNames = devices.map(device => device.name).join(' · ');
  const deviceSummary = devices.length ? `${deviceNames} · ${devices.length}대 연결됨 · ${devices[0].lastUsed}` : '연결된 기기 없음';

  function retryGithub() {
    setTryOtherGithub(true);
    show('github-progress');
  }

  let modal;
  switch (dialog) {
    case 'github-progress':
      modal = <AccountDialog title="GitHub로 이동하고 있습니다" icon="sync"
        description="GitHub에서 권한을 허락하면 이 화면으로 돌아옵니다."
        onDismiss={() => show('github-error')} actions={secondary('취소', () => show('github-error'))} />;
      break;
    case 'github-success':
      modal = <AccountDialog title="GitHub를 연결했습니다" icon="check-circle"
        description={`· ${profile.github}\n· 이 계정의 push로 앱을 자동 배포할 수 있습니다.`}
        onDismiss={dismiss} actions={<Button onClick={dismiss}>확인</Button>} />;
      break;
    case 'github-error':
      modal = <AccountDialog title="GitHub를 연결하지 못했습니다" icon="alert"
        description={'연결을 취소했거나 요청이 만료됐습니다.\n다시 연결해 주세요.'}
        onDismiss={dismiss} actions={<>{secondary('닫기')}<Button onClick={retryGithub}>다시 연결</Button></>} />;
      break;
    case 'github-conflict':
      modal = <AccountDialog title="이미 다른 계정에 연결된 GitHub 계정입니다" icon="alert"
        description="다른 GitHub 계정으로 연결해 주세요." onDismiss={dismiss}
        actions={<>{secondary('닫기')}<Button onClick={retryGithub}>다른 계정으로 연결</Button></>} />;
      break;
    case 'github-unlink':
      modal = <AccountDialog title="GitHub 연결을 해제하시겠습니까?" icon="link"
        description="이 GitHub 계정의 push는 앞으로 자동으로 배포되지 않습니다." onDismiss={dismiss}
        actions={<>{secondary('취소')}<Button variant="danger" onClick={() => save({ github: null }, null)}>해제</Button></>}>{saveError}</AccountDialog>;
      break;
    case 'discord-connect':
      modal = <AccountDialog title="Discord 연결" icon="link"
        description={'Discord에서 계정을 확인한 뒤 GSM SV로 돌아옵니다.\n· 받는 정보 · Discord 사용자 번호와 사용자 이름'}
        onDismiss={dismiss} actions={<>
          {secondary('취소')}
          <Button onClick={() => {
            if (discordOutcome === 'expired' && !tryDiscordAgain) show('discord-error');
            else save({ discordConnected: true }, 'discord-success');
          }}>Discord로 이동</Button>
        </>}>{saveError}</AccountDialog>;
      break;
    case 'discord-success':
      modal = <AccountDialog title="Discord를 연결했습니다" icon="check-circle"
        description={'@jimin_2107 계정과 연결됐습니다.\n필수 알림을 이메일과 Discord로 함께 받습니다.'}
        onDismiss={dismiss} actions={<>{secondary('연결 해제', () => show('discord-unlink'))}<Button onClick={dismiss}>확인</Button></>} />;
      break;
    case 'discord-error':
      modal = <AccountDialog title="Discord를 연결하지 못했습니다" icon="alert"
        description={'연결을 취소했거나 요청이 만료됐습니다.\n다시 연결해 주세요.\n· 연결하지 않아도 필수 알림은 이메일로 받습니다'}
        onDismiss={dismiss} actions={<>{secondary('닫기')}<Button onClick={() => { setTryDiscordAgain(true); show('discord-connect'); }}>다시 연결</Button></>} />;
      break;
    case 'discord-unlink':
      modal = <AccountDialog title="Discord 연결을 해제하시겠습니까?" icon="link"
        description={'해제하면 Discord로 알림이 가지 않습니다.\n필수 알림은 이메일로 계속 보냅니다.'} onDismiss={dismiss}
        actions={<>{secondary('취소')}<Button variant="danger" onClick={() => save({ discordConnected: false }, null)}>해제</Button></>}>{saveError}</AccountDialog>;
      break;
    case 'cli-devices':
      modal = <AccountDialog title="연결된 CLI 기기" icon="terminal" onDismiss={dismiss}
        actions={<>{secondary('닫기')}<Button variant="secondary" onClick={() => { setCliReturn('cli-devices'); show('cli-logout'); }}>모든 기기에서 로그아웃</Button></>}>
        {devices.map(device => <div key={device.id}>
          <DialogCopy>· {device.name}{device.platform ? ` · ${device.platform}` : ''} · {device.lastUsed}</DialogCopy>
          <Button variant="ghost" onClick={() => save({ cliDevices: devices.filter(item => item.id !== device.id) }, 'cli-devices')}>연결 해제</Button>
        </div>)}
        {!devices.length && <DialogCopy>연결된 기기 없음</DialogCopy>}
        <DialogCopy>· 기기마다 30일 동안 로그인이 유지됩니다.</DialogCopy>
        {saveError}
      </AccountDialog>;
      break;
    case 'cli-logout':
      modal = <AccountDialog title="모든 기기에서 로그아웃하시겠습니까?" icon="sign-out"
        description={`이 브라우저를 포함해 로그인된 모든 브라우저와 CLI 기기 ${devices.length}대의 로그인이 끝납니다.\n· 실행 중인 VM과 함수는 그대로 동작합니다\n· 다시 DataGSM으로 로그인해야 합니다`}
        onDismiss={() => show(cliReturn)} actions={<>
          {secondary('취소', () => show(cliReturn))}
          <Button variant="danger" onClick={() => {
            if (onSave({ cliDevices: [], signedOut: true })) onLogout();
            else setSaveFailed(true);
          }}>모든 기기에서 로그아웃</Button>
        </>}>{saveError}</AccountDialog>;
      break;
  }

  return (
    <>
      <ConnectionRow>
        <Octicon name="link" aria-hidden="true" />
        <ConnectionCopy><span>GitHub</span><span>{profile.github ? `${profile.github} · 연결됨` : '연결되지 않음'}</span></ConnectionCopy>
        <Button variant="secondary" onClick={() => { setTryOtherGithub(false); show(profile.github ? 'github-unlink' : 'github-progress'); }}>{profile.github ? '해제' : '연결'}</Button>
      </ConnectionRow>
      <ConnectionRow>
        <Octicon name="link" aria-hidden="true" />
        <ConnectionCopy><span>Discord</span><span>{profile.discordConnected ? '@jimin_2107 · 연결됨' : '연결되지 않음 · 현재는 이메일로 알림을 받습니다.'}</span></ConnectionCopy>
        <Button variant="secondary" onClick={() => { setTryDiscordAgain(false); show(profile.discordConnected ? 'discord-unlink' : 'discord-connect'); }}>{profile.discordConnected ? '해제' : '연결'}</Button>
      </ConnectionRow>
      <ConnectionRow>
        <Octicon name="terminal" aria-hidden="true" />
        <ConnectionCopy><span>CLI 기기</span><span>{deviceSummary}</span></ConnectionCopy>
        <Button variant="secondary" onClick={() => show('cli-devices')}>관리</Button>
      </ConnectionRow>
      <AllDevicesAction>
        <Button variant="secondary" onClick={() => { setCliReturn(null); show('cli-logout'); }}>모든 기기에서 로그아웃</Button>
      </AllDevicesAction>
      {modal}
    </>
  );
}
