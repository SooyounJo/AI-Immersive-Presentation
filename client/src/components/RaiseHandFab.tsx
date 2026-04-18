import { usePresentationStore } from '../stores/presentationStore';
import { useRaiseHand } from '../hooks/useRaiseHand';
import { IconHand } from './icons';

/**
 * Floating "raise hand" button — available during Present mode.
 * Gently hints its availability while the agent is speaking (subtle pulse),
 * and transforms into a clear "listening" affordance when engaged.
 */
export function RaiseHandFab() {
  const { agentMode, appMode, dialogueOpen } = usePresentationStore();
  const { isHandRaised, toggle } = useRaiseHand();

  if (appMode !== 'present') return null;

  const speaking = agentMode === 'speaking' || agentMode === 'presenting';
  // Slide left out of the way when the dialogue drawer is open
  const rightOffset = dialogueOpen ? 384 + 32 : 32;

  return (
    <>
      <button
        onClick={toggle}
        aria-label={isHandRaised ? 'Finish speaking' : 'Raise hand to interrupt'}
        style={{
          position: 'fixed',
          right: rightOffset,
          bottom: 120,
          zIndex: 40,
          transition: 'right 500ms cubic-bezier(0.16, 1, 0.3, 1)',
          width: 72,
          height: 72,
          borderRadius: '50%',
          border: `1px solid ${isHandRaised ? 'var(--gen-black)' : 'var(--gen-black)'}`,
          background: isHandRaised ? 'var(--gen-black)' : 'var(--gen-white)',
          color: isHandRaised ? 'var(--gen-white)' : 'var(--gen-black)',
          boxShadow: isHandRaised
            ? '0 0 0 6px rgba(10,10,10,0.08), 0 12px 36px rgba(0,0,0,0.18)'
            : '0 8px 24px rgba(0,0,0,0.10)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all var(--gen-base)',
        }}
        className={speaking && !isHandRaised ? 'raise-hand-hint' : ''}
      >
        <IconHand size={28} />
      </button>

      {/* Label tag */}
      <div
        style={{
          position: 'fixed',
          right: rightOffset,
          bottom: 100,
          zIndex: 40,
          pointerEvents: 'none',
          transition: 'right 500ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div
          style={{
            background: isHandRaised ? 'var(--gen-black)' : 'rgba(255,255,255,0.9)',
            color: isHandRaised ? 'var(--gen-white)' : 'var(--gen-text)',
            border: '1px solid var(--gen-black)',
            padding: '4px 10px',
            fontSize: 9,
            fontWeight: 500,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            textAlign: 'center',
            width: 72,
            transition: 'all var(--gen-base)',
          }}
        >
          {isHandRaised ? 'Listening' : 'Raise hand'}
        </div>
      </div>

      {/* Fullscreen listening border — visible when hand is raised */}
      {isHandRaised && (
        <div
          aria-hidden
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 30,
            pointerEvents: 'none',
            border: '2px solid var(--gen-black)',
            boxShadow: 'inset 0 0 60px rgba(10,10,10,0.04)',
          }}
          className="gen-fade"
        />
      )}

      {/* Soft pulse animation for idle hint state */}
      <style>{`
        @keyframes raise-hand-pulse {
          0%   { box-shadow: 0 8px 24px rgba(0,0,0,0.10), 0 0 0 0 rgba(10,10,10,0.22); }
          70%  { box-shadow: 0 8px 24px rgba(0,0,0,0.10), 0 0 0 14px rgba(10,10,10,0); }
          100% { box-shadow: 0 8px 24px rgba(0,0,0,0.10), 0 0 0 0 rgba(10,10,10,0); }
        }
        .raise-hand-hint {
          animation: raise-hand-pulse 2.2s ease-out infinite;
        }
      `}</style>
    </>
  );
}
