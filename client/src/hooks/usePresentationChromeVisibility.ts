import { useEffect, useState, useRef } from 'react';
import type { AppMode } from '../stores/presentationStore';

export function usePresentationChromeVisibility(appMode: AppMode) {
  const [visible, setVisible] = useState(true);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (appMode !== 'present') {
      // eslint-disable-next-line
      setVisible(true);
      return;
    }

    const resetTimer = () => {
      setVisible(true);
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
      timerRef.current = window.setTimeout(() => {
        setVisible(false);
      }, 5000);
    };

    window.addEventListener('mousemove', resetTimer);
    resetTimer();

    return () => {
      window.removeEventListener('mousemove', resetTimer);
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [appMode]);

  return { visible };
}
