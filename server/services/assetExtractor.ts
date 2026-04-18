import * as pdfParseModule from 'pdf-parse';
import axios from 'axios';
import * as cheerio from 'cheerio';

const pdfParse: any = (pdfParseModule as any).default ?? (pdfParseModule as any).PDFParse ?? pdfParseModule;

export async function extractPdfText(buffer: Buffer): Promise<{ text: string; pageCount: number }> {
  const data = await pdfParse(buffer);
  return { text: (data.text || '').trim(), pageCount: data.numpages ?? 0 };
}

export async function extractUrlContent(url: string): Promise<{ title: string; text: string }> {
  const { data: html } = await axios.get<string>(url, {
    timeout: 15000,
    headers: { 'User-Agent': 'Mozilla/5.0 (Presentation Agent)' },
  });
  const $ = cheerio.load(html);
  $('script, style, nav, footer, noscript').remove();
  const title = $('title').first().text().trim() || url;
  const text = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 20000);
  return { title, text };
}

export function parseFigmaUrl(url: string): { fileKey: string; nodeId?: string } | null {
  // https://figma.com/design/:fileKey/:fileName?node-id=1-2
  // https://figma.com/file/:fileKey/:fileName?node-id=1-2
  // https://figma.com/board/:fileKey/:fileName?node-id=1-2
  // https://figma.com/make/:makeFileKey/:fileName
  const match = url.match(/figma\.com\/(design|file|board|make)\/([a-zA-Z0-9]+)/);
  if (!match) return null;
  const fileKey = match[2];
  const nodeIdMatch = url.match(/node-id=([0-9-]+)/);
  const nodeId = nodeIdMatch ? nodeIdMatch[1].replace('-', ':') : undefined;
  return { fileKey, nodeId };
}
