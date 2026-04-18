import { useEffect, useRef } from 'react';

/**
 * Deep-space cosmic background — canvas-rendered starfield + slow nebula drift.
 *
 * Inspired by Genesis brand page's space footage: absolute black depth,
 * soft far-blue nebula, twinkling stars, extremely slow parallax. Luxury
 * emptiness, not sci-fi chaos.
 */
export function CosmicBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // Generate star field (three layers for parallax)
    type Star = { x: number; y: number; size: number; baseAlpha: number; twinkleSpeed: number; twinklePhase: number; depth: number };
    const STAR_COUNT = 520;
    const stars: Star[] = Array.from({ length: STAR_COUNT }, () => {
      const depth = Math.random(); // 0 = far, 1 = near
      return {
        x: Math.random(),
        y: Math.random(),
        size: 0.3 + depth * 1.3,
        baseAlpha: 0.15 + depth * 0.7,
        twinkleSpeed: 0.3 + Math.random() * 1.2,
        twinklePhase: Math.random() * Math.PI * 2,
        depth,
      };
    });

    // A few brighter "signature" stars
    const beacons: Star[] = Array.from({ length: 8 }, () => ({
      x: Math.random(),
      y: Math.random(),
      size: 1.8 + Math.random() * 1.2,
      baseAlpha: 0.9,
      twinkleSpeed: 0.5 + Math.random() * 0.8,
      twinklePhase: Math.random() * Math.PI * 2,
      depth: 1,
    }));

    // Nebula clouds — soft colored radial patches that drift very slowly
    const nebulae = [
      { x: 0.22, y: 0.28, r: 520, hue: 232, alpha: 0.045 },
      { x: 0.78, y: 0.65, r: 620, hue: 268, alpha: 0.035 },
      { x: 0.5,  y: 0.85, r: 480, hue: 210, alpha: 0.03  },
      { x: 0.88, y: 0.15, r: 360, hue: 248, alpha: 0.025 },
    ];

    let raf = 0;
    const t0 = performance.now();

    const draw = () => {
      const t = (performance.now() - t0) / 1000;

      // Base — deep black
      ctx.fillStyle = '#050509';
      ctx.fillRect(0, 0, w, h);

      // Nebula clouds (drift slowly)
      for (let i = 0; i < nebulae.length; i++) {
        const n = nebulae[i];
        const dx = Math.sin(t * 0.04 + i) * 40;
        const dy = Math.cos(t * 0.05 + i * 1.7) * 30;
        const cx = n.x * w + dx;
        const cy = n.y * h + dy;
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, n.r);
        g.addColorStop(0, `hsla(${n.hue}, 60%, 40%, ${n.alpha})`);
        g.addColorStop(0.6, `hsla(${n.hue}, 40%, 20%, ${n.alpha * 0.4})`);
        g.addColorStop(1, 'hsla(0, 0%, 0%, 0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      }

      // Very subtle vertical gradient vignette (top darker)
      const vGrad = ctx.createLinearGradient(0, 0, 0, h);
      vGrad.addColorStop(0, 'rgba(0,0,0,0.35)');
      vGrad.addColorStop(0.5, 'rgba(0,0,0,0)');
      vGrad.addColorStop(1, 'rgba(0,0,0,0.25)');
      ctx.fillStyle = vGrad;
      ctx.fillRect(0, 0, w, h);

      // Stars — parallax drift
      for (const s of stars) {
        const parallaxX = Math.sin(t * 0.02 + s.y * 10) * s.depth * 8;
        const parallaxY = Math.cos(t * 0.018 + s.x * 10) * s.depth * 6;
        const twinkle = 0.5 + 0.5 * Math.sin(t * s.twinkleSpeed + s.twinklePhase);
        const alpha = s.baseAlpha * (0.65 + twinkle * 0.35);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(s.x * w + parallaxX, s.y * h + parallaxY, s.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Signature beacons with soft halo
      for (const b of beacons) {
        const twinkle = 0.5 + 0.5 * Math.sin(t * b.twinkleSpeed + b.twinklePhase);
        const alpha = b.baseAlpha * (0.7 + twinkle * 0.3);
        const x = b.x * w;
        const y = b.y * h;
        // halo
        const halo = ctx.createRadialGradient(x, y, 0, x, y, b.size * 8);
        halo.addColorStop(0, `rgba(200, 220, 255, ${alpha * 0.45})`);
        halo.addColorStop(1, 'rgba(200, 220, 255, 0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(x, y, b.size * 8, 0, Math.PI * 2);
        ctx.fill();
        // core
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, b.size, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        display: 'block',
      }}
    />
  );
}
