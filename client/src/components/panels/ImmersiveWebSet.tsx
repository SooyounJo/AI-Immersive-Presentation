export function ImmersiveWebSet({
  onApplyPreset,
  onAddPreset,
}: {
  onApplyPreset: (url: string) => void;
  onAddPreset: (url: string) => Promise<void>;
}) {
  const items = [
    {
      name: 'Spline 3D Scene',
      url: 'https://spline.design/',
      description: 'Real-time 3D interaction and camera-move presets.',
    },
    {
      name: 'Rive Motion UI',
      url: 'https://rive.app/',
      description: 'UI micro-interactions and state-transition motion.',
    },
    {
      name: 'Three.js WebGL',
      url: 'https://threejs.org/examples/',
      description: 'WebGL immersive demos and effect references.',
    },
    {
      name: 'Lottie Motion Pack',
      url: 'https://lottiefiles.com/',
      description: 'Vector motion assets and icon animation.',
    },
    {
      name: 'GSAP Interaction',
      url: 'https://gsap.com/showcase/',
      description: 'Scroll- and timeline-driven advanced interactions.',
    },
  ];
  return (
    <div style={{ border: '1px solid var(--gen-border)', background: 'var(--gen-white)', padding: 12 }}>
      <div className="gen-label mb-2">Immersive Interaction Web Set</div>
      <div style={{ fontSize: 11, color: 'var(--gen-text-mute)', marginBottom: 10 }}>Apply presets here without leaving the app.</div>
      <div className="space-y-2">
        {items.map((it) => (
          <div
            key={it.url}
            style={{
              padding: '10px',
              border: '1px solid var(--gen-border)',
              background: 'var(--gen-white)',
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 3 }}>{it.name}</div>
            <div style={{ fontSize: 10, color: 'var(--gen-text-mute)', marginBottom: 8 }}>{it.description}</div>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => onApplyPreset(it.url)}
                className="gen-go-btn"
                style={{
                  flex: 1,
                  height: 26,
                  border: '1px solid var(--gen-border)',
                  background: '#1e2638',
                  color: '#f5f7ff',
                  fontSize: 10,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                Apply
              </button>
              <button
                type="button"
                onClick={() => onAddPreset(it.url)}
                className="gen-go-btn"
                style={{
                  flex: 1,
                  height: 26,
                  border: '1px solid var(--gen-black)',
                  background: 'var(--gen-black)',
                  color: 'var(--gen-white)',
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                aria-label="Add to assets"
              >
                GO
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
