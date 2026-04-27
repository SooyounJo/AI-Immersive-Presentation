import { useState } from 'react';
import { usePresentationStore } from '../../stores/presentationStore';
import { IconChevronRight, IconChevronDown } from '../icons';
import { PRESET_FOLD_HEADER_STYLE, SECTION_CONTAINER_STYLE, sizeOptions, fontOptions, fontWeightOptions, hyundaiPalette } from './constants';

type TextPanelTab = 'size' | 'fonts' | 'color';

export function TextStyleSettings({ isNight }: { isNight: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [textPanelTab, setTextPanelTab] = useState<TextPanelTab>('size');

  const { presentation, currentSlideIndex, updateSlide } = usePresentationStore();
  const currentSlide = presentation?.slides[currentSlideIndex];

  const applyTextStylePatch = (patch: {
    sizeScale?: number;
    fontFamily?: string;
    fontWeight?: 300 | 500 | 700;
    color?: string;
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
    <div style={SECTION_CONTAINER_STYLE(isNight)}>
      <div style={PRESET_FOLD_HEADER_STYLE}>
        <div className="gen-label" style={{ marginBottom: 0, opacity: 0.8 }}>Text Style</div>
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
  );
}
