import { useEffect, useRef, type RefObject } from 'react';

/**
 * 네이티브 `<dialog>`를 쓰지 않는 오버레이 대화상자에 Esc 닫기와 포커스 복귀를 붙인다.
 * 열릴 때 포커스가 있던 요소를 기억했다가, 닫히면 그 요소로 포커스를 돌려준다.
 * `container`를 넘기면 열릴 때 그 안의 첫 입력 요소(없으면 버튼)로 포커스를 옮긴다.
 */
export function useOverlayDismiss(open: boolean, onDismiss: () => void, container?: RefObject<HTMLElement | null>) {
  const latest = useRef(onDismiss);
  latest.current = onDismiss;

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const root = container?.current;
    if (root && !root.contains(document.activeElement)) {
      (root.querySelector<HTMLElement>('input:not(:disabled), textarea:not(:disabled)')
        ?? root.querySelector<HTMLElement>('button:not(:disabled)'))?.focus();
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      event.preventDefault();
      latest.current();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (previous?.isConnected) previous.focus();
    };
  }, [open, container]);
}
