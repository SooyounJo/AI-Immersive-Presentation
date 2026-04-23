import { useState } from 'react';
import type { Slide, SlideLink, SlideMedia } from '../../types';
import { IconTrash, IconLink, IconPdf, IconPlus, IconClose } from '../icons';

export function SectionBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
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

export function MetaEditor({
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

export function SlideEditor({
  slide,
  index,
  onChange,
  onDelete,
  onAddLink,
  onRemoveLink,
  onAddMedia: _onAddMedia,
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
          <button type="button" onClick={addLabel} className="gen-btn gen-btn-primary" style={{ padding: '0 18px', fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            GO
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
            <button type="button" onClick={submitLink} className="gen-btn gen-btn-primary" style={{ padding: '0 18px', fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              GO
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

export function ModeBtn({
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

export function Field({ label, children }: { label: string | React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="gen-label mb-2">{label}</div>
      {children}
    </div>
  );
}
