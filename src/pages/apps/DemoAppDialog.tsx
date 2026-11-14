import { useEffect, useRef, type ReactNode } from "react";
import styled from "styled-components";
import { Button } from "../../shared/ui/controls";

const Panel = styled.dialog`
  width: min(480px, calc(100% - 32px));
  padding: 24px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};

  &::backdrop { background: rgb(0 0 0 / 60%); }
`;

const Title = styled.h2`
  margin: 0 0 16px;
  font-size: ${({ theme }) => theme.typography.h2.size}px;
`;

const Copy = styled.div`
  color: ${({ theme }) => theme.colors.muted};
  font-size: ${({ theme }) => theme.typography.bodySmall.size}px;
  line-height: ${({ theme }) => theme.typography.bodySmall.lineHeight}px;
  white-space: pre-line;
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
`;

export function DemoAppDialog({
  title, children, confirmLabel, onConfirm, onClose,
}: {
  title: string;
  children: ReactNode;
  confirmLabel?: string;
  onConfirm?: () => void;
  onClose: () => void;
}) {
  return (
    <Modal onClose={onClose}>
      <Title id="demo-app-dialog-title">{title}</Title>
      <Copy>{children}</Copy>
      <Actions>
        <Button variant="secondary" onClick={onClose}>{onConfirm ? "취소" : "확인"}</Button>
        {onConfirm && <Button onClick={onConfirm}>{confirmLabel}</Button>}
      </Actions>
    </Modal>
  );
}

export function Modal({ children, onClose, titleId = "demo-app-dialog-title" }: {
  children: ReactNode;
  onClose: () => void;
  titleId?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <Panel ref={ref} aria-labelledby={titleId} onCancel={event => {
      event.preventDefault();
      onClose();
    }}>
      {children}
    </Panel>
  );
}
