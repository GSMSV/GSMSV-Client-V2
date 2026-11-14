import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import styled from 'styled-components';
import { getDemoInfraSnapshot, saveDemoInfraSnapshot, type DemoInfraSnapshot } from '../../entities/infra-node/demo';
import { Button } from '../../shared/ui/controls';
import { DeleteConfirmDialog } from '../../shared/ui/feedback';
import { Octicon } from '../../shared/ui/icons';
import { Alert, Card, CardHeader, Field, Heading, Hint, Input, Muted, PageStack, SectionTitle, Stat, Stats, Title, TitleGroup, WorkflowLayout, DemoOnlyGate } from '../demo-workflows/ui/WorkflowLayout';

const Expiry = styled.div`
  padding: 16px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.primarySoft};
  color: ${({ theme }) => theme.colors.primary};
  font: 400 14px/22px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;
const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
`;
const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 4px 0;
`;
const Code = styled.code`
  display: block;
  padding: 16px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.raised};
  color: ${({ theme }) => theme.colors.text};
  font: 400 13px/22px 'DM Mono', monospace;
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
const SshActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 16px;
`;
const SshButtons = styled(Actions)`
  flex: 0 0 auto;
`;

type DetailPanel = 'purpose' | 'snapshot' | null;

export default function DemoAdminVmDetailPage() {
  const navigate = useNavigate();
  const { vmId = 'portfolio-api' } = useParams<{ vmId: string }>();
  const [snapshot, setSnapshot] = useState<DemoInfraSnapshot>(() => getDemoInfraSnapshot());
  const [notice, setNotice] = useState('');
  const [confirmName, setConfirmName] = useState('');
  const [showDelete, setShowDelete] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [panel, setPanel] = useState<DetailPanel>(null);
  const [purposeDraft, setPurposeDraft] = useState('');
  const vm = useMemo(() => snapshot.resources.find(item => item.name === vmId || item.grn === vmId)
    ?? (vmId === 'demo-vm-1' ? snapshot.resources.find(item => item.name === 'portfolio-api') : undefined), [snapshot.resources, vmId]);
  const details = vm ? snapshot.vmDetails[vm.grn] : undefined;
  const running = vm?.power_state === 'running';
  const expiryDays = details
    ? Math.ceil((Date.parse(`${details.expiresAt.slice(0, 10).replaceAll('.', '-')}T00:00:00Z`) - Date.parse('2026-09-29T00:00:00Z')) / 86_400_000)
    : 0;

  function persist(next: DemoInfraSnapshot) {
    setSnapshot(next);
    saveDemoInfraSnapshot(next);
  }

  function updateDetails(patch: Partial<NonNullable<typeof details>>) {
    if (!vm) return;
    persist({ ...snapshot, vmDetails: { ...snapshot.vmDetails, [vm.grn]: { ...details!, ...patch } } });
  }

  function changePower(powerState: 'running' | 'stopped') {
    if (!vm) return;
    persist({
      ...snapshot,
      resources: snapshot.resources.map(item => item.grn === vm.grn
        ? { ...item, power_state: powerState, status: powerState === 'running' ? '실행 중' : '정지됨' }
        : item),
    });
    setNotice(powerState === 'running' ? 'VM을 다시 시작했습니다.' : 'VM을 정상 종료했습니다.');
  }

  function removeVm() {
    if (!vm || !details) return;
    const resources = snapshot.resources.filter(item => item.grn !== vm.grn);
    const nodeVms = Object.fromEntries(Object.entries(snapshot.nodeVms).map(([node, items]) => [
      node,
      items.filter(item => item.grn !== vm.grn),
    ]));
    const vmDetails = { ...snapshot.vmDetails };
    delete vmDetails[vm.grn];
    persist({
      ...snapshot,
      resources,
      nodeVms,
      vmDetails,
      expiringGrns: snapshot.expiringGrns.filter(grn => grn !== vm.grn),
      expiringWithinThreeDays: Math.max(0, snapshot.expiringWithinThreeDays - Number(snapshot.expiringGrns.includes(vm.grn))),
    });
    setShowDelete(false);
    setNotice(`${vm.name}을 로컬 미리보기에서 삭제했습니다.`);
    navigate('/admin/vms');
  }

  async function copyValue(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setNotice(`${label}을 복사했습니다.`);
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

  const actionIcon = (name: 'stop' | 'sync' | 'trashcan' | 'copy' | 'book' | 'eye' | 'server' | 'history' | 'globe' | 'file-code') => <Octicon name={name} size={16} />;

  return <DemoOnlyGate admin><WorkflowLayout admin activeAdminItem="전체 VM"><PageStack>
    <p style={{ margin: 0, color: '#a8a2af', fontSize: 12 }}>관리자 / {vm.name}</p>
    {notice && <Alert $tone="success" role="status"><Octicon name="info" size={16} />{notice}</Alert>}
    <Heading>
      <TitleGroup><Title>{vm.name}</Title><Muted>{details.ownerName}의 {vm.name} · 관리자 조회</Muted></TitleGroup>
      <Actions>
        <Button variant="secondary" icon={actionIcon('stop')} disabled={!running} onClick={() => changePower('stopped')}>정상 종료</Button>
        <Button variant="secondary" icon={actionIcon('sync')} disabled={running} onClick={() => changePower('running')}>재시작</Button>
        <Button variant="danger" icon={actionIcon('trashcan')} onClick={() => { setConfirmName(''); setShowDelete(true); }}>관리자 삭제</Button>
      </Actions>
    </Heading>
    <Expiry>◷　{expiryDays <= 0 ? '만료되었습니다' : `만료까지 ${expiryDays}일 남았어요`}<br /><Muted>{details.expiresAt} (KST) · 로컬 미리보기 데이터</Muted></Expiry>
    <Stats>
      <Stat>CPU<strong>{details.vcpu} vCPU</strong><Muted>{details.tier === 'Standard' ? '일반 Node' : details.tier}</Muted></Stat>
      <Stat>메모리<strong>{details.ramGb} GB</strong><Muted>할당 메모리</Muted></Stat>
      <Stat>디스크<strong>{details.diskGb} GB</strong><Muted>{details.os}</Muted></Stat>
    </Stats>
    <InfoGrid>
      <Card>
        <CardHeader><SectionTitle>운영 정보</SectionTitle></CardHeader>
        <ValueRow><ValueLabel><Hint>사용 목적</Hint><Muted>{details.purpose}</Muted></ValueLabel><Button variant="secondary" icon={actionIcon('file-code')} onClick={() => { setPurposeDraft(details.purpose); setPanel('purpose'); }}>수정</Button></ValueRow>
        <ValueRow><ValueLabel><Hint>자동 Snapshot</Hint><Muted>{details.autoSnapshot ? `켜짐 · 최신 ${details.retainedSnapshots}개 보관` : '꺼짐'}</Muted></ValueLabel><Button variant="secondary" icon={actionIcon('history')} onClick={() => setPanel('snapshot')}>관리</Button></ValueRow>
        <ValueRow><ValueLabel><Hint>Network</Hint><Muted>외부 포트 {details.externalPorts}/{details.externalPortLimit} · HTTPS Domain {details.httpsDomains}/{details.httpsDomainLimit}</Muted></ValueLabel><Button variant="secondary" icon={actionIcon('globe')} onClick={() => navigate(`/vms/${encodeURIComponent(vm.grn)}/network`)}>관리</Button></ValueRow>
      </Card>
      <Card>
        <CardHeader><SectionTitle>사용 기간</SectionTitle></CardHeader>
        <InfoItem><Hint>생성일</Hint><Muted>{details.createdAt} (KST)</Muted></InfoItem>
        <InfoItem><Hint>만료일</Hint><Muted>{details.expiresAt} (KST)</Muted></InfoItem>
        <InfoItem><Hint>가동 시간</Hint><Muted>{details.uptime}</Muted></InfoItem>
      </Card>
    </InfoGrid>
    <Card>
      <CardHeader><SectionTitle>SSH 접속 정보</SectionTitle></CardHeader>
      <ValueRow><ValueLabel><Hint>SSH 계정</Hint><Muted>{details.sshUser}</Muted></ValueLabel><Button variant="secondary" icon={actionIcon('copy')} onClick={() => void copyValue(details.sshUser, 'SSH 계정')}>복사</Button></ValueRow>
      <ValueRow><ValueLabel><Hint>내부 IP</Hint><Muted>{details.internalIp}</Muted></ValueLabel><Button variant="secondary" icon={actionIcon('copy')} onClick={() => void copyValue(details.internalIp, '내부 IP')}>복사</Button></ValueRow>
      <ValueRow><ValueLabel><Hint>초기 비밀번호</Hint><Muted>{showPassword ? details.initialPassword : '••••••••••••'}</Muted></ValueLabel><Button variant="secondary" icon={actionIcon('eye')} onClick={() => setShowPassword(value => !value)}>{showPassword ? '숨기기' : '표시'}</Button></ValueRow>
    </Card>
    <Card>
      <CardHeader><SectionTitle><Octicon name="terminal" size={16} /> SSH 명령어</SectionTitle></CardHeader>
      <Code>{details.sshCommand}</Code>
      <SshActions>
        <Hint>실제 SSH 매핑: 외부 {details.sshCommand.match(/-p (\d+)/)?.[1] ?? '—'} → 내부 22 · 터미널에 붙여넣어 접속하세요.</Hint>
        <SshButtons>
          <Button variant="secondary" icon={actionIcon('book')} onClick={() => navigate('/help')}>SSH 키 등록 Docs</Button>
          <Button icon={actionIcon('copy')} onClick={() => void copyValue(details.sshCommand, 'SSH 명령어')}>명령어 복사</Button>
        </SshButtons>
      </SshActions>
    </Card>
    {showDelete && <Overlay onMouseDown={event => { if (event.target === event.currentTarget) setShowDelete(false); }}>
      <DeleteConfirmDialog
        open
        title={`${vm.name}을(를) 삭제하시겠습니까?`}
        description="로컬 미리보기 목록에서 이 VM을 삭제합니다. 실제 서버에는 영향을 주지 않습니다."
        fieldLabel="확인을 위해 VM 이름을 입력하세요"
        confirmationName={vm.name}
        value={confirmName}
        onValueChange={setConfirmName}
        onConfirm={removeVm}
        onCancel={() => setShowDelete(false)}
        confirmLabel="VM 삭제"
        hint="VM 이름을 정확히 입력하세요."
      />
    </Overlay>}
    {panel && <Overlay onMouseDown={event => { if (event.target === event.currentTarget) setPanel(null); }}>
      <Dialog role="dialog" aria-modal="true" aria-labelledby="vm-management-title">
        <DialogTitle id="vm-management-title">{panel === 'purpose' ? '사용 목적 수정' : '자동 Snapshot 관리'}</DialogTitle>
        {panel === 'purpose' ? <>
          <Field htmlFor="vm-purpose">사용 목적
          <Input id="vm-purpose" value={purposeDraft} onChange={event => setPurposeDraft(event.currentTarget.value)} />
          </Field>
          <DialogActions><Button variant="secondary" onClick={() => setPanel(null)}>취소</Button><Button disabled={!purposeDraft.trim()} onClick={() => { updateDetails({ purpose: purposeDraft.trim() }); setPanel(null); setNotice('사용 목적을 저장했습니다.'); }}>저장</Button></DialogActions>
        </> : <>
          <ValueRow><ValueLabel><Hint>자동 Snapshot</Hint><Muted>{details.autoSnapshot ? '켜짐' : '꺼짐'}</Muted></ValueLabel><Button variant="secondary" onClick={() => updateDetails({ autoSnapshot: !details.autoSnapshot })}>{details.autoSnapshot ? '끄기' : '켜기'}</Button></ValueRow>
          <ValueRow><ValueLabel><Hint>보관 개수</Hint><Muted>최신 Snapshot 보관</Muted></ValueLabel><Actions><Button variant="secondary" disabled={details.retainedSnapshots <= 1} onClick={() => updateDetails({ retainedSnapshots: Math.max(1, details.retainedSnapshots - 1) })}>−</Button><Muted>{details.retainedSnapshots}개</Muted><Button variant="secondary" onClick={() => updateDetails({ retainedSnapshots: details.retainedSnapshots + 1 })}>+</Button></Actions></ValueRow>
          <DialogActions><Button onClick={() => { setPanel(null); setNotice('Snapshot 설정을 저장했습니다.'); }}>완료</Button></DialogActions>
        </>}
      </Dialog>
    </Overlay>}
  </PageStack></WorkflowLayout></DemoOnlyGate>;
}
