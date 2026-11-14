import { useState } from 'react';
import styled from 'styled-components';
import { getDemoDbRequests, saveDemoDbRequests, type DedicatedDatabaseRequest } from '../../entities/demo-workflows';
import { isDemoMode } from '../../shared/demo';
import { Button } from '../../shared/ui/controls';
import { Octicon } from '../../shared/ui/icons';
import { Alert, Badge, Breadcrumb, Card, CardHeader, Field, Heading, Hint, Input, Muted, PageStack, SectionTitle, Select, Subtitle, Textarea, Title, TitleGroup, WorkflowLayout, DemoOnlyGate } from '../demo-workflows/ui/WorkflowLayout';

const Columns = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
`;
const InfoRow = styled.div`
  display: flex;
  gap: 12px;
  padding: 16px 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.primary};
`;
const InfoText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: ${({ theme }) => theme.colors.text};
  strong { font: 500 14px/20px ${({ theme }) => theme.typography.body.family}, sans-serif; }
  span { color: ${({ theme }) => theme.colors.muted}; font: 400 14px/22px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif; }
`;

export default function DedicatedDatabaseRequestPage() {
  const [engine, setEngine] = useState<'MySQL' | 'PostgreSQL'>('MySQL');
  const [reason, setReason] = useState('다른 학생의 부하와 성능을 떼어 놓아야 합니다');
  const [description, setDescription] = useState('실시간 매칭 기능 때문에 쿼리가 많습니다. 공유 서버의 다른 학생 Database에 영향을 주지 않도록 따로 쓰고 싶습니다.');
  const [notice, setNotice] = useState('');
  const pending = getDemoDbRequests().find((request) => request.status === '대기 중' || request.status === '검토 중');

  function submitRequest() {
    if (!isDemoMode()) return;
    if (!description.trim()) { setNotice('사용 목적을 입력해 주세요.'); return; }
    if (pending) {
      const updated = { ...pending, engine, reason, description: description.trim(), status: '대기 중' as const, rejectReason: '', requestedAt: '2026.11.14' };
      saveDemoDbRequests(getDemoDbRequests().map((item) => item.id === pending.id ? updated : item));
      setNotice('전용 Database 신청을 등록했습니다. 관리자 검토 후 결과를 확인할 수 있습니다.');
      return;
    }
    const request: DedicatedDatabaseRequest = {
      id: `db-request-${Date.now()}`, team: 'GSM Connect', applicant: '김지민 · 팀장', members: 3,
      engine, reason, description: description.trim(), requestedAt: '2026.11.14', status: '대기 중', rejectReason: '',
    };
    saveDemoDbRequests([...getDemoDbRequests(), request]);
    setNotice('전용 Database 신청을 등록했습니다. 관리자 검토 후 결과를 확인할 수 있습니다.');
  }

  return <DemoOnlyGate><WorkflowLayout activeStudentItem="database" scopeLabel="GSM Connect · 팀"><PageStack>
    <Breadcrumb>GSM Connect / Database / 전용형 신청</Breadcrumb>
    <Heading><TitleGroup><Title>전용형 Database 신청</Title><Subtitle>DB 서버 하나를 팀 전용으로 받습니다. 관리자가 승인하면 만들어집니다.</Subtitle></TitleGroup></Heading>
    {notice && <Alert $tone={notice.startsWith('전용 Database') ? 'success' : 'warning'} role="status"><Octicon name="info" size={16} /><span>{notice}</span></Alert>}
    <Card>
      <CardHeader><SectionTitle>신청 정보</SectionTitle><Button icon={<Octicon name="people" size={16} />} onClick={submitRequest}>신청</Button></CardHeader>
      <Muted>팀당 1개까지이고, 팀 Database 4개 안에 들어갑니다. 팀장과 DevOps만 신청할 수 있습니다.</Muted>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 20 }}>
        <Field>엔진<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: 4, borderRadius: 8, background: '#403d45' }}>{(['MySQL', 'PostgreSQL'] as const).map((item) => <button key={item} type="button" onClick={() => setEngine(item)} style={{ minHeight: 34, border: 0, borderRadius: 6, background: engine === item ? '#203d30' : 'transparent', color: engine === item ? '#00ff90' : '#c0bbc6', cursor: 'pointer' }}>{item}</button>)}</div></Field>
        <Field>이유<Select value={reason} onChange={(event) => setReason(event.target.value)}><option>다른 학생의 부하와 성능을 떼어 놓아야 합니다</option><option>팀 서비스의 DB 관리자 권한이 필요합니다</option><option>운영 중인 서비스에 전용 서버가 필요합니다</option></Select></Field>
        <Field>사용 목적<Textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={500} /><Hint>꼭 적어야 합니다. 관리자가 승인할 때 참고합니다.</Hint></Field>
        <Field>사양<Input value="vCPU 2 · RAM 4 GB · SSD 20 GB" disabled /><Hint>팀이 고를 수 없는 고정 사양입니다.</Hint></Field>
      </div>
    </Card>
    <Columns>
      <Card><CardHeader><SectionTitle>공유형과 다른 점</SectionTitle></CardHeader>
        <InfoRow><Octicon name="database" size={20} /><InfoText><strong>DB 서버를 팀만 씁니다</strong><span>다른 학생의 부하에 영향을 받지 않습니다.</span></InfoText></InfoRow>
        <InfoRow><Octicon name="shield" size={20} /><InfoText><strong>DB 관리자 권한</strong><span>계정과 database를 팀이 직접 만들 수 있습니다.</span></InfoText></InfoRow>
        <InfoRow><Octicon name="cpu" size={20} /><InfoText><strong>고정 사양</strong><span>사양은 한 가지로 정해져 있고 바꿀 수 없습니다.</span></InfoText></InfoRow>
      </Card>
      <Card><CardHeader><SectionTitle>신청 뒤 순서</SectionTitle></CardHeader>
        <InfoRow><Octicon name="checklist" size={20} /><InfoText><strong>1. 관리자 승인</strong><span>거절되면 사유를 보고 고쳐서 다시 신청할 수 있습니다.</span></InfoText></InfoRow>
        <InfoRow><Octicon name="database" size={20} /><InfoText><strong>2. 전용 DB 서버 만들기</strong><span>승인되면 바로 만들어집니다.</span></InfoText></InfoRow>
        <InfoRow><Octicon name="key" size={20} /><InfoText><strong>3. 접속 정보 확인</strong><span>팀장과 DevOps에게 접속 정보를 보여 드립니다. 쿼리 콘솔은 없습니다.</span></InfoText></InfoRow>
      </Card>
    </Columns>
    <Card style={{ display: 'flex', alignItems: 'center', gap: 16 }}><Octicon name="calendar" size={18} /><div><strong style={{ color: '#f7f6f8', fontSize: 14 }}>전용형 Database의 사용 기간</strong><Muted style={{ marginTop: 4 }}>첫 31일 뒤 만료되고, 이후 2주마다 팀원 누구나 연장할 수 있습니다.</Muted></div></Card>
    {pending && <Muted><Badge>신청 상태: {pending.status}</Badge> · {pending.engine} · {pending.requestedAt}</Muted>}
  </PageStack></WorkflowLayout></DemoOnlyGate>;
}
