import OpenAI, { toFile } from 'openai';

/**
 * OpenAI Whisper STT.
 * Model: whisper-1
 * Accepts multiple audio formats (webm, mp3, m4a, wav, ogg).
 * Automatic punctuation. Language hint = 'ko' for faster/accurate Korean.
 */
let _client: OpenAI | null = null;
function getClient(): OpenAI {
  if (!_client) _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _client;
}

export async function transcribeAudio(
  audioBuffer: Buffer,
  opts: { filename?: string; language?: string } = {},
): Promise<string> {
  const client = getClient();
  const filename = opts.filename ?? 'recording.webm';

  const file = await toFile(audioBuffer, filename);
  const response = await client.audio.transcriptions.create({
    file,
    model: 'whisper-1',
    language: opts.language ?? 'ko',
    response_format: 'text',
  });

  // response is a string when response_format is 'text'
  return typeof response === 'string' ? response.trim() : (response as any).text?.trim() ?? '';
}
