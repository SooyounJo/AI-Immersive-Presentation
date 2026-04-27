import type { Slide } from '@shared/types';

export function FigmaTemplate1({ slide, textColor, subTextColor, textShadow }: { slide: Slide, textColor: string, subTextColor: string, textShadow: string }) {
  return (
    <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', padding: '20% 6% 0' }}>
      <div style={{ fontSize: 62, fontWeight: 700, color: textColor, lineHeight: 1.05, textShadow }}>{slide.title}</div>
      <div style={{ marginTop: 16, fontSize: 34, color: subTextColor, textShadow }}>{slide.content.replace(/^#\s[^\n]+/, '').trim()}</div>
    </div>
  );
}

export function FigmaTemplate2({ slide, textColor, textShadow }: { slide: Slide, textColor: string, subTextColor?: string, textShadow: string }) {
  return (
    <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', padding: '52% 6% 0' }}>
      <div style={{ fontSize: 72, fontWeight: 700, color: textColor, lineHeight: 1.05, textShadow }}>{slide.title}</div>
    </div>
  );
}

export function FigmaTemplate3({ slide, textColor, subTextColor, textShadow }: { slide: Slide, textColor: string, subTextColor: string, textShadow: string }) {
  const subtitle = slide.content.replace(/^#\s[^\n]+/, '').trim();
  return (
    <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', padding: '50% 6% 0' }}>
      <div style={{ fontSize: 72, fontWeight: 700, color: textColor, lineHeight: 1.05, textShadow }}>{slide.title}</div>
      <div style={{ marginTop: 16, fontSize: 34, color: subTextColor, textShadow }}>{subtitle}</div>
    </div>
  );
}

export function FigmaTemplate4({ slide, textColor, subTextColor, textShadow }: { slide: Slide, textColor: string, subTextColor: string, textShadow: string }) {
  const subtitle = slide.content.replace(/^#\s[^\n]+/, '').trim();
  return (
    <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 72, fontWeight: 700, color: textColor, lineHeight: 1.05, textShadow }}>{slide.title}</div>
      <div style={{ marginTop: 16, fontSize: 34, color: subTextColor, textShadow }}>{subtitle}</div>
    </div>
  );
}

export function FigmaTemplate5({ slide, textColor, textShadow }: { slide: Slide, textColor: string, subTextColor?: string, textShadow: string }) {
  const subtitle = slide.content.replace(/^#\s[^\n]+/, '').trim();
  return (
    <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', padding: '70% 6% 0' }}>
      <div style={{ fontSize: 30, fontWeight: 700, color: textColor, textShadow }}>{subtitle}</div>
      <div style={{ marginTop: 10, fontSize: 74, fontWeight: 700, color: textColor, lineHeight: 1, textShadow }}>{slide.title}</div>
    </div>
  );
}

export function FigmaTemplate6({ slide, textColor, subTextColor, textShadow }: { slide: Slide, textColor: string, subTextColor: string, textShadow: string }) {
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
