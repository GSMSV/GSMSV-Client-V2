import { useId, type ReactNode } from 'react';
import styled from 'styled-components';
import { ModalSurface } from '../../../../shared/ui/feedback/ModalSurface';
import { Octicon, type OcticonName } from '../../../../shared/ui/icons';

const Panel = styled.div<{ $wide: boolean }>`
  display: flex;
  width: min(${({ $wide }) => $wide ? 640 : 480}px, calc(100vw - 32px));
  flex-direction: column;
  gap: ${({ theme }) => theme.space[16]}px;
  padding: ${({ theme }) => theme.space[24]}px;
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[8]}px;

  svg { flex: none; }
`;

const Title = styled.h2`
  margin: 0;
  font: ${({ theme: { typography: { h2 } } }) => `${h2.weight} ${h2.size}px/${h2.lineHeight}px ${h2.family}`}, sans-serif;
`;

export const DialogCopy = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  white-space: pre-line;
  overflow-wrap: anywhere;
  font: ${({ theme: { typography: { bodySmall } } }) => `${bodySmall.weight} ${bodySmall.size}px/${bodySmall.lineHeight}px ${bodySmall.family}`}, sans-serif;
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.space[8]}px;
`;

export function AccountDialog({ title, icon, description, children, actions, onDismiss, wide = false }: {
  title: string;
  icon: OcticonName;
  description?: string;
  children?: ReactNode;
  actions: ReactNode;
  onDismiss?: () => void;
  wide?: boolean;
}) {
  const titleId = useId();
  return (
    <ModalSurface labelledBy={titleId} onDismiss={onDismiss}>
      <Panel $wide={wide}>
        <Header><Octicon name={icon} size={24} aria-hidden="true" /><Title id={titleId}>{title}</Title></Header>
        {description && <DialogCopy>{description}</DialogCopy>}
        {children}
        <Actions>{actions}</Actions>
      </Panel>
    </ModalSurface>
  );
}
