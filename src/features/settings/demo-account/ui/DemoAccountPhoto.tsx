import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import styled from 'styled-components';
import { Button } from '../../../../shared/ui/controls';
import { selectPhoto, type PhotoSelection } from '../model/profilePhoto';
import { AccountDialog, DialogCopy } from './AccountDialog';
import { ProfilePhotoCropDialog, ProfilePhotoErrorDialog } from './ProfilePhotoDialog';

const Actions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space[8]}px;
  margin-left: auto;
`;

export function DemoAccountPhoto({ photoUrl, onSave, onDraftChange }: {
  photoUrl: string | null;
  onSave: (url: string | null) => boolean;
  onDraftChange: (dirty: boolean) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const selectionVersion = useRef(0);
  const [selection, setSelection] = useState<PhotoSelection | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteFailed, setDeleteFailed] = useState(false);
  const dirty = selection !== null && !('error' in selection);

  useEffect(() => {
    onDraftChange(dirty);
    return () => onDraftChange(false);
  }, [dirty, onDraftChange]);

  useEffect(() => () => { selectionVersion.current += 1; }, []);

  async function changePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    event.currentTarget.value = '';
    const version = ++selectionVersion.current;
    const result = await selectPhoto(file);
    if (version === selectionVersion.current) setSelection(result);
  }

  function choosePhoto() {
    input.current?.click();
  }

  return (
    <Actions>
      <input ref={input} type="file" accept=".jpg,.jpeg,.png,.webp" hidden onChange={changePhoto} aria-label="프로필 사진 파일 선택" />
      <Button variant="secondary" disabled={!photoUrl} onClick={() => { setDeleteFailed(false); setDeleting(true); }}>사진 삭제</Button>
      <Button variant="secondary" onClick={choosePhoto}>사진 변경</Button>
      {selection && ('error' in selection
        ? <ProfilePhotoErrorDialog error={selection.error} onChoose={choosePhoto} onDismiss={() => setSelection(null)} />
        : <ProfilePhotoCropDialog photo={selection} onDismiss={() => setSelection(null)} onSave={url => {
          if (!onSave(url)) return false;
          setSelection(null);
          return true;
        }} />)}
      {deleting && (
        <AccountDialog title="프로필 사진을 지우시겠습니까?" icon="trashcan" description="지우면 기본 그림으로 바뀝니다."
          onDismiss={() => setDeleting(false)} actions={<>
            <Button variant="secondary" onClick={() => setDeleting(false)}>취소</Button>
            <Button variant="danger" onClick={() => {
              if (onSave(null)) setDeleting(false);
              else setDeleteFailed(true);
            }}>지우기</Button>
          </>}>
          {deleteFailed && <DialogCopy role="alert">프로필 사진을 지우지 못했습니다.</DialogCopy>}
        </AccountDialog>
      )}
    </Actions>
  );
}
