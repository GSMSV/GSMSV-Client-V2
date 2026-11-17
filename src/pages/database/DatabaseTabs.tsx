import styled from 'styled-components';

// Figma "Navigation / default · active" (URL tabs on Database 44–47).
export const DatabaseTabs = styled.nav`
  display: flex;
  min-width: 0;
  max-width: 100%;
  align-items: center;
  gap: 8px;

  @media (max-width: 600px) {
    overflow-x: auto;
    overscroll-behavior-x: contain;
    scrollbar-width: thin;
  }
`;

export const DatabaseTab = styled.button<{ $active?: boolean }>`
  display: inline-flex;
  flex: 0 0 auto;
  height: ${({ theme }) => theme.size.control}px;
  align-items: center;
  padding: 0 16px;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme, $active }) => $active ? theme.colors.primarySoft : 'transparent'};
  color: ${({ theme, $active }) => $active ? theme.colors.primary : theme.colors.muted};
  font: ${({ theme }) => theme.typography.button.weight} ${({ theme }) => theme.typography.button.size}px/${({ theme }) => theme.typography.button.lineHeight}px ${({ theme }) => theme.typography.button.family}, sans-serif;
  white-space: nowrap;
  cursor: pointer;

  &:hover:not(:disabled) { background: ${({ theme, $active }) => $active ? theme.colors.primarySoft : theme.colors.overlayHover}; }
  &:active:not(:disabled) { background: ${({ theme, $active }) => $active ? theme.colors.primarySoft : theme.colors.overlayPressed}; }
  &:disabled { opacity: 1; cursor: not-allowed; }
  &:focus-visible { outline: 2px solid ${({ theme }) => theme.colors.primary}; outline-offset: 2px; }
`;
