import { useCallback } from 'react';
import { usePresentationStore, type InterruptContext } from '../stores/presentationStore';

import { API_ROOT, projectApi } from '../api';
const API_BASE = API_ROOT;

export function useAgent() {
  const store = usePresentationStore();

  const presentSlide = useCallback(async () => {
    const { presentation, currentSlideIndex } = usePresentationStore.getState();
    const slide = presentation?.slides[currentSlideIndex];
    if (!presentation || !slide) return;

    store.setAgentMode('presenting');
    store.setStreamingText('');
    store.setLoading(true);

    try {
      // Determine if this is the opening of the presentation:
      // - First slide (index 0)
      // - No conversation history yet (fresh session)
      const isOpening =
        currentSlideIndex === 0 &&
        usePresentationStore.getState().chatMessages.length === 0;
      // Closing: last slide
      const isClosing = currentSlideIndex === presentation.slides.length - 1;

      const slideList = presentation.slides.map((s, i) => ({
        index: i,
        title: s.title,
        labels: s.labels,
      }));

      const response = await fetch(`${API_BASE}/agent/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'present',
          systemPrompt: presentation.systemPrompt,
          knowledge: presentation.knowledge,
          presentationTitle: presentation.title,
          slideIndex: currentSlideIndex,
          totalSlides: presentation.slides.length,
          slideList,
          isOpening,
          isClosing,
          currentSlide: {
            title: slide.title,
            content: slide.content,
            speakerNotes: slide.speakerNotes,
            allowQA: slide.allowQA,
            labels: slide.labels,
          },
          conversationHistory: usePresentationStore.getState().chatMessages,
        }),
      });

      store.setLoading(false);
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value);
          const lines = text.split('\n').filter(l => l.startsWith('data: '));

          for (const line of lines) {
            const data = line.slice(6);
            if (data === '[DONE]') break;
            try {
              const parsed = JSON.parse(data);
              fullText += parsed.content;
              store.appendStreamingText(parsed.content);
            } catch {
              // Ignore invalid JSON chunks
            }
          }
        }
      }

      store.addMessage({ role: 'assistant', content: fullText, timestamp: Date.now() });
      store.setAgentMode('idle');
      return fullText;
    } catch (error) {
      console.error('Present error:', error);
      store.setLoading(false);
      store.setAgentMode('idle');
      return null;
    }
  }, [store]);

  const askQuestion = useCallback(async (
    question: string,
    opts?: { interruptContext?: InterruptContext | null },
  ) => {
    const { presentation, currentSlideIndex } = usePresentationStore.getState();
    const slide = presentation?.slides[currentSlideIndex];
    if (!presentation || !slide) return;

    store.addMessage({ role: 'user', content: question, timestamp: Date.now() });
    store.setAgentMode('qa');
    store.setStreamingText('');
    store.setLoading(true);

    try {
      const slideList = presentation.slides.map((s, i) => ({
        index: i,
        title: s.title,
        labels: s.labels,
      }));

      const response = await fetch(`${API_BASE}/agent/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'qa',
          systemPrompt: presentation.systemPrompt,
          knowledge: presentation.knowledge,
          presentationTitle: presentation.title,
          slideIndex: currentSlideIndex,
          totalSlides: presentation.slides.length,
          slideList,
          currentSlide: {
            title: slide.title,
            content: slide.content,
            speakerNotes: slide.speakerNotes,
            allowQA: slide.allowQA,
            labels: slide.labels,
          },
          userMessage: question,
          conversationHistory: usePresentationStore.getState().chatMessages,
          interruptContext: opts?.interruptContext ?? null,
        }),
      });

      store.setLoading(false);
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value);
          const lines = text.split('\n').filter(l => l.startsWith('data: '));

          for (const line of lines) {
            const data = line.slice(6);
            if (data === '[DONE]') break;
            try {
              const parsed = JSON.parse(data);
              fullText += parsed.content;
              store.appendStreamingText(parsed.content);
            } catch {
              // Ignore invalid JSON chunks
            }
          }
        }
      }

      store.addMessage({ role: 'assistant', content: fullText, timestamp: Date.now() });
      store.setAgentMode('idle');

      // Fire-and-forget: log this Q&A for later insights
      if (fullText && presentation && slide) {
        fetch(`${projectApi()}/qa-log`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            presentationTitle: presentation.title,
            slideIndex: currentSlideIndex,
            slideTitle: slide.title,
            slideLabels: slide.labels,
            question,
            answer: fullText,
            wasInterrupt: !!opts?.interruptContext,
            interruptSpokenText: opts?.interruptContext?.spokenText,
          }),
        }).catch((e) => console.warn('qa-log post failed', e));
      }

      return fullText;
    } catch (error) {
      console.error('QA error:', error);
      store.setLoading(false);
      store.setAgentMode('idle');
      return null;
    }
  }, [store]);

  return { presentSlide, askQuestion };
}
