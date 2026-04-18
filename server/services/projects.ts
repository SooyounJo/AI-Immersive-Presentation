import { randomUUID } from 'crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync, copyFileSync, readdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');
const PROJECTS_DIR = join(DATA_DIR, 'projects');
const INDEX_PATH = join(DATA_DIR, 'projects.json');

export interface Project {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
}

export interface ProjectIndex {
  projects: Project[];
}

function ensureLayout() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  if (!existsSync(PROJECTS_DIR)) mkdirSync(PROJECTS_DIR, { recursive: true });
  if (!existsSync(INDEX_PATH)) writeFileSync(INDEX_PATH, JSON.stringify({ projects: [] }, null, 2));
}

function loadIndex(): ProjectIndex {
  ensureLayout();
  try {
    return JSON.parse(readFileSync(INDEX_PATH, 'utf-8')) as ProjectIndex;
  } catch {
    return { projects: [] };
  }
}

function saveIndex(idx: ProjectIndex) {
  writeFileSync(INDEX_PATH, JSON.stringify(idx, null, 2));
}

/* ──────────────── paths ──────────────── */

export function projectDir(id: string): string {
  return join(PROJECTS_DIR, id);
}
export function presentationPath(id: string): string {
  return join(projectDir(id), 'presentation.json');
}
export function qaLogPath(id: string): string {
  return join(projectDir(id), 'qa-log.json');
}
export function assetsDir(id: string): string {
  return join(projectDir(id), 'assets');
}
export function assetsIndexPath(id: string): string {
  return join(assetsDir(id), 'index.json');
}

/* ──────────────── CRUD ──────────────── */

export function listProjects(): Project[] {
  return loadIndex().projects.sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getProject(id: string): Project | null {
  return loadIndex().projects.find((p) => p.id === id) ?? null;
}

export const DEFAULT_PRESENTATION = {
  title: 'New Presentation',
  systemPrompt: '당신은 전문적이고 카리스마 있는 프레젠테이션 발표자입니다. 청중과의 상호작용을 중시하며, 질문에 대해 전문적이면서도 이해하기 쉽게 답변합니다. 한국어로 발표합니다.',
  knowledge: '',
  slides: [
    {
      id: 1,
      title: 'Welcome',
      content: '# New Presentation\n\n### Start designing your deck',
      speakerNotes: '환영 인사로 발표를 시작합니다. 짧고 명료하게 주제를 소개하세요.',
      visualType: 'title',
      allowQA: false,
    },
  ],
};

export function createProject(name: string, seed?: unknown): Project {
  ensureLayout();
  const id = randomUUID();
  const now = Date.now();
  const project: Project = { id, name: name.trim() || 'Untitled', createdAt: now, updatedAt: now };

  // Create folder structure
  mkdirSync(projectDir(id), { recursive: true });
  mkdirSync(assetsDir(id), { recursive: true });
  writeFileSync(presentationPath(id), JSON.stringify(seed ?? DEFAULT_PRESENTATION, null, 2));
  writeFileSync(qaLogPath(id), JSON.stringify([], null, 2));
  writeFileSync(assetsIndexPath(id), JSON.stringify([], null, 2));

  const idx = loadIndex();
  idx.projects.push(project);
  saveIndex(idx);
  return project;
}

export function updateProject(id: string, patch: Partial<Pick<Project, 'name'>>): Project | null {
  const idx = loadIndex();
  const i = idx.projects.findIndex((p) => p.id === id);
  if (i < 0) return null;
  idx.projects[i] = { ...idx.projects[i], ...patch, updatedAt: Date.now() };
  saveIndex(idx);
  return idx.projects[i];
}

export function touchProject(id: string) {
  const idx = loadIndex();
  const i = idx.projects.findIndex((p) => p.id === id);
  if (i < 0) return;
  idx.projects[i].updatedAt = Date.now();
  saveIndex(idx);
}

export function deleteProject(id: string): boolean {
  const idx = loadIndex();
  const i = idx.projects.findIndex((p) => p.id === id);
  if (i < 0) return false;
  idx.projects.splice(i, 1);
  saveIndex(idx);
  const dir = projectDir(id);
  if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
  return true;
}

/* ──────────────── one-time migration ──────────────── */

/**
 * On first run, if legacy data exists outside any project, create a default
 * project and move the files in. Idempotent.
 */
export function migrateLegacyIfNeeded() {
  ensureLayout();
  const idx = loadIndex();
  if (idx.projects.length > 0) return; // already migrated / already have projects

  const legacyPresentation = join(DATA_DIR, 'presentation.json');
  const legacyAssets = join(DATA_DIR, 'assets');
  const legacyQaLog = join(DATA_DIR, 'qa-log.json');

  const hasLegacy = existsSync(legacyPresentation);

  // Seed from legacy or fresh
  let seed: unknown = undefined;
  if (hasLegacy) {
    try { seed = JSON.parse(readFileSync(legacyPresentation, 'utf-8')); } catch {}
  }

  const name = hasLegacy
    ? (seed as any)?.title || 'Imported Project'
    : 'My First Project';

  const project = createProject(name, seed);

  // Copy legacy assets (if any) into the new project
  if (hasLegacy && existsSync(legacyAssets)) {
    const dest = assetsDir(project.id);
    for (const entry of readdirSync(legacyAssets)) {
      const src = join(legacyAssets, entry);
      const dst = join(dest, entry);
      try { copyFileSync(src, dst); } catch {}
    }
  }

  // Copy legacy qa-log
  if (hasLegacy && existsSync(legacyQaLog)) {
    try { copyFileSync(legacyQaLog, qaLogPath(project.id)); } catch {}
  }

  console.log(`[projects] migrated legacy data into project ${project.id} (${project.name})`);
}
