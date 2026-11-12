import styled from 'styled-components';
import { Button } from '../../../shared/ui/controls';
import { Octicon } from '../../../shared/ui/icons';

const Header = styled.header`
  display: flex;
  width: 100%;
  min-height: 74px;
  flex: 0 0 74px;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.space[16]}px 40px;
`;

const HeaderContent = styled.div`
  display: flex;
  width: 100%;
  max-width: 1144px;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[16]}px;
  margin: 0 auto;
`;

const HeaderStart = styled.div`
  display: flex;
  min-width: 0;
  flex: 1;
  align-items: center;
  gap: ${({ theme }) => theme.space[16]}px;
`;

const ScopeTrigger = styled.button`
  display: inline-flex;
  width: 220px;
  height: 42px;
  flex: 0 0 220px;
  align-items: center;
  gap: ${({ theme }) => theme.space[8]}px;
  padding: 0 ${({ theme }) => theme.space[16]}px;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.field};
  color: ${({ theme }) => theme.colors.text};
  font-family: ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
  font-size: ${({ theme }) => theme.typography.bodySmall.size}px;
  line-height: ${({ theme }) => theme.typography.bodySmall.lineHeight}px;
  text-align: left;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }
`;

const ScopeText = styled.span`
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const SearchAction = styled(Button)`
  width: 520px;
  min-width: 180px;
  justify-content: flex-start;
  overflow: hidden;
  color: ${({ theme }) => theme.colors.text};
`;

const RightActions = styled.div`
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: ${({ theme }) => theme.space[16]}px;
`;

const ActionLabel = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
`;

const Count = styled.span`
  color: ${({ theme }) => theme.colors.primary};
`;

export interface StudentTopbarProps {
  scopeLabel: string;
  userName: string;
  notificationCount?: number;
  onSelectScope: () => void;
  onSearch: () => void;
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
}

export function StudentTopbar({
  scopeLabel,
  userName,
  notificationCount,
  onSelectScope,
  onSearch,
  onOpenNotifications,
  onOpenProfile,
}: StudentTopbarProps) {
  return (
    <Header>
      <HeaderContent>
        <HeaderStart>
          <ScopeTrigger type="button" aria-haspopup="listbox" onClick={onSelectScope}>
            <ScopeText>{scopeLabel}</ScopeText>
            <Octicon name="chevron-down" size={16} />
          </ScopeTrigger>
          <SearchAction variant="secondary" icon={<Octicon name="search" size={16} />} onClick={onSearch}>
            이름 또는 GRN으로 검색
          </SearchAction>
        </HeaderStart>
        <RightActions>
          <Button variant="ghost" icon={<Octicon name="bell" size={16} />} onClick={onOpenNotifications}>
            <ActionLabel>
              알림{notificationCount !== undefined && notificationCount > 0 && <Count>{notificationCount}</Count>}
            </ActionLabel>
          </Button>
          <Button variant="ghost" icon={<Octicon name="person" size={16} />} onClick={onOpenProfile}>
            {userName}
          </Button>
        </RightActions>
      </HeaderContent>
    </Header>
  );
}
