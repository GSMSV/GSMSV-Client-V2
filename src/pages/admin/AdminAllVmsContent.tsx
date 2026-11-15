import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import styled from 'styled-components';
import type { AdminResource, InfraNode, NodeVm } from '../../entities/infra-node';
import type { DemoVmDetails } from '../../entities/infra-node/demo';
import { Button, SelectField, TextField } from '../../shared/ui/controls';
import { Pagination } from '../../shared/ui/data-display/Pagination';
import { StatusBadge } from '../../shared/ui/feedback/StatusBadge';
import { Octicon, type OcticonName } from '../../shared/ui/icons';

interface NodeVmState {
  loading: boolean;
  error: boolean;
  unavailable: boolean;
  items: NodeVm[];
}

interface VmRow {
  key: string;
  node: string | null;
  name: string;
  ownerEmail: string;
  status: string;
  grn: string | null;
  vmid: number | null;
  resource?: AdminResource;
  nodeVm?: NodeVm;
}

export interface AdminAllVmsContentProps {
  resources: AdminResource[];
  nodes: InfraNode[];
  nodeVmStates: Record<string, NodeVmState>;
  expiringGrns?: string[];
  demoVmDetails?: Record<string, DemoVmDetails>;
  onDemoPowerAction?: (grn: string, powerState: 'running' | 'stopped') => void;
  onOpenDetails?: (grn: string) => void;
  onRefresh: () => void;
  refreshDisabled: boolean;
}

const Page = styled.div`
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 16px;
`;

const Tabs = styled.nav`
  display: flex;
  flex-wrap: wrap;
  min-height: 42px;
  align-items: center;
  gap: 8px;
`;

const Tab = styled.button<{ $active?: boolean }>`
  display: inline-flex;
  min-height: 42px;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.base}px;
  color: ${({ theme, $active }) => $active ? theme.colors.primary : theme.colors.muted};
  background: ${({ theme, $active }) => $active ? theme.colors.primarySoft : 'transparent'};
  font: ${({ theme }) => theme.typography.button.weight} ${({ theme }) => theme.typography.button.size}px/${({ theme }) => theme.typography.button.lineHeight}px ${({ theme }) => theme.typography.button.family}, sans-serif;
  cursor: ${({ disabled }) => disabled ? 'not-allowed' : 'pointer'};
  opacity: ${({ disabled }) => disabled ? 0.65 : 1};

  &:hover:not(:disabled):not([aria-current='page']) { background: ${({ theme }) => theme.colors.overlayHover}; }
  &:focus-visible { outline: 2px solid ${({ theme }) => theme.colors.primary}; outline-offset: 2px; }
`;

const Surface = styled.section`
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};
`;

const SurfaceTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.title.weight} ${({ theme }) => theme.typography.title.size}px/${({ theme }) => theme.typography.title.lineHeight}px ${({ theme }) => theme.typography.title.family}, sans-serif;
`;

const Filters = styled.form`
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 16px;
`;

const FilterField = styled.div`
  width: 100%;
`;

const FilterActions = styled.div`
  display: flex;
  width: 100%;
  justify-content: flex-end;
`;

// Figma 28: 새로고침은 보기 탭과 같은 줄 오른쪽 끝에 놓인다.
const TabsAction = styled.div`
  margin-left: auto;
`;

// Figma 28 VM 목록: 관리 열의 "상세 열기"는 행 높이를 키우지 않는 글자 버튼이다.
const RowAction = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;

  &:hover { text-decoration: underline; }
  &:focus-visible { outline: 2px solid ${({ theme }) => theme.colors.primary}; outline-offset: 2px; }
`;

const TableViewport = styled.div`
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
`;

const Table = styled.div`
  display: flex;
  width: 100%;
  min-width: 760px;
  flex-direction: column;
`;

const TableRow = styled.div<{ $header?: boolean; $selected?: boolean }>`
  display: grid;
  min-height: ${({ $header }) => $header ? '42px' : '46px'};
  grid-template-columns: minmax(0, 1.15fr) minmax(84px, .6fr) minmax(82px, .6fr) minmax(84px, .65fr) minmax(0, 1.35fr) minmax(108px, .65fr);
  align-items: center;
  border-radius: ${({ $selected, theme }) => $selected ? `${theme.radii.base}px` : '0'};
  border-bottom: ${({ $header, $selected, theme }) => $header || $selected ? '0' : `1px solid ${theme.colors.border}`};
  background: ${({ $header, $selected, theme }) => $header ? theme.colors.raised : $selected ? theme.colors.primarySoft : 'transparent'};
`;

const HeaderCell = styled.div`
  min-width: 0;
  padding: 12px;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.label.weight} ${({ theme }) => theme.typography.label.size}px/${({ theme }) => theme.typography.label.lineHeight}px ${({ theme }) => theme.typography.label.family}, sans-serif;
`;

const Cell = styled.div<{ $muted?: boolean; $primary?: boolean; $danger?: boolean }>`
  overflow: hidden;
  min-width: 0;
  padding: 12px;
  color: ${({ theme, $muted, $primary, $danger }) => $primary ? theme.colors.primary : $danger ? theme.colors.danger : $muted ? theme.colors.muted : theme.colors.text};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const RowSelect = styled.button`
  display: block;
  overflow: hidden;
  width: 100%;
  padding: 0;
  border: 0;
  color: inherit;
  background: transparent;
  font: inherit;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;

  &:focus-visible { outline: 2px solid ${({ theme }) => theme.colors.primary}; outline-offset: 2px; }
`;

// 공용 Pagination은 6쪽을 모두 펼쳐 390px에서 넘치므로 카드 안에서만 가로 스크롤한다.
const PaginationViewport = styled.div`
  width: 100%;
  overflow-x: auto;
`;

const MissingValue = styled.span`
  color: ${({ theme }) => theme.colors.faint};
`;

const EmptyState = styled.div`
  display: flex;
  min-height: 96px;
  align-items: center;
  justify-content: center;
  padding: 16px;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
  text-align: center;
`;

const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  width: 100%;

  @media (max-width: 720px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const DetailCard = styled.section`
  display: flex;
  min-width: 0;
  min-height: 190px;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};
`;

const DetailTitle = styled.h2`
  overflow: hidden;
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.title.weight} ${({ theme }) => theme.typography.title.size}px/${({ theme }) => theme.typography.title.lineHeight}px ${({ theme }) => theme.typography.title.family}, sans-serif;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const DetailRows = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

// Figma 28 선택한 VM 카드: 이름(캡션) 아래에 값을 쌓는다.
const DetailRow = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
  color: ${({ theme }) => theme.colors.faint};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const DetailValue = styled.span`
  overflow-wrap: anywhere;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

// Figma 28 "Node별 보기에서 확인": 목록에 소유 정보가 없는 VM을 아이콘·설명·배지·버튼으로 보여 준다.
const OrphanItem = styled.article`
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr);
  align-items: center;
  gap: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const OrphanIcon = styled.span`
  display: inline-flex;
  color: ${({ theme }) => theme.colors.primary};
`;

const OrphanCopy = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
`;

const OrphanName = styled.strong`
  color: ${({ theme }) => theme.colors.text};
  font: 500 14px/20px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

const OrphanText = styled.span`
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

const DetailActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  margin-top: auto;
`;

const Helper = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.faint};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const Unsupported = styled.span`
  color: ${({ theme }) => theme.colors.faint};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const pageSize = 4;

function getStatusTone(status: string): 'neutral' | 'primary' | 'warning' | 'danger' {
  const normalized = status.trim().toLocaleLowerCase();
  if (['running', '실행 중'].includes(normalized)) return 'primary';
  if (normalized === 'expired' || normalized.startsWith('만료')) return 'danger';
  if (['pending', '대기'].includes(normalized)) return 'warning';
  return 'neutral';
}

function getClassificationLabel(classification: NodeVm['classification']) {
  if (classification === 'managed') return '관리 중';
  if (classification === 'orphan') return '고아 VM';
  return '미관리 VM';
}

function getResourceRows(resources: AdminResource[]): VmRow[] {
  return resources.map(resource => ({
    key: resource.grn,
    node: resource.node,
    name: resource.name,
    ownerEmail: resource.owner_email,
    status: resource.status,
    grn: resource.grn,
    vmid: resource.vmid,
    resource,
  }));
}

function getNodeVmRows(nodes: InfraNode[], nodeVmStates: Record<string, NodeVmState>, resources: AdminResource[]): VmRow[] {
  const resourceByGrn = new Map(resources.map(resource => [resource.grn, resource]));
  return nodes.flatMap(node => (nodeVmStates[node.node]?.items ?? []).map(nodeVm => {
    const resource = nodeVm.grn ? resourceByGrn.get(nodeVm.grn) : undefined;
    return {
      key: `${node.node}:${nodeVm.vmid}`,
      node: node.node,
      name: nodeVm.proxmox_name,
      ownerEmail: resource?.owner_email ?? '—',
      status: resource?.status ?? getClassificationLabel(nodeVm.classification),
      grn: nodeVm.grn,
      vmid: nodeVm.vmid,
      resource,
      nodeVm,
    };
  }));
}

function getIcon(name: OcticonName) {
  return <Octicon name={name} size={16} aria-hidden="true" />;
}

export function AdminAllVmsContent({ resources, nodes, nodeVmStates, expiringGrns, demoVmDetails, onDemoPowerAction, onOpenDetails, onRefresh, refreshDisabled }: AdminAllVmsContentProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const expiringOnly = searchParams.get('expires') === 'soon' && expiringGrns !== undefined;
  const [searchDraft, setSearchDraft] = useState('');
  const [nodeDraft, setNodeDraft] = useState('all');
  const [statusDraft, setStatusDraft] = useState('all');
  const [search, setSearch] = useState('');
  const [nodeFilter, setNodeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [nodeMode, setNodeMode] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const allRows = useMemo(() => nodeMode ? getNodeVmRows(nodes, nodeVmStates, resources) : getResourceRows(resources), [nodeMode, nodes, nodeVmStates, resources]);
  const nodeOptions = useMemo(() => [
    { value: 'all', label: '모든 Node' },
    ...Array.from(new Set([...nodes.map(node => node.node), nodeDraft, nodeFilter].filter(value => value !== 'all')))
      .map(node => ({ value: node, label: node })),
  ], [nodeDraft, nodeFilter, nodes]);
  const statusOptions = useMemo(() => [
    { value: 'all', label: '모든 상태' },
    ...Array.from(new Set([...allRows.map(row => row.status), statusDraft, statusFilter].filter(value => value !== 'all')))
      .sort().map(status => ({ value: status, label: status })),
  ], [allRows, statusDraft, statusFilter]);
  const filteredRows = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return allRows.filter(row => {
      if (expiringOnly && !expiringGrns?.includes(row.grn ?? '')) return false;
      if (nodeFilter !== 'all' && row.node !== nodeFilter) return false;
      if (statusFilter !== 'all' && row.status !== statusFilter) return false;
      if (!query) return true;
      return [row.name, row.ownerEmail, row.grn ?? '', String(row.vmid ?? ''), demoVmDetails?.[row.grn ?? '']?.purpose ?? '']
        .some(value => value.toLocaleLowerCase().includes(query));
    });
  }, [allRows, demoVmDetails, expiringGrns, expiringOnly, nodeFilter, search, statusFilter]);
  const pageCount = Math.ceil(filteredRows.length / pageSize);
  const safePage = pageCount === 0 ? 1 : Math.min(page, pageCount);
  const visibleRows = filteredRows.slice((safePage - 1) * pageSize, safePage * pageSize);
  const selectedRow = visibleRows.find(row => row.key === selectedKey) ?? visibleRows[0] ?? null;
  const selectedDetails = selectedRow?.grn ? demoVmDetails?.[selectedRow.grn] : undefined;
  const selectedNodeState = selectedRow?.node ? nodeVmStates[selectedRow.node] : undefined;
  const selectedNodeVm = selectedRow?.nodeVm ?? selectedNodeState?.items.find(item => selectedRow.grn && item.grn === selectedRow.grn)
    ?? selectedNodeState?.items.find(item => selectedRow.vmid != null && item.vmid === selectedRow.vmid && !item.grn);
  const selectedNode = nodes.find(node => node.node === selectedRow?.node);
  const unownedNodeVms = nodes.flatMap(node => (nodeVmStates[node.node]?.items ?? [])
    .filter(item => item.classification !== 'managed')
    .map(item => ({ node: node.node, item })));
  const scopedNodes = nodeFilter === 'all' ? nodes : nodes.filter(node => node.node === nodeFilter);
  const nodeListsLoading = nodeMode && scopedNodes.some(node => node.online && nodeVmStates[node.node]?.loading);
  const nodeListsWithErrors = nodeMode ? scopedNodes.filter(node => !node.online || nodeVmStates[node.node]?.error || nodeVmStates[node.node]?.unavailable) : [];
  const nodeListsUnavailable = nodeMode && scopedNodes.length > 0 && nodeListsWithErrors.length === scopedNodes.length;

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  const applyFilters = () => {
    setSearch(searchDraft);
    setNodeFilter(nodeDraft);
    setStatusFilter(statusDraft);
    setPage(1);
    setSelectedKey(null);
  };

  const changeViewMode = (nextNodeMode: boolean, node?: string | null, key?: string) => {
    setNodeMode(nextNodeMode);
    setNodeDraft(node ?? 'all');
    setNodeFilter(node ?? 'all');
    setStatusDraft('all');
    setStatusFilter('all');
    if (key) {
      setSearchDraft('');
      setSearch('');
      const targetIndex = getNodeVmRows(nodes, nodeVmStates, resources)
        .filter(row => row.node === node)
        .findIndex(row => row.key === key);
      setPage(targetIndex < 0 ? 1 : Math.floor(targetIndex / pageSize) + 1);
    } else {
      setPage(1);
    }
    setSelectedKey(key ?? null);
  };

  const changePage = (nextPage: number) => {
    setPage(nextPage);
    setSelectedKey(null);
  };

  const clearExpiringFilter = () => {
    setSearchParams(current => {
      const next = new URLSearchParams(current);
      next.delete('expires');
      return next;
    });
  };

  return (
    <Page>
      <Tabs aria-label="VM 보기 방식">
        <Tab type="button" $active={!nodeMode && !expiringOnly} aria-current={!nodeMode && !expiringOnly ? 'page' : undefined} onClick={() => { changeViewMode(false); clearExpiringFilter(); }}>
          전체 <span>{resources.length}</span>
        </Tab>
        <Tab
          type="button"
          $active={expiringOnly}
          aria-current={expiringOnly ? 'page' : undefined}
          disabled={expiringGrns === undefined}
          title={expiringGrns === undefined ? 'VM 만료일 API가 없어 만료 임박 항목을 계산할 수 없습니다.' : undefined}
          onClick={() => {
            changeViewMode(false);
            setSearchParams(current => {
              const next = new URLSearchParams(current);
              if (expiringOnly) next.delete('expires');
              else next.set('expires', 'soon');
              return next;
            });
            setPage(1);
            setSelectedKey(null);
          }}
        >
          만료 임박 <span>{expiringGrns?.length ?? '—'}</span>
        </Tab>
        <Tab type="button" $active={nodeMode} aria-current={nodeMode ? 'page' : undefined} onClick={() => { changeViewMode(true); clearExpiringFilter(); }}>
          Node별 보기
        </Tab>
        <TabsAction><Button variant="secondary" icon={getIcon('sync')} onClick={onRefresh} disabled={refreshDisabled}>새로고침</Button></TabsAction>
      </Tabs>

      <Surface>
        <SurfaceTitle>VM 찾기</SurfaceTitle>
        <Filters onSubmit={event => { event.preventDefault(); applyFilters(); }}>
          <FilterField>
            <TextField
              label="검색"
              value={searchDraft}
              placeholder="VM 이름, 소유자 이메일 또는 사용 목적"
              onChange={event => setSearchDraft(event.currentTarget.value)}
            />
          </FilterField>
          <FilterField>
            <SelectField label="Node" value={nodeDraft} options={nodeOptions} onChange={setNodeDraft} />
          </FilterField>
          <FilterField>
            <SelectField label="상태" value={statusDraft} options={statusOptions} onChange={setStatusDraft} />
          </FilterField>
          <FilterActions><Button type="submit" variant="secondary" icon={getIcon('filter')}>필터 적용</Button></FilterActions>
        </Filters>
      </Surface>

      <Surface>
        <SurfaceTitle>VM 목록</SurfaceTitle>
        {nodeListsWithErrors.length > 0 && nodeMode && (
          <Helper>일부 Node의 VM 목록을 확인할 수 없습니다. 표시된 결과는 확인이 끝난 Node 기준입니다.</Helper>
        )}
        {visibleRows.length > 0 ? (
          <TableViewport>
            <Table role="table" aria-label="전체 VM 목록">
              <TableRow role="row" $header>
                <HeaderCell role="columnheader">VM / 소유자</HeaderCell>
                <HeaderCell role="columnheader">Node</HeaderCell>
                <HeaderCell role="columnheader">상태</HeaderCell>
                <HeaderCell role="columnheader">만료일</HeaderCell>
                <HeaderCell role="columnheader">사용 목적</HeaderCell>
                <HeaderCell role="columnheader">관리</HeaderCell>
              </TableRow>
              {visibleRows.map(row => (
                <TableRow role="row" key={row.key} $selected={selectedRow?.key === row.key}>
                  <Cell role="cell"><RowSelect type="button" aria-label={`${row.name}, ${row.ownerEmail} 선택`} aria-pressed={selectedRow?.key === row.key} onClick={() => setSelectedKey(row.key)}>{row.name} · {row.resource?.owner_email === 'GSM Connect' ? '팀 GSM Connect' : row.ownerEmail}</RowSelect></Cell>
                  <Cell role="cell" $muted>{row.node ?? '—'}</Cell>
                  <Cell role="cell" title={row.status} $primary={getStatusTone(row.status) === 'primary'} $danger={getStatusTone(row.status) === 'danger'} $muted={getStatusTone(row.status) === 'neutral'}>{row.status}</Cell>
                  <Cell role="cell" $muted>{demoVmDetails?.[row.grn ?? '']?.expiresAt?.slice(0, 10) ?? <MissingValue title="현재 VM API 응답에 만료일이 없습니다">—</MissingValue>}</Cell>
                  <Cell role="cell" $muted>{demoVmDetails?.[row.grn ?? '']?.purpose ?? <MissingValue title="현재 VM API 응답에 사용 목적이 없습니다">—</MissingValue>}</Cell>
                  <Cell role="cell" $primary={selectedRow?.key === row.key}><RowAction type="button" onClick={() => {
                    setSelectedKey(row.key);
                    if (row.resource) onOpenDetails?.(row.resource.grn);
                  }}>{getIcon('arrow-right')}상세 열기</RowAction></Cell>
                </TableRow>
              ))}
            </Table>
          </TableViewport>
        ) : (
          <EmptyState>
            {nodeListsLoading ? 'Node별 VM 목록을 불러오는 중입니다.'
              : nodeMode && nodes.length === 0 ? '조회된 Node가 없습니다.'
                : nodeListsUnavailable ? '현재 Node의 VM 목록을 확인할 수 없습니다.'
                  : allRows.length === 0 ? '조회된 VM이 없습니다.' : '필터 결과가 없습니다.'}
          </EmptyState>
        )}
        {filteredRows.length > 0 && (
          <PaginationViewport><Pagination
            page={safePage}
            pageCount={pageCount}
            summary={`${filteredRows.length}개 중 ${(safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, filteredRows.length)}`}
            onPageChange={changePage}
          /></PaginationViewport>
        )}
      </Surface>

      <DetailGrid>
        <DetailCard aria-label="선택한 VM">
          <DetailTitle>{selectedRow?.name ?? 'VM을 선택하세요'}</DetailTitle>
          {selectedRow ? (
            <>
              <DetailRows>
                <DetailRow><span>소유자</span><DetailValue>{selectedDetails ? selectedRow.ownerEmail.includes('@') ? `${selectedDetails.ownerName} · ${selectedRow.ownerEmail}` : selectedDetails.ownerName : selectedRow.ownerEmail}</DetailValue></DetailRow>
                <DetailRow><span>전원 상태</span><DetailValue>{selectedRow.resource?.power_state === 'running' ? '실행 중' : selectedRow.resource?.power_state === 'stopped' ? '정지' : selectedRow.resource?.power_state ?? '—'}{selectedRow.node ? ` · ${selectedRow.node}` : ''}</DetailValue></DetailRow>
                <DetailRow><span>Resources</span><DetailValue>{selectedDetails ? `${selectedDetails.vcpu} vCPU · RAM ${selectedDetails.ramGb} GB · SSD ${selectedDetails.diskGb} GB` : <Unsupported title="현재 관리자 VM API에서 리소스 사양을 제공하지 않습니다">API에서 제공하지 않음</Unsupported>}</DetailValue></DetailRow>
              </DetailRows>
              <DetailActions>
                <Button variant="secondary" icon={getIcon('server')} disabled={!selectedRow.resource || !onOpenDetails} title={!onOpenDetails ? 'VM 상세 관리 API가 없습니다.' : undefined} onClick={() => { if (selectedRow.resource) onOpenDetails?.(selectedRow.resource.grn); }}>상세 관리</Button>
                <Button variant="secondary" icon={getIcon('stop')} disabled={!selectedRow.resource || !onDemoPowerAction || selectedRow.resource.power_state === 'stopped'} title={!onDemoPowerAction ? 'VM 종료 API가 없습니다.' : undefined} onClick={() => selectedRow.grn && onDemoPowerAction?.(selectedRow.grn, 'stopped')}>종료</Button>
                <Button variant="secondary" icon={getIcon('sync')} disabled={!selectedRow.resource || !onDemoPowerAction} title={!onDemoPowerAction ? 'VM 재시작 API가 없습니다.' : undefined} onClick={() => selectedRow.grn && onDemoPowerAction?.(selectedRow.grn, 'running')}>재시작</Button>
              </DetailActions>
            </>
          ) : <Helper>검색 조건에 맞는 VM을 선택하면 계약된 정보를 표시합니다.</Helper>}
        </DetailCard>

        <DetailCard aria-label="Node별 보기에서 확인">
          <DetailTitle>Node별 보기에서 확인</DetailTitle>
          {unownedNodeVms.length > 0 ? unownedNodeVms.map(({ node, item }) => (
            <OrphanItem key={`${node}:${item.vmid}`}>
              <OrphanIcon>{getIcon('alert')}</OrphanIcon>
              <OrphanCopy>
                <OrphanName>{item.proxmox_name} · {getClassificationLabel(item.classification)}</OrphanName>
                <OrphanText>{item.classification === 'orphan' ? '가상화 서버에는 있지만 서비스의 소유 정보가 없는 VM입니다.' : '가상화 서버에는 있지만 서비스에서 관리하지 않는 VM입니다.'}</OrphanText>
                <Helper>{node} · {item.grn ? `VMID ${item.vmid}` : 'Node별 보기에만 표시'}</Helper>
                <StatusBadge tone="neutral">{item.classification === 'orphan' ? '고아' : '미관리'}</StatusBadge>
                <FilterActions><Button variant="secondary" icon={getIcon('server')} onClick={() => { changeViewMode(true, node, `${node}:${item.vmid}`); clearExpiringFilter(); }}>Node별 보기</Button></FilterActions>
              </OrphanCopy>
            </OrphanItem>
          )) : !selectedRow ? <Helper>VM을 선택하면 해당 Node의 목록을 확인합니다.</Helper>
            : selectedNodeState?.unavailable ? <Helper>Node 정보를 확인할 수 없어 VM 목록을 불러오지 않았습니다.</Helper>
              : selectedNodeState?.loading ? <Helper>Node의 VM 목록을 불러오는 중입니다.</Helper>
                : selectedNodeState?.error ? <Helper>Node의 VM 목록을 불러오지 못했습니다. 새로고침 후 다시 확인해 주세요.</Helper>
                  : selectedNodeVm ? (
                    <>
                      <DetailRows>
                        <DetailRow><span>{selectedNodeVm.proxmox_name} · {selectedNodeVm.grn ? selectedNodeVm.grn : `VMID ${selectedNodeVm.vmid}`}</span><DetailValue>{getClassificationLabel(selectedNodeVm.classification)}</DetailValue></DetailRow>
                        <DetailRow><span>{selectedRow.node ?? 'Node'}</span><DetailValue>{selectedNode?.online ? '온라인' : selectedNode ? '오프라인' : '—'}</DetailValue></DetailRow>
                      </DetailRows>
                      <FilterActions><Button variant="secondary" icon={getIcon('server')} onClick={() => { changeViewMode(true, selectedRow.node, selectedNodeVm ? `${selectedRow.node}:${selectedNodeVm.vmid}` : undefined); clearExpiringFilter(); }}>Node별 보기</Button></FilterActions>
                    </>
                  ) : <Helper>이 VM의 Node 분류 정보를 찾을 수 없습니다.</Helper>}
        </DetailCard>
      </DetailGrid>
      {demoVmDetails ? null : <Helper>만료일·사용 목적·사양과 VM 조작은 현재 관리자 API 응답에 포함되지 않습니다.</Helper>}
    </Page>
  );
}
