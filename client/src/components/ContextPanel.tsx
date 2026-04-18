import { useState, useRef, type DragEvent, type ChangeEvent } from 'react';
import { useAssets } from '../hooks/useAssets';
import { usePresentationStore } from '../stores/presentationStore';
import { uploadPdfPagesAsImages, pdfToStructuredSlides } from '../utils/pdfToImages';
import type { Asset } from '../types';
import {
  IconImages, IconWeb, IconArrowDown, IconArrowRight, IconPlus, IconClose,
  IconTrash, IconLink, IconPdf, IconVideo, IconUpload, IconComment,
} from './icons';

import { API_HOST, projectApi } from '../api';

type TabId = 'add' | 'assets';

export function ContextPanel() {
  const { assets, loading, error, uploadPdf, uploadImages, uploadVideo, addFigma, addUrl, addNote, deleteAsset } = useAssets();
  const { appendSlides } = usePresentationStore();

  const [isDragging, setIsDragging] = useState(false);
  const [figmaUrl, setFigmaUrl] = useState('');
  const [webUrl, setWebUrl] = useState('');
  const [noteText, setNoteText] = useState('');
  const [noteOpen, setNoteOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('add');
  const [pdfProgress, setPdfProgress] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | File[]) => {
    const fileArr = Array.from(files);
    const pdfs = fileArr.filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
    const images = fileArr.filter(f => f.type.startsWith('image/'));
    const videos = fileArr.filter(f => f.type.startsWith('video/'));

    for (const pdf of pdfs) await uploadPdf(pdf);
    if (images.length) await uploadImages(images);
    for (const v of videos) await uploadVideo(v);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) {
      await handleFiles(e.dataTransfer.files);
    }
    const text = e.dataTransfer.getData('text/plain');
    if (text && text.startsWith('http')) {
      if (text.includes('figma.com')) await addFigma(text);
      else await addUrl(text);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleFileInput = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) await handleFiles(e.target.files);
    e.target.value = '';
  };

  const handleVideoInput = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    await uploadVideo(file);
    e.target.value = '';
  };

  /**
   * Convert a PDF into structured slides:
   *  1. Render each page to PNG (client-side, pdfjs)
   *  2. Send each PNG to GPT-4o vision → extract Markdown preserving
   *     visual hierarchy (# / ## / bullets / tables / arrows / relationships)
   *  3. Append one slide per page with extracted content + image as media
   */
  const handlePdfToSlides = async (file: File) => {
    try {
      setPdfProgress(`Reading ${file.name}…`);

      const pages = await pdfToStructuredSlides(file, {
        projectApiBase: projectApi(),
        onProgress: (done, total, lastTitle) => {
          setPdfProgress(
            lastTitle
              ? `Analyzing ${done}/${total} · "${lastTitle.slice(0, 30)}"`
              : `Analyzing ${done}/${total}…`,
          );
        },
      });

      setPdfProgress(`Creating ${pages.length} slides…`);

      appendSlides(
        pages.map((p) => ({
          title: p.structure.title,
          content: p.structure.content,
          speakerNotes: p.structure.speakerNotes,
          labels: p.structure.labels,
          visualType: 'bullets' as const,
          allowQA: true,
          media: [{ url: `${API_HOST}${p.fileUrl}`, kind: 'image' as const, name: p.name }],
        })),
      );

      setPdfProgress(`✓ ${pages.length} slides extracted`);
      setTimeout(() => setPdfProgress(null), 2500);
    } catch (e: any) {
      console.error(e);
      setPdfProgress(`Error: ${e.message}`);
      setTimeout(() => setPdfProgress(null), 3500);
    }
  };

  /** Quick import: rasterize only, no vision extraction. */
  const handlePdfToImagesOnly = async (file: File) => {
    try {
      setPdfProgress(`Rendering ${file.name}…`);
      const uploaded = await uploadPdfPagesAsImages(file, projectApi());
      const baseName = file.name.replace(/\.pdf$/i, '');
      appendSlides(
        uploaded.map((u, i) => ({
          title: `${baseName} · Page ${i + 1}`,
          content: '',
          speakerNotes: '',
          visualType: 'image' as const,
          allowQA: true,
          media: [{ url: `${API_HOST}${u.fileUrl}`, kind: 'image' as const, name: u.name }],
        })),
      );
      setPdfProgress(`✓ ${uploaded.length} slides (image only)`);
      setTimeout(() => setPdfProgress(null), 2500);
    } catch (e: any) {
      console.error(e);
      setPdfProgress(`Error: ${e.message}`);
      setTimeout(() => setPdfProgress(null), 3000);
    }
  };

  const pdfFileInputRef = useRef<HTMLInputElement>(null);
  const pdfImageOnlyInputRef = useRef<HTMLInputElement>(null);
  const handlePdfToSlidesInput = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    await handlePdfToSlides(e.target.files[0]);
    e.target.value = '';
  };
  const handlePdfImageOnlyInput = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    await handlePdfToImagesOnly(e.target.files[0]);
    e.target.value = '';
  };

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--gen-bg-soft)' }}>
      {/* Header */}
      <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--gen-border)' }}>
        <div className="flex items-center justify-between mb-3">
          <span className="gen-label">Context &amp; Assets</span>
          <span style={{ fontSize: 10, color: 'var(--gen-text-mute)', letterSpacing: '0.1em' }}>
            {String(assets.length).padStart(2, '0')}
          </span>
        </div>
        <div className="flex gap-0" style={{ border: '1px solid var(--gen-border)' }}>
          <TabBtn label="Add" active={activeTab === 'add'} onClick={() => setActiveTab('add')} />
          <TabBtn label="Library" active={activeTab === 'assets'} onClick={() => setActiveTab('assets')} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'add' ? (
          <div className="p-5 space-y-5">
            {/* Drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={() => setIsDragging(false)}
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer"
              style={{
                padding: '28px 16px',
                background: isDragging ? 'var(--gen-black)' : 'var(--gen-white)',
                color: isDragging ? 'var(--gen-white)' : 'var(--gen-text)',
                border: `1px dashed ${isDragging ? 'var(--gen-black)' : 'var(--gen-border)'}`,
                transition: 'all var(--gen-base)',
                textAlign: 'center',
              }}
            >
              <div className="flex justify-center mb-3" style={{ gap: 16 }}>
                <IconImages size={22} />
                <IconPdf size={22} />
                <IconVideo size={22} />
              </div>
              <div style={{ fontSize: 18, fontWeight: 200, letterSpacing: '-0.01em', marginBottom: 4 }}>
                {isDragging ? 'Release to Upload' : 'Drag files here'}
              </div>
              <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.65 }}>
                Image · PDF · Video
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,image/*,video/*"
                onChange={handleFileInput}
                className="hidden"
              />
            </div>

            {/* PDF → Slides */}
            <div>
              <div className="gen-label mb-2">PDF → Slides</div>
              <button
                onClick={() => pdfFileInputRef.current?.click()}
                className="gen-btn gen-btn-primary w-full"
                style={{ padding: '14px', fontSize: 11, gap: 8 }}
              >
                <IconUpload size={14} />
                Import with Vision (structured)
              </button>
              <input
                ref={pdfFileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handlePdfToSlidesInput}
                className="hidden"
              />

              <button
                onClick={() => pdfImageOnlyInputRef.current?.click()}
                className="gen-btn gen-btn-ghost w-full mt-1.5"
                style={{ padding: '10px', fontSize: 10, gap: 6 }}
              >
                Image-only (fast)
              </button>
              <input
                ref={pdfImageOnlyInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handlePdfImageOnlyInput}
                className="hidden"
              />

              {pdfProgress && (
                <div style={{ fontSize: 10, color: 'var(--gen-text-sub)', marginTop: 8, letterSpacing: '0.08em' }}>
                  {pdfProgress}
                </div>
              )}
              <p style={{ fontSize: 10, color: 'var(--gen-text-mute)', marginTop: 6, lineHeight: 1.55 }}>
                <strong style={{ color: 'var(--gen-text-sub)' }}>Vision</strong>: GPT-4o reads each page and extracts visual hierarchy (headings, bullets, tables, arrows) into Markdown. Slower, costs API tokens.<br />
                <strong style={{ color: 'var(--gen-text-sub)' }}>Image-only</strong>: just rasterize pages as backgrounds.
              </p>
            </div>

            {/* Video upload (single) */}
            <div>
              <div className="gen-label mb-2">Video</div>
              <button
                onClick={() => videoInputRef.current?.click()}
                className="gen-btn gen-btn-outline w-full"
                style={{ padding: '14px', fontSize: 11, gap: 8 }}
              >
                <IconVideo size={14} />
                Add Video Clip
              </button>
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                onChange={handleVideoInput}
                className="hidden"
              />
              <p style={{ fontSize: 10, color: 'var(--gen-text-mute)', marginTop: 6, lineHeight: 1.5 }}>
                Attach to a slide to play on demand during presentation.
              </p>
            </div>

            {/* Figma URL */}
            <LabeledInput
              label={<><IconImages size={12} /> Figma URL</>}
              value={figmaUrl}
              onChange={setFigmaUrl}
              placeholder="figma.com/design/..."
              disabled={loading}
              onSubmit={() => { if (figmaUrl.trim()) { addFigma(figmaUrl.trim()); setFigmaUrl(''); } }}
            />

            {/* Web URL */}
            <LabeledInput
              label={<><IconWeb size={12} /> Web URL</>}
              value={webUrl}
              onChange={setWebUrl}
              placeholder="https://..."
              disabled={loading}
              onSubmit={() => { if (webUrl.trim()) { addUrl(webUrl.trim()); setWebUrl(''); } }}
            />

            {/* Quick note */}
            <div>
              <button
                onClick={() => setNoteOpen(!noteOpen)}
                className="w-full flex items-center justify-between"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                <span className="gen-label flex items-center gap-1.5">
                  <IconComment size={12} /> Quick Note
                </span>
                <span style={{ color: 'var(--gen-text-mute)' }}>
                  {noteOpen ? <IconClose size={12} /> : <IconPlus size={12} />}
                </span>
              </button>
              {noteOpen && (
                <div className="mt-2 space-y-2">
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Additional context for the agent..."
                    rows={4}
                    className="gen-input"
                  />
                  <button
                    onClick={async () => { if (noteText.trim()) { await addNote(noteText.trim()); setNoteText(''); setNoteOpen(false); } }}
                    disabled={!noteText.trim()}
                    className="gen-btn gen-btn-outline w-full"
                    style={{ padding: '10px', fontSize: 10 }}
                  >
                    Save Note
                  </button>
                </div>
              )}
            </div>

            {loading && (
              <div style={{ fontSize: 11, color: 'var(--gen-text-sub)', textAlign: 'center', padding: 8, letterSpacing: '0.1em' }}>
                Processing…
              </div>
            )}
            {error && (
              <div style={{ fontSize: 11, color: 'var(--gen-black)', padding: 10, border: '1px solid var(--gen-black)', background: 'var(--gen-bg-gray)' }}>
                {error}
              </div>
            )}
          </div>
        ) : (
          <div className="p-5 space-y-3">
            {assets.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--gen-text-mute)' }}>
                <div className="gen-label mb-2">Empty</div>
                <div style={{ fontSize: 12, lineHeight: 1.7 }}>
                  No assets yet. Switch to Add tab<br />to begin curating.
                </div>
              </div>
            )}
            {assets.map((a) => <AssetCard key={a.id} asset={a} onDelete={() => deleteAsset(a.id)} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function TabBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex-1"
      style={{
        padding: '9px',
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        background: active ? 'var(--gen-black)' : 'var(--gen-white)',
        color: active ? 'var(--gen-white)' : 'var(--gen-text-sub)',
        border: 'none',
        borderLeft: label === 'Library' ? '1px solid var(--gen-border)' : 'none',
        cursor: 'pointer',
        transition: 'all var(--gen-fast)',
      }}
    >
      {label}
    </button>
  );
}

function LabeledInput({
  label, value, onChange, placeholder, onSubmit, disabled,
}: {
  label: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  onSubmit: () => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <div className="gen-label flex items-center gap-1.5 mb-2">{label}</div>
      <div className="flex" style={{ border: '1px solid var(--gen-border)' }}>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
          placeholder={placeholder}
          style={{
            flex: 1,
            padding: '12px 14px',
            border: 'none',
            fontSize: 12,
            fontFamily: 'var(--gen-font-body)',
            background: 'var(--gen-white)',
            outline: 'none',
          }}
        />
        <button
          onClick={onSubmit}
          disabled={!value.trim() || disabled}
          style={{
            padding: '0 18px',
            background: 'var(--gen-black)',
            color: 'var(--gen-white)',
            border: 'none',
            fontSize: 10,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            opacity: !value.trim() || disabled ? 0.35 : 1,
          }}
        >
          Add
        </button>
      </div>
    </div>
  );
}

function AssetCard({ asset, onDelete }: { asset: Asset; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const { currentSlideIndex, addSlideMedia, addSlideFile } = usePresentationStore();

  const attachToSlide = () => {
    if (!asset.fileUrl) return;
    if (asset.type === 'image' || asset.type === 'video') {
      addSlideMedia(currentSlideIndex, {
        url: `${API_HOST}${asset.fileUrl}`,
        kind: asset.type === 'video' ? 'video' : 'image',
        name: asset.name,
      });
    } else if (asset.type === 'pdf') {
      addSlideFile(currentSlideIndex, {
        url: `${API_HOST}${asset.fileUrl}`,
        name: asset.name,
        kind: 'pdf',
        mimeType: asset.metadata?.mimeType,
        size: asset.metadata?.size,
      });
    }
  };

  const typeLabel = asset.type.toUpperCase();
  const canAttach = asset.type === 'image' || asset.type === 'video' || asset.type === 'pdf';

  return (
    <div style={{ background: 'var(--gen-white)', border: '1px solid var(--gen-border)' }}>
      <div className="p-4 flex items-start gap-3">
        <div
          style={{
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--gen-black)',
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: '0.1em',
          }}
        >
          {typeLabel.slice(0, 3)}
        </div>
        <div className="flex-1 min-w-0">
          <div style={{ fontSize: 12, fontWeight: 400, letterSpacing: '0.01em' }} className="truncate">
            {asset.name}
          </div>
          <div style={{ fontSize: 10, color: 'var(--gen-text-mute)', marginTop: 2, letterSpacing: '0.1em' }}>
            {asset.metadata?.pageCount ? `${asset.metadata.pageCount} pages` : typeLabel}
            {asset.metadata?.size ? ` · ${(asset.metadata.size / 1024).toFixed(0)} KB` : ''}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          {canAttach && (
            <button
              onClick={attachToSlide}
              title="Attach to current slide"
              style={{ fontSize: 9, background: 'none', border: 'none', padding: '2px 4px', cursor: 'pointer', color: 'var(--gen-text-sub)', display: 'flex', alignItems: 'center' }}
            >
              <IconPlus size={12} />
            </button>
          )}
          {(asset.extractedText || asset.note || asset.fileUrl) && (
            <button
              onClick={() => setExpanded(!expanded)}
              style={{ background: 'none', border: 'none', padding: '2px 4px', cursor: 'pointer', color: 'var(--gen-text-sub)', display: 'flex', alignItems: 'center' }}
            >
              {expanded ? <IconClose size={12} /> : <IconArrowDown size={12} />}
            </button>
          )}
          <button
            onClick={() => { if (confirm('Delete this asset?')) onDelete(); }}
            style={{ background: 'none', border: 'none', padding: '2px 4px', cursor: 'pointer', color: 'var(--gen-text-sub)', display: 'flex', alignItems: 'center' }}
          >
            <IconTrash size={12} />
          </button>
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid var(--gen-border)', padding: 14, background: 'var(--gen-bg-soft)' }}>
          {asset.type === 'image' && asset.fileUrl && (
            <img src={`${API_HOST}${asset.fileUrl}`} alt={asset.name} style={{ width: '100%', maxHeight: 200, objectFit: 'contain' }} />
          )}
          {asset.type === 'video' && asset.fileUrl && (
            <video
              src={`${API_HOST}${asset.fileUrl}`}
              controls
              style={{ width: '100%', maxHeight: 240, background: '#000' }}
            />
          )}
          {asset.type === 'pdf' && asset.fileUrl && (
            <a
              href={`${API_HOST}${asset.fileUrl}`}
              target="_blank"
              rel="noopener"
              className="flex items-center gap-2"
              style={{ fontSize: 11, color: 'var(--gen-text)', textDecoration: 'underline', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}
            >
              <IconLink size={12} /> Open PDF
            </a>
          )}
          {(asset.type === 'figma' || asset.type === 'url') && asset.url && (
            <a
              href={asset.url}
              target="_blank"
              rel="noopener"
              className="flex items-center gap-2"
              style={{ fontSize: 11, color: 'var(--gen-text)', textDecoration: 'underline', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}
            >
              <IconLink size={12} /> Open Source
            </a>
          )}
          {(asset.extractedText || asset.note) && (
            <pre style={{ fontSize: 11, lineHeight: 1.6, color: 'var(--gen-text-sub)', whiteSpace: 'pre-wrap', fontFamily: 'var(--gen-font-body)', maxHeight: 160, overflowY: 'auto', fontWeight: 300 }}>
              {(asset.extractedText || asset.note)?.slice(0, 1500)}
              {((asset.extractedText || asset.note)?.length || 0) > 1500 && '\n...'}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

// Suppress unused imports from icon list used conditionally above
void IconArrowRight;
