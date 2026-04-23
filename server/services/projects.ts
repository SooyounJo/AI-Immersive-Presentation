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
  title: 'MY FIRST PROJECT',
  systemPrompt: '당신은 전문적이고 카리스마 있는 프레젠테이션 발표자입니다. 청중과의 상호작용을 중시하며, 질문에 대해 전문적이면서도 이해하기 쉽게 답변합니다. 한국어로 발표합니다.',
  knowledge: '',
  slides: [
    {
      id: 1,
      title: 'Genesis GV80',
      content: '### Premium Luxury SUV\n\nExperience the pinnacle of elegance and performance.',
      speakerNotes: '환영 인사로 발표를 시작합니다. 제네시스 GV80의 럭셔리한 디자인과 성능에 대해 소개하겠습니다.',
      visualType: 'image',
      allowQA: true,
      templateId: 'figma-1',
      sceneMode: 'slide',
      templateTextBlocks: [
        { id: 'title-1', text: 'Genesis GV80', x: 6, y: 22, fontSize: 56, fontWeight: 700, maxWidth: 88, zIndex: 2 },
        { id: 'body-1', text: 'Premium Luxury SUV', x: 6, y: 40, fontSize: 24, fontWeight: 400, maxWidth: 88, zIndex: 1 },
      ],
    },
    {
      id: 2,
      title: 'Interior Design',
      content: '### Beauty of White Space\n\nA spacious and refined interior crafted with the finest materials.',
      speakerNotes: '여백의 미를 살린 인테리어 디자인을 강조합니다. 최고급 소재와 넓은 공간감을 느껴보세요.',
      visualType: 'image',
      allowQA: true,
      templateId: 'figma-6',
      sceneMode: 'slide',
    },
    {
      id: 3,
      title: 'Innovation',
      content: '### Advanced Technology\n\nSmart features and safety systems that redefine the driving experience.',
      speakerNotes: '최첨단 기술과 안전 시스템을 통해 드라이빙의 새로운 기준을 제시합니다.',
      visualType: 'image',
      allowQA: true,
      templateId: 'figma-12',
      sceneMode: 'slide',
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
