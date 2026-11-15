import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import styled from 'styled-components';
import { getDemoQueryAudit, saveDemoQueryAudit } from '../../entities/demo-workflows';
import { getSessionUser } from '../../entities/session';
import { getDemoTeam } from '../../entities/team/demo';
import { isDemoMode, simulateDemoRequest } from '../../shared/demo';
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

type QueryValue = string | number;
type QueryRow = Record<string, QueryValue> & { payload?: string };
type QueryColumn = { source: string; label: string };

const seedRows: QueryRow[] = [
  { id: 1, name: '김지민', email: 'jimin@example.com', created_at: '2026-09-28 10:21' },
  { id: 2, name: '한도윤', email: 'doyun@example.com', created_at: '2026-09-28 11:02' },
  { id: 3, name: '윤채원', email: 'chaewon@example.com', created_at: '2026-09-29 09:40' },
];
const userColumns = ['id', 'name', 'email', 'created_at'];
const initialQuery = 'SELECT id, name, email, created_at\nFROM users\nORDER BY created_at DESC\nLIMIT 20;';

function parseQuery(query: string, sourceRows: QueryRow[]): { columns: QueryColumn[]; rows: QueryRow[]; limit?: number; error?: string } {
  const sql = query.replace(/--[^\n]*/g, '').trim().replace(/;+\s*$/, '');
  const statement = sql.match(/^select\s+([\s\S]+?)\s+from\s+(users|databases)\b([\s\S]*)$/i);
  if (!statement) return { columns: [], rows: [], error: 'users 또는 databases 테이블의 SELECT 쿼리를 입력해 주세요.' };

  const availableColumns = Object.keys(sourceRows[0] ?? {});
  const requestedColumns = statement[1].trim() === '*'
    ? availableColumns.map(source => ({ source, label: source }))
    : statement[1].split(',').map((expression): QueryColumn | null => {
      const match = expression.trim().match(/^([a-z_][\w]*)(?:\s+as\s+([a-z_][\w]*))?$/i);
      return match ? { source: match[1], label: match[2] ?? match[1] } : null;
    });
  if (!requestedColumns.length || requestedColumns.some(column => !column || !availableColumns.includes(column.source))) {
    return { columns: [], rows: [], error: `사용할 수 있는 컬럼: ${availableColumns.join(', ') || '없음'}` };
  }
  const columns = requestedColumns as QueryColumn[];
  let rows = sourceRows;
  const tail = statement[3];
  const whereClause = tail.match(/\bwhere\s+([\s\S]*?)(?=\border\s+by\b|\blimit\b|$)/i)?.[1]?.trim();
  if (whereClause) {
    const where = whereClause.match(/^([a-z_][\w]*)\s*(=|!=|<>|like)\s*(?:'((?:''|[^'])*)'|"((?:""|[^"])*)"|(-?\d+(?:\.\d+)?))$/i);
    if (!where || !availableColumns.includes(where[1])) return { columns: [], rows: [], error: 'WHERE 절은 컬럼과 값의 비교 조건으로 입력해 주세요.' };
    const [, field, operator] = where;
    const value = (where[3] ?? where[4]?.replaceAll('""', '"') ?? where[5] ?? '').replaceAll("''", "'");
    rows = rows.filter(row => {
      const current = row[field];
      if (operator.toLowerCase() === 'like') {
        const needle = value.replaceAll('%', '').toLocaleLowerCase();
        return String(current).toLocaleLowerCase().includes(needle);
      }
      const equal = String(current).toLocaleLowerCase() === value.toLocaleLowerCase();
      return operator === '=' ? equal : !equal;
    });
  }

  const orderClause = tail.match(/\border\s+by\s+([a-z_][\w]*)(?:\s+(asc|desc))?/i);
  if (/\border\s+by\b/i.test(tail) && (!orderClause || !availableColumns.includes(orderClause[1]))) {
    return { columns: [], rows: [], error: `정렬할 컬럼을 확인해 주세요: ${availableColumns.join(', ')}` };
  }
  if (orderClause) {
    const [, field, direction = 'asc'] = orderClause;
    const multiplier = direction.toLowerCase() === 'desc' ? -1 : 1;
    rows = [...rows].sort((left, right) => {
      const a = left[field];
      const b = right[field];
      const comparison = typeof a === 'number' && typeof b === 'number'
        ? a - b
        : String(a).localeCompare(String(b), 'ko-KR', { numeric: true });
      return comparison * multiplier;
    });
  }

  const limitClause = tail.match(/\blimit\s+(\d+)\b/i);
  if (/\blimit\b/i.test(tail) && !limitClause) return { columns: [], rows: [], error: 'LIMIT에는 0 이상의 행 수를 입력해 주세요.' };
  const limit = limitClause ? Number(limitClause[1]) : undefined;
  return { columns, rows: limit === undefined ? rows : rows.slice(0, limit), limit };
}

export default function DatabaseQueryDemoPage() {
  const { databaseId = 'welcome-db' } = useParams<{ databaseId: string }>();
  return <DemoOnlyGate><DatabaseQuery key={databaseId} databaseId={databaseId} /></DemoOnlyGate>;
}

function DatabaseQuery({ databaseId }: { databaseId: string }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState(initialQuery);
  const [rows, setRows] = useState(seedRows);
  const [resultColumns, setResultColumns] = useState(userColumns);
  const [databaseRows, setDatabaseRows] = useState<QueryRow[]>([]);
  const [resultCount, setResultCount] = useState(3);
  const [executing, setExecuting] = useState(false);
  const [outcome, setOutcome] = useState<'timeout' | 'row-cap' | 'byte-cap' | 'write-locked' | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const [error, setError] = useState('');
  const [ran, setRan] = useState(false);
  const [database, setDatabase] = useState<{ name: string; engine: 'mysql' | 'postgresql'; isolation: 'shared' | 'dedicated'; status: string; write_locked: boolean; owner?: { type: 'user' | 'team'; id: string; name: string } } | null>(null);
  const [databaseResolved, setDatabaseResolved] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  useEffect(() => {
    setDatabaseResolved(false);
    setDatabase(null);
    setLoadError(false);
    if (!isDemoMode()) {
      setDatabase(null);
      setDatabaseRows([]);
      setDatabaseResolved(true);
      return;
    }
    let cancelled = false;
    void simulateDemoRequest('database-query').then(() => import('../../entities/database/demo')).then(demo => {
      if (cancelled) return;
      const value = demo.getDemoDatabase(databaseId);
      const ownerId = value?.owner.id;
      setDatabaseRows(demo.getDemoDatabaseState().databases.filter(item => item.owner.id === ownerId).map(item => ({
        id: item.id,
        name: item.name,
        engine: item.engine === 'postgresql' ? 'PostgreSQL' : 'MySQL',
        status: item.status,
        created_at: item.created_at.slice(0, 16).replace('T', ' '),
      })));
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
    return () => {
      cancelled = true;
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [databaseId, retryKey]);
  useEffect(() => () => {
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
  }, []);
  const databaseName = database?.name ?? databaseId;
  const teamScopeId = database?.owner?.type === 'team' ? database.owner.id : undefined;
  const teamRole = teamScopeId ? getDemoTeam(teamScopeId)?.my_role : undefined;
  const teamRoleLabel = teamRole === 'leader' ? '팀장' : teamRole === 'devops' ? 'DevOps' : teamRole === 'member' ? '팀원' : '팀';

  function runQuery() {
    if (!isDemoMode() || !databaseResolved || !database || database.status !== 'active' || database.isolation === 'dedicated' || executing) return;
    setOutcome(null);
    setError('');
    setRan(false);
    const audit = (succeeded: boolean) => saveDemoQueryAudit([...getDemoQueryAudit(), {
      actorId: getSessionUser()?.id ?? 'demo-student',
      executedAt: new Date().toISOString(),
      succeeded,
    }]);
    const statement = query.replace(/--[^\n]*/g, '').trim();
    const growing = /^(insert|update)\b/i.test(statement);
    const shrinking = /^(delete|truncate|drop\s+table)\b/i.test(statement);
    if (database.write_locked && growing) {
      audit(false);
      setRows([]);
      setResultCount(0);
      setOutcome('write-locked');
      setRan(true);
      return;
    }
    if (growing || shrinking) {
      // 목데이터: 쓰기 쿼리는 용량에 반영된다. 늘면 80% 경고·쓰기 금지, 줄면 쓰기 금지 해제가 상세에 나타난다.
      setExecuting(true);
      void import('../../entities/database/demo').then(demo => {
        const updated = demo.applyDemoDatabaseWrite(databaseId, growing ? 'grow' : 'shrink');
        audit(Boolean(updated));
        if (!updated) {
          setError('쿼리를 실행하지 못했습니다. 다시 시도해 주세요.');
        } else {
          setDatabase(current => current ? { ...current, write_locked: updated.write_locked } : current);
        }
        setRows([]);
        setResultColumns([]);
        setResultCount(0);
        setRan(true);
      }).finally(() => setExecuting(false));
      return;
    }
    if (/--\s*demo:timeout\b/i.test(query)) {
      audit(false);
      setExecuting(true);
      timeoutRef.current = window.setTimeout(() => {
        setExecuting(false);
        setOutcome('timeout');
        setRows(seedRows);
        setResultCount(seedRows.length);
        setRan(true);
        timeoutRef.current = null;
      }, 45_000);
      return;
    }
    const rowCapDemo = /--\s*demo:row-cap\b/i.test(query);
    const byteCapDemo = /--\s*demo:byte-cap\b/i.test(query);
    const sourceRows = /\bfrom\s+databases\b/i.test(query) ? databaseRows : seedRows;
    const parsed = parseQuery(query, sourceRows);
    const success = !parsed.error;
    audit(success);
    if (!success) {
      setError(parsed.error ?? '쿼리를 실행하지 못했습니다.');
      setRows([]);
      setResultCount(0);
      setResultColumns([]);
      setRan(true);
      return;
    }
    const specialRows: QueryRow[] = rowCapDemo
      ? Array.from({ length: 1_005 }, (_, index) => ({
        id: index + 1,
        name: `데모 사용자 ${index + 1}`,
        email: `user${index + 1}@example.com`,
        created_at: '2026-09-28 10:21',
      }))
      : byteCapDemo
        ? Array.from({ length: 10 }, (_, index) => ({
          id: index + 1,
          name: `데모 사용자 ${index + 1}`,
          email: `user${index + 1}@example.com`,
          created_at: '2026-09-28 10:21',
          payload: 'x'.repeat(140_000),
        }))
        : parsed.rows;
    const filteredRows = parsed.limit === undefined || rowCapDemo || byteCapDemo
      ? specialRows
      : specialRows.slice(0, parsed.limit);
    const visibleRows: QueryRow[] = [];
    const encoder = new TextEncoder();
    let totalBytes = 0;
    let truncatedByRows = false;
    let truncatedByBytes = false;
    for (const row of filteredRows) {
      if (visibleRows.length >= 1_000) {
        truncatedByRows = true;
        break;
      }
      const rowBytes = encoder.encode(JSON.stringify(row)).byteLength;
      if (totalBytes + rowBytes > 1_048_576) {
        truncatedByBytes = true;
        break;
      }
      visibleRows.push(Object.fromEntries(parsed.columns.map(column => [column.label, row[column.source]])) as QueryRow);
      totalBytes += rowBytes;
    }
    setRows(visibleRows);
    setResultColumns(parsed.columns.map(column => column.label));
    setResultCount(visibleRows.length);
    setOutcome(truncatedByRows ? 'row-cap' : truncatedByBytes ? 'byte-cap' : null);
    setRan(true);
  }


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
      <QueryActions><QueryHint>45초가 지나면 멈추고, 결과는 1,000행 또는 1 MB까지 보입니다.</QueryHint><Button icon={<Octicon name="play" size={16} />} disabled={!databaseResolved || !database || database.status !== 'active' || executing} onClick={runQuery}>실행</Button></QueryActions>
      {databaseResolved && !database && !loadError && <ErrorText role="alert">Database를 찾을 수 없거나 삭제되었습니다. Database 목록에서 사용 가능한 Database를 선택해 주세요.</ErrorText>}
      {database && error && ran && <ErrorText role="alert">{error}</ErrorText>}
    </Card>
    <Card>
      <CardHeader><ResultHeading>결과 · {database ? resultCount : 0}행 · 0.04초</ResultHeading></CardHeader>
      <TableWrap><ResultsTable>{resultColumns.join(',') === userColumns.join(',') && <colgroup>{userColumnWidths.map((width, index) => <col key={index} style={{ width }} />)}</colgroup>}<thead><tr>{resultColumns.map(column => <th key={column}>{column}</th>)}</tr></thead><tbody>{(database ? rows : []).map((row, index) => <tr key={`${String(row.id ?? index)}-${index}`}>{resultColumns.map(column => <td key={column}>{row[column] ?? ''}</td>)}</tr>)}</tbody></ResultsTable></TableWrap>
    </Card>
    </>}
    <FooterNote><FooterTitle>SQL과 결과는 저장하지 않습니다</FooterTitle><span>누가 언제 실행했는지와 성공 여부만 기록합니다. 쓰기 금지·정지 상태도 콘솔에 그대로 적용됩니다.</span></FooterNote>
  </PageStack></WorkflowLayout>;
}
