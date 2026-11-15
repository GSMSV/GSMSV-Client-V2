import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';

export const mobileNavigationMedia = '(max-width: 960px)';

const navigationItemSelector = 'button:not(:disabled), a[href]';

export function useResponsiveNavigation() {
  const [open, setOpen] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    if (!open) return;
    setOpen(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  }, [open]);

  const toggle = () => {
    if (open) close();
    else setOpen(true);
  };

  useEffect(() => {
    if (!open) return;

    const media = window.matchMedia(mobileNavigationMedia);
    if (!media.matches) {
      setOpen(false);
      return;
    }

    const onMediaChange = (event: MediaQueryListEvent) => {
      if (!event.matches) setOpen(false);
    };
    const focusFrame = window.requestAnimationFrame(() => {
      sidebarRef.current?.querySelector<HTMLElement>(navigationItemSelector)?.focus();
    });
    media.addEventListener('change', onMediaChange);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      media.removeEventListener('change', onMediaChange);
    };
  }, [open]);

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!open) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== 'Tab') return;

    const items = event.currentTarget.querySelectorAll<HTMLElement>(navigationItemSelector);
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && event.target === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && event.target === last) {
      event.preventDefault();
      first?.focus();
    }
  };

  return { open, sidebarRef, triggerRef, close, toggle, onKeyDown };
}
