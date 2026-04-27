import { useState } from 'react';
import { usePresentationStore } from '../../stores/presentationStore';
import { BackgroundPresetTile } from '../BackgroundPresetTile';
import { IconChevronRight, IconChevronDown } from '../icons';
import { BACKGROUND_PRESETS, BG_PALETTES, PRESET_FOLD_HEADER_STYLE, SECTION_CONTAINER_STYLE } from './constants';
import type { BackgroundPresetKind } from '@shared/types';

export function BackgroundSettings({ isNight }: { isNight: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const { presentation, currentSlideIndex, updateSlide } = usePresentationStore();

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

  const applyCustomVideoBackground = () => {
    if (!currentSlide) return;
    updateSlide(currentSlideIndex, {
      background: {
        kind: 'customVideo',
        params: { url: '/vid.mp4' },
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

  return (
    <div style={SECTION_CONTAINER_STYLE(isNight)}>
      <div style={PRESET_FOLD_HEADER_STYLE}>
        <div className="gen-label" style={{ marginBottom: 0, opacity: 0.8 }}>Background</div>
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          style={{ border: 'none', background: 'transparent', color: 'var(--gen-text-sub)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
          title={isOpen ? 'Collapse' : 'Expand'}
        >
          {isOpen ? <IconChevronDown size={12} /> : <IconChevronRight size={12} />}
        </button>
      </div>
      {isOpen && (
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
              kind="customVideo"
              label="GALAXY"
              lightUi={!isNight}
              selected={currentSlide?.background?.kind === 'customVideo'}
              onClick={applyCustomVideoBackground}
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
  );
}
