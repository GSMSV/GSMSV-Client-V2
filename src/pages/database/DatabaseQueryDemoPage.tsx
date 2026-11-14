import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import styled from 'styled-components';
import { getDemoQueryAudit, saveDemoQueryAudit } from '../../entities/demo-workflows';
import { getSessionUser } from '../../entities/session';
import { Button } from '../../shared/ui/controls';
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

const seedRows = [
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
  const [error, setError] = useState('');
  const [ran, setRan] = useState(false);
  const [database, setDatabase] = useState<{ name: string; engine: 'mysql' | 'postgresql'; isolation: 'shared' | 'dedicated' } | null>(null);
  useEffect(() => {
    let cancelled = false;
    void import('../../entities/database/demo').then(demo => {
      if (cancelled) return;
      const value = demo.getDemoDatabase(databaseId);
      setDatabase(value ? { name: value.name, engine: value.engine, isolation: value.isolation } : null);
    });
    return () => { cancelled = true; };
  }, [databaseId]);
  const databaseName = database?.name ?? databaseId;

  function runQuery() {
    const success = /\bselect\b/i.test(query) && /\bfrom\s+(users|databases)\b/i.test(query);
    saveDemoQueryAudit([...getDemoQueryAudit(), { actorId: getSessionUser()?.id ?? 'demo-student', executedAt: new Date().toISOString(), succeeded: success }]);
    if (!success) {
      setError('users 또는 databases 테이블의 SELECT 쿼리를 입력해 주세요.');
      setRows([]);
      setResultCount(0);
      setRan(true);
      return;
    }
    const filteredRows = /doyun/i.test(query) ? seedRows.filter((row) => row.name === '한도윤') : /jimin/i.test(query) ? seedRows.filter((row) => row.name === '김지민') : seedRows;
    setRows(filteredRows);
    setResultCount(filteredRows.length);
    setError('');
    setRan(true);
  }

  return <DemoOnlyGate><WorkflowLayout activeStudentItem="database"><PageStack>
    <Breadcrumb>Database</Breadcrumb>
    <Heading><TitleGroup><Title>{databaseName}</Title><Subtitle>{database?.engine === 'postgresql' ? 'PostgreSQL' : 'MySQL'} · {database?.isolation === 'dedicated' ? '전용형' : '공유형'}</Subtitle></TitleGroup></Heading>
    <nav aria-label="Database 메뉴" style={{ display: 'flex', gap: 8 }}>
      <Button variant="ghost" onClick={() => navigate(`/databases/${databaseId}`)}>접속 정보</Button>
      <Button variant="primary">쿼리 콘솔</Button>
      <Button variant="ghost" onClick={() => navigate(`/databases/${databaseId}/backups`)}>백업</Button>
      <Button variant="ghost" onClick={() => navigate(`/databases/${databaseId}/settings`)}>설정</Button>
    </nav>
    <Card>
      <EditorHeader><Octicon name="code" size={16} /><SectionTitle>쿼리</SectionTitle></EditorHeader>
      <Editor aria-label="SQL 쿼리" spellCheck={false} value={query} onChange={(event) => setQuery(event.target.value)} />
      <QueryActions><Muted>45초가 지나면 멈추고, 결과는 1,000행 또는 1 MB까지 보입니다.</Muted><Button icon={<Octicon name="play" size={16} />} onClick={runQuery}>실행</Button></QueryActions>
      {error && ran && <ErrorText role="alert">{error}</ErrorText>}
    </Card>
    <Card>
      <CardHeader><ResultHeading>결과 · {resultCount}행 · 0.04초</ResultHeading></CardHeader>
      <TableWrap><Table><thead><tr><th>id</th><th>name</th><th>email</th><th>created_at</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td>{row.id}</td><td>{row.name}</td><td>{row.email}</td><td>{row.created_at}</td></tr>)}</tbody></Table></TableWrap>
    </Card>
    <FooterNote><span>SQL과 결과는 저장하지 않습니다</span><span>누가 언제 실행했는지와 성공 여부만 기록합니다. 쓰기 금지·정지 상태도 콘솔에 그대로 적용됩니다.</span></FooterNote>
  </PageStack></WorkflowLayout></DemoOnlyGate>;
}
