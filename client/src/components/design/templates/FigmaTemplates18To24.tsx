import type { Slide } from '@shared/types';

export function FigmaTemplate18({ textColor, subTextColor, textShadow }: { slide?: Slide, textColor: string, subTextColor: string, textShadow: string }) {
  return (
    <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', padding: '22% 6% 0' }}>
      <div style={{ fontSize: 92, fontWeight: 700, color: textColor, textShadow, lineHeight: 1 }}>XX%</div>
      <div style={{ marginTop: 20, fontSize: 46, lineHeight: 1.3, color: subTextColor, textShadow, maxWidth: 980 }}>
        Highlight a key metric-like a goal, objective, or insight-that supports the narrative of your deck.
      </div>
      <div style={{ marginTop: 18, fontSize: 30, color: subTextColor, textShadow }}>Add a link to a relevant doc or dashboard.</div>
    </div>
  );
}

export function FigmaTemplate19({ slide, textColor, subTextColor, textShadow }: { slide: Slide, textColor: string, subTextColor: string, textShadow: string }) {
  return (
    <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 34, padding: '28% 6% 0' }}>
      <div style={{ fontSize: 56, fontWeight: 700, color: textColor, textShadow, alignSelf: 'center' }}>{slide.title}</div>
      <div style={{ display: 'grid', gap: 18 }}>
        {['Metric 1', 'Metric 2', 'Metric 3'].map((m) => (
          <div key={m} style={{ display: 'grid', gridTemplateColumns: '180px 1fr', alignItems: 'baseline', columnGap: 20 }}>
            <div style={{ fontSize: 70, fontWeight: 700, color: textColor, lineHeight: 1, textShadow }}>XX%</div>
            <div>
              <div style={{ fontSize: 46, fontWeight: 700, color: textColor, textShadow }}>{m}</div>
              <div style={{ marginTop: 4, fontSize: 24, color: subTextColor, textShadow }}>Add a description or highlight changes</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FigmaTemplate20({ slide, textColor, subTextColor, textShadow }: { slide: Slide, textColor: string, subTextColor: string, textShadow: string }) {
  return (
    <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', padding: '12% 6% 0' }}>
      <div style={{ fontSize: 56, fontWeight: 700, color: textColor, textShadow, marginBottom: 74 }}>{slide.title}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 34 }}>
        {[1, 2, 3].map((n) => (
          <div key={n}>
            <div style={{ fontSize: 76, fontWeight: 700, color: textColor, lineHeight: 1, textShadow }}>XX%</div>
            <div style={{ marginTop: 10, fontSize: 26, lineHeight: 1.35, color: subTextColor, textShadow }}>
              Add a quick description of each thing, with enough context to understand what&apos;s up.
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FigmaTemplate21({ slide, textColor, subTextColor, textShadow }: { slide: Slide, textColor: string, subTextColor: string, textShadow: string }) {
  return (
    <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 34, padding: '23% 6% 0' }}>
      <div>
        <div style={{ fontSize: 56, fontWeight: 700, color: textColor, textShadow }}>{slide.title}</div>
        <div style={{ marginTop: 18, fontSize: 32, lineHeight: 1.35, color: subTextColor, textShadow }}>
          Description about the data beside. Lorem ipsum dolor sit amet, consectetur adipiscing.
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 26 }}>
        {[['61%', 'Metric 1'], ['56%', 'Metric 2'], ['55%', 'Metric 3'], ['48%', 'Metric 4']].map(([v, m]) => (
          <div key={m}>
            <div style={{ fontSize: 84, fontWeight: 700, color: textColor, lineHeight: 1, textShadow }}>{v}</div>
            <div style={{ marginTop: 8, fontSize: 38, color: subTextColor, textShadow }}>{m}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FigmaTemplate22({ slide, textColor, subTextColor, textShadow }: { slide: Slide, textColor: string, subTextColor: string, textShadow: string }) {
  return (
    <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', padding: '10% 6% 0' }}>
      <div style={{ fontSize: 54, fontWeight: 700, color: textColor, textShadow, marginBottom: 40 }}>{slide.title}</div>
      <div style={{ position: 'relative', height: 430 }}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 184, height: 4, background: 'rgba(0,0,0,0.75)' }} />
        {[
          { x: 0.20, y: 20, title: 'H1 2025', body: 'Use this paragraph space to say a bit more.' },
          { x: 0.60, y: 38, title: 'H1 2025', body: 'If you only have a few milestones.' },
          { x: 0.00, y: 220, title: 'H2 2024', body: 'This slide is for mapping out dates.' },
          { x: 0.40, y: 220, title: 'H2 2025', body: 'If you need to squeeze in more milestones.' },
          { x: 0.80, y: 220, title: 'June 2024', body: 'We ran out of stuff to write here.' },
        ].map((p, idx) => (
          <div key={idx} style={{ position: 'absolute', left: `${p.x * 100}%`, top: p.y, width: 240 }}>
            <div style={{ fontSize: 40, fontWeight: 700, color: textColor, textShadow }}>{p.title}</div>
            <div style={{ marginTop: 8, fontSize: 24, lineHeight: 1.35, color: subTextColor, textShadow }}>{p.body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FigmaTemplate23({ slide, textColor, subTextColor, textShadow }: { slide: Slide, textColor: string, subTextColor: string, textShadow: string }) {
  return (
    <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 20, padding: '20% 6% 0' }}>
      <div>
        <div style={{ fontSize: 60, fontWeight: 700, color: textColor, textShadow }}>{slide.title}</div>
        <div style={{ marginTop: 12, fontSize: 34, lineHeight: 1.35, color: subTextColor, textShadow }}>
          Show how a few nested concepts relate to one another.
        </div>
      </div>
      <div style={{ position: 'relative', height: 520 }}>
        {[220, 180, 140, 100].map((r, i) => (
          <div key={r} style={{ position: 'absolute', left: '50%', top: i * 38, transform: 'translateX(-50%)', width: r * 2, height: r * 2, borderRadius: '50%', border: '3px solid #111' }} />
        ))}
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{ position: 'absolute', left: '50%', top: 110 + i * 96, transform: 'translateX(-50%)', fontSize: 28, color: textColor }}>Label</div>
        ))}
      </div>
    </div>
  );
}

export function FigmaTemplate24({ slide, textColor, subTextColor, textShadow }: { slide: Slide, textColor: string, subTextColor: string, textShadow: string }) {
  return (
    <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 20, padding: '20% 6% 0' }}>
      <div>
        <div style={{ fontSize: 60, fontWeight: 700, color: textColor, textShadow }}>{slide.title}</div>
        <div style={{ marginTop: 12, fontSize: 34, lineHeight: 1.35, color: subTextColor, textShadow }}>
          Show where a few concepts live on 2 different scales.
        </div>
      </div>
      <div style={{ position: 'relative', height: 520 }}>
        <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 3, background: '#111' }} />
        <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 3, background: '#111' }} />
        {[
          { x: '26%', y: '26%' }, { x: '74%', y: '26%' }, { x: '26%', y: '74%' }, { x: '74%', y: '74%' },
        ].map((p, i) => (
          <div key={i} style={{ position: 'absolute', left: p.x, top: p.y, transform: 'translate(-50%, -50%)', width: i % 2 === 0 ? 98 : 122, height: i % 2 === 0 ? 98 : 122, borderRadius: '50%', background: 'rgba(0,0,0,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: textColor }}>
            Label
          </div>
        ))}
      </div>
    </div>
  );
}
