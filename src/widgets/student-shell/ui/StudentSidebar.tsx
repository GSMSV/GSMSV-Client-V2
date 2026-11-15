import type { KeyboardEventHandler, RefObject } from 'react';
import styled from 'styled-components';
import { Button, NavigationItem } from '../../../shared/ui/controls';
import { mobileNavigationMedia } from '../../../shared/ui/controls/useResponsiveNavigation';
import { Octicon } from '../../../shared/ui/icons';

export type StudentNavigationKey =
  | 'home'
  | 'vm-create'
  | 'serverless'
  | 'database'
  | 'apps'
  | 'team'
  | 'docs'
  | 'support'
  | 'settings'
  | 'none';

const Sidebar = styled.aside<{ $open: boolean }>`
  position: sticky;
  top: 0;
  display: flex;
  width: 216px;
  height: 100vh;
  min-height: 100vh;
  flex: 0 0 216px;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[8]}px;
  padding: 28px ${({ theme }) => theme.space[16]}px ${({ theme }) => theme.space[16]}px;
  background: ${({ theme }) => theme.colors.sidebar};

  @media ${mobileNavigationMedia} {
    position: fixed;
    z-index: 80;
    inset: 0 auto 0 0;
    width: min(280px, calc(100vw - 48px));
    height: 100dvh;
    min-height: 0;
    max-height: 100dvh;
    overflow-y: auto;
    box-shadow: 0 16px 40px rgb(0 0 0 / 35%);
    transform: translateX(${({ $open }) => $open ? '0' : '-105%'});
    visibility: ${({ $open }) => $open ? 'visible' : 'hidden'};
    transition: transform 180ms ease, visibility 180ms;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const Brand = styled.div`
  display: flex;
  width: 184px;
  min-height: 34px;
  flex: 0 0 auto;
  align-items: center;
  gap: ${({ theme }) => theme.space[8]}px;
  padding: 0 12px;
`;

const Logo = styled.img`
  display: block;
  width: 24px;
  height: 24px;
  flex: 0 0 24px;
`;

const BrandName = styled.span`
  color: ${({ theme }) => theme.colors.text};
  font-family: ${({ theme }) => theme.typography.h2.family}, sans-serif;
  font-size: ${({ theme }) => theme.typography.h2.size}px;
  font-weight: ${({ theme }) => theme.typography.h2.weight};
  line-height: ${({ theme }) => theme.typography.h2.lineHeight}px;
`;

const BrandSpacer = styled.div`
  height: 16px;
  flex: 0 0 16px;
`;

const Navigation = styled.nav`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[8]}px;
`;

const NavigationDivider = styled.div`
  width: 184px;
  height: 1px;
  margin: ${({ theme }) => theme.space[8]}px 0;
  background: ${({ theme }) => theme.colors.border};
`;

const SidebarActions = styled.div<{ $atBottom: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space[8]}px;
  margin-top: ${({ $atBottom }) => $atBottom ? 'auto' : '0'};
  padding-top: ${({ $atBottom }) => $atBottom ? '0' : '60px'};
`;

interface StudentSidebarProps {
  sidebarRef?: RefObject<HTMLElement | null>;
  open?: boolean;
  onKeyDown?: KeyboardEventHandler<HTMLElement>;
  activeItem: StudentNavigationKey;
  onNavigate: (item: Exclude<StudentNavigationKey, 'none'>) => void;
  onCreateTeam: () => void;
  onOpenStatus: () => void;
  disabledItems?: readonly StudentNavigationKey[];
  disabledReasons?: Partial<Record<StudentNavigationKey, string>>;
  actionsAtBottom?: boolean;
}

const primaryNavigation = [
  { key: 'home', label: '홈', icon: 'home' },
  { key: 'vm-create', label: 'VM 생성', icon: 'plus' },
  { key: 'serverless', label: 'Serverless', icon: 'zap' },
  { key: 'database', label: 'Database', icon: 'database' },
  { key: 'apps', label: 'Apps', icon: 'code' },
  { key: 'team', label: '팀', icon: 'people' },
] as const;

const secondaryNavigation = [
  { key: 'docs', label: 'Docs', icon: 'book' },
  { key: 'support', label: '문의', icon: 'comment-discussion' },
  { key: 'settings', label: '설정', icon: 'gear' },
] as const;

export function StudentSidebar({ sidebarRef, open = false, onKeyDown, activeItem, onNavigate, onCreateTeam, onOpenStatus, disabledItems = [], disabledReasons = {}, actionsAtBottom = false }: StudentSidebarProps) {
  return (
    <Sidebar id="student-navigation" ref={sidebarRef} $open={open} onKeyDown={onKeyDown} aria-label="학생 메뉴">
      <Brand>
        <Logo src="/assets/gsmsv-logo.svg" alt="" />
        <BrandName>GSM SV</BrandName>
      </Brand>
      <BrandSpacer aria-hidden="true" />
      <Navigation>
        {primaryNavigation.map(({ key, label, icon }) => (
          <NavigationItem
            key={key}
            label={label}
            icon={<Octicon name={icon} size={16} />}
            active={activeItem === key}
            disabled={disabledItems.includes(key)}
            title={disabledItems.includes(key) ? disabledReasons[key] ?? '아직 제공되지 않는 기능입니다' : undefined}
            onClick={() => onNavigate(key)}
          />
        ))}
        <NavigationDivider aria-hidden="true" />
        {secondaryNavigation.map(({ key, label, icon }) => (
          <NavigationItem
            key={key}
            label={label}
            icon={<Octicon name={icon} size={16} />}
            active={activeItem === key}
            disabled={disabledItems.includes(key)}
            title={disabledItems.includes(key) ? disabledReasons[key] ?? '아직 제공되지 않는 기능입니다' : undefined}
            onClick={() => onNavigate(key)}
          />
        ))}
      </Navigation>
      <SidebarActions $atBottom={actionsAtBottom}>
        <Button variant="secondary" icon={<Octicon name="plus" size={16} />} onClick={onCreateTeam}>
          팀 만들기
        </Button>
        <Button variant="ghost" icon={<Octicon name="pulse" size={16} />} onClick={onOpenStatus}>
          서비스 상태
        </Button>
      </SidebarActions>
    </Sidebar>
  );
}
