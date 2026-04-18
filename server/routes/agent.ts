import { Router } from 'express';
import { streamAgentResponse } from '../services/openai.js';

export const agentRouter = Router();

agentRouter.post('/stream', async (req, res) => {
  try {
    const { mode, systemPrompt, knowledge, currentSlide, userMessage, conversationHistory } = req.body;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = streamAgentResponse({
      mode,
      systemPrompt,
      knowledge,
      currentSlide,
      userMessage,
      conversationHistory: conversationHistory || [],
    });

    for await (const chunk of stream) {
      res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    console.error('Agent error:', error);
    res.status(500).json({ error: error.message });
  }
});
