import type { ReactNode } from 'react';

export function LabeledInput({
  label, value, onChange, placeholder, onSubmit, disabled,
}: {
  label: ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  onSubmit: () => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <div className="gen-label flex items-center gap-1.5 mb-2">{label}</div>
      <div className="flex" style={{ border: '1px solid var(--gen-border)' }}>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
          placeholder={placeholder}
          style={{
            flex: 1,
            padding: '14px 14px',
            border: 'none',
            fontSize: 13,
            fontFamily: 'var(--gen-font-body)',
            background: 'var(--gen-white)',
            outline: 'none',
          }}
        />
        <button
          type="button"
          onClick={onSubmit}
          disabled={!value.trim() || disabled}
          className="gen-go-btn"
          style={{
            padding: '0 18px',
            background: 'var(--gen-btn-solid-bg)',
            color: 'var(--gen-btn-solid-text)',
            border: 'none',
            borderLeft: '1px solid var(--gen-border)',
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.06em',
            cursor: 'pointer',
            opacity: !value.trim() || disabled ? 0.35 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label="Submit URL"
        >
          GO
        </button>
      </div>
    </div>
  );
}
