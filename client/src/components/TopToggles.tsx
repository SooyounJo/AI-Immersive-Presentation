import { usePresentationStore } from '../stores/presentationStore';

/**
 * Compact on/off toggles for the two overlay sections:
 *   AGENT    — the slide-overlay agent orb
 *   DIALOGUE — the right-side transcript drawer
 */
export function TopToggles() {
  const { agentVisible, dialogueOpen, toggleAgent, toggleDialogue } = usePresentationStore();

  return (
    <div className="flex" style={{ border: '1px solid var(--gen-border)' }}>
      <ToggleBtn label="Agent" active={agentVisible} onClick={toggleAgent} />
      <ToggleBtn label="Dialogue" active={dialogueOpen} onClick={toggleDialogue} divider />
    </div>
  );
}

function ToggleBtn({ label, active, onClick, divider }: { label: string; active: boolean; onClick: () => void; divider?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '9px 14px',
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        background: active ? 'var(--gen-black)' : 'rgba(255,255,255,0.7)',
        color: active ? 'var(--gen-white)' : 'var(--gen-text-sub)',
        border: 'none',
        borderLeft: divider ? '1px solid var(--gen-border)' : 'none',
        cursor: 'pointer',
        transition: 'all var(--gen-fast)',
      }}
      aria-pressed={active}
      title={`${active ? 'Hide' : 'Show'} ${label}`}
    >
      {label}
    </button>
  );
}
