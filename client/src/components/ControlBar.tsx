import { usePresentationStore } from '../stores/presentationStore';
import { usePlayback } from '../hooks/usePlayback';
import { IconArrowLeft, IconArrowRight } from './icons';

export function ControlBar() {
  const { presentation, currentSlideIndex, agentMode, isPlaying, nextSlide, prevSlide } = usePresentationStore();
  const { pause } = usePlayback();

  const totalSlides = presentation?.slides.length || 0;
  const isLast = currentSlideIndex >= totalSlides - 1;
  const navDisabled = agentMode === 'presenting' || agentMode === 'qa';

  // Manual nav cancels auto-play
  const handlePrev = () => { if (isPlaying) pause(); prevSlide(); };
  const handleNext = () => { if (isPlaying) pause(); nextSlide(); };

  return (
    <div
      className="flex items-center justify-between px-12 py-4"
      style={{ background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(8px)', borderTop: '1px solid var(--gen-border)' }}
    >
      {/* Navigation */}
      <div className="flex items-center gap-6">
        <button
          onClick={handlePrev}
          disabled={currentSlideIndex === 0 || navDisabled}
          className="gen-btn gen-btn-ghost flex items-center gap-2"
          style={{ padding: '10px 16px', fontSize: 11 }}
        >
          <IconArrowLeft size={14} />
          Prev
        </button>
        <div className="gen-label" style={{ minWidth: 80, textAlign: 'center' }}>
          {String(currentSlideIndex + 1).padStart(2, '0')} &nbsp;/&nbsp; {String(totalSlides).padStart(2, '0')}
        </div>
        <button
          onClick={handleNext}
          disabled={isLast || navDisabled}
          className="gen-btn gen-btn-ghost flex items-center gap-2"
          style={{ padding: '10px 16px', fontSize: 11 }}
        >
          Next
          <IconArrowRight size={14} />
        </button>
      </div>

      {/* Slide title */}
      <div
        className="max-w-[320px] truncate"
        style={{ fontSize: 12, color: 'var(--gen-text-sub)', letterSpacing: '0.02em' }}
      >
        {presentation?.slides[currentSlideIndex]?.title}
      </div>
    </div>
  );
}
