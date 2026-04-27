import { useState, useRef, type DragEvent, type ChangeEvent, type CSSProperties } from 'react';
import { useAssets } from '../hooks/useAssets';
import { usePresentationStore } from '../stores/presentationStore';
import type { Asset } from '@shared/types';
import { IconImages, IconPdf } from './icons';
import { API_HOST } from '../api';

import { MiniTabBtn } from './panels/MiniTabBtn';
import { LabeledInput } from './panels/LabeledInput';
import { BackgroundSettings } from './panels/BackgroundSettings';
import { GenTextSettings } from './panels/GenTextSettings';
import { TextStyleSettings } from './panels/TextStyleSettings';
import { VisualMediaSettings } from './panels/VisualMediaSettings';
import { AssetManager } from './panels/AssetManager';

type MediaTabId = 'preset' | 'visual' | 'asset';
type UiThemeMode = 'morning' | 'night';

export function ContextPanel({ themeMode = 'night' }: { themeMode?: UiThemeMode }) {
  const { loading, error, uploadPdf, uploadImages, uploadVideo, addFigma, addUrl } = useAssets();
  const { presentation, currentSlideIndex, addSlideMedia, addSlideLink } = usePresentationStore();

  const [isDragging, setIsDragging] = useState(false);
  const [presetUrl, setPresetUrl] = useState('');
  const [mediaTab, setMediaTab] = useState<MediaTabId>('preset');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const toAbsoluteAssetUrl = (fileUrl: string) => fileUrl.startsWith('http') ? fileUrl : `${API_HOST}${fileUrl}`;

  const currentSlide = presentation?.slides[currentSlideIndex];

  const attachAssetToCurrentSlide = (asset: Asset | null) => {
    if (!asset || !currentSlide) return;
    if ((asset.type === 'image' || asset.type === 'video') && asset.fileUrl) {
      addSlideMedia(currentSlideIndex, {
        url: toAbsoluteAssetUrl(asset.fileUrl),
        kind: asset.type,
        name: asset.name,
      });
      return;
    }
    if ((asset.type === 'figma' || asset.type === 'url') && asset.url) {
      addSlideLink(currentSlideIndex, {
        url: asset.url,
        label: asset.name,
      });
    }
  };

  const handleFiles = async (files: FileList | File[], attachToSlide = false) => {
    const fileArr = Array.from(files);
    const pdfs = fileArr.filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
    const images = fileArr.filter(f => f.type.startsWith('image/'));
    const videos = fileArr.filter(f => f.type.startsWith('video/'));

    for (const pdf of pdfs) await uploadPdf(pdf);
    const createdImages = images.length ? await uploadImages(images) : [];
    const createdVideos: Asset[] = [];
    for (const v of videos) {
      const created = await uploadVideo(v);
      if (created) createdVideos.push(created);
    }
    if (attachToSlide) {
      createdImages.forEach((asset) => attachAssetToCurrentSlide(asset));
      createdVideos.forEach((asset) => attachAssetToCurrentSlide(asset));
    }
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>, attachToSlide = false) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) {
      await handleFiles(e.dataTransfer.files, attachToSlide);
    }
    const text = e.dataTransfer.getData('text/plain');
    if (text && text.startsWith('http')) {
      if (text.includes('figma.com')) {
        const created = await addFigma(text);
        if (attachToSlide) attachAssetToCurrentSlide(created);
      } else {
        const created = await addUrl(text);
        if (attachToSlide) attachAssetToCurrentSlide(created);
      }
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleFileInput = async (e: ChangeEvent<HTMLInputElement>, attachToSlide = false) => {
    if (e.target.files) await handleFiles(e.target.files, attachToSlide);
    e.target.value = '';
  };

  const submitPresetUrl = async () => {
    const url = presetUrl.trim();
    if (!url) return;
    if (url.includes('figma.com')) await addFigma(url);
    else await addUrl(url);
    setPresetUrl('');
  };

  const isNight = themeMode === 'night';

  return (
    <div
      className="p-4 pb-16 space-y-4"
      style={{
        overflowX: 'hidden',
        background: isNight ? 'rgba(12,16,24,0.82)' : '#f2f2f2',
        color: isNight ? '#f5f7ff' : '#171717',
        boxSizing: 'border-box',
        backdropFilter: isNight ? 'blur(12px)' : 'none',
        '--gen-bg-soft': isNight ? 'rgba(16,17,20,0.82)' : '#ececec',
        '--gen-white': isNight ? 'rgba(18,19,23,0.9)' : '#ffffff',
        '--gen-text': isNight ? '#f5f7ff' : '#171717',
        '--gen-text-sub': isNight ? '#c1c3c9' : '#4a4a4a',
        '--gen-text-mute': isNight ? '#8a8d95' : '#707070',
        '--gen-border': isNight ? 'rgba(255,255,255,0.14)' : '#d2d2d2',
        '--gen-black': isNight ? '#0d111a' : '#111111',
        '--gen-bg-gray': isNight ? 'rgba(35,36,42,0.58)' : '#e9e9e9',
        '--gen-btn-active-bg': isNight ? '#2c2e34' : '#d9dde6',
        '--gen-btn-active-text': isNight ? '#f5f7ff' : '#151b26',
        '--gen-btn-muted-bg': isNight ? '#202227' : '#ebeff5',
        '--gen-btn-muted-text': isNight ? '#f5f7ff' : '#1a1f2e',
        '--gen-btn-solid-bg': isNight ? '#27292f' : '#c5cedd',
        '--gen-btn-solid-text': isNight ? '#f5f7ff' : '#121826',
      } as CSSProperties}
    >
      <div className="flex gap-0" style={{ border: '1px solid var(--gen-border)' }}>
        <MiniTabBtn label="Preset" active={mediaTab === 'preset'} onClick={() => setMediaTab('preset')} />
        <MiniTabBtn label="Motion & Img" active={mediaTab === 'visual'} onClick={() => setMediaTab('visual')} />
        <MiniTabBtn label="Asset" active={mediaTab === 'asset'} onClick={() => setMediaTab('asset')} />
      </div>

      {mediaTab === 'preset' && (
        <>
          {/* PDF/Image/Video Drop zone */}
          <div
            onDrop={(e) => handleDrop(e, false)}
            onDragOver={handleDragOver}
            onDragLeave={() => setIsDragging(false)}
            onClick={() => fileInputRef.current?.click()}
            className="cursor-pointer"
            style={{
              padding: '22px 12px',
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
            </div>
            <div style={{ fontSize: 16, fontWeight: 300, letterSpacing: '-0.01em', marginBottom: 2 }}>
              {isDragging ? 'Release to Upload' : 'Drag files here'}
            </div>
            <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.65 }}>
              Image · PDF
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,image/*,video/*"
              onChange={(e) => handleFileInput(e, false)}
              className="hidden"
            />
          </div>

          <LabeledInput
            label="URL"
            value={presetUrl}
            onChange={setPresetUrl}
            placeholder="figma.com/... or https://..."
            disabled={loading}
            onSubmit={submitPresetUrl}
          />

          <BackgroundSettings isNight={isNight} />
          <GenTextSettings isNight={isNight} />
          <TextStyleSettings isNight={isNight} />
        </>
      )}

      {mediaTab === 'visual' && <VisualMediaSettings />}
      {mediaTab === 'asset' && <AssetManager isNight={isNight} />}

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
  );
}
