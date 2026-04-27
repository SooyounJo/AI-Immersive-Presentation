import { useCallback, useEffect, useRef, useState } from 'react';
import type { Slide, SlideMedia } from '@shared/types';
import { SlideBackgroundLayer } from '../backgrounds/OglBackgrounds';
import { SlideTemplateCanvas } from './TemplateRenderer';
import { parseContentLines } from './utils/templateHelpers';

interface MainCanvasProps {
  slide: Slide;
  currentSlideIndex: number;
  totalSlides: number;
  canvasMode: 'preview' | 'slides';
  isNight: boolean;
  onUpdateSlide: (patch: Partial<Slide>) => void;
  hasGeneratedVoice: boolean;
  isVoicePlaying: boolean;
  onPlayGeneratedVoice: () => void;
}

export function MainCanvas({
  slide,
  canvasMode,
  isNight,
  onUpdateSlide,
  hasGeneratedVoice,
  isVoicePlaying,
  onPlayGeneratedVoice,
}: MainCanvasProps) {
  const stageCanvasRef = useRef<HTMLDivElement>(null);
  const [selectedMediaUrl, setSelectedMediaUrl] = useState<string | null>(null);
  const [mediaPtr, setMediaPtr] = useState<
    | { kind: 'move'; url: string; ptrOffsetX: number; ptrOffsetY: number; w: number; h: number }
    | { kind: 'resize'; url: string; base: { x: number; y: number; w: number; h: number }; sx: number; sy: number }
    | null
  >(null);

  const slideRef = useRef(slide);
  useEffect(() => { slideRef.current = slide; }, [slide]);
  const mediaPtrRef = useRef(mediaPtr);
  useEffect(() => { mediaPtrRef.current = mediaPtr; }, [mediaPtr]);

  const parsed = parseContentLines(slide.content || '');
  const viewMode = canvasMode === 'slides' ? 'wireframe' : 'render';
  const legacyBackgroundMedia = (slide.media ?? []).find(
    (m) => m.kind === 'image'
      && (
        (m.name || '').toLowerCase().includes('reactbits background')
        || m.url.includes('reactbits.dev/backgrounds')
      ),
  );
  const visualMediaItems = (slide.media ?? []).filter((m) => {
    if (m.kind !== 'image' && m.kind !== 'video') return false;
    if (legacyBackgroundMedia && m.url === legacyBackgroundMedia.url) return false;
    return true;
  });
  const mediaLayoutDefault = (m: SlideMedia, index: number) =>
    m.layout ?? (index === 0 ? { x: 4, y: 4, w: 92, h: 40 } : { x: 8, y: 48, w: 84, h: 36 });

  const applyMediaLayout = useCallback(
    (url: string, layout: { x: number; y: number; w: number; h: number }) => {
      const next = layout;
      const clamped = {
        x: Math.max(0, Math.min(94, next.x)),
        y: Math.max(0, Math.min(94, next.y)),
        w: Math.max(8, Math.min(100 - next.x, next.w)),
        h: Math.max(8, Math.min(100 - next.y, next.h)),
      };
      const s = slideRef.current;
      onUpdateSlide({
        media: (s.media ?? []).map((item) => (item.url === url ? { ...item, layout: clamped } : item)),
      });
    },
    [onUpdateSlide],
  );

  useEffect(() => {
    if (!mediaPtr) return;
    const onMove = (e: PointerEvent) => {
      const p = mediaPtrRef.current;
      if (!p) return;
      const stage = stageCanvasRef.current;
      if (!stage) return;
      const r = stage.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return;
      if (p.kind === 'move') {
        const xPct = ((e.clientX - p.ptrOffsetX - r.left) / r.width) * 100;
        const yPct = ((e.clientY - p.ptrOffsetY - r.top) / r.height) * 100;
        applyMediaLayout(p.url, {
          x: Math.max(0, Math.min(100 - p.w, xPct)),
          y: Math.max(0, Math.min(100 - p.h, yPct)),
          w: p.w,
          h: p.h,
        });
      } else {
        const dx = ((e.clientX - p.sx) / r.width) * 100;
        const dy = ((e.clientY - p.sy) / r.height) * 100;
        applyMediaLayout(p.url, {
          x: p.base.x,
          y: p.base.y,
          w: p.base.w + dx,
          h: p.base.h + dy,
        });
      }
    };
    const onUp = () => setMediaPtr(null);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [mediaPtr, applyMediaLayout]);

  useEffect(() => {
    const onDocPointerDown = (e: PointerEvent) => {
      const el = stageCanvasRef.current;
      if (!el || el.contains(e.target as Node)) return;
      setSelectedMediaUrl(null);
    };
    window.addEventListener('pointerdown', onDocPointerDown);
    return () => window.removeEventListener('pointerdown', onDocPointerDown);
  }, []);
  const hasBackground = Boolean(slide.background?.kind);
  const backgroundKind = slide.background?.kind;
  const hasProceduralBackground = backgroundKind === 'darkVeil'
    || backgroundKind === 'grainient'
    || backgroundKind === 'particles'
    || backgroundKind === 'iridescence';
  
  const hasCustomVideoBackground = backgroundKind === 'customVideo';
  const solidBackgroundColor = backgroundKind === 'solidBlack'
    ? '#000000'
    : backgroundKind === 'solidWhite'
      ? '#ffffff'
      : undefined;
  const customBackgroundImage = backgroundKind === 'customImage'
    ? String(slide.background?.params?.imageUrl ?? '')
    : '';
  const isDarkBg = backgroundKind === 'darkVeil'
    || backgroundKind === 'particles'
    || backgroundKind === 'iridescence'
    || backgroundKind === 'grainient'
    || backgroundKind === 'solidBlack'
    || backgroundKind === 'customVideo'
    || backgroundKind === 'customImage';
  const textColor = isDarkBg ? '#f5f7ff' : '#111111';
  const subTextColor = isDarkBg ? 'rgba(245,247,255,0.88)' : '#2f2f2f';
  const textShadow = isDarkBg ? '0 1px 2px rgba(0,0,0,0.45)' : '0 1px 2px rgba(255,255,255,0.4)';
  return (
    <div style={{
      border: isNight ? '1px solid #2b2f39' : '1px solid #c5ccd6',
      background: isNight ? '#1f2633' : '#f2f4f8',
      padding: 10,
    }}
    >
      <div
        style={{
          width: '100%',
          height: 'clamp(340px, 62vh, 620px)',
          background: isNight ? '#252b36' : '#e4e8ef',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          id="design-slide-export-root"
          ref={stageCanvasRef}
          style={{
            width: 'min(100%, calc(clamp(340px, 62vh, 620px) * 16 / 9))',
            height: 'auto',
            aspectRatio: '16 / 9',
            background: solidBackgroundColor ?? (hasBackground ? 'transparent' : '#ffffff'),
            border: '1px solid #e4e4e4',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {hasProceduralBackground ? (
            <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
              <SlideBackgroundLayer kind={slide.background?.kind} params={slide.background?.params} />
            </div>
          ) : null}
          {hasCustomVideoBackground ? (
            <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
              <video
                src={slide.background?.params?.url as string || '/vid.mp4'}
                autoPlay
                loop
                muted
                playsInline
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', pointerEvents: 'none' }} />
            </div>
          ) : null}
          {customBackgroundImage ? (
            <img
              src={customBackgroundImage}
              alt=""
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }}
            />
          ) : null}
          {canvasMode === 'preview'
            && visualMediaItems.map((m, mediaIdx) => {
              const L = mediaLayoutDefault(m, mediaIdx);
              const selected = selectedMediaUrl === m.url;
              return (
                <div
                  key={`${m.url}-${mediaIdx}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedMediaUrl(m.url);
                  }}
                  onPointerDown={(e) => {
                    if ((e.target as HTMLElement).closest('[data-media-resize]')) return;
                    const stage = stageCanvasRef.current;
                    if (!stage) return;
                    const r = stage.getBoundingClientRect();
                    if (r.width < 1 || r.height < 1) return;
                    e.stopPropagation();
                    setSelectedMediaUrl(m.url);
                    setMediaPtr({
                      kind: 'move',
                      url: m.url,
                      ptrOffsetX: e.clientX - (r.left + (L.x / 100) * r.width),
                      ptrOffsetY: e.clientY - (r.top + (L.y / 100) * r.height),
                      w: L.w,
                      h: L.h,
                    });
                  }}
                  style={{
                    position: 'absolute',
                    left: `${L.x}%`,
                    top: `${L.y}%`,
                    width: `${L.w}%`,
                    height: `${L.h}%`,
                    zIndex: 2,
                    boxSizing: 'border-box',
                    border: selected ? '2px solid #5f9dff' : '1px solid rgba(228,228,228,0.85)',
                    borderRadius: 4,
                    overflow: 'hidden',
                    cursor: mediaPtr?.url === m.url && mediaPtr.kind === 'move' ? 'grabbing' : 'grab',
                    background: 'rgba(0,0,0,0.04)',
                  }}
                >
                  {m.kind === 'video' ? (
                    <video
                      src={m.url}
                      style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', pointerEvents: 'none' }}
                      autoPlay
                      muted
                      loop
                      playsInline
                    />
                  ) : (
                    <img
                      src={m.url}
                      alt={m.name || ''}
                      style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', pointerEvents: 'none' }}
                    />
                  )}
                  {selected ? (
                    <div
                      data-media-resize
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        const stage = stageCanvasRef.current;
                        if (!stage) return;
                        setMediaPtr({
                          kind: 'resize',
                          url: m.url,
                          base: { ...L },
                          sx: e.clientX,
                          sy: e.clientY,
                        });
                      }}
                      style={{
                        position: 'absolute',
                        right: -2,
                        bottom: -2,
                        width: 12,
                        height: 12,
                        borderRadius: 2,
                        background: '#5f9dff',
                        border: '1px solid #0f1420',
                        cursor: 'nwse-resize',
                        zIndex: 3,
                      }}
                    />
                  ) : null}
                </div>
              );
            })}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              padding: 10,
              overflow: 'hidden',
              pointerEvents: canvasMode === 'preview' && visualMediaItems.length > 0 ? 'none' : 'auto',
            }}
          >
            <SlideTemplateCanvas
              slide={slide}
              parsed={parsed}
              mode={viewMode}
              textColor={textColor}
              subTextColor={subTextColor}
              textShadow={textShadow}
              onUpdateSlide={onUpdateSlide}
              pointerThroughCanvas={canvasMode === 'preview' && visualMediaItems.length > 0}
            />
          </div>
          {hasGeneratedVoice && (
            <button
              type="button"
              data-export-hide
              onClick={onPlayGeneratedVoice}
              title="Play generated voice"
              style={{
                position: 'absolute',
                left: 12,
                bottom: 12,
                width: 32,
                height: 32,
                borderRadius: '50%',
                border: '1px solid rgba(95,157,255,0.9)',
                background: 'rgba(13,20,35,0.75)',
                color: '#f5f7ff',
                fontSize: 14,
                cursor: 'pointer',
                zIndex: 3,
              }}
            >
              {isVoicePlaying ? '⏸' : '🔊'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
