import { useState } from 'react';
import styled from 'styled-components';
import { DemoPagePlaceholder, useDemoPageLoad } from '../demo-workflows/ui/DemoPageState';
import { getDemoProfile, updateDemoProfile } from '../../entities/profile';
import { addDemoNotification } from '../../entities/notification';
import { AccountDialog, DialogCopy } from '../../features/settings/demo-account';
import { getDemoAccountRecords, getDemoAccounts, getDemoAdminEmergencyAccess, getDemoAdminGrantCandidates, getDemoGraduationDate, grantDemoAdminRole, revokeDemoAdminRole, saveDemoAccounts, saveDemoAdminEmergencyAccess, saveDemoGraduationDate, type DemoAccount, type DemoAdminRevokeResult } from '../../entities/demo-workflows';
import { Button, DateField, SelectField, TextField } from '../../shared/ui/controls';
import { Octicon } from '../../shared/ui/icons';
import { Alert, Card, CardHeader, Heading, Hint, Muted, PageStack, SectionTitle, Table, TableWrap, Title, TitleGroup, WorkflowLayout, DemoOnlyGate } from '../demo-workflows/ui/WorkflowLayout';

const ExternalAccountGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
  margin-top: 20px;

  @media (max-width: 560px) {
    grid-template-columns: minmax(0, 1fr);
    gap: 12px;

    > button { width: 100%; }
  }
`;

export default function DemoAdminAccountsPage() {
  const [accounts, setAccounts] = useState(() => getDemoAccounts());
  const [selectedId, setSelectedId] = useState(() => accounts[0]?.id ?? '');
  const [notice, setNotice] = useState('');
  const [graduationError, setGraduationError] = useState('');
  const [grantOpen, setGrantOpen] = useState(false);
  const [grantTargetId, setGrantTargetId] = useState('');
  const [grantReason, setGrantReason] = useState('');
  const [grantError, setGrantError] = useState('');
  const [revokeTarget, setRevokeTarget] = useState<DemoAccount | null>(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [revokeError, setRevokeError] = useState('');
  const [emergencyEnabled, setEmergencyEnabled] = useState(() => getDemoAdminEmergencyAccess());
  const [emergencyDialog, setEmergencyDialog] = useState<'setup' | 'disable' | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [emergencyError, setEmergencyError] = useState('');
  const [graduationOpen, setGraduationOpen] = useState(false);
  const [graduationDateDraft, setGraduationDateDraft] = useState(() => getDemoGraduationDate());
  const pageLoad = useDemoPageLoad('admin-accounts');
  const current = accounts.find((account) => account.id === selectedId) ?? accounts[0];
  const admins = accounts.filter(account => account.role === '관리자');

  const [confirm, setConfirm] = useState<{ account: DemoAccount; provider: 'github' | 'discord' } | null>(null);
  const [failed, setFailed] = useState(false);

  const grantCandidates = getDemoAdminGrantCandidates();
  const grantOptions = grantCandidates.map(account => ({
    value: account.id,
    label: `${account.name} · ${account.studentId} · ${account.email}`,
  }));

  function openGrantDialog() {
    setGrantTargetId(grantOptions[0]?.value ?? '');
    setGrantReason('');
    setGrantError('');
    setGrantOpen(true);
  }

  function grantAdminRole() {
    if (!grantTargetId || !grantReason.trim()) {
      setGrantError('사용자와 지정 사유를 입력해 주세요.');
      return;
    }
    if (!grantDemoAdminRole(grantTargetId, grantReason)) {
      setGrantError('관리자 지정 내용을 저장하지 못했습니다. 다시 시도해 주세요.');
      return;
    }
    setAccounts(getDemoAccounts());
    setSelectedId(grantTargetId);
    setGrantOpen(false);
    const target = getDemoAccounts().find(account => account.id === grantTargetId);
    const notified = addDemoNotification({
      kind: 'admin-role-granted',
      category: '계정',
      group: 'Account',
      title: `${target?.name ?? '사용자'}님이 관리자로 지정되었습니다`,
      body: `관리자 지정 사유: ${grantReason.trim()}`,
      resource: null,
    });
    setNotice(notified ? '관리자로 지정하고 로컬 데모 알림을 생성했습니다.' : '관리자로 지정했지만 알림을 저장하지 못했습니다.');
  }

  function openRevokeDialog(account: DemoAccount) {
    setRevokeTarget(account);
    setRevokeReason('');
    setRevokeError('');
  }

  function openLastAdminProtection() {
    const latestAccounts = getDemoAccounts();
    const latestAdmins = latestAccounts.filter(account => account.role === '관리자');
    setAccounts(latestAccounts);

    if (latestAdmins.length === 1) openRevokeDialog(latestAdmins[0]);
  }

  function revokeAdminRole() {
    if (!revokeTarget) return;
    const result: DemoAdminRevokeResult = revokeDemoAdminRole(
      revokeTarget.id,
      'account-4',
      revokeReason,
    );
    if (result !== 'ok') {
      const messages: Record<Exclude<DemoAdminRevokeResult, 'ok'>, string> = {
        missing: '계정을 찾을 수 없습니다. 목록을 새로고침해 주세요.',
        'not-admin': '이 계정은 관리자 권한이 없습니다.',
        self: '현재 로그인한 관리자는 자신의 권한을 회수할 수 없습니다.',
        'last-admin': '관리자가 한 명만 남았다면 권한 회수를 막습니다.',
        'save-failed': '권한을 회수하지 못했습니다. 다시 시도해 주세요.',
      };
      setRevokeError(messages[result]);
      return;
    }
    setAccounts(getDemoAccounts());
    setRevokeTarget(null);
    setRevokeReason('');
    const notified = addDemoNotification({
      kind: 'admin-role-revoked',
      category: '계정',
      group: 'Account',
      title: `${revokeTarget.name}님의 관리자 권한이 회수되었습니다`,
      body: `관리자 권한 회수 사유: ${revokeReason.trim()}`,
      resource: null,
    });
    setNotice(notified ? `${revokeTarget.name}의 권한을 회수하고 로컬 데모 알림을 생성했습니다.` : `${revokeTarget.name}의 권한을 회수했지만 알림을 저장하지 못했습니다.`);
  }

  function openEmergencyDialog() {
    setOtpCode('');
    setEmergencyError('');
    setEmergencyDialog(emergencyEnabled ? 'disable' : 'setup');
  }

  function saveEmergencyAccess() {
    if (otpCode.replace(/\s/g, '') !== '482913') {
      setEmergencyError('OTP 코드가 올바르지 않습니다. 데모 코드 482 913을 입력해 주세요.');
      return;
    }
    if (!saveDemoAdminEmergencyAccess(true)) {
      setEmergencyError('비상 접근 설정을 저장하지 못했습니다. 다시 시도해 주세요.');
      return;
    }
    setEmergencyEnabled(true);
    setEmergencyDialog(null);
    setOtpCode('');
    setNotice('비상 접근을 설정했습니다. (로컬 데모)');
  }

  function disableEmergencyAccess() {
    if (!saveDemoAdminEmergencyAccess(false)) {
      setEmergencyError('비상 접근 설정을 해제하지 못했습니다. 다시 시도해 주세요.');
      return;
    }
    setEmergencyEnabled(false);
    setEmergencyDialog(null);
    setEmergencyError('');
    setNotice('비상 접근을 해제했습니다. (로컬 데모)');
  }

  function openGraduationDialog() {
    setGraduationDateDraft(getDemoGraduationDate());
    setGraduationError('');
    setGraduationOpen(true);
  }

  function saveGraduationSchedule() {
    if (!saveDemoGraduationDate(graduationDateDraft)) {
      setNotice('');
      setGraduationError('졸업일을 저장하지 못했습니다. 날짜를 확인하고 다시 시도해 주세요.');
      return;
    }
    setGraduationOpen(false);
    setGraduationError('');
    setNotice(`졸업일 ${graduationDateDraft}을 저장했습니다. (로컬 데모)`);
  }

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
      : saveDemoAccounts(getDemoAccountRecords().map(item => item.id === account.id ? { ...item, [provider]: '연결 안 됨' } : item));
    if (!saved) {
      setFailed(true);
      return;
    }
    setAccounts(getDemoAccounts());
    setConfirm(null);
    const notified = addDemoNotification({
      kind: `admin-${provider}-disconnected`,
      category: '계정',
      group: 'Account',
      title: `${account.name}님의 ${label} 연결이 해제되었습니다`,
      body: '관리자가 외부 계정 연결을 해제했습니다. 다시 사용하려면 설정에서 연결해 주세요.',
      resource: null,
    });
    setNotice(notified ? `${label} 연결을 해제하고 로컬 데모 알림을 생성했습니다.` : `${label} 연결을 해제했지만 알림을 저장하지 못했습니다.`);
  }

  return <DemoOnlyGate admin><WorkflowLayout admin activeAdminItem="관리자 점검"><PageStack>
    <p style={{ margin: 0, color: '#a8a2af', fontSize: 12 }}>관리자 / 관리자 계정 점검</p>
    <Heading><TitleGroup><Title>관리자 계정 점검</Title><Muted>학교 정보·역할·소속 팀과 외부 계정 연결 상태를 확인하세요.</Muted></TitleGroup><Button icon={<Octicon name="plus" size={16} />} disabled={pageLoad.status !== 'ready'} onClick={openGrantDialog}>관리자 지정</Button></Heading>
    {pageLoad.status !== 'ready' ? <DemoPagePlaceholder status={pageLoad.status} onRetry={pageLoad.retry} rows={[274, 172, { title: '확정이 필요한 보호 규칙' }, [164, 164, 180]]} label="계정 정보를 불러오는 중" /> : <>
    {notice && <Alert $tone="success" role="status"><Octicon name="info" size={16} />{notice}</Alert>}
    <Card><CardHeader><SectionTitle>계정 목록</SectionTitle></CardHeader><TableWrap><Table><thead><tr><th>이름 · 학번</th><th>학교 이메일</th><th>역할</th><th>소속 팀</th><th>GitHub</th><th>Discord</th></tr></thead><tbody>{accounts.map((account) => <tr key={account.id} aria-selected={account.id === current?.id} onClick={() => setSelectedId(account.id)}><td>{account.name} · {account.studentId}</td><td>{account.email}</td><td>{account.role}</td><td>{account.team}</td><td>{account.github}</td><td>{account.discord}</td></tr>)}</tbody></Table></TableWrap><Hint>{accounts.length}개 중 1–{accounts.length}</Hint></Card>
    {current && <Card><CardHeader><SectionTitle>{current.name} · 외부 계정</SectionTitle>{current.role === '관리자' && <Button variant="danger" icon={<Octicon name="shield" size={16} />} onClick={() => openRevokeDialog(current)}>권한 회수</Button>}</CardHeader><Muted>학교 정보는 DataGSM에서 와서 여기서 고칠 수 없습니다. 연결을 강제로 해제하면 그 사람이 다시 연결해야 합니다.</Muted>
      <ExternalAccountGrid><div><Hint>GitHub</Hint><Muted>{current.github} · {current.github === '연결 안 됨' ? '연결 안 됨' : '연결됨'}</Muted></div><Button variant="danger" disabled={current.github === '연결 안 됨'} icon={<Octicon name="x" size={16} />} onClick={() => showDisconnect('github')}>연결 강제 해제</Button><div><Hint>Discord</Hint><Muted>{current.discord} · {current.discord === '연결 안 됨' ? '연결 안 됨' : '연결됨'}</Muted></div><Button variant="danger" disabled={current.discord === '연결 안 됨'} icon={<Octicon name="x" size={16} />} onClick={() => showDisconnect('discord')}>연결 강제 해제</Button></ExternalAccountGrid>
    </Card>}
    <SectionTitle>확정이 필요한 보호 규칙</SectionTitle><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,280px),1fr))', gap: 16 }}><Card><Octicon name="lock" size={20} /><SectionTitle style={{ marginTop: 16 }}>자기 권한 보호</SectionTitle><Muted>현재 로그인한 관리자는 자신의 권한을 회수할 수 없습니다.</Muted><div style={{ marginTop: 16 }}><Button variant="secondary" onClick={() => { const actor = admins.find(account => account.id === 'account-4'); if (actor) openRevokeDialog(actor); }}>권한 회수</Button></div></Card><Card><Octicon name="people" size={20} /><SectionTitle style={{ marginTop: 16 }}>마지막 관리자 보호</SectionTitle><Muted>관리자가 한 명만 남았다면 권한 회수를 막습니다.</Muted><div style={{ marginTop: 16 }}><Button variant="secondary" disabled={admins.length !== 1} onClick={openLastAdminProtection}>권한 회수</Button></div></Card><Card><Octicon name="checklist" size={20} /><SectionTitle style={{ marginTop: 16 }}>졸업 후 계정 점검</SectionTitle><Muted>졸업한 관리자의 접근은 유지됩니다. 인수인계 이후의 회수 절차가 필요합니다.</Muted><div style={{ marginTop: 16 }}><Button variant="secondary" onClick={openGraduationDialog}>회수 절차 검토</Button></div></Card></div>
    {graduationOpen && <AccountDialog title="졸업일 등록" icon="calendar" description={'· 3학년 사용자에게 D-30, D-7에 안내합니다.\n· 졸업 처리 후 개인 VM·함수는 3일 뒤 삭제됩니다.'} onDismiss={() => setGraduationOpen(false)} actions={<Button variant="primary" icon={<Octicon name="check" size={16} />} disabled={!graduationDateDraft} onClick={saveGraduationSchedule}>저장</Button>}>
      <DateField label="졸업일" value={graduationDateDraft} onChange={value => { setGraduationDateDraft(value); setGraduationError(''); }} />
      {graduationError && <DialogCopy role="alert">{graduationError}</DialogCopy>}
    </AccountDialog>}
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
    <Hint>관리자 권한 변경 사유와 대상 계정을 로컬 데모에 저장합니다. DataGSM 장애 시 비상 접근도 별도로 설정할 수 있습니다.</Hint>
    <Card><CardHeader><SectionTitle>비상 접근</SectionTitle><Button variant={emergencyEnabled ? 'danger' : 'secondary'} icon={<Octicon name={emergencyEnabled ? 'lock' : 'shield'} size={16} />} onClick={openEmergencyDialog}>{emergencyEnabled ? '비상 접근 해제' : '비상 접근 설정'}</Button></CardHeader><Muted>{emergencyEnabled ? '비상 접근이 설정되어 있습니다. 로컬 데모 상태이며 실제 OTP 인증은 수행하지 않습니다.' : 'DataGSM이 응답하지 않을 때 관리자만 1시간 동안 조회·전원 제어·공지를 할 수 있습니다.'}</Muted></Card>
    </>}
    {grantOpen && <AccountDialog title="관리자로 지정" icon="shield" description="· 지정하면 대상자와 전체 관리자에게 알립니다." onDismiss={() => setGrantOpen(false)} actions={<><Button variant="secondary" onClick={() => setGrantOpen(false)}>취소</Button><Button variant="primary" disabled={!grantTargetId || !grantReason.trim()} onClick={grantAdminRole}>지정</Button></>}>
      <SelectField label="사용자" value={grantTargetId} options={grantOptions} onChange={setGrantTargetId} placeholder="사용자 선택" />
      <TextField label="사유" value={grantReason} maxLength={200} onChange={event => { setGrantReason(event.currentTarget.value); setGrantError(''); }} placeholder="관리자 지정 사유" />
      {grantError && <DialogCopy role="alert">{grantError}</DialogCopy>}
    </AccountDialog>}
    {revokeTarget && <AccountDialog title="관리자 권한을 회수하시겠습니까?" icon="shield" description={`${revokeTarget.name}의 관리자 권한이 바로 사라집니다.`} onDismiss={() => setRevokeTarget(null)} actions={<><Button variant="secondary" onClick={() => setRevokeTarget(null)}>취소</Button><Button variant="danger" disabled={!revokeReason.trim()} onClick={revokeAdminRole}>권한 회수</Button></>}>
      <TextField label="사유" value={revokeReason} maxLength={200} onChange={event => { setRevokeReason(event.currentTarget.value); setRevokeError(''); }} placeholder="인수인계 완료" />
      {revokeError && <DialogCopy role="alert">{revokeError}</DialogCopy>}
    </AccountDialog>}
    {emergencyDialog === 'setup' && <AccountDialog title="비상 접근 설정" icon="shield" description="DataGSM이 응답하지 않을 때 관리자만 1시간 동안 조회·전원 제어·공지를 할 수 있습니다. OTP 앱으로 등록한 뒤 비상 복구 코드를 안전한 곳에 보관하세요." onDismiss={() => setEmergencyDialog(null)} actions={<><Button variant="secondary" onClick={() => setEmergencyDialog(null)}>취소</Button><Button variant="primary" onClick={saveEmergencyAccess}>등록</Button></>}>
      <DialogCopy>· 1. OTP 앱으로 QR 코드를 스캔하세요<br />· 2. 복구 코드 10개를 안전한 곳에 보관하세요</DialogCopy>
      <TextField label="OTP 6자리" value={otpCode} maxLength={7} onChange={event => { setOtpCode(event.currentTarget.value); setEmergencyError(''); }} placeholder="482 913" autoComplete="one-time-code" inputMode="numeric" />
      <DialogCopy>데모 OTP 코드: 482 913</DialogCopy>
      {emergencyError && <DialogCopy role="alert">{emergencyError}</DialogCopy>}
    </AccountDialog>}
    {emergencyDialog === 'disable' && <AccountDialog title="비상 접근을 해제하시겠습니까?" icon="lock" description="해제하면 DataGSM 장애 시 비상 조회·전원 제어·공지를 사용할 수 없습니다." onDismiss={() => setEmergencyDialog(null)} actions={<><Button variant="secondary" onClick={() => setEmergencyDialog(null)}>취소</Button><Button variant="danger" onClick={disableEmergencyAccess}>해제</Button></>}>
      {emergencyError && <DialogCopy role="alert">{emergencyError}</DialogCopy>}
    </AccountDialog>}
  </PageStack></WorkflowLayout></DemoOnlyGate>;
}
