import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode, isValidElement, cloneElement, Children } from 'react';
import { Reorder } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { usePresentationStore } from '../stores/presentationStore';
import type { Slide, SlideLink, SlideMedia, TemplateTextBlock } from '../types';
import { PRESET_CARDS, type PresetCard } from '../data/slidePresets';
import { ContextPanel } from './ContextPanel';
import { InsightsPanel } from './InsightsPanel';
import { SlideBackgroundLayer } from './backgrounds/OglBackgrounds';
import { API_ROOT } from '../api';
import {
  IconPlus, IconClose, IconTrash,
  IconLink, IconPdf,
} from './icons';

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





function parseContentLines(content: string) {
  const lines = (content || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const title = lines.find((l) => l.startsWith('#'))?.replace(/^#+\s*/, '') || '';
  const bullets = lines.filter((l) => l.startsWith('- ')).map((l) => l.replace(/^- /, ''));
  const quote = lines.find((l) => l.startsWith('>'))?.replace(/^>\s*/, '') || '';
  const tableRows = lines.filter((l) => l.startsWith('|') && !l.includes('---'));
  return { title, bullets, quote, tableRows };
}

function getSpecialTemplateScale(templateId?: string) {
  if (!templateId) return 1;

  const compactHeavyText = new Set([
    'figma-18', 'figma-19', 'figma-20', 'figma-21',
    'figma-29', 'figma-30', 'figma-31', 'figma-32', 'figma-33', 'figma-34',
  ]);
  const mediumText = new Set([
    'figma-1', 'figma-2', 'figma-3', 'figma-4', 'figma-5', 'figma-6', 'figma-7', 'figma-8',
    'figma-9', 'figma-10', 'figma-11', 'figma-12', 'figma-13', 'figma-14', 'figma-15', 'figma-16',
    'figma-17', 'figma-22', 'figma-23', 'figma-24', 'figma-25', 'figma-26', 'figma-27', 'figma-28', 'figma-35',
  ]);

  // Global normalization for preset typography so template titles
  // don't look oversized compared to the base slide typography.
  // Keep enough safe-area so bottom rows don't get clipped.
  if (compactHeavyText.has(templateId)) return 0.88;
  if (mediumText.has(templateId)) return 0.92;
  return 0.92;
}

function scaleNumericStyle(value: unknown, factor: number) {
  if (typeof value === 'number') return Math.max(0, value * factor);
  if (typeof value === 'string' && /^-?\d+(\.\d+)?px$/.test(value.trim())) {
    const n = Number(value.replace('px', '').trim());
    return `${Math.max(0, n * factor)}px`;
  }
  return value;
}

function getMotionAnimation(
  preset?: string,
  intensity = 1,
  speed = 1,
): CSSProperties {
  if (!preset || preset === 'none') return {};
  const safeIntensity = Math.max(0.1, Math.min(2.4, intensity || 1));
  const safeSpeed = Math.max(0.25, Math.min(2.5, speed || 1));
  return {
    animationName: `gen-motion-${preset}`,
    animationDuration: `${(2 / safeSpeed).toFixed(2)}s`,
    animationTimingFunction: 'ease-in-out',
    animationIterationCount: 'infinite',
    animationFillMode: 'both',
    ['--motion-intensity' as any]: safeIntensity,
  };
}

function createEditableTemplateBlocks(
  templateId: string,
  title: string,
  body: string,
): TemplateTextBlock[] {
  if (templateId === 'figma-1') {
    return [
      { id: 'title-1', text: title || '', x: 6, y: 22, fontSize: 56, fontWeight: 700, maxWidth: 88, zIndex: 2 },
      { id: 'body-1', text: body || '', x: 6, y: 40, fontSize: 24, fontWeight: 400, maxWidth: 88, zIndex: 1 },
    ];
  }
  if (templateId === 'figma-6') {
    return [
      { id: 'title-1', text: title || '', x: 18, y: 45, fontSize: 38, fontWeight: 700, maxWidth: 34, zIndex: 2 },
      { id: 'body-1', text: body || '', x: 52, y: 41, fontSize: 14, fontWeight: 400, maxWidth: 34, zIndex: 1 },
    ];
  }
  // Generic fallback for other figma presets: keep values from preset only.
  return [
    { id: 'title-1', text: title || '', x: 11, y: 14, fontSize: 30, fontWeight: 700, maxWidth: 78, zIndex: 2 },
    { id: 'body-1', text: body || '', x: 11, y: 25, fontSize: 14, fontWeight: 400, maxWidth: 78, zIndex: 1 },
  ];
}

/** Strip markdown title lines for slide-rail subtitle preview */
function slideRailPreviewSubtitle(s: { content?: string; title?: string }): string {
  const lines = (s.content || '').split('\n').map((l) => l.trim()).filter(Boolean);
  const bodyLines = lines.filter((l) => !l.startsWith('#'));
  const t = bodyLines.join(' ').replace(/\s+/g, ' ').trim();
  if (t) return t.length > 72 ? `${t.slice(0, 69)}…` : t;
  return (s.title || '').slice(0, 56);
}

function normalizePresetTree(
  node: ReactNode,
  textScale: number,
  spacingScale: number,
  typography?: { fontFamily?: string; fontWeight?: 300 | 500 | 700; color?: string },
  motion?: CSSProperties,
): ReactNode {
  if (!isValidElement(node)) return node;
  const element = node as any;
  const style = (element.props?.style ?? {}) as CSSProperties;
  const nextStyle: CSSProperties = { ...style };

  const textKeys: Array<keyof CSSProperties> = ['fontSize', 'lineHeight', 'letterSpacing'];
  const spaceKeys: Array<keyof CSSProperties> = [
    'margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
    'padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
    'gap', 'columnGap', 'rowGap',
  ];

  textKeys.forEach((k) => {
    if (nextStyle[k] !== undefined) nextStyle[k] = scaleNumericStyle(nextStyle[k], textScale) as any;
  });
  if (typography?.fontFamily && (nextStyle.fontSize !== undefined || nextStyle.lineHeight !== undefined)) {
    nextStyle.fontFamily = typography.fontFamily;
  }
  if (typography?.fontWeight && (nextStyle.fontSize !== undefined || nextStyle.lineHeight !== undefined)) {
    nextStyle.fontWeight = typography.fontWeight;
  }
  if (typography?.color && nextStyle.color !== undefined) {
    nextStyle.color = typography.color;
  }
  if (motion?.animationName && (nextStyle.fontSize !== undefined || nextStyle.lineHeight !== undefined)) {
    Object.assign(nextStyle, motion);
  }
  spaceKeys.forEach((k) => {
    if (nextStyle[k] !== undefined) nextStyle[k] = scaleNumericStyle(nextStyle[k], spacingScale) as any;
  });

  const children = element.props?.children;
  const normalizedChildren = children === undefined
    ? children
    : Children.map(children, (c) => normalizePresetTree(c, textScale, spacingScale, typography, motion));

  return cloneElement(element, { style: nextStyle }, normalizedChildren);
}

function TemplatePreview({ preset }: { preset: PresetCard }) {
  const previewHostRef = useRef<HTMLDivElement>(null);
  const [previewHostSize, setPreviewHostSize] = useState({ width: 0, height: 0 });
  const previewSlide: Slide = {
    id: -1,
    templateId: preset.id,
    title: preset.title,
    content: preset.content,
    speakerNotes: preset.speakerNotes,
    visualType: preset.visualType,
    allowQA: true,
    sceneMode: 'slide',
  };
  const specialPreviewRaw = renderSpecialTemplate(previewSlide, '#111111', '#5a5a5a', 'none');
  const specialPreview = specialPreviewRaw
    ? normalizePresetTree(specialPreviewRaw, 0.78, 0.88)
    : specialPreviewRaw;

  useEffect(() => {
    if (!specialPreview) return;
    const host = previewHostRef.current;
    if (!host) return;

    const updateSize = () => {
      const rect = host.getBoundingClientRect();
      setPreviewHostSize({ width: rect.width, height: rect.height });
    };
    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(host);
    return () => observer.disconnect();
  }, [specialPreview, preset.id]);

  return (
    <div
      ref={previewHostRef}
      style={{
        border: '1px solid #d8d8d8',
        background: '#fff',
        padding: 8,
        borderRadius: 6,
        marginBottom: 8,
        aspectRatio: '16 / 9',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {specialPreview && (
        <div style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}>
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: 1280,
              height: 720,
              transform: `translate(-50%, -50%) scale(${Math.max(
                0.01,
                Math.min(
                  previewHostSize.width ? previewHostSize.width / 1280 : 1,
                  previewHostSize.height ? previewHostSize.height / 720 : 1,
                ) * 0.96 * getSpecialTemplateScale(preset.id),
              )})`,
              transformOrigin: 'center center',
            }}
          >
            {specialPreview}
          </div>
        </div>
      )}
      {!specialPreview && (
        <>
      {preset.visualType === 'title' && (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 4 }}>{preset.title}</div>
          <div style={{ fontSize: 8, color: '#666' }}>{preset.subtitle}</div>
        </div>
      )}
      {preset.visualType === 'bullets' && (
        <div style={{ height: '100%' }}>
          <div style={{ fontSize: 9, fontWeight: 700, marginBottom: 4 }}>{preset.title}</div>
          <div style={{ fontSize: 8, color: '#555', lineHeight: 1.5 }}>
            <div>- Point 1</div>
            <div>- Point 2</div>
            <div>- Point 3</div>
          </div>
        </div>
      )}
      {preset.visualType === 'table' && (
        <div style={{ height: '100%' }}>
          <div style={{ fontSize: 9, fontWeight: 700, marginBottom: 4 }}>{preset.title}</div>
          <div style={{ border: '1px solid #ddd', fontSize: 7 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid #eee' }}>
              <div style={{ padding: 2, borderRight: '1px solid #eee' }}>Left</div>
              <div style={{ padding: 2 }}>Right</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
              <div style={{ padding: 2, borderRight: '1px solid #eee' }}>A</div>
              <div style={{ padding: 2 }}>B</div>
            </div>
          </div>
        </div>
      )}
      {preset.visualType === 'quote' && (
        <div style={{ height: '100%', display: 'flex', alignItems: 'center' }}>
          <div style={{ fontSize: 8, fontStyle: 'italic', color: '#444' }}>"{preset.subtitle}"</div>
        </div>
      )}
      {preset.visualType === 'image' && (
        <div style={{ height: '100%', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 5 }}>
          <div style={{ border: '1px dashed #ccc', background: '#f7f7f7' }} />
          <div>
            <div style={{ fontSize: 8, fontWeight: 700 }}>{preset.title}</div>
            <div style={{ fontSize: 7, color: '#666', marginTop: 3 }}>Description</div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}

export function PresetPickerModal({
  onClose,
  onSelect,
}: {
  onClose: () => void;
  onSelect: (preset: PresetCard) => void;
}) {
  const recents = PRESET_CARDS.slice(0, 2);
  const basic = PRESET_CARDS.slice(2, 18);
  const advanced = PRESET_CARDS.slice(18);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(5,8,14,0.62)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(1060px, 96vw)',
          maxHeight: '90vh',
          overflow: 'auto',
          background: 'linear-gradient(140deg, rgba(255,255,255,0.12), rgba(255,255,255,0.04))',
          borderRadius: 2,
          padding: 12,
          border: '1px solid rgba(255,255,255,0.24)',
          backdropFilter: 'blur(14px)',
          boxShadow: '0 16px 36px rgba(0,0,0,0.28)',
        }}
      >
        <TemplateSection title="Recents" presets={recents} onSelect={onSelect} />
        <TemplateSection title="Basic" presets={basic} onSelect={onSelect} />
        <TemplateSection title="Vibes" presets={advanced} onSelect={onSelect} />
      </div>
    </div>
  );
}

function TemplateSection({
  title,
  presets,
  onSelect,
}: {
  title: string;
  presets: PresetCard[];
  onSelect: (preset: PresetCard) => void;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div className="gen-label" style={{ padding: '6px 2px', color: 'rgba(255,255,255,0.72)' }}>{title}</div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 10,
        }}
      >
        {presets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => onSelect(preset)}
            style={{
              minHeight: 110,
              textAlign: 'left',
              border: preset.featured ? '1px solid rgba(95,157,255,0.55)' : '1px solid rgba(255,255,255,0.2)',
              borderRadius: 2,
              background: preset.featured
                ? 'linear-gradient(140deg, rgba(95,157,255,0.2), rgba(95,157,255,0.08))'
                : 'linear-gradient(140deg, rgba(255,255,255,0.1), rgba(255,255,255,0.03))',
              color: '#ffffff',
              padding: 12,
              cursor: 'pointer',
              backdropFilter: 'blur(10px)',
            }}
          >
            <TemplatePreview preset={preset} />
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{preset.title}</div>
            <div style={{ fontSize: 10, opacity: 0.82, color: 'rgba(255,255,255,0.7)' }}>{preset.subtitle}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

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
    || backgroundKind === 'solidBlack'
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

function SlideTemplateCanvas({
  slide,
  parsed,
  mode,
  textColor,
  subTextColor,
  textShadow,
  onUpdateSlide,
  pointerThroughCanvas = false,
}: {
  slide: Slide;
  parsed: { title: string; bullets: string[]; quote: string; tableRows: string[] };
  mode: 'wireframe' | 'render';
  textColor: string;
  subTextColor: string;
  textShadow: string;
  onUpdateSlide: (patch: Partial<Slide>) => void;
  /** When true, only explicit children receive pointer events (e.g. so slide media can be clicked). */
  pointerThroughCanvas?: boolean;
}) {
  const editableTemplateId = slide.templateId?.startsWith('figma-') ? slide.templateId : null;
  const textSizeScale = slide.textStyle?.sizeScale ?? 0.76;
  const textFontFamily = slide.textStyle?.fontFamily;
  const textFontWeight = slide.textStyle?.fontWeight;
  const styledTextColor = slide.textStyle?.color ?? textColor;
  const styledSubTextColor = slide.textStyle?.color ?? subTextColor;
  const motionStyle = getMotionAnimation(
    slide.textStyle?.motionPreset,
    slide.textStyle?.motionIntensity ?? 1,
    slide.textStyle?.motionSpeed ?? 1,
  );
  const editableHostRef = useRef<HTMLDivElement>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [clipboardBlock, setClipboardBlock] = useState<TemplateTextBlock | null>(null);
  const [dragInfo, setDragInfo] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const [resizeInfo, setResizeInfo] = useState<{
    id: string;
    startClientX: number;
    startWpx: number;
    origMaxWidth: number;
    origFontSize: number;
  } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const dragInfoRef = useRef(dragInfo);
  dragInfoRef.current = dragInfo;
  const resizeInfoRef = useRef(resizeInfo);
  resizeInfoRef.current = resizeInfo;
  const slideRef = useRef(slide);
  slideRef.current = slide;

  /** Legacy welcome / title slides had no templateId → static canvas, no selection. Promote to figma-1 + blocks. */
  useEffect(() => {
    if (slide.templateId) return;
    if (slide.visualType !== 'title') return;
    if ((slide.templateTextBlocks ?? []).length > 0) return;
    const body = (slide.content || '').replace(/^#\s[^\n]+/m, '').trim();
    onUpdateSlide({
      templateId: 'figma-1',
      sceneMode: slide.sceneMode ?? 'slide',
      templateTextBlocks: createEditableTemplateBlocks('figma-1', slide.title || '', body),
    });
  }, [slide.templateId, slide.visualType, slide.templateTextBlocks, slide.title, slide.content, slide.sceneMode, onUpdateSlide]);

  useEffect(() => {
    if (!editableTemplateId) return;
    const body = slide.content.replace(/^#\s[^\n]+/, '').trim();
    const blocks = slide.templateTextBlocks ?? [];
    if (!blocks.length) {
      const seeded = createEditableTemplateBlocks(editableTemplateId, slide.title, body);
      if (!seeded.length) return;
      onUpdateSlide({ templateTextBlocks: seeded });
      return;
    }
    // Migrate old placeholder values to actual preset values.
    const migrated = blocks.map((b) => {
      if (b.id === 'title-1' && (b.text === 'Title' || b.text === 'Highlight')) return { ...b, text: slide.title || '' };
      if (b.id === 'body-1' && b.text === 'Description') return { ...b, text: body || '' };
      return b;
    });
    const changed = migrated.some((b, i) => b.text !== blocks[i]?.text);
    if (changed) onUpdateSlide({ templateTextBlocks: migrated });
  }, [editableTemplateId, slide.content, slide.templateTextBlocks, slide.title, onUpdateSlide]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!editableTemplateId) return;
      const target = e.target as HTMLElement | null;
      if (target && target.closest('[contenteditable="true"]')) return;
      const blocks = slide.templateTextBlocks ?? [];

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedBlockId) {
        e.preventDefault();
        onUpdateSlide({ templateTextBlocks: blocks.filter((b) => b.id !== selectedBlockId) });
        setSelectedBlockId(null);
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c' && selectedBlockId) {
        const found = blocks.find((b) => b.id === selectedBlockId);
        if (found) {
          e.preventDefault();
          setClipboardBlock(found);
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v' && clipboardBlock) {
        e.preventDefault();
        const next: TemplateTextBlock = {
          ...clipboardBlock,
          id: `block-${Date.now()}`,
          x: Math.min(86, clipboardBlock.x + 3),
          y: Math.min(86, clipboardBlock.y + 3),
        };
        onUpdateSlide({ templateTextBlocks: [...blocks, next] });
        setSelectedBlockId(next.id);
      }
    };

    const onWindowClick = () => setContextMenu(null);

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('click', onWindowClick);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('click', onWindowClick);
    };
  }, [clipboardBlock, editableTemplateId, onUpdateSlide, selectedBlockId, slide.templateTextBlocks]);

  const updateBlock = (id: string, patch: Partial<TemplateTextBlock>) => {
    onUpdateSlide({
      templateTextBlocks: (slide.templateTextBlocks ?? []).map((b) => (b.id === id ? { ...b, ...patch } : b)),
    });
  };

  const sendBlockToFront = (id: string) => {
    const blocks = slide.templateTextBlocks ?? [];
    const maxZ = blocks.reduce((acc, b) => Math.max(acc, b.zIndex ?? 0), 0);
    updateBlock(id, { zIndex: maxZ + 1 });
  };

  const sendBlockToBack = (id: string) => {
    const blocks = slide.templateTextBlocks ?? [];
    const minZ = blocks.reduce((acc, b) => Math.min(acc, b.zIndex ?? 0), 0);
    updateBlock(id, { zIndex: minZ - 1 });
  };

  useEffect(() => {
    if (!dragInfo && !resizeInfo) return;
    const onMove = (e: PointerEvent) => {
      const host = editableHostRef.current;
      if (!host) return;
      const rect = host.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;
      const blocks = slideRef.current.templateTextBlocks ?? [];
      const rz = resizeInfoRef.current;
      if (rz) {
        const dx = e.clientX - rz.startClientX;
        const newWpx = Math.max(40, rz.startWpx + dx);
        const newMaxWidthPct = Math.min(96, Math.max(10, (newWpx / rect.width) * 100));
        const scale = newWpx / rz.startWpx;
        const newFs = Math.max(7, Math.round(rz.origFontSize * scale * 1000) / 1000);
        onUpdateSlide({
          templateTextBlocks: blocks.map((b) => (b.id === rz.id ? { ...b, maxWidth: newMaxWidthPct, fontSize: newFs } : b)),
        });
        return;
      }
      const dg = dragInfoRef.current;
      if (!dg) return;
      const xPct = ((e.clientX - rect.left - dg.offsetX) / rect.width) * 100;
      const yPct = ((e.clientY - rect.top - dg.offsetY) / rect.height) * 100;
      onUpdateSlide({
        templateTextBlocks: blocks.map((b) => (b.id === dg.id ? { ...b, x: Math.max(0, Math.min(92, xPct)), y: Math.max(0, Math.min(92, yPct)) } : b)),
      });
    };
    const onUp = () => {
      setDragInfo(null);
      setResizeInfo(null);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [dragInfo, resizeInfo, onUpdateSlide]);

  if (editableTemplateId && (slide.templateTextBlocks ?? []).length > 0) {
    const editableSpecialRaw = renderSpecialTemplate(
      { ...slide, title: '', content: '' },
      styledTextColor,
      styledSubTextColor,
      textShadow,
    );
    const editableSpecial = editableSpecialRaw
      ? normalizePresetTree(
        editableSpecialRaw,
        0.56 * textSizeScale,
        0.84,
        { fontFamily: textFontFamily, fontWeight: textFontWeight, color: slide.textStyle?.color },
        motionStyle,
      )
      : null;
    const editableSpecialScale = getSpecialTemplateScale(slide.templateId);
    return (
      <div
        ref={editableHostRef}
        style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          height: '100%',
          pointerEvents: pointerThroughCanvas ? 'none' : 'auto',
        }}
      >
        {editableSpecial && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 1, overflow: 'hidden', pointerEvents: 'none' }}>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                transform: `scale(${editableSpecialScale})`,
                transformOrigin: 'center center',
              }}
            >
              {editableSpecial}
            </div>
          </div>
        )}
        {[...(slide.templateTextBlocks ?? [])]
          .sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0))
          .map((block) => (
          <div
            key={block.id}
            onPointerDown={(e) => {
              const target = e.target as HTMLElement;
              if (target.closest('[data-text-resize]')) return;
              if (target.closest('[contenteditable="true"]')) return;
              const host = editableHostRef.current;
              if (!host) return;
              const hostRect = host.getBoundingClientRect();
              const blockRect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
              setSelectedBlockId(block.id);
              setDragInfo({
                id: block.id,
                offsetX: e.clientX - blockRect.left,
                offsetY: e.clientY - blockRect.top,
              });
              if (hostRect.width < 1 || hostRect.height < 1) setDragInfo(null);
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              setSelectedBlockId(block.id);
              setContextMenu({ id: block.id, x: e.clientX, y: e.clientY });
            }}
            style={{
              position: 'absolute',
              left: `${block.x}%`,
              top: `${block.y}%`,
              transform: 'translate(0, 0)',
              zIndex: block.zIndex ?? 0,
              minWidth: 60,
              maxWidth: `${block.maxWidth ?? 40}%`,
              padding: '2px 4px',
              border: selectedBlockId === block.id ? '1px solid #5f9dff' : '1px dashed rgba(95,157,255,0.35)',
              borderRadius: 4,
              background: selectedBlockId === block.id ? 'rgba(14,21,36,0.08)' : 'transparent',
              cursor: 'move',
              userSelect: 'none',
              pointerEvents: 'auto',
            }}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedBlockId(block.id);
            }}
          >
            <div
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => updateBlock(block.id, { text: e.currentTarget.textContent || '' })}
              style={{
                fontSize: block.fontSize,
                fontFamily: textFontFamily ?? undefined,
                fontWeight: textFontWeight ?? block.fontWeight ?? 400,
                color: styledTextColor,
                lineHeight: 1.35,
                textShadow,
                outline: 'none',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                userSelect: 'text',
                cursor: 'text',
                transform: `scale(${textSizeScale})`,
                transformOrigin: 'left top',
                ...motionStyle,
              }}
            >
              {block.text}
            </div>
            {selectedBlockId === block.id ? (
              <div
                data-text-resize
                onPointerDown={(e) => {
                  e.stopPropagation();
                  const wrap = (e.currentTarget as HTMLElement).parentElement as HTMLDivElement | null;
                  if (!wrap) return;
                  const br = wrap.getBoundingClientRect();
                  setResizeInfo({
                    id: block.id,
                    startClientX: e.clientX,
                    startWpx: br.width,
                    origMaxWidth: block.maxWidth ?? 40,
                    origFontSize: block.fontSize,
                  });
                }}
                style={{
                  position: 'absolute',
                  right: -4,
                  bottom: -4,
                  width: 10,
                  height: 10,
                  background: '#5f9dff',
                  borderRadius: 2,
                  cursor: 'nwse-resize',
                  zIndex: 2,
                  border: '1px solid #0f1420',
                }}
              />
            ) : null}
          </div>
        ))}
        {contextMenu && (
          <div
            style={{
              position: 'fixed',
              left: contextMenu.x,
              top: contextMenu.y,
              zIndex: 99999,
              minWidth: 124,
              background: '#0f1420',
              border: '1px solid #3b4762',
              borderRadius: 6,
              boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              style={{ width: '100%', border: 'none', background: 'transparent', color: '#f5f7ff', textAlign: 'left', padding: '8px 10px', fontSize: 11, cursor: 'pointer' }}
              onClick={() => {
                sendBlockToFront(contextMenu.id);
                setContextMenu(null);
              }}
            >
              맨 앞으로
            </button>
            <button
              style={{ width: '100%', border: 'none', background: 'transparent', color: '#f5f7ff', textAlign: 'left', padding: '8px 10px', fontSize: 11, cursor: 'pointer', borderTop: '1px solid #2d374f' }}
              onClick={() => {
                sendBlockToBack(contextMenu.id);
                setContextMenu(null);
              }}
            >
              맨 뒤로
            </button>
          </div>
        )}
      </div>
    );
  }

  const specialRaw = renderSpecialTemplate(slide, styledTextColor, styledSubTextColor, textShadow);
  const special = specialRaw
    ? normalizePresetTree(
      specialRaw,
      0.68 * textSizeScale,
      0.84,
      { fontFamily: textFontFamily, fontWeight: textFontWeight, color: slide.textStyle?.color },
      motionStyle,
    )
    : specialRaw;

  if (special) {
    const specialScale = getSpecialTemplateScale(slide.templateId);
    return (
      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', overflow: 'hidden', pointerEvents: pointerThroughCanvas ? 'none' : 'auto' }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transform: `scale(${specialScale})`,
            transformOrigin: 'center center',
          }}
        >
          {special}
        </div>
      </div>
    );
  }

  const frameStyle = mode === 'wireframe'
    ? { border: '1px dashed rgba(255,255,255,0.55)', background: 'rgba(255,255,255,0.12)' }
    : { border: '1px solid rgba(255,255,255,0.35)', background: 'transparent' };

  if (slide.visualType === 'title') {
    return (
      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', pointerEvents: pointerThroughCanvas ? 'none' : 'auto', ...frameStyle, padding: 24 }}>
        <div style={{ fontSize: 30, fontWeight: 700, lineHeight: 1.15, color: textColor, textShadow, ...motionStyle }}>{slide.title || parsed.title}</div>
        <div style={{ fontSize: 14, marginTop: 8, color: subTextColor, textShadow, ...motionStyle }}>{(slide.content || '').split('\n').filter((x) => !x.startsWith('#')).join(' ').slice(0, 140)}</div>
      </div>
    );
  }

  if (slide.visualType === 'table') {
    const rows = parsed.tableRows.length ? parsed.tableRows : ['| Left | Right |', '| A | B |', '| C | D |'];
    return (
      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', pointerEvents: pointerThroughCanvas ? 'none' : 'auto', ...frameStyle, padding: 16 }}>
        <div style={{ fontSize: 19, fontWeight: 700, marginBottom: 8, ...motionStyle }}>{slide.title || parsed.title}</div>
        <div style={{ border: '1px solid rgba(255,255,255,0.45)', background: 'rgba(255,255,255,0.45)', backdropFilter: 'blur(1px)' }}>
          {rows.map((r, i) => {
            const cells = r.split('|').map((x) => x.trim()).filter(Boolean);
            return (
              <div key={`${r}-${i}`} style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(2, cells.length)}, minmax(0, 1fr))`, borderTop: i === 0 ? 'none' : '1px solid #eee' }}>
                {cells.map((c, ci) => (
                  <div key={`${c}-${ci}`} style={{ padding: '7px 9px', borderLeft: ci === 0 ? 'none' : '1px solid rgba(0,0,0,0.08)', fontSize: 12, ...motionStyle }}>
                    {c || `Cell ${ci + 1}`}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (slide.visualType === 'quote') {
    return (
      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', display: 'flex', alignItems: 'center', pointerEvents: pointerThroughCanvas ? 'none' : 'auto', ...frameStyle, padding: 24 }}>
        <div style={{ fontSize: 22, lineHeight: 1.35, fontStyle: 'italic', color: textColor, textShadow, ...motionStyle }}>
          {parsed.quote || (slide.content || '').replace(/^#+\s*/gm, '').slice(0, 180)}
        </div>
      </div>
    );
  }

  if (slide.visualType === 'image') {
    return (
      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', pointerEvents: pointerThroughCanvas ? 'none' : 'auto', ...frameStyle, padding: 14, display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: 12 }}>
        <div style={{ border: mode === 'wireframe' ? '2px dashed #c6c6c6' : '1px solid #ddd', background: '#f3f3f3' }} />
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.2, color: textColor, textShadow, ...motionStyle }}>{slide.title || parsed.title}</div>
          <div style={{ fontSize: 13, color: subTextColor, marginTop: 8, textShadow, ...motionStyle }}>
            {(slide.content || '').replace(/^#+\s*/gm, '').slice(0, 180)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', pointerEvents: pointerThroughCanvas ? 'none' : 'auto', ...frameStyle, padding: 16 }}>
      <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 10, color: textColor, textShadow, ...motionStyle }}>{slide.title || parsed.title}</div>
      <div style={{ fontSize: 13, color: subTextColor, lineHeight: 1.6, textShadow, ...motionStyle }}>
        {(parsed.bullets.length ? parsed.bullets : ['포인트 1', '포인트 2', '포인트 3']).map((b) => (
          <div key={b}>- {b}</div>
        ))}
      </div>
      {mode === 'render' && !parsed.bullets.length && (
        <div className="gen-prose" style={{ marginTop: 12, color: subTextColor, ...motionStyle }}>
          <ReactMarkdown>{slide.content || ''}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}

function renderSpecialTemplate(slide: Slide, textColor: string, subTextColor: string, textShadow: string) {
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

/* ---------------------------------------------------------------- */

export function SectionBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex-1"
      style={{
        padding: '10px',
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        background: active ? 'var(--gen-black)' : 'transparent',
        color: active ? 'var(--gen-white)' : 'var(--gen-text-sub)',
        border: 'none',
        cursor: 'pointer',
        transition: 'all var(--gen-fast)',
      }}
    >
      {label}
    </button>
  );
}

function MetaEditor({
  presentation,
  onUpdate,
}: {
  presentation: { title: string; systemPrompt: string; knowledge: string };
  onUpdate: (patch: any) => void;
}) {
  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h2 className="gen-display" style={{ fontSize: 36, marginBottom: 4 }}>Presentation Settings</h2>
        <div style={{ width: 48, height: 1, background: 'var(--gen-black)' }} />
      </div>

      <Field label="Title">
        <input
          className="gen-input"
          value={presentation.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
        />
      </Field>

      <Field label="System Prompt">
        <textarea
          className="gen-input"
          rows={5}
          value={presentation.systemPrompt}
          onChange={(e) => onUpdate({ systemPrompt: e.target.value })}
        />
      </Field>

      <Field label="Knowledge (Q&amp;A reference)">
        <textarea
          className="gen-input"
          rows={10}
          style={{ fontFamily: 'monospace' }}
          value={presentation.knowledge}
          onChange={(e) => onUpdate({ knowledge: e.target.value })}
        />
        <p style={{ fontSize: 11, color: 'var(--gen-text-mute)', marginTop: 6 }}>
          Assets from the right panel are automatically linked to context.
        </p>
      </Field>
    </div>
  );
}

/* ---------------------------------------------------------------- */

export function SlideEditor({
  slide,
  index,
  onChange,
  onDelete,
  onAddLink,
  onRemoveLink,
  onAddMedia: _onAddMedia,
  onRemoveMedia,
  onRemoveFile,
}: {
  slide: Slide;
  index: number;
  onChange: (patch: Partial<Slide>) => void;
  onDelete: () => void;
  onAddLink: (link: SlideLink) => void;
  onRemoveLink: (url: string) => void;
  onAddMedia: (m: SlideMedia) => void;
  onRemoveMedia: (url: string) => void;
  onRemoveFile: (url: string) => void;
}) {
  const isScene = slide.sceneMode === 'scene';
  const [newLink, setNewLink] = useState('');
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [labelInput, setLabelInput] = useState('');

  const addLabel = () => {
    const v = labelInput.trim();
    if (!v) return;
    const existing = slide.labels ?? [];
    if (!existing.includes(v)) onChange({ labels: [...existing, v] });
    setLabelInput('');
  };
  const removeLabel = (label: string) => {
    onChange({ labels: (slide.labels ?? []).filter((l) => l !== label) });
  };

  const submitLink = () => {
    const url = newLink.trim();
    if (!url) return;
    onAddLink({ url, label: newLinkLabel.trim() || undefined });
    setNewLink('');
    setNewLinkLabel('');
  };

  return (
    <div className="max-w-2xl space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <div className="gen-label mb-2">Slide {String(index + 1).padStart(2, '0')}</div>
          <h2 className="gen-display" style={{ fontSize: 36 }}>Edit Slide</h2>
          <div style={{ width: 48, height: 1, background: 'var(--gen-black)', marginTop: 8 }} />
        </div>
        <button
          onClick={() => { if (confirm('Delete this slide?')) onDelete(); }}
          className="gen-btn gen-btn-ghost flex items-center gap-1.5"
          style={{ fontSize: 10, color: 'var(--gen-text-sub)' }}
        >
          <IconTrash size={12} />
          Delete
        </button>
      </div>

      {/* Mode toggle */}
      <div style={{ padding: 20, background: 'rgba(250,250,250,0.7)', border: '1px solid var(--gen-border)' }}>
        <div className="gen-label mb-3">Mode</div>
        <div className="flex" style={{ border: '1px solid var(--gen-border)' }}>
          <ModeBtn active={!isScene} onClick={() => onChange({ sceneMode: 'slide' })} label="Slide Mode" subtitle="User controls progression" />
          <ModeBtn active={isScene} onClick={() => onChange({ sceneMode: 'scene' })} label="Scene Mode" subtitle="Autonomous · Interruptible" divider />
        </div>
        {isScene && (
          <div className="mt-4">
            <div className="gen-label mb-2">Auto-advance (ms · 0 = after TTS)</div>
            <input
              type="number"
              value={slide.autoAdvanceMs ?? 0}
              onChange={(e) => onChange({ autoAdvanceMs: Number(e.target.value) || 0 })}
              className="gen-input"
            />
          </div>
        )}
      </div>

      <Field label="Title">
        <input className="gen-input" value={slide.title} onChange={(e) => onChange({ title: e.target.value })} />
      </Field>

      {/* Labels — for agent navigation */}
      <Field label="Topic Labels · agent navigation cues">
        <div className="flex flex-wrap gap-1.5 mb-2">
          {(slide.labels ?? []).map((l) => (
            <span
              key={l}
              style={{
                fontSize: 10,
                letterSpacing: '0.08em',
                padding: '4px 10px 4px 12px',
                border: '1px solid var(--gen-black)',
                color: 'var(--gen-text)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {l}
              <button
                onClick={() => removeLabel(l)}
                style={{ background: 'none', border: 'none', color: 'var(--gen-text-sub)', cursor: 'pointer', padding: 0, display: 'flex' }}
              >
                <IconClose size={10} />
              </button>
            </span>
          ))}
        </div>
        <div className="flex" style={{ border: '1px solid var(--gen-border)' }}>
          <input
            className="gen-input"
            style={{ border: 'none' }}
            value={labelInput}
            onChange={(e) => setLabelInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addLabel(); } }}
            placeholder="Add topic keyword, press Enter…"
          />
          <button type="button" onClick={addLabel} className="gen-btn gen-btn-primary" style={{ padding: '0 18px', fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            GO
          </button>
        </div>
        <p style={{ fontSize: 11, color: 'var(--gen-text-mute)', marginTop: 6 }}>
          Short keywords help the agent decide when to navigate here during Q&amp;A.
        </p>
      </Field>

      <Field label="Screen Content · Markdown · visible to audience">
        <textarea
          className="gen-input"
          rows={10}
          style={{ fontFamily: 'monospace' }}
          value={slide.content}
          onChange={(e) => onChange({ content: e.target.value })}
          placeholder="Rich text the audience can read. Markdown: ## headings, - bullets, **bold**…"
        />
        <p style={{ fontSize: 11, color: 'var(--gen-text-mute)', marginTop: 6, lineHeight: 1.5 }}>
          This shows on screen. Keep it as dense as needed — audience reads it themselves.
        </p>
      </Field>

      <Field label="Voice Script · what the agent says aloud">
        <textarea
          className="gen-input"
          rows={6}
          value={slide.speakerNotes}
          onChange={(e) => onChange({ speakerNotes: e.target.value })}
          placeholder="The essence of this slide, in 2–4 sentences. ~15 seconds spoken."
        />
        <p style={{ fontSize: 11, color: 'var(--gen-text-mute)', marginTop: 6, lineHeight: 1.5 }}>
          Agent narrates meaning, not the screen text. Brief &amp; conversational.<br />
          Target: <strong style={{ color: 'var(--gen-text-sub)' }}>60–120 Korean chars</strong> · <strong style={{ color: 'var(--gen-text-sub)' }}>≤15 s</strong>.
        </p>
      </Field>

      {/* Comment — author-only */}
      <Field label="Comment · private · author only">
        <textarea
          className="gen-input"
          rows={3}
          value={slide.comment ?? ''}
          onChange={(e) => onChange({ comment: e.target.value })}
          placeholder="Internal notes about this slide — not shown to audience or agent."
        />
      </Field>

      {/* Links */}
      <Field label="Links">
        <div className="space-y-2 mb-2">
          {(slide.links ?? []).map((l) => (
            <div
              key={l.url}
              className="flex items-center justify-between gap-2 px-3 py-2"
              style={{ border: '1px solid var(--gen-border)', background: 'var(--gen-white)' }}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <IconLink size={12} />
                <div className="min-w-0 flex-1">
                  {l.label && <div style={{ fontSize: 11, fontWeight: 400 }}>{l.label}</div>}
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noopener"
                    className="truncate block"
                    style={{ fontSize: 10, color: 'var(--gen-text-sub)', letterSpacing: '0.04em' }}
                  >
                    {l.url}
                  </a>
                </div>
              </div>
              <button
                onClick={() => onRemoveLink(l.url)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gen-text-sub)', display: 'flex' }}
              >
                <IconClose size={12} />
              </button>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <div className="flex" style={{ border: '1px solid var(--gen-border)' }}>
            <input
              className="gen-input"
              style={{ border: 'none', flex: 2 }}
              value={newLink}
              onChange={(e) => setNewLink(e.target.value)}
              placeholder="https://..."
            />
            <input
              className="gen-input"
              style={{ border: 'none', borderLeft: '1px solid var(--gen-border)', flex: 1 }}
              value={newLinkLabel}
              onChange={(e) => setNewLinkLabel(e.target.value)}
              placeholder="Label (optional)"
            />
            <button type="button" onClick={submitLink} className="gen-btn gen-btn-primary" style={{ padding: '0 18px', fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              GO
            </button>
          </div>
        </div>
      </Field>

      {/* Media attachments */}
      <Field label="Media · image / video">
        {(slide.media ?? []).length === 0 ? (
          <p style={{ fontSize: 11, color: 'var(--gen-text-mute)' }}>
            Upload an image or video in the right panel, then press <IconPlus size={10} className="inline align-middle" /> to attach.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2 mb-2">
            {(slide.media ?? []).map((m) => (
              <div
                key={m.url}
                className="relative group"
                style={{ border: '1px solid var(--gen-border)', background: 'var(--gen-white)', aspectRatio: '16 / 10', overflow: 'hidden' }}
              >
                {m.kind === 'image' ? (
                  <img src={m.url} alt={m.name || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000' }}>
                    <video src={m.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                    <div style={{ position: 'absolute', bottom: 6, left: 6, fontSize: 9, letterSpacing: '0.14em', color: '#fff', background: 'rgba(0,0,0,0.5)', padding: '2px 6px' }}>
                      VIDEO
                    </div>
                  </div>
                )}
                <button
                  onClick={() => onRemoveMedia(m.url)}
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    width: 22,
                    height: 22,
                    background: 'rgba(255,255,255,0.9)',
                    border: '1px solid var(--gen-border)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--gen-text)',
                    opacity: 0,
                    transition: 'opacity var(--gen-fast)',
                  }}
                  className="group-hover:opacity-100"
                  title="Remove"
                >
                  <IconClose size={11} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Field>

      {/* Files */}
      <Field label="Files · PDF / documents">
        {(slide.files ?? []).length === 0 ? (
          <p style={{ fontSize: 11, color: 'var(--gen-text-mute)' }}>
            Upload a PDF in the right panel, then press <IconPlus size={10} className="inline align-middle" /> on the asset card to attach.
          </p>
        ) : (
          <div className="space-y-2">
            {(slide.files ?? []).map((f) => (
              <div
                key={f.url}
                className="flex items-center justify-between gap-3 px-3 py-2"
                style={{ border: '1px solid var(--gen-border)', background: 'var(--gen-white)' }}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <IconPdf size={14} />
                  <div className="min-w-0 flex-1">
                    <div style={{ fontSize: 12, fontWeight: 400 }} className="truncate">{f.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--gen-text-mute)', letterSpacing: '0.08em' }}>
                      {f.kind.toUpperCase()}{f.size ? ` · ${(f.size / 1024).toFixed(0)} KB` : ''}
                    </div>
                  </div>
                </div>
                <a
                  href={f.url}
                  target="_blank"
                  rel="noopener"
                  style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gen-text-sub)', textDecoration: 'none' }}
                >
                  Open
                </a>
                <button
                  onClick={() => onRemoveFile(f.url)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gen-text-sub)', display: 'flex' }}
                >
                  <IconClose size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Field>

      <div className="flex gap-8 items-end">
        <Field label="Visual Type">
          <select
            className="gen-input"
            style={{ width: 200 }}
            value={slide.visualType}
            onChange={(e) => onChange({ visualType: e.target.value as Slide['visualType'] })}
          >
            <option value="title">Title</option>
            <option value="bullets">Bullets</option>
            <option value="table">Table</option>
            <option value="quote">Quote</option>
            <option value="image">Image</option>
          </select>
        </Field>
        <label className="flex items-center gap-2 cursor-pointer pb-3">
          <input
            type="checkbox"
            checked={slide.allowQA}
            onChange={(e) => onChange({ allowQA: e.target.checked })}
            style={{ width: 16, height: 16, accentColor: 'var(--gen-black)' }}
          />
          <span className="gen-label">Allow Q&amp;A</span>
        </label>
      </div>
    </div>
  );
}

function ModeBtn({
  active, onClick, label, subtitle, divider,
}: { active: boolean; onClick: () => void; label: string; subtitle: string; divider?: boolean }) {
  return (
    <button
      onClick={onClick}
      className="flex-1"
      style={{
        padding: '14px',
        background: active ? 'var(--gen-black)' : 'var(--gen-white)',
        color: active ? 'var(--gen-white)' : 'var(--gen-text)',
        border: 'none',
        borderLeft: divider ? '1px solid var(--gen-border)' : 'none',
        cursor: 'pointer',
        transition: 'all var(--gen-fast)',
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{ fontSize: 10, marginTop: 4, opacity: 0.7 }}>{subtitle}</div>
    </button>
  );
}

function Field({ label, children }: { label: string | React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="gen-label mb-2">{label}</div>
      {children}
    </div>
  );
}
