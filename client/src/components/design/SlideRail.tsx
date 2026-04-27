import { useState } from 'react';
import { Reorder } from 'motion/react';
import type { Presentation, Slide } from '@shared/types';
import { slideRailPreviewSubtitle } from './utils/templateHelpers';
import { TemplatePickerModal } from './TemplatePickerModal';

interface SlideRailProps {
  presentation: Presentation;
  currentSlideIndex: number;
  isNight: boolean;
  uiSurface: string;
  uiBorder: string;
  uiSurfaceStrong: string;
  uiPanelShadow: string;
  handleReorder: (newSlides: Slide[]) => void;
  goToSlide: (index: number) => void;
  deleteSlide: (index: number) => void;
  addSlide: (options?: Partial<Slide>) => void;
  themeMode: 'morning' | 'night';
  setThemeMode: (mode: 'morning' | 'night') => void;
}

export function SlideRail({
  presentation,
  currentSlideIndex,
  isNight,
  uiSurface,
  uiBorder,
  uiSurfaceStrong,
  uiPanelShadow,
  handleReorder,
  goToSlide,
  deleteSlide,
  addSlide,
  themeMode,
  setThemeMode,
}: SlideRailProps) {
  const slide = presentation.slides[currentSlideIndex];
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);

  return (
    <div
      className="w-[272px] shrink-0 min-h-0 flex flex-col overflow-hidden"
      style={{
        height: 'calc(100vh - 52px)',
        maxHeight: 'calc(100vh - 52px)',
        position: 'relative',
        background: uiSurface,
        borderRight: uiBorder,
        backdropFilter: isNight ? 'blur(10px)' : 'none',
        boxShadow: uiPanelShadow,
      }}
    >
      <div
        className="p-2 min-h-0 flex-1 overflow-y-auto no-scrollbar"
        style={{ overscrollBehavior: 'contain', paddingBottom: 78, WebkitOverflowScrolling: 'touch' }}
      >
        <Reorder.Group axis="y" values={presentation.slides} onReorder={handleReorder}>
          {presentation.slides.map((s, i) => (
            <Reorder.Item
              key={s.id}
              value={s}
              onClick={() => goToSlide(i)}
              style={{
                padding: 0,
                border: 'none',
                borderRadius: 0,
                marginBottom: 8,
                background: 'transparent',
                cursor: 'grab',
                listStyle: 'none',
              }}
            >
              <div style={{ fontSize: 12, marginBottom: 6, color: isNight ? '#a7a9af' : '#666', paddingLeft: 2 }}>
                {i + 1}
              </div>
              <div
                style={{
                  width: '100%',
                  aspectRatio: '16 / 9',
                  border: i === currentSlideIndex
                    ? '1px solid #5f9dff'
                    : isNight
                      ? '1px solid #303646'
                      : '1px solid #c5cad4',
                  borderRadius: 6,
                  background: isNight
                    ? 'linear-gradient(180deg, rgba(17,18,22,0.92) 0%, rgba(12,13,16,0.95) 100%)'
                    : '#ffffff',
                  padding: 8,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-start',
                }}
              >
                <div className="gen-label" style={{ color: isNight ? '#c2c4ca' : '#666' }}>
                  {s.sceneMode === 'scene' ? 'SCENE' : 'SLIDE'}
                </div>
                <div style={{ fontSize: 13, marginTop: 4, fontWeight: 600, color: isNight ? '#f5f7ff' : '#171717' }}>
                  {s.title}
                </div>
                <div
                  style={{
                    fontSize: 9,
                    lineHeight: 1.35,
                    color: isNight ? '#b8c4d8' : '#4b5563',
                    marginTop: 3,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical' as const,
                    overflow: 'hidden',
                    wordBreak: 'break-word',
                  }}
                >
                  {slideRailPreviewSubtitle(s)}
                </div>
              </div>
              <div className="flex items-start justify-end gap-2" style={{ marginTop: 4, paddingRight: 2 }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (presentation.slides.length > 1) deleteSlide(i);
                  }}
                  title="Delete slide"
                  style={{
                    border: 'none',
                    background: 'transparent',
                    fontSize: 18,
                    lineHeight: 1,
                    color: isNight ? '#cfd6e8' : '#444',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  -
                </button>
              </div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
        <button
          onClick={() => setShowTemplatePicker(true)}
          style={{
            width: '100%',
            height: 34,
            border: uiBorder,
            background: uiSurfaceStrong,
            fontSize: 22,
            lineHeight: 1,
            cursor: 'pointer',
            color: isNight ? '#f5f7ff' : '#222',
            marginTop: 2,
            backdropFilter: isNight ? 'blur(6px)' : 'none',
          }}
          aria-label="Add slide"
          title="Add slide"
        >
          +
        </button>
      </div>
      <div style={{ height: 10, borderTop: uiBorder, flexShrink: 0 }} />
      <div
        style={{
          position: 'absolute',
          left: 10,
          bottom: 28,
          display: 'flex',
          justifyContent: 'flex-start',
          zIndex: 4,
        }}
      >
        <button
          onClick={() => setThemeMode(themeMode === 'night' ? 'morning' : 'night')}
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            border: uiBorder,
            background: isNight ? 'rgba(34,35,40,0.95)' : '#f0f0f0',
            color: isNight ? '#f5f7ff' : '#111',
            fontSize: 18,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title={isNight ? '아침 모드' : '밤 모드'}
          aria-label={isNight ? 'Switch to morning mode' : 'Switch to night mode'}
        >
          {isNight ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M14.5 3.5C11 4.4 8.5 7.6 8.5 11.3C8.5 15.8 12.2 19.5 16.7 19.5C18.2 19.5 19.7 19.1 20.9 18.3C19.6 20.8 16.9 22.5 13.8 22.5C9.1 22.5 5.2 18.6 5.2 13.9C5.2 9.8 8 6.3 11.8 5.4C12.8 5.1 13.8 5.1 14.5 5.2V3.5Z"
                fill="currentColor"
              />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="4.2" fill="currentColor" />
              <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M12 2.8V5.2" />
                <path d="M12 18.8V21.2" />
                <path d="M2.8 12H5.2" />
                <path d="M18.8 12H21.2" />
                <path d="M5.5 5.5L7.2 7.2" />
                <path d="M16.8 16.8L18.5 18.5" />
                <path d="M18.5 5.5L16.8 7.2" />
                <path d="M7.2 16.8L5.5 18.5" />
              </g>
            </svg>
          )}
        </button>
      </div>

      {showTemplatePicker && (
        <TemplatePickerModal
          isNight={isNight}
          onClose={() => setShowTemplatePicker(false)}
          onSelect={(preset) => {
            const presetBody = (preset.content || '').replace(/^#\s[^\n]+/, '').trim();
            addSlide({
              templateId: preset.id,
              title: preset.title,
              content: `# ${preset.title}${presetBody ? `\n\n${presetBody}` : ''}`,
              speakerNotes: preset.speakerNotes,
              visualType: preset.visualType,
              background: slide?.background,
              textStyle: slide?.textStyle,
              sceneMode: slide?.sceneMode ?? 'slide',
            });
            setShowTemplatePicker(false);
          }}
        />
      )}
    </div>
  );
}
