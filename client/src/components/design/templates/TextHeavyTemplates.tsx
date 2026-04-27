import type { Slide } from '@shared/types';

export function renderTextHeavyTemplate(slide: Slide, textColor: string, subTextColor: string, textShadow: string) {
  const id = slide.templateId;
  if (!id) return null;

  if (id === 'figma-1') {
    return (
      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', padding: '20% 6% 0' }}>
        <div style={{ fontSize: 62, fontWeight: 700, color: textColor, lineHeight: 1.05, textShadow }}>{slide.title}</div>
        <div style={{ marginTop: 16, fontSize: 34, color: subTextColor, textShadow }}>{slide.content.replace(/^#\s[^\n]+/, '').trim()}</div>
      </div>
    );
  }

  if (id === 'figma-2') {
    return (
      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', padding: '52% 6% 0' }}>
        <div style={{ fontSize: 72, fontWeight: 700, color: textColor, lineHeight: 1.05, textShadow }}>{slide.title}</div>
      </div>
    );
  }

  if (id === 'figma-3') {
    const subtitle = slide.content.replace(/^#\s[^\n]+/, '').trim();
    return (
      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', padding: '50% 6% 0' }}>
        <div style={{ fontSize: 72, fontWeight: 700, color: textColor, lineHeight: 1.05, textShadow }}>{slide.title}</div>
        <div style={{ marginTop: 16, fontSize: 34, color: subTextColor, textShadow }}>{subtitle}</div>
      </div>
    );
  }

  if (id === 'figma-4') {
    const subtitle = slide.content.replace(/^#\s[^\n]+/, '').trim();
    return (
      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 72, fontWeight: 700, color: textColor, lineHeight: 1.05, textShadow }}>{slide.title}</div>
        <div style={{ marginTop: 16, fontSize: 34, color: subTextColor, textShadow }}>{subtitle}</div>
      </div>
    );
  }

  if (id === 'figma-5') {
    const subtitle = slide.content.replace(/^#\s[^\n]+/, '').trim();
    return (
      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', padding: '70% 6% 0' }}>
        <div style={{ fontSize: 30, fontWeight: 700, color: textColor, textShadow }}>{subtitle}</div>
        <div style={{ marginTop: 10, fontSize: 74, fontWeight: 700, color: textColor, lineHeight: 1, textShadow }}>{slide.title}</div>
      </div>
    );
  }

  if (id === 'figma-6') {
    const body = slide.content.replace(/^#\s[^\n]+/, '').trim();
    return (
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          height: '100%',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          alignItems: 'center',
          columnGap: 24,
          padding: '0 10%',
        }}
      >
        <div
          style={{
            justifySelf: 'start',
            textAlign: 'left',
            fontSize: 62,
            fontWeight: 700,
            color: textColor,
            lineHeight: 1.08,
            textShadow,
          }}
        >
          {slide.title}
        </div>
        <div
          style={{
            justifySelf: 'end',
            maxWidth: 460,
            textAlign: 'left',
            fontSize: 22,
            color: subTextColor,
            lineHeight: 1.45,
            textShadow,
          }}
        >
          {body}
        </div>
      </div>
    );
  }

  if (id === 'figma-7') {
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

  if (id === 'figma-8') {
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

  if (id === 'figma-9') {
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

  if (id === 'figma-10') {
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

  if (id === 'figma-11') {
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

  if (id === 'figma-12') {
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

  if (id === 'figma-13') {
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

  if (id === 'figma-14') {
    return (
      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', display: 'grid', gridTemplateRows: '1fr auto', overflow: 'hidden' }}>
        <div style={{ background: 'repeating-linear-gradient(180deg, #e9e9e9 0 64px, #dcdcdc 64px 128px)' }} />
        <div style={{ padding: '16px 24px', textAlign: 'center', fontSize: 46, fontWeight: 700, color: textColor, textShadow }}>{slide.title}</div>
      </div>
    );
  }

  if (id === 'figma-15' || id === 'figma-16') {
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

  if (id === 'figma-17') {
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

  return null;
}
