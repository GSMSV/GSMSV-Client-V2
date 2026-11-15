import type { ReactNode } from 'react';
import styled from 'styled-components';
import { Octicon, type OcticonName } from '../../../shared/ui/icons';

export type StatePanelTone = 'primary' | 'warning' | 'danger' | 'neutral';

const Panel = styled.div`
  box-sizing: border-box;
  display: flex;
  width: min(480px, calc(100vw - 32px));
  flex-direction: column;
  gap: ${({ theme }) => theme.space[16]}px;
  padding: ${({ theme }) => theme.space[24]}px;
  overflow-wrap: anywhere;
`;

const Heading = styled.div<{ $tone: StatePanelTone }>`
  display: flex;
  align-items: center;
  gap: 12px;
  color: ${({ theme, $tone }) => $tone === 'primary' ? theme.colors.primary : $tone === 'warning' ? theme.colors.warning : $tone === 'danger' ? theme.colors.danger : theme.colors.text};

  svg { flex: none; }
`;

const Title = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme: { typography: { h2 } } }) => `${h2.weight} ${h2.size}px/${h2.lineHeight}px ${h2.family}`}, sans-serif;
`;

export const StatePanelCopy = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme: { typography: { bodySmall } } }) => `${bodySmall.weight} ${bodySmall.size}px/${bodySmall.lineHeight}px ${bodySmall.family}`}, sans-serif;
  white-space: pre-line;
`;

export const StatePanelCaption = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.faint};
  font: ${({ theme: { typography: { caption } } }) => `${caption.weight} ${caption.size}px/${caption.lineHeight}px ${caption.family}`}, sans-serif;
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.space[8]}px;
`;

/** S03 · 공통 예외 패널. 다이얼로그 안이나 페이지 카드로 같은 모양을 쓴다. */
export function StatePanel({ titleId, icon, tone = 'primary', title, children, actions, footer }: {
  titleId?: string;
  icon: OcticonName;
  tone?: StatePanelTone;
  title: string;
  children?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Panel>
      <Heading $tone={tone}><Octicon name={icon} size={24} aria-hidden="true" /><Title id={titleId}>{title}</Title></Heading>
      {children}
      {actions && <Actions>{actions}</Actions>}
      {footer}
    </Panel>
  );
}
