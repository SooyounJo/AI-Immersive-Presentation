import { useState } from 'react';
import type { Asset } from '@shared/types';
import { usePresentationStore } from '../../stores/presentationStore';
import { API_HOST } from '../../api';
import { IconPlus, IconArrowDown, IconClose, IconTrash, IconLink } from '../icons';

export function AssetCard({ asset, onDelete }: { asset: Asset; onDelete: () => void }) {
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
