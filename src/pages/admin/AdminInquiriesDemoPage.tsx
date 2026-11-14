import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { getDemoInquiries, saveDemoInquiries, type Inquiry } from '../../entities/demo-workflows';
import { Button } from '../../shared/ui/controls';
import { Octicon } from '../../shared/ui/icons';
import { Alert, Badge, Card, CardHeader, Field, Heading, Hint, Muted, PageStack, SectionTitle, Table, TableWrap, Textarea, Title, TitleGroup, WorkflowLayout, DemoOnlyGate } from '../demo-workflows/ui/WorkflowLayout';

type InquiryFilter = '전체' | '대기 중' | '답변 완료';

export default function AdminInquiriesDemoPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState(() => getDemoInquiries());
  const [selectedId, setSelectedId] = useState(() => getDemoInquiries().find((item) => item.id === 'inquiry-1')?.id ?? '');
  const [filter, setFilter] = useState<InquiryFilter>('전체');
  const [page, setPage] = useState(1);
  const [reply, setReply] = useState(() => getDemoInquiries().find((item) => item.id === 'inquiry-1')?.reply ?? '');
  const [notice, setNotice] = useState('');
  const selected = items.find((item) => item.id === selectedId) ?? items[0];
  const visible = useMemo(() => items.filter((item) => filter === '전체' || item.status === filter), [items, filter]);
  const pageSize = 4;
  const pageCount = Math.max(1, Math.ceil(visible.length / pageSize));
  const pageItems = visible.slice((page - 1) * pageSize, page * pageSize);

  function select(item: Inquiry) { setSelectedId(item.id); setReply(item.reply); setNotice(''); }
  function submitReply() {
    if (!selected) return;
    if (!reply.trim()) { setNotice('답변 내용을 입력해 주세요.'); return; }
    const updated = items.map((item) => item.id === selected.id ? { ...item, reply: reply.trim(), status: '답변 완료' as const } : item);
    setItems(updated);
    saveDemoInquiries(updated);
    setNotice('답변을 등록했습니다. 로컬 미리보기에서 답변 완료 상태로 표시됩니다.');
  }
  function cancelReply() { setReply(selected?.reply ?? ''); setNotice('답변 수정을 취소했습니다.'); }

  return <DemoOnlyGate admin><WorkflowLayout admin activeAdminItem="문의 답변"><PageStack>
    <p style={{ margin: 0, color: '#a8a2af', fontSize: 12 }}>관리자 / 문의 답변</p>
    <Heading><TitleGroup><Title>문의 답변</Title><Muted>대기 중인 문의부터 확인하고 답변을 등록하세요.</Muted></TitleGroup></Heading>
    {notice && <Alert $tone={notice.includes('입력') ? 'warning' : 'success'} role="status"><Octicon name="info" size={16} />{notice}</Alert>}
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}><div style={{ display: 'flex', gap: 8 }}>{(['전체', '대기 중', '답변 완료'] as const).map((item) => <Button key={item} variant={filter === item ? 'primary' : 'ghost'} onClick={() => { setFilter(item); setPage(1); }}>{item} <Badge $tone="success">{item === '전체' ? items.length : items.filter((entry) => entry.status === item).length}</Badge></Button>)}</div><Button variant="secondary" icon={<Octicon name="sync" size={16} />} onClick={() => { setItems(getDemoInquiries()); setNotice('문의 목록을 새로고침했습니다.'); }}>새로고침</Button></div>
    <Card><CardHeader><SectionTitle>최근 문의 · 대기 중 우선</SectionTitle></CardHeader><TableWrap><Table><thead><tr><th>문의</th><th>작성자</th><th>작성일</th><th>상태</th></tr></thead><tbody>{pageItems.map((item) => <tr key={item.id} aria-selected={item.id === selected?.id} onClick={() => select(item)}><td>{item.title}</td><td>{item.author} · {item.studentId}</td><td>{item.createdAt}</td><td><Badge $tone={item.status === '답변 완료' ? 'success' : 'warning'}>{item.status}</Badge></td></tr>)}</tbody></Table></TableWrap><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}><Hint>{items.length}개 중 {visible.length ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, visible.length)}</Hint><div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Button variant="ghost" disabled={page <= 1} aria-label="이전 페이지" icon={<Octicon name="arrow-left" size={16} />} onClick={() => setPage((value) => Math.max(1, value - 1))} />{Array.from({ length: pageCount }, (_, index) => index + 1).map((value) => <Button key={value} variant={page === value ? 'primary' : 'ghost'} onClick={() => setPage(value)}>{value}</Button>)}<Button variant="ghost" disabled={page >= pageCount} aria-label="다음 페이지" icon={<Octicon name="arrow-right" size={16} />} onClick={() => setPage((value) => Math.min(pageCount, value + 1))} /></div></div></Card>
    {selected && <>
      <Card><CardHeader><SectionTitle>{selected.title}</SectionTitle><Button variant="ghost" icon={<Octicon name="arrow-right" size={16} />} onClick={() => navigate('/admin/vms/demo-vm-1')}>VM 보기</Button></CardHeader>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', rowGap: 16 }}><div><Hint>작성자</Hint><Muted>{selected.author} · {selected.studentId}</Muted></div><div><Hint>관련 VM</Hint><Muted>{selected.vmName}</Muted></div><div style={{ gridColumn: '1 / -1' }}><Hint>문의 내용</Hint><Muted>{selected.content}</Muted></div>{selected.reply && <div style={{ gridColumn: '1 / -1' }}><Hint>현재 답변</Hint><Muted>{selected.reply} · {selected.createdAt}</Muted></div>}</div>
      </Card>
      <Card><CardHeader><div><SectionTitle>답변 수정</SectionTitle><Hint>안내를 보완할 수 있습니다. 등록하면 질문자에게 답변 알림을 보냅니다.</Hint></div></CardHeader><Field>관리자 답변<Textarea value={reply} onChange={(event) => setReply(event.target.value)} placeholder="답변을 입력하세요" /></Field><Hint>기존 답변을 대체할 내용을 확인해 주세요.</Hint>{selected.status !== '답변 완료' && <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}><Button variant="secondary" onClick={cancelReply}>취소</Button><Button onClick={submitReply} icon={<Octicon name="check" size={16} />}>답변 등록</Button></div>}</Card>
      {selected.status === '답변 완료' && <Alert><Octicon name="alert" size={18} /><div style={{ flex: 1 }}><strong>기존 답변을 바꾸시겠습니까?</strong><br />이미 답변한 문의입니다. 새 답변을 등록하면 현재 답변이 덮어써집니다.</div><Button variant="secondary" onClick={cancelReply}>취소</Button><Button onClick={submitReply} icon={<Octicon name="check" size={16} />}>새 답변으로 등록</Button></Alert>}
    </>}
  </PageStack></WorkflowLayout></DemoOnlyGate>;
}
