import { useState, useRef, type DragEvent, type ChangeEvent } from 'react';
import { usePresentationStore } from '../../stores/presentationStore';
import { useAssets } from '../../hooks/useAssets';
import { IconImages, IconVideo } from '../icons';
import { LabeledInput } from './LabeledInput';
import { MOTION_PRESETS } from './constants';
import type { Asset } from '@shared/types';
import { API_HOST } from '../../api';

export function VisualMediaSettings() {
  const [figmaUrl, setFigmaUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const { loading, uploadVideo, addFigma } = useAssets();
  const { presentation, currentSlideIndex, updateSlide, addSlideMedia, addSlideLink } = usePresentationStore();
  const currentSlide = presentation?.slides[currentSlideIndex];

  const toAbsoluteAssetUrl = (fileUrl: string) => fileUrl.startsWith('http') ? fileUrl : `${API_HOST}${fileUrl}`;

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

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) {
      const fileArr = Array.from(e.dataTransfer.files);
      const videos = fileArr.filter(f => f.type.startsWith('video/'));
      for (const v of videos) {
        const created = await uploadVideo(v);
        attachAssetToCurrentSlide(created);
      }
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleVideoInput = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    const created = await uploadVideo(file);
    attachAssetToCurrentSlide(created);
    e.target.value = '';
  };

  const applyTextStylePatch = (patch: {
    motionPreset?: string;
    motionIntensity?: number;
    motionSpeed?: number;
  }) => {
    if (!currentSlide) return;
    updateSlide(currentSlideIndex, {
      textStyle: {
        ...(currentSlide.textStyle ?? {}),
        ...patch,
      },
    });
  };

  return (
    <div className="space-y-3">
      <div className="gen-label">Visual Upload & Motion</div>
      <LabeledInput
        label={<><IconImages size={12} /> Figma URL</>}
        value={figmaUrl}
        onChange={setFigmaUrl}
        placeholder="Figma URL"
        disabled={loading}
        onSubmit={async () => {
          const url = figmaUrl.trim();
          if (!url) return;
          const created = await addFigma(url);
          attachAssetToCurrentSlide(created);
          setFigmaUrl('');
        }}
      />

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => videoInputRef.current?.click()}
        className="cursor-pointer"
        style={{
          padding: '22px 12px',
          background: isDragging ? 'var(--gen-black)' : 'var(--gen-white)',
          color: isDragging ? 'var(--gen-white)' : 'var(--gen-text)',
          border: `1px dashed ${isDragging ? 'var(--gen-black)' : 'var(--gen-border)'}`,
          textAlign: 'center',
        }}
      >
        <div className="flex justify-center mb-2" style={{ gap: 10 }}>
          <IconVideo size={14} />
          <IconImages size={14} />
        </div>
        <div style={{ fontSize: 16, lineHeight: 1.2, marginBottom: 4 }}>Drag files here</div>
        <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.65 }}>
          Image / Video / GIF
        </div>
        <input
          ref={videoInputRef}
          type="file"
          accept="image/*,video/*,.gif"
          onChange={handleVideoInput}
          className="hidden"
        />
      </div>

      <div>
        <div className="gen-label mb-2">Gen Animation</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 6, marginBottom: 8 }}>
          {MOTION_PRESETS.map((motion) => (
            <button
              key={motion.id}
              onClick={() => applyTextStylePatch({ motionPreset: motion.id })}
              style={{
                height: 26,
                border: currentSlide?.textStyle?.motionPreset === motion.id ? '1px solid #5f9dff' : '1px solid var(--gen-border)',
                background: 'var(--gen-btn-muted-bg)',
                color: 'var(--gen-btn-muted-text)',
                fontSize: 10,
                cursor: 'pointer',
              }}
            >
              {motion.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'grid', gap: 8 }}>
          <div>
            <div className="gen-label" style={{ marginBottom: 3 }}>
              Motion Intensity · {Number(currentSlide?.textStyle?.motionIntensity ?? 1).toFixed(2)}
            </div>
            <input
              className="bg-param-slider"
              type="range"
              min={0.4}
              max={2}
              step={0.05}
              value={currentSlide?.textStyle?.motionIntensity ?? 1}
              onChange={(e) => applyTextStylePatch({ motionIntensity: Number(e.target.value) })}
              style={{
                width: '100%',
                accentColor: '#5f9dff',
                ['--slider-fill' as string]: `${((Number(currentSlide?.textStyle?.motionIntensity ?? 1) - 0.4) / 1.6) * 100}%`,
              }}
            />
          </div>
          <div>
            <div className="gen-label" style={{ marginBottom: 3 }}>
              Motion Speed · {Number(currentSlide?.textStyle?.motionSpeed ?? 1).toFixed(2)}
            </div>
            <input
              className="bg-param-slider"
              type="range"
              min={0.5}
              max={2}
              step={0.05}
              value={currentSlide?.textStyle?.motionSpeed ?? 1}
              onChange={(e) => applyTextStylePatch({ motionSpeed: Number(e.target.value) })}
              style={{
                width: '100%',
                accentColor: '#5f9dff',
                ['--slider-fill' as string]: `${((Number(currentSlide?.textStyle?.motionSpeed ?? 1) - 0.5) / 1.5) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
