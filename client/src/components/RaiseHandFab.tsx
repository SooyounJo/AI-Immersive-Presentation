import { usePresentationStore } from '../stores/presentationStore';
import { useRaiseHand } from '../hooks/useRaiseHand';
import { IconHand, IconMic } from './icons';

export function RaiseHandFab({ bottomOffset = 84 }: { bottomOffset?: number }) {
  const { appMode, dialogueOpen } = usePresentationStore();
  const { isHandRaised, toggle } = useRaiseHand();

  if (appMode !== 'present') return null;

  const rightOffset = dialogueOpen ? 384 + 32 : 32;

  return (
    <div
      style={{
        position: 'fixed',
        right: rightOffset,
        bottom: bottomOffset,
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        transition: 'right 500ms var(--gen-ease), bottom 400ms var(--gen-ease)',
      }}
    >
      {/* Mic icon */}
      <button
        type="button"
        aria-label="Microphone"
        style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: 'transparent',
          border: '1px solid rgba(255,255,255,0.18)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          backdropFilter: 'blur(8px)',
        }}
      >
        <IconMic size={20} />
      </button>

      {/* Raise Hand box */}
      <button
        type="button"
        onClick={toggle}
        aria-label="Raise Hand"
        style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: isHandRaised ? '#ffffff' : 'transparent',
          border: '1px solid rgba(255,255,255,0.18)',
          color: isHandRaised ? '#000000' : '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          backdropFilter: 'blur(8px)',
          transition: 'all 0.2s ease',
        }}
      >
        <IconHand size={20} />
      </button>

      {/* Listening indicator (full screen border) */}
      {isHandRaised && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            pointerEvents: 'none',
            border: '3px solid #ffffff',
            boxShadow: 'inset 0 0 100px rgba(255,255,255,0.1)',
            zIndex: 35,
          }}
        />
      )}
    </div>
  );
}
