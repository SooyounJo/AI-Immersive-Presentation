import { useProjectsStore } from './stores/projectsStore';

export const API_HOST = 'http://localhost:3002';
export const API_ROOT = `${API_HOST}/api`;

/** Base URL for the current project's scoped endpoints. Throws if no project. */
export function projectApi(): string {
  const id = useProjectsStore.getState().currentProjectId;
  if (!id) throw new Error('no current project');
  return `${API_ROOT}/projects/${id}`;
}

export function currentProjectId(): string | null {
  return useProjectsStore.getState().currentProjectId;
}
