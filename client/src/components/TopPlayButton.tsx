import { usePresentationStore } from '../stores/presentationStore';
import { usePlayback } from '../hooks/usePlayback';
import { IconPlay, IconPause } from './icons';

/**
 * Top-right Start/Pause toggle — the primary entry to playback.
 * Styled to match the Agent/Dialogue toggle buttons to its left
 * so the three form a harmonious cluster.
 */
export function TopPlayButton() {
  const { isPlaying } = usePresentationStore();
  const { toggle } = usePlayback();

  return (
    <button
      onClick={toggle}
      title={isPlaying ? 'Pause presentation' : 'Start presentation'}
      style={{
        padding: '9px 16px',
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        background: 'var(--gen-black)',
        color: 'var(--gen-white)',
        border: '1px solid var(--gen-black)',
        cursor: 'pointer',
        transition: 'all var(--gen-fast)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      {isPlaying ? <IconPause size={11} /> : <IconPlay size={11} />}
      {isPlaying ? 'Pause' : 'Start'}
    </button>
  );
}
