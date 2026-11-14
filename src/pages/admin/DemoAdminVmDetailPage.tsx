import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import styled from 'styled-components';
import { getDemoAdminVms, saveDemoAdminVms, type DemoAdminVm } from '../../entities/demo-workflows';
import { Button } from '../../shared/ui/controls';
import { Octicon } from '../../shared/ui/icons';
import { Alert, Card, CardHeader, Heading, Hint, Muted, PageStack, SectionTitle, Stat, Stats, Title, TitleGroup, WorkflowLayout, DemoOnlyGate } from '../demo-workflows/ui/WorkflowLayout';

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
  background: #211f24;
  color: ${({ theme }) => theme.colors.text};
  font: 400 13px/22px 'DM Mono', monospace;
`;

export default function DemoAdminVmDetailPage() {
  const navigate = useNavigate();
  const { vmId = 'demo-vm-1' } = useParams<{ vmId: string }>();
  const [vms, setVms] = useState(() => getDemoAdminVms());
  const [notice, setNotice] = useState('');
  const vm = vms.find((item) => item.id === vmId) ?? vms[0];

  function save(next: DemoAdminVm[]) { setVms(next); saveDemoAdminVms(next); }
  function changePower(status: DemoAdminVm['status']) {
    if (!vm) return;
    save(vms.map((item) => item.id === vm.id ? { ...item, status } : item));
    setNotice(status === '실행 중' ? 'VM을 다시 시작했습니다.' : 'VM을 정상 종료했습니다.');
  }
  function removeVm() {
    if (!vm || !window.confirm(`${vm.name}을 로컬 미리보기의 목록에서 삭제할까요?`)) return;
    save(vms.filter((item) => item.id !== vm.id));
    setNotice('VM을 로컬 미리보기에서 삭제했습니다.');
    navigate('/admin/infra');
  }
  async function copyCommand() {
    if (!vm) return;
    try { await navigator.clipboard.writeText(vm.sshCommand); setNotice('SSH 명령어를 복사했습니다.'); }
    catch { setNotice(vm.sshCommand); }
  }

  return <DemoOnlyGate admin><WorkflowLayout admin activeAdminItem="전체 VM"><PageStack>
    <p style={{ margin: 0, color: '#a8a2af', fontSize: 12 }}>관리자 / {vm?.name ?? 'VM 상세'}</p>
    {notice && <Alert $tone="success" role="status"><Octicon name="info" size={16} />{notice}</Alert>}
    {vm ? <>
      <Heading><TitleGroup><Title>{vm.name}</Title><Muted>{vm.owner}의 {vm.name} · 관리자 조회 · {vm.status}</Muted></TitleGroup><div style={{ display: 'flex', gap: 8 }}><Button variant="secondary" icon={<Octicon name="stop" size={16} />} disabled={vm.status === '중지'} onClick={() => changePower('중지')}>정상 종료</Button><Button variant="secondary" icon={<Octicon name="sync" size={16} />} disabled={vm.status === '실행 중'} onClick={() => changePower('실행 중')}>재시작</Button><Button variant="danger" icon={<Octicon name="trashcan" size={16} />} onClick={removeVm}>관리자 삭제</Button></div></Heading>
      <Expiry>◷　만료까지 4일 남았습니다<br /><Muted>10월 3일 14:00에 만료됩니다. 지금 연장하면 10월 17일 14:00까지 사용할 수 있습니다.</Muted></Expiry>
      <Stats><Stat>CPU<strong>{vm.vcpu} vCPU</strong><Muted>일반 Node</Muted></Stat><Stat>메모리<strong>{vm.ram} GB</strong><Muted>할당 메모리</Muted></Stat><Stat>디스크<strong>{vm.disk} GB</strong><Muted>Linux Ubuntu 22.04 LTS</Muted></Stat></Stats>
      <InfoGrid><Card><CardHeader><SectionTitle>운영 정보</SectionTitle></CardHeader><InfoItem><Hint>사용 목적</Hint><Muted>{vm.purpose}</Muted></InfoItem><InfoItem><Hint>자동 Snapshot</Hint><Muted>켜짐 · 최신 1개 보관</Muted></InfoItem><InfoItem><Hint>Network</Hint><Muted>외부 포트 3/30 · HTTPS Domain 1/2</Muted></InfoItem></Card><Card><CardHeader><SectionTitle>사용 기간</SectionTitle></CardHeader><InfoItem><Hint>생성일</Hint><Muted>{vm.createdAt} (KST)</Muted></InfoItem><InfoItem><Hint>만료일</Hint><Muted>{vm.expiresAt} (KST)</Muted></InfoItem><InfoItem><Hint>가동 시간</Hint><Muted>2일 19시간</Muted></InfoItem></Card></InfoGrid>
      <Card><CardHeader><SectionTitle>SSH 접속 정보</SectionTitle></CardHeader><InfoGrid><InfoItem><Hint>SSH 계정</Hint><Muted>ubuntu</Muted></InfoItem><InfoItem><Hint>내부 IP</Hint><Muted>10.20.0.104</Muted></InfoItem><InfoItem><Hint>초기 비밀번호</Hint><Muted>••••••••••••</Muted></InfoItem></InfoGrid></Card>
      <Card><CardHeader><SectionTitle><Octicon name="terminal" size={16} /> SSH 명령어</SectionTitle></CardHeader><Code>{vm.sshCommand}</Code><div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}><Button variant="secondary" icon={<Octicon name="book" size={16} />} onClick={() => navigate('/help')}>SSH 키 등록 Docs</Button><Button icon={<Octicon name="copy" size={16} />} onClick={copyCommand}>명령어 복사</Button></div><Hint>실제 SSH 매핑: 외부 32104 → 내부 22 · 터미널에 붙여넣어 접속하세요.</Hint></Card>
    </> : <Card><SectionTitle>이 VM은 로컬 미리보기에서 삭제되었습니다.</SectionTitle><Button style={{ marginTop: 16 }} onClick={() => navigate('/admin/infra')}>인프라 현황</Button></Card>}
  </PageStack></WorkflowLayout></DemoOnlyGate>;
}
