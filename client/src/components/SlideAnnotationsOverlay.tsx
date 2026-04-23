import { useState, useRef } from 'react';
import { usePresentationStore } from '../stores/presentationStore';
import type { SlideAnnotation } from '../types';

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

export function SlideAnnotationsOverlay() {
  const {
    presentation,
    currentSlideIndex,
    activePresentTool,
    setActivePresentTool,
    addSlideAnnotation,
    updateSlideAnnotation,
  } = usePresentationStore();

  const currentSlide = presentation?.slides[currentSlideIndex];
  const annotations = currentSlide?.annotations || [];

  const overlayRef = useRef<HTMLDivElement>(null);

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentDrawId, setCurrentDrawId] = useState<string | null>(null);

  if (!currentSlide) return null;

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePresentTool === 'pointer') return;

    const overlay = overlayRef.current;
    if (!overlay) return;
    const rect = overlay.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (activePresentTool === 'draw') {
      const id = generateId();
      addSlideAnnotation(currentSlideIndex, {
        id,
        type: 'draw',
        x,
        y,
        points: [{ x, y }],
        color: '#ff2d55', // Default drawing color (could be red or white)
      });
      setCurrentDrawId(id);
      setIsDrawing(true);
    } else if (activePresentTool === 'text') {
      addSlideAnnotation(currentSlideIndex, {
        id: generateId(),
        type: 'text',
        x,
        y,
        text: '',
      });
      setActivePresentTool('pointer');
    } else if (activePresentTool === 'comment') {
      addSlideAnnotation(currentSlideIndex, {
        id: generateId(),
        type: 'comment',
        x,
        y,
        text: '',
      });
      setActivePresentTool('pointer');
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDrawing || !currentDrawId || activePresentTool !== 'draw') return;

    const overlay = overlayRef.current;
    if (!overlay) return;
    const rect = overlay.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const annotation = annotations.find((a) => a.id === currentDrawId);
    if (annotation && annotation.points) {
      updateSlideAnnotation(currentSlideIndex, currentDrawId, {
        points: [...annotation.points, { x, y }],
      });
    }
  };

  const handlePointerUp = () => {
    setIsDrawing(false);
    setCurrentDrawId(null);
  };

  return (
    <div
      ref={overlayRef}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 50,
        pointerEvents: activePresentTool === 'pointer' ? 'none' : 'auto',
        cursor:
          activePresentTool === 'draw'
            ? 'crosshair'
            : activePresentTool === 'text' || activePresentTool === 'comment'
            ? 'cell'
            : 'default',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* Render all annotations */}
      {annotations.map((ann) => (
        <AnnotationRenderer key={ann.id} annotation={ann} slideIndex={currentSlideIndex} />
      ))}
    </div>
  );
}

function AnnotationRenderer({ annotation, slideIndex }: { annotation: SlideAnnotation; slideIndex: number }) {
  const { updateSlideAnnotation, removeSlideAnnotation } = usePresentationStore();

  if (annotation.type === 'draw' && annotation.points) {
    const pointsStr = annotation.points
      .map((p) => `${p.x},${p.y}`)
      .join(' ');
    
    // We use a relative SVG system to easily map 0-100 percentages
    return (
      <svg
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          overflow: 'visible',
        }}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <polyline
          points={pointsStr}
          fill="none"
          stroke={annotation.color || '#ff2d55'}
          strokeWidth="0.4" // roughly 4px relative to 100 viewbox, depends on aspect ratio
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (annotation.type === 'text') {
    return (
      <div
        style={{
          position: 'absolute',
          left: `${annotation.x}%`,
          top: `${annotation.y}%`,
          pointerEvents: 'auto',
          transform: 'translate(0, 0)',
        }}
      >
        <div
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => {
            const val = e.currentTarget.innerText.trim();
            if (!val) {
              removeSlideAnnotation(slideIndex, annotation.id);
            } else {
              updateSlideAnnotation(slideIndex, annotation.id, { text: val });
            }
          }}
          style={{
            minWidth: '50px',
            minHeight: '24px',
            padding: '4px 8px',
            background: 'rgba(0,0,0,0.4)',
            color: '#fff',
            border: '1px dashed rgba(255,255,255,0.5)',
            borderRadius: '4px',
            fontSize: '18px',
            outline: 'none',
            whiteSpace: 'pre-wrap',
            cursor: 'text',
            backdropFilter: 'blur(4px)',
          }}
          ref={(el) => {
            // Auto focus on initial mount if empty
            if (el && !annotation.text) {
              el.focus();
            }
          }}
        >
          {annotation.text}
        </div>
      </div>
    );
  }

  if (annotation.type === 'comment') {
    return (
      <div
        style={{
          position: 'absolute',
          left: `${annotation.x}%`,
          top: `${annotation.y}%`,
          pointerEvents: 'auto',
          transform: 'translate(-12px, -12px)',
        }}
      >
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
          }}
        >
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: '#facc15',
              border: '2px solid #fff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          />
          <div
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => {
              const val = e.currentTarget.innerText.trim();
              if (!val) {
                removeSlideAnnotation(slideIndex, annotation.id);
              } else {
                updateSlideAnnotation(slideIndex, annotation.id, { text: val });
              }
            }}
            style={{
              background: '#fff',
              color: '#000',
              padding: '6px 10px',
              borderRadius: '8px',
              fontSize: '14px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              minWidth: '100px',
              outline: 'none',
              cursor: 'text',
              border: '1px solid rgba(0,0,0,0.05)',
            }}
            ref={(el) => {
              if (el && !annotation.text) {
                el.focus();
              }
            }}
          >
            {annotation.text}
          </div>
        </div>
      </div>
    );
  }

  if (annotation.type === 'image') {
    return (
      <div
        style={{
          position: 'absolute',
          left: `${annotation.x}%`,
          top: `${annotation.y}%`,
          pointerEvents: 'auto',
          transform: 'translate(-50%, -50%)', // Center image at click point or center of screen
          maxWidth: '50%',
          maxHeight: '50%',
        }}
      >
        <button
          onClick={() => removeSlideAnnotation(slideIndex, annotation.id)}
          style={{
            position: 'absolute',
            top: '-12px',
            right: '-12px',
            background: '#ff3b30',
            color: '#fff',
            border: 'none',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            cursor: 'pointer',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          }}
        >
          ✕
        </button>
        <img
          src={annotation.url}
          alt="attached"
          style={{
            width: '100%',
            height: 'auto',
            objectFit: 'contain',
            borderRadius: '8px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          }}
        />
      </div>
    );
  }

  return null;
}
