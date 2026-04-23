import ReactMarkdown from 'react-markdown';
import { usePresentationStore } from '../stores/presentationStore';
import { IconLink, IconPdf, IconPlay } from './icons';
function IconMenu(props: any) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="3" y1="7" x2="21" y2="7" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="17" x2="21" y2="17" />
    </svg>
  );
}
import { SlideBackgroundLayer } from './backgrounds/OglBackgrounds';
import { SlideAnnotationsOverlay } from './SlideAnnotationsOverlay';

/**
 * Multi-layer composition order (back to front):
 *   1. Background (white / ambient gradient behind)
 *   2. Procedural background layer (darkVeil, grainient, etc.)
 *   3. Full-bleed media layer (image or video) — only when visualType === 'image'
 *   4. Readability scrim — subtle gradient so text remains legible on media
 *   5. Content layer — template text blocks OR slide number, media grid, markdown body
 *   6. Chip layer — links, files, video on-demand
 *   7. Signature / indicator overlays
 */
export function SlideView({
  onToggleChrome,
  onReplayVoice,
  hasReplayVoice = false,
  isReplayVoicePlaying = false,
}: {
  onToggleChrome?: () => void;
  onReplayVoice?: () => void;
  hasReplayVoice?: boolean;
  isReplayVoicePlaying?: boolean;
}) {
  const { presentation, currentSlideIndex, uiThemeMode } = usePresentationStore();
  const isNight = uiThemeMode === 'night';
  const slide = presentation?.slides[currentSlideIndex];

  if (!slide) {
    return (
      <div className="flex items-center justify-center h-full" style={{ color: 'var(--gen-text-mute)' }}>
        <span className="gen-label">Loading</span>
      </div>
    );
  }

  const backgroundKind = slide.background?.kind;
  const hasProceduralBackground = backgroundKind === 'darkVeil'
    || backgroundKind === 'grainient'
    || backgroundKind === 'particles'
    || backgroundKind === 'iridescence';

  const firstMedia = slide.media?.[0];
  const isFullBleed = slide.visualType === 'image' && (firstMedia?.kind === 'image' || firstMedia?.kind === 'video');
  const inlineMedia = isFullBleed ? (slide.media?.slice(1) ?? []) : (slide.media ?? []);
  const onDemandVideo = slide.media?.find((m) => m.kind === 'video' && m !== firstMedia);

  const isDarkBg = backgroundKind === 'darkVeil'
    || backgroundKind === 'particles'
    || backgroundKind === 'iridescence'
    || backgroundKind === 'solidBlack'
    || (backgroundKind === 'customImage');
  const textColor = isDarkBg ? '#f5f7ff' : '#111111';
  const textShadow = isDarkBg ? '0 1px 2px rgba(0,0,0,0.45)' : '0 1px 2px rgba(255,255,255,0.4)';

  const hasTemplateBlocks = (slide.templateTextBlocks ?? []).length > 0;

  return (
    <div className="relative h-full w-full overflow-hidden" style={{ background: isDarkBg ? '#000' : '#fff' }}>
      {/* Hamburger menu (Image 1 style) */}
      <button
        type="button"
        onClick={() => onToggleChrome?.()}
        aria-label="Toggle presentation chrome"
        style={{
          position: 'absolute',
          top: 18,
          left: 18,
          zIndex: 10,
          color: textColor,
          opacity: 0.4,
          background: 'transparent',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
        }}
      >
        <IconMenu size={22} />
      </button>

      {hasReplayVoice && (
        <button
          type="button"
          onClick={() => onReplayVoice?.()}
          aria-label={isReplayVoicePlaying ? 'Replay voice' : 'Replay voice'}
          title="Replay voice"
          style={{
            position: 'absolute',
            top: 18,
            right: 18,
            zIndex: 10,
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: textColor,
            background: isDarkBg ? 'rgba(0,0,0,0.28)' : 'rgba(255,255,255,0.4)',
            border: `1px solid ${isDarkBg ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.08)'}`,
            borderRadius: '50%',
            cursor: 'pointer',
            backdropFilter: 'blur(8px)',
          }}
        >
          <IconPlay size={16} style={{ opacity: isReplayVoicePlaying ? 0.7 : 1 }} />
        </button>
      )}

      {/* LAYER 2 — procedural background */}
      {hasProceduralBackground && (
        <div className="absolute inset-0 z-0">
          <SlideBackgroundLayer kind={slide.background?.kind} params={slide.background?.params} />
        </div>
      )}

      {/* LAYER 3 — full-bleed media */}
      {isFullBleed && firstMedia && (
        <div key={firstMedia.url} className="absolute inset-0 gen-fade z-1">
          {firstMedia.kind === 'image' ? (
            <div
              className="w-full h-full"
              style={{
                backgroundImage: `url(${firstMedia.url})`,
                backgroundSize: 'contain',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundColor: isNight ? '#050608' : 'var(--gen-white)',
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

      {/* LAYER 4 — readability scrim (only when full-bleed media is present) */}
      {isFullBleed && (
        <div
          className="absolute inset-0 pointer-events-none z-2"
          style={{
            background: isNight
              ? 'linear-gradient(180deg, rgba(7,8,11,0.9) 0%, rgba(7,8,11,0.5) 28%, rgba(7,8,11,0) 55%, rgba(7,8,11,0) 100%)'
              : 'linear-gradient(180deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.55) 28%, rgba(255,255,255,0) 55%, rgba(255,255,255,0) 100%)',
          }}
        />
      )}

      {/* LAYER 5 — content */}
      <div
        key={slide.id}
        className="relative h-full w-full gen-reveal z-3"
      >
        {hasTemplateBlocks ? (
          <div className="absolute inset-0 overflow-hidden">
            {slide.templateTextBlocks?.map((block) => (
              <div
                key={block.id}
                style={{
                  position: 'absolute',
                  left: `${block.x}%`,
                  top: `${block.y}%`,
                  maxWidth: `${block.maxWidth ?? 40}%`,
                  fontSize: `${block.fontSize}px`,
                  fontWeight: block.fontWeight ?? 400,
                  color: textColor,
                  lineHeight: 1.35,
                  textShadow,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  zIndex: block.zIndex ?? 0,
                }}
              >
                {block.text}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-start justify-center h-full px-20 py-16">
            {/* Slide number badge */}
            <div
              className="gen-label gen-line mb-12"
              style={{
                paddingBottom: '10px',
                borderBottom: isNight ? '1px solid rgba(245,247,255,0.35)' : '1px solid var(--gen-black)',
                width: 64,
              }}
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
          </div>
        )}

        {/* LAYER 6 — chips: links + files + on-demand video (common to both template and normal slides) */}
        {(slide.links?.length || slide.files?.length || onDemandVideo) && (
          <div className="absolute bottom-16 left-20 right-20 flex flex-wrap gap-2 pointer-events-auto">
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
                  border: '1px solid var(--gen-border)',
                  color: textColor,
                  background: isNight ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.6)',
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
                  border: '1px solid var(--gen-border)',
                  color: textColor,
                  background: isNight ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.6)',
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

      {/* LAYER 7 — signature overlays */}
      <div className="absolute bottom-8 left-20 flex gap-3 z-4">
        {presentation?.slides.map((_, i) => (
          <div
            key={i}
            style={{
              width: i === currentSlideIndex ? 32 : 16,
              height: 1,
              background: i === currentSlideIndex
                ? (isNight ? '#f5f7ff' : 'var(--gen-black)')
                : 'var(--gen-border)',
              transition: 'all var(--gen-base)',
            }}
          />
        ))}
      </div>

      {/* LAYER 8 — annotations overlay */}
      <SlideAnnotationsOverlay />

      {/* Chip hover style injected once */}
      <style>{`
        .chip-hover:hover { background: var(--gen-chip-hover-bg) !important; color: var(--gen-chip-hover-fg) !important; }
      `}</style>
    </div>
  );
}

function VideoChip({ url, name }: { url: string; name?: string }) {
  const isNight = usePresentationStore((s) => s.uiThemeMode === 'night');
  return (
    <details>
      <summary
        style={{
          listStyle: 'none',
          cursor: 'pointer',
          padding: '6px 12px',
          border: '1px solid var(--gen-border)',
          background: isNight ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.6)',
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
