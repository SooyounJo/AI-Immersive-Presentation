import { useEffect, useMemo, useRef, useState } from 'react';
import { usePresentationStore } from './stores/presentationStore';
import { useProjectsStore } from './stores/projectsStore';
import { SlideView } from './components/SlideView';
import { TranscriptPanel } from './components/TranscriptPanel';
import { VoiceControl } from './components/VoiceControl';
import { ControlBar } from './components/ControlBar';
import { DesignView } from './components/DesignView';
import { BottomTabs } from './components/BottomTabs';
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

        <BottomTabs />
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
  return (
    <div
      className="flex items-center justify-between px-8 py-5"
      style={{
        borderBottom: '1px solid var(--gen-border)',
        background: 'rgba(255,255,255,0.55)',
        backdropFilter: 'blur(6px)',
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
          alignItems: 'baseline',
          gap: 16,
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          color: 'var(--gen-text)',
        }}
      >
        <span
          style={{
            fontSize: 22,
            fontWeight: 200,
            letterSpacing: '0.32em',
            textTransform: 'uppercase',
          }}
        >
          VOIX
        </span>
        <span
          className="gen-label"
          style={{ color: 'var(--gen-text-mute)', display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <span style={{ fontSize: 10 }}>←</span>
          <span className="truncate" style={{ maxWidth: 220 }}>{projectName || 'Untitled'}</span>
        </span>
      </button>

      <div className="flex items-center gap-3">
        {showToggles && <TopToggles />}
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
