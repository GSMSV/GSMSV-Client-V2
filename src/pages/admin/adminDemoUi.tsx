import type { ReactNode } from 'react';
import styled from 'styled-components';
import { Octicon, type OcticonName } from '../../shared/ui/icons';

// Figma 27·29·30·49 관리자 화면에서 함께 쓰는 탭·상태 필터·지표 카드·상태 글자.

export const AdminTabsRow = styled.div`
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  @media (max-width: 560px) { align-items: stretch; flex-direction: column; }
`;

export const AdminTabs = styled.nav`
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  gap: 8px;
`;

export const AdminTab = styled.button<{ $active?: boolean }>`
  display: inline-flex;
  min-height: 42px;
  align-items: center;
  gap: 4px;
  padding: 0 12px;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme, $active }) => $active ? theme.colors.primarySoft : 'transparent'};
  color: ${({ theme, $active }) => $active ? theme.colors.primary : theme.colors.text};
  font: ${({ theme }) => theme.typography.button.weight} ${({ theme }) => theme.typography.button.size}px/${({ theme }) => theme.typography.button.lineHeight}px ${({ theme }) => theme.typography.button.family}, sans-serif;
  white-space: nowrap;
  cursor: pointer;

  &:hover:not([aria-current='page']) { background: ${({ theme }) => theme.colors.overlayHover}; }
  &:focus-visible { outline: 2px solid ${({ theme }) => theme.colors.primary}; outline-offset: 2px; }
`;

export const AdminCount = styled.span`
  color: ${({ theme }) => theme.colors.primary};
`;

export const AdminSegmented = styled.div`
  display: inline-flex;
  min-width: 0;
  flex-wrap: wrap;
  gap: 4px;
  padding: 4px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.raised};
`;

export const AdminSegment = styled.button<{ $active?: boolean }>`
  display: inline-flex;
  min-width: 112px;
  min-height: 34px;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme, $active }) => $active ? theme.colors.primarySoft : 'transparent'};
  color: ${({ theme, $active }) => $active ? theme.colors.primary : theme.colors.muted};
  font: ${({ theme }) => theme.typography.button.weight} ${({ theme }) => theme.typography.button.size}px/${({ theme }) => theme.typography.button.lineHeight}px ${({ theme }) => theme.typography.button.family}, sans-serif;
  white-space: nowrap;
  cursor: pointer;

  &:focus-visible { outline: 2px solid ${({ theme }) => theme.colors.primary}; outline-offset: 2px; }
  @media (max-width: 480px) { min-width: 0; }
`;

export const AdminStats = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;

  @media (max-width: 720px) { grid-template-columns: minmax(0, 1fr); }
`;

const StatCard = styled.div`
  display: flex;
  min-width: 0;
  min-height: 150px;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};
`;

const StatLabel = styled.span`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.label.weight} ${({ theme }) => theme.typography.label.size}px/${({ theme }) => theme.typography.label.lineHeight}px ${({ theme }) => theme.typography.label.family}, sans-serif;
`;

const StatValue = styled.strong`
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.h2.weight} ${({ theme }) => theme.typography.h2.size}px/${({ theme }) => theme.typography.h2.lineHeight}px ${({ theme }) => theme.typography.h2.family}, sans-serif;
`;

const StatCaption = styled.span`
  color: ${({ theme }) => theme.colors.faint};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

export function AdminStat({ icon, label, value, caption }: { icon?: OcticonName; label: string; value: ReactNode; caption: ReactNode }) {
  return (
    <StatCard>
      <StatLabel>{icon && <Octicon name={icon} size={16} aria-hidden="true" />}{label}</StatLabel>
      <StatValue>{value}</StatValue>
      <StatCaption>{caption}</StatCaption>
    </StatCard>
  );
}

export type AdminStatusTone = 'muted' | 'warning' | 'success' | 'danger';

export const AdminStatusText = styled.span<{ $tone: AdminStatusTone }>`
  color: ${({ theme, $tone }) => $tone === 'success' ? theme.colors.primary : $tone === 'danger' ? theme.colors.danger : $tone === 'warning' ? theme.colors.warning : theme.colors.muted};
  white-space: nowrap;
`;

export const AdminCriteria = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;

  strong {
    color: ${({ theme }) => theme.colors.text};
    font: 500 14px/20px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
  }
  p {
    margin: 0;
    color: ${({ theme }) => theme.colors.muted};
    font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
  }
`;
