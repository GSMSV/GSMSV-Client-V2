import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { getDemoTeamRequests, saveDemoTeamRequests, type TeamRequest } from '../../entities/demo-workflows';
import { listDemoDisbandRequests, setDemoTeamApproval, type DemoTeamDetail } from '../../entities/team/demo';
import { AccountDialog, DialogCopy, approveDemoTeamDisband, getDemoDisbandResources } from '../../features/settings/demo-account';
import { Button } from '../../shared/ui/controls';
import { Octicon } from '../../shared/ui/icons';
import { Alert, Badge, Card, CardHeader, Field, Heading, Hint, Input, Muted, PageStack, SectionTitle, Select, Stat, Stats, Table, TableWrap, Textarea, Title, TitleGroup, WorkflowLayout, DemoOnlyGate } from '../demo-workflows/ui/WorkflowLayout';

export default function AdminTeamApprovalsDemoPage() {
  const navigate = useNavigate();
  const [disbandRequests, setDisbandRequests] = useState(listDemoDisbandRequests);
  const [confirmDisband, setConfirmDisband] = useState<DemoTeamDetail | null>(null);
  const disbandResources = confirmDisband ? getDemoDisbandResources(confirmDisband.id) : null;
  const [disbandFailed, setDisbandFailed] = useState(false);
  const [disbandBusy, setDisbandBusy] = useState(false);
  const [requests, setRequests] = useState(() => getDemoTeamRequests());
  const [selectedId, setSelectedId] = useState(() => getDemoTeamRequests().find((item) => item.status === '검토 중')?.id ?? getDemoTeamRequests()[0]?.id ?? '');
  const [filter, setFilter] = useState<'pending' | 'done'>('pending');
  const [rejectReason, setRejectReason] = useState('');
  const [notice, setNotice] = useState('');
  const selected = requests.find((request) => request.id === selectedId) ?? requests[0];
  const visible = useMemo(() => requests.filter((item) => filter === 'pending' ? item.status === '대기 중' || item.status === '검토 중' : item.status === '승인 완료' || item.status === '거절'), [requests, filter]);

  function update(request: TeamRequest) {
    const next = requests.map((item) => item.id === request.id ? request : item);
    if (!saveDemoTeamRequests(next)) return false;
    setRequests(next);
    return true;
  }

  function approve() {
    if (!selected || selected.status === '승인 완료' || selected.status === '거절') return;
    const teamId = selected.teamId ?? (selected.name === 'GSM Connect' ? 'demo-team' : undefined);
    if (teamId && !setDemoTeamApproval(teamId, 'approved', { vcpu: selected.vcpu, ram: selected.ram, ssd: selected.ssd })) {
      setNotice('팀 상태를 저장하지 못했습니다. 다시 시도해 주세요.');
      return;
    }
    if (!update({ ...selected, status: '승인 완료' })) {
      setNotice('신청 상태를 저장하지 못했습니다. 다시 시도해 주세요.');
      return;
    }
    setNotice(`${selected.name} 팀 신청을 승인했습니다. 로컬 미리보기에서만 적용됩니다.`);
  }

  function reject() {
    const reason = rejectReason.trim();
    if (!selected || selected.status === '거절' || selected.status === '승인 완료' || !reason) return;
    const teamId = selected.teamId ?? (selected.name === 'GSM Connect' ? 'demo-team' : undefined);
    if (teamId && !setDemoTeamApproval(teamId, 'rejected', { rejectionReason: reason })) {
      setNotice('팀 상태를 저장하지 못했습니다. 다시 시도해 주세요.');
      return;
    }
    if (!update({ ...selected, status: '거절', rejectReason: reason })) {
      setNotice('신청 상태를 저장하지 못했습니다. 다시 시도해 주세요.');
      return;
    }
    setNotice(`${selected.name} 팀 신청을 거절했습니다.`);
  }

  function patchSelected(partial: Partial<TeamRequest>) {
    if (selected) update({ ...selected, ...partial });
  }

  return <DemoOnlyGate admin><WorkflowLayout admin activeAdminItem="승인"><PageStack>
    <p style={{ margin: 0, color: '#a8a2af', fontSize: 12 }}>관리자 / 승인</p>
    <Heading><TitleGroup><Title>승인</Title><Muted>팀의 사용 목적을 확인하고 할당량을 정해 승인하세요.</Muted></TitleGroup></Heading>
    {notice && <Alert $tone={notice.includes('입력') || notice.includes('저장하지 못') ? 'warning' : 'success'} role="status"><Octicon name="info" size={16} />{notice}</Alert>}
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><div style={{ display: 'flex', gap: 8 }}><Button variant="primary">팀 <Badge>3</Badge></Button><Button variant="ghost" onClick={() => navigate('/admin/database-approvals')}>전용형 Database <Badge>1</Badge></Button></div><Button variant="secondary" icon={<Octicon name="sync" size={16} />} onClick={() => { setRequests(getDemoTeamRequests()); setDisbandRequests(listDemoDisbandRequests()); setNotice('신청 목록을 새로고침했습니다.'); }}>새로고침</Button></div>
    <Card><CardHeader><SectionTitle>승인 대기 팀</SectionTitle><div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 8, background: '#403d45' }}><Button variant={filter === 'pending' ? 'primary' : 'ghost'} onClick={() => setFilter('pending')}>대기 중 {requests.filter((item) => item.status === '대기 중' || item.status === '검토 중').length}</Button><Button variant={filter === 'done' ? 'primary' : 'ghost'} onClick={() => setFilter('done')}>처리 완료</Button></div></CardHeader>
      <TableWrap><Table><thead><tr><th>팀</th><th>팀장</th><th>팀원</th><th>사용 목적</th><th>신청일</th><th>상태</th></tr></thead><tbody>{visible.map((item) => <tr key={item.id} aria-selected={item.id === selected?.id} onClick={() => { setSelectedId(item.id); setRejectReason(item.rejectReason); }}><td>{item.name}</td><td>{item.leader}</td><td>{item.members}명</td><td>{item.purpose}</td><td>{item.requestedAt}</td><td><Badge $tone={item.status === '승인 완료' ? 'success' : item.status === '거절' ? 'danger' : 'warning'}>{item.status}</Badge></td></tr>)}</tbody></Table></TableWrap>
      <Hint>{visible.length}개 중 1–{visible.length}</Hint>
    </Card>
    {selected && <>
      <Card><CardHeader><div><SectionTitle>{selected.name} 승인</SectionTitle><Hint>승인하면서 팀 할당량을 정합니다. 팀 룸 전체 안에서만 VM을 만들 수 있습니다.</Hint></div><Button disabled={selected.status === '승인 완료'} icon={<Octicon name="check" size={16} />} onClick={approve}>승인</Button></CardHeader>
        <Field>할당량 등급<Select value={selected.tier} onChange={(event) => patchSelected(event.target.value === '중형' ? { tier: '중형', vcpu: 8, ram: 16, ssd: 120 } : event.target.value === '대형' ? { tier: '대형', vcpu: 16, ram: 32, ssd: 240 } : { tier: '소형', vcpu: 4, ram: 8, ssd: 60 })}><option value="소형">소형 · vCPU 4 · RAM 8GB · SSD 60GB</option><option value="중형">중형 · vCPU 8 · RAM 16GB · SSD 120GB</option><option value="대형">대형 · vCPU 16 · RAM 32GB · SSD 240GB</option></Select></Field>
        <Field style={{ marginTop: 16 }}>vCPU<Input type="number" min={1} value={selected.vcpu} onChange={(event) => patchSelected({ vcpu: Number(event.target.value) })} /><Hint>값을 직접 바꾸면 등급 대신 적용됩니다.</Hint></Field>
        <Field style={{ marginTop: 16 }}>RAM (GB)<Input type="number" min={1} value={selected.ram} onChange={(event) => patchSelected({ ram: Number(event.target.value) })} /></Field>
        <Field style={{ marginTop: 16 }}>SSD (GB)<Input type="number" min={1} value={selected.ssd} onChange={(event) => patchSelected({ ssd: Number(event.target.value) })} /></Field>
      </Card>
      <Card><CardHeader><div><SectionTitle>거절</SectionTitle><Hint>거절하면 팀원과 보낸 초대가 해제되고, 팀은 7일 뒤 삭제됩니다.</Hint></div><Button variant="secondary" disabled={!rejectReason.trim() || selected.status === '거절' || selected.status === '승인 완료'} icon={<Octicon name="x" size={16} />} onClick={reject}>거절</Button></CardHeader><Field>팀장에게 전달할 사유<Textarea placeholder="거절 사유를 입력하세요" value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} /><Hint>거절할 때 반드시 입력해야 합니다.</Hint></Field></Card>
    </>}
    {disbandRequests.length > 0 && <Card>
      <CardHeader><SectionTitle>해체 요청</SectionTitle></CardHeader>
      {disbandRequests.map(team => <CardHeader key={team.id}>
        <Muted>{team.name} · 팀원 {team.members.length}명</Muted>
        <Button variant="danger" onClick={() => { setDisbandFailed(false); setConfirmDisband(team); }}>해체 승인</Button>
      </CardHeader>)}
    </Card>}
    {confirmDisband && disbandResources && <AccountDialog title={`${confirmDisband.name} 팀 해체를 승인하시겠습니까?`} icon="alert"
      description={`· 팀원 ${confirmDisband.members.length}명 · VM ${disbandResources.vms.length}개 · Database ${disbandResources.databaseCount}개 · 함수 ${disbandResources.functionCount}개 · 앱 ${disbandResources.appCount}개\n· 승인하면 팀의 VM·Database·함수·앱이 모두 삭제되고 복구할 수 없습니다.\n· 팀원 전원에게 알림이 갑니다.`}
      onDismiss={() => setConfirmDisband(null)} actions={<>
        <Button variant="secondary" onClick={() => setConfirmDisband(null)}>취소</Button>
        <Button variant="danger" disabled={disbandBusy} onClick={() => {
          setDisbandBusy(true);
          void approveDemoTeamDisband(confirmDisband.id).then(success => {
            if (!success) { setDisbandFailed(true); return; }
            setConfirmDisband(null);
            setDisbandRequests(listDemoDisbandRequests());
          }).finally(() => setDisbandBusy(false));
        }}>{disbandBusy ? '처리 중…' : '해체 승인'}</Button>
      </>}>{disbandFailed && <DialogCopy role="alert">해체를 승인하지 못했습니다.</DialogCopy>}</AccountDialog>}
    <Stats><Stat>팀 룸 사용<strong>38%</strong><Muted>vCPU 36 / 96 할당</Muted></Stat><Stat>승인된 팀<strong>9개</strong><Muted>해체 요청 {disbandRequests.length}건</Muted></Stat><Stat>할당량 늘리기 요청<strong>2건</strong><Muted>확인이 필요합니다</Muted></Stat></Stats>
    <Muted>할당량 등급 기준 · 소형 4/8/60 · 팀원 5명 이하 · 중형 8/16/120 · 팀원 6명 이상 또는 상시 운영 서비스 · 대형 16/32/240 · 교내 공식 서비스, GPU 필요 등 사유 확인</Muted>
  </PageStack></WorkflowLayout></DemoOnlyGate>;
}
