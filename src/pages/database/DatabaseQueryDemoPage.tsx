import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import styled from 'styled-components';
import { getDemoQueryAudit, saveDemoQueryAudit } from '../../entities/demo-workflows';
import { getSessionUser } from '../../entities/session';
import { isDemoMode } from '../../shared/demo';
import { Button } from '../../shared/ui/controls';
import { Banner } from '../../shared/ui/feedback';
import { Octicon } from '../../shared/ui/icons';
import { DemoOnlyGate, Breadcrumb, Card, CardHeader, Heading, Muted, PageStack, SectionTitle, Subtitle, Table, TableWrap, Title, TitleGroup, WorkflowLayout } from '../demo-workflows/ui/WorkflowLayout';

const Editor = styled.textarea`
  display: block;
  width: 100%;
  min-height: 120px;
  padding: 16px;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.base}px;
  outline: 1px solid transparent;
  background: #211f24;
  color: ${({ theme }) => theme.colors.text};
  font: 400 13px/22px 'DM Mono', monospace;
  resize: vertical;
  &:focus { outline-color: ${({ theme }) => theme.colors.primary}; }
`;
const EditorHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0 0 24px;
  color: ${({ theme }) => theme.colors.primary};
`;
const QueryActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 16px;
`;
const FooterNote = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: ${({ theme }) => theme.colors.faint};
  font: 400 12px/18px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;
const ResultHeading = styled.div`
  margin-bottom: 16px;
  color: ${({ theme }) => theme.colors.text};
  font: 500 20px/28px ${({ theme }) => theme.typography.title.family}, sans-serif;
`;
const ErrorText = styled.p`
  margin: 16px 0 0;
  color: ${({ theme }) => theme.colors.danger};
  font: 400 14px/22px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

type QueryRow = { id: number; name: string; email: string; created_at: string; payload?: string };

const seedRows: QueryRow[] = [
  { id: 1, name: '김지민', email: 'jimin@example.com', created_at: '2026-09-28 10:21' },
  { id: 2, name: '한도윤', email: 'doyun@example.com', created_at: '2026-09-28 11:02' },
  { id: 3, name: '윤채원', email: 'chaewon@example.com', created_at: '2026-09-29 09:40' },
];
const initialQuery = 'SELECT id, name, email, created_at\nFROM users\nORDER BY created_at DESC\nLIMIT 20;';

export default function DatabaseQueryDemoPage() {
  const navigate = useNavigate();
  const { databaseId = 'welcome-db' } = useParams<{ databaseId: string }>();
  const [query, setQuery] = useState(initialQuery);
  const [rows, setRows] = useState(seedRows);
  const [resultCount, setResultCount] = useState(3);
  const [executing, setExecuting] = useState(false);
  const [outcome, setOutcome] = useState<'timeout' | 'row-cap' | 'byte-cap' | 'write-locked' | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const [error, setError] = useState('');
  const [ran, setRan] = useState(false);
  const [database, setDatabase] = useState<{ name: string; engine: 'mysql' | 'postgresql'; isolation: 'shared' | 'dedicated'; status: string; write_locked: boolean } | null>(null);
  const [databaseResolved, setDatabaseResolved] = useState(false);
  useEffect(() => {
    setDatabaseResolved(false);
    setDatabase(null);
    if (!(import.meta.env.DEV && isDemoMode())) {
      setDatabase(null);
      setDatabaseResolved(true);
      return;
    }
    let cancelled = false;
    void import('../../entities/database/demo').then(demo => {
      if (cancelled) return;
      const value = demo.getDemoDatabase(databaseId);
      const databaseValue = value
        ? { name: value.name, engine: value.engine, isolation: value.isolation, status: value.status, write_locked: value.write_locked }
        : databaseId === 'welcome-db'
          ? { name: 'welcome-db', engine: 'mysql' as const, isolation: 'shared' as const, status: 'active', write_locked: false }
          : null;
      setDatabase(databaseValue);
      setDatabaseResolved(true);
    });
    return () => {
      cancelled = true;
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [databaseId]);
  useEffect(() => () => {
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
  }, []);
  const databaseName = database?.name ?? databaseId;

  function runQuery() {
    if (!databaseResolved || !database || database.status !== 'active' || executing) return;
    setOutcome(null);
    setError('');
    setRan(false);
    const audit = (succeeded: boolean) => saveDemoQueryAudit([...getDemoQueryAudit(), {
      actorId: getSessionUser()?.id ?? 'demo-student',
      executedAt: new Date().toISOString(),
      succeeded,
    }]);
    if (database.write_locked && /\b(insert|update)\b/i.test(query)) {
      audit(false);
      setRows([]);
      setResultCount(0);
      setOutcome('write-locked');
      setRan(true);
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
    const success = /\bselect\b/i.test(query) && /\bfrom\s+(users|databases)\b/i.test(query);
    audit(success);
    if (!success) {
      setError('users 또는 databases 테이블의 SELECT 쿼리를 입력해 주세요.');
      setRows([]);
      setResultCount(0);
      setRan(true);
      return;
    }
    const rowCapDemo = /--\s*demo:row-cap\b/i.test(query);
    const byteCapDemo = /--\s*demo:byte-cap\b/i.test(query);
    const filteredRows: QueryRow[] = rowCapDemo
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
        : /doyun/i.test(query) ? seedRows.filter((row) => row.name === '한도윤') : /jimin/i.test(query) ? seedRows.filter((row) => row.name === '김지민') : seedRows;
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
      visibleRows.push(row);
      totalBytes += rowBytes;
    }
    setRows(visibleRows);
    setResultCount(visibleRows.length);
    setOutcome(truncatedByRows ? 'row-cap' : truncatedByBytes ? 'byte-cap' : null);
    setRan(true);
  }


  return <DemoOnlyGate><WorkflowLayout activeStudentItem="database"><PageStack>
    <Breadcrumb>Database</Breadcrumb>
    <Heading><TitleGroup><Title>{databaseName}</Title><Subtitle>{database ? `${database.engine === 'postgresql' ? 'PostgreSQL' : 'MySQL'} · ${database.isolation === 'dedicated' ? '전용형' : '공유형'}` : databaseResolved ? 'Database를 사용할 수 없습니다' : 'Database 확인 중'}</Subtitle></TitleGroup></Heading>
    <nav aria-label="Database 메뉴" style={{ display: 'flex', gap: 8 }}>
      <Button variant="ghost" onClick={() => navigate(`/databases/${databaseId}`)}>접속 정보</Button>
      <Button variant="primary">쿼리 콘솔</Button>
      <Button variant="ghost" onClick={() => navigate(`/databases/${databaseId}/backups`)}>백업</Button>
      <Button variant="ghost" onClick={() => navigate(`/databases/${databaseId}/settings`)}>설정</Button>
    </nav>
    {database?.status === 'suspended' && <Banner title="Database가 정지되어 쿼리를 실행하지 않았습니다" description="사용 기간을 연장한 뒤 다시 실행해 주세요." tone="danger" icon={<Octicon name="clock" size={20} />} />}
    {database?.write_locked && outcome === 'write-locked' && <Banner title="쓰기 금지 중이라 실행하지 않았습니다" description="INSERT · UPDATE처럼 크기를 늘리는 쿼리는 막혀 있습니다. 읽기와 DELETE · TRUNCATE · DROP TABLE은 할 수 있습니다." tone="danger" icon={<Octicon name="lock" size={20} />} />}
    {outcome === 'timeout' && <Banner title="쿼리가 45초를 넘어 멈췄습니다" description="조건을 좁히거나 LIMIT을 넣어 다시 실행해 주세요." tone="danger" icon={<Octicon name="alert" size={20} />} />}
    {(outcome === 'row-cap' || outcome === 'byte-cap') && <Banner title="결과를 1,000행까지만 보여 줍니다" description="전체 결과가 더 많습니다. LIMIT으로 범위를 줄이거나 백업을 내려받아 확인하세요." tone="neutral" icon={<Octicon name="info" size={20} />} />}
    <Card>
      <EditorHeader><Octicon name="code" size={16} /><SectionTitle>쿼리</SectionTitle></EditorHeader>
      <Editor aria-label="SQL 쿼리" spellCheck={false} value={query} onChange={(event) => setQuery(event.target.value)} />
      <QueryActions><Muted>45초가 지나면 멈추고, 결과는 1,000행 또는 1 MB까지 보입니다.</Muted><Button icon={<Octicon name="play" size={16} />} disabled={!databaseResolved || !database || database.status !== 'active' || executing} onClick={runQuery}>실행</Button></QueryActions>
      {databaseResolved && !database && <ErrorText role="alert">Database를 찾을 수 없거나 삭제되었습니다. Database 목록에서 사용 가능한 Database를 선택해 주세요.</ErrorText>}
      {database && error && ran && <ErrorText role="alert">{error}</ErrorText>}
    </Card>
    <Card>
      <CardHeader><ResultHeading>결과 · {database ? resultCount : 0}행 · 0.04초</ResultHeading></CardHeader>
      <TableWrap><Table><thead><tr><th>id</th><th>name</th><th>email</th><th>created_at</th></tr></thead><tbody>{(database ? rows : []).map((row) => <tr key={row.id}><td>{row.id}</td><td>{row.name}</td><td>{row.email}</td><td>{row.created_at}</td></tr>)}</tbody></Table></TableWrap>
    </Card>
    <FooterNote><span>SQL과 결과는 저장하지 않습니다</span><span>누가 언제 실행했는지와 성공 여부만 기록합니다. 쓰기 금지·정지 상태도 콘솔에 그대로 적용됩니다.</span></FooterNote>
  </PageStack></WorkflowLayout></DemoOnlyGate>;
}
