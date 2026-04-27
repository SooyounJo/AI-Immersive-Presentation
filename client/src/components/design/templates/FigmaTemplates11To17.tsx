import type { Slide } from '@shared/types';

export function FigmaTemplate11({ slide, textColor, subTextColor, textShadow }: { slide: Slide, textColor: string, subTextColor: string, textShadow: string }) {
  return (
    <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 36, padding: '8% 8%', alignItems: 'stretch' }}>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'left' }}>
        <div style={{ fontSize: 56, fontWeight: 700, color: textColor, textShadow }}>{slide.title}</div>
        <div style={{ marginTop: 14, fontSize: 28, lineHeight: 1.35, color: subTextColor, textShadow }}>
          Add a quick description of each thing, with enough context to understand what&apos;s up.
        </div>
      </div>
      <div style={{ background: 'repeating-conic-gradient(#ececec 0% 25%, #dfdfdf 0% 50%) 50% / 44px 44px', borderRadius: 2, justifySelf: 'stretch', alignSelf: 'stretch' }} />
    </div>
  );
}

export function FigmaTemplate12({ slide, textColor, subTextColor, textShadow }: { slide: Slide, textColor: string, subTextColor: string, textShadow: string }) {
  return (
    <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 36, padding: '8% 8%', alignItems: 'stretch' }}>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'left' }}>
        <div>
          <div style={{ fontSize: 34, fontWeight: 700, color: textColor, textShadow }}>Subtitle</div>
          <div style={{ marginTop: 12, fontSize: 68, fontWeight: 700, lineHeight: 1, color: textColor, textShadow }}>{slide.title}</div>
        </div>
        <div style={{ marginTop: 36, fontSize: 28, lineHeight: 1.35, color: subTextColor, textShadow, maxWidth: 520 }}>
          Add a quick description of each thing, with enough context to understand what&apos;s up.
        </div>
      </div>
      <div style={{ background: 'repeating-conic-gradient(#ececec 0% 25%, #dfdfdf 0% 50%) 50% / 44px 44px', justifySelf: 'stretch', alignSelf: 'stretch' }} />
    </div>
  );
}

export function FigmaTemplate13({ slide, textColor, subTextColor, textShadow }: { slide: Slide, textColor: string, subTextColor: string, textShadow: string }) {
  return (
    <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 36, padding: '8% 8%', alignItems: 'stretch' }}>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'left' }}>
        <div>
          <div style={{ fontSize: 34, fontWeight: 700, color: textColor, textShadow }}>Subtitle</div>
          <div style={{ marginTop: 12, fontSize: 68, fontWeight: 700, lineHeight: 1, color: textColor, textShadow }}>{slide.title}</div>
        </div>
        <div style={{ marginTop: 36, fontSize: 28, lineHeight: 1.35, color: subTextColor, textShadow, maxWidth: 520 }}>
          Add a quick description of each thing, with enough context to understand what&apos;s up.
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: 12, alignSelf: 'stretch' }}>
        <div style={{ background: 'repeating-conic-gradient(#ececec 0% 25%, #dfdfdf 0% 50%) 50% / 44px 44px', minHeight: 220 }} />
        <div style={{ background: 'repeating-conic-gradient(#ececec 0% 25%, #dfdfdf 0% 50%) 50% / 44px 44px', minHeight: 220 }} />
      </div>
    </div>
  );
}

export function FigmaTemplate14({ slide, textColor, textShadow }: { slide: Slide, textColor: string, subTextColor?: string, textShadow: string }) {
  return (
    <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', display: 'grid', gridTemplateRows: '1fr auto', overflow: 'hidden' }}>
      <div style={{ background: 'repeating-linear-gradient(180deg, #e9e9e9 0 64px, #dcdcdc 64px 128px)' }} />
      <div style={{ padding: '16px 24px', textAlign: 'center', fontSize: 46, fontWeight: 700, color: textColor, textShadow }}>{slide.title}</div>
    </div>
  );
}

export function FigmaTemplate15({ slide, textColor, subTextColor, textShadow }: { slide: Slide, textColor: string, subTextColor: string, textShadow: string }) {
  return (
    <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', padding: '10% 6% 0' }}>
      <div style={{ fontSize: 56, fontWeight: 700, color: textColor, textShadow, marginBottom: 24 }}>{slide.title}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>
        <div>
          <div style={{ height: 220, background: 'repeating-conic-gradient(#ececec 0% 25%, #dfdfdf 0% 50%) 50% / 44px 44px' }} />
          <div style={{ marginTop: 16, fontSize: 42, fontWeight: 700, color: textColor, textShadow }}>First thing</div>
          <div style={{ marginTop: 8, fontSize: 24, lineHeight: 1.35, color: subTextColor, textShadow }}>
            Add a quick description of each thing, with enough context.
          </div>
        </div>
        <div>
          <div style={{ height: 220, background: 'repeating-conic-gradient(#ececec 0% 25%, #dfdfdf 0% 50%) 50% / 44px 44px' }} />
          <div style={{ marginTop: 16, fontSize: 42, fontWeight: 700, color: textColor, textShadow }}>Second thing</div>
          <div style={{ marginTop: 8, fontSize: 24, lineHeight: 1.35, color: subTextColor, textShadow }}>
            Keep it short and sweet, so they&apos;re easy to scan and remember.
          </div>
        </div>
      </div>
    </div>
  );
}

export function FigmaTemplate17({ slide, textColor, subTextColor, textShadow }: { slide: Slide, textColor: string, subTextColor: string, textShadow: string }) {
  return (
    <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', padding: '8% 8%' }}>
      <div style={{ fontSize: 56, fontWeight: 700, color: textColor, textShadow, marginBottom: 24, textAlign: 'left' }}>{slide.title}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18, alignItems: 'start' }}>
        {['First thing', 'Second thing', 'Third thing'].map((h) => (
          <div key={h} style={{ textAlign: 'left' }}>
            <div style={{ height: 210, background: 'repeating-conic-gradient(#ececec 0% 25%, #dfdfdf 0% 50%) 50% / 44px 44px' }} />
            <div style={{ marginTop: 14, fontSize: 36, fontWeight: 700, color: textColor, textShadow }}>{h}</div>
            <div style={{ marginTop: 6, fontSize: 22, lineHeight: 1.35, color: subTextColor, textShadow }}>
              Add a quick description with enough context to understand what&apos;s up.
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
