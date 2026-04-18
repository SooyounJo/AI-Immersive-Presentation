import { useEffect, useRef } from 'react';
import { STATE_MAP, type GradientState, type GradientVisual } from './states';

interface Props {
  state: GradientState;
  /**
   * Secondary modulation — a 0..1 scalar that can locally amplify pulse/contrast
   * without changing the primary state. Optional.
   */
  modulation?: number;
  /** debug: show performance stats (dev only) */
  debug?: boolean;
}

/**
 * Smooth interpolation toward target. Frame-rate independent.
 * factor ≈ 0.06 → ~200ms to reach ~90% of target at 60fps.
 */
function smoothLerp(current: number, target: number, factor: number, dt: number): number {
  const k = 1 - Math.pow(1 - factor, dt * 60);
  return current + (target - current) * k;
}

type LightSource = {
  baseX: number; // 0..1
  baseY: number;
  phase: number;
  driftRate: number;
  radiusFactor: number;
};

const LIGHTS: LightSource[] = [
  { baseX: 0.25, baseY: 0.30, phase: 0.0, driftRate: 0.22, radiusFactor: 0.8 },
  { baseX: 0.75, baseY: 0.40, phase: 2.1, driftRate: 0.18, radiusFactor: 0.9 },
  { baseX: 0.55, baseY: 0.75, phase: 4.3, driftRate: 0.28, radiusFactor: 0.75 },
  { baseX: 0.15, baseY: 0.80, phase: 1.2, driftRate: 0.24, radiusFactor: 0.7 },
  { baseX: 0.85, baseY: 0.15, phase: 3.5, driftRate: 0.20, radiusFactor: 0.65 },
];

export function AmbientGradient({ state, modulation = 0, debug = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GradientState>(state);
  const modRef = useRef(modulation);

  // Keep refs in sync with props (so the animation loop sees latest)
  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => { modRef.current = modulation; }, [modulation]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Size canvas at half-resolution for cheap blur + sharper scaling
    const RES_SCALE = 0.5;
    let w = 0;
    let h = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = Math.max(1, Math.floor(rect.width * RES_SCALE));
      h = Math.max(1, Math.floor(rect.height * RES_SCALE));
      canvas.width = w;
      canvas.height = h;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // Current (interpolated) visual values.
    const cur: GradientVisual = { ...STATE_MAP[stateRef.current] };

    let time = 0;
    let last = performance.now();
    let rafId = 0;
    let running = true;

    // Pause when tab hidden (save CPU)
    const onVisibility = () => {
      if (document.hidden) {
        running = false;
      } else if (!running) {
        running = true;
        last = performance.now();
        loop();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    function loop() {
      if (!running) return;
      const now = performance.now();
      const dtMs = Math.min(100, now - last); // clamp to avoid big jumps
      const dt = dtMs / 1000;
      last = now;

      // Interpolate toward target
      const target = STATE_MAP[stateRef.current];
      const lerpRate = 0.045; // base smoothness
      cur.hueA = smoothLerp(cur.hueA, target.hueA, lerpRate, dt);
      cur.hueB = smoothLerp(cur.hueB, target.hueB, lerpRate, dt);
      cur.saturation = smoothLerp(cur.saturation, target.saturation, lerpRate, dt);
      cur.brightness = smoothLerp(cur.brightness, target.brightness, lerpRate, dt);
      cur.contrast = smoothLerp(cur.contrast, target.contrast, lerpRate, dt);
      cur.spread = smoothLerp(cur.spread, target.spread, lerpRate, dt);
      cur.speed = smoothLerp(cur.speed, target.speed, lerpRate, dt);
      cur.pulse = smoothLerp(cur.pulse, target.pulse, lerpRate, dt);
      cur.softness = smoothLerp(cur.softness, target.softness, lerpRate, dt);
      cur.directionality = smoothLerp(cur.directionality, target.directionality, lerpRate, dt);
      cur.direction = smoothLerp(cur.direction, target.direction, lerpRate, dt);
      cur.base = smoothLerp(cur.base, target.base, lerpRate, dt);

      time += dt * (0.3 + cur.speed * 1.1);

      // Modulation
      const m = modRef.current ?? 0;
      const pulseAmt = cur.pulse * (1 + m * 0.6);
      const contrastAmt = cur.contrast * (1 + m * 0.35);

      // Apply softness via CSS filter
      const blurPx = Math.max(8, cur.softness * RES_SCALE);
      canvas.style.filter = `blur(${blurPx}px)`;

      // Clear + paint base
      const baseLightness = Math.floor(cur.base * 100);
      ctx.fillStyle = `hsl(0, 0%, ${baseLightness}%)`;
      ctx.fillRect(0, 0, w, h);

      // Render each light
      ctx.globalCompositeOperation = 'source-over';
      const diag = Math.hypot(w, h);

      for (let i = 0; i < LIGHTS.length; i++) {
        const L = LIGHTS[i];
        const wobbleT = time * L.driftRate + L.phase;

        // Base drift
        const driftX = Math.sin(wobbleT) * 0.14 * cur.spread;
        const driftY = Math.cos(wobbleT * 0.83) * 0.12 * cur.spread;

        // Directional bias
        const dirMag = cur.directionality * 0.18;
        const dx = Math.cos(cur.direction) * dirMag;
        const dy = Math.sin(cur.direction) * dirMag;

        const nx = L.baseX + driftX + dx;
        const ny = L.baseY + driftY + dy;

        // Keep center calmer by pushing lights outward slightly
        const cx = 0.5;
        const cy = 0.5;
        const vx = nx - cx;
        const vy = ny - cy;
        const dist = Math.hypot(vx, vy);
        const outwardBias = 0.08;
        const px = nx + (dist > 0 ? vx / dist : 0) * outwardBias;
        const py = ny + (dist > 0 ? vy / dist : 0) * outwardBias;

        const x = px * w;
        const y = py * h;

        const pulseOsc = 0.5 + 0.5 * Math.sin(time * 1.4 + L.phase * 1.3);
        const radius = diag * 0.45 * cur.spread * L.radiusFactor * (1 + (pulseOsc - 0.5) * 0.14 * pulseAmt);

        // Blend hue between A and B based on slow temporal shift
        const mix = 0.5 + 0.5 * Math.sin(time * 0.35 + i * 0.7);
        const hue = cur.hueA * (1 - mix) + cur.hueB * mix;

        const sat = Math.round(cur.saturation * 100);
        const lightness = Math.round(cur.brightness * 100);

        // Alpha scales with contrast
        const alpha = 0.22 * contrastAmt;

        const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
        grad.addColorStop(0.0, `hsla(${hue}, ${sat}%, ${lightness}%, ${alpha})`);
        grad.addColorStop(0.45, `hsla(${hue}, ${sat}%, ${lightness}%, ${alpha * 0.45})`);
        grad.addColorStop(1.0, `hsla(${hue}, ${sat}%, ${lightness}%, 0)`);

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      }

      // Central calming mask — keep content area quiet
      const centerMask = ctx.createRadialGradient(w * 0.5, h * 0.5, 0, w * 0.5, h * 0.5, diag * 0.28);
      centerMask.addColorStop(0, `hsla(0, 0%, ${baseLightness}%, 0.18)`);
      centerMask.addColorStop(1, 'hsla(0, 0%, 100%, 0)');
      ctx.fillStyle = centerMask;
      ctx.fillRect(0, 0, w, h);

      rafId = requestAnimationFrame(loop);
    }

    loop();

    return () => {
      running = false;
      cancelAnimationFrame(rafId);
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          // filter is applied dynamically in the loop
          transform: 'translateZ(0)', // GPU hint
          willChange: 'filter',
        }}
      />
      {debug && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            fontSize: 10,
            color: '#666',
            fontFamily: 'monospace',
            pointerEvents: 'none',
          }}
        >
          state: {state} · mod: {modulation?.toFixed(2)}
        </div>
      )}
    </div>
  );
}
