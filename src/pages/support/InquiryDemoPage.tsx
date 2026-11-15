import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import styled from 'styled-components';
import { getDemoInquiries, saveDemoInquiries, type Inquiry } from '../../entities/demo-workflows';
import { isDemoMode, simulateDemoRequest } from '../../shared/demo';
import { Button } from '../../shared/ui/controls';
import { ErrorCard, LoadingCard, ModalSurface } from '../../shared/ui/feedback';
import { Octicon } from '../../shared/ui/icons';
import { Alert, Badge, Breadcrumb as WorkflowBreadcrumb, Card, CardHeader, Field, Heading, Hint, Muted, PageStack, SectionTitle, Select, Subtitle, Textarea, Title, TitleGroup, WorkflowLayout, DemoOnlyGate } from '../demo-workflows/ui/WorkflowLayout';

const Breadcrumb = styled(WorkflowBreadcrumb)`
  margin-bottom: 0;
`;

// Figma 53:3544 표기: 2026. 09. 28. 16:10
function formatInquiryDate(value: string) {
  const match = /^(\d{4})\.(\d{2})\.(\d{2}) (\d{2}:\d{2})$/.exec(value);
  return match ? `${match[1]}. ${match[2]}. ${match[3]}. ${match[4]}` : value;
}

const InquiryCard = styled(Card)`
  box-sizing: border-box;
  min-width: 0;

  @media (max-width: 600px) {
    padding: 16px;
  }
`;

const NewInquiryHeader = styled(CardHeader)`
  align-items: flex-start;

  @media (max-width: 600px) {
    flex-direction: column;
    align-items: stretch;

    > button { width: 100%; }
  }
`;

const InquiryTextarea = styled(Textarea)`
  box-sizing: border-box;
  min-width: 0;
  overflow-wrap: anywhere;
`;

const InquiryList = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
`;

const InquiryRow = styled.div`
  display: grid;
  min-width: 0;
  grid-template-columns: 20px minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
  padding: 16px 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  &:first-child { padding-top: 0; }
  > button { align-self: start; }

  @media (max-width: 600px) {
    grid-template-columns: 20px minmax(0, 1fr);
    align-items: start;
    column-gap: 12px;
    row-gap: 8px;
    padding: 16px 0;

    > button { grid-column: 2; justify-self: start; }
  }
`;

const InquiryIndicator = styled.span`
  color: ${({ theme }) => theme.colors.primary};
`;

const InquiryCopy = styled.div`
  min-width: 0;
  overflow-wrap: anywhere;
`;

const InquiryTitle = styled.strong`
  display: block;
  color: ${({ theme }) => theme.colors.text};
  font-size: 14px;
  overflow-wrap: anywhere;
`;

const InquiryDate = styled(Muted)`
  margin-top: 8px;
`;

const InquiryStatus = styled.span`
  display: inline-block;
  margin-top: 8px;
  padding: 2px 8px;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.raised};
  color: ${({ theme }) => theme.colors.muted};
  font-size: 12px;
`;

const EmptyInquiryState = styled.div`
  display: grid;
  gap: 12px;
  padding: 24px 0;
`;

const ConfirmPanel = styled.div`
  box-sizing: border-box;
  display: flex;
  width: min(480px, calc(100vw - 32px));
  flex-direction: column;
  gap: 16px;
  padding: 24px;
`;
const ConfirmTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.h2.weight} ${({ theme }) => theme.typography.h2.size}px/${({ theme }) => theme.typography.h2.lineHeight}px ${({ theme }) => theme.typography.h2.family}, sans-serif;
`;
const ConfirmCopy = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font: 400 14px/22px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;
const ConfirmDetails = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 8px;
  color: ${({ theme }) => theme.colors.muted};
  font: 400 12px/18px ${({ theme }) => theme.typography.caption.family}, sans-serif;
  overflow-wrap: anywhere;
`;
const ConfirmActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;
const Answer = styled.section`
  display: grid;
  gap: 8px;
  overflow-wrap: anywhere;
`;

const InquiryStateError = styled(ErrorCard)`
  height: 262px;
`;

export default function InquiryDemoPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState(() => getDemoInquiries());
  const [loadState, setLoadState] = useState<'loading' | 'error' | 'ready'>('loading');
  const [loadKey, setLoadKey] = useState(0);
  const [vmName, setVmName] = useState('portfolio-api');
  const article = searchParams.get('article')?.trim().slice(0, 120);
  const rawArticleUrl = searchParams.get('articleUrl');
  const articleUrl = rawArticleUrl?.startsWith('/docs#') && !rawArticleUrl.startsWith('//') ? rawArticleUrl : undefined;
  const [content, setContent] = useState(() => article
    ? `문서 "${article}"을 확인했지만 해결되지 않았습니다.\n관련 문서: ${articleUrl ?? '/docs'}\n\n문제가 발생한 상황과 시도한 방법을 입력해 주세요.`
    : 'SSH 기본 포트를 복원했지만 연결이 되지 않습니다. VM은 실행 중이며 터미널에서 연결 시간 초과가 발생합니다.');
  const [notice, setNotice] = useState('');
  const [pendingDelete, setPendingDelete] = useState<Inquiry | null>(null);
  const myItems = items.filter((item) => item.isMine);
  const answers = myItems.filter(item => item.status === '답변 완료' && item.reply);

  useEffect(() => {
    const controller = new AbortController();
    setLoadState('loading');
    // ?demoError=inquiries: 첫 조회만 실패하고 다시 시도하면 목록을 불러온다.
    simulateDemoRequest('inquiries', controller.signal)
      .then(() => {
        if (controller.signal.aborted) return;
        setItems(getDemoInquiries());
        setLoadState('ready');
      })
      .catch(() => {
        if (!controller.signal.aborted) setLoadState('error');
      });
    return () => controller.abort();
  }, [loadKey]);

  function submit() {
    if (!isDemoMode()) return;
    const text = content.trim();
    if (!text || text.length > 500) { setNotice('문의 내용은 1~500자로 입력해 주세요.'); return; }
    const createdAt = new Date().toISOString().slice(0, 16).replaceAll('-', '.').replace('T', ' ');
    const next: Inquiry = { id: `inquiry-${crypto.randomUUID()}`, title: text.length > 48 ? `${text.slice(0, 48)}…` : text, author: '김지민', studentId: '2107', createdAt, vmName, content: text, ...(article ? { source: { title: article, ...(articleUrl ? { url: articleUrl } : {}) } } : {}), reply: '', status: '대기 중', isMine: true };
    const updated = [next, ...getDemoInquiries()];
    if (!saveDemoInquiries(updated)) { setNotice('질문을 등록하지 못했습니다. 다시 시도해 주세요.'); return; }
    setItems(updated);
    setNotice('질문을 등록했습니다. 답변을 받으면 이 화면에서 확인할 수 있습니다.');
    setContent('');
  }

  function remove(id: string) {
    const updated = getDemoInquiries().filter(item => item.id !== id || !item.isMine);
    if (!saveDemoInquiries(updated)) { setNotice('질문을 삭제하지 못했습니다. 다시 시도해 주세요.'); return; }
    setItems(updated);
    setPendingDelete(null);
    setNotice('질문을 삭제했습니다.');
  }

  return <DemoOnlyGate><WorkflowLayout activeStudentItem="support"><PageStack>
    <Breadcrumb>문의</Breadcrumb>
    <Heading><TitleGroup><Title>문의</Title><Subtitle>해결되지 않은 문제를 남겨주시면 관리자가 답변해 드립니다.</Subtitle></TitleGroup><Button variant="secondary" icon={<Octicon name="book" size={16} />} onClick={() => navigate('/help')}>Docs 먼저 보기</Button></Heading>
    {loadState === 'loading' && <><LoadingCard height={262} /><LoadingCard height={262} /></>}
    {loadState === 'error' && <><InquiryStateError onRetry={() => setLoadKey(value => value + 1)} /><InquiryStateError onRetry={() => setLoadKey(value => value + 1)} /></>}
    {loadState === 'ready' && <>
    {notice && <Alert $tone={notice.startsWith('질문을 등록') || notice.startsWith('질문을 삭제') ? 'success' : 'warning'} role="status"><Octicon name="info" size={16} />{notice}</Alert>}
    <InquiryCard><NewInquiryHeader><div><SectionTitle>새 문의</SectionTitle><Hint>문제가 발생한 상황과 시도한 방법을 함께 알려주세요.</Hint></div><Button icon={<Octicon name="plus" size={16} />} onClick={submit}>질문 등록</Button></NewInquiryHeader>
      <Field>관련 VM<Select value={vmName} onChange={(event) => setVmName(event.target.value)}><option value="">선택 안 함</option><option>portfolio-api</option><option>portfolio-worker</option><option>connect-api · GSM Connect</option><option>connect-db · GSM Connect</option></Select></Field>
      <Field style={{ marginTop: 16 }}>문의 내용<InquiryTextarea value={content} maxLength={500} onChange={(event) => setContent(event.target.value)} /><Hint>1~500자까지 입력할 수 있습니다.</Hint></Field>
    </InquiryCard>
    <InquiryCard><CardHeader><SectionTitle>내 질문 · <Badge $tone="success">{myItems.length}개</Badge></SectionTitle></CardHeader>
      {myItems.length === 0 ? <EmptyInquiryState role="status">
        <strong>아직 등록한 질문이 없습니다</strong>
        <Muted>Docs를 확인해도 해결되지 않는 문제가 있다면 문의를 남겨주세요. 답변이 등록되면 알림으로 알려드립니다.</Muted>
        <Hint>· 관련 VM을 선택하면 상황을 설명하기 쉽습니다.<br />· 문의 내용은 1~500자까지 입력할 수 있습니다.</Hint>
      </EmptyInquiryState> : <InquiryList>{myItems.map((item) => <InquiryRow key={item.id}><InquiryIndicator aria-hidden="true"><Octicon name={item.status === '답변 완료' ? 'check-circle' : 'clock'} size={20} /></InquiryIndicator><InquiryCopy><InquiryTitle>{item.title}</InquiryTitle><InquiryDate>{formatInquiryDate(item.createdAt)} 등록</InquiryDate><Hint>{item.status === '답변 완료' ? `답변 완료 · ${item.repliedAt ? formatInquiryDate(item.repliedAt) : '관리자가 답변했습니다.'}` : '검토가 끝나면 알림으로 안내해 드립니다.'}</Hint><InquiryStatus>{item.status}</InquiryStatus></InquiryCopy><Button variant="ghost" icon={<Octicon name="trashcan" size={16} />} onClick={() => setPendingDelete(item)}>질문 삭제</Button></InquiryRow>)}</InquiryList>}
    </InquiryCard>
    </>}
    {answers.map(item => <Answer key={item.id} aria-label={`${item.title} · 관리자 답변`}>
      <Muted><strong>관리자 답변</strong>{answers.length > 1 && ` · ${item.title}`}</Muted>
      <Muted>{item.reply}</Muted>
    </Answer>)}
    {pendingDelete && <ModalSurface labelledBy="inquiry-delete-title" onDismiss={() => setPendingDelete(null)}>
      <ConfirmPanel aria-labelledby="inquiry-delete-title" aria-describedby="inquiry-delete-copy">
        <ConfirmTitle id="inquiry-delete-title">이 질문을 삭제하시겠습니까?</ConfirmTitle>
        <ConfirmCopy id="inquiry-delete-copy">질문과 달린 답변이 함께 삭제됩니다. 삭제한 내용은 복구할 수 없습니다.</ConfirmCopy>
        <ConfirmDetails>
          <span>질문 · {pendingDelete.title}</span>
          {(pendingDelete.reply || pendingDelete.replyHistory?.length) ? <span>· {pendingDelete.status} · 관리자 답변 {(pendingDelete.reply ? 1 : 0) + (pendingDelete.replyHistory?.length ?? 0)}건</span> : <span>· {pendingDelete.status}</span>}
        </ConfirmDetails>
        <ConfirmActions>
          <Button variant="secondary" onClick={() => setPendingDelete(null)}>취소</Button>
          <Button variant="danger" onClick={() => remove(pendingDelete.id)}>질문 삭제</Button>
        </ConfirmActions>
      </ConfirmPanel>
    </ModalSurface>}
  </PageStack></WorkflowLayout></DemoOnlyGate>;
}
