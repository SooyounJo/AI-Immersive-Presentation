import { useCallback, useEffect, useRef, useState } from 'react';
import { Reorder } from 'motion/react';
import { usePresentationStore } from '../stores/presentationStore';
import type { Slide, SlideMedia } from '../types';
import { ContextPanel } from './ContextPanel';
import { InsightsPanel } from './InsightsPanel';
import { SlideBackgroundLayer } from './backgrounds/OglBackgrounds';
import { API_ROOT } from '../api';
import { SlideTemplateCanvas, slideRailPreviewSubtitle, parseContentLines } from './design/TemplateRenderer';
import { MetaEditor } from './design/DesignEditors';

export function DesignView() {
  const {
    presentation,
    currentSlideIndex,
    goToSlide,
    updateMeta,
    updateSlide,
    addSlide,
    deleteSlide,
    setSlides,
    uiThemeMode: themeMode,
    setUiThemeMode: setThemeMode,
  } = usePresentationStore();

  const [section] = useState<'meta' | 'slides' | 'insights'>('slides');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [canvasMode] = useState<'preview' | 'slides'>('preview');
  const [voicePreviewUrls, setVoicePreviewUrls] = useState<Record<number, string>>({});
  const [playingVoiceSlideId, setPlayingVoiceSlideId] = useState<number | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<'male' | 'female'>('male');
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const handleReorder = (newSlides: Slide[]) => {
    if (!presentation) return;
    const currentSlideId = presentation.slides[currentSlideIndex].id;
    const newIndex = newSlides.findIndex((s) => s.id === currentSlideId);
    setSlides(newSlides);
    if (newIndex !== -1) {
      goToSlide(newIndex);
    }
  };

  const stopPreviewAudio = () => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    setPlayingVoiceSlideId(null);
  };

  const playGeneratedVoice = async (slideId: number) => {
    const url = voicePreviewUrls[slideId];
    if (!url) return;
    stopPreviewAudio();
    const audio = new Audio(url);
    previewAudioRef.current = audio;
    setPlayingVoiceSlideId(slideId);
    audio.onended = () => setPlayingVoiceSlideId(null);
    audio.onerror = () => setPlayingVoiceSlideId(null);
    try {
      await audio.play();
    } catch (e) {
      console.error('Voice preview play failed:', e);
      setPlayingVoiceSlideId(null);
    }
  };

  const handleGenerateVoice = async () => {
    if (!slide) return;
    const text = (slide.speakerNotes || '').trim() || slide.title || 'Voice preview';
    const ttsVoice = selectedVoice === 'female' ? 'nova' : 'onyx';
    setSaveStatus('saving');
    try {
      const response = await fetch(`${API_ROOT}/tts/synthesize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: ttsVoice }),
      });
      if (!response.ok) throw new Error('TTS synthesize failed');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setVoicePreviewUrls((prev) => {
        if (prev[slide.id]) URL.revokeObjectURL(prev[slide.id]);
        return { ...prev, [slide.id]: url };
      });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 1500);
    } catch (e) {
      console.error(e);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  useEffect(() => {
    return () => {
      stopPreviewAudio();
      Object.values(voicePreviewUrls).forEach((url) => URL.revokeObjectURL(url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!presentation) {
    return (
      <div className="flex h-full min-h-0" style={{ background: '#d9d9d9' }}>
        <div className="w-[208px] shrink-0" style={{ background: '#efefef', borderRight: '1px solid #dfdfdf' }} />
        <div className="flex-1 min-w-0 flex items-center justify-center" style={{ background: '#efefef' }}>
          <div style={{ fontSize: 12, letterSpacing: '0.12em', color: '#666', textTransform: 'uppercase' }}>
            Loading design board...
          </div>
        </div>
        <div className="w-[320px] shrink-0" style={{ background: '#f4f3f5', borderLeft: '1px solid #e0e0e0' }} />
      </div>
    );
  }

  const slide = presentation.slides[currentSlideIndex];
  const totalSlides = presentation.slides.length;

  const isNight = themeMode === 'night';
  const uiBorder = isNight ? '1px solid rgba(255,255,255,0.12)' : '1px solid #cfcfcf';
  const uiSurface = isNight ? 'rgba(12,12,14,0.9)' : '#efefef';
  const uiSurfaceStrong = isNight ? 'rgba(28,28,31,0.94)' : '#f8f8f8';
  const uiPanelShadow = isNight ? '0 10px 28px rgba(0,0,0,0.35)' : 'none';

  return (
    <div
      className="flex h-full min-h-0"
      style={{
        background: isNight ? 'linear-gradient(180deg, #07080b 0%, #090a0d 100%)' : '#d9d9d9',
        color: isNight ? '#f5f7ff' : '#171717',
      }}
    >
      <div
        className="w-[272px] shrink-0 min-h-0 flex flex-col overflow-hidden"
        style={{
          height: 'calc(100vh - 52px)',
          maxHeight: 'calc(100vh - 52px)',
          position: 'relative',
          background: uiSurface,
          borderRight: uiBorder,
          backdropFilter: isNight ? 'blur(10px)' : 'none',
          boxShadow: uiPanelShadow,
        }}
      >
        <div className="p-2 min-h-0 flex-1 overflow-y-auto no-scrollbar" style={{ overscrollBehavior: 'contain', paddingBottom: 78, WebkitOverflowScrolling: 'touch' }}>
          <Reorder.Group axis="y" values={presentation.slides} onReorder={handleReorder}>
            {presentation.slides.map((s, i) => (
              <Reorder.Item
                key={s.id}
                value={s}
                onClick={() => goToSlide(i)}
                style={{
                  padding: 0,
                  border: 'none',
                  borderRadius: 0,
                  marginBottom: 8,
                  background: 'transparent',
                  cursor: 'grab',
                  listStyle: 'none',
                }}
              >
                <div style={{ fontSize: 12, marginBottom: 6, color: isNight ? '#a7a9af' : '#666', paddingLeft: 2 }}>{i + 1}</div>
                <div
                  style={{
                    width: '100%',
                    aspectRatio: '16 / 9',
                    border: i === currentSlideIndex
                      ? '1px solid #5f9dff'
                      : (isNight ? '1px solid #303646' : '1px solid #c5cad4'),
                    borderRadius: 6,
                    background: isNight ? 'linear-gradient(180deg, rgba(17,18,22,0.92) 0%, rgba(12,13,16,0.95) 100%)' : '#ffffff',
                    padding: 8,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-start',
                  }}
                >
                  <div className="gen-label" style={{ color: isNight ? '#c2c4ca' : '#666' }}>{s.sceneMode === 'scene' ? 'SCENE' : 'SLIDE'}</div>
                  <div style={{ fontSize: 13, marginTop: 4, fontWeight: 600, color: isNight ? '#f5f7ff' : '#171717' }}>{s.title}</div>
                  <div
                    style={{
                      fontSize: 9,
                      lineHeight: 1.35,
                      color: isNight ? '#b8c4d8' : '#4b5563',
                      marginTop: 3,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical' as const,
                      overflow: 'hidden',
                      wordBreak: 'break-word',
                    }}
                  >
                    {slideRailPreviewSubtitle(s)}
                  </div>
                </div>
                <div className="flex items-start justify-end gap-2" style={{ marginTop: 4, paddingRight: 2 }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (presentation.slides.length > 1) deleteSlide(i);
                    }}
                    title="Delete slide"
                    style={{
                      border: 'none',
                      background: 'transparent',
                      fontSize: 18,
                      lineHeight: 1,
                      color: isNight ? '#cfd6e8' : '#444',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    -
                  </button>
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
          <button
            onClick={() => addSlide({
              background: slide?.background,
              textStyle: slide?.textStyle,
              sceneMode: slide?.sceneMode ?? 'slide',
            })}
            style={{
              width: '100%',
              height: 34,
                border: uiBorder,
                background: uiSurfaceStrong,
              fontSize: 22,
              lineHeight: 1,
              cursor: 'pointer',
              color: isNight ? '#f5f7ff' : '#222',
              marginTop: 2,
              backdropFilter: isNight ? 'blur(6px)' : 'none',
            }}
            aria-label="Add slide"
            title="Add slide"
          >
            +
          </button>
        </div>
        <div style={{ height: 10, borderTop: uiBorder, flexShrink: 0 }} />
        <div style={{ position: 'absolute', left: 10, bottom: 28, display: 'flex', justifyContent: 'flex-start', zIndex: 4 }}>
          <button
            onClick={() => setThemeMode(themeMode === 'night' ? 'morning' : 'night')}
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              border: uiBorder,
              background: isNight ? 'rgba(34,35,40,0.95)' : '#f0f0f0',
              color: isNight ? '#f5f7ff' : '#111',
              fontSize: 18,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title={isNight ? '밤 모드' : '아침 모드'}
            aria-label={isNight ? 'Switch to morning mode' : 'Switch to night mode'}
          >
            {isNight ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M14.5 3.5C11 4.4 8.5 7.6 8.5 11.3C8.5 15.8 12.2 19.5 16.7 19.5C18.2 19.5 19.7 19.1 20.9 18.3C19.6 20.8 16.9 22.5 13.8 22.5C9.1 22.5 5.2 18.6 5.2 13.9C5.2 9.8 8 6.3 11.8 5.4C12.8 5.1 13.8 5.1 14.5 5.2V3.5Z" fill="currentColor" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="4.2" fill="currentColor" />
                <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M12 2.8V5.2" />
                  <path d="M12 18.8V21.2" />
                  <path d="M2.8 12H5.2" />
                  <path d="M18.8 12H21.2" />
                  <path d="M5.5 5.5L7.2 7.2" />
                  <path d="M16.8 16.8L18.5 18.5" />
                  <path d="M18.5 5.5L16.8 7.2" />
                  <path d="M7.2 16.8L5.5 18.5" />
                </g>
              </svg>
            )}
          </button>
        </div>
      </div>

      <div
        className="flex-1 min-w-0 flex flex-col"
        style={{
          background: isNight ? 'rgba(9,12,18,0.72)' : '#efefef',
          backdropFilter: isNight ? 'blur(8px)' : 'none',
        }}
      >
        <div
          className="px-4 py-2 flex items-center justify-between gap-3"
          style={{
            borderBottom: uiBorder,
            background: uiSurface,
            backdropFilter: 'blur(8px)',
          }}
        >
          <div
            className="truncate"
            style={{
              fontSize: 12,
              color: isNight ? '#d7def3' : '#3a3a3a',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
            title={presentation.title || 'Untitled'}
          >
            {presentation.title || 'Untitled'}
          </div>
          <div className="gen-label" style={{ color: '#f5f7ff' }}>{`${String(currentSlideIndex + 1).padStart(2, '0')}/${String(totalSlides).padStart(2, '0')}`}</div>
        </div>

        <div className="p-2 min-h-0 overflow-hidden">
          {section === 'meta' ? (
            <MetaEditor presentation={presentation} onUpdate={updateMeta} />
          ) : section === 'insights' ? (
            <InsightsPanel />
          ) : (
            slide && (
              <>
                <SlideStagePanel
                  slide={slide}
                  currentSlideIndex={currentSlideIndex}
                  totalSlides={totalSlides}
                  canvasMode={canvasMode}
                  isNight={isNight}
                  onUpdateSlide={(patch) => updateSlide(currentSlideIndex, patch)}
                  hasGeneratedVoice={Boolean(voicePreviewUrls[slide.id])}
                  isVoicePlaying={playingVoiceSlideId === slide.id}
                  onPlayGeneratedVoice={() => playGeneratedVoice(slide.id)}
                />
                <div
                  style={{
                    background: isNight ? '#000000' : '#e8ecf2',
                    border: isNight ? '1px solid #1b1f2a' : '1px solid #b8c0cc',
                    marginTop: 10,
                    padding: '12px 10px',
                    display: 'grid',
                    gridTemplateColumns: 'auto minmax(0, 1fr) 88px',
                    gridTemplateRows: 'auto 68px',
                    columnGap: 0,
                    rowGap: 6,
                    alignItems: 'stretch',
                  }}
                >
                  <div className="gen-label" style={{ color: isNight ? '#d7def3' : '#3a4556', alignSelf: 'end', marginRight: 12 }}>Select Voice</div>
                  <div className="gen-label" style={{ color: isNight ? '#d7def3' : '#3a4556', alignSelf: 'end' }}>Slide Note</div>
                  <div />

                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginRight: 12 }}>
                      {[
                        { id: 'male' as const, label: 'Male' },
                        { id: 'female' as const, label: 'Female' },
                      ].map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setSelectedVoice(v.id)}
                          style={{ textAlign: 'center', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
                        >
                          <div
                            style={{
                              width: 30,
                              height: 30,
                              borderRadius: '50%',
                              background: isNight
                                ? (selectedVoice === v.id ? '#3b4f7a' : '#2a3040')
                                : (selectedVoice === v.id ? '#c5daf8' : '#dfe6f0'),
                              border: isNight
                                ? (selectedVoice === v.id ? '1px solid #5f9dff' : '1px solid #3a4256')
                                : (selectedVoice === v.id ? '1px solid #5f9dff' : '1px solid #9aa8bc'),
                              margin: '0 auto',
                              boxShadow: selectedVoice === v.id ? '0 0 0 1px rgba(95,157,255,0.35) inset' : 'none',
                            }}
                          />
                          <div style={{
                            fontSize: 10,
                            marginTop: 3,
                            color: isNight
                              ? (selectedVoice === v.id ? '#e7efff' : '#c8d0e6')
                              : (selectedVoice === v.id ? '#1a2d4d' : '#4a5568'),
                          }}
                          >
                            {v.label}
                          </div>
                        </button>
                      ))}
                  </div>
                  <textarea
                    className="gen-input"
                    rows={3}
                    value={slide.speakerNotes}
                    onChange={(e) => updateSlide(currentSlideIndex, { speakerNotes: e.target.value })}
                    placeholder="스크립트를 작성하세요"
                    style={{
                      background: isNight ? '#0f131d' : '#ffffff',
                      color: isNight ? '#f5f7ff' : '#171717',
                      border: isNight ? '1px solid #343c4f' : '1px solid #a8b4c4',
                      borderRight: 'none',
                      borderRadius: '4px 0 0 4px',
                      height: 68,
                      minHeight: 68,
                      maxHeight: 68,
                      resize: 'none',
                      boxSizing: 'border-box',
                      padding: '10px 12px',
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleGenerateVoice}
                    disabled={saveStatus === 'saving'}
                    className="gen-go-btn"
                    style={{
                      border: isNight ? '1px solid #343c4f' : '1px solid #8b98ab',
                      borderRadius: '0 4px 4px 0',
                      background: isNight ? '#252b39' : '#c5cedd',
                      color: isNight ? '#f5f7ff' : '#121826',
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: '0.06em',
                      lineHeight: 1.2,
                      cursor: 'pointer',
                      height: 68,
                      minHeight: 68,
                      alignSelf: 'stretch',
                      padding: '0 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    aria-label="Generate voice"
                  >
                    GO
                  </button>
                </div>
              </>
            )
          )}
        </div>
      </div>

      <div
        className="shrink-0 min-h-0 overflow-hidden flex flex-col"
        style={{
          width: 'clamp(300px, 30vw, 380px)',
          height: 'calc(100vh - 52px)',
          maxHeight: 'calc(100vh - 52px)',
          borderLeft: uiBorder,
          background: uiSurface,
          color: isNight ? '#f5f7ff' : '#171717',
          backdropFilter: isNight ? 'blur(10px)' : 'none',
          boxShadow: uiPanelShadow,
        }}
      >
        <div className="flex-1 min-h-0 overflow-y-auto" style={{ overscrollBehavior: 'contain' }}>
          <ContextPanel themeMode={themeMode} />
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */










/** Strip markdown title lines for slide-rail subtitle preview */



/* ---------------------------------------------------------------- */

function SlideStagePanel({
  slide,
  currentSlideIndex: _currentSlideIndex,
  totalSlides: _totalSlides,
  canvasMode,
  isNight,
  onUpdateSlide,
  hasGeneratedVoice,
  isVoicePlaying,
  onPlayGeneratedVoice,
}: {
  slide: Slide;
  currentSlideIndex: number;
  totalSlides: number;
  canvasMode: 'preview' | 'slides';
  isNight: boolean;
  onUpdateSlide: (patch: Partial<Slide>) => void;
  hasGeneratedVoice: boolean;
  isVoicePlaying: boolean;
  onPlayGeneratedVoice: () => void;
}) {
  const stageCanvasRef = useRef<HTMLDivElement>(null);
  const [selectedMediaUrl, setSelectedMediaUrl] = useState<string | null>(null);
  const [mediaPtr, setMediaPtr] = useState<
    | { kind: 'move'; url: string; ptrOffsetX: number; ptrOffsetY: number; w: number; h: number }
    | { kind: 'resize'; url: string; base: { x: number; y: number; w: number; h: number }; sx: number; sy: number }
    | null
  >(null);

  const slideRef = useRef(slide);
  slideRef.current = slide;
  const mediaPtrRef = useRef(mediaPtr);
  mediaPtrRef.current = mediaPtr;

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



/* ---------------------------------------------------------------- */



/* ---------------------------------------------------------------- */



