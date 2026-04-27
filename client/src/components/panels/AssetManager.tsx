import { useState, useCallback } from 'react';
import { usePresentationStore } from '../../stores/presentationStore';
import { BundledAssetDraggableTile } from './BundledAssetDraggableTile';
import { ALL_BUNDLED_ASSET_FILES } from './constants';

export function AssetManager({ isNight }: { isNight: boolean }) {
  const [assetSearch, setAssetSearch] = useState('');
  const { presentation, currentSlideIndex, addSlideMedia } = usePresentationStore();

  const bundledAssetFiles = ALL_BUNDLED_ASSET_FILES.filter((name) =>
    name.toLowerCase().includes(assetSearch.trim().toLowerCase())
  );

  const bundledAssetPublicUrl = useCallback((name: string) => {
    const path = `/bundled/${encodeURIComponent(name)}`;
    return new URL(path, window.location.origin).href;
  }, []);

  const attachBundledAssetToSlide = useCallback((name: string) => {
    if (!presentation?.slides?.length) return;
    const url = bundledAssetPublicUrl(name);
    addSlideMedia(currentSlideIndex, {
      url,
      kind: 'image',
      name,
    });
  }, [addSlideMedia, bundledAssetPublicUrl, currentSlideIndex, presentation?.slides?.length]);

  return (
    <div style={{ border: '1px solid var(--gen-border)', background: 'var(--gen-white)', padding: 12 }}>
      <div className="gen-label mb-2">Bundled Asset Files</div>
      <div className="flex mb-2" style={{ border: '1px solid var(--gen-border)' }}>
        <input
          value={assetSearch}
          onChange={(e) => setAssetSearch(e.target.value)}
          placeholder="Search asset files..."
          style={{ flex: 1, border: 'none', padding: '10px 12px', fontSize: 12, outline: 'none', background: 'var(--gen-white)', color: 'var(--gen-text)' }}
        />
      </div>
      <div
        style={{
          maxHeight: 360,
          overflowY: 'auto',
          padding: 12,
          border: '1px solid var(--gen-border)',
          background: isNight ? '#07080c' : '#eef1f6',
        }}
      >
        {bundledAssetFiles.length === 0 ? (
          <div style={{ padding: '10px', fontSize: 11, color: 'var(--gen-text-mute)', textAlign: 'center' }}>
            No matching files.
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(76px, 1fr))',
              gap: 10,
              alignItems: 'start',
              justifyItems: 'stretch',
            }}
          >
            {bundledAssetFiles.map((name, idx) => (
              <BundledAssetDraggableTile
                key={name}
                name={name}
                fileIndex={idx + 1}
                lightUi={!isNight}
                absoluteUrl={bundledAssetPublicUrl(name)}
                onAttach={() => attachBundledAssetToSlide(name)}
              />
            ))}
          </div>
        )}
      </div>
      <div style={{ fontSize: 10, color: 'var(--gen-text-mute)', marginTop: 8, lineHeight: 1.45 }}>
        Click to add to the current slide. Drag into PowerPoint or another app (Chrome/Edge: drops as SVG file when the app accepts file drag).
      </div>
    </div>
  );
}
