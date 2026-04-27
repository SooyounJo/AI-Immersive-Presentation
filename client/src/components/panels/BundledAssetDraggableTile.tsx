import { useRef, type DragEvent, type KeyboardEvent } from 'react';

/** Bundled static SVG: preview, click → attach slide, drag → file/URL for external apps (e.g. PowerPoint). */
export function BundledAssetDraggableTile({
  name,
  fileIndex,
  absoluteUrl,
  onAttach,
  lightUi = false,
}: {
  name: string;
  fileIndex: number;
  absoluteUrl: string;
  onAttach: () => void;
  lightUi?: boolean;
}) {
  const suppressClickRef = useRef(false);
  const dot = name.lastIndexOf('.');
  const ext = dot >= 0 ? name.slice(dot) : '';
  const stem = dot >= 0 ? name.slice(0, dot) : name;
  const shortLabel = stem.length > 11 ? `${stem.slice(0, 9)}…${ext}` : name;

  const onDragStart = (e: DragEvent<HTMLDivElement>) => {
    suppressClickRef.current = true;
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', absoluteUrl);
    e.dataTransfer.setData('text/uri-list', absoluteUrl);
    try {
      e.dataTransfer.setData('DownloadURL', `image/svg+xml:${name}:${absoluteUrl}`);
    } catch {
      /* some environments restrict custom data types */
    }
  };

  const onDragEnd = () => {
    window.setTimeout(() => {
      suppressClickRef.current = false;
    }, 0);
  };

  const onTileClick = () => {
    if (suppressClickRef.current) return;
    onAttach();
  };

  const onKeyDown = (ev: KeyboardEvent<HTMLDivElement>) => {
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      onAttach();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onTileClick}
      onKeyDown={onKeyDown}
      title={`${name} · #${String(fileIndex).padStart(2, '0')} — click to add to slide, drag to export`}
      className={lightUi ? 'gen-bundled-asset-tile gen-bundled-asset-tile--light' : 'gen-bundled-asset-tile'}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: 6,
        padding: 8,
        userSelect: 'none',
        borderRadius: 2,
        border: lightUi ? '1px solid #c5cdd8' : '1px solid rgba(255,255,255,0.1)',
        background: lightUi ? '#ffffff' : '#111318',
        cursor: 'grab',
      }}
    >
      <div
        style={{
          position: 'relative',
          height: 52,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: lightUi ? '#f4f6fa' : '#0c0d11',
          border: lightUi ? '1px solid #dce2eb' : '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <img
          src={absoluteUrl}
          alt=""
          draggable={false}
          style={{ maxWidth: '100%', maxHeight: 44, objectFit: 'contain' }}
        />
        <span
          style={{
            position: 'absolute',
            top: 4,
            right: 4,
            fontSize: 8,
            fontWeight: 600,
            letterSpacing: '0.06em',
            color: lightUi ? 'rgba(26,32,44,0.45)' : 'rgba(245,247,255,0.5)',
          }}
        >
          {String(fileIndex).padStart(2, '0')}
        </span>
      </div>
      <span
        style={{
          fontSize: 9,
          lineHeight: 1.25,
          textAlign: 'center',
          color: lightUi ? '#2d3748' : 'rgba(232,234,240,0.85)',
          wordBreak: 'break-word',
        }}
      >
        {shortLabel}
      </span>
    </div>
  );
}
