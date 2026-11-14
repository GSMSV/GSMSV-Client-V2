import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { getDemoInquiries, saveDemoInquiries, type Inquiry } from '../../entities/demo-workflows';
import { isDemoMode } from '../../shared/demo';
import { Button } from '../../shared/ui/controls';
import { Octicon } from '../../shared/ui/icons';
import { Alert, Badge, Breadcrumb, Card, CardHeader, Field, Heading, Hint, Muted, PageStack, SectionTitle, Select, Subtitle, Textarea, Title, TitleGroup, WorkflowLayout, DemoOnlyGate } from '../demo-workflows/ui/WorkflowLayout';

export default function InquiryDemoPage() {
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState(() => getDemoInquiries());
  const [vmName, setVmName] = useState('portfolio-api');
  const article = searchParams.get('article')?.trim().slice(0, 120);
  const rawArticleUrl = searchParams.get('articleUrl');
  const articleUrl = rawArticleUrl?.startsWith('/docs#') && !rawArticleUrl.startsWith('//') ? rawArticleUrl : undefined;
  const [content, setContent] = useState(() => article
    ? `문서 "${article}"을 확인했지만 해결되지 않았습니다.\n관련 문서: ${articleUrl ?? '/docs'}\n\n문제가 발생한 상황과 시도한 방법을 입력해 주세요.`
    : 'SSH 기본 포트를 복원했지만 연결이 되지 않습니다. VM은 실행 중이며 터미널에서 연결 시간 초과가 발생합니다.');
  const [notice, setNotice] = useState('');
  const myItems = items.filter((item) => item.isMine);

  function submit() {
    if (!isDemoMode()) return;
    const text = content.trim();
    if (!text || text.length > 500) { setNotice('문의 내용은 1~500자로 입력해 주세요.'); return; }
    const next: Inquiry = { id: `inquiry-${crypto.randomUUID()}`, title: text.length > 48 ? `${text.slice(0, 48)}…` : text, author: '김지민', studentId: '2107', createdAt: '2026.11.14 12:00', vmName, content: text, ...(article ? { source: { title: article, ...(articleUrl ? { url: articleUrl } : {}) } } : {}), reply: '', status: '대기 중', isMine: true };
    const updated = [next, ...items];
    if (!saveDemoInquiries(updated)) { setNotice('질문을 등록하지 못했습니다. 다시 시도해 주세요.'); return; }
    setItems(updated);
    setNotice('질문을 등록했습니다. 관리자가 답변하면 알림으로 안내해 드립니다.');
    setContent('');
  }

  function remove(id: string) {
    const updated = items.filter((item) => item.id !== id);
    if (!saveDemoInquiries(updated)) { setNotice('질문을 삭제하지 못했습니다. 다시 시도해 주세요.'); return; }
    setItems(updated);
    setNotice('질문을 삭제했습니다.');
  }

  return <DemoOnlyGate><WorkflowLayout activeStudentItem="support"><PageStack>
    <Breadcrumb>문의</Breadcrumb>
    <Heading><TitleGroup><Title>문의</Title><Subtitle>해결되지 않은 문제를 남겨주시면 관리자가 답변해 드립니다.</Subtitle></TitleGroup><Button variant="secondary" icon={<Octicon name="book" size={16} />} onClick={() => { window.location.href = '/help'; }}>Docs 먼저 보기</Button></Heading>
    {notice && <Alert $tone={notice.startsWith('질문을 등록') ? 'success' : 'warning'} role="status"><Octicon name="info" size={16} />{notice}</Alert>}
    <Card><CardHeader><div><SectionTitle>새 문의</SectionTitle><Hint>문제가 발생한 상황과 시도한 방법을 함께 알려주세요.</Hint></div><Button icon={<Octicon name="plus" size={16} />} onClick={submit}>질문 등록</Button></CardHeader>
      <Field>관련 VM<Select value={vmName} onChange={(event) => setVmName(event.target.value)}><option>portfolio-api</option><option>web-server</option></Select></Field>
      <Field style={{ marginTop: 16 }}>문의 내용<Textarea value={content} maxLength={500} onChange={(event) => setContent(event.target.value)} /><Hint>1~500자까지 입력할 수 있습니다.</Hint></Field>
    </Card>
    <Card><CardHeader><SectionTitle>내 질문 · <Badge $tone="success">{myItems.length}개</Badge></SectionTitle></CardHeader>
      <div style={{ display: 'flex', flexDirection: 'column' }}>{myItems.map((item) => <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '20px minmax(0, 1fr) auto', alignItems: 'center', gap: 16, padding: '20px 0', borderBottom: '1px solid #514d57' }}><span style={{ color: '#00ff90' }}><Octicon name={item.status === '답변 완료' ? 'check-circle' : 'clock'} size={20} /></span><div><strong style={{ display: 'block', color: '#f7f6f8', fontSize: 14 }}>{item.title}</strong><Muted style={{ marginTop: 8 }}>{item.createdAt} 등록</Muted><Hint>{item.status === '답변 완료' ? `답변 완료 · ${item.reply}` : '검토가 끝나면 알림으로 안내해 드립니다.'}</Hint><span style={{ display: 'inline-block', marginTop: 8, padding: '2px 8px', borderRadius: 8, background: '#403d45', color: '#c0bbc6', fontSize: 12 }}>{item.status}</span></div><Button variant="ghost" icon={<Octicon name="trashcan" size={16} />} onClick={() => remove(item.id)}>질문 삭제</Button></div>)}</div>
    </Card>
    <Hint>관리자 답변 · 만료일까지 7일 이하로 남으면 연장 버튼이 활성화됩니다. 연장하면 기존 만료일에 14일이 더해집니다. 만료 후에도 3일의 유예 기간 안에는 연장할 수 있습니다.</Hint>
  </PageStack></WorkflowLayout></DemoOnlyGate>;
}
