import { useEffect, useRef } from 'react';
import { usePresentationStore } from '../stores/presentationStore';

/**
 * The agent is the presentation's voice — not a separate panel.
 * This component overlays the slide as the agent's embodied presence.
 *
 * Visual language:
 *   - Two Lines signature (Genesis brand mark) is the body
 *   - Surrounding ring + ripples respond to state
 *   - Sits top-right of the slide frame
 */
export function SlideAgentPresence() {
  const { agentMode, agentVisible } = usePresentationStore();
  if (!agentVisible) return null;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modeRef = useRef(agentMode);

  useEffect(() => { modeRef.current = agentMode; }, [agentMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const SIZE = 140;
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

      const breathe = 1 + Math.sin(t * 1.1) * 0.025;

      // Outer radiating waves — speaking / presenting
      if (mode === 'speaking' || mode === 'presenting') {
        for (let i = 0; i < 4; i++) {
          const phase = ((t * 0.85) + i * 0.25) % 1;
          const r = 26 + phase * 42;
          const alpha = (1 - phase) * 0.3;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(10,10,10,${alpha})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      // Listening: contracting ripples
      if (mode === 'listening') {
        for (let i = 0; i < 3; i++) {
          const phase = 1 - (((t * 0.7) + i * 0.33) % 1);
          const r = 18 + phase * 48;
          const alpha = phase * 0.38;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(10,10,10,${alpha})`;
          ctx.lineWidth = 1.1;
          ctx.stroke();
        }
      }

      // Thinking — orbit dots
      if (mode === 'qa') {
        for (let i = 0; i < 6; i++) {
          const a = t * 0.85 + (i / 6) * Math.PI * 2;
          const r = 44;
          const x = cx + Math.cos(a) * r;
          const y = cy + Math.sin(a) * r;
          ctx.beginPath();
          ctx.arc(x, y, 1.4, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(10,10,10,0.55)';
          ctx.fill();
        }
      }

      // Core ring
      const ringR = 32 * breathe;
      ctx.beginPath();
      ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(10,10,10,1)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Inner soft fill
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, ringR);
      grad.addColorStop(0, 'rgba(10,10,10,0.06)');
      grad.addColorStop(1, 'rgba(10,10,10,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
      ctx.fill();

      // Two Lines — Genesis brand mark as the "voice" icon
      const lineLen = 22;
      const lineY1 = cy - 2.5;
      const lineY2 = cy + 2.5;
      ctx.strokeStyle = 'rgba(10,10,10,1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - lineLen / 2, lineY1);
      ctx.lineTo(cx + lineLen / 2, lineY1);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - lineLen / 2, lineY2);
      ctx.lineTo(cx + lineLen / 2, lineY2);
      ctx.stroke();

      // Atmospheric outer hairline
      ctx.beginPath();
      ctx.arc(cx, cy, 60, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(10,10,10,0.07)';
      ctx.lineWidth = 1;
      ctx.stroke();

      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  // Status label only appears when agent is engaged (stays out of the way in idle)
  const statusLabel: Record<string, string | null> = {
    idle: null,
    listening: 'Listening',
    qa: 'Responding',
    presenting: 'Presenting',
    speaking: 'Speaking',
  };
  const label = statusLabel[agentMode];

  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        top: 28,
        right: 28,
        zIndex: 5,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        pointerEvents: 'none',
      }}
    >
      <canvas ref={canvasRef} style={{ display: 'block' }} />
      {label && (
        <div
          className="gen-fade"
          style={{
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--gen-text)',
            padding: '3px 10px',
            border: '1px solid var(--gen-black)',
            background: 'rgba(255,255,255,0.82)',
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
}
