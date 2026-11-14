import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import styled from 'styled-components';
import { getLastUsedDemoRole, selectDemoRole } from '../../features/auth/select-demo-role';
import type { SessionUserRole } from '../../entities/session';
import { isDemoMode } from '../../shared/demo';
import { Button } from '../../shared/ui/controls';
import { Octicon } from '../../shared/ui/icons';

const Screen = styled.main`
  position: relative;
  width: 100%;
  min-width: 1200px;
  min-height: 1080px;
  height: max(100vh, 1080px);
  overflow: hidden;
  background: ${({ theme }) => theme.colors.canvas};
`;

const IntroductionPanel = styled.aside`
  position: absolute;
  inset: 0 auto 0 0;
  width: 320px;
  min-height: 1080px;
  background: ${({ theme }) => theme.colors.sidebar};
`;

const BrandMark = styled.img`
  position: absolute;
  top: 50%;
  left: -240px;
  display: block;
  width: 800px;
  height: 800px;
  transform: translateY(-50%);
`;

const Authentication = styled.section`
  position: absolute;
  top: 50%;
  left: 50%;
  display: flex;
  width: 480px;
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space[32]}px;
  transform: translateY(-50%);
`;

const Heading = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space[32]}px;
`;

const Title = styled.h1`
  width: 680px;
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.h1.weight} ${({ theme }) => theme.typography.h1.size}px/${({ theme }) => theme.typography.h1.lineHeight}px ${({ theme }) => theme.typography.h1.family}, sans-serif;
`;

const Subtitle = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.body.weight} ${({ theme }) => theme.typography.body.size}px/${({ theme }) => theme.typography.body.lineHeight}px ${({ theme }) => theme.typography.body.family}, sans-serif;
  white-space: nowrap;
`;

const RoleCard = styled.section`
  display: flex;
  width: 480px;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[16]}px;
  padding: ${({ theme }) => theme.space[24]}px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};
`;

const CardTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.title.weight} ${({ theme }) => theme.typography.title.size}px/${({ theme }) => theme.typography.title.lineHeight}px ${({ theme }) => theme.typography.title.family}, sans-serif;
`;

const RoleOption = styled.div`
  display: grid;
  width: 100%;
  grid-template-columns: 20px minmax(0, 1fr);
  align-items: start;
  gap: ${({ theme }) => theme.space[16]}px;
`;

const RoleIcon = styled.span`
  display: inline-flex;
  width: 20px;
  height: 20px;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.muted};

  svg { width: 20px; height: 20px; }
`;

const RoleContent = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space[8]}px;
`;

const RoleName = styled.h3`
  width: 100%;
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.button.weight} ${({ theme }) => theme.typography.button.size}px/${({ theme }) => theme.typography.button.lineHeight}px ${({ theme }) => theme.typography.button.family}, sans-serif;
`;

const RoleDescription = styled.p`
  width: 100%;
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

const LastUsed = styled.p`
  width: 100%;
  margin: 0;
  color: ${({ theme }) => theme.colors.faint};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const RoleActions = styled.div`
  display: flex;
  width: 100%;
  justify-content: flex-end;
`;

const RoleButton = styled(Button)<{ $width: number }>`
  width: ${({ $width }) => $width}px;
  padding: 0 ${({ theme }) => theme.space[8]}px;
`;

const Divider = styled.div`
  width: 100%;
  height: 1px;
  flex: 0 0 1px;
  background: ${({ theme }) => theme.colors.border};
`;

const ScopeNote = styled.div`
  display: flex;
  width: 414px;
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space[8]}px;
`;

const ScopeTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.button.weight} ${({ theme }) => theme.typography.button.size}px/${({ theme }) => theme.typography.button.lineHeight}px ${({ theme }) => theme.typography.button.family}, sans-serif;
`;

const ScopeDescription = styled.p`
  display: flex;
  flex-direction: column;
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

const ContinueActions = styled.div`
  display: flex;
  width: 100%;
  justify-content: flex-end;
`;

export default function RoleSelectionDemoPage() {
  const navigate = useNavigate();
  const [lastRole] = useState<SessionUserRole>(getLastUsedDemoRole);
  const [selectedRole, setSelectedRole] = useState<SessionUserRole>(getLastUsedDemoRole);

  if (!isDemoMode()) return <Navigate to="/login" replace />;

  function continueWithRole() {
    const destination = selectDemoRole(selectedRole);
    if (destination) navigate(destination, { replace: true });
  }

  return (
    <Screen data-node-id="407:36910">
      <IntroductionPanel aria-hidden="true" />
      <BrandMark src="/assets/gsmsv-logo.svg" alt="" aria-hidden="true" />
      <Authentication aria-labelledby="role-selection-title">
        <Heading>
          <Title id="role-selection-title">어떤 역할로 시작하시겠습니까?</Title>
          <Subtitle>사용할 역할을 선택하세요. 나중에 프로필 메뉴에서 전환할 수 있습니다.</Subtitle>
        </Heading>

        <RoleCard aria-labelledby="role-card-title">
          <CardTitle id="role-card-title">내 역할</CardTitle>
          <RoleOption>
            <RoleIcon aria-hidden="true"><Octicon name="person" size={20} /></RoleIcon>
            <RoleContent>
              <RoleName>일반 사용자</RoleName>
              <RoleDescription>개인 VM과 Serverless 함수를 만들고 관리합니다.</RoleDescription>
              {lastRole === 'user' && <LastUsed>마지막으로 사용한 역할</LastUsed>}
              <RoleActions>
                <RoleButton
                  $width={selectedRole === 'user' ? 93 : 160}
                  aria-pressed={selectedRole === 'user'}
                  variant={selectedRole === 'user' ? 'primary' : 'secondary'}
                  icon={<Octicon name={selectedRole === 'user' ? 'check' : 'arrow-right'} size={16} />}
                  iconPosition="start"
                  onClick={() => setSelectedRole('user')}
                >
                  {selectedRole === 'user' ? '선택됨' : '일반 사용자로 선택'}
                </RoleButton>
              </RoleActions>
            </RoleContent>
          </RoleOption>

          <Divider />

          <RoleOption>
            <RoleIcon aria-hidden="true"><Octicon name="shield" size={20} /></RoleIcon>
            <RoleContent>
              <RoleName>관리자</RoleName>
              <RoleDescription>인프라와 전체 VM, 팀 승인과 문의를 관리합니다.</RoleDescription>
              {lastRole === 'admin' && <LastUsed>마지막으로 사용한 역할</LastUsed>}
              <RoleActions>
                <RoleButton
                  $width={selectedRole === 'admin' ? 93 : 133}
                  aria-pressed={selectedRole === 'admin'}
                  variant={selectedRole === 'admin' ? 'primary' : 'secondary'}
                  icon={<Octicon name={selectedRole === 'admin' ? 'check' : 'arrow-right'} size={16} />}
                  iconPosition="start"
                  onClick={() => setSelectedRole('admin')}
                >
                  {selectedRole === 'admin' ? '선택됨' : '관리자로 선택'}
                </RoleButton>
              </RoleActions>
            </RoleContent>
          </RoleOption>

          <Divider />
        </RoleCard>

        <ScopeNote>
          <ScopeTitle>역할에 따라 사용 범위가 달라집니다</ScopeTitle>
          <ScopeDescription>
            <span>선택한 역할의 자원과 권한으로 시작합니다. 사용할 수 있는 역할이 하나라면 </span>
            <span>이 화면 없이 바로 홈으로 이동합니다.</span>
          </ScopeDescription>
        </ScopeNote>

        <ContinueActions>
          <Button icon={<Octicon name="arrow-right" size={16} />} onClick={() => void continueWithRole()}>
            선택한 역할로 계속
          </Button>
        </ContinueActions>
      </Authentication>
    </Screen>
  );
}
