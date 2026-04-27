import type { Slide } from '@shared/types';

export function FigmaTemplate25({ textColor, subTextColor, textShadow }: { slide: Slide, textColor: string, subTextColor: string, textShadow: string }) {
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

export function FigmaTemplate26({ textColor, subTextColor, textShadow }: { slide: Slide, textColor: string, subTextColor: string, textShadow: string }) {
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

export function FigmaTemplate27({ textColor, subTextColor, textShadow }: { slide: Slide, textColor: string, subTextColor: string, textShadow: string }) {
  return (
    <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 30, padding: '8% 8%', alignItems: 'stretch' }}>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'left' }}>
        <div style={{ fontSize: 60, fontWeight: 700, color: textColor, textShadow }}>Desktop designs</div>
        <div style={{ marginTop: 12, fontSize: 34, lineHeight: 1.35, color: subTextColor, textShadow }}>
          Support your visuals with a bit of context, then link away to the designs.
        </div>
      </div>
      <div style={{ position: 'relative', height: 520, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
        <div style={{ width: 860, maxWidth: '100%', height: 430, borderRadius: '26px 26px 10px 10px', border: '8px solid #0f0f0f', borderBottomWidth: 10, background: '#dbdbdb', position: 'relative', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
          <div style={{ position: 'absolute', left: '50%', top: 0, transform: 'translateX(-50%)', width: 86, height: 24, borderRadius: '0 0 10px 10px', background: '#0f0f0f' }} />
          <div style={{ position: 'absolute', inset: 10, background: 'repeating-conic-gradient(#ececec 0% 25%, #dfdfdf 0% 50%) 50% / 44px 44px' }} />
        </div>
        <div style={{ position: 'absolute', bottom: 0, width: 980, maxWidth: '108%', height: 34, borderRadius: 16, background: 'linear-gradient(180deg, #d6d6d6 0%, #b8b8b8 100%)', border: '1px solid #b0b0b0' }} />
      </div>
    </div>
  );
}

export function FigmaTemplate28() {
  return (
    <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', display: 'block', gap: 30, padding: '8% 8%', alignItems: 'stretch' }}>
      <div style={{ position: 'relative', height: 640, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
        <div style={{ width: 1120, maxWidth: '100%', height: 540, borderRadius: '26px 26px 10px 10px', border: '8px solid #0f0f0f', borderBottomWidth: 10, background: '#dbdbdb', position: 'relative', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
          <div style={{ position: 'absolute', left: '50%', top: 0, transform: 'translateX(-50%)', width: 86, height: 24, borderRadius: '0 0 10px 10px', background: '#0f0f0f' }} />
          <div style={{ position: 'absolute', inset: 10, background: 'repeating-conic-gradient(#ececec 0% 25%, #dfdfdf 0% 50%) 50% / 44px 44px' }} />
        </div>
        <div style={{ position: 'absolute', bottom: 0, width: 1240, maxWidth: '108%', height: 34, borderRadius: 16, background: 'linear-gradient(180deg, #d6d6d6 0%, #b8b8b8 100%)', border: '1px solid #b0b0b0' }} />
      </div>
    </div>
  );
}

export function FigmaTemplate29({ textColor, subTextColor, textShadow }: { slide: Slide, textColor: string, subTextColor: string, textShadow: string }) {
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

export function FigmaTemplate30({ textColor, subTextColor, textShadow }: { slide: Slide, textColor: string, subTextColor: string, textShadow: string }) {
  return (
    <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', display: 'grid', gridTemplateColumns: `repeat(3, 1fr)`, gap: 42, alignItems: 'center', padding: '0 6%' }}>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} style={{ textAlign: 'center' }}>
          <div style={{ width: 84, height: 84, borderRadius: '50%', background: 'repeating-conic-gradient(#ececec 0% 25%, #dfdfdf 0% 50%) 50% / 18px 18px', margin: '0 auto 22px' }} />
          <div style={{ fontSize: 46, color: textColor, textShadow, lineHeight: 1.25 }}>
            “The best quotes relate to your deck&apos;s overall narrative.”
          </div>
          <div style={{ marginTop: 12, fontSize: 28, color: subTextColor, textShadow }}>Full Name · Location</div>
        </div>
      ))}
    </div>
  );
}

export function FigmaTemplate31({ textColor, subTextColor, textShadow }: { slide: Slide, textColor: string, subTextColor: string, textShadow: string }) {
  return (
    <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', display: 'grid', gridTemplateColumns: `repeat(4, 1fr)`, gap: 24, alignItems: 'center', padding: '0 6%' }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} style={{ textAlign: 'center' }}>
          <div style={{ width: 84, height: 84, borderRadius: '50%', background: 'repeating-conic-gradient(#ececec 0% 25%, #dfdfdf 0% 50%) 50% / 18px 18px', margin: '0 auto 22px' }} />
          <div style={{ fontSize: 40, color: textColor, textShadow, lineHeight: 1.25 }}>
            “The best quotes relate to your deck&apos;s overall narrative.”
          </div>
          <div style={{ marginTop: 12, fontSize: 28, color: subTextColor, textShadow }}>Full Name · Location</div>
        </div>
      ))}
    </div>
  );
}

export function FigmaTemplate32({ textColor, subTextColor, textShadow }: { slide: Slide, textColor: string, subTextColor: string, textShadow: string }) {
  return (
    <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', display: 'grid', gridTemplateColumns: `repeat(2, 1fr)`, gap: 42, alignItems: 'center', padding: '0 6%' }}>
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} style={{ textAlign: 'center' }}>
          <div style={{ width: 84, height: 84, borderRadius: '50%', background: 'repeating-conic-gradient(#ececec 0% 25%, #dfdfdf 0% 50%) 50% / 18px 18px', margin: '0 auto 22px' }} />
          <div style={{ fontSize: 46, color: textColor, textShadow, lineHeight: 1.25 }}>
            “The best quotes relate to your deck&apos;s overall narrative.”
          </div>
          <div style={{ marginTop: 12, fontSize: 28, color: subTextColor, textShadow }}>Full Name · Location</div>
        </div>
      ))}
    </div>
  );
}

export function FigmaTemplate33({ textColor, subTextColor, textShadow }: { slide: Slide, textColor: string, subTextColor: string, textShadow: string }) {
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

export function FigmaTemplate34({ textColor, subTextColor, textShadow }: { slide: Slide, textColor: string, subTextColor: string, textShadow: string }) {
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

export function FigmaTemplate35({ textColor, subTextColor, textShadow }: { slide: Slide, textColor: string, subTextColor: string, textShadow: string }) {
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
