import { useId, type InputHTMLAttributes } from 'react';
import styled, { css } from 'styled-components';

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
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

const FieldInput = styled.input<{ $invalid: boolean }>`
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  height: ${({ theme }) => theme.size.control}px;
  padding: 0 ${({ theme }) => theme.space[16]}px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.base}px;
  outline: none;
  color: ${({ theme }) => theme.colors.text};
  background: ${({ theme }) => theme.colors.field};
  font-family: ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
  font-size: ${({ theme }) => theme.typography.bodySmall.size}px;
  font-weight: ${({ theme }) => theme.typography.bodySmall.weight};
  line-height: ${({ theme }) => theme.typography.bodySmall.lineHeight}px;

  &::placeholder {
    color: ${({ theme }) => theme.colors.faint};
    opacity: 1;
  }

  &:hover:not(:disabled):not(:focus) {
    border-color: ${({ theme }) => theme.colors.faint};
  }

  &:focus {
    border: 2px solid ${({ theme }) => theme.colors.primary};
  }

  ${({ $invalid, theme }) =>
    $invalid &&
    css`
      border-color: ${theme.colors.danger};

      &:focus {
        border-width: 2px;
        border-color: ${theme.colors.danger};
      }
    `}

  &:disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }
`;

const FieldMessage = styled.p<{ $error: boolean }>`
  margin: 0;
  color: ${({ theme, $error }) => ($error ? theme.colors.danger : theme.colors.muted)};
  font-family: ${({ theme }) => theme.typography.caption.family}, sans-serif;
  font-size: ${({ theme }) => theme.typography.caption.size}px;
  font-weight: ${({ theme }) => theme.typography.caption.weight};
  line-height: ${({ theme }) => theme.typography.caption.lineHeight}px;
`;

export function TextField({ id, label, hint, error, disabled, ...props }: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? props.name ?? `field-${generatedId}`;
  const messageId = inputId ? `${inputId}-message` : undefined;

  return (
    <FieldGroup>
      {label && <FieldLabel htmlFor={inputId}>{label}</FieldLabel>}
      <FieldInput
        {...props}
        id={inputId}
        disabled={disabled}
        $invalid={Boolean(error)}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={hint || error ? messageId : props['aria-describedby']}
      />
      {(error || hint) && (
        <FieldMessage id={messageId} $error={Boolean(error)} role={error ? 'alert' : undefined}>
          {error ?? hint}
        </FieldMessage>
      )}
    </FieldGroup>
  );
}
