import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { usePresentationStore } from './stores/presentationStore';
import { useProjectsStore } from './stores/projectsStore';
import { usePlayback } from './hooks/usePlayback';
import { useVoice } from './hooks/useVoice';
import { SlideView } from './components/SlideView';
import { TranscriptPanel } from './components/TranscriptPanel';
import { VoiceControl } from './components/VoiceControl';
import { ControlBar } from './components/ControlBar';
import { DesignView } from './components/DesignView';
import { ProjectPicker } from './components/ProjectPicker';
import { RaiseHandFab } from './components/RaiseHandFab';
import { AmbientGradient } from './components/ambient/AmbientGradient';
import { IconClose } from './components/icons';
import { mapAgentMode } from './components/ambient/states';
import { useAutoSave } from './hooks/useAutoSave';
import { projectApi } from './api';
import type { AppMode } from './stores/presentationStore';

export default function App() {
  const { currentProjectId, init, leave } = useProjectsStore();

  useEffect(() => { init(); }, [init]);

  if (!currentProjectId) return <ProjectPicker />;

  return <ProjectApp onLeave={leave} />;
}

/** The actual presentation app — mounted only when a project is selected. */
function shellThemeStyle(uiThemeMode: 'morning' | 'night'): CSSProperties {
  if (uiThemeMode === 'morning') {
    return {
      background: '#ffffff',
      color: '#111111',
      ['--gen-bg' as string]: '#ffffff',
      ['--gen-bg-soft' as string]: '#fafafa',
      ['--gen-white' as string]: '#ffffff',
      ['--gen-text' as string]: '#111111',
      ['--gen-text-sub' as string]: '#666666',
      ['--gen-text-mute' as string]: '#999999',
      ['--gen-border' as string]: '#e5e5e5',
      ['--gen-black' as string]: '#0a0a0a',
      ['--gen-bg-gray' as string]: '#f5f5f5',
      ['--gen-charcoal' as string]: '#1a1a1a',
      ['--gen-border-strong' as string]: '#111111',
      ['--gen-accent' as string]: '#111111',
      ['--gen-chip-hover-bg' as string]: '#0a0a0a',
      ['--gen-chip-hover-fg' as string]: '#ffffff',
    };
  }
  return {
    background: 'linear-gradient(180deg, #07080b 0%, #090a0d 100%)',
    color: '#f5f7ff',
    ['--gen-bg' as string]: '#07080b',
    ['--gen-bg-soft' as string]: 'rgba(16,17,20,0.82)',
    ['--gen-white' as string]: 'rgba(22,24,30,0.94)',
    ['--gen-text' as string]: '#f5f7ff',
    ['--gen-text-sub' as string]: '#c1c3c9',
    ['--gen-text-mute' as string]: '#8a8d95',
    ['--gen-border' as string]: 'rgba(255,255,255,0.14)',
    ['--gen-black' as string]: '#0d111a',
    ['--gen-bg-gray' as string]: 'rgba(35,36,42,0.58)',
    ['--gen-charcoal' as string]: '#1a1f2a',
    ['--gen-border-strong' as string]: 'rgba(255,255,255,0.22)',
    ['--gen-accent' as string]: '#7db4ff',
    ['--gen-chip-hover-bg' as string]: '#e8ecf8',
    ['--gen-chip-hover-fg' as string]: '#0b0e14',
  };
}

function ProjectApp({ onLeave }: { onLeave: () => void }) {
  const { setPresentation, appMode, dialogueOpen, isPlaying, uiThemeMode, presentation, currentSlideIndex } = usePresentationStore();
  const introAmbienceCtxRef = useRef<AudioContext | null>(null);
  const introAmbienceNodesRef = useRef<{ gains: GainNode[]; oscillators: OscillatorNode[] } | null>(null);
  const { speak, stopSpeaking, isPlaying: isVoicePlaying } = useVoice();

  useAutoSave();

  const activeState = useMemo(() => mapAgentMode(usePresentationStore.getState().agentMode), [usePresentationStore.getState().agentMode]);
  const modulation = useMemo(() => {
    if (appMode !== 'present') return 0.18;
    if (usePresentationStore.getState().agentMode === 'idle') return 0.38;
    return 0.65;
  }, [appMode, usePresentationStore.getState().agentMode]);

  // Load the current project's presentation when we enter
  useEffect(() => {
    fetch(`${projectApi()}/presentation`)
      .then((res) => res.json())
      .then((data) => setPresentation(data))
      .catch((err) => console.error('Failed to load presentation:', err));
  }, [setPresentation]);

  // Intro ambience: soft pad while in present mode before playback starts.
  useEffect(() => {
    const shouldPlayIntroAmbience = appMode === 'present' && !isPlaying;

    const stopAmbience = () => {
      const ctx = introAmbienceCtxRef.current;
      const nodes = introAmbienceNodesRef.current;
      if (!ctx || !nodes) return;
      const now = ctx.currentTime;
      nodes.gains.forEach((g) => {
        g.gain.cancelScheduledValues(now);
        g.gain.setTargetAtTime(0.0001, now, 0.18);
      });
      window.setTimeout(() => {
        nodes.oscillators.forEach((o) => {
          try { o.stop(); } catch {}
          try { o.disconnect(); } catch {}
        });
        nodes.gains.forEach((g) => {
          try { g.disconnect(); } catch {}
        });
        introAmbienceNodesRef.current = null;
      }, 420);
    };

    const startAmbience = async () => {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx || introAmbienceNodesRef.current) return;

      if (!introAmbienceCtxRef.current) {
        introAmbienceCtxRef.current = new AudioCtx();
      }
      const ctx = introAmbienceCtxRef.current;
      if (ctx.state === 'suspended') {
        try { await ctx.resume(); } catch { return; }
      }

      const master = ctx.createGain();
      master.gain.value = 0.0001;
      master.connect(ctx.destination);

      const freqs = [146.83, 220.0, 293.66]; // D3/A3/D4
      const oscillators: OscillatorNode[] = [];
      const gains: GainNode[] = [master];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        osc.type = idx === 0 ? 'sine' : 'triangle';
        osc.frequency.value = freq;

        const g = ctx.createGain();
        g.gain.value = idx === 0 ? 0.12 : 0.08;
        osc.connect(g);
        g.connect(master);
        oscillators.push(osc);
        gains.push(g);
      });

      oscillators.forEach((o) => o.start());
      introAmbienceNodesRef.current = { gains, oscillators };

      const now = ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setTargetAtTime(0.035, now, 0.35);
    };

    if (shouldPlayIntroAmbience) startAmbience();
    else stopAmbience();

    return () => {
      if (!shouldPlayIntroAmbience) return;
      stopAmbience();
    };
  }, [appMode, isPlaying]);

  useEffect(() => () => {
    const ctx = introAmbienceCtxRef.current;
    if (!ctx) return;
    try { ctx.close(); } catch {}
    introAmbienceCtxRef.current = null;
    introAmbienceNodesRef.current = null;
  }, []);

  // Presentation chrome is controlled directly by the hamburger toggle.
  const { visible: chromeVisible } = usePresentationChromeVisibility(appMode);
  usePresentationNavigationControls(appMode, stopSpeaking);

  const currentSlide = presentation?.slides[currentSlideIndex];
  const currentSlideVoiceText = getSlideVoiceText(currentSlide?.speakerNotes);

  const replaySlideVoice = async () => {
    if (!currentSlideVoiceText) return;
    const store = usePresentationStore.getState();
    if (store.isPlaying) {
      store.cancelPlayback();
      store.setAgentMode('idle');
    }
    stopSpeaking();
    await speak(currentSlideVoiceText);
  };

  useEffect(() => {
    if (appMode !== 'present' || isPlaying || !currentSlideVoiceText) return;
    stopSpeaking();
    void speak(currentSlideVoiceText);
    return () => {
      stopSpeaking();
    };
  }, [appMode, currentSlideIndex, isPlaying, currentSlideVoiceText, speak, stopSpeaking]);

  const rootChromeStyle = useMemo(() => shellThemeStyle(uiThemeMode), [uiThemeMode]);

  return (
    <div
      className="h-screen w-screen flex flex-col overflow-hidden relative"
      style={rootChromeStyle}
    >
      <AmbientGradient state={activeState} modulation={modulation} />

      <div className="flex flex-col flex-1 relative" style={{ zIndex: 1 }}>
        <div
          style={{
            height: appMode === 'present' ? (chromeVisible ? 58 : 0) : 58,
            overflow: 'hidden',
            flexShrink: 0,
            transition: 'height 400ms var(--gen-ease), opacity 400ms var(--gen-ease)',
          }}
        >
          <TopBar
            visible={appMode === 'present' ? chromeVisible : true}
            projectName={presentation?.title}
            appMode={appMode}
            onLeave={onLeave}
          />
        </div>

        {appMode === 'present' ? (
          <>
            <div className="flex-1 relative min-h-0">
              <SlideView
                onReplayVoice={replaySlideVoice}
                hasReplayVoice={Boolean(currentSlideVoiceText)}
                isReplayVoicePlaying={isVoicePlaying}
              />
            </div>
            <div
              style={{
                height: chromeVisible ? 64 : 0,
                overflow: 'hidden',
                flexShrink: 0,
                transition: 'height 400ms var(--gen-ease), opacity 400ms var(--gen-ease)',
              }}
            >
              <ControlBar />
            </div>
          </>
        ) : (
          <div className="flex-1 min-h-0">
            <DesignView />
          </div>
        )}

      </div>

      {appMode === 'present' && <DialogueDrawer open={dialogueOpen} />}
      <RaiseHandFab bottomOffset={appMode === 'present' && chromeVisible ? 84 : 24} />
    </div>
  );
}

/* ─────────────────────────────────────────────── */

function usePresentationChromeVisibility(appMode: AppMode) {
  const [visible, setVisible] = useState(true);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (appMode !== 'present') {
      setVisible(true);
      return;
    }

    const resetTimer = () => {
      setVisible(true);
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
      timerRef.current = window.setTimeout(() => {
        setVisible(false);
      }, 5000);
    };

    window.addEventListener('mousemove', resetTimer);
    resetTimer();

    return () => {
      window.removeEventListener('mousemove', resetTimer);
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [appMode]);

  return { visible };
}

function usePresentationNavigationControls(appMode: AppMode, stopSpeaking: () => void) {
  const wheelLockRef = useRef(false);

  useEffect(() => {
    if (appMode !== 'present') return;

    const shouldIgnoreTarget = (eventTarget: EventTarget | null) => {
      if (!(eventTarget instanceof HTMLElement)) return false;
      const tag = eventTarget.tagName;
      return tag === 'INPUT'
        || tag === 'TEXTAREA'
        || tag === 'SELECT'
        || eventTarget.isContentEditable;
    };

    const navigate = (direction: 'next' | 'prev') => {
      const store = usePresentationStore.getState();
      if (store.isPlaying) {
        store.cancelPlayback();
        store.setAgentMode('idle');
      }
      stopSpeaking();
      if (direction === 'next') store.nextSlide();
      else store.prevSlide();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (shouldIgnoreTarget(event.target)) return;
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        navigate('next');
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        navigate('prev');
      }
    };

    const onWheel = (event: WheelEvent) => {
      if (shouldIgnoreTarget(event.target)) return;
      if (Math.abs(event.deltaY) < 24) return;
      if (wheelLockRef.current) {
        event.preventDefault();
        return;
      }

      wheelLockRef.current = true;
      window.setTimeout(() => {
        wheelLockRef.current = false;
      }, 420);

      event.preventDefault();
      navigate(event.deltaY > 0 ? 'next' : 'prev');
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('wheel', onWheel);
    };
  }, [appMode, stopSpeaking]);
}

function getSlideVoiceText(speakerNotes?: string) {
  const text = (speakerNotes || '').trim();
  if (!text) return '';
  if (text === '이 슬라이드에서 발표자가 말할 내용을 입력하세요.') return '';
  return text;
}

function TopBar({
  visible, projectName, appMode, onLeave,
}: {
  visible: boolean;
  projectName?: string;
  appMode: AppMode;
  onLeave: () => void;
}) {
  const { play, pause } = usePlayback();
  const { setAppMode } = usePresentationStore();
  const [shareOpen, setShareOpen] = useState(false);

  const handleViewClick = () => {
    if (appMode === 'design') {
      void play();
    } else {
      setAppMode('design');
      pause();
    }
  };

  return (
    <>
      <div
        className="flex items-center justify-between px-6 py-3"
        style={{
          borderBottom: 'none',
          background: 'rgba(6, 8, 12, 0.98)',
          backdropFilter: 'blur(4px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
          transform: visible ? 'translateY(0)' : 'translateY(-110%)',
          opacity: visible ? 1 : 0,
          transition: 'transform 400ms var(--gen-ease), opacity 400ms var(--gen-ease)',
          pointerEvents: visible ? 'auto' : 'none',
        }}
      >
        <div className="flex items-center gap-6">
          <span
            style={{
              fontSize: 20,
              fontWeight: 200,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: '#f5f7ff',
              cursor: 'pointer',
            }}
            onClick={onLeave}
          >
            VOIX
          </span>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 0,
              color: 'rgba(255,255,255,0.4)',
              fontSize: 11,
              fontWeight: 400,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{projectName || 'MY FIRST PROJECT'}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleViewClick}
            style={{
              padding: '8px 24px',
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              background: appMode === 'present' ? '#ffffff' : 'transparent',
              color: appMode === 'present' ? '#000000' : '#ffffff',
              border: '1px solid rgba(255,255,255,0.3)',
              cursor: 'pointer',
            }}
          >
            {appMode === 'present' ? 'Design' : 'View'}
          </button>
          <button
            onClick={() => setShareOpen(true)}
            style={{
              padding: '8px 24px',
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              background: 'transparent',
              color: '#ffffff',
              border: '1px solid rgba(255,255,255,0.3)',
              cursor: 'pointer',
            }}
          >
            Share
          </button>
          <button
            onClick={onLeave}
            style={{
              padding: '8px 24px',
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              background: 'transparent',
              color: '#ffffff',
              border: '1px solid rgba(255,255,255,0.3)',
              cursor: 'pointer',
            }}
          >
            And
          </button>
        </div>
      </div>

      {shareOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setShareOpen(false)}
        >
          <div
            style={{
              background: 'var(--gen-white)',
              color: 'var(--gen-text)',
              width: 400,
              padding: '24px',
              borderRadius: '8px',
              boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 style={{ fontSize: 16, fontWeight: 500, letterSpacing: '0.04em' }}>Share Presentation</h2>
              <button
                onClick={() => setShareOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--gen-text-mute)' }}
              >
                <IconClose size={20} />
              </button>
            </div>
            
            <div className="mb-4">
              <label style={{ display: 'block', fontSize: 11, marginBottom: 8, color: 'var(--gen-text-sub)' }}>
                Invite by Email
              </label>
              <div className="flex gap-2">
                <input 
                  type="email" 
                  placeholder="name@example.com" 
                  className="gen-input flex-1"
                  style={{
                    padding: '8px 12px',
                    border: '1px solid var(--gen-border)',
                    borderRadius: 4,
                    background: 'transparent',
                    color: 'var(--gen-text)',
                  }}
                />
                <button
                  style={{
                    padding: '0 16px',
                    background: 'var(--gen-black)',
                    color: 'var(--gen-white)',
                    border: 'none',
                    borderRadius: 4,
                    fontSize: 11,
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                  onClick={() => {
                    alert('Invitation sent (Mock)');
                    setShareOpen(false);
                  }}
                >
                  Send
                </button>
              </div>
            </div>

            <div style={{ margin: '24px 0', height: 1, background: 'var(--gen-border)' }} />

            <div>
              <label style={{ display: 'block', fontSize: 11, marginBottom: 8, color: 'var(--gen-text-sub)' }}>
                Anyone with the link
              </label>
              <div className="flex gap-2 items-center">
                <input 
                  type="text" 
                  readOnly 
                  value="https://voix.hyundai.com/p/mock-link-123" 
                  className="flex-1"
                  style={{
                    padding: '8px 12px',
                    border: '1px solid var(--gen-border)',
                    borderRadius: 4,
                    background: 'var(--gen-bg-gray)',
                    color: 'var(--gen-text)',
                    fontSize: 12,
                  }}
                />
                <button
                  style={{
                    padding: '8px 16px',
                    background: 'transparent',
                    color: 'var(--gen-text)',
                    border: '1px solid var(--gen-border)',
                    borderRadius: 4,
                    fontSize: 11,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                  onClick={() => {
                    alert('Link copied to clipboard (Mock)');
                  }}
                >
                  Copy Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function DialogueDrawer({ open }: { open: boolean }) {
  const uiThemeMode = usePresentationStore((s) => s.uiThemeMode);
  const isNight = uiThemeMode === 'night';
  return (
    <div
      aria-hidden={!open}
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: 384,
        display: 'flex',
        flexDirection: 'column',
        background: isNight ? 'rgba(12,14,20,0.96)' : 'rgba(250,250,250,0.92)',
        backdropFilter: 'blur(10px)',
        borderLeft: '1px solid var(--gen-border)',
        color: 'var(--gen-text)',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 500ms cubic-bezier(0.16, 1, 0.3, 1)',
        zIndex: 30,
        boxShadow: open ? (isNight ? '0 0 60px rgba(0,0,0,0.5)' : '0 0 60px rgba(0,0,0,0.08)') : 'none',
      }}
    >
      <TranscriptPanel />
      <div style={{ borderTop: '1px solid var(--gen-border)' }}>
        <VoiceControl />
      </div>
    </div>
  );
}
