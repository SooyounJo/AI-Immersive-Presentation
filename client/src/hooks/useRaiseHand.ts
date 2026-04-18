import { useCallback } from 'react';
import { usePresentationStore } from '../stores/presentationStore';
import { useVoice } from './useVoice';
import { useAgent } from './useAgent';

/**
 * "Raise hand" interrupt flow — NotebookLM style.
 *
 * Users can raise their hand at ANY time during presentation (even mid-TTS)
 * to interject. The agent captures what it was saying as context and improvises
 * a natural response to the incoming question.
 *
 * Flow:
 *   1. raiseHand()  →  halt playback & TTS, capture narration context, start listening
 *   2. (user speaks)
 *   3. lowerHand()  →  stop recording, transcribe, send to agent with interrupt context
 *   4. agent responds naturally (acknowledges + answers + optional bridge back)
 *   5. user can raise hand again, or Resume the presentation
 */
export function useRaiseHand() {
  const { isRecording, startRecording, stopRecording, speak, stopSpeaking } = useVoice();
  const { askQuestion } = useAgent();

  const isHandRaised = isRecording;

  const raiseHand = useCallback(async () => {
    const store = usePresentationStore.getState();

    // Capture what the agent was just saying, for interrupt context.
    // Use the most recent assistant message (the narration that was playing
    // or had just finished), or the current streaming text if mid-generation.
    const lastAssistant = [...store.chatMessages].reverse().find((m) => m.role === 'assistant');
    const spokenText = store.streamingText || lastAssistant?.content || '';

    const currentSlide = store.presentation?.slides[store.currentSlideIndex];
    const interruptContext = currentSlide && spokenText
      ? { slideTitle: currentSlide.title, spokenText }
      : null;

    // Halt everything
    store.cancelPlayback();
    stopSpeaking();

    // Switch to listening
    store.setAgentMode('listening');
    await startRecording();

    // Remember context on the store so askQuestion can pick it up
    store.setInterruptContext(interruptContext);
  }, [startRecording, stopSpeaking]);

  const lowerHand = useCallback(async () => {
    const store = usePresentationStore.getState();
    const transcript = await stopRecording();
    if (!transcript) {
      store.setAgentMode('idle');
      store.setInterruptContext(null);
      return;
    }

    const interruptContext = store.interruptContext;
    const response = await askQuestion(transcript, { interruptContext });
    store.setInterruptContext(null);

    if (response) {
      store.setAgentMode('speaking');
      await speak(response);
      store.setAgentMode('idle');
    }
  }, [stopRecording, askQuestion, speak]);

  const toggle = useCallback(async () => {
    if (isHandRaised) await lowerHand();
    else await raiseHand();
  }, [isHandRaised, lowerHand, raiseHand]);

  return { isHandRaised, raiseHand, lowerHand, toggle };
}
