import { useEffect, useRef, useState } from 'react';
import { usePresentationStore } from '../stores/presentationStore';
import type { Slide } from '@shared/types';
import { ContextPanel } from './ContextPanel';
import { InsightsPanel } from './InsightsPanel';
import { API_ROOT } from '../api';
import { MetaEditor } from './design/DesignEditors';
import { SlideRail } from './design/SlideRail';
import { MainCanvas } from './design/MainCanvas';

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
    const slide = presentation?.slides[currentSlideIndex];
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
      <SlideRail
        presentation={presentation}
        currentSlideIndex={currentSlideIndex}
        isNight={isNight}
        uiSurface={uiSurface}
        uiBorder={uiBorder}
        uiSurfaceStrong={uiSurfaceStrong}
        uiPanelShadow={uiPanelShadow}
        handleReorder={handleReorder}
        goToSlide={goToSlide}
        deleteSlide={deleteSlide}
        addSlide={addSlide}
        themeMode={themeMode}
        setThemeMode={setThemeMode}
      />

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
                <MainCanvas
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
                    value={slide.speakerNotes || ''}
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
