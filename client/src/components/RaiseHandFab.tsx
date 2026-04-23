import { usePresentationStore } from '../stores/presentationStore';
import { useRaiseHand } from '../hooks/useRaiseHand';
import { IconHand, IconMic } from './icons';

export function RaiseHandFab() {
  const { appMode, dialogueOpen } = usePresentationStore();
  const { isHandRaised, toggle } = useRaiseHand();

  if (appMode !== 'present') return null;

  // Offset when dialogue drawer is open
  const rightOffset = dialogueOpen ? 384 + 32 : 32;

  return (
    <div
      style={{
        position: 'fixed',
        right: rightOffset,
        bottom: 96,
        zIndex: 40,
        display: 'flex',
        alignItems: 'flex-end',
        gap: 16,
        transition: 'right 500ms var(--gen-ease)',
      }}
    >
      {/* Mic icon */}
      <div
        style={{
          width: 44,
          height: 44,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          cursor: 'pointer',
        }}
      >
        <IconMic size={24} />
      </div>

      {/* Raise Hand box */}
      <button
        onClick={toggle}
        style={{
          width: 80,
          height: 100,
          background: '#ffffff',
          borderRadius: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          border: 'none',
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            border: '1px solid #000000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#000000',
          }}
        >
          <IconHand size={22} />
        </div>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: '#000000',
            lineHeight: 1.1,
            textAlign: 'center',
            letterSpacing: '0.05em',
          }}
        >
          RAISE<br />HAND
        </div>
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
