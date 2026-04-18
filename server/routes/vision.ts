import { Router } from 'express';
import multer from 'multer';
import { randomUUID } from 'crypto';
import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'fs';
import { extname, join } from 'path';
import { extractSlideStructure } from '../services/visionExtract.js';
import { assetsDir, assetsIndexPath, getProject, touchProject } from '../services/projects.js';

function appendAsset(projectId: string, asset: any) {
  let list: any[] = [];
  const p = assetsIndexPath(projectId);
  if (existsSync(p)) { try { list = JSON.parse(readFileSync(p, 'utf-8')); } catch {} }
  list.unshift(asset);
  const dir = assetsDir(projectId);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(p, JSON.stringify(list, null, 2));
  touchProject(projectId);
}

export const visionRouter = Router({ mergeParams: true });
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

visionRouter.post('/pdf-page', upload.single('file'), async (req, res) => {
  try {
    const projectId = req.params.projectId as string;
    if (!getProject(projectId)) { res.status(404).json({ error: 'project not found' }); return; }
    if (!req.file) { res.status(400).json({ error: 'file required' }); return; }

    const id = randomUUID();
    const ext = extname(req.file.originalname) || '.png';
    const filename = `${id}${ext}`;
    const dir = assetsDir(projectId);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, filename), req.file.buffer);

    const asset = {
      id,
      type: 'image',
      name: req.file.originalname,
      createdAt: Date.now(),
      fileUrl: `/api/projects/${projectId}/assets/file/${filename}`,
      metadata: { mimeType: req.file.mimetype, size: req.file.size },
    };
    appendAsset(projectId, asset);

    const structure = await extractSlideStructure(req.file.buffer, req.file.mimetype || 'image/png');

    res.json({
      fileUrl: asset.fileUrl,
      name: asset.name,
      structure,
    });
  } catch (e: any) {
    console.error('vision pdf-page error:', e);
    res.status(500).json({ error: e.message });
  }
});
