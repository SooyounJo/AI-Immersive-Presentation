import { useMemo, useState } from 'react';
import { useQaLog, type QaLogEntry } from '../hooks/useQaLog';
import { usePresentationStore } from '../stores/presentationStore';
import { IconClose, IconTrash, IconComment, IconPlus } from './icons';

/**
 * Insights — audience Q&A log.
 *
 * The system evolves here: every question audience asks gets logged.
 * The author can:
 *   1. Review questions per slide
 *   2. Mark resolved (acknowledges they've addressed the gap)
 *   3. "Promote to Knowledge" — appends the Q&A as a curated block
 *      into presentation.knowledge, so the agent is prepared next time.
 */
export function InsightsPanel() {
  const { entries, loading, patch, remove, clearAll } = useQaLog();
  const { presentation, updateMeta, goToSlide, setAppMode } = usePresentationStore();
  const [filter, setFilter] = useState<'all' | 'unresolved' | 'interrupts'>('all');
  const [slideFilter, setSlideFilter] = useState<number | 'all'>('all');

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (filter === 'unresolved' && e.resolved) return false;
      if (filter === 'interrupts' && !e.wasInterrupt) return false;
      if (slideFilter !== 'all' && e.slideIndex !== slideFilter) return false;
      return true;
    });
  }, [entries, filter, slideFilter]);

  // Count per slide for quick visual
  const perSlideCounts = useMemo(() => {
    const m = new Map<number, number>();
    entries.forEach((e) => m.set(e.slideIndex, (m.get(e.slideIndex) ?? 0) + 1));
    return m;
  }, [entries]);

  const promoteToKnowledge = (entry: QaLogEntry) => {
    if (!presentation) return;
    const slideLabel = `Slide ${entry.slideIndex + 1} · ${entry.slideTitle}`;
    const block = `\n\n### Prepared Q&A · ${slideLabel}\nQ. ${entry.question}\nA. ${entry.answer}\n`;
    const nextKnowledge = (presentation.knowledge || '').trimEnd() + block;
    updateMeta({ knowledge: nextKnowledge });
    patch(entry.id, { resolved: true, note: 'Promoted to Knowledge' });
  };

  const jumpToSlide = (idx: number) => {
    goToSlide(idx);
    setAppMode('present');
  };

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--gen-bg-soft)' }}>
      <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--gen-border)' }}>
        <div className="flex items-center justify-between mb-3">
          <span className="gen-label">Audience Insights</span>
          <span style={{ fontSize: 10, color: 'var(--gen-text-mute)', letterSpacing: '0.1em' }}>
            {String(entries.length).padStart(2, '0')} {loading ? '…' : ''}
          </span>
        </div>
        <p style={{ fontSize: 10, color: 'var(--gen-text-mute)', lineHeight: 1.55, marginBottom: 12 }}>
          Every audience question is logged. Promote good ones into Knowledge so the agent arrives prepared next time.
        </p>

        {/* Filters */}
        <div className="flex gap-1 mb-2" style={{ border: '1px solid var(--gen-border)' }}>
          <FilterBtn label="All" active={filter === 'all'} onClick={() => setFilter('all')} />
          <FilterBtn label="Unresolved" active={filter === 'unresolved'} onClick={() => setFilter('unresolved')} divider />
          <FilterBtn label="Interrupts" active={filter === 'interrupts'} onClick={() => setFilter('interrupts')} divider />
        </div>

        {/* Slide filter */}
        {perSlideCounts.size > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            <SlideChip active={slideFilter === 'all'} onClick={() => setSlideFilter('all')} label="Any slide" />
            {[...perSlideCounts.entries()].sort((a, b) => a[0] - b[0]).map(([idx, count]) => (
              <SlideChip
                key={idx}
                active={slideFilter === idx}
                onClick={() => setSlideFilter(idx)}
                label={`${String(idx + 1).padStart(2, '0')} · ${count}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--gen-text-mute)' }}>
            <div className="gen-label mb-2">Nothing logged</div>
            <div style={{ fontSize: 12, lineHeight: 1.7 }}>
              Questions audience asks<br />during presentation will appear here.
            </div>
          </div>
        )}
        {filtered.map((e) => (
          <EntryCard
            key={e.id}
            entry={e}
            onJump={() => jumpToSlide(e.slideIndex)}
            onPromote={() => promoteToKnowledge(e)}
            onToggleResolved={() => patch(e.id, { resolved: !e.resolved })}
            onDelete={() => remove(e.id)}
          />
        ))}
      </div>

      {entries.length > 0 && (
        <div className="p-3" style={{ borderTop: '1px solid var(--gen-border)' }}>
          <button
            onClick={() => { if (confirm('Delete ALL logged Q&A?')) clearAll(); }}
            className="gen-btn gen-btn-ghost w-full flex items-center justify-center gap-2"
            style={{ fontSize: 10, color: 'var(--gen-text-sub)' }}
          >
            <IconTrash size={12} />
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}

/* --------------------------------------------------------------- */

function FilterBtn({ label, active, onClick, divider }: { label: string; active: boolean; onClick: () => void; divider?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: '8px',
        fontSize: 9,
        fontWeight: 500,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        background: active ? 'var(--gen-black)' : 'var(--gen-white)',
        color: active ? 'var(--gen-white)' : 'var(--gen-text-sub)',
        border: 'none',
        borderLeft: divider ? '1px solid var(--gen-border)' : 'none',
        cursor: 'pointer',
        transition: 'all var(--gen-fast)',
      }}
    >
      {label}
    </button>
  );
}

function SlideChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '3px 8px',
        fontSize: 9,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        background: active ? 'var(--gen-black)' : 'transparent',
        color: active ? 'var(--gen-white)' : 'var(--gen-text-sub)',
        border: `1px solid ${active ? 'var(--gen-black)' : 'var(--gen-border)'}`,
        cursor: 'pointer',
        transition: 'all var(--gen-fast)',
      }}
    >
      {label}
    </button>
  );
}

function EntryCard({
  entry, onJump, onPromote, onToggleResolved, onDelete,
}: {
  entry: QaLogEntry;
  onJump: () => void;
  onPromote: () => void;
  onToggleResolved: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const ago = timeAgo(entry.timestamp);

  return (
    <div
      style={{
        background: 'var(--gen-white)',
        border: '1px solid var(--gen-border)',
        opacity: entry.resolved ? 0.55 : 1,
        transition: 'opacity var(--gen-fast)',
      }}
    >
      <div className="p-3">
        {/* Metadata row */}
        <div className="flex items-center gap-2 mb-2" style={{ fontSize: 9, letterSpacing: '0.1em', color: 'var(--gen-text-mute)', textTransform: 'uppercase' }}>
          <button
            onClick={onJump}
            style={{ background: 'none', border: '1px solid var(--gen-border)', padding: '2px 6px', cursor: 'pointer', color: 'var(--gen-text)' }}
            title="Jump to slide"
          >
            S{String(entry.slideIndex + 1).padStart(2, '0')}
          </button>
          {entry.wasInterrupt && (
            <span style={{ padding: '2px 6px', background: 'var(--gen-black)', color: 'var(--gen-white)' }}>
              Interrupt
            </span>
          )}
          {entry.resolved && (
            <span style={{ padding: '2px 6px', border: '1px solid var(--gen-border)' }}>
              ✓ Resolved
            </span>
          )}
          <span style={{ marginLeft: 'auto' }}>{ago}</span>
        </div>

        {/* Question */}
        <div style={{ fontSize: 11, color: 'var(--gen-text-mute)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
          Question
        </div>
        <div style={{ fontSize: 13, fontWeight: 400, lineHeight: 1.5, marginBottom: 10 }}>
          {entry.question}
        </div>

        {/* Answer (collapsible) */}
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            fontSize: 10,
            color: 'var(--gen-text-sub)',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          {expanded ? '− Hide answer' : '+ Show answer'}
        </button>

        {expanded && (
          <div
            style={{
              marginTop: 8,
              padding: 10,
              background: 'var(--gen-bg-soft)',
              border: '1px solid var(--gen-border)',
              fontSize: 12,
              lineHeight: 1.6,
              color: 'var(--gen-text-sub)',
              whiteSpace: 'pre-wrap',
              fontWeight: 300,
            }}
          >
            {entry.answer}
          </div>
        )}

        {entry.interruptSpokenText && expanded && (
          <div
            style={{
              marginTop: 8,
              padding: 8,
              borderLeft: '1px solid var(--gen-border)',
              fontSize: 10,
              color: 'var(--gen-text-mute)',
              fontStyle: 'italic',
              lineHeight: 1.5,
            }}
          >
            Agent was saying: "{entry.interruptSpokenText.slice(0, 160)}{entry.interruptSpokenText.length > 160 ? '…' : ''}"
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex" style={{ borderTop: '1px solid var(--gen-border)' }}>
        <button
          onClick={onPromote}
          className="flex-1 flex items-center justify-center gap-1.5"
          style={{
            padding: '9px',
            fontSize: 9,
            fontWeight: 500,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--gen-text)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            transition: 'all var(--gen-fast)',
          }}
          title="Append this Q&A to presentation Knowledge"
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--gen-bg-soft)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
        >
          <IconPlus size={11} />
          Promote
        </button>
        <button
          onClick={onToggleResolved}
          className="flex-1 flex items-center justify-center gap-1.5"
          style={{
            padding: '9px',
            fontSize: 9,
            fontWeight: 500,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--gen-text-sub)',
            background: 'none',
            border: 'none',
            borderLeft: '1px solid var(--gen-border)',
            cursor: 'pointer',
            transition: 'all var(--gen-fast)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--gen-bg-soft)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
        >
          <IconComment size={11} />
          {entry.resolved ? 'Reopen' : 'Resolve'}
        </button>
        <button
          onClick={() => { if (confirm('Delete this entry?')) onDelete(); }}
          style={{
            padding: '9px 14px',
            background: 'none',
            border: 'none',
            borderLeft: '1px solid var(--gen-border)',
            color: 'var(--gen-text-mute)',
            cursor: 'pointer',
          }}
          title="Delete"
        >
          <IconClose size={11} />
        </button>
      </div>
    </div>
  );
}

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}
