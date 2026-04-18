import { Router } from 'express';
import multer from 'multer';
import { randomUUID } from 'crypto';
import { mkdirSync, writeFileSync, readFileSync, existsSync, unlinkSync } from 'fs';
import { extname, join } from 'path';
import { extractPdfText, extractUrlContent, parseFigmaUrl } from '../services/assetExtractor.js';
import { assetsDir, assetsIndexPath, getProject, touchProject } from '../services/projects.js';

type Asset = {
  id: string;
  type: 'pdf' | 'image' | 'figma' | 'url' | 'note' | 'video';
  name: string;
  createdAt: number;
  url?: string;
  fileUrl?: string;
  extractedText?: string;
  note?: string;
  metadata?: Record<string, any>;
};

function loadIndex(projectId: string): Asset[] {
  const p = assetsIndexPath(projectId);
  if (!existsSync(p)) return [];
  try {
    return JSON.parse(readFileSync(p, 'utf-8')) as Asset[];
  } catch {
    return [];
  }
}

function saveIndex(projectId: string, assets: Asset[]) {
  const dir = assetsDir(projectId);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(assetsIndexPath(projectId), JSON.stringify(assets, null, 2));
}

function addAsset(projectId: string, asset: Asset) {
  const list = loadIndex(projectId);
  list.unshift(asset);
  saveIndex(projectId, list);
  touchProject(projectId);
  return asset;
}

function fileUrlFor(projectId: string, filename: string) {
  return `/api/projects/${projectId}/assets/file/${filename}`;
}

export const assetsRouter = Router({ mergeParams: true });
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

function requireProject(req: any, res: any): string | null {
  const projectId = req.params.projectId as string;
  if (!getProject(projectId)) {
    res.status(404).json({ error: 'project not found' });
    return null;
  }
  return projectId;
}

// List
assetsRouter.get('/', (req, res) => {
  const projectId = requireProject(req, res); if (!projectId) return;
  res.json(loadIndex(projectId));
});

// Delete one
assetsRouter.delete('/:id', (req, res) => {
  const projectId = requireProject(req, res); if (!projectId) return;
  const list = loadIndex(projectId);
  const target = list.find((a) => a.id === req.params.id);
  if (!target) { res.status(404).json({ error: 'not found' }); return; }
  if (target.fileUrl) {
    const filename = target.fileUrl.split('/').pop();
    if (filename) {
      const filepath = join(assetsDir(projectId), filename);
      if (existsSync(filepath)) { try { unlinkSync(filepath); } catch {} }
    }
  }
  saveIndex(projectId, list.filter((a) => a.id !== req.params.id));
  res.json({ ok: true });
});

// Upload PDF
assetsRouter.post('/pdf', upload.single('file'), async (req, res) => {
  try {
    const projectId = requireProject(req, res); if (!projectId) return;
    if (!req.file) { res.status(400).json({ error: 'file required' }); return; }
    const id = randomUUID();
    const filename = `${id}.pdf`;
    const dir = assetsDir(projectId);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, filename), req.file.buffer);

    const { text, pageCount } = await extractPdfText(req.file.buffer);
    const asset: Asset = {
      id,
      type: 'pdf',
      name: req.file.originalname,
      createdAt: Date.now(),
      fileUrl: fileUrlFor(projectId, filename),
      extractedText: text.slice(0, 100000),
      metadata: { pageCount, mimeType: 'application/pdf', size: req.file.size },
    };
    res.json(addAsset(projectId, asset));
  } catch (e: any) {
    console.error('pdf upload error:', e);
    res.status(500).json({ error: e.message });
  }
});

// Upload Images (multi)
assetsRouter.post('/images', upload.array('files', 20), async (req, res) => {
  try {
    const projectId = requireProject(req, res); if (!projectId) return;
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files?.length) { res.status(400).json({ error: 'files required' }); return; }
    const dir = assetsDir(projectId);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

    const created: Asset[] = [];
    for (const file of files) {
      const id = randomUUID();
      const ext = extname(file.originalname) || '.png';
      const filename = `${id}${ext}`;
      writeFileSync(join(dir, filename), file.buffer);
      const asset: Asset = {
        id,
        type: 'image',
        name: file.originalname,
        createdAt: Date.now(),
        fileUrl: fileUrlFor(projectId, filename),
        metadata: { mimeType: file.mimetype, size: file.size },
      };
      created.push(addAsset(projectId, asset));
    }
    res.json(created);
  } catch (e: any) {
    console.error('image upload error:', e);
    res.status(500).json({ error: e.message });
  }
});

// Upload Video
assetsRouter.post('/video', upload.single('file'), async (req, res) => {
  try {
    const projectId = requireProject(req, res); if (!projectId) return;
    if (!req.file) { res.status(400).json({ error: 'file required' }); return; }
    const id = randomUUID();
    const ext = extname(req.file.originalname) || '.mp4';
    const filename = `${id}${ext}`;
    const dir = assetsDir(projectId);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, filename), req.file.buffer);

    const asset: Asset = {
      id,
      type: 'video',
      name: req.file.originalname,
      createdAt: Date.now(),
      fileUrl: fileUrlFor(projectId, filename),
      metadata: { mimeType: req.file.mimetype, size: req.file.size },
    };
    res.json(addAsset(projectId, asset));
  } catch (e: any) {
    console.error('video upload error:', e);
    res.status(500).json({ error: e.message });
  }
});

// Figma URL
assetsRouter.post('/figma', async (req, res) => {
  try {
    const projectId = requireProject(req, res); if (!projectId) return;
    const { url, note } = req.body as { url: string; note?: string };
    if (!url) { res.status(400).json({ error: 'url required' }); return; }
    const parsed = parseFigmaUrl(url);
    if (!parsed) { res.status(400).json({ error: 'invalid figma url' }); return; }
    const asset: Asset = {
      id: randomUUID(),
      type: 'figma',
      name: note || `Figma: ${parsed.fileKey}${parsed.nodeId ? '/' + parsed.nodeId : ''}`,
      createdAt: Date.now(),
      url,
      note,
      metadata: { figmaFileKey: parsed.fileKey, figmaNodeId: parsed.nodeId },
    };
    res.json(addAsset(projectId, asset));
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Web URL scrape
assetsRouter.post('/url', async (req, res) => {
  try {
    const projectId = requireProject(req, res); if (!projectId) return;
    const { url } = req.body as { url: string };
    if (!url) { res.status(400).json({ error: 'url required' }); return; }
    const { title, text } = await extractUrlContent(url);
    const asset: Asset = {
      id: randomUUID(),
      type: 'url',
      name: title,
      createdAt: Date.now(),
      url,
      extractedText: text,
    };
    res.json(addAsset(projectId, asset));
  } catch (e: any) {
    console.error('url scrape error:', e);
    res.status(500).json({ error: e.message });
  }
});

// Quick note
assetsRouter.post('/note', async (req, res) => {
  try {
    const projectId = requireProject(req, res); if (!projectId) return;
    const { title, note } = req.body as { title?: string; note: string };
    if (!note) { res.status(400).json({ error: 'note required' }); return; }
    const asset: Asset = {
      id: randomUUID(),
      type: 'note',
      name: title || `Note ${new Date().toLocaleString()}`,
      createdAt: Date.now(),
      note,
      extractedText: note,
    };
    res.json(addAsset(projectId, asset));
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Serve uploaded files
assetsRouter.get('/file/:filename', (req, res) => {
  const projectId = requireProject(req, res); if (!projectId) return;
  const filepath = join(assetsDir(projectId), req.params.filename);
  if (!existsSync(filepath)) { res.status(404).end(); return; }
  res.sendFile(filepath);
});
