import { useMemo } from 'react';
import { createPortal } from 'react-dom';
import type { Slide } from '@shared/types';
import { PRESET_CARDS, type PresetCard } from '../../data/slidePresets';
import { renderSpecialTemplate } from './templates/renderSpecialTemplate';

interface TemplatePickerModalProps {
  onSelect: (preset: PresetCard) => void;
  onClose: () => void;
  isNight: boolean;
}

export function TemplatePickerModal({ onSelect, onClose, isNight }: TemplatePickerModalProps) {
  const uiSurface = isNight ? 'rgba(22,24,31,0.98)' : '#ffffff';
  const uiBorder = isNight ? 'rgba(255,255,255,0.14)' : '#d2d2d2';
  const textColor = isNight ? '#f5f7ff' : '#171717';
  const subTextColor = isNight ? '#a7a9af' : '#666666';
  const cardSurface = isNight ? 'rgba(255,255,255,0.04)' : '#f8f8f8';
  const sectionLabelColor = isNight ? '#9ea6bb' : '#6b7280';

  const buildPreviewSlide = (preset: PresetCard): Slide => {
    const body = (preset.content || '').replace(/^#\s[^\n]+/, '').trim();
    return {
      id: -1,
      templateId: preset.id,
      title: preset.title,
      content: `# ${preset.title}${body ? `\n\n${body}` : ''}`,
      speakerNotes: preset.speakerNotes,
      visualType: preset.visualType,
      allowQA: true,
      sceneMode: 'slide',
    };
  };

  const cards = useMemo(() => (
    PRESET_CARDS.map((preset) => {
      const previewSlide = buildPreviewSlide(preset);
      const preview = renderSpecialTemplate(
        previewSlide,
        '#f5f7ff',
        'rgba(245,247,255,0.88)',
        '0 1px 2px rgba(0,0,0,0.45)',
      );
      return (
        <button
          key={preset.id}
          onClick={() => onSelect(preset)}
          style={{
            background: cardSurface,
            border: `1px solid ${uiBorder}`,
            borderRadius: 0,
            padding: 10,
            textAlign: 'left',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#5f9dff';
            e.currentTarget.style.background = isNight ? 'rgba(95,157,255,0.1)' : '#eef4ff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = uiBorder;
            e.currentTarget.style.background = cardSurface;
          }}
        >
          <div
            style={{
              width: '100%',
              aspectRatio: '16 / 9',
              overflow: 'hidden',
              border: `1px solid ${isNight ? 'rgba(255,255,255,0.12)' : '#cfd6e3'}`,
              background: '#000000',
              position: 'relative',
            }}
          >
            {preview ? (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  transform: 'scale(0.2)',
                  transformOrigin: 'center center',
                }}
              >
                {preview}
              </div>
            ) : (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  color: '#111827',
                  background: '#000000',
                }}
              >
                <div
                  style={{
                    width: '500%',
                    height: '500%',
                    transform: 'scale(0.2)',
                    transformOrigin: 'top left',
                    background: 'linear-gradient(160deg, #f4f6fb 0%, #edf2fb 100%)',
                    padding: 48,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                  }}
                >
                  <div style={{ marginTop: 8, fontSize: 72, fontWeight: 700, lineHeight: 1.15 }}>
                    {preset.title}
                  </div>
                  <div style={{ marginTop: 16, fontSize: 44, opacity: 0.8 }}>
                    {preset.subtitle}
                  </div>
                </div>
              </div>
            )}
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1, color: textColor }}>
            {preset.title}
          </div>
          <div
            style={{
              fontSize: 12,
              color: subTextColor,
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {preset.subtitle || preset.speakerNotes || '템플릿입니다.'}
          </div>
        </button>
      );
    })
  ), [cardSurface, isNight, onSelect, subTextColor, textColor, uiBorder]);

  const modal = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: uiSurface,
          border: `1px solid ${uiBorder}`,
          borderRadius: 12,
          width: '100%',
          maxWidth: 960,
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: '20px 24px',
            borderBottom: `1px solid ${uiBorder}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2 style={{ margin: 0, fontSize: 36, fontWeight: 600, letterSpacing: '-0.02em', color: textColor }}>
            슬라이드 템플릿 선택
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: subTextColor,
              cursor: 'pointer',
              fontSize: 24,
              lineHeight: 1,
              padding: 4,
            }}
          >
            &times;
          </button>
        </div>
        <div style={{ padding: '8px 28px 6px', borderBottom: `1px solid ${uiBorder}` }}>
          <div style={{ fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: sectionLabelColor }}>
            Recents
          </div>
        </div>
        <div style={{ padding: 24, overflowY: 'auto' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: 18,
            }}
          >
            {cards}
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(modal, document.body);
}
