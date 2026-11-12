import { useState } from 'react';
import styled from 'styled-components';
import {
  Button, Combobox, DateField, DisclosureItem, NavigationItem, SelectField,
  SegmentedControl, SliderField, StepConnector, StepIndicator, Switch, TextField,
} from '../../shared/ui/controls';
import {
  Banner, DeleteConfirmDialog, ErrorCard, LoadingBar, LoadingCard, RevealableSecret, StatusBadge, WriteOnlySecret,
} from '../../shared/ui/feedback';
import { Meter, Pagination, UsageCard } from '../../shared/ui/data-display';
import { Octicon, octiconNames } from '../../shared/ui/icons';

const Page = styled.main`
  box-sizing: border-box;
  width: 100%;
  min-width: 1100px;
  min-height: 100vh;
  padding: 48px;
  color: ${({ theme }) => theme.colors.text};
  background: ${({ theme }) => theme.colors.canvas};
`;
const Header = styled.header`
  display: flex; align-items: center; gap: 16px; margin-bottom: 32px;
  img { width: 24px; height: 24px; }
`;
const Title = styled.h1`
  margin: 0; font-family: ${({ theme }) => theme.typography.h1.family};
  font-size: ${({ theme }) => theme.typography.h1.size}px; font-weight: 700;
  line-height: ${({ theme }) => theme.typography.h1.lineHeight}px;
`;
const Intro = styled.p`
  margin: 0 0 40px; color: ${({ theme }) => theme.colors.muted};
  font-size: 16px; line-height: 24px;
`;
const Section = styled.section`
  margin-top: 40px; padding-top: 24px; border-top: 1px solid ${({ theme }) => theme.colors.border};
`;
const SectionTitle = styled.h2`
  margin: 0 0 24px; font-size: 20px; font-weight: 600; line-height: 28px;
`;
const SectionNote = styled.p`
  margin: -16px 0 24px; color: ${({ theme }) => theme.colors.faint}; font-size: 12px; line-height: 18px;
`;
const Row = styled.div`display: flex; flex-wrap: wrap; align-items: center; gap: 16px;`;
const Grid = styled.div`display: grid; grid-template-columns: repeat(3, minmax(220px, 1fr)); gap: 16px;`;
const FieldColumn = styled.div`display: grid; grid-template-columns: repeat(2, minmax(220px, 1fr)); gap: 24px; max-width: 840px;`;
const ColorGrid = styled.div`display: grid; grid-template-columns: repeat(5, minmax(140px, 1fr)); gap: 12px;`;
const ColorSwatch = styled.div<{ $color: string }>`
  overflow: hidden; border: 1px solid ${({ theme }) => theme.colors.border}; border-radius: 8px; background: ${({ theme }) => theme.colors.surface};
  &::before { content: ''; display: block; height: 56px; background: ${({ $color }) => $color}; }
  div { padding: 8px; } strong, small { display: block; } strong { font-size: 12px; } small { margin-top: 4px; color: ${({ theme }) => theme.colors.muted}; font: 11px 'DM Mono', monospace; }
`;
const IconGrid = styled.div`display: grid; grid-template-columns: repeat(8, minmax(110px, 1fr)); gap: 8px;`;
const IconCell = styled.div`display: flex; height: 42px; align-items: center; gap: 8px; padding: 0 8px; border-radius: 4px; color: ${({ theme }) => theme.colors.muted}; background: ${({ theme }) => theme.colors.surface}; font-size: 11px;`;
const TypeSample = styled.div`display: grid; grid-template-columns: 160px 1fr; align-items: baseline; gap: 24px; padding: 12px 0; border-bottom: 1px solid ${({ theme }) => theme.colors.border}; span { color: ${({ theme }) => theme.colors.faint}; font: 12px 'DM Mono', monospace; }`;
const DarkPanel = styled.div`padding: 24px; border-radius: 8px; background: ${({ theme }) => theme.colors.surface};`;

const colors = [
  ['primary', '#00ff90'], ['onPrimary', '#15251d'], ['primaryHover', '#4dffb1'], ['primaryPressed', '#00d97a'], ['primarySoft', '#203d30'],
  ['canvas', '#2b292f'], ['surface', '#343238'], ['raised', '#3d3a42'], ['raisedHover', '#4a4750'], ['raisedPressed', '#322f37'],
  ['field', '#403d45'], ['text', '#f7f6f8'], ['muted', '#c0bbc6'], ['faint', '#a8a2af'], ['border', '#514d57'],
  ['warning', '#ffd08a'], ['warningSoft', '#433829'], ['danger', '#ffb0b0'], ['dangerSoft', '#482e33'], ['overlayHover', '#ffffff14'],
];

export default function DesignSystemPage() {
  const [segment, setSegment] = useState('개인');
  const [switchOn, setSwitchOn] = useState(true);
  const [page, setPage] = useState(3);
  const [confirmValue, setConfirmValue] = useState('');
  const selectOptions = [{ value: 'vm', label: '가상 머신', caption: '개인 또는 팀 리소스' }, { value: 'db', label: '데이터베이스' }, { value: 'app', label: '애플리케이션' }];
  return (
    <Page>
      <Header><img src="/assets/gsmsv-logo.svg" alt="" /><Title>Design system</Title></Header>
      <Intro>Figma Foundations 컴포넌트와 시각 토큰 확인용 카탈로그 · 프론트엔드 컴포넌트 기준</Intro>

      <Section>
        <SectionTitle>Color</SectionTitle>
        <ColorGrid>{colors.map(([name, value]) => <ColorSwatch key={name} $color={value}><div><strong>{name}</strong><small>{value}</small></div></ColorSwatch>)}</ColorGrid>
      </Section>
      <Section>
        <SectionTitle>Typography</SectionTitle>
        <TypeSample><span>H1 · 32 / 42 · Bold</span><strong style={{ fontSize: 32, lineHeight: '42px' }}>GSMSV Client V2</strong></TypeSample>
        <TypeSample><span>H2 · 24 / 34 · Bold</span><strong style={{ fontSize: 24, lineHeight: '34px' }}>서비스 관리</strong></TypeSample>
        <TypeSample><span>Title · 20 / 42 · Medium</span><strong style={{ fontSize: 20, fontWeight: 500, lineHeight: '42px' }}>리소스 정보</strong></TypeSample>
        <TypeSample><span>Body · 16 / 24 · Regular</span><div style={{ fontSize: 16, lineHeight: '24px' }}>팀의 리소스와 서비스 상태를 확인합니다.</div></TypeSample>
        <TypeSample><span>Body small · 14 / 22</span><div style={{ fontSize: 14, lineHeight: '22px' }}>설명과 폼 안내에 사용하는 작은 본문입니다.</div></TypeSample>
        <TypeSample><span>Label · 12 / 18 · Medium</span><div style={{ fontSize: 12, fontWeight: 500, lineHeight: '18px' }}>상태 및 폼 레이블</div></TypeSample>
        <TypeSample><span>Code · DM Mono 13 / 22</span><code style={{ font: '13px/22px DM Mono, monospace' }}>grn:user_abc123:vm_def456</code></TypeSample>
      </Section>
      <Section>
        <SectionTitle>Octicons</SectionTitle><SectionNote>Figma 아이콘 이름에 대응하는 공유 아이콘 레지스트리</SectionNote>
        <IconGrid>{octiconNames.map((name) => <IconCell key={name}><Octicon name={name} size={16} /><span>{name}</span></IconCell>)}</IconGrid>
      </Section>
      <Section>
        <SectionTitle>Button · 42px</SectionTitle>
        <Row><Button>Primary</Button><Button variant="secondary">Secondary</Button><Button variant="ghost">Ghost</Button><Button variant="danger">Danger</Button><Button disabled>Disabled</Button><Button icon={<Octicon name="plus" />}>아이콘 버튼</Button></Row>
      </Section>
      <Section>
        <SectionTitle>Input / Select / Date</SectionTitle>
        <FieldColumn>
          <TextField label="기본 입력" placeholder="이름을 입력하세요" />
          <TextField label="오류 상태" defaultValue="잘못된 값" error="값을 확인해 주세요." />
          <TextField label="비활성 상태" defaultValue="수정할 수 없음" disabled />
          <SelectField label="서비스 선택" options={selectOptions} defaultValue="vm" />
          <Combobox label="서비스 검색" options={selectOptions} placeholder="검색하거나 선택" />
          <DateField label="날짜" value="2026.11.12" />
        </FieldColumn>
      </Section>
      <Section>
        <SectionTitle>Selection / Navigation / Steps</SectionTitle>
        <Row><Switch label="자동 연장" checked={switchOn} onChange={setSwitchOn} /><SegmentedControl label="소유 범위" options={[{ value: '개인', label: '개인' }, { value: '팀', label: '팀' }]} value={segment} onChange={setSegment} /><NavigationItem label="서비스 목록" active icon={<Octicon name="server" />} /><NavigationItem label="팀 관리" icon={<Octicon name="people" />} /><StepIndicator number={1} label="정보 입력" active /><StepConnector /><StepIndicator number={2} label="검토" /></Row>
      </Section>
      <Section>
        <SectionTitle>Slider / Disclosure</SectionTitle>
        <FieldColumn><SliderField label="CPU" min={1} max={16} value={8} helper="사용 가능한 할당량 안에서 선택" /><DisclosureItem question="사용량은 언제 갱신되나요?" answer="사용량 정보는 서비스 상태 응답을 기준으로 표시합니다." /></FieldColumn>
      </Section>
      <Section>
        <SectionTitle>Status / Banner</SectionTitle>
        <Row><StatusBadge tone="neutral">대기</StatusBadge><StatusBadge tone="primary">실행 중</StatusBadge><StatusBadge tone="warning">만료 임박</StatusBadge><StatusBadge tone="danger">오류</StatusBadge></Row>
        <div style={{ display: 'grid', gap: 12, marginTop: 20 }}><Banner tone="neutral" title="안내" description="일반 안내 메시지를 표시합니다." /><Banner tone="primary" title="사용 기간이 곧 만료됩니다" description="필요한 경우 기간을 연장하세요." action={<Button variant="secondary">기간 연장</Button>} /></div>
      </Section>
      <Section>
        <SectionTitle>Service / Data display</SectionTitle>
        <Grid><UsageCard label="가상 머신" value="3 / 5" caption="사용 중인 VM" meter={{ value: 60, tone: 'primary', label: 'VM 사용량' }} icon={<Octicon name="server" />} /><UsageCard label="메모리" value="12 / 16 GB" caption="할당량 사용량" meter={{ value: 75, tone: 'primary', label: '메모리 사용량' }} icon={<Octicon name="cpu" />} /><UsageCard label="스토리지" value="90 / 100 GB" caption="한도에 가까워요" meter={{ value: 90, tone: 'warning', label: '스토리지 사용량' }} icon={<Octicon name="database" />} /></Grid>
        <div style={{ display: 'grid', gap: 24, marginTop: 24 }}><RevealableSecret label="DB 비밀번호" value="example-only-secret" /><WriteOnlySecret name="APP_SECRET" onChange={() => undefined} onDelete={() => undefined} /><Meter value={72} label="할당량 사용률" /><Pagination page={page} pageCount={12} summary="120개 중 21–30" onPageChange={setPage} /></div>
      </Section>
      <Section>
        <SectionTitle>Loading / Error</SectionTitle>
        <Grid><DarkPanel><LoadingBar /></DarkPanel><LoadingCard height={174} /><ErrorCard onRetry={() => undefined} /></Grid>
      </Section>
      <Section>
        <SectionTitle>Delete confirmation · Default / Matched</SectionTitle>
        <SectionNote>이름 일치 검증 상태 시연용. 확인 동작은 카탈로그에 연결하지 않음.</SectionNote>
        <FieldColumn><TextField label="확인 상태 시연: 입력값" value={confirmValue} onChange={(event) => setConfirmValue(event.currentTarget.value)} placeholder="sample-vm" /><TextField label="완료 상태 샘플" value="sample-vm" readOnly /></FieldColumn>
        <div style={{ display: 'flex', gap: 24, marginTop: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <DeleteConfirmDialog open title="리소스를 삭제할까요?" description="삭제한 리소스는 복구할 수 없습니다." fieldLabel="확인을 위해 sample-vm 입력" confirmationName="sample-vm" value={confirmValue} onValueChange={setConfirmValue} onConfirm={() => undefined} onCancel={() => undefined} hint="리소스 이름을 정확히 입력하세요." />
          <DeleteConfirmDialog open title="리소스를 삭제할까요?" description="삭제한 리소스는 복구할 수 없습니다." fieldLabel="확인 이름" confirmationName="sample-vm" value="sample-vm" onValueChange={() => undefined} onConfirm={() => undefined} onCancel={() => undefined} />
        </div>
      </Section>
    </Page>
  );
}
