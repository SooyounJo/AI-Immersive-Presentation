import { useState } from 'react';
import { usePresentationStore } from '../stores/presentationStore';
import { useVoice } from '../hooks/useVoice';
import { useAgent } from '../hooks/useAgent';
import { useRaiseHand } from '../hooks/useRaiseHand';
import { IconMic, IconSend } from './icons';

/**
 * Side-panel voice & text control.
 * - Mic button doubles as "raise hand" (interrupts any playback or TTS).
 * - Text input interrupts too — sending a question cancels playback cleanly.
 */
export function VoiceControl() {
  const { agentMode, setAgentMode, cancelPlayback, interruptContext, setInterruptContext } = usePresentationStore();
  const { isPlaying, speak, stopSpeaking } = useVoice();
  const { askQuestion } = useAgent();
  const { isHandRaised, toggle: toggleHand } = useRaiseHand();
  const [textInput, setTextInput] = useState('');

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;

    // Capture interrupt context if agent was speaking/presenting
    const wasSpeaking = agentMode === 'speaking' || agentMode === 'presenting';
    if (wasSpeaking) {
      const store = usePresentationStore.getState();
      const lastAssistant = [...store.chatMessages].reverse().find((m) => m.role === 'assistant');
      const spokenText = store.streamingText || lastAssistant?.content || '';
      const currentSlide = store.presentation?.slides[store.currentSlideIndex];
      if (currentSlide && spokenText) {
        setInterruptContext({ slideTitle: currentSlide.title, spokenText });
      }
      cancelPlayback();
      stopSpeaking();
    }

    const question = textInput.trim();
    setTextInput('');

    const ctx = usePresentationStore.getState().interruptContext;
    const response = await askQuestion(question, { interruptContext: ctx });
    setInterruptContext(null);

    if (response) {
      setAgentMode('speaking');
      await speak(response);
      setAgentMode('idle');
    }
  };

  const micLabel = isHandRaised ? 'Stop' : 'Raise hand';

  return (
    <div className="flex items-center gap-3 px-6 py-4">
      {/* Mic / raise hand */}
      <button
        onClick={toggleHand}
        aria-label={micLabel}
        title={micLabel}
        style={{
          width: 44,
          height: 44,
          flexShrink: 0,
          border: `1px solid ${isHandRaised ? 'var(--gen-black)' : 'var(--gen-border)'}`,
          background: isHandRaised ? 'var(--gen-black)' : 'var(--gen-white)',
          color: isHandRaised ? 'var(--gen-white)' : 'var(--gen-text)',
          cursor: 'pointer',
          transition: 'all var(--gen-base)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <IconMic size={18} />
      </button>

      {/* Stop TTS (only visible while audio playing) */}
      {isPlaying && (
        <button
          onClick={stopSpeaking}
          aria-label="Stop speaking"
          style={{
            width: 44,
            height: 44,
            flexShrink: 0,
            border: '1px solid var(--gen-border)',
            background: 'var(--gen-white)',
            cursor: 'pointer',
            fontSize: 10,
            letterSpacing: '0.1em',
          }}
        >
          MUTE
        </button>
      )}

      {/* Text input */}
      <form onSubmit={handleTextSubmit} className="flex-1 flex gap-2">
        <input
          type="text"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder={interruptContext ? 'Interject…' : 'Ask anything…'}
          className="gen-input flex-1"
        />
        <button
          type="submit"
          disabled={!textInput.trim()}
          className="gen-btn gen-btn-outline flex items-center gap-1.5"
          style={{ padding: '0 16px', fontSize: 10 }}
        >
          <IconSend size={12} />
          Send
        </button>
      </form>
    </div>
  );
}
