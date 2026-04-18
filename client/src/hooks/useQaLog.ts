import { useCallback, useEffect, useState } from 'react';
import { projectApi } from '../api';
import { useProjectsStore } from '../stores/projectsStore';

function base() { return `${projectApi()}/qa-log`; }

export interface QaLogEntry {
  id: string;
  timestamp: number;
  presentationTitle?: string;
  slideIndex: number;
  slideTitle: string;
  slideLabels?: string[];
  question: string;
  answer: string;
  wasInterrupt: boolean;
  interruptSpokenText?: string;
  resolved?: boolean;
  note?: string;
}

export function useQaLog(pollMs = 4000) {
  const currentProjectId = useProjectsStore((s) => s.currentProjectId);
  const [entries, setEntries] = useState<QaLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!currentProjectId) return;
    setLoading(true);
    try {
      const res = await fetch(base());
      setEntries(await res.json());
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [currentProjectId]);

  useEffect(() => {
    refresh();
    if (pollMs > 0) {
      const t = setInterval(refresh, pollMs);
      return () => clearInterval(t);
    }
  }, [refresh, pollMs]);

  const patch = useCallback(async (id: string, body: Partial<QaLogEntry>) => {
    try {
      await fetch(`${base()}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      await refresh();
    } catch (e: any) {
      setError(e.message);
    }
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    await fetch(`${base()}/${id}`, { method: 'DELETE' });
    await refresh();
  }, [refresh]);

  const clearAll = useCallback(async () => {
    await fetch(base(), { method: 'DELETE' });
    await refresh();
  }, [refresh]);

  return { entries, loading, error, refresh, patch, remove, clearAll };
}
