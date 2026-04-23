import { useCallback, useEffect, useState } from 'react';
import type { Asset } from '../types';
import { projectApi } from '../api';
import { useProjectsStore } from '../stores/projectsStore';

function assetsBase() { return `${projectApi()}/assets`; }

export function useAssets() {
  const currentProjectId = useProjectsStore((s) => s.currentProjectId);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!currentProjectId) return;
    try {
      const res = await fetch(assetsBase());
      const data = await res.json();
      setAssets(data);
    } catch (e: any) {
      setError(e.message);
    }
  }, [currentProjectId]);

  useEffect(() => { refresh(); }, [refresh]);

  const uploadPdf = useCallback(async (file: File): Promise<Asset | null> => {
    setLoading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`${assetsBase()}/pdf`, { method: 'POST', body: form });
      if (!res.ok) throw new Error(await res.text());
      const created = await res.json();
      await refresh();
      return created as Asset;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  const uploadVideo = useCallback(async (file: File): Promise<Asset | null> => {
    setLoading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`${assetsBase()}/video`, { method: 'POST', body: form });
      if (!res.ok) throw new Error(await res.text());
      const created = await res.json();
      await refresh();
      return created as Asset;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  const uploadImages = useCallback(async (files: File[]): Promise<Asset[]> => {
    setLoading(true);
    setError(null);
    try {
      const form = new FormData();
      files.forEach(f => form.append('files', f));
      const res = await fetch(`${assetsBase()}/images`, { method: 'POST', body: form });
      if (!res.ok) throw new Error(await res.text());
      const created = await res.json();
      await refresh();
      return created as Asset[];
    } catch (e: any) {
      setError(e.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  const addFigma = useCallback(async (url: string, note?: string): Promise<Asset | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${assetsBase()}/figma`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, note }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const created = await res.json();
      await refresh();
      return created as Asset;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  const addUrl = useCallback(async (url: string): Promise<Asset | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${assetsBase()}/url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const created = await res.json();
      await refresh();
      return created as Asset;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  const addNote = useCallback(async (note: string, title?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${assetsBase()}/note`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note, title }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      await refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  const deleteAsset = useCallback(async (id: string) => {
    try {
      await fetch(`${assetsBase()}/${id}`, { method: 'DELETE' });
      await refresh();
    } catch (e: any) {
      setError(e.message);
    }
  }, [refresh]);

  return { assets, loading, error, uploadPdf, uploadImages, uploadVideo, addFigma, addUrl, addNote, deleteAsset, refresh };
}
