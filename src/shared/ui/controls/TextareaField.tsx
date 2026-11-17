import { useId, type TextareaHTMLAttributes } from 'react';
import styled, { css } from 'styled-components';

export interface TextareaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

const FieldGroup = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[8]}px;
`;

const FieldLabel = styled.label`
  color: ${({ theme }) => theme.colors.text};
  font-family: ${({ theme }) => theme.typography.label.family}, sans-serif;
  font-size: ${({ theme }) => theme.typography.label.size}px;
  font-weight: ${({ theme }) => theme.typography.label.weight};
  line-height: ${({ theme }) => theme.typography.label.lineHeight}px;
`;

const FieldTextarea = styled.textarea<{ $invalid: boolean }>`
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  min-height: 100px;
  padding: 12px;
  border: 1px solid ${({ theme, $invalid }) => $invalid ? theme.colors.danger : theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.base}px;
  outline: none;
  color: ${({ theme }) => theme.colors.text};
  background: ${({ theme }) => theme.colors.field};
  font-family: ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
  font-size: ${({ theme }) => theme.typography.bodySmall.size}px;
  font-weight: ${({ theme }) => theme.typography.bodySmall.weight};
  line-height: ${({ theme }) => theme.typography.bodySmall.lineHeight}px;
  resize: vertical;

  &:focus { border: 2px solid ${({ theme, $invalid }) => $invalid ? theme.colors.danger : theme.colors.primary}; }
  &:disabled { cursor: not-allowed; opacity: 0.65; }

  ${({ $invalid, theme }) => $invalid && css`
    &:focus { border-color: ${theme.colors.danger}; }
  `}
`;

const Message = styled.span<{ $error: boolean }>`
  color: ${({ theme, $error }) => $error ? theme.colors.danger : theme.colors.muted};
  font-family: ${({ theme }) => theme.typography.caption.family}, sans-serif;
  font-size: ${({ theme }) => theme.typography.caption.size}px;
  font-weight: ${({ theme }) => theme.typography.caption.weight};
  line-height: ${({ theme }) => theme.typography.caption.lineHeight}px;
`;

export function TextareaField({ id, label, hint, error, disabled, ...props }: TextareaFieldProps) {
  const generatedId = useId();
  const inputId = id ?? props.name ?? `textarea-${generatedId}`;
  const messageId = `${inputId}-message`;

  return <FieldGroup>
    {label && <FieldLabel htmlFor={inputId}>{label}</FieldLabel>}
    <FieldTextarea {...props} id={inputId} disabled={disabled} $invalid={Boolean(error)}
      aria-invalid={error ? 'true' : undefined}
      aria-describedby={hint || error ? messageId : props['aria-describedby']} />
    {(error || hint) && <Message id={messageId} $error={Boolean(error)} role={error ? 'alert' : undefined}>{error ?? hint}</Message>}
  </FieldGroup>;
}
