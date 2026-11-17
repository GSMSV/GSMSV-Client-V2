import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import styled from 'styled-components';
import { getDemoQueryAudit, saveDemoQueryAudit } from '../../entities/demo-workflows';
import { getSessionUser } from '../../entities/session';
import { getDemoTeam } from '../../entities/team/demo';
import { isDemoFixtureMode, isDemoMode, simulateDemoRequest } from '../../shared/demo';
import { Button } from '../../shared/ui/controls';
import { Banner, ErrorCard, LoadingCard } from '../../shared/ui/feedback';
import { Octicon } from '../../shared/ui/icons';
import { DatabaseTab, DatabaseTabs } from './DatabaseTabs';
import { DemoOnlyGate, Breadcrumb, Card, CardHeader, Heading, PageStack, SectionTitle, Subtitle, Table, TableWrap, Title, TitleGroup, WorkflowLayout } from '../demo-workflows/ui/WorkflowLayout';

const EditorFrame = styled.div`
  display: flex;
  gap: 16px;
  padding: 16px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  outline: 1px solid transparent;
  background: ${({ theme }) => theme.colors.sidebar};
  font: ${({ theme }) => theme.typography.code.weight} ${({ theme }) => theme.typography.code.size}px/${({ theme }) => theme.typography.code.lineHeight}px ${({ theme }) => theme.typography.code.family}, monospace;
  &:focus-within { outline-color: ${({ theme }) => theme.colors.primary}; }
`;
const LineNumbers = styled.span`
  flex: 0 0 28px;
  color: ${({ theme }) => theme.colors.faint};
  white-space: pre;
  user-select: none;
`;
const Editor = styled.textarea`
  display: block;
  min-width: 0;
  flex: 1 1 auto;
  padding: 0;
  border: 0;
  outline: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.text};
  font: inherit;
  white-space: pre;
  overflow-x: auto;
  resize: none;
`;
const QueryHint = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;
const PageBreadcrumb = styled(Breadcrumb)`
  margin: 0;
`;
const EditorHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0 0 16px;
  color: ${({ theme }) => theme.colors.primary};
`;
const QueryActions = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-top: 16px;

  @media (max-width: 600px) {
    align-items: flex-start;
    flex-direction: column;

    > button { align-self: flex-end; }
  }
`;
const ResultsTable = styled(Table)`
  min-width: 720px;
`;
const FooterNote = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;
const FooterTitle = styled.span`
  font: ${({ theme }) => theme.typography.button.weight} ${({ theme }) => theme.typography.button.size}px/${({ theme }) => theme.typography.button.lineHeight}px ${({ theme }) => theme.typography.button.family}, sans-serif;
`;
const ResultHeading = styled.div`
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.title.weight} ${({ theme }) => theme.typography.title.size}px/${({ theme }) => theme.typography.title.lineHeight}px ${({ theme }) => theme.typography.title.family}, sans-serif;
`;
// Figma 45 results table column split (id · name · email · created_at).
const userColumnWidths = ['14%', '40%', '18%', '28%'];
const ErrorText = styled.p`
  margin: 16px 0 0;
  color: ${({ theme }) => theme.colors.danger};
  font: 400 14px/22px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

type QueryCell = string | number | null;
interface QueryResultView {
  columns: string[];
  rows: QueryCell[][];
  kind: 'rows' | 'write';
  affectedRows: number;
  /** 실제 실행 시간. 아직 실행하지 않았으면 null. */
  elapsedMs: number | null;
}

// Figma 45 첫 화면(목데이터 모드). 목데이터 Database 파일에도 같은 users 행이 들어 있어 실행하면 실제 결과가 나온다.
const seedRows: QueryCell[][] = [
  [1, '김지민', 'jimin@example.com', '2026-09-28 10:21'],
  [2, '한도윤', 'doyun@example.com', '2026-09-28 11:02'],
  [3, '윤채원', 'chaewon@example.com', '2026-09-29 09:40'],
];
const userColumns = ['id', 'name', 'email', 'created_at'];
const initialQuery = 'SELECT id, name, email, created_at\nFROM users\nORDER BY created_at DESC\nLIMIT 20;';
const emptyResult: QueryResultView = { columns: [], rows: [], kind: 'rows', affectedRows: 0, elapsedMs: null };
const fixtureResult: QueryResultView = { columns: userColumns, rows: seedRows, kind: 'rows', affectedRows: 0, elapsedMs: 40 };
const countFormat = new Intl.NumberFormat('ko-KR');

function formatSeconds(milliseconds: number) {
  return `${new Intl.NumberFormat('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 3 }).format(Math.max(0.001, milliseconds / 1000))}초`;
}

export default function DatabaseQueryDemoPage() {
  const { databaseId = 'welcome-db' } = useParams<{ databaseId: string }>();
  return <DemoOnlyGate><DatabaseQuery key={databaseId} databaseId={databaseId} /></DemoOnlyGate>;
}

function DatabaseQuery({ databaseId }: { databaseId: string }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState(() => isDemoFixtureMode() ? initialQuery : '');
  const [result, setResult] = useState<QueryResultView>(() => isDemoFixtureMode() ? fixtureResult : emptyResult);
  const [executing, setExecuting] = useState(false);
  const [outcome, setOutcome] = useState<'timeout' | 'row-cap' | 'byte-cap' | 'write-locked' | null>(null);
  const [error, setError] = useState('');
  const [ran, setRan] = useState(false);
  const [database, setDatabase] = useState<{ name: string; engine: 'mysql' | 'postgresql'; isolation: 'shared' | 'dedicated'; status: string; write_locked: boolean; owner?: { type: 'user' | 'team'; id: string; name: string } } | null>(null);
  const [databaseResolved, setDatabaseResolved] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);
  useEffect(() => {
    setDatabaseResolved(false);
    setDatabase(null);
    setLoadError(false);
    if (!isDemoMode()) {
      setDatabase(null);
      setDatabaseResolved(true);
      return;
    }
    let cancelled = false;
    void simulateDemoRequest('database-query').then(() => import('../../entities/database/demo')).then(demo => {
      if (cancelled) return;
      const value = demo.getDemoDatabase(databaseId);
      const databaseValue = value
        ? { name: value.name, engine: value.engine, isolation: value.isolation, status: value.status, write_locked: value.write_locked, owner: value.owner }
        : null;
      setDatabase(databaseValue);
      setDatabaseResolved(true);
    }).catch(() => {
      if (cancelled) return;
      setDatabase(null);
      setDatabaseResolved(true);
      setLoadError(true);
    });
    return () => { cancelled = true; };
  }, [databaseId, retryKey]);
  const databaseName = database?.name ?? databaseId;
  const teamScopeId = database?.owner?.type === 'team' ? database.owner.id : undefined;
  const teamRole = teamScopeId ? getDemoTeam(teamScopeId)?.my_role : undefined;
  const teamRoleLabel = teamRole === 'leader' ? '팀장' : teamRole === 'devops' ? 'DevOps' : teamRole === 'member' ? '팀원' : '팀';

  async function runQuery() {
    if (!isDemoMode() || !databaseResolved || !database || database.status !== 'active' || database.isolation === 'dedicated' || executing) return;
    setOutcome(null);
    setError('');
    setRan(false);
    setExecuting(true);
    const audit = (succeeded: boolean) => saveDemoQueryAudit([...getDemoQueryAudit(), {
      actorId: getSessionUser()?.id ?? 'demo-student',
      executedAt: new Date().toISOString(),
      succeeded,
    }]);
    let next: QueryResultView = emptyResult;
    let nextOutcome: typeof outcome = null;
    let nextError = '';
    try {
      // 이 Database 파일을 열어 Web Worker 안의 SQLite로 실제 실행한다.
      const demo = await import('../../entities/database/demo');
      const executed = await demo.runDemoDatabaseQuery(databaseId, query);
      const updated = executed.database;
      if (updated && mountedRef.current) setDatabase(current => current ? { ...current, write_locked: updated.write_locked } : current);
      if (executed.status === 'empty') {
        nextError = '실행할 SQL을 입력해 주세요.';
      } else if (executed.status === 'write-locked') {
        audit(false);
        nextOutcome = 'write-locked';
      } else if (executed.status === 'timeout') {
        audit(false);
        nextOutcome = 'timeout';
      } else if (executed.status === 'error') {
        audit(false);
        nextError = `SQL 오류${executed.statements > 1 ? ` · ${executed.failedStatement}번째 문장` : ''}: ${executed.message}`;
        next = { ...emptyResult, elapsedMs: executed.elapsedMs };
      } else {
        audit(true);
        next = { ...executed.result, elapsedMs: executed.elapsedMs };
        nextOutcome = executed.result.truncated === 'rows' ? 'row-cap' : executed.result.truncated === 'bytes' ? 'byte-cap' : null;
      }
    } catch (failure) {
      audit(false);
      nextError = failure instanceof Error && failure.message ? `쿼리를 실행하지 못했습니다: ${failure.message}` : '쿼리를 실행하지 못했습니다. 다시 시도해 주세요.';
    }
    if (!mountedRef.current) return;
    setResult(next);
    setOutcome(nextOutcome);
    setError(nextError);
    setRan(true);
    setExecuting(false);
  }

  const resultLabel = result.kind === 'write' ? `${countFormat.format(result.affectedRows)}행 변경` : `${countFormat.format(result.rows.length)}행`;

  if (database?.isolation === 'dedicated') return <Navigate to={`/databases/${encodeURIComponent(databaseId)}`} replace />;

  return <WorkflowLayout activeStudentItem="database" scopeLabel={teamScopeId ? `${database?.owner?.name ?? '팀'} · ${teamRoleLabel}` : '내 Resources'} teamScopeId={teamScopeId}><PageStack>
    <PageBreadcrumb>Database</PageBreadcrumb>
    <Heading><TitleGroup><Title>{databaseName}</Title><Subtitle>{database ? `${database.engine === 'postgresql' ? 'PostgreSQL' : 'MySQL'} · 공유형` : databaseResolved ? 'Database를 사용할 수 없습니다' : 'Database 확인 중'}</Subtitle></TitleGroup></Heading>
    <DatabaseTabs aria-label="Database 메뉴">
      <DatabaseTab type="button" onClick={() => navigate(`/databases/${encodeURIComponent(databaseId)}`)}>접속 정보</DatabaseTab>
      <DatabaseTab type="button" $active aria-current="page">쿼리 콘솔</DatabaseTab>
      <DatabaseTab type="button" onClick={() => navigate(`/databases/${encodeURIComponent(databaseId)}/backups`)}>백업</DatabaseTab>
      <DatabaseTab type="button" onClick={() => navigate(`/databases/${encodeURIComponent(databaseId)}/settings`)}>설정</DatabaseTab>
    </DatabaseTabs>
    {database?.status === 'suspended' && <Banner title="Database가 정지되어 쿼리를 실행하지 않았습니다" description="사용 기간을 연장한 뒤 다시 실행해 주세요." tone="danger" icon={<Octicon name="clock" size={20} />} />}
    {outcome === 'write-locked' && <Banner title="쓰기 금지 중이라 실행하지 않았습니다" description="INSERT · UPDATE처럼 크기를 늘리는 쿼리는 막혀 있습니다. 읽기와 DELETE · TRUNCATE · DROP TABLE은 할 수 있습니다." tone="danger" icon={<Octicon name="lock" size={20} />} />}
    {outcome === 'timeout' && <Banner title="쿼리가 45초를 넘어 멈췄습니다" description="조건을 좁히거나 LIMIT을 넣어 다시 실행해 주세요." tone="danger" icon={<Octicon name="alert" size={20} />} />}
    {outcome === 'row-cap' && <Banner title="결과를 1,000행까지만 보여 줍니다" description="전체 결과가 더 많습니다. LIMIT으로 범위를 줄이거나 백업을 내려받아 확인하세요." tone="neutral" icon={<Octicon name="info" size={20} />} />}
    {outcome === 'byte-cap' && <Banner title="결과는 1,000행 또는 1 MB까지 보입니다" description="전체 결과가 더 많습니다. LIMIT으로 범위를 줄이거나 백업을 내려받아 확인하세요." tone="neutral" icon={<Octicon name="info" size={20} />} />}
    {!databaseResolved ? <><LoadingCard height={178} /><LoadingCard height={178} /></> : loadError ? <><ErrorCard onRetry={() => setRetryKey(value => value + 1)} /><ErrorCard onRetry={() => setRetryKey(value => value + 1)} /></> : <>
    <Card>
      <EditorHeader><Octicon name="code" size={16} /><SectionTitle>쿼리</SectionTitle></EditorHeader>
      <EditorFrame>
        <LineNumbers aria-hidden="true">{Array.from({ length: Math.max(4, query.split('\n').length) }, (_, index) => index + 1).join('\n')}</LineNumbers>
        <Editor aria-label="SQL 쿼리" spellCheck={false} wrap="off" rows={Math.max(4, query.split('\n').length)} value={query} onChange={(event) => setQuery(event.target.value)} />
      </EditorFrame>
      <QueryActions><QueryHint>45초가 지나면 멈추고, 결과는 1,000행 또는 1 MB까지 보입니다.</QueryHint><Button icon={<Octicon name="play" size={16} />} disabled={!databaseResolved || !database || database.status !== 'active' || executing} onClick={() => void runQuery()}>실행</Button></QueryActions>
      {databaseResolved && !database && !loadError && <ErrorText role="alert">Database를 찾을 수 없거나 삭제되었습니다. Database 목록에서 사용 가능한 Database를 선택해 주세요.</ErrorText>}
      {database && error && ran && <ErrorText role="alert">{error}</ErrorText>}
    </Card>
    <Card>
      <CardHeader><ResultHeading>결과 · {database ? resultLabel : '0행'}{database && result.elapsedMs !== null && (ran || isDemoFixtureMode()) ? ` · ${formatSeconds(result.elapsedMs)}` : ''}</ResultHeading></CardHeader>
      <TableWrap><ResultsTable>{result.columns.join(',') === userColumns.join(',') && <colgroup>{userColumnWidths.map((width, index) => <col key={index} style={{ width }} />)}</colgroup>}<thead><tr>{(database ? result.columns : []).map((column, index) => <th key={`${column}-${index}`}>{column}</th>)}</tr></thead><tbody>{(database ? result.rows : []).map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell === null ? 'NULL' : cell}</td>)}</tr>)}</tbody></ResultsTable></TableWrap>
    </Card>
    </>}
    <FooterNote><FooterTitle>SQL과 결과는 저장하지 않습니다</FooterTitle><span>누가 언제 실행했는지와 성공 여부만 기록합니다. 쓰기 금지·정지 상태도 콘솔에 그대로 적용됩니다.</span></FooterNote>
  </PageStack></WorkflowLayout>;
}
