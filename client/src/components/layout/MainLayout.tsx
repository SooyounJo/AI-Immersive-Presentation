import { useEffect, useMemo, useRef, type CSSProperties } from 'react';
import { usePresentationStore } from '../../stores/presentationStore';
import { useVoice } from '../../hooks/useVoice';
import { SlideView } from '../SlideView';
import { ControlBar } from '../ControlBar';
import { DesignView } from '../DesignView';
import { RaiseHandFab } from '../RaiseHandFab';
import { AmbientGradient } from '../ambient/AmbientGradient';
import { mapAgentMode } from '../ambient/states';
import { useAutoSave } from '../../hooks/useAutoSave';
import { projectApi } from '../../api';

import { usePresentationChromeVisibility } from '../../hooks/usePresentationChromeVisibility';
import { usePresentationNavigationControls } from '../../hooks/usePresentationNavigationControls';
import { getSlideVoiceText } from '../../utils/voiceHelpers';
import { TopBar } from './TopBar';
import { DialogueDrawer } from './DialogueDrawer';

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

export function MainLayout({ onLeave }: { onLeave: () => void }) {
  const { setPresentation, appMode, dialogueOpen, isPlaying, uiThemeMode, presentation, currentSlideIndex } = usePresentationStore();
  const introAmbienceCtxRef = useRef<AudioContext | null>(null);
  const introAmbienceNodesRef = useRef<{ gains: GainNode[]; oscillators: OscillatorNode[] } | null>(null);
  const { speak, stopSpeaking, isPlaying: isVoicePlaying } = useVoice();

  useAutoSave();

  const agentMode = usePresentationStore((state) => state.agentMode);
  const activeState = useMemo(() => mapAgentMode(agentMode), [agentMode]);
  const modulation = useMemo(() => {
    if (appMode !== 'present') return 0.18;
    if (agentMode === 'idle') return 0.38;
    return 0.65;
  }, [appMode, agentMode]);

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
          try { o.stop(); } catch { /* ignore */ }
          try { o.disconnect(); } catch { /* ignore */ }
        });
        nodes.gains.forEach((g) => {
          try { g.disconnect(); } catch { /* ignore */ }
        });
        introAmbienceNodesRef.current = null;
      }, 420);
    };

    const startAmbience = async () => {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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
    try { ctx.close(); } catch { /* ignore */ }
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
