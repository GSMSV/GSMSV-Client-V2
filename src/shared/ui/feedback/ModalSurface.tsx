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

export function ModalSurface({ labelledBy, onDismiss, dismissOnBackdrop = false, children }: {
  labelledBy: string;
  onDismiss?: () => void;
  dismissOnBackdrop?: boolean;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const pressedBackdrop = useRef(false);

  useLayoutEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  return (
    <Dialog
      ref={ref}
      aria-labelledby={labelledBy}
      onCancel={event => {
        event.preventDefault();
        onDismiss?.();
      }}
      onPointerDown={dismissOnBackdrop ? event => {
        pressedBackdrop.current = event.target === event.currentTarget;
      } : undefined}
      onClick={dismissOnBackdrop ? event => {
        if (pressedBackdrop.current && event.target === event.currentTarget) onDismiss?.();
        pressedBackdrop.current = false;
      } : undefined}
    >
      {children}
    </Dialog>
  );
}
