import OpenAI from 'openai';

/**
 * OpenAI Text-to-Speech.
 * Model: tts-1-hd (higher quality, slightly slower than tts-1)
 * Voices: alloy, echo, fable, onyx, nova, shimmer
 *   - onyx: deep male — good for professional presentations
 *   - nova: bright female
 *   - alloy: neutral, balanced
 */
let _client: OpenAI | null = null;
function getClient(): OpenAI {
  if (!_client) _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _client;
}

export type TtsVoice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';

export async function synthesizeSpeech(
  text: string,
  opts: { voice?: TtsVoice; speed?: number } = {},
): Promise<Buffer> {
  const client = getClient();
  const response = await client.audio.speech.create({
    model: 'tts-1-hd',
    voice: opts.voice ?? 'onyx',
    input: text,
    response_format: 'mp3',
    speed: opts.speed ?? 1.0,
  });

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
