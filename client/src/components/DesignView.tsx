import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { usePresentationStore } from '../stores/presentationStore';
import type { Slide, SlideLink, SlideMedia, SlideFile } from '../types';
import { ContextPanel } from './ContextPanel';
import { InsightsPanel } from './InsightsPanel';
import { projectApi } from '../api';
import {
  IconArrowLeft, IconArrowRight, IconPlus, IconClose, IconTrash,
  IconLink, IconVideo, IconImages, IconComment, IconPdf,
} from './icons';

export function DesignView() {
  const {
    presentation,
    currentSlideIndex,
    goToSlide,
    nextSlide,
    prevSlide,
    updateMeta,
    updateSlide,
    addSlide,
    deleteSlide,
    moveSlide,
    addSlideLink,
    removeSlideLink,
    addSlideMedia,
    removeSlideMedia,
    removeSlideFile,
  } = usePresentationStore();

  const [section, setSection] = useState<'meta' | 'slides' | 'insights'>('slides');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [previewOpen, setPreviewOpen] = useState(false);

  if (!presentation) return null;

  const slide = presentation.slides[currentSlideIndex];
  const totalSlides = presentation.slides.length;

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      const res = await fetch(`${projectApi()}/presentation`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(presentation),
      });
      if (!res.ok) throw new Error('Save failed');
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (e) {
      console.error(e);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  return (
    <div className="flex h-full min-h-0">
      {/* Left: slide list */}
      <div
        className="w-64 flex flex-col flex-shrink-0"
        style={{ borderRight: '1px solid var(--gen-border)', background: 'rgba(250,250,250,0.82)', backdropFilter: 'blur(6px)' }}
      >
        <div
          className="px-5 py-4 flex items-center justify-between"
          style={{ borderBottom: '1px solid var(--gen-border)' }}
        >
          <span className="gen-label">Slides · {String(totalSlides).padStart(2, '0')}</span>
          <button
            onClick={() => addSlide()}
            className="gen-btn gen-btn-ghost flex items-center justify-center"
            style={{ width: 28, height: 28, padding: 0 }}
            title="Add slide"
          >
            <IconPlus size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {presentation.slides.map((s, i) => (
            <div
              key={s.id}
              onClick={() => goToSlide(i)}
              className="group cursor-pointer"
              style={{
                padding: '12px 14px',
                background: i === currentSlideIndex ? 'var(--gen-white)' : 'transparent',
                borderLeft: i === currentSlideIndex ? '2px solid var(--gen-black)' : '2px solid transparent',
                transition: 'all var(--gen-fast)',
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="gen-label">{String(i + 1).padStart(2, '0')}</span>
                    <span
                      style={{
                        fontSize: 8,
                        fontWeight: 600,
                        letterSpacing: '0.14em',
                        padding: '2px 6px',
                        background: s.sceneMode === 'scene' ? 'var(--gen-black)' : 'transparent',
                        color: s.sceneMode === 'scene' ? 'var(--gen-white)' : 'var(--gen-text-sub)',
                        border: s.sceneMode === 'scene' ? 'none' : '1px solid var(--gen-border)',
                      }}
                    >
                      {s.sceneMode === 'scene' ? 'SCENE' : 'SLIDE'}
                    </span>
                  </div>
                  <div
                    className="truncate"
                    style={{ fontSize: 13, fontWeight: 300, letterSpacing: '0.01em' }}
                  >
                    {s.title}
                  </div>
                  {/* Attachment indicators */}
                  <div className="flex items-center gap-2 mt-1" style={{ color: 'var(--gen-text-mute)' }}>
                    {s.media?.length ? (
                      <span className="flex items-center gap-0.5" style={{ fontSize: 9 }}>
                        {s.media.some((m) => m.kind === 'video') ? <IconVideo size={10} /> : <IconImages size={10} />}
                        {s.media.length}
                      </span>
                    ) : null}
                    {s.files?.length ? (
                      <span className="flex items-center gap-0.5" style={{ fontSize: 9 }}>
                        <IconPdf size={10} />
                        {s.files.length}
                      </span>
                    ) : null}
                    {s.links?.length ? (
                      <span className="flex items-center gap-0.5" style={{ fontSize: 9 }}>
                        <IconLink size={10} />
                        {s.links.length}
                      </span>
                    ) : null}
                    {s.comment ? <IconComment size={10} /> : null}
                  </div>
                </div>
                <div className="flex flex-col gap-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); moveSlide(i, i - 1); }}
                    disabled={i === 0}
                    style={{ fontSize: 9, color: 'var(--gen-text-sub)', background: 'none', border: 'none', cursor: 'pointer' }}
                  >▲</button>
                  <button
                    onClick={(e) => { e.stopPropagation(); moveSlide(i, i + 1); }}
                    disabled={i === presentation.slides.length - 1}
                    style={{ fontSize: 9, color: 'var(--gen-text-sub)', background: 'none', border: 'none', cursor: 'pointer' }}
                  >▼</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 flex gap-1" style={{ borderTop: '1px solid var(--gen-border)' }}>
          <SectionBtn label="Slides" active={section === 'slides'} onClick={() => setSection('slides')} />
          <SectionBtn label="Meta" active={section === 'meta'} onClick={() => setSection('meta')} />
          <SectionBtn label="Insights" active={section === 'insights'} onClick={() => setSection('insights')} />
        </div>
      </div>

      {/* Middle: editor */}
      <div className="flex-1 overflow-y-auto min-w-0">
        {/* Top bar — navigation + actions */}
        <div
          className="sticky top-0 z-10 px-8 py-3 flex items-center justify-between"
          style={{ background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(8px)', borderBottom: '1px solid var(--gen-border)' }}
        >
          {/* Slide navigation */}
          {section === 'slides' ? (
            <div className="flex items-center gap-3">
              <button
                onClick={prevSlide}
                disabled={currentSlideIndex === 0}
                className="gen-btn gen-btn-ghost flex items-center"
                style={{ padding: '8px 12px', fontSize: 10, gap: 6 }}
              >
                <IconArrowLeft size={14} />
                Prev
              </button>
              <div className="gen-label" style={{ minWidth: 70, textAlign: 'center' }}>
                {String(currentSlideIndex + 1).padStart(2, '0')} / {String(totalSlides).padStart(2, '0')}
              </div>
              <button
                onClick={nextSlide}
                disabled={currentSlideIndex === totalSlides - 1}
                className="gen-btn gen-btn-ghost flex items-center"
                style={{ padding: '8px 12px', fontSize: 10, gap: 6 }}
              >
                Next
                <IconArrowRight size={14} />
              </button>
            </div>
          ) : <div />}

          <div className="flex items-center gap-2">
            {section === 'slides' && (
              <button
                onClick={() => setPreviewOpen(!previewOpen)}
                className="gen-btn gen-btn-ghost"
                style={{ padding: '8px 14px', fontSize: 10 }}
              >
                {previewOpen ? 'Hide Preview' : 'Show Preview'}
              </button>
            )}
            {section !== 'insights' && (
              <button
                onClick={handleSave}
                disabled={saveStatus === 'saving'}
                className={`gen-btn ${saveStatus === 'saved' ? 'gen-btn-outline' : 'gen-btn-primary'}`}
                style={{ padding: '10px 20px', fontSize: 10 }}
              >
                {saveStatus === 'saving' ? 'Saving…' :
                 saveStatus === 'saved' ? '✓ Saved' :
                 saveStatus === 'error' ? 'Error' :
                 'Save'}
              </button>
            )}
          </div>
        </div>

        <div className="flex min-h-full">
          <div className={section === 'insights' ? 'flex-1' : 'flex-1 px-10 py-8'}>
            {section === 'meta' ? (
              <MetaEditor presentation={presentation} onUpdate={updateMeta} />
            ) : section === 'insights' ? (
              <InsightsPanel />
            ) : (
              slide && (
                <SlideEditor
                  slide={slide}
                  index={currentSlideIndex}
                  onChange={(patch) => updateSlide(currentSlideIndex, patch)}
                  onDelete={() => deleteSlide(currentSlideIndex)}
                  onAddLink={(link) => addSlideLink(currentSlideIndex, link)}
                  onRemoveLink={(url) => removeSlideLink(currentSlideIndex, url)}
                  onAddMedia={(m) => addSlideMedia(currentSlideIndex, m)}
                  onRemoveMedia={(url) => removeSlideMedia(currentSlideIndex, url)}
                  onRemoveFile={(url) => removeSlideFile(currentSlideIndex, url)}
                />
              )
            )}
          </div>

          {previewOpen && section === 'slides' && slide && (
            <div
              className="w-96 p-8 overflow-y-auto"
              style={{ borderLeft: '1px solid var(--gen-border)', background: 'rgba(250,250,250,0.6)', backdropFilter: 'blur(6px)' }}
            >
              <div className="gen-label mb-5">Preview</div>
              <div
                className="gen-prose"
                style={{ background: 'var(--gen-white)', padding: 28, border: '1px solid var(--gen-border)' }}
              >
                {slide.media?.[0]?.kind === 'image' && (
                  <img
                    src={slide.media[0].url}
                    alt={slide.media[0].name || ''}
                    style={{ width: '100%', marginBottom: 16 }}
                  />
                )}
                <ReactMarkdown>{slide.content}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: Context & Assets */}
      <div
        className="w-96 flex-shrink-0"
        style={{ borderLeft: '1px solid var(--gen-border)' }}
      >
        <ContextPanel />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */

function SectionBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex-1"
      style={{
        padding: '10px',
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        background: active ? 'var(--gen-black)' : 'transparent',
        color: active ? 'var(--gen-white)' : 'var(--gen-text-sub)',
        border: 'none',
        cursor: 'pointer',
        transition: 'all var(--gen-fast)',
      }}
    >
      {label}
    </button>
  );
}

function MetaEditor({
  presentation,
  onUpdate,
}: {
  presentation: { title: string; systemPrompt: string; knowledge: string };
  onUpdate: (patch: any) => void;
}) {
  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h2 className="gen-display" style={{ fontSize: 36, marginBottom: 4 }}>Presentation Settings</h2>
        <div style={{ width: 48, height: 1, background: 'var(--gen-black)' }} />
      </div>

      <Field label="Title">
        <input
          className="gen-input"
          value={presentation.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
        />
      </Field>

      <Field label="System Prompt">
        <textarea
          className="gen-input"
          rows={5}
          value={presentation.systemPrompt}
          onChange={(e) => onUpdate({ systemPrompt: e.target.value })}
        />
      </Field>

      <Field label="Knowledge (Q&amp;A reference)">
        <textarea
          className="gen-input"
          rows={10}
          style={{ fontFamily: 'monospace' }}
          value={presentation.knowledge}
          onChange={(e) => onUpdate({ knowledge: e.target.value })}
        />
        <p style={{ fontSize: 11, color: 'var(--gen-text-mute)', marginTop: 6 }}>
          Assets from the right panel are automatically linked to context.
        </p>
      </Field>
    </div>
  );
}

/* ---------------------------------------------------------------- */

function SlideEditor({
  slide,
  index,
  onChange,
  onDelete,
  onAddLink,
  onRemoveLink,
  onAddMedia,
  onRemoveMedia,
  onRemoveFile,
}: {
  slide: Slide;
  index: number;
  onChange: (patch: Partial<Slide>) => void;
  onDelete: () => void;
  onAddLink: (link: SlideLink) => void;
  onRemoveLink: (url: string) => void;
  onAddMedia: (m: SlideMedia) => void;
  onRemoveMedia: (url: string) => void;
  onRemoveFile: (url: string) => void;
}) {
  const isScene = slide.sceneMode === 'scene';
  const [newLink, setNewLink] = useState('');
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [labelInput, setLabelInput] = useState('');

  const addLabel = () => {
    const v = labelInput.trim();
    if (!v) return;
    const existing = slide.labels ?? [];
    if (!existing.includes(v)) onChange({ labels: [...existing, v] });
    setLabelInput('');
  };
  const removeLabel = (label: string) => {
    onChange({ labels: (slide.labels ?? []).filter((l) => l !== label) });
  };

  const submitLink = () => {
    const url = newLink.trim();
    if (!url) return;
    onAddLink({ url, label: newLinkLabel.trim() || undefined });
    setNewLink('');
    setNewLinkLabel('');
  };

  return (
    <div className="max-w-2xl space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <div className="gen-label mb-2">Slide {String(index + 1).padStart(2, '0')}</div>
          <h2 className="gen-display" style={{ fontSize: 36 }}>Edit Slide</h2>
          <div style={{ width: 48, height: 1, background: 'var(--gen-black)', marginTop: 8 }} />
        </div>
        <button
          onClick={() => { if (confirm('Delete this slide?')) onDelete(); }}
          className="gen-btn gen-btn-ghost flex items-center gap-1.5"
          style={{ fontSize: 10, color: 'var(--gen-text-sub)' }}
        >
          <IconTrash size={12} />
          Delete
        </button>
      </div>

      {/* Mode toggle */}
      <div style={{ padding: 20, background: 'rgba(250,250,250,0.7)', border: '1px solid var(--gen-border)' }}>
        <div className="gen-label mb-3">Mode</div>
        <div className="flex" style={{ border: '1px solid var(--gen-border)' }}>
          <ModeBtn active={!isScene} onClick={() => onChange({ sceneMode: 'slide' })} label="Slide Mode" subtitle="User controls progression" />
          <ModeBtn active={isScene} onClick={() => onChange({ sceneMode: 'scene' })} label="Scene Mode" subtitle="Autonomous · Interruptible" divider />
        </div>
        {isScene && (
          <div className="mt-4">
            <div className="gen-label mb-2">Auto-advance (ms · 0 = after TTS)</div>
            <input
              type="number"
              value={slide.autoAdvanceMs ?? 0}
              onChange={(e) => onChange({ autoAdvanceMs: Number(e.target.value) || 0 })}
              className="gen-input"
            />
          </div>
        )}
      </div>

      <Field label="Title">
        <input className="gen-input" value={slide.title} onChange={(e) => onChange({ title: e.target.value })} />
      </Field>

      {/* Labels — for agent navigation */}
      <Field label="Topic Labels · agent navigation cues">
        <div className="flex flex-wrap gap-1.5 mb-2">
          {(slide.labels ?? []).map((l) => (
            <span
              key={l}
              style={{
                fontSize: 10,
                letterSpacing: '0.08em',
                padding: '4px 10px 4px 12px',
                border: '1px solid var(--gen-black)',
                color: 'var(--gen-text)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {l}
              <button
                onClick={() => removeLabel(l)}
                style={{ background: 'none', border: 'none', color: 'var(--gen-text-sub)', cursor: 'pointer', padding: 0, display: 'flex' }}
              >
                <IconClose size={10} />
              </button>
            </span>
          ))}
        </div>
        <div className="flex" style={{ border: '1px solid var(--gen-border)' }}>
          <input
            className="gen-input"
            style={{ border: 'none' }}
            value={labelInput}
            onChange={(e) => setLabelInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addLabel(); } }}
            placeholder="Add topic keyword, press Enter…"
          />
          <button onClick={addLabel} className="gen-btn gen-btn-primary" style={{ padding: '0 18px', fontSize: 10, border: 'none' }}>
            Add
          </button>
        </div>
        <p style={{ fontSize: 11, color: 'var(--gen-text-mute)', marginTop: 6 }}>
          Short keywords help the agent decide when to navigate here during Q&amp;A.
        </p>
      </Field>

      <Field label="Screen Content · Markdown · visible to audience">
        <textarea
          className="gen-input"
          rows={10}
          style={{ fontFamily: 'monospace' }}
          value={slide.content}
          onChange={(e) => onChange({ content: e.target.value })}
          placeholder="Rich text the audience can read. Markdown: ## headings, - bullets, **bold**…"
        />
        <p style={{ fontSize: 11, color: 'var(--gen-text-mute)', marginTop: 6, lineHeight: 1.5 }}>
          This shows on screen. Keep it as dense as needed — audience reads it themselves.
        </p>
      </Field>

      <Field label="Voice Script · what the agent says aloud">
        <textarea
          className="gen-input"
          rows={6}
          value={slide.speakerNotes}
          onChange={(e) => onChange({ speakerNotes: e.target.value })}
          placeholder="The essence of this slide, in 2–4 sentences. ~15 seconds spoken."
        />
        <p style={{ fontSize: 11, color: 'var(--gen-text-mute)', marginTop: 6, lineHeight: 1.5 }}>
          Agent narrates meaning, not the screen text. Brief &amp; conversational.<br />
          Target: <strong style={{ color: 'var(--gen-text-sub)' }}>60–120 Korean chars</strong> · <strong style={{ color: 'var(--gen-text-sub)' }}>≤15 s</strong>.
        </p>
      </Field>

      {/* Comment — author-only */}
      <Field label="Comment · private · author only">
        <textarea
          className="gen-input"
          rows={3}
          value={slide.comment ?? ''}
          onChange={(e) => onChange({ comment: e.target.value })}
          placeholder="Internal notes about this slide — not shown to audience or agent."
        />
      </Field>

      {/* Links */}
      <Field label="Links">
        <div className="space-y-2 mb-2">
          {(slide.links ?? []).map((l) => (
            <div
              key={l.url}
              className="flex items-center justify-between gap-2 px-3 py-2"
              style={{ border: '1px solid var(--gen-border)', background: 'var(--gen-white)' }}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <IconLink size={12} />
                <div className="min-w-0 flex-1">
                  {l.label && <div style={{ fontSize: 11, fontWeight: 400 }}>{l.label}</div>}
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noopener"
                    className="truncate block"
                    style={{ fontSize: 10, color: 'var(--gen-text-sub)', letterSpacing: '0.04em' }}
                  >
                    {l.url}
                  </a>
                </div>
              </div>
              <button
                onClick={() => onRemoveLink(l.url)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gen-text-sub)', display: 'flex' }}
              >
                <IconClose size={12} />
              </button>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <div className="flex" style={{ border: '1px solid var(--gen-border)' }}>
            <input
              className="gen-input"
              style={{ border: 'none', flex: 2 }}
              value={newLink}
              onChange={(e) => setNewLink(e.target.value)}
              placeholder="https://..."
            />
            <input
              className="gen-input"
              style={{ border: 'none', borderLeft: '1px solid var(--gen-border)', flex: 1 }}
              value={newLinkLabel}
              onChange={(e) => setNewLinkLabel(e.target.value)}
              placeholder="Label (optional)"
            />
            <button onClick={submitLink} className="gen-btn gen-btn-primary" style={{ padding: '0 18px', fontSize: 10, border: 'none' }}>
              Add
            </button>
          </div>
        </div>
      </Field>

      {/* Media attachments */}
      <Field label="Media · image / video">
        {(slide.media ?? []).length === 0 ? (
          <p style={{ fontSize: 11, color: 'var(--gen-text-mute)' }}>
            Upload an image or video in the right panel, then press <IconPlus size={10} className="inline align-middle" /> to attach.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2 mb-2">
            {(slide.media ?? []).map((m) => (
              <div
                key={m.url}
                className="relative group"
                style={{ border: '1px solid var(--gen-border)', background: 'var(--gen-white)', aspectRatio: '16 / 10', overflow: 'hidden' }}
              >
                {m.kind === 'image' ? (
                  <img src={m.url} alt={m.name || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000' }}>
                    <video src={m.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                    <div style={{ position: 'absolute', bottom: 6, left: 6, fontSize: 9, letterSpacing: '0.14em', color: '#fff', background: 'rgba(0,0,0,0.5)', padding: '2px 6px' }}>
                      VIDEO
                    </div>
                  </div>
                )}
                <button
                  onClick={() => onRemoveMedia(m.url)}
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    width: 22,
                    height: 22,
                    background: 'rgba(255,255,255,0.9)',
                    border: '1px solid var(--gen-border)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--gen-text)',
                    opacity: 0,
                    transition: 'opacity var(--gen-fast)',
                  }}
                  className="group-hover:opacity-100"
                  title="Remove"
                >
                  <IconClose size={11} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Field>

      {/* Files */}
      <Field label="Files · PDF / documents">
        {(slide.files ?? []).length === 0 ? (
          <p style={{ fontSize: 11, color: 'var(--gen-text-mute)' }}>
            Upload a PDF in the right panel, then press <IconPlus size={10} className="inline align-middle" /> on the asset card to attach.
          </p>
        ) : (
          <div className="space-y-2">
            {(slide.files ?? []).map((f) => (
              <div
                key={f.url}
                className="flex items-center justify-between gap-3 px-3 py-2"
                style={{ border: '1px solid var(--gen-border)', background: 'var(--gen-white)' }}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <IconPdf size={14} />
                  <div className="min-w-0 flex-1">
                    <div style={{ fontSize: 12, fontWeight: 400 }} className="truncate">{f.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--gen-text-mute)', letterSpacing: '0.08em' }}>
                      {f.kind.toUpperCase()}{f.size ? ` · ${(f.size / 1024).toFixed(0)} KB` : ''}
                    </div>
                  </div>
                </div>
                <a
                  href={f.url}
                  target="_blank"
                  rel="noopener"
                  style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gen-text-sub)', textDecoration: 'none' }}
                >
                  Open
                </a>
                <button
                  onClick={() => onRemoveFile(f.url)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gen-text-sub)', display: 'flex' }}
                >
                  <IconClose size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Field>

      <div className="flex gap-8 items-end">
        <Field label="Visual Type">
          <select
            className="gen-input"
            style={{ width: 200 }}
            value={slide.visualType}
            onChange={(e) => onChange({ visualType: e.target.value as Slide['visualType'] })}
          >
            <option value="title">Title</option>
            <option value="bullets">Bullets</option>
            <option value="table">Table</option>
            <option value="quote">Quote</option>
            <option value="image">Image</option>
          </select>
        </Field>
        <label className="flex items-center gap-2 cursor-pointer pb-3">
          <input
            type="checkbox"
            checked={slide.allowQA}
            onChange={(e) => onChange({ allowQA: e.target.checked })}
            style={{ width: 16, height: 16, accentColor: 'var(--gen-black)' }}
          />
          <span className="gen-label">Allow Q&amp;A</span>
        </label>
      </div>
    </div>
  );
}

function ModeBtn({
  active, onClick, label, subtitle, divider,
}: { active: boolean; onClick: () => void; label: string; subtitle: string; divider?: boolean }) {
  return (
    <button
      onClick={onClick}
      className="flex-1"
      style={{
        padding: '14px',
        background: active ? 'var(--gen-black)' : 'var(--gen-white)',
        color: active ? 'var(--gen-white)' : 'var(--gen-text)',
        border: 'none',
        borderLeft: divider ? '1px solid var(--gen-border)' : 'none',
        cursor: 'pointer',
        transition: 'all var(--gen-fast)',
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{ fontSize: 10, marginTop: 4, opacity: 0.7 }}>{subtitle}</div>
    </button>
  );
}

function Field({ label, children }: { label: string | React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="gen-label mb-2">{label}</div>
      {children}
    </div>
  );
}
