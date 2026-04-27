import { useEffect, useRef } from 'react';
import { usePresentationStore } from '../stores/presentationStore';
import type { AppMode } from '../stores/presentationStore';

export function usePresentationNavigationControls(appMode: AppMode, stopSpeaking: () => void) {
  const wheelLockRef = useRef(false);

  useEffect(() => {
    if (appMode !== 'present') return;

    const shouldIgnoreTarget = (eventTarget: EventTarget | null) => {
      if (!(eventTarget instanceof HTMLElement)) return false;
      const tag = eventTarget.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || eventTarget.isContentEditable;
    };

    const navigate = (direction: 'next' | 'prev') => {
      const store = usePresentationStore.getState();
      if (store.isPlaying) {
        store.cancelPlayback();
        store.setAgentMode('idle');
      }
      stopSpeaking();
      if (direction === 'next') store.nextSlide();
      else store.prevSlide();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (shouldIgnoreTarget(event.target)) return;
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        navigate('next');
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        navigate('prev');
      }
    };

    const onWheel = (event: WheelEvent) => {
      if (shouldIgnoreTarget(event.target)) return;
      if (Math.abs(event.deltaY) < 24) return;
      if (wheelLockRef.current) {
        event.preventDefault();
        return;
      }

      wheelLockRef.current = true;
      window.setTimeout(() => {
        wheelLockRef.current = false;
      }, 420);

      event.preventDefault();
      navigate(event.deltaY > 0 ? 'next' : 'prev');
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('wheel', onWheel);
    };
  }, [appMode, stopSpeaking]);
}
