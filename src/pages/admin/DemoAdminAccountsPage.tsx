import { useState } from 'react';
import { getDemoProfile, updateDemoProfile } from '../../entities/profile';
import { AccountDialog, DialogCopy } from '../../features/settings/demo-account';
import { getDemoAccounts, saveDemoAccounts, type DemoAccount } from '../../entities/demo-workflows';
import { Button } from '../../shared/ui/controls';
import { Octicon } from '../../shared/ui/icons';
import { Alert, Card, CardHeader, Heading, Hint, Muted, PageStack, SectionTitle, Table, TableWrap, Title, TitleGroup, WorkflowLayout, DemoOnlyGate } from '../demo-workflows/ui/WorkflowLayout';

export default function DemoAdminAccountsPage() {
  const [accounts, setAccounts] = useState(() => getDemoAccounts());
  const [selectedId, setSelectedId] = useState(() => accounts[0]?.id ?? '');
  const [notice, setNotice] = useState('');
  const current = accounts.find((account) => account.id === selectedId) ?? accounts[0];

  const [confirm, setConfirm] = useState<{ account: DemoAccount; provider: 'github' | 'discord' } | null>(null);
  const [failed, setFailed] = useState(false);

  function showDisconnect(provider: 'github' | 'discord') {
    if (!current) return;
    setFailed(false);
    setConfirm({ account: current, provider });
  }

  function forceDisconnect() {
    if (!confirm) return;
    const { account, provider } = confirm;
    const label = provider === 'github' ? 'GitHub' : 'Discord';
    const profile = getDemoProfile();
    const saved = profile?.email === account.email
      ? Boolean(updateDemoProfile(provider === 'github' ? { github: null } : { discordConnected: false }))
      : saveDemoAccounts(getDemoAccounts().map(item => item.id === account.id ? { ...item, [provider]: '연결 안 됨' } : item));
    if (!saved) {
      setFailed(true);
      return;
    }
    setAccounts(getDemoAccounts());
    setConfirm(null);
    setNotice(`${label} 연결을 해제했습니다.`);
  }

  return <DemoOnlyGate admin><WorkflowLayout admin activeAdminItem="관리자 점검"><PageStack>
    <p style={{ margin: 0, color: '#a8a2af', fontSize: 12 }}>관리자 / 관리자 계정 점검</p>
    <Heading><TitleGroup><Title>관리자 계정 점검</Title><Muted>학교 정보·역할·소속 팀과 외부 계정 연결 상태를 확인하세요.</Muted></TitleGroup><Button disabled title="역할 지정과 회수는 실제 실행 기능이 연결되지 않았습니다."><Octicon name="plus" size={16} /> 관리자 지정</Button></Heading>
    <Alert><Octicon name="shield" size={18} /><span><strong>관리자 지정·회수는 검토 중입니다</strong><br />관리자로 지정하거나 권한을 회수하는 동작은 아직 연결하지 않았습니다.</span></Alert>
    {notice && <Alert $tone="success" role="status"><Octicon name="info" size={16} />{notice}</Alert>}
    <Card><CardHeader><SectionTitle>계정 목록</SectionTitle></CardHeader><TableWrap><Table><thead><tr><th>이름 · 학번</th><th>학교 이메일</th><th>역할</th><th>소속 팀</th><th>GitHub</th><th>Discord</th></tr></thead><tbody>{accounts.map((account) => <tr key={account.id} aria-selected={account.id === current?.id} onClick={() => setSelectedId(account.id)}><td>{account.name} · {account.studentId}</td><td>{account.email}</td><td>{account.role}</td><td>{account.team}</td><td>{account.github}</td><td>{account.discord}</td></tr>)}</tbody></Table></TableWrap><Hint>{accounts.length}개 중 1–{accounts.length}</Hint></Card>
    {current && <Card><CardHeader><SectionTitle>{current.name} · 외부 계정</SectionTitle></CardHeader><Muted>학교 정보는 DataGSM에서 와서 여기서 고칠 수 없습니다. 연결을 강제로 해제하면 그 사람이 다시 연결해야 합니다.</Muted>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: 16, marginTop: 20 }}><div><Hint>GitHub</Hint><Muted>{current.github} · {current.github === '연결 안 됨' ? '연결 안 됨' : '연결됨'}</Muted></div><Button variant="danger" disabled={current.github === '연결 안 됨'} icon={<Octicon name="x" size={16} />} onClick={() => showDisconnect('github')}>연결 강제 해제</Button><div><Hint>Discord</Hint><Muted>{current.discord} · {current.discord === '연결 안 됨' ? '연결 안 됨' : '연결됨'}</Muted></div><Button variant="danger" disabled={current.discord === '연결 안 됨'} icon={<Octicon name="x" size={16} />} onClick={() => showDisconnect('discord')}>연결 강제 해제</Button></div>
    </Card>}
    <SectionTitle>확정이 필요한 보호 규칙</SectionTitle><div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 16 }}><Card><Octicon name="lock" size={20} /><SectionTitle style={{ marginTop: 16 }}>자기 권한 보호</SectionTitle><Muted>현재 로그인한 관리자는 자신의 권한을 회수할 수 없습니다.</Muted><div style={{ marginTop: 16 }}><Button variant="secondary" disabled>권한 회수</Button></div></Card><Card><Octicon name="people" size={20} /><SectionTitle style={{ marginTop: 16 }}>마지막 관리자 보호</SectionTitle><Muted>관리자가 한 명만 남았다면 권한 회수를 막습니다.</Muted><div style={{ marginTop: 16 }}><Button variant="secondary" disabled>권한 회수</Button></div></Card><Card><Octicon name="checklist" size={20} /><SectionTitle style={{ marginTop: 16 }}>졸업 후 계정 점검</SectionTitle><Muted>졸업한 관리자의 접근은 유지됩니다. 인수인계 이후 회수 절차가 필요합니다.</Muted><div style={{ marginTop: 16 }}><Button variant="secondary" disabled>회수 절차 검토</Button></div></Card></div>
    {confirm && <AccountDialog
      title={`${confirm.account.name}의 ${confirm.provider === 'github' ? 'GitHub' : 'Discord'} 연결을 해제하시겠습니까?`}
      icon="link" description={confirm.provider === 'github'
        ? `· ${confirm.account.github}\n· 다시 연결할 때까지 이 사람의 push는 자동으로 배포되지 않습니다.`
        : `· ${confirm.account.discord}\n· 필수 알림은 이메일로 계속 보냅니다.`}
      onDismiss={() => setConfirm(null)} actions={<>
        <Button variant="secondary" onClick={() => setConfirm(null)}>취소</Button>
        <Button variant="danger" onClick={forceDisconnect}>연결 강제 해제</Button>
      </>}>
      {failed && <DialogCopy role="alert">연결을 해제하지 못했습니다.</DialogCopy>}
    </AccountDialog>}
    <Hint>결정 후 연결할 항목 · 지정 권한을 가진 역할, 대상 사용자 확인, 관리자 계정 생성 경로, 회수 승인 절차와 알림 범위를 결정해야 합니다.</Hint>
  </PageStack></WorkflowLayout></DemoOnlyGate>;
}
