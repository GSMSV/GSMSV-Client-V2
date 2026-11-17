import { useMemo, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router';
import styled from 'styled-components';
import { getDemoInfraSnapshot, saveDemoInfraSnapshot, type DemoInfraSnapshot } from '../../entities/infra-node/demo';
import { addDemoNotification } from '../../entities/notification';
import { getDemoVmState } from '../../entities/vm';
import { Button } from '../../shared/ui/controls';
import { DemoPagePlaceholder, useDemoPageLoad } from '../demo-workflows/ui/DemoPageState';
import { Banner, ModalSurface } from '../../shared/ui/feedback';
import { Octicon, type OcticonName } from '../../shared/ui/icons';
import { AdminStat, AdminStats } from './adminDemoUi';
import { Alert, Card, CardHeader, Field, Heading, Hint, Input, Muted, PageStack, SectionTitle, Textarea, Title, TitleGroup, WorkflowLayout, DemoOnlyGate } from '../demo-workflows/ui/WorkflowLayout';

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;

  @media (max-width: 720px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;
// Figma 31: 운영 정보·사용 기간·SSH 접속 정보는 아이콘 + 이름/값 + 글자 버튼 줄이며 구분선이 없다.
const IconRows = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;
const IconRowFrame = styled.div`
  display: grid;
  min-width: 0;
  grid-template-columns: 16px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  color: ${({ theme }) => theme.colors.muted};
`;
const IconRowCopy = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
  overflow-wrap: anywhere;
`;
const IconRowLabel = styled.span`
  color: ${({ theme }) => theme.colors.faint};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;
const IconRowValue = styled.span`
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;
function IconRow({ icon, label, value, action }: { icon: OcticonName; label: string; value: string; action?: ReactNode }) {
  return <IconRowFrame><Octicon name={icon} size={16} /><IconRowCopy><IconRowLabel>{label}</IconRowLabel><IconRowValue>{value}</IconRowValue></IconRowCopy>{action}</IconRowFrame>;
}
const CommandTitle = styled(SectionTitle)`
  display: flex;
  align-items: center;
  gap: 8px;
  > svg { color: ${({ theme }) => theme.colors.primary}; }
`;
// Figma 31 SSH 명령어: 줄 번호가 붙은 어두운 코드 상자.
const Code = styled.code`
  display: flex;
  max-width: 100%;
  gap: 24px;
  overflow-x: auto;
  white-space: pre;
  padding: 12px 16px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.canvas};
  color: ${({ theme }) => theme.colors.text};
  font: 400 13px/22px 'DM Mono', monospace;
  > span:first-child { color: ${({ theme }) => theme.colors.faint}; user-select: none; }
`;
const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
`;
const ValueRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
  padding: 14px 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  &:last-child { border-bottom: 0; }
`;
const ValueLabel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: ${({ theme }) => theme.colors.text};
`;
const Overlay = styled.div`
  position: fixed;
  z-index: 1000;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: #00000099;
`;
const Dialog = styled.section`
  display: flex;
  width: min(480px, 100%);
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};
`;
const DialogTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.h2.weight} ${({ theme }) => theme.typography.h2.size}px/${({ theme }) => theme.typography.h2.lineHeight}px ${({ theme }) => theme.typography.h2.family}, sans-serif;
`;
const DialogActions = styled(Actions)`
  margin-top: 8px;
`;
const AdminDeleteDialog = styled(Dialog)`
  box-sizing: border-box;
  width: min(480px, calc(100vw - 48px));
  height: 664px;
  max-height: calc(100vh - 48px);
  overflow-y: auto;

  & > h2 { display: flex; align-items: center; gap: 12px; }
`;
const DeleteSummary = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  color: ${({ theme }) => theme.colors.muted};
  font: 400 14px/22px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;
const DeleteCaption = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.faint};
  font: 400 12px/18px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;
const SshActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 16px;

  @media (max-width: 720px) {
    align-items: flex-start;
    flex-direction: column;
  }
`;
const SshButtons = styled(Actions)`
  flex: 0 0 auto;

  @media (max-width: 720px) {
    justify-content: flex-start;
    width: 100%;
  }
`;

type DetailPanel = 'purpose' | 'snapshot' | null;

/** 마지막 글자에 받침이 있으면 '을', 없으면 '를'. 한글이 아니면 영문 발음 대신 '을'을 쓴다. */
function objectParticle(word: string) {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  if (code < 0 || code > 11171) return '을';
  return code % 28 === 0 ? '를' : '을';
}

export default function DemoAdminVmDetailPage() {
  const navigate = useNavigate();
  const pageLoad = useDemoPageLoad('admin-vm');
  const { vmId = 'portfolio-api' } = useParams<{ vmId: string }>();
  const [snapshot, setSnapshot] = useState<DemoInfraSnapshot>(() => getDemoInfraSnapshot());
  const [notice, setNotice] = useState('');
  const [confirmName, setConfirmName] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [showDelete, setShowDelete] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [panel, setPanel] = useState<DetailPanel>(null);
  const [purposeDraft, setPurposeDraft] = useState('');
  const vm = useMemo(() => snapshot.resources.find(item => item.name === vmId || item.grn === vmId)
    ?? (vmId === 'demo-vm-1' ? snapshot.resources.find(item => item.name === 'portfolio-api') : undefined), [snapshot.resources, vmId]);
  const details = vm ? snapshot.vmDetails[vm.grn] : undefined;
  const networkVm = useMemo(() => vm
    ? getDemoVmState().vms.find(item => item.name === vm.name)
    : undefined, [vm]);
  const running = vm?.power_state === 'running';
  const expiryNotice = details ? (() => {
    const [date, time = '14:00'] = details.expiresAt.split(' ');
    const [year, month, day] = date.split('.').map(Number);
    const extended = new Date(Date.UTC(year, month - 1, day + 14));
    return `${month}월 ${day}일 ${time}에 만료됩니다. 지금 연장하면 ${extended.getUTCMonth() + 1}월 ${extended.getUTCDate()}일 ${time}까지 사용할 수 있습니다.`;
  })() : '';
  const expiryDays = details
    ? Math.ceil((Date.parse(`${details.expiresAt.slice(0, 10).replaceAll('.', '-')}T00:00:00Z`) - Date.parse('2026-09-29T00:00:00Z')) / 86_400_000)
    : 0;

  function persist(next: DemoInfraSnapshot) {
    if (!saveDemoInfraSnapshot(next)) return false;
    setSnapshot(next);
    return true;
  }

  function updateDetails(patch: Partial<NonNullable<typeof details>>) {
    if (!vm || !details) return false;
    if (!persist({ ...snapshot, vmDetails: { ...snapshot.vmDetails, [vm.grn]: { ...details, ...patch } } })) {
      setNotice('VM 설정을 저장하지 못했습니다. 다시 시도해 주세요.');
      return false;
    }
    setNotice('');
    return true;
  }

  function changePower(powerState: 'running' | 'stopped') {
    if (!vm) return;
    const saved = persist({
      ...snapshot,
      resources: snapshot.resources.map(item => item.grn === vm.grn
        ? { ...item, power_state: powerState, status: powerState === 'running' ? '실행 중' : '정지됨' }
        : item),
    });
    if (!saved) {
      setNotice('VM 상태를 저장하지 못했습니다. 다시 시도해 주세요.');
      return;
    }
    setNotice(powerState === 'running' ? 'VM을 다시 시작했습니다.' : 'VM을 정상 종료했습니다.');
  }

  function removeVm() {
    if (!vm || !details) return;
    const reason = deleteReason.trim();
    if (!reason || confirmName !== vm.name) return;
    const resources = snapshot.resources.filter(item => item.grn !== vm.grn);
    const nodeVms = Object.fromEntries(Object.entries(snapshot.nodeVms).map(([node, items]) => [
      node,
      items.filter(item => item.grn !== vm.grn),
    ]));
    const vmDetails = { ...snapshot.vmDetails };
    delete vmDetails[vm.grn];
    if (!persist({
      ...snapshot,
      resources,
      nodeVms,
      vmDetails,
      expiringGrns: snapshot.expiringGrns.filter(grn => grn !== vm.grn),
      expiringWithinThreeDays: Math.max(0, snapshot.expiringWithinThreeDays - Number(snapshot.expiringGrns.includes(vm.grn))),
    })) {
      setNotice('VM을 삭제하지 못했습니다. 목록을 새로고침하고 다시 시도해 주세요.');
      return;
    }
    const ownerNotified = addDemoNotification({
      kind: 'vm-deleted-for-purpose-violation',
      category: 'VM',
      group: 'Resource',
      title: `${vm.name}이(가) 삭제되었습니다`,
      body: `관리자가 사용 목적 위반으로 삭제했습니다. 삭제 사유: ${reason}`,
      resource: null,
    });
    setShowDelete(false);
    setNotice(ownerNotified ? `${vm.name}을 삭제하고 소유자에게 사유를 전달했습니다.` : `${vm.name}을 삭제했지만 소유자 알림을 저장하지 못했습니다.`);
    navigate('/admin/vms');
  }

  async function copyValue(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setNotice(`${label}${objectParticle(label)} 복사했습니다.`);
    } catch {
      setNotice(`${label}: ${value}`);
    }
  }

  if (!vm || !details) {
    return <DemoOnlyGate admin><WorkflowLayout admin activeAdminItem="전체 VM"><PageStack>
      <p style={{ margin: 0, color: '#a8a2af', fontSize: 12 }}>관리자 / VM 상세</p>
      <Card><SectionTitle>이 VM은 로컬 미리보기에서 삭제되었거나 찾을 수 없습니다.</SectionTitle><Button style={{ marginTop: 16 }} onClick={() => navigate('/admin/vms')}>전체 VM 목록</Button></Card>
    </PageStack></WorkflowLayout></DemoOnlyGate>;
  }

  const actionIcon = (name: OcticonName) => <Octicon name={name} size={16} />;

  return <DemoOnlyGate admin><WorkflowLayout admin activeAdminItem="전체 VM"><PageStack>
    <p style={{ margin: 0, color: '#a8a2af', fontSize: 12 }}>관리자 / {vm.name}</p>
    {notice && <Alert $tone={notice.includes('못했습니다') ? 'warning' : 'success'} role="status"><Octicon name="info" size={16} />{notice}</Alert>}
    <Heading>
      <TitleGroup><Title>{vm.name}</Title><Muted>{details.ownerName}의 {vm.name} · 관리자 조회</Muted></TitleGroup>
      <Actions>
        <Button variant="secondary" icon={actionIcon('stop')} disabled={!running} onClick={() => changePower('stopped')}>정상 종료</Button>
        <Button variant="secondary" icon={actionIcon('sync')} onClick={() => changePower('running')}>재시작</Button>
        <Button variant="danger" icon={actionIcon('trashcan')} onClick={() => { setConfirmName(''); setDeleteReason(''); setShowDelete(true); }}>관리자 삭제</Button>
      </Actions>
    </Heading>
    {pageLoad.status !== 'ready' ? <DemoPagePlaceholder status={pageLoad.status} onRetry={pageLoad.retry} rows={[[104, 104, 104], [188, 188], 188, 152]} label="VM 정보를 불러오는 중" /> : <>
    <Banner tone={expiryDays <= 0 ? 'danger' : 'primary'} icon={<Octicon name="clock" size={20} />} title={expiryDays <= 0 ? '만료되었습니다' : `만료까지 ${expiryDays}일 남았습니다`} description={expiryNotice} />
    <AdminStats>
      <AdminStat icon="cpu" label="CPU" value={`${details.vcpu} vCPU`} caption={details.tier === 'Standard' ? '일반 Node' : details.tier} />
      <AdminStat label="메모리" value={`${details.ramGb} GB`} caption="할당 메모리" />
      <AdminStat icon="database" label="디스크" value={`${details.diskGb} GB`} caption={details.os} />
    </AdminStats>
    <InfoGrid>
      <Card>
        <CardHeader><SectionTitle>운영 정보</SectionTitle></CardHeader>
        <IconRows>
          <IconRow icon="file-code" label="사용 목적" value={details.purpose} action={<Button variant="ghost" icon={actionIcon('pencil')} onClick={() => { setPurposeDraft(details.purpose); setPanel('purpose'); }}>수정</Button>} />
          <IconRow icon="history" label="자동 Snapshot" value={details.autoSnapshot ? `켜짐 · 최신 ${details.retainedSnapshots}개 보관` : '꺼짐'} action={<Button variant="ghost" icon={actionIcon('chevron-right')} onClick={() => setPanel('snapshot')}>관리</Button>} />
          <IconRow icon="globe" label="Network" value={`외부 포트 ${details.externalPorts}/${details.externalPortLimit} · HTTPS Domain ${details.httpsDomains}/${details.httpsDomainLimit}`} action={<Button variant="ghost" icon={actionIcon('chevron-right')} disabled={!networkVm} title={!networkVm ? '이 VM의 Network 정보는 로컬 미리보기에서 제공되지 않습니다.' : undefined} onClick={() => { if (networkVm) navigate(`/vms/${encodeURIComponent(networkVm.grn)}/network`); }}>관리</Button>} />
        </IconRows>
      </Card>
      <Card>
        <CardHeader><SectionTitle>사용 기간</SectionTitle></CardHeader>
        <IconRows>
          <IconRow icon="calendar" label="생성일" value={`${details.createdAt} (KST)`} />
          <IconRow icon="clock" label="만료일" value={`${details.expiresAt} (KST)`} />
          <IconRow icon="pulse" label="가동 시간" value={details.uptime} />
        </IconRows>
      </Card>
    </InfoGrid>
    <Card>
      <CardHeader><SectionTitle>SSH 접속 정보</SectionTitle></CardHeader>
      <IconRows>
        <IconRow icon="person" label="SSH 계정" value={details.sshUser} action={details.sshCommand && <Button variant="ghost" icon={actionIcon('copy')} onClick={() => void copyValue(details.sshUser, 'SSH 계정')}>복사</Button>} />
        <IconRow icon="server" label="내부 IP" value={details.internalIp} action={details.internalIp !== '—' && <Button variant="ghost" icon={actionIcon('copy')} onClick={() => void copyValue(details.internalIp, '내부 IP')}>복사</Button>} />
        <IconRow icon="key" label="초기 비밀번호" value={showPassword ? details.initialPassword : '••••••••••••'} action={<Button variant="ghost" icon={actionIcon('eye')} onClick={() => setShowPassword(value => !value)}>{showPassword ? '숨기기' : '표시'}</Button>} />
      </IconRows>
    </Card>
    <Card>
      <CardHeader><CommandTitle><Octicon name="terminal" size={20} />SSH 명령어</CommandTitle></CardHeader>
      <Code><span>1</span><span>{details.sshCommand}</span></Code>
      <SshActions>
        {details.sshCommand && <Hint>실제 SSH 매핑: 외부 {details.sshCommand.match(/-p (\d+)/)?.[1] ?? '—'} → 내부 22 · 터미널에 붙여넣어 접속하세요.</Hint>}
        <SshButtons>
          <Button variant="secondary" icon={actionIcon('book')} onClick={() => navigate('/help')}>SSH 키 등록 Docs</Button>
          {details.sshCommand && <Button icon={actionIcon('copy')} onClick={() => void copyValue(details.sshCommand, 'SSH 명령어')}>명령어 복사</Button>}
        </SshButtons>
      </SshActions>
    </Card>
    </>}
    {showDelete && <ModalSurface labelledBy="admin-vm-delete-title" onDismiss={() => setShowDelete(false)}>
      <AdminDeleteDialog aria-labelledby="admin-vm-delete-title">
        <DialogTitle id="admin-vm-delete-title"><Octicon name="alert" size={24} />{vm.name}를 영구 삭제하시겠습니까?</DialogTitle>
        <DeleteSummary>
          <span>사용 목적 위반으로 삭제하는 이유를 입력해 주세요. 삭제 사유가 소유자에게 알림으로 전달됩니다.</span>
          <span>· 디스크 데이터 {details.diskGb} GB</span>
          <span>· Snapshot {details.retainedSnapshots}개 · 외부 접속 포트 3개 · HTTPS Domain 1개</span>
          <span>· 실행 중인 VM은 강제 정지한 뒤 삭제됩니다.</span>
          <span>· 삭제한 VM과 데이터는 복구할 수 없습니다.</span>
        </DeleteSummary>
        <Field htmlFor="admin-vm-delete-reason">삭제 사유
          <Textarea id="admin-vm-delete-reason" value={deleteReason} placeholder="소유자에게 전달할 삭제 사유를 입력하세요" onChange={event => setDeleteReason(event.currentTarget.value)} />
          <DeleteCaption>목적 위반 삭제 시 반드시 입력해야 합니다.</DeleteCaption>
        </Field>
        <Field htmlFor="admin-vm-delete-name">확인하려면 VM 이름을 입력하세요
          <Input id="admin-vm-delete-name" value={confirmName} onChange={event => setConfirmName(event.currentTarget.value)} />
          <DeleteCaption>VM 이름을 정확히 입력해야 삭제할 수 있습니다.</DeleteCaption>
        </Field>
        <DialogActions>
          <Button variant="secondary" onClick={() => setShowDelete(false)}>취소</Button>
          <Button variant="danger" icon={actionIcon('trashcan')} disabled={!deleteReason.trim() || confirmName !== vm.name} onClick={removeVm}>영구 삭제</Button>
        </DialogActions>
        {(!deleteReason.trim() || confirmName !== vm.name) && <DeleteCaption>삭제 사유와 정확한 VM 이름을 입력해 주세요.</DeleteCaption>}
      </AdminDeleteDialog>
    </ModalSurface>}
    {panel && <Overlay onMouseDown={event => { if (event.target === event.currentTarget) setPanel(null); }}>
      <Dialog role="dialog" aria-modal="true" aria-labelledby="vm-management-title">
        <DialogTitle id="vm-management-title">{panel === 'purpose' ? '사용 목적 수정' : '자동 Snapshot 관리'}</DialogTitle>
        {panel === 'purpose' ? <>
          <Field htmlFor="vm-purpose">사용 목적
          <Input id="vm-purpose" value={purposeDraft} onChange={event => setPurposeDraft(event.currentTarget.value)} />
          </Field>
          <DialogActions><Button variant="secondary" onClick={() => setPanel(null)}>취소</Button><Button disabled={!purposeDraft.trim()} onClick={() => { if (updateDetails({ purpose: purposeDraft.trim() })) { setPanel(null); setNotice('사용 목적을 저장했습니다.'); } }}>저장</Button></DialogActions>
        </> : <>
          <ValueRow><ValueLabel><Hint>자동 Snapshot</Hint><Muted>{details.autoSnapshot ? '켜짐' : '꺼짐'}</Muted></ValueLabel><Button variant="secondary" onClick={() => updateDetails({ autoSnapshot: !details.autoSnapshot })}>{details.autoSnapshot ? '끄기' : '켜기'}</Button></ValueRow>
          <ValueRow><ValueLabel><Hint>보관 개수</Hint><Muted>최신 Snapshot 보관</Muted></ValueLabel><Actions><Button variant="secondary" disabled={details.retainedSnapshots <= 1} onClick={() => updateDetails({ retainedSnapshots: Math.max(1, details.retainedSnapshots - 1) })}>−</Button><Muted>{details.retainedSnapshots}개</Muted><Button variant="secondary" onClick={() => updateDetails({ retainedSnapshots: details.retainedSnapshots + 1 })}>+</Button></Actions></ValueRow>
          <DialogActions><Button onClick={() => { setPanel(null); setNotice('Snapshot 설정을 저장했습니다.'); }}>완료</Button></DialogActions>
        </>}
      </Dialog>
    </Overlay>}
  </PageStack></WorkflowLayout></DemoOnlyGate>;
}
