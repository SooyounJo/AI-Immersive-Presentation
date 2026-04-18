import { useCallback } from 'react';
import { usePresentationStore } from '../stores/presentationStore';
import { useAgent } from './useAgent';
import { useVoice } from './useVoice';

/** Delay between slides during auto-play, in ms. */
const INTER_SLIDE_PAUSE = 700;

/**
 * Shared playback hook — auto-advance presentation loop with cancel token.
 * Used by top-right Start/Pause button (and previously by the ControlBar).
 */
export function usePlayback() {
  const { presentSlide } = useAgent();
  const { speak, stopSpeaking } = useVoice();

  const play = useCallback(async () => {
    const startToken = usePresentationStore.getState().playbackCancelToken;
    const store = usePresentationStore.getState();

    // If user is on Design tab, switch to View first so they see the slide.
    if (store.appMode !== 'present') {
      usePresentationStore.getState().setAppMode('present');
    }

    store.setIsPlaying(true);

    const cancelled = () =>
      usePresentationStore.getState().playbackCancelToken !== startToken;

    while (true) {
      if (cancelled()) break;

      const { presentation, currentSlideIndex } = usePresentationStore.getState();
      if (!presentation) break;

      const text = await presentSlide();
      if (cancelled()) break;

      if (text) {
        usePresentationStore.getState().setAgentMode('speaking');
        await speak(text);
        usePresentationStore.getState().setAgentMode('idle');
      }
      if (cancelled()) break;

      if (currentSlideIndex >= presentation.slides.length - 1) break;

      await new Promise((r) => setTimeout(r, INTER_SLIDE_PAUSE));
      if (cancelled()) break;

      usePresentationStore.getState().nextSlide();
    }

    usePresentationStore.getState().setIsPlaying(false);
    usePresentationStore.getState().setAgentMode('idle');
  }, [presentSlide, speak]);

  const pause = useCallback(() => {
    usePresentationStore.getState().cancelPlayback();
    stopSpeaking();
    usePresentationStore.getState().setAgentMode('idle');
  }, [stopSpeaking]);

  const toggle = useCallback(() => {
    const { isPlaying } = usePresentationStore.getState();
    if (isPlaying) pause();
    else void play();
  }, [play, pause]);

  return { play, pause, toggle };
}
