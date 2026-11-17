import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import styled from 'styled-components';
import { getDemoInquiries, saveDemoInquiries, type Inquiry } from '../../entities/demo-workflows';
import { getDemoInfraSnapshot } from '../../entities/infra-node/demo';
import { addDemoNotification } from '../../entities/notification';
import { Button } from '../../shared/ui/controls';
import { DemoPagePlaceholder, useDemoPageLoad } from '../demo-workflows/ui/DemoPageState';
import { Banner, ModalSurface } from '../../shared/ui/feedback';
import { Pagination } from '../../shared/ui/data-display/Pagination';
import { AdminCount, AdminStatusText, AdminTab, AdminTabs, AdminTabsRow } from './adminDemoUi';
import { Octicon } from '../../shared/ui/icons';
import { Alert, Card, CardHeader, Field, Heading, Hint, Muted, PageStack, SectionTitle, Table, TableWrap, Textarea, Title, TitleGroup, WorkflowLayout, DemoOnlyGate } from '../demo-workflows/ui/WorkflowLayout';

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

const InquiryTable = styled(Table)`
  min-width: 680px;
  td { overflow-wrap: anywhere; }
`;
const PaginationFooter = styled.div`
  margin-top: 16px;
`;
const InquiryDetailHeader = styled(CardHeader)`
  > h2 { min-width: 0; overflow-wrap: anywhere; }
`;
// Figma 29 문의 상세: 작성자·관련 VM은 아이콘이 붙은 줄, 관련 VM 줄 오른쪽에 VM 보기.
const InquiryDetailList = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 16px;
`;
const InquiryMetaRow = styled.div`
  display: grid;
  min-width: 0;
  grid-template-columns: 16px minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px 12px;
  color: ${({ theme }) => theme.colors.muted};

  @media (max-width: 480px) {
    grid-template-columns: 16px minmax(0, 1fr);
    > button { grid-column: 2; justify-self: start; }
  }
`;
const InquiryBlock = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
  overflow-wrap: anywhere;
`;
const InquiryLabel = styled.span`
  color: ${({ theme }) => theme.colors.faint};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;
const InquiryValue = styled.span`
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
  white-space: pre-line;
`;
const ReplyHeading = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 16px;
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
      : '답변을 등록했습니다. 답변 완료 상태로 표시됩니다.');
  }
  function cancelReply() { setReply(selected?.reply ?? ''); setShowOverwrite(false); setNotice('답변 수정을 취소했습니다.'); }

  return <DemoOnlyGate admin><WorkflowLayout admin activeAdminItem="문의 답변"><PageStack>
    <Hint style={{ margin: 0 }}>관리자 / 문의 답변</Hint>
    <Heading><TitleGroup><Title>문의 답변</Title><Muted>대기 중인 문의부터 확인하고 답변을 등록하세요.</Muted></TitleGroup></Heading>
    {notice && <Alert $tone={notice.includes('입력') || notice.includes('저장하지 못') ? 'warning' : 'success'} role="status"><Octicon name="info" size={16} />{notice}</Alert>}
    <AdminTabsRow><AdminTabs aria-label="문의 상태">{(['전체', '대기 중', '답변 완료'] as const).map((item) => <AdminTab key={item} type="button" $active={filter === item} aria-current={filter === item ? 'page' : undefined} onClick={() => { setFilter(item); setPage(1); }}>{item === '대기 중' ? '대기중' : item} <AdminCount>{item === '전체' ? items.length : items.filter((entry) => entry.status === item).length}</AdminCount></AdminTab>)}</AdminTabs><Button variant="secondary" icon={<Octicon name="sync" size={16} />} onClick={() => { if (pageLoad.status !== 'ready') { pageLoad.retry(); return; } setItems(getDemoInquiries()); setNotice('문의 목록을 새로고침했습니다.'); }}>새로고침</Button></AdminTabsRow>
    {pageLoad.status !== 'ready' ? <DemoPagePlaceholder status={pageLoad.status} onRetry={pageLoad.retry} rows={[392, 330, 296]} label="문의를 불러오는 중" /> : <>
    <Card><CardHeader><SectionTitle>최근 문의 · 대기 중 우선</SectionTitle></CardHeader><TableWrap><InquiryTable><thead><tr><th>문의</th><th>작성자</th><th>작성일</th><th>상태</th></tr></thead><tbody>{pageItems.length ? pageItems.map((item) => <tr key={item.id} aria-selected={item.id === selected?.id} onClick={() => select(item)}><td style={{ color: 'inherit' }}>{item.title}</td><td>{item.author} · {item.studentId}</td><td>{item.createdAt}</td><td><AdminStatusText $tone={item.status === '답변 완료' ? 'success' : 'warning'}>{item.status}</AdminStatusText></td></tr>) : <tr><td colSpan={4}><Hint>{items.length === 0 ? '아직 등록된 문의가 없습니다.' : '이 조건에 맞는 문의가 없습니다.'}</Hint></td></tr>}</tbody></InquiryTable></TableWrap><PaginationFooter><Pagination page={page} pageCount={pageCount} summary={`${items.length}개 중 ${visible.length ? (page - 1) * pageSize + 1 : 0}–${Math.min(page * pageSize, visible.length)}`} onPageChange={setPage} /></PaginationFooter></Card>
    {selected && <>
      <Card><InquiryDetailHeader><SectionTitle>{selected.title}</SectionTitle></InquiryDetailHeader>
        <InquiryDetailList>
          <InquiryMetaRow><Octicon name="person" size={16} /><InquiryBlock><InquiryLabel>작성자</InquiryLabel><InquiryValue>{selected.author} · {selected.studentId}</InquiryValue></InquiryBlock></InquiryMetaRow>
          <InquiryMetaRow><Octicon name="server" size={16} /><InquiryBlock><InquiryLabel>관련 VM</InquiryLabel><InquiryValue>{selected.vmName || '선택 안 함'}</InquiryValue></InquiryBlock>{relatedVm && <Button variant="ghost" icon={<Octicon name="arrow-right" size={16} />} onClick={() => navigate(`/admin/vms/${encodeURIComponent(relatedVm.grn)}`)}>VM 보기</Button>}</InquiryMetaRow>
          <InquiryBlock><InquiryLabel>문의 내용</InquiryLabel><InquiryValue>{selected.content}</InquiryValue></InquiryBlock>
          {selected.reply && <InquiryBlock><InquiryLabel>현재 답변</InquiryLabel><InquiryValue>{selected.reply} · {selected.repliedAt ?? selected.createdAt}</InquiryValue></InquiryBlock>}
          {Boolean(selected.replyHistory?.length) && <InquiryBlock><InquiryLabel>이전 답변 · 관리자 전용</InquiryLabel><InquiryValue>{selected.replyHistory?.join('\n')}</InquiryValue></InquiryBlock>}
        </InquiryDetailList>
      </Card>
      <Card><CardHeader><ReplyHeading><SectionTitle>{selected.status === '답변 완료' ? '답변 수정' : '답변 작성'}</SectionTitle><Muted>{selected.status === '답변 완료' ? '안내를 보완할 수 있습니다. 등록하면 질문자에게 답변 알림을 보냅니다.' : '아직 답변하지 않은 문의입니다. 등록하면 질문자에게 답변 알림을 보냅니다.'}</Muted></ReplyHeading></CardHeader><Field>관리자 답변<Textarea value={reply} onChange={(event) => setReply(event.target.value)} placeholder="답변을 입력하세요" /></Field><Hint>{selected.status === '답변 완료' ? '기존 답변을 대체할 내용을 확인해 주세요.' : '등록한 답변은 나중에 수정할 수 있습니다.'}</Hint>{selected.status !== '답변 완료' && <ReplyActionRow><Button variant="secondary" onClick={cancelReply}>취소</Button><Button onClick={() => submitReply()} icon={<Octicon name="check" size={16} />}>답변 등록</Button></ReplyActionRow>}</Card>
      {/* Figma 29: 답변한 문의는 카드 아래 경고 배너에서 취소·새 답변으로 등록을 고른다. */}
      {selected.status === '답변 완료' && <Banner tone="warning" icon={<Octicon name="alert" size={20} />} title="기존 답변을 바꾸시겠습니까?" description="이미 답변한 문의입니다. 새 답변을 등록하면 현재 답변이 덮어써집니다." secondaryAction={<Button variant="secondary" icon={<Octicon name="x" size={16} />} onClick={cancelReply}>취소</Button>} action={<Button onClick={() => submitReply()} icon={<Octicon name="check" size={16} />}>새 답변으로 등록</Button>} />}
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
