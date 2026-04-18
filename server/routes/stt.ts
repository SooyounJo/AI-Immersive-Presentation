import { Router } from 'express';
import multer from 'multer';
import { transcribeAudio } from '../services/stt.js';

export const sttRouter = Router();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

sttRouter.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'audio file is required' });
      return;
    }

    const transcript = await transcribeAudio(req.file.buffer, {
      filename: req.file.originalname || 'recording.webm',
      language: 'ko',
    });
    res.json({ transcript });
  } catch (error: any) {
    console.error('STT error:', error);
    res.status(500).json({ error: error.message });
  }
});
