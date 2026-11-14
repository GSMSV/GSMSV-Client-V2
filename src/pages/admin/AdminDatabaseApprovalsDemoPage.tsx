import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { getDemoDbRequests, saveDemoDbRequests, type DedicatedDatabaseRequest } from '../../entities/demo-workflows';
import { Button } from '../../shared/ui/controls';
import { Octicon } from '../../shared/ui/icons';
import { Alert, Badge, Card, CardHeader, Field, Heading, Hint, Muted, PageStack, SectionTitle, Stat, Stats, Table, TableWrap, Textarea, Title, TitleGroup, WorkflowLayout, DemoOnlyGate } from '../demo-workflows/ui/WorkflowLayout';

export default function AdminDatabaseApprovalsDemoPage() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState(() => getDemoDbRequests());
  const [selectedId, setSelectedId] = useState(() => getDemoDbRequests().find((item) => item.status === '검토 중' || item.status === '대기 중')?.id ?? getDemoDbRequests()[0]?.id ?? '');
  const [filter, setFilter] = useState<'pending' | 'done'>('pending');
  const [rejectReason, setRejectReason] = useState('');
  const [notice, setNotice] = useState('');
  const current = requests.find((item) => item.id === selectedId) ?? requests[0];
  const visible = useMemo(() => requests.filter((item) => filter === 'pending' ? item.status === '검토 중' || item.status === '대기 중' : item.status === '승인 완료' || item.status === '거절'), [requests, filter]);

  function update(next: DedicatedDatabaseRequest) {
    const updated = requests.map((item) => item.id === next.id ? next : item);
    setRequests(updated);
    saveDemoDbRequests(updated);
  }

  function approve() {
    if (!current || current.status === '승인 완료') return;
    update({ ...current, status: '승인 완료' });
    setNotice(`${current.team} 전용형 신청을 승인했습니다. 이 변경은 로컬 미리보기에만 적용됩니다.`);
  }

  function reject() {
    if (!current) return;
    if (!rejectReason.trim()) { setNotice('팀장에게 전달할 거절 사유를 입력해 주세요.'); return; }
    update({ ...current, status: '거절', rejectReason: rejectReason.trim() });
    setNotice(`${current.team} 신청을 거절하고 사유를 기록했습니다.`);
  }

  return <DemoOnlyGate admin><WorkflowLayout admin activeAdminItem="승인"><PageStack>
    <p style={{ margin: 0, color: '#a8a2af', fontSize: 12 }}>관리자 / 승인</p>
    <Heading><TitleGroup><Title>승인</Title><Muted>공유형으로 할 수 없는 이유인지 확인하고 승인하세요.</Muted></TitleGroup></Heading>
    {notice && <Alert $tone={notice.includes('입력') ? 'warning' : 'success'} role="status"><Octicon name="info" size={16} />{notice}</Alert>}
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Button variant="ghost" onClick={() => navigate('/admin/team-approvals')}>팀 <Badge>3</Badge></Button>
        <Button variant="primary">전용형 Database <Badge>1</Badge></Button>
      </div>
      <Button variant="secondary" icon={<Octicon name="sync" size={16} />} onClick={() => { setRequests(getDemoDbRequests()); setNotice('신청 목록을 새로고침했습니다.'); }}>새로고침</Button>
    </div>
    <Card>
      <CardHeader><SectionTitle>승인 대기 신청</SectionTitle><div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 8, background: '#403d45' }}><Button variant={filter === 'pending' ? 'primary' : 'ghost'} onClick={() => setFilter('pending')}>대기 중 {requests.filter((item) => item.status === '대기 중' || item.status === '검토 중').length}</Button><Button variant={filter === 'done' ? 'primary' : 'ghost'} onClick={() => setFilter('done')}>처리 완료</Button></div></CardHeader>
      <TableWrap><Table><thead><tr><th>팀</th><th>신청자</th><th>엔진</th><th>이유</th><th>신청일</th><th>상태</th></tr></thead><tbody>{visible.map((item) => <tr key={item.id} aria-selected={item.id === current?.id} onClick={() => { setSelectedId(item.id); setRejectReason(item.rejectReason); }}><td>{item.team}</td><td>{item.applicant}</td><td>{item.engine}</td><td>{item.reason}</td><td>{item.requestedAt}</td><td><Badge $tone={item.status === '승인 완료' ? 'success' : item.status === '거절' ? 'danger' : 'warning'}>{item.status}</Badge></td></tr>)}</tbody></Table></TableWrap>
      <Hint>{visible.length}개 중 {visible.length ? 1 : 0}–{visible.length}</Hint>
    </Card>
    {current && <>
      <Card>
        <CardHeader><div><SectionTitle>{current.team} 전용형 승인</SectionTitle><Hint>승인하면 고정 사양의 전용 DB 서버를 만들고 팀장·DevOps에게 접속 정보를 보여 줍니다.</Hint></div><Button disabled={current.status === '승인 완료'} icon={<Octicon name="check" size={16} />} onClick={approve}>승인</Button></CardHeader>
        <Muted>신청 설명</Muted><div style={{ marginTop: 8, padding: 12, minHeight: 90, borderRadius: 8, background: '#403d45', color: '#c0bbc6', fontSize: 14, lineHeight: '22px' }}>{current.description}</div>
        <Field style={{ marginTop: 16 }}>사양<InputDisabled value="vCPU 2 · RAM 4 GB · SSD 20 GB" /></Field>
        {current.status === '거절' && <Alert style={{ marginTop: 16 }}><Octicon name="info" size={16} />거절 사유: {current.rejectReason}</Alert>}
      </Card>
      <Card><CardHeader><SectionTitle>거절</SectionTitle><Button variant="secondary" disabled={current.status === '거절' || current.status === '승인 완료'} icon={<Octicon name="x" size={16} />} onClick={reject}>거절</Button></CardHeader><Muted>거절하면 사유가 팀장에게 전달되고, 팀은 고쳐서 다시 신청할 수 있습니다.</Muted><Field style={{ marginTop: 16 }}>팀장에게 전달할 사유<Textarea placeholder="거절 사유를 입력하세요" value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} /><Hint>거절할 때 반드시 입력해야 합니다.</Hint></Field></Card>
    </>}
    <Stats><Stat>운영 중인 전용형<strong>2개</strong><Muted>서비스 런타임 안에서 만듭니다</Muted></Stat><Stat>이번 학기 신청<strong>4건</strong><Muted>승인 2 · 거절 1</Muted></Stat><Stat>공유형 Database<strong>86개</strong><Muted>합계 21 GB 사용</Muted></Stat></Stats>
    <Muted>승인 기준 · 공유형이 줄 수 없는 장점만 승인합니다. 서버 전체 설정·확장 기능 변경, 계정·database를 직접 여러 개 만들기, 다른 학생의 부하와 성능 분리.</Muted>
  </PageStack></WorkflowLayout></DemoOnlyGate>;
}

function InputDisabled({ value }: { value: string }) {
  return <div style={{ padding: '10px 16px', borderRadius: 8, background: '#403d45', opacity: .65, fontSize: 14 }}>{value}</div>;
}
