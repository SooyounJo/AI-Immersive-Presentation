import { useEffect, useRef } from 'react';
import { usePresentationStore } from '../stores/presentationStore';

export function TranscriptPanel() {
  const { chatMessages, streamingText, agentMode } = usePresentationStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages, streamingText]);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
      {chatMessages.map((msg, i) => (
        <div key={i} className="gen-fade">
          <div className="gen-label mb-1.5" style={{ color: msg.role === 'user' ? 'var(--gen-text)' : 'var(--gen-text-sub)' }}>
            {msg.role === 'user' ? 'You' : 'Agent'}
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 300,
              lineHeight: 1.7,
              color: 'var(--gen-text)',
              letterSpacing: '0.01em',
            }}
          >
            {msg.content}
          </div>
        </div>
      ))}

      {/* Streaming text */}
      {streamingText && (agentMode === 'presenting' || agentMode === 'qa') && (
        <div className="gen-fade">
          <div className="gen-label mb-1.5">Agent</div>
          <div style={{ fontSize: 13, fontWeight: 300, lineHeight: 1.7, color: 'var(--gen-text)' }}>
            {streamingText}
            <span
              style={{
                display: 'inline-block',
                width: 8,
                height: 1,
                background: 'var(--gen-black)',
                marginLeft: 6,
                verticalAlign: 'middle',
                animation: 'gen-fade-in 0.6s infinite alternate',
              }}
            />
          </div>
        </div>
      )}

      {chatMessages.length === 0 && !streamingText && (
        <div className="text-center mt-12" style={{ color: 'var(--gen-text-mute)' }}>
          <div className="gen-label mb-3">Dialogue</div>
          <div style={{ fontSize: 12, lineHeight: 1.7 }}>
            Press <span style={{ color: 'var(--gen-text)' }}>Start Presentation</span> <br />
            or ask a question via voice or text.
          </div>
        </div>
      )}
    </div>
  );
}
