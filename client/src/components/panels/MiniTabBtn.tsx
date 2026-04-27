export function MiniTabBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        height: 24,
        border: active ? '1px solid #5f9dff' : '1px solid var(--gen-border)',
        borderLeft: label === 'Preset' ? (active ? '1px solid #5f9dff' : '1px solid var(--gen-border)') : undefined,
        background: active ? 'var(--gen-btn-active-bg)' : 'var(--gen-white)',
        color: active ? 'var(--gen-btn-active-text)' : 'var(--gen-text)',
        fontSize: label.length > 12 ? 9 : 10,
        fontWeight: active ? 600 : 500,
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
}
