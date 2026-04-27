import { useEffect, useRef } from 'react';
import { usePresentationStore } from '../stores/presentationStore';
import { mapAgentMode } from './ambient/states';

/**
 * AgentAvatar — the visible "body" of the AI agent.
 *
 * Rendered as a canvas orb with concentric rings that animate based on state.
 * Sits at the top of the dialogue side-panel, acting as the anchor for the
 * agent's presence in the UI.
 *
 * States:
 *   idle       → slow breathing, soft
 *   listening  → concentric ripples contracting toward center (drawing sound in)
 *   presenting → outward waves radiating
 *   speaking   → outward waves radiating (same family as presenting)
 *   qa         → inner rotation, fluid
 */
export function AgentAvatar() {
  const { agentMode } = usePresentationStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modeRef = useRef(agentMode);

  useEffect(() => { modeRef.current = agentMode; }, [agentMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Hi-DPI
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const SIZE = 180;
    canvas.width = SIZE * dpr;
    canvas.height = SIZE * dpr;
    canvas.style.width = `${SIZE}px`;
    canvas.style.height = `${SIZE}px`;
    ctx.scale(dpr, dpr);

    let raf = 0;
    const t0 = performance.now();

    const draw = () => {
      const now = performance.now();
      const t = (now - t0) / 1000;
      const mode = modeRef.current;

      ctx.clearRect(0, 0, SIZE, SIZE);
      const cx = SIZE / 2;
      const cy = SIZE / 2;

      // breathing scale base
      const breathe = 1 + Math.sin(t * 1.2) * 0.02;

      // ─── Outer ripples (radiating waves during speaking/presenting) ───
      if (mode === 'speaking' || mode === 'presenting') {
        for (let i = 0; i < 4; i++) {
          const phase = ((t * 0.9) + i * 0.25) % 1;
          const r = 30 + phase * 60;
          const alpha = (1 - phase) * 0.35;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(10, 10, 10, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      // ─── Listening: contracting ripples (drawing sound in) ───
      if (mode === 'listening') {
        for (let i = 0; i < 3; i++) {
          const phase = 1 - (((t * 0.7) + i * 0.33) % 1);
          const r = 20 + phase * 70;
          const alpha = phase * 0.4;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(10, 10, 10, ${alpha})`;
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      }

      // ─── QA (thinking): rotating small orbiters ───
      if (mode === 'qa') {
        for (let i = 0; i < 6; i++) {
          const angle = t * 0.9 + (i / 6) * Math.PI * 2;
          const r = 56;
          const x = cx + Math.cos(angle) * r;
          const y = cy + Math.sin(angle) * r;
          ctx.beginPath();
          ctx.arc(x, y, 1.6, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(10, 10, 10, 0.55)';
          ctx.fill();
        }
      }

      // ─── Main ring ───
      const ringR = 40 * breathe;
      ctx.beginPath();
      ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(10, 10, 10, 1)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Inner fill — very soft gradient
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, ringR);
      grad.addColorStop(0, 'rgba(10, 10, 10, 0.08)');
      grad.addColorStop(1, 'rgba(10, 10, 10, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
      ctx.fill();

      // ─── Two Lines signature at center (Genesis motif) ───
      const lineLen = 26;
      const lineY1 = cy - 3;
      const lineY2 = cy + 3;
      // Lines slightly modulated by state
      const lineIntensity =
        mode === 'idle' ? 0.85
        : mode === 'listening' ? 0.7
        : 1;
      ctx.strokeStyle = `rgba(10, 10, 10, ${lineIntensity})`;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(cx - lineLen / 2, lineY1);
      ctx.lineTo(cx + lineLen / 2, lineY1);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - lineLen / 2, lineY2);
      ctx.lineTo(cx + lineLen / 2, lineY2);
      ctx.stroke();

      // ─── Outer hairline (atmosphere) ───
      ctx.beginPath();
      ctx.arc(cx, cy, 75, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(10, 10, 10, 0.08)';
      ctx.lineWidth = 1;
      ctx.stroke();

      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => cancelAnimationFrame(raf);
  }, []);

  const statusLabel: Record<string, string> = {
    idle: 'Standby',
    listening: 'Listening',
    qa: 'Thinking',
    presenting: 'Presenting',
    speaking: 'Speaking',
  };
  const gradientState = mapAgentMode(agentMode);

  return (
    <div
      className="flex flex-col items-center gap-3 py-6"
      style={{ borderBottom: '1px solid var(--gen-border)' }}
    >
      {/* Top label */}
      <div className="gen-label" style={{ color: 'var(--gen-text-mute)' }}>AI Agent</div>

      {/* Canvas orb */}
      <canvas ref={canvasRef} aria-hidden style={{ display: 'block' }} />

      {/* Status row */}
      <div className="flex flex-col items-center gap-1">
        <div
          style={{
            fontSize: 13,
            fontWeight: 400,
            letterSpacing: '0.02em',
            color: 'var(--gen-text)',
          }}
        >
          {statusLabel[agentMode] || statusLabel.idle}
        </div>
        <div
          className="gen-label"
          style={{ color: 'var(--gen-text-mute)' }}
        >
          field · {gradientState}
        </div>
      </div>
    </div>
  );
}
