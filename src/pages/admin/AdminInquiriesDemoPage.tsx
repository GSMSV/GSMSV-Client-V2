import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import styled from 'styled-components';
import { getDemoInquiries, saveDemoInquiries, type Inquiry } from '../../entities/demo-workflows';
import { getDemoInfraSnapshot } from '../../entities/infra-node/demo';
import { addDemoNotification } from '../../entities/notification';
import { Button } from '../../shared/ui/controls';
import { DemoPagePlaceholder, useDemoPageLoad } from '../demo-workflows/ui/DemoPageState';
import { ModalSurface } from '../../shared/ui/feedback';
import { Octicon } from '../../shared/ui/icons';
import { Alert, Badge, Card, CardHeader, Field, Heading, Hint, Muted, PageStack, SectionTitle, Table, TableWrap, Textarea, Title, TitleGroup, WorkflowLayout, DemoOnlyGate } from '../demo-workflows/ui/WorkflowLayout';

const OverwritePanel = styled.div`
  box-sizing: border-box;
  display: flex;
  width: min(480px, calc(100vw - 32px));
  flex-direction: column;
  gap: 16px;
  padding: 24px;
`;
const OverwriteTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.h2.weight} ${({ theme }) => theme.typography.h2.size}px/${({ theme }) => theme.typography.h2.lineHeight}px ${({ theme }) => theme.typography.h2.family}, sans-serif;
`;
const OverwriteTitleRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;

  > span { flex: 0 0 auto; color: ${({ theme }) => theme.colors.warning}; }
`;
const OverwriteCopy = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font: 400 14px/22px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;
const OverwriteFieldLabel = styled.label`
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: ${({ theme }) => theme.colors.muted};
  font: 500 12px/18px ${({ theme }) => theme.typography.label.family}, sans-serif;
`;
const ExistingQuestion = styled.div`
  min-width: 0;
  padding: 12px 16px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.field};
  color: ${({ theme }) => theme.colors.faint};
  font: 400 14px/22px ${({ theme }) => theme.typography.body.family}, sans-serif;
  overflow-wrap: anywhere;
`;
const OverwriteActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
`;

const FilterBar = styled.div`
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 16px;

  @media (max-width: 720px) { align-items: stretch; flex-direction: column; }
`;
const FilterButtons = styled.div`
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  gap: 8px;
`;
const InquiryTable = styled(Table)`
  min-width: 680px;
  td { overflow-wrap: anywhere; }
`;
const PaginationFooter = styled.div`
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 16px;

  > nav { display: flex; align-items: center; gap: 4px; }

  @media (max-width: 560px) {
    align-items: flex-start;
    flex-direction: column;

    > nav { max-width: 100%; overflow-x: auto; }
  }
`;
const InquiryDetailHeader = styled(CardHeader)`
  align-items: flex-start;

  > h2 { min-width: 0; overflow-wrap: anywhere; }

  @media (max-width: 600px) {
    flex-direction: column;
    align-items: stretch;
    > button { width: 100%; }
  }
`;
const InquiryDetailGrid = styled.div`
  display: grid;
  min-width: 0;
  grid-template-columns: minmax(0, 1fr) auto;
  row-gap: 16px;

  @media (max-width: 600px) { grid-template-columns: minmax(0, 1fr); }

  > div { min-width: 0; }
  > div[style*="grid-column"] { overflow-wrap: anywhere; }
`;
const ReplyActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;

  @media (max-width: 420px) {
    > button { flex: 1 1 140px; }
  }
`;

type InquiryFilter = '전체' | '대기 중' | '답변 완료';

export default function AdminInquiriesDemoPage() {
  const navigate = useNavigate();
  const pageLoad = useDemoPageLoad('admin-inquiries');
  const [items, setItems] = useState(() => getDemoInquiries());
  const [selectedId, setSelectedId] = useState(() => getDemoInquiries().find((item) => item.id === 'inquiry-1')?.id ?? '');
  const [filter, setFilter] = useState<InquiryFilter>('전체');
  const [page, setPage] = useState(1);
  const [reply, setReply] = useState(() => getDemoInquiries().find((item) => item.id === 'inquiry-1')?.reply ?? '');
  const [notice, setNotice] = useState('');
  const [showOverwrite, setShowOverwrite] = useState(false);
  const selected = items.find((item) => item.id === selectedId) ?? items[0];
  const vmName = selected?.vmName.split(' · ')[0];
  const relatedVm = vmName ? getDemoInfraSnapshot().resources.find(item => item.name === vmName) : undefined;
  const visible = useMemo(() => items.filter((item) => filter === '전체' || item.status === filter), [items, filter]);
  const pageSize = 4;
  const pageCount = Math.max(1, Math.ceil(visible.length / pageSize));
  const pageItems = visible.slice((page - 1) * pageSize, page * pageSize);

  function select(item: Inquiry) { setSelectedId(item.id); setReply(item.reply); setNotice(''); setShowOverwrite(false); }
  function submitReply(confirmOverwrite = false) {
    if (!selected) return;
    if (!reply.trim()) { setNotice('답변 내용을 입력해 주세요.'); return; }
    const latestItems = getDemoInquiries();
    const current = latestItems.find(item => item.id === selected.id);
    if (!current) {
      setItems(latestItems);
      setShowOverwrite(false);
      setNotice('문의가 삭제되어 답변을 저장하지 못했습니다.');
      return;
    }
    if (current.status === '답변 완료' && !confirmOverwrite) {
      setItems(latestItems);
      setShowOverwrite(true);
      return;
    }
    const now = new Date();
    const repliedAt = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const updated = latestItems.map((item) => item.id === current.id ? {
      ...item,
      replyHistory: current.status === '답변 완료' && current.reply.trim()
        ? [...(item.replyHistory ?? []), current.reply]
        : item.replyHistory,
      reply: reply.trim(),
      repliedAt,
      status: '답변 완료' as const,
    } : item);
    if (!saveDemoInquiries(updated)) { setNotice('답변을 저장하지 못했습니다. 다시 시도해 주세요.'); return; }
    setItems(updated);
    setShowOverwrite(false);
    if (filter === '대기 중') {
      setFilter('답변 완료');
      const answeredIndex = updated.filter(item => item.status === '답변 완료').findIndex(item => item.id === current.id);
      setPage(Math.floor(answeredIndex / pageSize) + 1);
    }
    const notified = current.isMine && addDemoNotification({
      kind: 'inquiry-replied',
      category: '문의',
      group: 'Support',
      title: '문의에 답변이 등록됐습니다',
      body: current.title,
      resource: null,
    });
    setNotice(current.isMine && !notified
      ? '답변을 등록했습니다. 로컬 알림은 저장하지 못했습니다.'
      : '답변을 등록했습니다. 로컬 미리보기에서 답변 완료 상태로 표시됩니다.');
  }
  function cancelReply() { setReply(selected?.reply ?? ''); setShowOverwrite(false); setNotice('답변 수정을 취소했습니다.'); }

  return <DemoOnlyGate admin><WorkflowLayout admin activeAdminItem="문의 답변"><PageStack>
    <p style={{ margin: 0, color: '#a8a2af', fontSize: 12 }}>관리자 / 문의 답변</p>
    <Heading><TitleGroup><Title>문의 답변</Title><Muted>대기 중인 문의부터 확인하고 답변을 등록하세요.</Muted></TitleGroup></Heading>
    {notice && <Alert $tone={notice.includes('입력') || notice.includes('저장하지 못') ? 'warning' : 'success'} role="status"><Octicon name="info" size={16} />{notice}</Alert>}
    <FilterBar><FilterButtons>{(['전체', '대기 중', '답변 완료'] as const).map((item) => <Button key={item} variant={filter === item ? 'primary' : 'ghost'} onClick={() => { setFilter(item); setPage(1); }}>{item} <Badge $tone="success">{item === '전체' ? items.length : items.filter((entry) => entry.status === item).length}</Badge></Button>)}</FilterButtons><Button variant="secondary" icon={<Octicon name="sync" size={16} />} onClick={() => { if (pageLoad.status !== 'ready') { pageLoad.retry(); return; } setItems(getDemoInquiries()); setNotice('문의 목록을 새로고침했습니다.'); }}>새로고침</Button></FilterBar>
    {pageLoad.status !== 'ready' ? <DemoPagePlaceholder status={pageLoad.status} onRetry={pageLoad.retry} rows={[392, 330, 296]} label="문의를 불러오는 중" /> : <>
    <Card><CardHeader><SectionTitle>최근 문의 · 대기 중 우선</SectionTitle></CardHeader><TableWrap><InquiryTable><thead><tr><th>문의</th><th>작성자</th><th>작성일</th><th>상태</th></tr></thead><tbody>{pageItems.length ? pageItems.map((item) => <tr key={item.id} aria-selected={item.id === selected?.id} onClick={() => select(item)}><td>{item.title}</td><td>{item.author} · {item.studentId}</td><td>{item.createdAt}</td><td><Badge $tone={item.status === '답변 완료' ? 'success' : 'warning'}>{item.status}</Badge></td></tr>) : <tr><td colSpan={4}><Hint>{items.length === 0 ? '아직 등록된 문의가 없습니다.' : '이 조건에 맞는 문의가 없습니다.'}</Hint></td></tr>}</tbody></InquiryTable></TableWrap><PaginationFooter><Hint>{items.length}개 중 {visible.length ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, visible.length)}</Hint><nav aria-label="문의 목록 페이지"><Button variant="ghost" disabled={page <= 1} aria-label="이전 페이지" icon={<Octicon name="arrow-left" size={16} />} onClick={() => setPage((value) => Math.max(1, value - 1))} />{Array.from({ length: pageCount }, (_, index) => index + 1).map((value) => <Button key={value} variant={page === value ? 'primary' : 'ghost'} onClick={() => setPage(value)}>{value}</Button>)}<Button variant="ghost" disabled={page >= pageCount} aria-label="다음 페이지" icon={<Octicon name="arrow-right" size={16} />} onClick={() => setPage((value) => Math.min(pageCount, value + 1))} /></nav></PaginationFooter></Card>
    {selected && <>
      <Card><InquiryDetailHeader><SectionTitle>{selected.title}</SectionTitle>{relatedVm && <Button variant="ghost" icon={<Octicon name="arrow-right" size={16} />} onClick={() => navigate(`/admin/vms/${encodeURIComponent(relatedVm.grn)}`)}>VM 보기</Button>}</InquiryDetailHeader>
        <InquiryDetailGrid><div><Hint>작성자</Hint><Muted>{selected.author} · {selected.studentId}</Muted></div><div><Hint>관련 VM</Hint><Muted>{selected.vmName || '선택 안 함'}</Muted></div><div style={{ gridColumn: '1 / -1' }}><Hint>문의 내용</Hint><Muted>{selected.content}</Muted></div>{selected.reply && <div style={{ gridColumn: '1 / -1' }}><Hint>현재 답변</Hint><Muted>{selected.reply} · {selected.repliedAt ?? selected.createdAt}</Muted></div>}{Boolean(selected.replyHistory?.length) && <div style={{ gridColumn: '1 / -1' }}><Hint>이전 답변 · 관리자 전용</Hint><Muted>{selected.replyHistory?.join('\n')}</Muted></div>}</InquiryDetailGrid>
      </Card>
      <Card><CardHeader><div><SectionTitle>{selected.status === '답변 완료' ? '답변 수정' : '답변 작성'}</SectionTitle><Hint>{selected.status === '답변 완료' ? '안내를 보완할 수 있습니다. 등록하면 질문자에게 답변 알림을 보냅니다.' : '아직 답변하지 않은 문의입니다. 등록하면 질문자에게 답변 알림을 보냅니다.'}</Hint></div></CardHeader><Field>관리자 답변<Textarea value={reply} onChange={(event) => setReply(event.target.value)} placeholder="답변을 입력하세요" /></Field><Hint>{selected.status === '답변 완료' ? '기존 답변을 대체할 내용을 확인해 주세요.' : '등록한 답변은 나중에 수정할 수 있습니다.'}</Hint><ReplyActionRow><Button variant="secondary" onClick={cancelReply}>취소</Button><Button onClick={() => submitReply()} icon={<Octicon name="check" size={16} />}>{selected.status === '답변 완료' ? '새 답변으로 등록' : '답변 등록'}</Button></ReplyActionRow></Card>
    </>}
    </>}
    {showOverwrite && selected?.status === '답변 완료' && <ModalSurface labelledBy="inquiry-overwrite-title" onDismiss={() => setShowOverwrite(false)}>
      <OverwritePanel aria-labelledby="inquiry-overwrite-title" aria-describedby="inquiry-overwrite-copy">
        <OverwriteTitleRow><span aria-hidden="true"><Octicon name="pencil" size={20} /></span><OverwriteTitle id="inquiry-overwrite-title">기존 답변을 덮어쓰시겠습니까?</OverwriteTitle></OverwriteTitleRow>
        <OverwriteCopy id="inquiry-overwrite-copy">이미 답변한 문의입니다. 새 답변을 등록하면 현재 답변이 바뀝니다. 내용을 확인한 뒤 등록하세요.</OverwriteCopy>
        <Hint>· 이전 답변은 관리자만 볼 수 있게 보관됩니다.</Hint>
        <OverwriteFieldLabel>문의<ExistingQuestion>{selected.title}</ExistingQuestion></OverwriteFieldLabel>
        <OverwriteFieldLabel>새 답변<Textarea value={reply} onChange={(event) => setReply(event.target.value)} /></OverwriteFieldLabel>
        <OverwriteActions>
          <Button variant="secondary" icon={<Octicon name="arrow-left" size={16} />} onClick={() => setShowOverwrite(false)}>돌아가기</Button>
          <Button onClick={() => submitReply(true)} icon={<Octicon name="check" size={16} />}>답변 덮어쓰기</Button>
        </OverwriteActions>
      </OverwritePanel>
    </ModalSurface>}
  </PageStack></WorkflowLayout></DemoOnlyGate>;
}
