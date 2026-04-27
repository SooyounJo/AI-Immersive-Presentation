import type { Slide } from '@shared/types';

export function FigmaTemplate7({ slide, textColor, subTextColor, textShadow }: { slide: Slide, textColor: string, subTextColor: string, textShadow: string }) {
  return (
    <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', display: 'grid', gridTemplateColumns: '1fr 1.25fr', gap: 26, padding: '16% 6% 0' }}>
      <div style={{ fontSize: 58, fontWeight: 700, color: textColor, textShadow }}>{slide.title}</div>
      <div style={{ display: 'grid', gap: 22 }}>
        {['First thing', 'Second thing', 'Third thing'].map((h) => (
          <div key={h}>
            <div style={{ fontSize: 42, fontWeight: 700, color: textColor, lineHeight: 1.1, textShadow }}>{h}</div>
            <div style={{ marginTop: 6, fontSize: 26, color: subTextColor, lineHeight: 1.35, textShadow }}>
              Add a quick description with enough context to understand what&apos;s up.
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FigmaTemplate8({ slide, textColor, subTextColor, textShadow }: { slide: Slide, textColor: string, subTextColor: string, textShadow: string }) {
  return (
    <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 24, padding: '20% 6% 0' }}>
      <div style={{ fontSize: 58, fontWeight: 700, color: textColor, textShadow }}>{slide.title}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>
        {['First thing', 'Second thing', 'Third thing', 'Fourth thing'].map((h) => (
          <div key={h}>
            <div style={{ fontSize: 38, fontWeight: 700, color: textColor, lineHeight: 1.1, textShadow }}>{h}</div>
            <div style={{ marginTop: 6, fontSize: 24, color: subTextColor, lineHeight: 1.32, textShadow }}>
              Keep it short and sweet so it&apos;s easy to scan.
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FigmaTemplate9({ slide, textColor, subTextColor, textShadow }: { slide: Slide, textColor: string, subTextColor: string, textShadow: string }) {
  return (
    <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', padding: '12% 6% 0' }}>
      <div style={{ fontSize: 54, fontWeight: 700, color: textColor, textShadow, marginBottom: 42 }}>{slide.title}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
        {['First thing', 'Second thing', 'Third thing', 'Fourth thing'].map((h) => (
          <div key={h}>
            <div style={{ fontSize: 42, fontWeight: 700, lineHeight: 1.08, color: textColor, textShadow }}>{h}</div>
            <div style={{ marginTop: 8, fontSize: 24, lineHeight: 1.33, color: subTextColor, textShadow }}>
              Keep it short and sweet, so they&apos;re easy to scan and remember.
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FigmaTemplate10({ slide, textColor, textShadow }: { slide: Slide, textColor: string, subTextColor?: string, textShadow: string }) {
  return (
    <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', padding: '10% 6% 0' }}>
      <div style={{ fontSize: 54, fontWeight: 700, color: textColor, textShadow, marginBottom: 30 }}>{slide.title}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
        {[
          ['Principle 1', 'This is what we believe.'],
          ['Principle 2', 'It’s how we make decisions.'],
          ['Principle 3', 'And what we aim to achieve.'],
        ].map(([h, p]) => (
          <div key={h} style={{ background: 'rgba(0,0,0,0.12)', borderRadius: 12, minHeight: 410, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 34, fontWeight: 700, color: textColor, textShadow }}>{h}</div>
            <div style={{ fontSize: 52, fontWeight: 700, lineHeight: 1.08, color: textColor, textShadow }}>{p}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
