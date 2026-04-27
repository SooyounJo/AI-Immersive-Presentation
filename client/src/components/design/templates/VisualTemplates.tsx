import type { Slide } from '@shared/types';

export function renderVisualTemplate(slide: Slide, textColor: string, subTextColor: string, textShadow: string) {
  const id = slide.templateId;
  if (!id) return null;

  if (id === 'figma-18') {
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

  if (id === 'figma-19') {
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

  if (id === 'figma-20') {
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

  if (id === 'figma-21') {
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

  if (id === 'figma-22') {
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

  if (id === 'figma-23') {
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

  if (id === 'figma-24') {
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

  if (id === 'figma-25') {
    return (
      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 20, padding: '20% 6% 0' }}>
        <div>
          <div style={{ fontSize: 60, fontWeight: 700, color: textColor, textShadow }}>Venn diagram</div>
          <div style={{ marginTop: 12, fontSize: 34, lineHeight: 1.35, color: subTextColor, textShadow }}>
            Show how a few concepts overlap, and how they&apos;re unique.
          </div>
        </div>
        <div style={{ position: 'relative', height: 520 }}>
          <div style={{ position: 'absolute', left: 92, top: 34, width: 356, height: 356, borderRadius: '50%', border: '3px solid #111', background: 'rgba(255,255,255,0.35)' }} />
          <div style={{ position: 'absolute', left: 300, top: 34, width: 356, height: 356, borderRadius: '50%', border: '3px solid #111', background: 'rgba(0,0,0,0.92)' }} />
          <div style={{ position: 'absolute', left: 284, top: 188, fontSize: 28, color: '#111' }}>Label</div>
          <div style={{ position: 'absolute', left: 400, top: 188, fontSize: 28, color: '#111' }}>Label</div>
          <div style={{ position: 'absolute', left: 560, top: 188, fontSize: 28, color: '#f3f3f3' }}>Label</div>
        </div>
      </div>
    );
  }

  if (id === 'figma-26') {
    return (
      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 20, padding: '20% 6% 0' }}>
        <div>
          <div style={{ fontSize: 60, fontWeight: 700, color: textColor, textShadow }}>Top of funnel</div>
          <div style={{ marginTop: 12, fontSize: 34, lineHeight: 1.35, color: subTextColor, textShadow }}>
            Show how a few concepts relate sequentially, from top to bottom.
          </div>
        </div>
        <div style={{ position: 'relative', height: 520, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 520, height: 420, clipPath: 'polygon(0 0, 100% 0, 62% 100%, 38% 100%)', background: '#d0d0d0', position: 'relative', overflow: 'hidden' }}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} style={{ position: 'absolute', left: 0, right: 0, top: `${(i + 1) * 20}%`, height: 3, background: '#ececec' }} />
            ))}
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} style={{ position: 'absolute', left: '50%', top: `${9 + i * 20}%`, transform: 'translateX(-50%)', fontSize: 28, fontWeight: 600, color: '#111' }}>
                Label
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (id === 'figma-27' || id === 'figma-28') {
    const compact = id === 'figma-28';
    return (
      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', display: compact ? 'block' : 'grid', gridTemplateColumns: compact ? undefined : '1fr 1.2fr', gap: 30, padding: compact ? '8% 8%' : '8% 8%', alignItems: 'stretch' }}>
        {!compact && (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'left' }}>
            <div style={{ fontSize: 60, fontWeight: 700, color: textColor, textShadow }}>Desktop designs</div>
            <div style={{ marginTop: 12, fontSize: 34, lineHeight: 1.35, color: subTextColor, textShadow }}>
              Support your visuals with a bit of context, then link away to the designs.
            </div>
          </div>
        )}
        <div style={{ position: 'relative', height: compact ? 640 : 520, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ width: compact ? 1120 : 860, maxWidth: '100%', height: compact ? 540 : 430, borderRadius: '26px 26px 10px 10px', border: '8px solid #0f0f0f', borderBottomWidth: 10, background: '#dbdbdb', position: 'relative', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
            <div style={{ position: 'absolute', left: '50%', top: 0, transform: 'translateX(-50%)', width: 86, height: 24, borderRadius: '0 0 10px 10px', background: '#0f0f0f' }} />
            <div style={{ position: 'absolute', inset: 10, background: 'repeating-conic-gradient(#ececec 0% 25%, #dfdfdf 0% 50%) 50% / 44px 44px' }} />
          </div>
          <div style={{ position: 'absolute', bottom: 0, width: compact ? 1240 : 980, maxWidth: '108%', height: 34, borderRadius: 16, background: 'linear-gradient(180deg, #d6d6d6 0%, #b8b8b8 100%)', border: '1px solid #b0b0b0' }} />
        </div>
      </div>
    );
  }

  if (id === 'figma-29') {
    return (
      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 84, height: 84, borderRadius: '50%', background: 'repeating-conic-gradient(#ececec 0% 25%, #dfdfdf 0% 50%) 50% / 18px 18px', marginBottom: 28 }} />
        <div style={{ fontSize: 52, color: textColor, textShadow, maxWidth: 920, textAlign: 'center', lineHeight: 1.25 }}>
          “This is a stellar quote from a user or customer that really stands out.”
        </div>
        <div style={{ marginTop: 14, fontSize: 28, color: subTextColor, textShadow }}>Full Name · Location</div>
      </div>
    );
  }

  if (id === 'figma-30' || id === 'figma-31' || id === 'figma-32') {
    const count = id === 'figma-30' ? 3 : id === 'figma-31' ? 4 : 2;
    return (
      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', display: 'grid', gridTemplateColumns: `repeat(${count}, 1fr)`, gap: id === 'figma-31' ? 24 : 42, alignItems: 'center', padding: '0 6%' }}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div style={{ width: 84, height: 84, borderRadius: '50%', background: 'repeating-conic-gradient(#ececec 0% 25%, #dfdfdf 0% 50%) 50% / 18px 18px', margin: '0 auto 22px' }} />
            <div style={{ fontSize: id === 'figma-31' ? 40 : 46, color: textColor, textShadow, lineHeight: 1.25 }}>
              “The best quotes relate to your deck&apos;s overall narrative.”
            </div>
            <div style={{ marginTop: 12, fontSize: 28, color: subTextColor, textShadow }}>Full Name · Location</div>
          </div>
        ))}
      </div>
    );
  }

  if (id === 'figma-33') {
    return (
      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', padding: '18% 6% 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 44, marginBottom: 72 }}>
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={`top-${i}`} style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 54, lineHeight: 1.24, color: textColor, textShadow }}>
                “The best quotes relate to your deck&apos;s overall narrative.”
              </div>
              <div style={{ marginTop: 12, fontSize: 30, color: subTextColor, textShadow }}>Full Name · Location</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 44 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={`bottom-${i}`} style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 54, lineHeight: 1.24, color: textColor, textShadow }}>
                “The best quotes relate to your deck&apos;s overall narrative.”
              </div>
              <div style={{ marginTop: 12, fontSize: 30, color: subTextColor, textShadow }}>Full Name · Location</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (id === 'figma-34') {
    return (
      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 56, alignItems: 'center', padding: '0 8%' }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 54, lineHeight: 1.24, color: textColor, textShadow }}>
              “The best quotes relate to your deck&apos;s overall narrative.”
            </div>
            <div style={{ marginTop: 12, fontSize: 30, color: subTextColor, textShadow }}>Full Name · Location</div>
          </div>
        ))}
      </div>
    );
  }

  if (id === 'figma-35') {
    const topRow = 6;
    const bottomRow = 5;
    return (
      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', padding: '8% 5% 0' }}>
        <div style={{ fontSize: 64, fontWeight: 700, textAlign: 'center', color: textColor, textShadow }}>Meet the team</div>
        <div style={{ marginTop: 54, display: 'grid', gridTemplateColumns: `repeat(${topRow}, 1fr)`, gap: 26 }}>
          {Array.from({ length: topRow }).map((_, i) => (
            <div key={`t-${i}`} style={{ textAlign: 'center' }}>
              <div style={{ width: 86, height: 86, borderRadius: '50%', background: 'repeating-conic-gradient(#ececec 0% 25%, #dfdfdf 0% 50%) 50% / 18px 18px', margin: '0 auto 14px' }} />
              <div style={{ fontSize: 36, color: textColor, textShadow }}>Full Name</div>
              <div style={{ marginTop: 8, fontSize: 34, color: subTextColor, textShadow }}>Role</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 44, display: 'grid', gridTemplateColumns: `repeat(${bottomRow}, 1fr)`, gap: 34, padding: '0 8%' }}>
          {Array.from({ length: bottomRow }).map((_, i) => (
            <div key={`b-${i}`} style={{ textAlign: 'center' }}>
              <div style={{ width: 86, height: 86, borderRadius: '50%', background: 'repeating-conic-gradient(#ececec 0% 25%, #dfdfdf 0% 50%) 50% / 18px 18px', margin: '0 auto 14px' }} />
              <div style={{ fontSize: 36, color: textColor, textShadow }}>Full Name</div>
              <div style={{ marginTop: 8, fontSize: 34, color: subTextColor, textShadow }}>Role</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
