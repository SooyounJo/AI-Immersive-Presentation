import { useState, useRef, type DragEvent, type ChangeEvent } from 'react';
import { useAssets } from '../hooks/useAssets';
import { usePresentationStore } from '../stores/presentationStore';
import type { Asset, BackgroundPresetKind } from '../types';
import {
  IconImages, IconWeb, IconArrowDown, IconArrowRight, IconPlus, IconClose,
  IconTrash, IconLink, IconPdf, IconVideo, IconComment,
} from './icons';

import { API_HOST } from '../api';

type MediaTabId = 'image' | 'video' | 'library';

const BACKGROUND_PRESETS: Array<{
  kind: BackgroundPresetKind;
  label: string;
  params: Array<{ key: string; label: string; min: number; max: number; step: number }>;
  defaults: Record<string, number>;
}> = [
  {
    kind: 'darkVeil',
    label: 'Dark Veil',
    params: [
      { key: 'speed', label: 'Speed', min: 0, max: 2, step: 0.05 },
      { key: 'warpAmount', label: 'Warp', min: 0, max: 2, step: 0.05 },
      { key: 'noiseIntensity', label: 'Noise', min: 0, max: 0.4, step: 0.01 },
      { key: 'hueShift', label: 'Hue', min: -180, max: 180, step: 1 },
    ],
    defaults: { speed: 0.5, warpAmount: 0.2, noiseIntensity: 0.02, hueShift: 0, scanlineIntensity: 0.05, scanlineFrequency: 1.5 },
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
    defaults: { timeSpeed: 0.25, warpFrequency: 5, warpSpeed: 2, grainAmount: 0.1, contrast: 1.2, saturation: 1, zoom: 0.9 },
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
    defaults: { particleCount: 180, speed: 0.12, particleSpread: 10, particleBaseSize: 90 },
  },
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
];

export function ContextPanel() {
  const { assets, loading, error, uploadPdf, uploadImages, uploadVideo, addFigma, addUrl, addNote, deleteAsset } = useAssets();
  const { presentation, currentSlideIndex, updateSlide } = usePresentationStore();

  const [isDragging, setIsDragging] = useState(false);
  const [figmaUrl, setFigmaUrl] = useState('');
  const [webUrl, setWebUrl] = useState('');
  const [mediaTab, setMediaTab] = useState<MediaTabId>('image');
  const [videoPrompt, setVideoPrompt] = useState('');
  const [animationTarget, setAnimationTarget] = useState('');
  const [animationPrompt, setAnimationPrompt] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [genTitle, setGenTitle] = useState('');
  const [genLabels, setGenLabels] = useState('');
  const [genContents, setGenContents] = useState('');

  const handleFiles = async (files: FileList | File[]) => {
    const fileArr = Array.from(files);
    const pdfs = fileArr.filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
    const images = fileArr.filter(f => f.type.startsWith('image/'));
    const videos = fileArr.filter(f => f.type.startsWith('video/'));

    for (const pdf of pdfs) await uploadPdf(pdf);
    if (images.length) await uploadImages(images);
    for (const v of videos) await uploadVideo(v);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) {
      await handleFiles(e.dataTransfer.files);
    }
    const text = e.dataTransfer.getData('text/plain');
    if (text && text.startsWith('http')) {
      if (text.includes('figma.com')) await addFigma(text);
      else await addUrl(text);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleFileInput = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) await handleFiles(e.target.files);
    e.target.value = '';
  };

  const handleVideoInput = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    await uploadVideo(file);
    e.target.value = '';
  };

  const currentSlide = presentation?.slides[currentSlideIndex];
  const currentPreset = BACKGROUND_PRESETS.find((p) => p.kind === currentSlide?.background?.kind);

  const applyBackgroundPreset = (kind: BackgroundPresetKind) => {
    const slide = presentation?.slides[currentSlideIndex];
    if (!slide) return;
    const preset = BACKGROUND_PRESETS.find((p) => p.kind === kind);
    if (!preset) return;
    updateSlide(currentSlideIndex, { background: { kind, params: preset.defaults } });
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

  const applyGenTitle = () => {
    if (!genTitle.trim()) return;
    updateSlide(currentSlideIndex, { title: genTitle.trim() });
    setGenTitle('');
  };

  const applyGenLabels = () => {
    const labels = genLabels
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
    if (!labels.length) return;
    updateSlide(currentSlideIndex, { labels });
    setGenLabels('');
  };

  const applyGenContents = () => {
    if (!genContents.trim()) return;
    updateSlide(currentSlideIndex, { content: genContents.trim() });
    setGenContents('');
  };

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--gen-bg-soft)' }}>

      {/* Content */}
      <div className="flex-1 min-h-0">
          <div className="p-4 space-y-4 h-full overflow-y-auto">
            <div className="flex gap-0" style={{ border: '1px solid var(--gen-border)' }}>
              <MiniTabBtn label="Image" active={mediaTab === 'image'} onClick={() => setMediaTab('image')} />
              <MiniTabBtn label="Video" active={mediaTab === 'video'} onClick={() => setMediaTab('video')} />
              <MiniTabBtn label="Library" active={mediaTab === 'library'} onClick={() => setMediaTab('library')} />
            </div>

            {mediaTab === 'library' && (
              <ImmersiveWebSet
                onApplyPreset={(url) => {
                  setWebUrl(url);
                  setMediaTab('image');
                }}
                onAddPreset={async (url) => {
                  await addUrl(url);
                }}
              />
            )}

            {mediaTab === 'image' && (
              <>
            {/* Drop zone */}
            <div
              onDrop={handleDrop}
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
                <IconVideo size={22} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 300, letterSpacing: '-0.01em', marginBottom: 2 }}>
                {isDragging ? 'Release to Upload' : 'Drag files here'}
              </div>
              <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.65 }}>
                Image · PDF · Video
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,image/*,video/*"
                onChange={handleFileInput}
                className="hidden"
              />
            </div>

              </>
            )}

            {mediaTab === 'video' && (
              <div className="space-y-3">
                <div className="gen-label">Gen Video</div>
                <LabeledInput
                  label={<><IconImages size={12} /> Figma URL</>}
                  value={figmaUrl}
                  onChange={setFigmaUrl}
                  placeholder="Figma URL"
                  disabled={loading}
                  onSubmit={() => { if (figmaUrl.trim()) { addFigma(figmaUrl.trim()); setFigmaUrl(''); } }}
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
                    <IconComment size={14} />
                  </div>
                  <div style={{ fontSize: 16, lineHeight: 1.2, marginBottom: 4 }}>Drag files here</div>
                  <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.65 }}>
                    Video / GIF
                  </div>
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*,.gif"
                    onChange={handleVideoInput}
                    className="hidden"
                  />
                </div>

                <div>
                  <div className="gen-label mb-2">Prompt</div>
                  <div className="flex" style={{ border: '1px solid var(--gen-border)' }}>
                    <textarea
                      rows={2}
                      value={videoPrompt}
                      onChange={(e) => setVideoPrompt(e.target.value)}
                      placeholder="Prompt"
                      style={{
                        flex: 1,
                        border: 'none',
                        padding: '10px 12px',
                        fontSize: 12,
                        resize: 'none',
                        outline: 'none',
                        background: 'var(--gen-white)',
                      }}
                    />
                    <button style={{ width: 52, border: 'none', borderLeft: '1px solid var(--gen-border)', background: '#d9d9d9', fontSize: 10, cursor: 'pointer' }}>
                      Gen Vid
                    </button>
                  </div>
                </div>

                <div>
                  <div className="gen-label mb-2">Gen Animation</div>
                  <div className="flex" style={{ border: '1px solid var(--gen-border)', marginBottom: 6 }}>
                    <input
                      value={animationTarget}
                      onChange={(e) => setAnimationTarget(e.target.value)}
                      placeholder="애니메이션 넣을 요소 클릭하여 선택"
                      style={{ flex: 1, border: 'none', padding: '10px 12px', fontSize: 11, outline: 'none', background: 'var(--gen-white)' }}
                    />
                    <button style={{ width: 52, border: 'none', borderLeft: '1px solid var(--gen-border)', background: '#d9d9d9', fontSize: 10, cursor: 'pointer' }}>
                      선택
                    </button>
                  </div>
                  <div className="flex" style={{ border: '1px solid var(--gen-border)' }}>
                    <textarea
                      rows={2}
                      value={animationPrompt}
                      onChange={(e) => setAnimationPrompt(e.target.value)}
                      placeholder="애니메이션 프롬프트"
                      style={{
                        flex: 1,
                        border: 'none',
                        padding: '10px 12px',
                        fontSize: 11,
                        resize: 'none',
                        outline: 'none',
                        background: 'var(--gen-white)',
                      }}
                    />
                    <button style={{ width: 52, border: 'none', borderLeft: '1px solid var(--gen-border)', background: '#d9d9d9', fontSize: 10, cursor: 'pointer' }}>
                      Go
                    </button>
                  </div>
                </div>

                <div className="flex" style={{ border: '1px solid var(--gen-border)' }}>
                  <button style={{ flex: 1, height: 30, border: 'none', background: '#d9d9d9', fontSize: 10, cursor: 'pointer' }}>모션 강도</button>
                  <button style={{ flex: 1, height: 30, border: 'none', borderLeft: '1px solid var(--gen-border)', background: '#d9d9d9', fontSize: 10, cursor: 'pointer' }}>모션 라이브러리</button>
                </div>

                <div style={{ borderTop: '1px solid var(--gen-border)', paddingTop: 8 }}>
                  <div className="gen-label mb-2">Preview</div>
                  <div style={{ border: '1px solid var(--gen-border)', background: 'var(--gen-white)', padding: 6 }}>
                    {assets.filter((a) => a.type === 'video').length > 0 ? (
                      <div>
                        <video
                          src={`${API_HOST}${assets.filter((a) => a.type === 'video')[0].fileUrl}`}
                          style={{ width: '100%', height: 95, objectFit: 'cover', background: '#000' }}
                          muted
                        />
                        <div className="flex justify-end mt-1">
                          <button style={{ height: 22, padding: '0 10px', border: '1px solid #c8c8c8', background: '#f2f2f2', fontSize: 10, cursor: 'pointer' }}>Use IT</button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ height: 105, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--gen-text-mute)' }}>
                        No video yet
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Figma URL */}
            {mediaTab === 'image' && (
            <>
            <LabeledInput
              label={<><IconImages size={12} /> Figma URL</>}
              value={figmaUrl}
              onChange={setFigmaUrl}
              placeholder="figma.com/design/..."
              disabled={loading}
              onSubmit={() => { if (figmaUrl.trim()) { addFigma(figmaUrl.trim()); setFigmaUrl(''); } }}
            />

            {/* Web URL */}
            <LabeledInput
              label={<><IconWeb size={12} /> Web URL</>}
              value={webUrl}
              onChange={setWebUrl}
              placeholder="https://..."
              disabled={loading}
              onSubmit={() => { if (webUrl.trim()) { addUrl(webUrl.trim()); setWebUrl(''); } }}
            />
            <div style={{ border: '1px solid var(--gen-border)', background: 'var(--gen-white)', padding: 10 }}>
              <div className="gen-label mb-2">Background Selection</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 6 }}>
                {BACKGROUND_PRESETS.map((bg) => (
                  <button
                    key={bg.kind}
                    onClick={() => applyBackgroundPreset(bg.kind)}
                    style={{
                      height: 26,
                      border: '1px solid var(--gen-border)',
                      background: currentSlide?.background?.kind === bg.kind ? '#d9d9d9' : '#f8f8f8',
                      fontSize: 10,
                      cursor: 'pointer',
                    }}
                    title={bg.kind}
                  >
                    {bg.label}
                  </button>
                ))}
              </div>
              {currentPreset && (
                <div style={{ marginTop: 8, borderTop: '1px solid var(--gen-border)', paddingTop: 8, display: 'grid', gap: 6 }}>
                  {currentPreset.params.map((p) => {
                    const value = Number(currentSlide?.background?.params?.[p.key] ?? currentPreset.defaults[p.key] ?? p.min);
                    return (
                      <div key={p.key}>
                        <div className="gen-label" style={{ marginBottom: 3 }}>{p.label} · {value}</div>
                        <input
                          type="range"
                          min={p.min}
                          max={p.max}
                          step={p.step}
                          value={value}
                          onChange={(e) => updateBackgroundParam(p.key, Number(e.target.value))}
                          style={{ width: '100%' }}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div style={{ border: '1px solid var(--gen-border)', background: 'var(--gen-white)' }}>
              <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--gen-border)', fontSize: 13, color: '#555' }}>
                Gen Text
              </div>
              <div style={{ padding: 8, display: 'grid', gap: 6 }}>
                <div className="flex" style={{ border: '1px solid var(--gen-border)' }}>
                  <input
                    value={genTitle}
                    onChange={(e) => setGenTitle(e.target.value)}
                    placeholder="Title"
                    style={{ flex: 1, border: 'none', padding: '8px 10px', fontSize: 12, outline: 'none' }}
                  />
                  <button
                    onClick={applyGenTitle}
                    style={{ width: 50, border: 'none', borderLeft: '1px solid var(--gen-border)', background: '#d3d3d3', fontSize: 10, cursor: 'pointer' }}
                  >
                    ADD
                  </button>
                </div>
                <div className="flex" style={{ border: '1px solid var(--gen-border)' }}>
                  <input
                    value={genLabels}
                    onChange={(e) => setGenLabels(e.target.value)}
                    placeholder="Labels"
                    style={{ flex: 1, border: 'none', padding: '8px 10px', fontSize: 12, outline: 'none' }}
                  />
                  <button
                    onClick={applyGenLabels}
                    style={{ width: 50, border: 'none', borderLeft: '1px solid var(--gen-border)', background: '#d3d3d3', fontSize: 10, cursor: 'pointer' }}
                  >
                    ADD
                  </button>
                </div>
                <div className="flex" style={{ border: '1px solid var(--gen-border)' }}>
                  <input
                    value={genContents}
                    onChange={(e) => setGenContents(e.target.value)}
                    placeholder="Contents"
                    style={{ flex: 1, border: 'none', padding: '8px 10px', fontSize: 12, outline: 'none' }}
                  />
                  <button
                    onClick={applyGenContents}
                    style={{ width: 50, border: 'none', borderLeft: '1px solid var(--gen-border)', background: '#d3d3d3', fontSize: 10, cursor: 'pointer' }}
                  >
                    ADD
                  </button>
                </div>
              </div>
              <div className="flex" style={{ borderTop: '1px solid var(--gen-border)' }}>
                <button style={{ flex: 1, height: 30, border: 'none', background: '#d6d6d6', fontSize: 11, cursor: 'pointer' }}>Size</button>
                <button style={{ flex: 1, height: 30, border: 'none', borderLeft: '1px solid var(--gen-border)', background: '#f2f2f2', fontSize: 11, cursor: 'pointer' }}>Fonts</button>
                <button style={{ flex: 1, height: 30, border: 'none', borderLeft: '1px solid var(--gen-border)', background: '#d6d6d6', fontSize: 11, cursor: 'pointer' }}>Color</button>
              </div>
            </div>
            </>
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
      </div>
    </div>
  );
}

function MiniTabBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        height: 24,
        border: 'none',
        borderLeft: label === 'Image' ? 'none' : '1px solid var(--gen-border)',
        background: active ? 'rgba(137,137,137,0.86)' : 'var(--gen-white)',
        color: active ? 'var(--gen-white)' : 'var(--gen-text-sub)',
        fontSize: 10,
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
}

function ImmersiveWebSet({
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
      description: '실시간 3D 인터랙션/카메라 무브용 프리셋',
    },
    {
      name: 'Rive Motion UI',
      url: 'https://rive.app/',
      description: 'UI 마이크로 인터랙션/상태 전환 애니메이션',
    },
    {
      name: 'Three.js WebGL',
      url: 'https://threejs.org/examples/',
      description: 'WebGL 기반 몰입형 데모/효과 레퍼런스',
    },
    {
      name: 'Lottie Motion Pack',
      url: 'https://lottiefiles.com/',
      description: '벡터 모션 에셋/아이콘 애니메이션',
    },
    {
      name: 'GSAP Interaction',
      url: 'https://gsap.com/showcase/',
      description: '스크롤/타임라인 기반 고급 인터랙션',
    },
  ];
  return (
    <div style={{ border: '1px solid var(--gen-border)', background: 'var(--gen-white)', padding: 12 }}>
      <div className="gen-label mb-2">Immersive Interaction Web Set</div>
      <div style={{ fontSize: 11, color: 'var(--gen-text-mute)', marginBottom: 10 }}>사이트 이동 없이 프리셋을 바로 적용할 수 있습니다.</div>
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
                onClick={() => onApplyPreset(it.url)}
                style={{
                  flex: 1,
                  height: 26,
                  border: '1px solid var(--gen-border)',
                  background: '#f5f5f5',
                  fontSize: 10,
                  cursor: 'pointer',
                }}
              >
                Apply
              </button>
              <button
                onClick={() => onAddPreset(it.url)}
                style={{
                  flex: 1,
                  height: 26,
                  border: '1px solid var(--gen-black)',
                  background: 'var(--gen-black)',
                  color: 'var(--gen-white)',
                  fontSize: 10,
                  cursor: 'pointer',
                }}
              >
                Add to Assets
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
          onClick={onSubmit}
          disabled={!value.trim() || disabled}
          style={{
            padding: '0 18px',
            background: 'var(--gen-black)',
            color: 'var(--gen-white)',
            border: 'none',
            fontSize: 10,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            opacity: !value.trim() || disabled ? 0.35 : 1,
          }}
        >
          Add
        </button>
      </div>
    </div>
  );
}

function AssetCard({ asset, onDelete }: { asset: Asset; onDelete: () => void }) {
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

// Suppress unused imports from icon list used conditionally above
void IconArrowRight;
