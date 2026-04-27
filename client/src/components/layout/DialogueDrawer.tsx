import { usePresentationStore } from '../../stores/presentationStore';
import { TranscriptPanel } from '../TranscriptPanel';
import { VoiceControl } from '../VoiceControl';

export function DialogueDrawer({ open }: { open: boolean }) {
  const uiThemeMode = usePresentationStore((s) => s.uiThemeMode);
  const isNight = uiThemeMode === 'night';
  return (
    <div
      aria-hidden={!open}
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: 384,
        display: 'flex',
        flexDirection: 'column',
        background: isNight ? 'rgba(12,14,20,0.96)' : 'rgba(250,250,250,0.92)',
        backdropFilter: 'blur(10px)',
        borderLeft: '1px solid var(--gen-border)',
        color: 'var(--gen-text)',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 500ms cubic-bezier(0.16, 1, 0.3, 1)',
        zIndex: 30,
        boxShadow: open
          ? isNight
            ? '0 0 60px rgba(0,0,0,0.5)'
            : '0 0 60px rgba(0,0,0,0.08)'
          : 'none',
      }}
    >
      <TranscriptPanel />
      <div style={{ borderTop: '1px solid var(--gen-border)' }}>
        <VoiceControl />
      </div>
    </div>
  );
}
