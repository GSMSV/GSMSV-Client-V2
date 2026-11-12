import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import styled from 'styled-components';

interface SharedProps {
  label: string;
  icon?: ReactNode;
  active?: boolean;
}

export type NavigationItemProps = SharedProps & (
  | ({ href: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'children'>)
  | ({ href?: undefined } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>)
);

const NavigationBase = styled.a<{ $active: boolean }>`
  display: inline-flex;
  box-sizing: border-box;
  width: 184px;
  min-height: ${({ theme }) => theme.size.control}px;
  align-items: center;
  gap: ${({ theme }) => theme.space[8]}px;
  padding: 0 ${({ theme }) => theme.space[16]}px;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.base}px;
  color: ${({ theme, $active }) => ($active ? theme.colors.primary : theme.colors.muted)};
  background: ${({ theme, $active }) => ($active ? theme.colors.primarySoft : 'transparent')};
  font-family: ${({ theme }) => theme.typography.button.family}, sans-serif;
  font-size: ${({ theme }) => theme.typography.button.size}px;
  font-weight: ${({ theme }) => theme.typography.button.weight};
  line-height: ${({ theme }) => theme.typography.button.lineHeight}px;
  text-decoration: none;
  cursor: pointer;

  &:hover:not([aria-current='page']) {
    background: ${({ theme }) => theme.colors.overlayHover};
  }

  &:active {
    background: ${({ theme }) => theme.colors.overlayPressed};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 1px;
  }
`;

const NavigationButton = styled.button<{ $active: boolean }>`
  display: inline-flex;
  box-sizing: border-box;
  width: 184px;
  min-height: ${({ theme }) => theme.size.control}px;
  align-items: center;
  gap: ${({ theme }) => theme.space[8]}px;
  padding: 0 ${({ theme }) => theme.space[16]}px;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.base}px;
  color: ${({ theme, $active }) => ($active ? theme.colors.primary : theme.colors.muted)};
  background: ${({ theme, $active }) => ($active ? theme.colors.primarySoft : 'transparent')};
  font-family: ${({ theme }) => theme.typography.button.family}, sans-serif;
  font-size: ${({ theme }) => theme.typography.button.size}px;
  font-weight: ${({ theme }) => theme.typography.button.weight};
  line-height: ${({ theme }) => theme.typography.button.lineHeight}px;
  text-align: left;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.overlayHover};
  }

  &:active:not(:disabled) {
    background: ${({ theme }) => theme.colors.overlayPressed};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 1px;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.65;
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

const Label = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export function NavigationItem({ label, icon, active = false, href, ...props }: NavigationItemProps) {
  const children = <>{icon && <IconSlot aria-hidden="true">{icon}</IconSlot>}<Label>{label}</Label></>;

  if (href) {
    return (
      <NavigationBase href={href} $active={active} aria-current={active ? 'page' : undefined} {...props as AnchorHTMLAttributes<HTMLAnchorElement>}>
        {children}
      </NavigationBase>
    );
  }

  return (
    <NavigationButton type="button" $active={active} aria-current={active ? 'page' : undefined} {...props as ButtonHTMLAttributes<HTMLButtonElement>}>
      {children}
    </NavigationButton>
  );
}
