import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styled, { css } from 'styled-components';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  icon?: ReactNode;
  iconPosition?: 'start' | 'end';
}

const variantStyles = {
  primary: css`
    color: ${({ theme }) => theme.colors.onPrimary};
    background: ${({ theme }) => theme.colors.primary};

    &:hover:not(:disabled) {
      background: ${({ theme }) => theme.colors.primaryHover};
    }

    &:active:not(:disabled) {
      background: ${({ theme }) => theme.colors.primaryPressed};
    }
  `,
  secondary: css`
    color: ${({ theme }) => theme.colors.text};
    background: ${({ theme }) => theme.colors.raised};

    &:hover:not(:disabled) {
      background: ${({ theme }) => theme.colors.raisedHover};
    }

    &:active:not(:disabled) {
      background: ${({ theme }) => theme.colors.raisedPressed};
    }
  `,
  ghost: css`
    color: ${({ theme }) => theme.colors.text};
    background: transparent;

    &:hover:not(:disabled) {
      background: ${({ theme }) => theme.colors.overlayHover};
    }

    &:active:not(:disabled) {
      background: ${({ theme }) => theme.colors.overlayPressed};
    }
  `,
  danger: css`
    color: ${({ theme }) => theme.colors.danger};
    background: ${({ theme }) => theme.colors.dangerSoft};

    &:hover:not(:disabled) {
      background: ${({ theme }) => theme.colors.dangerSoftHover};
    }

    &:active:not(:disabled) {
      background: ${({ theme }) => theme.colors.dangerSoftPressed};
    }
  `,
} satisfies Record<ButtonVariant, ReturnType<typeof css>>;

const StyledButton = styled.button<{ $variant: ButtonVariant; $hasIcon: boolean }>`
  display: inline-flex;
  min-height: ${({ theme }) => theme.size.control}px;
  align-items: center;
  justify-content: center;
  gap: ${({ theme, $hasIcon }) => ($hasIcon ? `${theme.space[8]}px` : '0')};
  padding: 0 ${({ theme }) => theme.space[16]}px;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.base}px;
  font-family: ${({ theme }) => theme.typography.button.family}, sans-serif;
  font-size: ${({ theme }) => theme.typography.button.size}px;
  font-weight: ${({ theme }) => theme.typography.button.weight};
  line-height: ${({ theme }) => theme.typography.button.lineHeight}px;
  letter-spacing: ${({ theme }) => theme.typography.button.letterSpacing}px;
  text-align: center;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 120ms ease;
  ${({ $variant }) => variantStyles[$variant]}

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }

  &:disabled {
    color: ${({ theme }) => theme.colors.faint};
    background: ${({ theme }) => theme.colors.raised};
    cursor: not-allowed;
  }
`;

const IconSlot = styled.span`
  display: inline-flex;
  width: 16px;
  height: 16px;
  flex: 0 0 16px;
  align-items: center;
  justify-content: center;

  & > svg {
    width: 100%;
    height: 100%;
  }
`;

export function Button({
  variant = 'primary',
  icon,
  iconPosition = 'start',
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <StyledButton type={type} $variant={variant} $hasIcon={Boolean(icon)} {...props}>
      {icon && iconPosition === 'start' && <IconSlot aria-hidden="true">{icon}</IconSlot>}
      {children}
      {icon && iconPosition === 'end' && <IconSlot aria-hidden="true">{icon}</IconSlot>}
    </StyledButton>
  );
}
