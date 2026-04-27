import { PRESET_CARDS, type PresetCard } from '../../data/slidePresets';

interface TemplatePickerModalProps {
  onSelect: (preset: PresetCard) => void;
  onClose: () => void;
  isNight: boolean;
}

export function TemplatePickerModal({ onSelect, onClose, isNight }: TemplatePickerModalProps) {
  const uiSurface = isNight ? 'rgba(28,28,31,0.98)' : '#ffffff';
  const uiBorder = isNight ? 'rgba(255,255,255,0.12)' : '#d2d2d2';
  const textColor = isNight ? '#f5f7ff' : '#171717';
  const subTextColor = isNight ? '#a7a9af' : '#666666';

  return (
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
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: textColor }}>
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
        <div
          style={{
            padding: 24,
            overflowY: 'auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 16,
          }}
        >
          {PRESET_CARDS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => onSelect(preset)}
              style={{
                background: isNight ? 'rgba(255,255,255,0.03)' : '#f8f8f8',
                border: `1px solid ${uiBorder}`,
                borderRadius: 8,
                padding: 16,
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#5f9dff';
                e.currentTarget.style.background = isNight ? 'rgba(95,157,255,0.1)' : '#eef4ff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = uiBorder;
                e.currentTarget.style.background = isNight ? 'rgba(255,255,255,0.03)' : '#f8f8f8';
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 600, color: textColor }}>
                {preset.title || preset.id}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: subTextColor,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {preset.speakerNotes || preset.subtitle || '템플릿입니다.'}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
