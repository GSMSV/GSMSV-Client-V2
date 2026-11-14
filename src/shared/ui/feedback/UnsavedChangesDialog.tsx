import { useId } from 'react';
import styled from 'styled-components';
import { Button } from '../controls';
import { Octicon } from '../icons';
import { ModalSurface } from './ModalSurface';

const Panel = styled.div`
  display: flex;
  width: min(480px, calc(100vw - 32px));
  flex-direction: column;
  gap: ${({ theme }) => theme.space[16]}px;
  padding: ${({ theme }) => theme.space[24]}px;
`;

const Heading = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;

  svg { flex: none; }
`;

const Title = styled.h2`
  margin: 0;
  font: ${({ theme: { typography: { h2 } } }) => `${h2.weight} ${h2.size}px/${h2.lineHeight}px ${h2.family}`}, sans-serif;
`;

const Copy = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme: { typography: { bodySmall } } }) => `${bodySmall.weight} ${bodySmall.size}px/${bodySmall.lineHeight}px ${bodySmall.family}`}, sans-serif;
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.space[8]}px;
`;

export function UnsavedChangesDialog({ onLeave, onStay }: { onLeave: () => void; onStay: () => void }) {
  const titleId = useId();
  return (
    <ModalSurface labelledBy={titleId} onDismiss={onStay}>
      <Panel>
        <Heading><Octicon name="pencil" size={24} aria-hidden="true" /><Title id={titleId}>작성 중인 내용이 사라집니다</Title></Heading>
        <Copy>아직 저장하지 않은 변경 사항이 있습니다. 이 화면을 떠나시겠습니까?</Copy>
        <Copy>· 머무르면 이어서 작성할 수 있습니다.</Copy>
        <Actions>
          <Button variant="danger" icon={<Octicon name="trashcan" size={16} />} onClick={onLeave}>저장하지 않고 떠나기</Button>
          <Button variant="primary" icon={<Octicon name="arrow-left" size={16} />} onClick={onStay}>머물기</Button>
        </Actions>
      </Panel>
    </ModalSurface>
  );
}
