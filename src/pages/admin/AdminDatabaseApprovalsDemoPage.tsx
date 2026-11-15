import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import styled from 'styled-components';
import { getDemoDbRequests, getDemoTeamRequests, saveDemoDbRequests, type DedicatedDatabaseRequest } from '../../entities/demo-workflows';
import { createDemoDatabase, getDemoDatabase, getDemoTeamDedicatedDatabaseQuota, listDemoDatabases } from '../../entities/database/demo';
import type { DatabaseEngine } from '../../entities/database';
import { addDemoNotification } from '../../entities/notification';
import { getDemoTeam, listDemoTeams } from '../../entities/team/demo';
import { Button } from '../../shared/ui/controls';
import { Octicon } from '../../shared/ui/icons';
import { Alert, Badge, Card, CardHeader, Field, Heading, Hint, Muted, PageStack, SectionTitle, Stat, Stats, Table, TableWrap, Textarea, Title, TitleGroup, WorkflowLayout, DemoOnlyGate } from '../demo-workflows/ui/WorkflowLayout';

const AdminToolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;

  @media (max-width: 600px) {
    align-items: flex-start;
    flex-direction: column;
  }
`;
const ApprovalTabs = styled.div`
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  gap: 4px;
  padding: 4px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.raised};
`;
const ApprovalTable = styled(Table)`
  min-width: 800px;
`;

const isPending = (request: DedicatedDatabaseRequest) => request.status === '대기 중' || request.status === '검토 중';

export default function AdminDatabaseApprovalsDemoPage() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState(() => getDemoDbRequests());
  const [selectedId, setSelectedId] = useState(() => getDemoDbRequests().find(isPending)?.id ?? '');
  const [filter, setFilter] = useState<'pending' | 'done'>('pending');
  const [rejectReason, setRejectReason] = useState('');
  const [notice, setNotice] = useState('');
  const visible = useMemo(() => requests.filter((item) => filter === 'pending' ? isPending(item) : !isPending(item)), [requests, filter]);
  const current = visible.find((item) => item.id === selectedId) ?? visible[0];

  useEffect(() => {
    setRejectReason(current?.rejectReason ?? '');
  }, [current?.id, current?.rejectReason]);

  function update(next: DedicatedDatabaseRequest) {
    const updated = getDemoDbRequests().map((item) => item.id === next.id ? next : item);
    if (!saveDemoDbRequests(updated)) return false;
    setRequests(updated);
    setSelectedId(next.id);
    setFilter('done');
    return true;
  }

  function approve() {
    const request = getDemoDbRequests().find(item => item.id === current?.id);
    if (!request || !isPending(request)) {
      setRequests(getDemoDbRequests());
      setNotice('이미 처리된 신청입니다.');
      return;
    }
    const teamId = request.teamId ?? listDemoTeams().find(item => item.name === request.team)?.id;
    const team = teamId ? getDemoTeam(teamId) : undefined;
    if (!teamId || !team) {
      setNotice('신청한 팀을 찾을 수 없어 승인할 수 없습니다.');
      return;
    }
    const teamName = team.name;
    const existingDatabases = listDemoDatabases(teamId);
    const databaseName = request.databaseName ?? `dedicated-${request.id.replace(/[^a-z0-9]/gi, '').slice(-12).toLowerCase()}`;
    let database = request.databaseGrn ? getDemoDatabase(request.databaseGrn) : null;

    if (!database) database = existingDatabases
      .map((item) => getDemoDatabase(item.grn))
      .find((item) => item?.name === databaseName) ?? null;

    if (database && (database.owner.type !== 'team' || database.owner.id !== teamId || database.isolation !== 'dedicated')) {
      setNotice('신청에 연결된 Database가 해당 팀의 전용형이 아니어서 승인할 수 없습니다.');
      return;
    }

    if (getDemoTeamDedicatedDatabaseQuota(teamId, database?.grn).available === 0) {
      setNotice(`${teamName} 팀은 전용 Database 1개 한도를 사용 중이라 승인할 수 없습니다.`);
      return;
    }

    if (!database) {
      if (existingDatabases.length >= 4) {
        setNotice(`${teamName} 팀의 Database 한도 4개를 모두 사용 중이라 승인할 수 없습니다.`);
        return;
      }
      try {
        const engine: DatabaseEngine = request.engine === 'MySQL' ? 'mysql' : 'postgresql';
        database = createDemoDatabase(databaseName, engine, { id: teamId, name: teamName }, 'dedicated');
      } catch {
        setNotice('전용 Database를 만들지 못했습니다. 다시 시도해 주세요.');
        return;
      }
    }

    const approved = { ...request, teamId, status: '승인 완료' as const, databaseGrn: database.grn, databaseName: database.name };
    if (!update(approved)) {
      setNotice('Database는 만들어졌지만 신청 상태를 저장하지 못했습니다. 다시 승인하면 기존 Database와 연결됩니다.');
      return;
    }
    addDemoNotification({
      kind: 'dedicated-database-approved', category: 'Database', group: 'Resource',
      title: '전용형 Database 신청이 승인됐습니다', body: teamName,
      resource: { grn: database.grn, name: database.name },
    });
    setNotice(`${request.team} 전용형 신청을 승인했습니다. ${database.name} Database가 로컬 미리보기에 등록되었습니다.`);
  }

  function reject() {
    const request = getDemoDbRequests().find(item => item.id === current?.id);
    if (!request || !isPending(request)) {
      setRequests(getDemoDbRequests());
      setNotice('이미 처리된 신청입니다.');
      return;
    }
    if (!rejectReason.trim()) { setNotice('팀장에게 전달할 거절 사유를 입력해 주세요.'); return; }
    if (!update({ ...request, status: '거절', rejectReason: rejectReason.trim() })) {
      setNotice('거절 사유를 저장하지 못했습니다. 다시 시도해 주세요.');
      return;
    }
    addDemoNotification({
      kind: 'dedicated-database-rejected', category: 'Database', group: 'Resource',
      title: '전용형 Database 신청이 거절됐습니다', body: rejectReason.trim(), resource: null,
    });
    setNotice(`${request.team} 신청을 거절하고 사유를 기록했습니다.`);
  }

  return <DemoOnlyGate admin><WorkflowLayout admin activeAdminItem="승인"><PageStack>
    <p style={{ margin: 0, color: '#a8a2af', fontSize: 12 }}>관리자 / 승인</p>
    <Heading><TitleGroup><Title>승인</Title><Muted>공유형으로 할 수 없는 이유인지 확인하고 승인하세요.</Muted></TitleGroup></Heading>
    {notice && <Alert $tone={notice.includes('습니다.') && /승인했습니다|사유를 기록했습니다|새로고침했습니다/.test(notice) ? 'success' : 'warning'} role="status"><Octicon name="info" size={16} />{notice}</Alert>}
    <AdminToolbar>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Button variant="ghost" onClick={() => navigate('/admin/team-approvals')}>팀 <Badge>{getDemoTeamRequests().filter(item => item.status === '대기 중' || item.status === '검토 중').length}</Badge></Button>
        <Button variant="primary" aria-current="page">전용형 Database <Badge>{requests.filter(isPending).length}</Badge></Button>
      </div>
      <Button variant="secondary" icon={<Octicon name="sync" size={16} />} onClick={() => { setRequests(getDemoDbRequests()); setNotice('신청 목록을 새로고침했습니다.'); }}>새로고침</Button>
    </AdminToolbar>
    <Card>
      <CardHeader><SectionTitle>승인 대기 신청</SectionTitle><ApprovalTabs><Button variant={filter === 'pending' ? 'primary' : 'ghost'} onClick={() => setFilter('pending')}>대기 중 {requests.filter((item) => item.status === '대기 중' || item.status === '검토 중').length}</Button><Button variant={filter === 'done' ? 'primary' : 'ghost'} onClick={() => setFilter('done')}>처리 완료</Button></ApprovalTabs></CardHeader>
      <TableWrap><ApprovalTable><thead><tr><th>팀</th><th>신청자</th><th>엔진</th><th>이유</th><th>신청일</th><th>상태</th></tr></thead><tbody>{visible.length ? visible.map((item) => <tr key={item.id} aria-selected={item.id === current?.id} onClick={() => { setSelectedId(item.id); setRejectReason(item.rejectReason); }}><td>{item.team}</td><td>{item.applicant}</td><td>{item.engine}</td><td>{item.reason}</td><td>{item.requestedAt}</td><td><Badge $tone={item.status === '승인 완료' ? 'success' : item.status === '거절' ? 'danger' : 'warning'}>{item.status}</Badge></td></tr>) : <tr><td colSpan={6}>표시할 신청이 없습니다.</td></tr>}</tbody></ApprovalTable></TableWrap>
      <Hint>{visible.length}개 중 {visible.length ? 1 : 0}–{visible.length}</Hint>
    </Card>
    {current && <>
      <Card>
        <CardHeader><div><SectionTitle>{current.team} 전용형 승인</SectionTitle><Hint>승인하면 고정 사양의 전용 DB 서버를 만들고 팀장·DevOps에게 접속 정보를 보여 줍니다.</Hint></div><Button disabled={current.status === '승인 완료' || current.status === '거절'} icon={<Octicon name="check" size={16} />} onClick={approve}>승인</Button></CardHeader>
        <Muted>신청 설명</Muted><div style={{ marginTop: 8, padding: 12, minHeight: 90, borderRadius: 8, background: '#403d45', color: '#c0bbc6', fontSize: 14, lineHeight: '22px' }}>{current.description}</div>
        <Field style={{ marginTop: 16 }}>사양<InputDisabled value="vCPU 2 · RAM 4 GB · SSD 20 GB" /></Field>
        {current.status === '거절' && <Alert style={{ marginTop: 16 }}><Octicon name="info" size={16} />거절 사유: {current.rejectReason}</Alert>}
        {current.status === '승인 완료' && current.databaseGrn && <Alert style={{ marginTop: 16 }}><Octicon name="database" size={16} />생성된 Database: {current.databaseName ?? '전용 Database'} · {current.databaseGrn}</Alert>}
      </Card>
      <Card><CardHeader><SectionTitle>거절</SectionTitle><Button variant="secondary" disabled={current.status === '거절' || current.status === '승인 완료' || !rejectReason.trim()} icon={<Octicon name="x" size={16} />} onClick={reject}>거절</Button></CardHeader><Muted>거절하면 사유가 팀장에게 전달되고, 팀은 고쳐서 다시 신청할 수 있습니다.</Muted><Field style={{ marginTop: 16 }}>팀장에게 전달할 사유<Textarea placeholder="거절 사유를 입력하세요" value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} /><Hint>거절할 때 반드시 입력해야 합니다.</Hint></Field></Card>
    </>}
    <Stats><Stat>운영 중인 전용형<strong>2개</strong><Muted>서비스 런타임 안에서 만듭니다</Muted></Stat><Stat>이번 학기 신청<strong>4건</strong><Muted>승인 2 · 거절 1</Muted></Stat><Stat>공유형 Database<strong>86개</strong><Muted>합계 21 GB 사용</Muted></Stat></Stats>
    <Muted>승인 기준 · 공유형이 줄 수 없는 장점만 승인합니다. 서버 전체 설정·확장 기능 변경, 계정·database를 직접 여러 개 만들기, 다른 학생의 부하와 성능 분리.</Muted>
  </PageStack></WorkflowLayout></DemoOnlyGate>;
}

function InputDisabled({ value }: { value: string }) {
  return <div style={{ padding: '10px 16px', borderRadius: 8, background: '#403d45', opacity: .65, fontSize: 14 }}>{value}</div>;
}
