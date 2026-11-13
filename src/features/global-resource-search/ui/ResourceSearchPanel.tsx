import { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { Button } from '../../../shared/ui/controls';
import { LoadingCard } from '../../../shared/ui/feedback';
import { Octicon } from '../../../shared/ui/icons';
import { loadResourceSearch, type SearchableResource } from '../api/loadResourceSearch';

const Panel = styled.aside<{ $top: number; $right: number }>`
  position: fixed;
  z-index: 40;
  top: ${({ $top }) => $top}px;
  right: ${({ $right }) => $right}px;
  display: flex;
  width: min(480px, calc(100vw - 32px));
  max-height: min(720px, calc(100vh - 82px));
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  padding: 24px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: 0 12px 36px #0007;
`;

const Heading = styled.header`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const TitleIcon = styled.span`
  display: inline-flex;
  flex: 0 0 auto;
  color: ${({ theme }) => theme.colors.primary};
`;

const Title = styled.h2`
  flex: 1;
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.h2.weight} ${({ theme }) => theme.typography.h2.size}px/${({ theme }) => theme.typography.h2.lineHeight}px ${({ theme }) => theme.typography.h2.family}, sans-serif;
`;

const Description = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

const SearchField = styled.label`
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.label.weight} ${({ theme }) => theme.typography.label.size}px/${({ theme }) => theme.typography.label.lineHeight}px ${({ theme }) => theme.typography.label.family}, sans-serif;
`;

const SearchInput = styled.input`
  width: 100%;
  height: 42px;
  padding: 0 16px;
  border: 1px solid transparent;
  border-radius: ${({ theme }) => theme.radii.base}px;
  outline: none;
  background: ${({ theme }) => theme.colors.field};
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;

  &:focus { border-color: ${({ theme }) => theme.colors.primary}; }
  &::placeholder { color: ${({ theme }) => theme.colors.faint}; }
`;

const Results = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Group = styled.section`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const GroupTitle = styled.h3`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.label.weight} ${({ theme }) => theme.typography.label.size}px/${({ theme }) => theme.typography.label.lineHeight}px ${({ theme }) => theme.typography.label.family}, sans-serif;
`;

const ResultList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
`;

const Result = styled.li`
  display: grid;
  grid-template-columns: 16px minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 12px;
  min-height: 42px;
`;

const ResourceIcon = styled.span`
  display: inline-flex;
  color: ${({ theme }) => theme.colors.text};
`;

const ResourceCopy = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
`;

const ResourceName = styled.span`
  overflow: hidden;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ResourceStatus = styled.span`
  overflow: hidden;
  color: ${({ theme }) => theme.colors.faint};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const TypeBadge = styled.span`
  padding: 4px 8px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.raised};
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const ResultButton = styled(Button)`
  padding: 0 12px;
`;

const PartialError = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: ${({ theme }) => theme.colors.warning};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const EmptyHint = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const EmptyActions = styled.div`
  display: flex;
  justify-content: flex-end;
`;

interface Props {
  open: boolean;
  onClose: () => void;
  onOpenResource: (path: string) => void;
  top?: number;
  right?: number;
}

export function ResourceSearchPanel({ open, onClose, onOpenResource, top = 66, right = 24 }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [resources, setResources] = useState<SearchableResource[] | null>(null);
  const [hadError, setHadError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    const controller = new AbortController();
    setResources(null);
    void loadResourceSearch(controller.signal).then(result => {
      if (controller.signal.aborted) return;
      setResources(result.resources);
      setHadError(result.hadError);
    });
    return () => controller.abort();
  }, [open, retryKey]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    inputRef.current?.focus();
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const filteredResources = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return (resources ?? []).filter(resource => !normalizedQuery
      || resource.name.toLocaleLowerCase().includes(normalizedQuery)
      || resource.grn.toLocaleLowerCase().includes(normalizedQuery));
  }, [query, resources]);

  const groupedResources = useMemo(() => {
    const groups = new Map<string, { label: string; items: SearchableResource[] }>();
    filteredResources.forEach(resource => {
      const group = groups.get(resource.scopeId) ?? { label: resource.scopeLabel, items: [] };
      group.items.push(resource);
      groups.set(resource.scopeId, group);
    });
    return [...groups.entries()];
  }, [filteredResources]);

  if (!open) return null;

  const isEmpty = resources !== null && !hadError && filteredResources.length === 0;

  return (
    <Panel
      id="resource-search-panel"
      $top={top}
      $right={right}
      role="dialog"
      aria-label="검색"
      aria-modal="false"
      tabIndex={-1}
    >
      <Heading>
        <TitleIcon><Octicon name="search" size={24} /></TitleIcon>
        <Title>{isEmpty ? '검색 결과가 없습니다' : '검색'}</Title>
      </Heading>
      {isEmpty ? (
        <>
          <Description>{query.trim() ? `‘${query.trim()}’와 일치하는 Resource를 찾지 못했습니다.` : '검색할 수 있는 Resource가 없습니다.'}</Description>
          <EmptyHint>· 내 Resources와 속한 팀의 Database와 앱을 모두 찾아봤습니다. 이름이나 GRN을 다시 확인해 주세요.</EmptyHint>
          <SearchField>
            검색어
            <SearchInput ref={inputRef} value={query} onChange={event => setQuery(event.target.value)} aria-label="검색어" />
          </SearchField>
          {query.trim() && <EmptyActions><Button variant="ghost" onClick={() => setQuery('')}>검색어 지우기</Button></EmptyActions>}
        </>
      ) : (
        <>
          <Description>볼 수 있는 Database와 앱을 이름이나 GRN으로 찾습니다.</Description>
          <SearchField>
            검색어
            <SearchInput
              ref={inputRef}
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="이름 또는 GRN으로 검색"
              aria-label="검색어"
            />
          </SearchField>
        </>
      )}

      {resources === null ? <LoadingCard height={132} /> : hadError ? (
        <>
          <PartialError role="status">일부 Resource를 불러오지 못했습니다.<Button variant="ghost" onClick={() => setRetryKey(value => value + 1)}>다시 시도</Button></PartialError>
          {filteredResources.length > 0 && (
            <Results aria-live="polite">
              {groupedResources.map(([scopeId, group]) => (
                <Group key={scopeId}>
                  <GroupTitle>{group.label}</GroupTitle>
                  <ResultList>{group.items.map(resource => <SearchResult key={resource.id} resource={resource} onOpen={onOpenResource} />)}</ResultList>
                </Group>
              ))}
            </Results>
          )}
        </>
      ) : (
        <Results aria-live="polite">
          {groupedResources.map(([scopeId, group]) => (
            <Group key={scopeId}>
              <GroupTitle>{group.label}</GroupTitle>
              <ResultList>
                {group.items.map(resource => <SearchResult key={resource.id} resource={resource} onOpen={onOpenResource} />)}
              </ResultList>
            </Group>
          ))}
        </Results>
      )}
    </Panel>
  );
}

function SearchResult({ resource, onOpen }: { resource: SearchableResource; onOpen: (path: string) => void }) {
  return (
    <Result>
      <ResourceIcon aria-hidden="true"><Octicon name={resource.kind === 'database' ? 'database' : 'upload'} size={16} /></ResourceIcon>
      <ResourceCopy>
        <ResourceName title={resource.name}>{resource.name}</ResourceName>
        <ResourceStatus>{resource.status}</ResourceStatus>
      </ResourceCopy>
      <TypeBadge>{resource.kind === 'database' ? 'Database' : '앱'}</TypeBadge>
      <ResultButton variant="ghost" onClick={() => onOpen(resource.path)}>열기</ResultButton>
    </Result>
  );
}
