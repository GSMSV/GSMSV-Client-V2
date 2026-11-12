import styled from 'styled-components';
import { Button, NavigationItem } from '../../../shared/ui/controls';
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

const Sidebar = styled.aside`
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

const SidebarActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[8]}px;
  margin-top: auto;
`;

interface StudentSidebarProps {
  activeItem: StudentNavigationKey;
  onNavigate: (item: Exclude<StudentNavigationKey, 'none'>) => void;
  onCreateTeam: () => void;
  onOpenStatus: () => void;
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

export function StudentSidebar({ activeItem, onNavigate, onCreateTeam, onOpenStatus }: StudentSidebarProps) {
  return (
    <Sidebar aria-label="학생 메뉴">
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
            onClick={() => onNavigate(key)}
          />
        ))}
      </Navigation>
      <SidebarActions>
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
