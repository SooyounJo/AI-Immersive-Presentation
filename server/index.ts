import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { Router } from 'express';

import { agentRouter } from './routes/agent.js';
import { ttsRouter } from './routes/tts.js';
import { sttRouter } from './routes/stt.js';
import { projectsRouter } from './routes/projects.js';
import { presentationRouter } from './routes/presentation.js';
import { assetsRouter } from './routes/assets.js';
import { qaLogRouter } from './routes/qaLog.js';
import { visionRouter } from './routes/vision.js';

import { migrateLegacyIfNeeded } from './services/projects.js';

// One-time migration: move any pre-projects data into a default project.
migrateLegacyIfNeeded();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Stateless services — not project-scoped
app.use('/api/agent', agentRouter);
app.use('/api/tts', ttsRouter);
app.use('/api/stt', sttRouter);

// Project CRUD
app.use('/api/projects', projectsRouter);

// Project-scoped child routes. The Router uses mergeParams to access :projectId.
const projectScoped = Router({ mergeParams: true });
projectScoped.use('/presentation', presentationRouter);
projectScoped.use('/assets', assetsRouter);
projectScoped.use('/qa-log', qaLogRouter);
projectScoped.use('/vision', visionRouter);

app.use('/api/projects/:projectId', projectScoped);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
