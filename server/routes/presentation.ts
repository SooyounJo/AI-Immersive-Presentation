import { Router } from 'express';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { getProject, presentationPath, touchProject } from '../services/projects.js';

// mergeParams so we can read :projectId from parent router
export const presentationRouter = Router({ mergeParams: true });

presentationRouter.get('/', (req, res) => {
  const projectId = (req.params as any).projectId as string;
  if (!getProject(projectId)) {
    res.status(404).json({ error: 'project not found' });
    return;
  }
  const path = presentationPath(projectId);
  if (!existsSync(path)) {
    res.status(404).json({ error: 'presentation missing' });
    return;
  }
  res.json(JSON.parse(readFileSync(path, 'utf-8')));
});

presentationRouter.put('/', (req, res) => {
  const projectId = (req.params as any).projectId as string;
  if (!getProject(projectId)) {
    res.status(404).json({ error: 'project not found' });
    return;
  }
  try {
    writeFileSync(presentationPath(projectId), JSON.stringify(req.body, null, 2), 'utf-8');
    touchProject(projectId);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});
