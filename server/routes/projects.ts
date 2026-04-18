import { Router } from 'express';
import {
  listProjects, getProject, createProject, updateProject, deleteProject,
} from '../services/projects.js';

export const projectsRouter = Router();

/** GET /api/projects — list all */
projectsRouter.get('/', (_req, res) => {
  res.json(listProjects());
});

/** POST /api/projects — create new { name } */
projectsRouter.post('/', (req, res) => {
  const { name } = (req.body ?? {}) as { name?: string };
  const project = createProject(name ?? 'Untitled');
  res.status(201).json(project);
});

/** GET /api/projects/:id — metadata */
projectsRouter.get('/:id', (req, res) => {
  const p = getProject(req.params.id);
  if (!p) {
    res.status(404).json({ error: 'not found' });
    return;
  }
  res.json(p);
});

/** PATCH /api/projects/:id — rename */
projectsRouter.patch('/:id', (req, res) => {
  const p = updateProject(req.params.id, req.body ?? {});
  if (!p) {
    res.status(404).json({ error: 'not found' });
    return;
  }
  res.json(p);
});

/** DELETE /api/projects/:id */
projectsRouter.delete('/:id', (req, res) => {
  const ok = deleteProject(req.params.id);
  if (!ok) {
    res.status(404).json({ error: 'not found' });
    return;
  }
  res.json({ ok: true });
});
