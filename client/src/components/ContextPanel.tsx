import { useState, useRef, useCallback, type DragEvent, type ChangeEvent, type KeyboardEvent, type MouseEvent, type CSSProperties } from 'react';
import { useAssets } from '../hooks/useAssets';
import { usePresentationStore } from '../stores/presentationStore';
import type { Asset, BackgroundPresetKind } from '../types';
import {
  IconImages, IconArrowDown, IconPlus, IconClose,
  IconChevronRight, IconChevronDown,
  IconTrash, IconLink, IconPdf, IconVideo,
} from './icons';

import { API_HOST } from '../api';
import { PRESET_CARDS } from '../data/slidePresets';
import { BackgroundPresetTile } from './BackgroundPresetTile';

type MediaTabId = 'preset' | 'visual' | 'asset';
type UiThemeMode = 'morning' | 'night';
type TextPanelTab = 'size' | 'fonts' | 'color';
type BgPaletteItem = { name: string; color: string; params: Record<string, number> };

/** Collapsed accordion row — same dimensions for Background / Gen Text / Text Style */
const PRESET_FOLD_HEADER_STYLE: CSSProperties = {
  padding: '8px 12px',
  minHeight: 44,
  width: '100%',
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const SECTION_CONTAINER_STYLE = (isNight: boolean): CSSProperties => ({
  border: '1px solid var(--gen-border)',
  background: isNight ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.65)',
  backdropFilter: 'blur(8px)',
  borderRadius: 4,
  overflow: 'hidden',
  transition: 'all var(--gen-fast)',
  width: '100%',
  boxSizing: 'border-box',
});

const BACKGROUND_PRESETS: Array<{
  kind: BackgroundPresetKind;
  label: string;
  params: Array<{ key: string; label: string; min: number; max: number; step: number }>;
  defaults: Record<string, number>;
}> = [
  {
    kind: 'iridescence',
    label: 'Iridescence',
    params: [
      { key: 'speed', label: 'Speed', min: 0, max: 2, step: 0.05 },
      { key: 'amplitude', label: 'Amplitude', min: 0, max: 0.6, step: 0.01 },
      { key: 'colorR', label: 'Red', min: 0, max: 1, step: 0.01 },
      { key: 'colorB', label: 'Blue', min: 0, max: 1, step: 0.01 },
    ],
    defaults: { speed: 1, amplitude: 0.1, colorR: 0.5, colorG: 0.6, colorB: 0.8 },
  },
  {
    kind: 'particles',
    label: 'Particles',
    params: [
      { key: 'particleCount', label: 'Count', min: 40, max: 400, step: 10 },
      { key: 'speed', label: 'Speed', min: 0.02, max: 0.8, step: 0.01 },
      { key: 'particleSpread', label: 'Spread', min: 3, max: 20, step: 0.5 },
      { key: 'particleBaseSize', label: 'Size', min: 20, max: 180, step: 5 },
    ],
    defaults: { particleCount: 180, speed: 0.12, particleSpread: 10, particleBaseSize: 90, colorR: 1, colorG: 1, colorB: 1 },
  },
  {
    kind: 'grainient',
    label: 'Grainient',
    params: [
      { key: 'timeSpeed', label: 'Speed', min: 0, max: 1, step: 0.01 },
      { key: 'warpFrequency', label: 'Warp Freq', min: 1, max: 10, step: 0.1 },
      { key: 'grainAmount', label: 'Grain', min: 0, max: 0.4, step: 0.01 },
      { key: 'contrast', label: 'Contrast', min: 0.5, max: 2.5, step: 0.05 },
    ],
    defaults: { timeSpeed: 0.62, warpFrequency: 6.8, warpSpeed: 2.8, grainAmount: 0.11, contrast: 1.25, saturation: 1, zoom: 0.9, colorR: 1, colorG: 1, colorB: 1 },
  },
  {
    kind: 'darkVeil',
    label: 'Dark Veil',
    params: [
      { key: 'speed', label: 'Speed', min: 0, max: 2, step: 0.05 },
      { key: 'warpAmount', label: 'Warp', min: 0, max: 2, step: 0.05 },
      { key: 'noiseIntensity', label: 'Noise', min: 0, max: 0.4, step: 0.01 },
      { key: 'hueShift', label: 'Hue', min: -180, max: 180, step: 1 },
    ],
    defaults: { speed: 0.7, warpAmount: 0.32, noiseIntensity: 0.02, hueShift: -8, scanlineIntensity: 0.05, scanlineFrequency: 1.45 },
  },
];

const BG_PALETTES: Partial<Record<BackgroundPresetKind, BgPaletteItem[]>> = {
  darkVeil: [
    { name: 'Steel Blue', color: '#4a78cf', params: { hueShift: -8, colorR: 0.95, colorG: 0.98, colorB: 1.1 } },
    { name: 'Cyan Blue', color: '#3ca4ff', params: { hueShift: 12, colorR: 0.85, colorG: 1.0, colorB: 1.15 } },
    { name: 'Graphite', color: '#5a6372', params: { hueShift: -35, colorR: 0.78, colorG: 0.82, colorB: 0.9 } },
    { name: 'Night Navy', color: '#253a6f', params: { hueShift: -20, colorR: 0.88, colorG: 0.9, colorB: 1.08 } },
  ],
  grainient: [
    { name: 'Blue Gray', color: '#7e93bf', params: { colorR: 0.78, colorG: 0.86, colorB: 1.02 } },
    { name: 'Cool Blue', color: '#6ea5ff', params: { colorR: 0.72, colorG: 0.88, colorB: 1.12 } },
    { name: 'Neutral Gray', color: '#8a8f9d', params: { colorR: 0.82, colorG: 0.82, colorB: 0.86 } },
    { name: 'Deep Navy', color: '#3e517f', params: { colorR: 0.68, colorG: 0.78, colorB: 1.02 } },
  ],
  particles: [
    { name: 'Pure White', color: '#ffffff', params: { colorR: 1, colorG: 1, colorB: 1 } },
    { name: 'Ice Blue', color: '#b8d7ff', params: { colorR: 0.72, colorG: 0.84, colorB: 1 } },
    { name: 'Soft Gray', color: '#b9bec7', params: { colorR: 0.73, colorG: 0.75, colorB: 0.78 } },
    { name: 'Sky Blue', color: '#6aa9ff', params: { colorR: 0.42, colorG: 0.66, colorB: 1 } },
  ],
  iridescence: [
    { name: 'Ocean', color: '#4d83e6', params: { colorR: 0.38, colorG: 0.52, colorB: 0.92 } },
    { name: 'Arctic', color: '#73bbff', params: { colorR: 0.46, colorG: 0.74, colorB: 1 } },
    { name: 'Indigo', color: '#5f67d9', params: { colorR: 0.42, colorG: 0.46, colorB: 0.86 } },
    { name: 'Slate', color: '#8792a5', params: { colorR: 0.58, colorG: 0.62, colorB: 0.72 } },
  ],
};

const MOTION_PRESETS: Array<{ id: string; label: string }> = [
  { id: 'none', label: 'None' },
  { id: 'vibrate', label: 'Vibration' },
  { id: 'bounce', label: 'Bounce' },
  { id: 'pulse', label: 'Pulse' },
  { id: 'float', label: 'Float' },
  { id: 'wave', label: 'Wave' },
  { id: 'swing', label: 'Swing' },
  { id: 'jello', label: 'Jello' },
  { id: 'wobble', label: 'Wobble' },
  { id: 'shakeX', label: 'Horizontal Shake' },
  { id: 'shakeY', label: 'Vertical Shake' },
  { id: 'flipX', label: 'Flip X' },
  { id: 'flipY', label: 'Flip Y' },
  { id: 'tilt', label: 'Tilt' },
  { id: 'zoomInOut', label: 'Zoom In/Out' },
  { id: 'breath', label: 'Breathing' },
  { id: 'flicker', label: 'Blinking' },
  { id: 'heartbeat', label: 'Heartbeat' },
  { id: 'rubberBand', label: 'Rubber Band' },
  { id: 'roll', label: 'Roll' },
];

export function ContextPanel({ themeMode = 'night' }: { themeMode?: UiThemeMode }) {
  const { assets, loading, error, uploadPdf, uploadImages, uploadVideo, addFigma, addUrl } = useAssets();
  const { presentation, currentSlideIndex, updateSlide, addSlide, addSlideMedia, addSlideLink } = usePresentationStore();

  const [isDragging, setIsDragging] = useState(false);
  const [figmaUrl, setFigmaUrl] = useState('');
  const [presetUrl, setPresetUrl] = useState('');
  const [mediaTab, setMediaTab] = useState<MediaTabId>('preset');
  const [assetSearch, setAssetSearch] = useState('');
  const [textPanelTab, setTextPanelTab] = useState<TextPanelTab>('size');
  const [isBgSectionOpen, setIsBgSectionOpen] = useState(false);
  const [isTextSectionOpen, setIsTextSectionOpen] = useState(false);
  const [isTextStyleSectionOpen, setIsTextStyleSectionOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [genTitle, setGenTitle] = useState('');
  const [genLabels, setGenLabels] = useState('');
  const [genContents, setGenContents] = useState('');

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

  const handleVideoInput = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    const created = await uploadVideo(file);
    if (mediaTab === 'visual') attachAssetToCurrentSlide(created);
    e.target.value = '';
  };

  const currentSlide = presentation?.slides[currentSlideIndex];
  const currentPreset = BACKGROUND_PRESETS.find((p) => p.kind === currentSlide?.background?.kind);

  const applyBackgroundPreset = (kind: BackgroundPresetKind) => {
    const slide = presentation?.slides[currentSlideIndex];
    if (!slide) return;
    const preset = BACKGROUND_PRESETS.find((p) => p.kind === kind);
    if (!preset) return;
    const filteredMedia = (slide.media ?? []).filter(
      (m) => !(
        m.kind === 'image'
        && (
          (m.name || '').toLowerCase().includes('reactbits background')
          || m.url.includes('reactbits.dev/backgrounds')
        )
      ),
    );
    updateSlide(currentSlideIndex, {
      background: { kind, params: preset.defaults },
      media: filteredMedia,
    });
  };

  const applySolidBackground = (mode: 'black' | 'white') => {
    if (!currentSlide) return;
    updateSlide(currentSlideIndex, {
      background: {
        kind: mode === 'black' ? 'solidBlack' : 'solidWhite',
        params: {},
      },
    });
  };

  const applyMyImageBackground = () => {
    if (!currentSlide) return;
    const latestImageAsset = [...assets]
      .reverse()
      .find((a) => a.type === 'image' && Boolean(a.fileUrl));
    if (!latestImageAsset?.fileUrl) return;
    const imageUrl = latestImageAsset.fileUrl.startsWith('http')
      ? latestImageAsset.fileUrl
      : `${API_HOST}${latestImageAsset.fileUrl}`;
    updateSlide(currentSlideIndex, {
      background: {
        kind: 'customImage',
        params: { imageUrl },
      },
    });
  };

  const updateBackgroundParam = (key: string, value: number) => {
    if (!currentSlide?.background) return;
    updateSlide(currentSlideIndex, {
      background: {
        ...currentSlide.background,
        params: {
          ...(currentSlide.background.params ?? {}),
          [key]: value,
        },
      },
    });
  };

  const applyBackgroundPalette = (patch: Record<string, number>) => {
    if (!currentSlide?.background) return;
    updateSlide(currentSlideIndex, {
      background: {
        ...currentSlide.background,
        params: {
          ...(currentSlide.background.params ?? {}),
          ...patch,
        },
      },
    });
  };

  const pickSmartPreset = (title: string, content: string, hasImageAsset: boolean) => {
    const plain = `${title} ${content}`.toLowerCase();
    if (hasImageAsset || /\b(image|photo|visual|gallery)\b/.test(plain)) {
      return PRESET_CARDS.find((p) => p.id === 'figma-15') ?? PRESET_CARDS[0];
    }
    const bulletCount = (content.match(/##\s/g) ?? []).length + (content.match(/-\s/g) ?? []).length;
    if (bulletCount >= 4) return PRESET_CARDS.find((p) => p.id === 'figma-8') ?? PRESET_CARDS[0];
    if (bulletCount >= 2) return PRESET_CARDS.find((p) => p.id === 'figma-7') ?? PRESET_CARDS[0];
    return PRESET_CARDS.find((p) => p.id === 'figma-3') ?? PRESET_CARDS[0];
  };

  const createSlideFromGenInputs = () => {
    const title = genTitle.trim();
    const contents = genContents.trim();
    const labels = genLabels
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
    if (!title && !contents && labels.length === 0) return;

    const hasImageAsset = assets.some((a) => a.type === 'image');
    const preset = pickSmartPreset(title, contents, hasImageAsset);
    const presetBody = (preset.content || '').replace(/^#\s[^\n]+/, '').trim();
    const mergedBody = contents || presetBody || '';
    const mergedTitle = title || preset.title;
    const content = `# ${mergedTitle}${mergedBody ? `\n\n${mergedBody}` : ''}`;

    addSlide({
      templateId: preset.id,
      title: mergedTitle,
      content,
      speakerNotes: preset.speakerNotes,
      visualType: preset.visualType,
      allowQA: true,
      sceneMode: 'slide',
      labels: labels.length ? labels : undefined,
      textStyle: currentSlide?.textStyle,
      background: currentSlide?.background,
    });
    setGenTitle('');
    setGenLabels('');
    setGenContents('');
  };

  const canApplyGenText = Boolean(
    genTitle.trim()
      || genContents.trim()
      || genLabels.split(',').some((x) => x.trim()),
  );

  const isNight = themeMode === 'night';
  const sizeOptions = [
    { label: '14px', scale: 0.72 },
    { label: '16px', scale: 0.82 },
    { label: '18px', scale: 0.92 },
    { label: '20px', scale: 1.0 },
  ];
  const fontOptions = ['Pretendard', 'Inter', 'Noto Sans KR', 'SUIT', 'IBM Plex Sans KR'];
  const fontWeightOptions: Array<{ label: 'Light' | 'Medium' | 'Bold'; value: 300 | 500 | 700 }> = [
    { label: 'Light', value: 300 },
    { label: 'Medium', value: 500 },
    { label: 'Bold', value: 700 },
  ];
  const hyundaiPalette = ['#FFFFFF', '#002C5F', '#005BAC', '#4A90E2', '#00AAD2', '#0B1F3A', '#111111', '#2D2D2D', '#6B7280', '#D9DDE3'];
  const bundledAssetFiles = [
    'hyundai-logo-primary.svg',
    'hyundai-logo-white.svg',
    'icon-home-outline.svg',
    'icon-home-filled.svg',
    'icon-arrow-left.svg',
    'icon-arrow-right.svg',
    'icon-voice-wave.svg',
    'icon-export.svg',
    'icon-edit-pencil.svg',
    'brand-symbol-h.svg',
  ].filter((name) => name.toLowerCase().includes(assetSearch.trim().toLowerCase()));

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

  const applyTextStylePatch = (patch: {
    sizeScale?: number;
    fontFamily?: string;
    fontWeight?: 300 | 500 | 700;
    color?: string;
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

  const submitPresetUrl = async () => {
    const url = presetUrl.trim();
    if (!url) return;
    if (url.includes('figma.com')) await addFigma(url);
    else await addUrl(url);
    setPresetUrl('');
  };

  return (
    <div
      className="p-4 pb-16 space-y-4"
      style={{
        overflowX: 'hidden',
        background: isNight ? 'rgba(12,16,24,0.82)' : '#f2f2f2',
        color: isNight ? '#f5f7ff' : '#171717',
        boxSizing: 'border-box',
        backdropFilter: isNight ? 'blur(12px)' : 'none',
        ['--gen-bg-soft' as any]: isNight ? 'rgba(16,17,20,0.82)' : '#ececec',
        ['--gen-white' as any]: isNight ? 'rgba(18,19,23,0.9)' : '#ffffff',
        ['--gen-text' as any]: isNight ? '#f5f7ff' : '#171717',
        ['--gen-text-sub' as any]: isNight ? '#c1c3c9' : '#4a4a4a',
        ['--gen-text-mute' as any]: isNight ? '#8a8d95' : '#707070',
        ['--gen-border' as any]: isNight ? 'rgba(255,255,255,0.14)' : '#d2d2d2',
        ['--gen-black' as any]: isNight ? '#0d111a' : '#111111',
        ['--gen-bg-gray' as any]: isNight ? 'rgba(35,36,42,0.58)' : '#e9e9e9',
        ['--gen-btn-active-bg' as any]: isNight ? '#2c2e34' : '#d9dde6',
        ['--gen-btn-active-text' as any]: isNight ? '#f5f7ff' : '#151b26',
        ['--gen-btn-muted-bg' as any]: isNight ? '#202227' : '#ebeff5',
        ['--gen-btn-muted-text' as any]: isNight ? '#f5f7ff' : '#1a1f2e',
        ['--gen-btn-solid-bg' as any]: isNight ? '#27292f' : '#c5cedd',
        ['--gen-btn-solid-text' as any]: isNight ? '#f5f7ff' : '#121826',
      }}
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
            <div style={SECTION_CONTAINER_STYLE(isNight)}>
              <div style={PRESET_FOLD_HEADER_STYLE}>
                <div className="gen-label" style={{ marginBottom: 0, opacity: 0.8 }}>Background</div>
                <button
                  type="button"
                  onClick={() => setIsBgSectionOpen((v) => !v)}
                  style={{ border: 'none', background: 'transparent', color: 'var(--gen-text-sub)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
                  title={isBgSectionOpen ? 'Collapse' : 'Expand'}
                >
                  {isBgSectionOpen ? <IconChevronDown size={12} /> : <IconChevronRight size={12} />}
                </button>
              </div>
              {isBgSectionOpen && (
              <div style={{ borderTop: '1px solid var(--gen-border)' }}>
              <div style={{ padding: 10, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 6 }}>
                {BACKGROUND_PRESETS.map((bg) => (
                  <BackgroundPresetTile
                    key={bg.kind}
                    kind={bg.kind}
                    label={bg.label}
                    lightUi={!isNight}
                    selected={currentSlide?.background?.kind === bg.kind}
                    onClick={() => applyBackgroundPreset(bg.kind)}
                  />
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 6, marginTop: 6 }}>
                <BackgroundPresetTile
                  kind="solidBlack"
                  label="Black (Default)"
                  lightUi={!isNight}
                  selected={currentSlide?.background?.kind === 'solidBlack'}
                  onClick={() => applySolidBackground('black')}
                />
                <BackgroundPresetTile
                  kind="solidWhite"
                  label="White (Default)"
                  lightUi={!isNight}
                  selected={currentSlide?.background?.kind === 'solidWhite'}
                  onClick={() => applySolidBackground('white')}
                />
                <BackgroundPresetTile
                  kind="customImage"
                  label="My Image"
                  lightUi={!isNight}
                  selected={currentSlide?.background?.kind === 'customImage'}
                  onClick={applyMyImageBackground}
                />
              </div>
              {currentPreset && (
                <div style={{ marginTop: 8, borderTop: '1px solid var(--gen-border)', paddingTop: 8, display: 'grid', gap: 6 }}>
                  {Boolean(BG_PALETTES[currentPreset.kind]?.length) && (
                    <div>
                      <div className="gen-label" style={{ marginBottom: 6 }}>Color Palette</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8, marginBottom: 6 }}>
                        {(BG_PALETTES[currentPreset.kind] ?? []).map((p) => (
                          <button
                            key={`${currentPreset.kind}-${p.name}`}
                            onClick={() => applyBackgroundPalette(p.params)}
                            style={{
                              height: 10,
                              border: 'none',
                              borderRadius: 1,
                              background: p.color,
                              cursor: 'pointer',
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: currentPreset.params.length === 4 ? 'repeat(2, minmax(0, 1fr))' : '1fr',
                      gap: 10,
                    }}
                  >
                    {currentPreset.params.map((p) => {
                      const value = Number(currentSlide?.background?.params?.[p.key] ?? currentPreset.defaults[p.key] ?? p.min);
                      const percent = ((value - p.min) / Math.max(0.0001, p.max - p.min)) * 100;
                      return (
                        <div key={p.key}>
                          <div className="gen-label" style={{ marginBottom: 3 }}>{p.label} · {value}</div>
                          <input
                            className="bg-param-slider"
                            type="range"
                            min={p.min}
                            max={p.max}
                            step={p.step}
                            value={value}
                            onChange={(e) => updateBackgroundParam(p.key, Number(e.target.value))}
                            style={{
                              width: '100%',
                              accentColor: '#5f9dff',
                              ['--slider-fill' as string]: `${percent}%`,
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              </div>
              )}
            </div>
            <div style={SECTION_CONTAINER_STYLE(isNight)}>
              <div style={PRESET_FOLD_HEADER_STYLE}>
                <div className="gen-label" style={{ marginBottom: 0, opacity: 0.8 }}>Gen Text</div>
                <button
                  type="button"
                  onClick={() => setIsTextSectionOpen((v) => !v)}
                  style={{ border: 'none', background: 'transparent', color: 'var(--gen-text-sub)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
                  title={isTextSectionOpen ? 'Collapse' : 'Expand'}
                >
                  {isTextSectionOpen ? <IconChevronDown size={12} /> : <IconChevronRight size={12} />}
                </button>
              </div>
              {isTextSectionOpen && (
                <div style={{ padding: 8, display: 'grid', gap: 6, borderTop: '1px solid var(--gen-border)' }}>
                  <div style={{ border: '1px solid var(--gen-border)' }}>
                    <input
                      value={genTitle}
                      onChange={(e) => setGenTitle(e.target.value)}
                      placeholder="Title"
                      style={{ width: '100%', border: 'none', padding: '8px 10px', fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div style={{ border: '1px solid var(--gen-border)' }}>
                    <input
                      value={genLabels}
                      onChange={(e) => setGenLabels(e.target.value)}
                      placeholder="Labels (comma-separated)"
                      style={{ width: '100%', border: 'none', padding: '8px 10px', fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div style={{ border: '1px solid var(--gen-border)' }}>
                    <input
                      value={genContents}
                      onChange={(e) => setGenContents(e.target.value)}
                      placeholder="Contents"
                      style={{ width: '100%', border: 'none', padding: '8px 10px', fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={createSlideFromGenInputs}
                    disabled={!canApplyGenText}
                    className="gen-go-btn"
                    style={{
                      height: 32,
                      border: 'none',
                      background: 'var(--gen-btn-solid-bg)',
                      color: 'var(--gen-btn-solid-text)',
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: '0.06em',
                      cursor: canApplyGenText ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: canApplyGenText ? 1 : 0.35,
                    }}
                    aria-label="Create slide from Gen Text"
                  >
                    GO
                  </button>
                </div>
              )}
            </div>

            <div style={SECTION_CONTAINER_STYLE(isNight)}>
              <div style={PRESET_FOLD_HEADER_STYLE}>
                <div className="gen-label" style={{ marginBottom: 0, opacity: 0.8 }}>Text Style</div>
                <button
                  type="button"
                  onClick={() => setIsTextStyleSectionOpen((v) => !v)}
                  style={{ border: 'none', background: 'transparent', color: 'var(--gen-text-sub)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
                  title={isTextStyleSectionOpen ? 'Collapse' : 'Expand'}
                >
                  {isTextStyleSectionOpen ? <IconChevronDown size={12} /> : <IconChevronRight size={12} />}
                </button>
              </div>
              {isTextStyleSectionOpen && (
              <div style={{ borderTop: '1px solid var(--gen-border)' }}>
              <div className="flex">
                <button
                  type="button"
                  onClick={() => setTextPanelTab('size')}
                  className="gen-subtle-hover"
                  style={{ flex: 1, height: 30, border: 'none', background: textPanelTab === 'size' ? 'var(--gen-btn-active-bg)' : 'var(--gen-btn-muted-bg)', color: textPanelTab === 'size' ? 'var(--gen-btn-active-text)' : 'var(--gen-btn-muted-text)', fontSize: 11, cursor: 'pointer' }}
                >
                  Size
                </button>
                <button
                  type="button"
                  onClick={() => setTextPanelTab('fonts')}
                  className="gen-subtle-hover"
                  style={{ flex: 1, height: 30, border: 'none', borderLeft: '1px solid var(--gen-border)', background: textPanelTab === 'fonts' ? 'var(--gen-btn-active-bg)' : 'var(--gen-btn-muted-bg)', color: textPanelTab === 'fonts' ? 'var(--gen-btn-active-text)' : 'var(--gen-btn-muted-text)', fontSize: 11, cursor: 'pointer' }}
                >
                  Fonts
                </button>
                <button
                  type="button"
                  onClick={() => setTextPanelTab('color')}
                  className="gen-subtle-hover"
                  style={{ flex: 1, height: 30, border: 'none', borderLeft: '1px solid var(--gen-border)', background: textPanelTab === 'color' ? 'var(--gen-btn-active-bg)' : 'var(--gen-btn-muted-bg)', color: textPanelTab === 'color' ? 'var(--gen-btn-active-text)' : 'var(--gen-btn-muted-text)', fontSize: 11, cursor: 'pointer' }}
                >
                  Color
                </button>
              </div>
              <div style={{ borderTop: '1px solid var(--gen-border)', padding: 8 }}>
                {textPanelTab === 'size' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 6 }}>
                    {sizeOptions.map((opt) => (
                      <button
                        type="button"
                        key={opt.label}
                        onClick={() => applyTextStylePatch({ sizeScale: opt.scale })}
                        className="gen-subtle-hover"
                        style={{
                          height: 26,
                          border: (currentSlide?.textStyle?.sizeScale ?? 1) === opt.scale ? '1px solid #5f9dff' : '1px solid var(--gen-border)',
                          background: 'var(--gen-btn-muted-bg)',
                          color: 'var(--gen-btn-muted-text)',
                          fontSize: 10,
                          cursor: 'pointer',
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
                {textPanelTab === 'fonts' && (
                  <div style={{ display: 'grid', gap: 6 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 6 }}>
                      {fontWeightOptions.map((weight) => (
                        <button
                          type="button"
                          key={weight.label}
                          onClick={() => applyTextStylePatch({ fontWeight: weight.value })}
                          className="gen-subtle-hover"
                          style={{
                            height: 26,
                            border: currentSlide?.textStyle?.fontWeight === weight.value ? '1px solid #5f9dff' : '1px solid var(--gen-border)',
                            background: 'var(--gen-btn-muted-bg)',
                            color: 'var(--gen-btn-muted-text)',
                            fontSize: 10,
                            fontWeight: weight.value,
                            cursor: 'pointer',
                          }}
                        >
                          {weight.label}
                        </button>
                      ))}
                    </div>
                    {fontOptions.map((font) => (
                      <button
                        type="button"
                        key={font}
                        onClick={() => applyTextStylePatch({ fontFamily: font })}
                        className="gen-subtle-hover"
                        style={{
                          height: 28,
                          border: currentSlide?.textStyle?.fontFamily === font ? '1px solid #5f9dff' : '1px solid var(--gen-border)',
                          background: 'var(--gen-btn-muted-bg)',
                          color: 'var(--gen-btn-muted-text)',
                          fontSize: 11,
                          fontWeight: currentSlide?.textStyle?.fontWeight ?? 500,
                          fontFamily: font,
                          cursor: 'pointer',
                          textAlign: 'left',
                          padding: '0 10px',
                        }}
                      >
                        {font}
                      </button>
                    ))}
                  </div>
                )}
                {textPanelTab === 'color' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 8 }}>
                    {hyundaiPalette.map((hex) => (
                      <button
                        type="button"
                        key={hex}
                        onClick={() => applyTextStylePatch({ color: hex })}
                        title={hex}
                        className="gen-subtle-hover"
                        style={{
                          height: 24,
                          border: currentSlide?.textStyle?.color === hex ? '2px solid #5f9dff' : '1px solid var(--gen-border)',
                          background: hex,
                          cursor: 'pointer',
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
              </div>
              )}
            </div>
            </>
            )}

            {mediaTab === 'visual' && (
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
                  onDrop={(e) => handleDrop(e, true)}
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
            )}

            {mediaTab === 'asset' && (
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
            )}

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

/** Bundled static SVG: preview, click → attach slide, drag → file/URL for external apps (e.g. PowerPoint). */
function BundledAssetDraggableTile({
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

  const onTileClick = (_e: MouseEvent<HTMLDivElement>) => {
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

function MiniTabBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        height: 24,
        border: active ? '1px solid #5f9dff' : '1px solid var(--gen-border)',
        borderLeft: label === 'Preset' ? (active ? '1px solid #5f9dff' : '1px solid var(--gen-border)') : undefined,
        background: active ? 'var(--gen-btn-active-bg)' : 'var(--gen-white)',
        color: active ? 'var(--gen-btn-active-text)' : 'var(--gen-text)',
        fontSize: label.length > 12 ? 9 : 10,
        fontWeight: active ? 600 : 500,
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
}

export function ImmersiveWebSet({
  onApplyPreset,
  onAddPreset,
}: {
  onApplyPreset: (url: string) => void;
  onAddPreset: (url: string) => Promise<void>;
}) {
  const items = [
    {
      name: 'Spline 3D Scene',
      url: 'https://spline.design/',
      description: 'Real-time 3D interaction and camera-move presets.',
    },
    {
      name: 'Rive Motion UI',
      url: 'https://rive.app/',
      description: 'UI micro-interactions and state-transition motion.',
    },
    {
      name: 'Three.js WebGL',
      url: 'https://threejs.org/examples/',
      description: 'WebGL immersive demos and effect references.',
    },
    {
      name: 'Lottie Motion Pack',
      url: 'https://lottiefiles.com/',
      description: 'Vector motion assets and icon animation.',
    },
    {
      name: 'GSAP Interaction',
      url: 'https://gsap.com/showcase/',
      description: 'Scroll- and timeline-driven advanced interactions.',
    },
  ];
  return (
    <div style={{ border: '1px solid var(--gen-border)', background: 'var(--gen-white)', padding: 12 }}>
      <div className="gen-label mb-2">Immersive Interaction Web Set</div>
      <div style={{ fontSize: 11, color: 'var(--gen-text-mute)', marginBottom: 10 }}>Apply presets here without leaving the app.</div>
      <div className="space-y-2">
        {items.map((it) => (
          <div
            key={it.url}
            style={{
              padding: '10px',
              border: '1px solid var(--gen-border)',
              background: 'var(--gen-white)',
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 3 }}>{it.name}</div>
            <div style={{ fontSize: 10, color: 'var(--gen-text-mute)', marginBottom: 8 }}>{it.description}</div>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => onApplyPreset(it.url)}
                className="gen-go-btn"
                style={{
                  flex: 1,
                  height: 26,
                  border: '1px solid var(--gen-border)',
                  background: '#1e2638',
                  color: '#f5f7ff',
                  fontSize: 10,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                Apply
              </button>
              <button
                type="button"
                onClick={() => onAddPreset(it.url)}
                className="gen-go-btn"
                style={{
                  flex: 1,
                  height: 26,
                  border: '1px solid var(--gen-black)',
                  background: 'var(--gen-black)',
                  color: 'var(--gen-white)',
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                aria-label="Add to assets"
              >
                GO
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LabeledInput({
  label, value, onChange, placeholder, onSubmit, disabled,
}: {
  label: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  onSubmit: () => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <div className="gen-label flex items-center gap-1.5 mb-2">{label}</div>
      <div className="flex" style={{ border: '1px solid var(--gen-border)' }}>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
          placeholder={placeholder}
          style={{
            flex: 1,
            padding: '14px 14px',
            border: 'none',
            fontSize: 13,
            fontFamily: 'var(--gen-font-body)',
            background: 'var(--gen-white)',
            outline: 'none',
          }}
        />
        <button
          type="button"
          onClick={onSubmit}
          disabled={!value.trim() || disabled}
          className="gen-go-btn"
          style={{
            padding: '0 18px',
            background: 'var(--gen-btn-solid-bg)',
            color: 'var(--gen-btn-solid-text)',
            border: 'none',
            borderLeft: '1px solid var(--gen-border)',
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.06em',
            cursor: 'pointer',
            opacity: !value.trim() || disabled ? 0.35 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label="Submit URL"
        >
          GO
        </button>
      </div>
    </div>
  );
}

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

