import { Router } from 'express';
import { synthesizeSpeech } from '../services/tts.js';

export const ttsRouter = Router();

ttsRouter.post('/synthesize', async (req, res) => {
  try {
    const { text, voice, speed } = req.body as { text: string; voice?: any; speed?: number };
    if (!text) {
      res.status(400).json({ error: 'text is required' });
      return;
    }

    const audioBuffer = await synthesizeSpeech(text, { voice, speed });
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', audioBuffer.length.toString());
    res.send(audioBuffer);
  } catch (error: any) {
    console.error('TTS error:', error);
    res.status(500).json({ error: error.message });
  }
});
