import ReactMarkdown from 'react-markdown';
import { usePresentationStore } from '../stores/presentationStore';
import { IconLink, IconPdf } from './icons';
import { SlideAgentPresence } from './SlideAgentPresence';

/**
 * Multi-layer composition order (back to front):
 *   1. Background (white / ambient gradient behind)
 *   2. Full-bleed media layer (image or video) — only when visualType === 'image'
 *   3. Readability scrim — subtle white gradient so text remains legible on media
 *   4. Content layer — slide number, inline media grid, markdown body
 *   5. Chip layer — links, files, video on-demand
 *   6. Signature / indicator overlays
 */
export function SlideView() {
  const { presentation, currentSlideIndex } = usePresentationStore();
  const slide = presentation?.slides[currentSlideIndex];

  if (!slide) {
    return (
      <div className="flex items-center justify-center h-full" style={{ color: 'var(--gen-text-mute)' }}>
        <span className="gen-label">Loading</span>
      </div>
    );
  }

  const firstMedia = slide.media?.[0];
  const isFullBleed = slide.visualType === 'image' && (firstMedia?.kind === 'image' || firstMedia?.kind === 'video');
  const inlineMedia = isFullBleed ? (slide.media?.slice(1) ?? []) : (slide.media ?? []);
  const onDemandVideo = slide.media?.find((m) => m.kind === 'video' && m !== firstMedia);

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* LAYER 2 — full-bleed media */}
      {isFullBleed && firstMedia && (
        <div key={firstMedia.url} className="absolute inset-0 gen-fade">
          {firstMedia.kind === 'image' ? (
            <div
              className="w-full h-full"
              style={{
                backgroundImage: `url(${firstMedia.url})`,
                backgroundSize: 'contain',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundColor: 'var(--gen-white)',
              }}
              aria-label={firstMedia.name}
            />
          ) : (
            <video
              src={firstMedia.url}
              autoPlay
              muted
              loop
              playsInline
              style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }}
            />
          )}
        </div>
      )}

      {/* LAYER 3 — readability scrim (only when full-bleed media is present) */}
      {isFullBleed && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.55) 28%, rgba(255,255,255,0) 55%, rgba(255,255,255,0) 100%)',
          }}
        />
      )}

      {/* LAYER 4 — content */}
      <div
        key={slide.id}
        className="relative flex flex-col items-start justify-center h-full px-20 py-16 gen-reveal"
      >
        {/* Slide number badge */}
        <div
          className="gen-label gen-line mb-12"
          style={{ paddingBottom: '10px', borderBottom: '1px solid var(--gen-black)', width: 64 }}
        >
          {String(currentSlideIndex + 1).padStart(2, '0')} / {String(presentation?.slides.length || 0).padStart(2, '0')}
        </div>

        {/* Inline media grid (non full-bleed media) */}
        {inlineMedia.length > 0 && (
          <div
            className="max-w-5xl w-full mb-10 grid gap-3"
            style={{ gridTemplateColumns: `repeat(${Math.min(inlineMedia.length, 3)}, minmax(0, 1fr))` }}
          >
            {inlineMedia.slice(0, 6).map((m) =>
              m.kind === 'image' ? (
                <img
                  key={m.url}
                  src={m.url}
                  alt={m.name || ''}
                  style={{ width: '100%', border: '1px solid var(--gen-border)', background: 'var(--gen-white)' }}
                />
              ) : (
                <video
                  key={m.url}
                  src={m.url}
                  controls
                  style={{ width: '100%', border: '1px solid var(--gen-border)', background: '#000' }}
                />
              ),
            )}
          </div>
        )}

        {/* Markdown body */}
        {slide.content && (
          <div className="max-w-5xl w-full gen-prose">
            <ReactMarkdown>{slide.content}</ReactMarkdown>
          </div>
        )}

        {/* LAYER 5 — chips: links + files + on-demand video */}
        {(slide.links?.length || slide.files?.length || onDemandVideo) && (
          <div className="flex flex-wrap gap-2 mt-8">
            {slide.links?.map((l) => (
              <a
                key={l.url}
                href={l.url}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-1.5 chip-hover"
                style={{
                  padding: '6px 12px',
                  fontSize: 11,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  border: '1px solid var(--gen-black)',
                  color: 'var(--gen-text)',
                  background: 'rgba(255,255,255,0.6)',
                  textDecoration: 'none',
                  transition: 'all var(--gen-fast)',
                }}
              >
                <IconLink size={12} />
                {l.label || safeHost(l.url)}
              </a>
            ))}
            {slide.files?.map((f) => (
              <a
                key={f.url}
                href={f.url}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-1.5 chip-hover"
                style={{
                  padding: '6px 12px',
                  fontSize: 11,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  border: '1px solid var(--gen-black)',
                  color: 'var(--gen-text)',
                  background: 'rgba(255,255,255,0.6)',
                  textDecoration: 'none',
                  transition: 'all var(--gen-fast)',
                }}
                title={f.name}
              >
                <IconPdf size={12} />
                {truncate(f.name, 28)}
              </a>
            ))}
            {onDemandVideo && (
              <VideoChip url={onDemandVideo.url} name={onDemandVideo.name} />
            )}
          </div>
        )}
      </div>

      {/* LAYER 6 — signature overlays */}
      <div className="absolute bottom-8 left-20 flex gap-3">
        {presentation?.slides.map((_, i) => (
          <div
            key={i}
            style={{
              width: i === currentSlideIndex ? 32 : 16,
              height: 1,
              background: i === currentSlideIndex ? 'var(--gen-black)' : 'var(--gen-border)',
              transition: 'all var(--gen-base)',
            }}
          />
        ))}
      </div>

      {/* Agent presence — the voice of the presentation */}
      <SlideAgentPresence />

      {/* Chip hover style injected once */}
      <style>{`
        .chip-hover:hover { background: var(--gen-black) !important; color: var(--gen-white) !important; }
      `}</style>
    </div>
  );
}

function VideoChip({ url, name }: { url: string; name?: string }) {
  return (
    <details>
      <summary
        style={{
          listStyle: 'none',
          cursor: 'pointer',
          padding: '6px 12px',
          border: '1px solid var(--gen-black)',
          background: 'rgba(255,255,255,0.6)',
          fontSize: 11,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        ▶ Play video {name ? `· ${truncate(name, 24)}` : ''}
      </summary>
      <video
        src={url}
        controls
        style={{
          position: 'fixed',
          inset: '10vh 10vw',
          width: '80vw',
          height: '80vh',
          zIndex: 50,
          background: '#000',
          border: '1px solid var(--gen-border)',
        }}
      />
    </details>
  );
}

function safeHost(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}
