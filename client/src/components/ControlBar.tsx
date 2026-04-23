import { usePresentationStore } from '../stores/presentationStore';
import { IconPdf, IconEditPencil, IconText, IconComment } from './icons';

export function ControlBar() {
  const { presentation, currentSlideIndex, uiThemeMode } = usePresentationStore();
  const isNight = uiThemeMode === 'night';

  const totalSlides = presentation?.slides.length || 0;

  return (
    <div
      className="flex items-center justify-between px-12 py-3"
      style={{
        background: isNight ? 'rgba(9,12,18,0.92)' : 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(12px)',
        borderTop: 'none',
        color: isNight ? '#f5f7ff' : '#000000',
        height: 64,
      }}
    >
      {/* Left: Final button */}
      <div className="flex-1 flex justify-start">
        <button
          style={{
            padding: '6px 20px',
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            background: 'transparent',
            color: isNight ? '#f5f7ff' : '#000000',
            border: `1px solid ${isNight ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)'}`,
            cursor: 'pointer',
          }}
        >
          Final
        </button>
      </div>

      {/* Center: Slide index */}
      <div
        className="flex-1 flex justify-center items-center"
        style={{
          fontSize: 20,
          fontWeight: 200,
          color: isNight ? 'rgba(245,247,255,0.95)' : 'rgba(0,0,0,0.9)',
          letterSpacing: '0.04em',
        }}
      >
        {String(currentSlideIndex + 1).padStart(2, '0')}/{String(totalSlides).padStart(2, '0')}
      </div>

      {/* Right: Icons */}
      <div className="flex-1 flex justify-end items-center gap-7">
        <IconPdf size={20} style={{ opacity: 0.85, cursor: 'pointer', color: '#3182ce' }} />
        <IconEditPencil size={20} style={{ opacity: 0.85, cursor: 'pointer' }} />
        <IconText size={20} style={{ opacity: 0.85, cursor: 'pointer' }} />
        <IconComment size={20} style={{ opacity: 0.85, cursor: 'pointer' }} />
      </div>
    </div>
  );
}
