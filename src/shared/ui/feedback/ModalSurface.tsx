import { useLayoutEffect, useRef, type ReactNode } from 'react';
import styled from 'styled-components';

const Dialog = styled.dialog`
  width: fit-content;
  max-width: calc(100% - 32px);
  padding: 0;
  overflow: auto;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};

  &::backdrop {
    background: rgb(0 0 0 / 54%);
  }
`;

export function ModalSurface({ labelledBy, onDismiss, children }: {
  labelledBy: string;
  onDismiss?: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useLayoutEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  return (
    <Dialog ref={ref} aria-labelledby={labelledBy} onCancel={event => {
      event.preventDefault();
      onDismiss?.();
    }}>
      {children}
    </Dialog>
  );
}
