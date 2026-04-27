import { useEffect } from 'react';
import { useProjectsStore } from './stores/projectsStore';
import { ProjectPicker } from './components/ProjectPicker';
import { MainLayout } from './components/layout/MainLayout';

export default function App() {
  const { currentProjectId, init, leave } = useProjectsStore();

  useEffect(() => { init(); }, [init]);

  if (!currentProjectId) return <ProjectPicker />;

  return <MainLayout onLeave={leave} />;
}
