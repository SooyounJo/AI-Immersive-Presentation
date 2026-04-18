import { useState } from 'react';
import type { GradientState } from './states';
import { IconSettings, IconClose } from '../icons';

interface Props {
  state: GradientState;
  onChange: (s: GradientState) => void;
  onModulationChange?: (v: number) => void;
  modulation?: number;
  /** when true, controls override external state (for isolated testing) */
  override: boolean;
  onOverrideChange: (v: boolean) => void;
}

const STATES: GradientState[] = ['idle', 'listening', 'thinking', 'acting', 'confirming', 'warning'];

export function GradientControls({ state, onChange, onModulationChange, modulation = 0, override, onOverrideChange }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div
      style={{
        position: 'fixed',
        top: 84,
        right: 16,
        zIndex: 100,
        fontFamily: 'var(--gen-font-body)',
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        title="Ambient field — reflects AI agent state"
        style={{
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(8px)',
          border: '1px solid var(--gen-border)',
          padding: '8px 12px',
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          color: 'var(--gen-text)',
          transition: 'all var(--gen-fast)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
        }}
        aria-expanded={open}
      >
        {open ? <IconClose size={12} /> : <IconSettings size={12} />}
        Ambient · {state}
      </button>

      {open && (
        <div
          style={{
            marginTop: 8,
            background: 'var(--gen-white)',
            border: '1px solid var(--gen-border)',
            padding: 16,
            width: 280,
            boxShadow: '0 12px 40px rgba(0,0,0,0.08)',
          }}
        >
          {/* Explanation */}
          <div style={{ fontSize: 11, lineHeight: 1.6, color: 'var(--gen-text-sub)', marginBottom: 14 }}>
            The full-screen gradient is a <strong style={{ color: 'var(--gen-text)' }}>non-verbal interface</strong> —
            it reflects the AI agent's current state through color, motion, and density.
            You feel the agent's presence without reading words.
          </div>

          {/* State indicator */}
          <div style={{ marginBottom: 14, padding: 10, background: 'var(--gen-bg-soft)', border: '1px solid var(--gen-border)' }}>
            <div className="gen-label mb-1" style={{ color: 'var(--gen-text-mute)' }}>Now reflecting</div>
            <div style={{ fontSize: 14, fontWeight: 400, letterSpacing: '0.02em' }}>{state}</div>
          </div>

          {/* Override toggle */}
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 12, fontSize: 11, cursor: 'pointer', lineHeight: 1.5 }}>
            <input
              type="checkbox"
              checked={override}
              onChange={(e) => onOverrideChange(e.target.checked)}
              style={{ accentColor: 'var(--gen-black)', marginTop: 2 }}
            />
            <span style={{ letterSpacing: '0.04em' }}>
              <span style={{ color: 'var(--gen-text)' }}>Preview states manually</span>
              <span style={{ display: 'block', fontSize: 10, color: 'var(--gen-text-mute)', marginTop: 2 }}>
                For testing only — normally the gradient follows the agent.
              </span>
            </span>
          </label>

          {/* State buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginBottom: 14, opacity: override ? 1 : 0.4 }}>
            {STATES.map((s) => (
              <button
                key={s}
                onClick={() => onChange(s)}
                disabled={!override}
                style={{
                  padding: '8px 10px',
                  fontSize: 10,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  background: state === s ? 'var(--gen-black)' : 'var(--gen-white)',
                  color: state === s ? 'var(--gen-white)' : 'var(--gen-text)',
                  border: `1px solid ${state === s ? 'var(--gen-black)' : 'var(--gen-border)'}`,
                  cursor: override ? 'pointer' : 'not-allowed',
                  transition: 'all var(--gen-fast)',
                }}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Modulation */}
          <div style={{ borderTop: '1px solid var(--gen-border)', paddingTop: 12 }}>
            <div className="gen-label mb-1" style={{ color: 'var(--gen-text-mute)' }}>
              Intensity · {modulation.toFixed(2)}
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={modulation}
              onChange={(e) => onModulationChange?.(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--gen-black)' }}
            />
            <p style={{ fontSize: 10, color: 'var(--gen-text-mute)', marginTop: 6, lineHeight: 1.5 }}>
              Auto-adjusts based on what the agent is doing. Slide to override.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
