import { useId } from 'react';
import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router';
import styled from 'styled-components';
import { Button } from '../../shared/ui/controls';
import { Octicon } from '../../shared/ui/icons';
import { StatePanel, StatePanelCopy } from '../../widgets/student-shell';

const Screen = styled.main`
  display: grid;
  min-height: 100vh;
  place-items: center;
  padding: 24px 16px;
  background: ${({ theme }) => theme.colors.canvas};
`;

const Surface = styled.section`
  max-width: 100%;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
`;

/** S03 · 찾을 수 없습니다. 없는 주소로 들어오면 일반 모드와 목데이터 모드 모두 이 화면을 보여준다. */
export default function NotFoundPage() {
  const navigate = useNavigate();
  const titleId = useId();
  return (
    <Screen>
      <Surface aria-labelledby={titleId}>
        <StatePanel
          titleId={titleId}
          icon="search"
          tone="primary"
          title="찾을 수 없습니다"
          actions={<Button variant="primary" icon={<Octicon name="home" size={16} />} onClick={() => void navigate('/')}>홈으로</Button>}
        >
          <StatePanelCopy>요청한 화면을 열 수 없습니다. 주소를 확인하거나 홈으로 돌아가 주세요.</StatePanelCopy>
        </StatePanel>
      </Surface>
    </Screen>
  );
}

/** 라우터 오류 경계: 404 응답은 같은 "찾을 수 없습니다" 화면을 쓰고, 나머지 오류는 상위로 넘긴다. */
export function RouteErrorBoundary() {
  const error = useRouteError();
  if (isRouteErrorResponse(error) && error.status === 404) return <NotFoundPage />;
  throw error;
}
