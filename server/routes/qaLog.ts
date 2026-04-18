import { Router } from 'express';
import { randomUUID } from 'crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { getProject, qaLogPath, touchProject } from '../services/projects.js';

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

function load(projectId: string): QaLogEntry[] {
  const p = qaLogPath(projectId);
  if (!existsSync(p)) return [];
  try {
    return JSON.parse(readFileSync(p, 'utf-8'));
  } catch {
    return [];
  }
}

function save(projectId: string, entries: QaLogEntry[]) {
  const p = qaLogPath(projectId);
  if (!existsSync(dirname(p))) mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, JSON.stringify(entries, null, 2));
  touchProject(projectId);
}

function requireProject(req: any, res: any): string | null {
  const id = req.params.projectId as string;
  if (!getProject(id)) { res.status(404).json({ error: 'project not found' }); return null; }
  return id;
}

export const qaLogRouter = Router({ mergeParams: true });

qaLogRouter.get('/', (req, res) => {
  const projectId = requireProject(req, res); if (!projectId) return;
  const entries = load(projectId);
  const slideFilter = req.query.slide !== undefined ? Number(req.query.slide) : undefined;
  const filtered = slideFilter !== undefined
    ? entries.filter((e) => e.slideIndex === slideFilter)
    : entries;
  res.json(filtered.sort((a, b) => b.timestamp - a.timestamp));
});

qaLogRouter.post('/', (req, res) => {
  try {
    const projectId = requireProject(req, res); if (!projectId) return;
    const body = req.body as Partial<QaLogEntry>;
    if (!body.question || !body.answer) {
      res.status(400).json({ error: 'question and answer required' });
      return;
    }
    const entries = load(projectId);
    const entry: QaLogEntry = {
      id: randomUUID(),
      timestamp: Date.now(),
      presentationTitle: body.presentationTitle,
      slideIndex: body.slideIndex ?? -1,
      slideTitle: body.slideTitle ?? '',
      slideLabels: body.slideLabels,
      question: body.question,
      answer: body.answer,
      wasInterrupt: !!body.wasInterrupt,
      interruptSpokenText: body.interruptSpokenText,
      resolved: false,
    };
    entries.push(entry);
    save(projectId, entries);
    res.json(entry);
  } catch (e: any) {
    console.error('qa-log append error:', e);
    res.status(500).json({ error: e.message });
  }
});

qaLogRouter.patch('/:id', (req, res) => {
  const projectId = requireProject(req, res); if (!projectId) return;
  const entries = load(projectId);
  const idx = entries.findIndex((e) => e.id === req.params.id);
  if (idx < 0) { res.status(404).json({ error: 'not found' }); return; }
  entries[idx] = { ...entries[idx], ...req.body, id: entries[idx].id };
  save(projectId, entries);
  res.json(entries[idx]);
});

qaLogRouter.delete('/:id', (req, res) => {
  const projectId = requireProject(req, res); if (!projectId) return;
  const entries = load(projectId);
  save(projectId, entries.filter((e) => e.id !== req.params.id));
  res.json({ ok: true });
});

qaLogRouter.delete('/', (req, res) => {
  const projectId = requireProject(req, res); if (!projectId) return;
  save(projectId, []);
  res.json({ ok: true });
});
