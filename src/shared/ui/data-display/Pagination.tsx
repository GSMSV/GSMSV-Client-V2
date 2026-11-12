import styled from 'styled-components';
import { Octicon } from '../icons';

type PageItem = number | 'ellipsis';

const Bar = styled.nav`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  min-height: 42px;
`;

const Summary = styled.span`
  color: ${({ theme }) => theme.colors.muted};
  font-family: ${({ theme }) => theme.typography.bodySmall.family};
  font-size: ${({ theme }) => theme.typography.bodySmall.size}px;
  line-height: ${({ theme }) => theme.typography.bodySmall.lineHeight}px;
`;

const Controls = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
`;

const PageButton = styled.button<{ $current?: boolean }>`
  display: inline-grid;
  flex: 0 0 42px;
  width: 42px;
  height: 42px;
  padding: 0;
  place-items: center;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.base}px;
  color: ${({ theme, $current }) => $current ? theme.colors.primary : theme.colors.muted};
  background: ${({ theme, $current }) => $current ? theme.colors.primarySoft : 'transparent'};
  font-family: ${({ theme }) => theme.typography.button.family}, sans-serif;
  font-size: ${({ theme }) => theme.typography.button.size}px;
  font-weight: ${({ theme }) => theme.typography.button.weight};
  line-height: ${({ theme }) => theme.typography.button.lineHeight}px;
  cursor: pointer;

  &:hover:not(:disabled) { background: ${({ theme }) => theme.colors.overlayHover}; }
  &:active:not(:disabled) { background: ${({ theme }) => theme.colors.overlayPressed}; }
  &:focus-visible { outline: 2px solid ${({ theme }) => theme.colors.primary}; outline-offset: 2px; }
  &:disabled { color: ${({ theme }) => theme.colors.faint}; cursor: not-allowed; opacity: 0.65; }
`;

const PageList = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
`;

const Ellipsis = styled.span`
  display: inline-grid;
  width: 42px;
  height: 42px;
  place-items: center;
  color: ${({ theme }) => theme.colors.muted};
  font-family: ${({ theme }) => theme.typography.button.family}, sans-serif;
  font-size: ${({ theme }) => theme.typography.button.size}px;
  font-weight: ${({ theme }) => theme.typography.button.weight};
  line-height: ${({ theme }) => theme.typography.button.lineHeight}px;
`;

export interface PaginationProps {
  page: number;
  pageCount: number;
  summary: string;
  onPageChange: (page: number) => void;
  className?: string;
}

function getPageItems(page: number, pageCount: number): PageItem[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, index) => index + 1);

  const pages = new Set([1, pageCount, page - 1, page, page + 1].filter(value => value >= 1 && value <= pageCount));
  const ordered = [...pages].sort((a, b) => a - b);
  const items: PageItem[] = [];

  ordered.forEach((value, index) => {
    if (index > 0 && value - ordered[index - 1] > 1) items.push('ellipsis');
    items.push(value);
  });

  return items;
}

export function Pagination({ page, pageCount, summary, onPageChange, className }: PaginationProps) {
  const safePageCount = Math.max(0, Math.floor(pageCount));
  const safePage = safePageCount === 0 ? 0 : Math.min(safePageCount, Math.max(1, Math.floor(page)));
  const pages = safePage === 0 ? [] : getPageItems(safePage, safePageCount);

  if (safePageCount === 0) return null;

  return (
    <Bar className={className} aria-label="페이지 이동">
      <Summary>{summary}</Summary>
      <Controls>
        <PageButton type="button" aria-label="이전 페이지" disabled={safePage === 1} onClick={() => onPageChange(safePage - 1)}>
          <Octicon name="arrow-left" size={16} aria-hidden="true" />
        </PageButton>
        <PageList>
          {pages.map((item, index) => item === 'ellipsis' ? (
            <Ellipsis key={`ellipsis-${index}`} aria-hidden="true">…</Ellipsis>
          ) : (
            <PageButton
              key={item}
              type="button"
              $current={item === safePage}
              aria-label={`${item}페이지`}
              aria-current={item === safePage ? 'page' : undefined}
              onClick={() => onPageChange(item)}
            >
              {item}
            </PageButton>
          ))}
        </PageList>
        <PageButton type="button" aria-label="다음 페이지" disabled={safePage === safePageCount} onClick={() => onPageChange(safePage + 1)}>
          <Octicon name="arrow-right" size={16} aria-hidden="true" />
        </PageButton>
      </Controls>
    </Bar>
  );
}
