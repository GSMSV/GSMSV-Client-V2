import { useRef, useState, type PointerEvent } from 'react';
import styled from 'styled-components';
import { Button, TextField } from '../../../../shared/ui/controls';
import { photoCrop, renderPhotoCrop, type CropPosition, type PhotoRejection, type PhotoSelection } from '../model/profilePhoto';
import { AccountDialog, DialogCopy } from './AccountDialog';

const Columns = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(110px, 1fr);
  align-items: start;
  gap: ${({ theme }) => theme.space[16]}px;
`;

const ImageBox = styled.div<{ $interactive?: boolean }>`
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.raised};
  cursor: ${({ $interactive }) => $interactive ? 'grab' : 'inherit'};
  touch-action: ${({ $interactive }) => $interactive ? 'none' : 'auto'};

  img {
    position: absolute;
    max-width: none;
    pointer-events: none;
    user-select: none;
  }
`;

const Preview = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[8]}px;
  & > div { border-radius: 50%; }
`;

const Zoom = styled.label`
  display: grid;
  gap: ${({ theme }) => theme.space[8]}px;
  input { width: 100%; accent-color: ${({ theme }) => theme.colors.primary}; }
`;

function clamp(value: number) {
  return Math.min(1, Math.max(0, value));
}

export function ProfilePhotoCropDialog({ photo, onSave, onDismiss }: {
  photo: Exclude<PhotoSelection, { error: PhotoRejection }>;
  onSave: (url: string) => boolean;
  onDismiss: () => void;
}) {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState<CropPosition>({ x: 0.5, y: 0.5 });
  const [saveFailed, setSaveFailed] = useState(false);
  const drag = useRef<{ x: number; y: number; position: CropPosition } | null>(null);
  const frame = photoCrop(photo.image, zoom, position);
  const imageStyle = {
    width: `${100 * frame.width / frame.size}%`,
    height: `${100 * frame.height / frame.size}%`,
    left: `${-100 * frame.x / frame.size}%`,
    top: `${-100 * frame.y / frame.size}%`,
  };

  function move(event: PointerEvent<HTMLDivElement>) {
    const start = drag.current;
    if (!start || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const scale = frame.size / event.currentTarget.clientWidth;
    setPosition({
      x: frame.width === frame.size ? start.position.x : clamp(start.position.x - (event.clientX - start.x) * scale / (frame.width - frame.size)),
      y: frame.height === frame.size ? start.position.y : clamp(start.position.y - (event.clientY - start.y) * scale / (frame.height - frame.size)),
    });
  }

  return (
    <AccountDialog wide title="프로필 사진 자르기" icon="image"
      description="사진을 움직여 얼굴이 정사각형 영역 안에 들어오도록 맞춰주세요. 저장하면 상단 프로필에도 반영됩니다."
      onDismiss={onDismiss} actions={<>
        <Button variant="secondary" onClick={onDismiss}>취소</Button>
        <Button onClick={() => {
          const result = renderPhotoCrop(photo.image, zoom, position);
          if (!result || !onSave(result)) setSaveFailed(true);
        }}>사진 저장</Button>
      </>}>
      <Columns>
        <ImageBox $interactive tabIndex={0} aria-label="선택한 사진"
          onPointerDown={event => {
            if (!event.isPrimary || event.button !== 0) return;
            event.currentTarget.setPointerCapture(event.pointerId);
            drag.current = { x: event.clientX, y: event.clientY, position };
          }}
          onPointerMove={move} onLostPointerCapture={() => { drag.current = null; }}
          onKeyDown={event => {
            const shifts: Record<string, CropPosition> = {
              ArrowLeft: { x: 0.05, y: 0 }, ArrowRight: { x: -0.05, y: 0 },
              ArrowUp: { x: 0, y: 0.05 }, ArrowDown: { x: 0, y: -0.05 },
            };
            const shift = shifts[event.key];
            if (!shift) return;
            event.preventDefault();
            setPosition(current => ({ x: clamp(current.x + shift.x), y: clamp(current.y + shift.y) }));
          }}>
          <img src={photo.url} style={imageStyle} alt="" />
        </ImageBox>
        <Preview>
          <strong>미리보기</strong>
          <ImageBox><img src={photo.url} style={imageStyle} alt="자른 프로필 사진" /></ImageBox>
          <DialogCopy>{'상단 프로필과 계정 설정에\n이렇게 표시됩니다.'}</DialogCopy>
        </Preview>
      </Columns>
      <Zoom>확대 · {Math.round(zoom * 100)}%
        <input type="range" min={1} max={3} step={0.01} value={zoom} onChange={event => setZoom(event.currentTarget.valueAsNumber)} />
      </Zoom>
      <DialogCopy>{'· 자르기 영역 · 정사각형 1:1\n· JPG · PNG · WebP / 최대 2MB'}</DialogCopy>
      {saveFailed && <DialogCopy role="alert">프로필 사진을 저장하지 못했습니다.</DialogCopy>}
    </AccountDialog>
  );
}

export function ProfilePhotoErrorDialog({ error, onChoose, onDismiss }: {
  error: PhotoRejection;
  onChoose: () => void;
  onDismiss: () => void;
}) {
  const { filename, extension, sizeMb, kind } = error;
  const photoErrors = {
    format: {
      title: 'JPG, PNG, WebP만 올릴 수 있습니다',
      detail: `· 고른 파일: ${filename}\n· JPG, PNG, WebP 파일을 골라 주세요.`,
    },
    contents: {
      title: '이미지 파일이 아닙니다',
      detail: `· 이름은 .${extension}로 끝나지만 내용이 이미지가 아닙니다.\n· 사진 앱에서 다시 저장한 파일을 골라 주세요.`,
    },
    size: {
      title: '2 MB보다 큰 사진입니다',
      detail: `· 고른 사진 ${sizeMb} MB · 최대 2 MB\n· 크기를 줄여서 다시 올려 주세요.`,
    },
    'format-and-size': {
      title: '이 사진은 업로드할 수 없습니다',
      detail: '지원하는 형식과 파일 크기를 확인한 뒤 다른 사진을 선택하세요.',
    },
  };
  const { title, detail } = photoErrors[kind];
  return (
    <AccountDialog title={title} icon="image" description={detail} onDismiss={onDismiss} actions={kind === 'format-and-size' ? <>
      <Button disabled>사진 저장</Button>
      <Button variant="secondary" onClick={onChoose}>다른 사진 선택</Button>
    </> : <>
      <Button variant="secondary" onClick={onDismiss}>닫기</Button>
      <Button onClick={onChoose}>다른 사진 고르기</Button>
    </>}>
      {kind === 'format-and-size' && <>
        <DialogCopy>{'· 지원 형식 · JPG / PNG / WebP\n· 파일 크기 · 최대 2MB'}</DialogCopy>
        <TextField label="선택한 파일" readOnly value={`${filename} · ${sizeMb} MB`} error="지원하지 않는 형식이며 파일 크기가 2MB를 초과했습니다." />
      </>}
    </AccountDialog>
  );
}
