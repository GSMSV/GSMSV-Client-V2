import { useNavigate } from 'react-router';
import styled from 'styled-components';
import type { DeletedDemoVm } from '../../entities/vm';
import { Button } from '../../shared/ui/controls';
import { Octicon } from '../../shared/ui/icons';
import { DemoPage, DemoShell, Hint, Surface, SurfaceTitle } from './VmDemoPrimitives';

const Card = styled(Surface)`
  width: min(480px, 100%);
  align-self: center;
  margin-block: 80px;
`;

const Header = styled(SurfaceTitle)`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
`;

export function VmUnavailablePage({ teamId, deleted }: { teamId?: string; deleted?: DeletedDemoVm }) {
  const navigate = useNavigate();
  const home = teamId ? '/teams/' + encodeURIComponent(teamId) : '/';
  const create = teamId ? home + '/vms/new' : '/vms/new';

  return <DemoShell teamScopeId={teamId}><DemoPage>
    <Card>
      <Header as="h1"><Octicon name={deleted ? 'trashcan' : 'search'} size={24} />{deleted ? '이미 삭제된 Instance입니다' : '찾을 수 없습니다'}</Header>
      {deleted ? <>
        <Hint>{deleted.reason === 'expired'
          ? '알림이 가리키는 VM은 만료 후 3일의 유예 기간이 지나 삭제됐습니다. 삭제된 데이터와 Snapshot은 복구할 수 없습니다.'
          : '이 VM은 삭제됐습니다. 삭제된 데이터와 Snapshot은 복구할 수 없습니다.'}</Hint>
        <Hint>· 삭제된 Resource의 접속 정보는 제공하지 않습니다.</Hint>
        <Hint>· 새 VM을 만들어 다시 시작할 수 있습니다.</Hint>
      </> : <Hint>요청한 화면을 열 수 없습니다. 주소를 확인하거나 홈으로 돌아가 주세요.</Hint>}
      <Actions>
        <Button variant={deleted ? 'secondary' : 'primary'} onClick={() => void navigate(home)}>{deleted ? teamId ? '팀 Resources' : '내 Resources' : '홈으로'}</Button>
        {deleted && <Button onClick={() => void navigate(create)}>새 VM 만들기</Button>}
      </Actions>
    </Card>
  </DemoPage></DemoShell>;
}
