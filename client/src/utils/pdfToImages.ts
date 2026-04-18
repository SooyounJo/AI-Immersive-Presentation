import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

export interface PdfPageImage {
  pageNumber: number;
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * Render each page of a PDF into a PNG image Blob.
 * Client-side only (uses pdfjs + canvas). No server round-trip for rendering.
 */
export async function pdfToImages(file: File, opts: { scale?: number } = {}): Promise<PdfPageImage[]> {
  const scale = opts.scale ?? 2;
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

  const results: PdfPageImage[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas 2D context unavailable');

    await page.render({ canvasContext: context, viewport, canvas }).promise;

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png');
    });
    const dataUrl = canvas.toDataURL('image/png');

    results.push({
      pageNumber: i,
      blob,
      dataUrl,
      width: viewport.width,
      height: viewport.height,
    });
  }

  return results;
}

export interface ExtractedStructure {
  title: string;
  content: string;
  labels: string[];
  speakerNotes: string;
  visualSummary?: string;
}

export interface ExtractedPage {
  fileUrl: string;
  name: string;
  structure: ExtractedStructure;
}

/**
 * Render each page + extract structured Markdown via GPT-4o vision.
 * Preserves visual hierarchy and relationships.
 *
 * onProgress is invoked as each page completes.
 */
export async function pdfToStructuredSlides(
  file: File,
  opts: {
    /** Project-scoped API base (e.g. http://localhost:3002/api/projects/<id>) */
    projectApiBase: string;
    onProgress?: (done: number, total: number, lastTitle?: string) => void;
  },
): Promise<ExtractedPage[]> {
  const base = opts.projectApiBase;
  const pages = await pdfToImages(file);
  const total = pages.length;
  const results: ExtractedPage[] = [];

  opts.onProgress?.(0, total);

  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    const form = new FormData();
    const pageFile = new File(
      [p.blob],
      `${file.name.replace(/\.pdf$/i, '')}-p${p.pageNumber}.png`,
      { type: 'image/png' },
    );
    form.append('file', pageFile);

    const res = await fetch(`${base}/vision/pdf-page`, { method: 'POST', body: form });
    if (!res.ok) {
      const errText = await res.text().catch(() => 'extraction failed');
      throw new Error(`Page ${p.pageNumber}: ${errText}`);
    }
    const data = (await res.json()) as ExtractedPage;
    results.push(data);
    opts.onProgress?.(i + 1, total, data.structure.title);
  }

  return results;
}

export async function uploadPdfPagesAsImages(
  file: File,
  projectApiBase: string,
): Promise<{ fileUrl: string; name: string }[]> {
  const pages = await pdfToImages(file);
  const uploaded: { fileUrl: string; name: string }[] = [];

  // Upload in batches of 5 to avoid overwhelming
  const CHUNK = 5;
  for (let i = 0; i < pages.length; i += CHUNK) {
    const chunk = pages.slice(i, i + CHUNK);
    const form = new FormData();
    chunk.forEach((p) => {
      const pageFile = new File([p.blob], `${file.name.replace(/\.pdf$/i, '')}-p${p.pageNumber}.png`, {
        type: 'image/png',
      });
      form.append('files', pageFile);
    });

    const res = await fetch(`${projectApiBase}/assets/images`, { method: 'POST', body: form });
    if (!res.ok) throw new Error('Upload failed');
    const assets = (await res.json()) as { fileUrl: string; name: string }[];
    uploaded.push(...assets);
  }

  return uploaded;
}
