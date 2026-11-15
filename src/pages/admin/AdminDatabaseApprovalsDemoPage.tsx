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
import { DemoPagePlaceholder, useDemoPageLoad } from '../demo-workflows/ui/DemoPageState';
import { Alert, Card, CardHeader, Field, Heading, Hint, Muted, PageStack, SectionTitle, Table, TableWrap, Textarea, Title, TitleGroup, WorkflowLayout, DemoOnlyGate } from '../demo-workflows/ui/WorkflowLayout';
import { Pagination } from '../../shared/ui/data-display/Pagination';
import { AdminCount, AdminCriteria, AdminSegment, AdminSegmented, AdminStat, AdminStats, AdminStatusText, AdminTab, AdminTabs, AdminTabsRow } from './adminDemoUi';

const ApprovalCopy = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 16px;
`;
const FieldStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;
const RequestDescription = styled.div`
  min-height: 100px;
  padding: 12px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.field};
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
  overflow-wrap: anywhere;
`;
const DisabledValue = styled.div`
  display: flex;
  min-height: 42px;
  align-items: center;
  padding: 0 16px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.field};
  color: ${({ theme }) => theme.colors.faint};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;
const ApprovalTable = styled(Table)`
  min-width: 800px;
`;

const isPending = (request: DedicatedDatabaseRequest) => request.status === '대기 중' || request.status === '검토 중';

export default function AdminDatabaseApprovalsDemoPage() {
  const navigate = useNavigate();
  const pageLoad = useDemoPageLoad('admin-database-approvals');
  const [requests, setRequests] = useState(() => getDemoDbRequests());
  const [selectedId, setSelectedId] = useState(() => getDemoDbRequests().find(isPending)?.id ?? '');
  const [filter, setFilter] = useState<'pending' | 'done'>('pending');
  const [rejectReason, setRejectReason] = useState('');
  const [notice, setNotice] = useState('');
  const visible = useMemo(() => requests.filter((item) => filter === 'pending' ? isPending(item) : !isPending(item)), [requests, filter]);
  const current = visible.find((item) => item.id === selectedId) ?? visible[0];
  const currentTeamId = current ? current.teamId ?? listDemoTeams().find(item => item.name === current.team)?.id : undefined;
  const teamDatabaseCount = currentTeamId ? listDemoDatabases(currentTeamId).length : 0;

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
    <Hint style={{ margin: 0 }}>관리자 / 승인</Hint>
    <Heading><TitleGroup><Title>승인</Title><Muted>공유형으로 할 수 없는 이유인지 확인하고 승인하세요.</Muted></TitleGroup></Heading>
    {notice && <Alert $tone={notice.includes('습니다.') && /승인했습니다|사유를 기록했습니다|새로고침했습니다/.test(notice) ? 'success' : 'warning'} role="status"><Octicon name="info" size={16} />{notice}</Alert>}
    <AdminTabsRow>
      <AdminTabs aria-label="승인 종류">
        <AdminTab type="button" onClick={() => navigate('/admin/team-approvals')}>팀 <AdminCount>{getDemoTeamRequests().filter(item => item.status === '대기 중' || item.status === '검토 중').length}</AdminCount></AdminTab>
        <AdminTab type="button" $active aria-current="page">전용형 Database <AdminCount>{requests.filter(isPending).length}</AdminCount></AdminTab>
      </AdminTabs>
      <Button variant="secondary" icon={<Octicon name="sync" size={16} />} onClick={() => { setRequests(getDemoDbRequests()); setNotice('신청 목록을 새로고침했습니다.'); }}>새로고침</Button>
    </AdminTabsRow>
    {pageLoad.status !== 'ready' ? <DemoPagePlaceholder status={pageLoad.status} onRetry={pageLoad.retry} rows={[254, 378, 298, [150, 150, 150]]} label="전용형 Database 신청을 불러오는 중" /> : <>
    <Card>
      <CardHeader><SectionTitle>승인 대기 신청</SectionTitle><AdminSegmented role="group" aria-label="신청 상태"><AdminSegment type="button" $active={filter === 'pending'} aria-pressed={filter === 'pending'} onClick={() => setFilter('pending')}>대기 중 {requests.filter((item) => item.status === '대기 중' || item.status === '검토 중').length}</AdminSegment><AdminSegment type="button" $active={filter === 'done'} aria-pressed={filter === 'done'} onClick={() => setFilter('done')}>처리 완료</AdminSegment></AdminSegmented></CardHeader>
      <TableWrap><ApprovalTable><thead><tr><th>팀</th><th>신청자</th><th>엔진</th><th>이유</th><th>신청일</th><th>상태</th></tr></thead><tbody>{visible.length ? visible.map((item) => <tr key={item.id} aria-selected={item.id === current?.id} onClick={() => { setSelectedId(item.id); setRejectReason(item.rejectReason); }}><td>{item.team}</td><td>{item.applicant}</td><td>{item.engine}</td><td>{item.reason}</td><td>{item.requestedAt}</td><td><AdminStatusText $tone={item.status === '승인 완료' ? 'success' : item.status === '거절' ? 'danger' : item.status === '검토 중' ? 'warning' : 'muted'}>{item.status}</AdminStatusText></td></tr>) : <tr><td colSpan={6}>표시할 신청이 없습니다.</td></tr>}</tbody></ApprovalTable></TableWrap>
      {visible.length > 0 && <div style={{ marginTop: 16 }}><Pagination page={1} pageCount={1} summary={`${visible.length}개 중 1–${visible.length}`} onPageChange={() => undefined} /></div>}
    </Card>
    {current && <>
      <Card>
        <CardHeader style={{ alignItems: 'flex-start' }}><ApprovalCopy><SectionTitle>{current.team} 전용형 승인</SectionTitle><Muted>승인하면 고정 사양의 전용 DB 서버를 만들고 팀장·DevOps에게 접속 정보를 보여 줍니다.</Muted></ApprovalCopy><Button disabled={current.status === '승인 완료' || current.status === '거절'} icon={<Octicon name="check" size={16} />} onClick={approve}>승인</Button></CardHeader>
        <FieldStack>
          <Field as="div">신청 설명<RequestDescription>{current.description}</RequestDescription></Field>
          <Field as="div">사양<DisabledValue aria-disabled="true">vCPU 2 · RAM 4 GB · SSD 20 GB</DisabledValue><Hint style={{ margin: 0 }}>모든 전용형 Database가 같은 사양으로 만들어집니다. {current.team}는 팀 Database 4개 중 {teamDatabaseCount}개를 쓰고 있습니다.</Hint></Field>
        </FieldStack>
        {current.status === '거절' && <Alert style={{ marginTop: 16 }}><Octicon name="info" size={16} />거절 사유: {current.rejectReason}</Alert>}
        {current.status === '승인 완료' && current.databaseGrn && <Alert style={{ marginTop: 16 }}><Octicon name="database" size={16} />생성된 Database: {current.databaseName ?? '전용 Database'} · {current.databaseGrn}</Alert>}
      </Card>
      <Card><CardHeader style={{ alignItems: 'flex-start' }}><ApprovalCopy><SectionTitle>거절</SectionTitle><Muted>거절하면 사유가 팀장에게 전달되고, 팀은 고쳐서 다시 신청할 수 있습니다.</Muted></ApprovalCopy><Button variant="secondary" disabled={current.status === '거절' || current.status === '승인 완료' || !rejectReason.trim()} icon={<Octicon name="x" size={16} />} onClick={reject}>거절</Button></CardHeader><Field>팀장에게 전달할 사유<Textarea placeholder="거절 사유를 입력하세요" value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} /><Hint style={{ margin: 0 }}>거절할 때 반드시 입력해야 합니다.</Hint></Field></Card>
    </>}
    <AdminStats><AdminStat icon="database" label="운영 중인 전용형" value="2개" caption="서비스 몫 안에서 만듭니다" /><AdminStat icon="checklist" label="이번 학기 신청" value="4건" caption={<>승인 <AdminCount>2</AdminCount> · 거절 <AdminCount>1</AdminCount></>} /><AdminStat icon="graph" label="공유형 Database" value="86개" caption="합계 21 GB 사용" /></AdminStats>
    </>}
    <AdminCriteria><strong>승인 기준</strong><p>공유형이 줄 수 없는 것만 승인합니다. 서버 전체 설정·확장 기능 변경, 계정·database를 직접 여러 개 만들기, 다른 학생의 부하와 성능 분리.</p></AdminCriteria>
  </PageStack></WorkflowLayout></DemoOnlyGate>;
}
