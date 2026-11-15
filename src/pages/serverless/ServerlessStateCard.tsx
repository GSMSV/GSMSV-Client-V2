import type { ReactNode } from 'react';
import styled from 'styled-components';
import { Octicon, type OcticonName } from '../../shared/ui/icons';

export type ServerlessStateTone = 'primary' | 'warning' | 'danger';

const Surface = styled.section<{ $floating: boolean }>`
  box-sizing: border-box;
  display: flex;
  width: min(480px, 100%);
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};
  ${({ $floating }) => $floating ? 'width: min(480px, calc(100vw - 48px));' : ''}

  @media (max-width: 600px) { padding: 20px 16px; }
`;

const Header = styled.div`
  display: flex;
  min-height: 34px;
  align-items: center;
  gap: 12px;
`;

const IconSlot = styled.span<{ $tone: ServerlessStateTone }>`
  display: inline-flex;
  flex: 0 0 24px;
  color: ${({ theme, $tone }) => $tone === 'warning' ? theme.colors.warning : $tone === 'danger' ? theme.colors.danger : theme.colors.primary};
`;

const Title = styled.h2`
  min-width: 0;
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.h2.weight} ${({ theme }) => theme.typography.h2.size}px/${({ theme }) => theme.typography.h2.lineHeight}px ${({ theme }) => theme.typography.h2.family}, sans-serif;
`;

export const StateCopy = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

export const StateField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const StateFieldLabel = styled.span`
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.label.weight} ${({ theme }) => theme.typography.label.size}px/${({ theme }) => theme.typography.label.lineHeight}px ${({ theme }) => theme.typography.label.family}, sans-serif;
`;

export const StateFieldValue = styled.output<{ $code?: boolean; $error?: boolean }>`
  box-sizing: border-box;
  display: flex;
  min-height: 42px;
  align-items: center;
  padding: 0 16px;
  border: 1px solid ${({ theme, $error }) => $error ? theme.colors.danger : 'transparent'};
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.field};
  color: ${({ theme, $error }) => $error ? theme.colors.text : theme.colors.muted};
  font: ${({ theme, $code }) => $code
    ? `${theme.typography.code.weight} ${theme.typography.code.size}px/${theme.typography.code.lineHeight}px ${theme.typography.code.family}, monospace`
    : `${theme.typography.bodySmall.weight} ${theme.typography.bodySmall.size}px/${theme.typography.bodySmall.lineHeight}px ${theme.typography.bodySmall.family}, sans-serif`};
  overflow-wrap: anywhere;
`;

export const StateFieldError = styled.span`
  color: ${({ theme }) => theme.colors.danger};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const Actions = styled.footer`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
`;

const Caption = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.faint};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

export interface ServerlessStateCardProps {
  titleId?: string;
  icon: OcticonName;
  tone?: ServerlessStateTone;
  title: string;
  children?: ReactNode;
  actions?: ReactNode;
  caption?: string;
  /** 모달 안에 놓일 때 화면 폭에 맞춘다. */
  floating?: boolean;
  className?: string;
}

/** Figma 상태 패널(아이콘 제목 · 설명 · 항목 · 동작 · 캡션) 공통 카드. 빈 상태와 대화상자에 함께 쓴다. */
export function ServerlessStateCard({ titleId, icon, tone = 'primary', title, children, actions, caption, floating = false, className }: ServerlessStateCardProps) {
  return (
    <Surface $floating={floating} className={className} aria-labelledby={titleId}>
      <Header>
        <IconSlot $tone={tone} aria-hidden="true"><Octicon name={icon} size={24} /></IconSlot>
        <Title id={titleId}>{title}</Title>
      </Header>
      {children}
      {actions && <Actions>{actions}</Actions>}
      {caption && <Caption>{caption}</Caption>}
    </Surface>
  );
}
