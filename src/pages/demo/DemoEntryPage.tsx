import { useNavigate } from 'react-router';
import styled from 'styled-components';
import { startDemoSession, stopDemoMode } from '../../shared/demo';

const Page = styled.main`
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 32px;
  background: ${({ theme }) => theme.colors.canvas};
  color: ${({ theme }) => theme.colors.text};
`;

const Panel = styled.section`
  width: min(100%, 680px);
  padding: 32px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};
`;

const Title = styled.h1`
  margin: 0 0 8px;
  font-size: ${({ theme }) => theme.typography.h1.size}px;
  line-height: ${({ theme }) => theme.typography.h1.lineHeight}px;
`;

const Copy = styled.p`
  margin: 0 0 24px;
  color: ${({ theme }) => theme.colors.muted};
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
`;

const Button = styled.button`
  min-height: ${({ theme }) => theme.size.control}px;
  padding: 0 16px;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.sm}px;
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.onPrimary};
  font: inherit;
  cursor: pointer;

  &:hover { background: ${({ theme }) => theme.colors.primaryHover}; }
`;

const SecondaryButton = styled(Button)`
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: transparent;
  color: ${({ theme }) => theme.colors.text};
`;

export default function DemoEntryPage() {
  const navigate = useNavigate();

  async function enter(role: 'user' | 'admin', firstVisit = false) {
    if (!startDemoSession(role)) return;
    if (role === 'user' && import.meta.env.DEV) {
      const [{ setDemoFirstVisit }, vm] = await Promise.all([
        import('../../entities/home'),
        import('../../entities/vm'),
      ]);
      setDemoFirstVisit(firstVisit);
      if (firstVisit) {
        const state = vm.getDemoVmState();
        vm.saveDemoVmState({
          ...state,
          vms: state.vms.filter(item => item.owner !== 'personal'),
          personalQuota: { ...state.personalQuota, cpu: 0, memory: 0, disk: 0 },
        });
      }
    }
    navigate(role === 'admin' ? '/admin/infra' : '/');
  }

  return (
    <Page>
      <Panel>
        <Title>로컬 미리보기</Title>
        <Copy>Figma 화면을 목데이터로 확인하는 개발 전용 미리보기입니다. 입력과 변경 내용은 이 브라우저에만 저장됩니다.</Copy>
        <Actions>
          <Button onClick={() => enter('user')}>학생 화면 열기</Button>
          <Button onClick={() => enter('user', true)}>첫 방문 화면 열기</Button>
          <Button onClick={() => enter('admin')}>관리자 화면 열기</Button>
          <SecondaryButton onClick={stopDemoMode}>미리보기 초기화</SecondaryButton>
        </Actions>
      </Panel>
    </Page>
  );
}
