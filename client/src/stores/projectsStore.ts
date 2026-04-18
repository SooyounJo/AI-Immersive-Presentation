import { create } from 'zustand';

export interface Project {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
}

const API = 'http://localhost:3002/api/projects';
const LS_KEY = 'presentation-agent:lastProjectId';

interface ProjectsState {
  projects: Project[];
  currentProjectId: string | null;
  loading: boolean;
  error: string | null;

  /** Load list + restore last-used project id from localStorage if still valid. */
  init: () => Promise<void>;
  refresh: () => Promise<Project[]>;
  create: (name: string) => Promise<Project>;
  rename: (id: string, name: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  /** Enter a project — store id, also persist to localStorage. */
  enter: (id: string) => void;
  /** Leave current project — back to picker. */
  leave: () => void;
}

export const useProjectsStore = create<ProjectsState>((set, get) => ({
  projects: [],
  currentProjectId: null,
  loading: false,
  error: null,

  init: async () => {
    set({ loading: true });
    try {
      const list = await fetch(API).then((r) => r.json()) as Project[];
      const saved = localStorage.getItem(LS_KEY);
      const current = saved && list.some((p) => p.id === saved) ? saved : null;
      set({ projects: list, currentProjectId: current, loading: false, error: null });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  refresh: async () => {
    const list = await fetch(API).then((r) => r.json()) as Project[];
    set({ projects: list });
    return list;
  },

  create: async (name) => {
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const p = (await res.json()) as Project;
    await get().refresh();
    return p;
  },

  rename: async (id, name) => {
    await fetch(`${API}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    await get().refresh();
  },

  remove: async (id) => {
    await fetch(`${API}/${id}`, { method: 'DELETE' });
    if (get().currentProjectId === id) {
      localStorage.removeItem(LS_KEY);
      set({ currentProjectId: null });
    }
    await get().refresh();
  },

  enter: (id) => {
    localStorage.setItem(LS_KEY, id);
    set({ currentProjectId: id });
  },

  leave: () => {
    localStorage.removeItem(LS_KEY);
    set({ currentProjectId: null });
  },
}));
