import { useEffect, useRef } from 'react';
import { usePresentationStore } from '../stores/presentationStore';
import { useProjectsStore } from '../stores/projectsStore';
import { projectApi } from '../api';

const DEBOUNCE_MS = 700;

/**
 * Auto-save the current presentation to the server whenever it changes.
 *
 * Debounced so rapid edits batch into one PUT. Silent — no blocking UI.
 * The first fetch after load will not trigger a save (skipFirst).
 */
export function useAutoSave() {
  const presentation = usePresentationStore((s) => s.presentation);
  const currentProjectId = useProjectsStore((s) => s.currentProjectId);
  const timerRef = useRef<number | null>(null);
  const skipNext = useRef(true);

  // Reset "skip" when project switches (first change after load should not save)
  useEffect(() => {
    skipNext.current = true;
  }, [currentProjectId]);

  useEffect(() => {
    if (!presentation || !currentProjectId) return;
    if (skipNext.current) {
      skipNext.current = false;
      return;
    }

    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(async () => {
      try {
        await fetch(`${projectApi()}/presentation`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(presentation),
        });
      } catch (e) {
        console.warn('auto-save failed', e);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [presentation, currentProjectId]);
}
