import { useState, useRef } from 'react';
import { usePresentationStore } from '../stores/presentationStore';
import { IconPdf, IconEditPencil, IconText, IconComment, IconClose } from './icons';

export function ControlBar() {
  const { presentation, currentSlideIndex, uiThemeMode, activePresentTool, setActivePresentTool, addSlideAnnotation } = usePresentationStore();
  const [isFinalOpen, setIsFinalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isNight = uiThemeMode === 'night';

  const totalSlides = presentation?.slides.length || 0;

  return (
    <>
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
            onClick={() => setIsFinalOpen(true)}
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
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (ev) => {
                const result = ev.target?.result;
                if (typeof result === 'string') {
                  addSlideAnnotation(currentSlideIndex, {
                    id: Math.random().toString(36).substr(2, 9),
                    type: 'image',
                    x: 50,
                    y: 50,
                    url: result,
                  });
                }
              };
              reader.readAsDataURL(file);
              e.target.value = ''; // Reset
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{ background: 'transparent', border: 'none', padding: 0 }}
            title="Attach Image"
          >
            <IconPdf size={20} style={{ opacity: 0.85, cursor: 'pointer' }} />
          </button>
          
          <button
            onClick={() => setActivePresentTool(activePresentTool === 'draw' ? 'pointer' : 'draw')}
            style={{ background: 'transparent', border: 'none', padding: 0 }}
            title="Draw"
          >
            <IconEditPencil size={20} style={{ opacity: 0.85, cursor: 'pointer', color: activePresentTool === 'draw' ? '#5f9dff' : 'inherit' }} />
          </button>

          <button
            onClick={() => setActivePresentTool(activePresentTool === 'text' ? 'pointer' : 'text')}
            style={{ background: 'transparent', border: 'none', padding: 0 }}
            title="Add Text"
          >
            <IconText size={20} style={{ opacity: 0.85, cursor: 'pointer', color: activePresentTool === 'text' ? '#5f9dff' : 'inherit' }} />
          </button>

          <button
            onClick={() => setActivePresentTool(activePresentTool === 'comment' ? 'pointer' : 'comment')}
            style={{ background: 'transparent', border: 'none', padding: 0 }}
            title="Add Comment"
          >
            <IconComment size={20} style={{ opacity: 0.85, cursor: 'pointer', color: activePresentTool === 'comment' ? '#5f9dff' : 'inherit' }} />
          </button>
        </div>
      </div>

      {isFinalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setIsFinalOpen(false)}
        >
          <div
            style={{
              background: isNight ? '#12141a' : '#ffffff',
              color: isNight ? '#f5f7ff' : '#111111',
              width: 600,
              maxHeight: '80vh',
              overflowY: 'auto',
              padding: '32px',
              borderRadius: '12px',
              boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
              border: `1px solid ${isNight ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 style={{ fontSize: 20, fontWeight: 300, letterSpacing: '0.04em' }}>Meeting Summary</h2>
              <button
                onClick={() => setIsFinalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--gen-text-mute)' }}
              >
                <IconClose size={24} />
              </button>
            </div>
            
            <div className="space-y-6" style={{ fontSize: 13, lineHeight: 1.6, color: isNight ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.85)' }}>
              <div>
                <h3 style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gen-text-sub)', marginBottom: 8 }}>Key Takeaways</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Genesis GV80 디자인 및 핵심 가치에 대한 프레젠테이션 완료</li>
                  <li>여백의 미를 살린 인테리어 디자인 콘셉트에 대한 긍정적 피드백</li>
                  <li>최첨단 안전 시스템에 관한 추가 자료 요청 (마케팅팀)</li>
                </ul>
              </div>

              <div>
                <h3 style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gen-text-sub)', marginBottom: 8 }}>Action Items</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>마케팅팀:</strong> 다음 주 화요일까지 세부 기술 스펙 시트 업데이트</li>
                  <li><strong>디자인팀:</strong> 고객 피드백을 반영한 인테리어 컬러 베리에이션 추가 시안 준비</li>
                  <li><strong>영업팀:</strong> 분기별 세일즈 가이드에 본 프레젠테이션 내용 반영</li>
                </ul>
              </div>

              <div style={{ padding: '16px', background: isNight ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', borderRadius: '6px' }}>
                <h3 style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gen-text-sub)', marginBottom: 8 }}>Agent Notes</h3>
                <p>
                  "오늘 프레젠테이션은 전반적으로 성공적이었습니다. 특히 인테리어 파트에서 청중의 집중도가 가장 높았습니다. 다음 발표에서는 기술 파트의 시각 자료를 좀 더 보강하면 좋을 것 같습니다."
                </p>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={() => {
                  alert('Summary copied or exported (Mock)');
                  setIsFinalOpen(false);
                }}
                style={{
                  padding: '10px 24px',
                  background: isNight ? '#ffffff' : '#000000',
                  color: isNight ? '#000000' : '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                }}
              >
                Export Summary
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
