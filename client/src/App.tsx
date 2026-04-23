import { useEffect, useMemo, useRef, useState } from 'react';
import { usePresentationStore } from './stores/presentationStore';
import { useProjectsStore } from './stores/projectsStore';
import { SlideView } from './components/SlideView';
import { TranscriptPanel } from './components/TranscriptPanel';
import { VoiceControl } from './components/VoiceControl';
import { ControlBar } from './components/ControlBar';
import { DesignView } from './components/DesignView';
import { RaiseHandFab } from './components/RaiseHandFab';
import { TopPlayButton } from './components/TopPlayButton';
import { TopToggles } from './components/TopToggles';
import { ProjectPicker } from './components/ProjectPicker';
import { AmbientGradient } from './components/ambient/AmbientGradient';
import { mapAgentMode } from './components/ambient/states';
import { useAutoSave } from './hooks/useAutoSave';
import { projectApi } from './api';

export default function App() {
  const { currentProjectId, init, leave, projects } = useProjectsStore();

  useEffect(() => { init(); }, [init]);

  if (!currentProjectId) return <ProjectPicker />;

  const currentProject = projects.find((p) => p.id === currentProjectId);
  return <ProjectApp projectName={currentProject?.name} onLeave={leave} />;
}

/** The actual presentation app — mounted only when a project is selected. */
function ProjectApp({ projectName, onLeave }: { projectName?: string; onLeave: () => void }) {
  const { setPresentation, appMode, agentMode, dialogueOpen, isPlaying } = usePresentationStore();
  const introAmbienceCtxRef = useRef<AudioContext | null>(null);
  const introAmbienceNodesRef = useRef<{ gains: GainNode[]; oscillators: OscillatorNode[] } | null>(null);

  useAutoSave();

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

  // Auto-hide top nav during playback — show on mouse movement
  const topVisible = useTopNavVisibility(isPlaying);

  return (
    <div
      className="h-screen w-screen flex flex-col overflow-hidden relative"
      style={{ background: 'var(--gen-bg)', color: 'var(--gen-text)' }}
    >
      <AmbientGradient state={activeState} modulation={modulation} />

      <div className="flex flex-col flex-1 relative" style={{ zIndex: 1 }}>
        {/* Top bar — auto-hides during playback */}
        <TopBar
          visible={topVisible}
          projectName={projectName}
          showToggles={appMode === 'present'}
          onLeave={onLeave}
        />

        {appMode === 'present' ? (
          <>
            <div className="flex-1 relative min-h-0">
              <SlideView />
            </div>
            <ControlBar />
          </>
        ) : (
          <div className="flex-1 min-h-0">
            <DesignView />
          </div>
        )}

      </div>

      {appMode === 'present' && <DialogueDrawer open={dialogueOpen} />}
      <RaiseHandFab />
    </div>
  );
}

/* ─────────────────────────────────────────────── */

/**
 * Controls the visibility of the top bar.
 * Rules:
 *   - Always visible when not playing
 *   - When playing: hidden after 2s of mouse inactivity
 *   - Mouse movement near top (or anywhere) reveals it for another 2s
 */
function useTopNavVisibility(isPlaying: boolean) {
  const [visible, setVisible] = useState(true);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isPlaying) {
      setVisible(true);
      if (timerRef.current) window.clearTimeout(timerRef.current);
      return;
    }

    const HIDE_DELAY = 2400;
    const scheduleHide = () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setVisible(false), HIDE_DELAY);
    };

    const onMove = (e: MouseEvent) => {
      // Reveal immediately on motion
      setVisible(true);
      // Keep visible a bit longer if cursor is near the top edge (<120px)
      if (e.clientY < 120) {
        if (timerRef.current) window.clearTimeout(timerRef.current);
      } else {
        scheduleHide();
      }
    };

    scheduleHide();
    window.addEventListener('mousemove', onMove);
    return () => {
      window.removeEventListener('mousemove', onMove);
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [isPlaying]);

  return visible;
}

function TopBar({
  visible, projectName, showToggles, onLeave,
}: {
  visible: boolean;
  projectName?: string;
  showToggles: boolean;
  onLeave: () => void;
}) {
  const projectTitleOffset = showToggles ? 14 : 132;
  return (
    <div
      className="flex items-center justify-between px-6 py-2"
      style={{
        borderBottom: 'none',
        background: 'rgba(6, 8, 12, 0.98)',
        backdropFilter: 'blur(4px)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.45), inset 0 -1px 0 rgba(108,126,166,0.26)',
        transform: visible ? 'translateY(0)' : 'translateY(-110%)',
        opacity: visible ? 1 : 0,
        transition: 'transform 400ms var(--gen-ease), opacity 400ms var(--gen-ease)',
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      {/* VOIX brand — also doubles as "back to projects" */}
      <button
        onClick={onLeave}
        title="Back to projects"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          color: 'var(--gen-text)',
        }}
      >
        <span
          style={{
            fontSize: 11,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            border: '1px solid var(--gen-border)',
            padding: '4px 8px',
            color: '#d6ddf0',
            background: '#0d111a',
          }}
        >
          Home
        </span>
        <span
          style={{
            fontSize: 20,
            fontWeight: 200,
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color: '#f5f7ff',
          }}
        >
          VOIX
        </span>
        <span
          className="truncate"
          style={{
            maxWidth: 300,
            marginLeft: projectTitleOffset,
            fontSize: 13,
            color: '#d6ddf0',
            fontWeight: 400,
            textAlign: 'left',
          }}
        >
          {projectName || 'Untitled'}
        </span>
      </button>

      <div className="flex items-center gap-3">
        {showToggles && <TopToggles />}
        <button
          title="Export presentation"
          style={{
            padding: '9px 16px',
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            background: '#1c2433',
            color: '#f5f7ff',
            border: '1px solid #38445d',
            cursor: 'pointer',
            transition: 'all var(--gen-fast)',
          }}
        >
          Export
        </button>
        <TopPlayButton />
      </div>
    </div>
  );
}

function DialogueDrawer({ open }: { open: boolean }) {
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
        background: 'rgba(250,250,250,0.92)',
        backdropFilter: 'blur(10px)',
        borderLeft: '1px solid var(--gen-border)',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 500ms cubic-bezier(0.16, 1, 0.3, 1)',
        zIndex: 30,
        boxShadow: open ? '0 0 60px rgba(0,0,0,0.08)' : 'none',
      }}
    >
      <TranscriptPanel />
      <div style={{ borderTop: '1px solid var(--gen-border)' }}>
        <VoiceControl />
      </div>
    </div>
  );
}
