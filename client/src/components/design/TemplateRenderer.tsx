import { useState, useRef, useEffect } from 'react';
import type { Slide, TemplateTextBlock } from '@shared/types';
import ReactMarkdown from 'react-markdown';

import {
  getSpecialTemplateScale,
  getMotionAnimation,
  createEditableTemplateBlocks,
  normalizePresetTree,
} from './utils/templateHelpers';
import { renderSpecialTemplate } from './templates/renderSpecialTemplate';

export function SlideTemplateCanvas({
  slide,
  parsed,
  mode,
  textColor,
  subTextColor,
  textShadow,
  onUpdateSlide,
  pointerThroughCanvas = false,
}: {
  slide: Slide;
  parsed: { title: string; bullets: string[]; quote: string; tableRows: string[] };
  mode: 'wireframe' | 'render';
  textColor: string;
  subTextColor: string;
  textShadow: string;
  onUpdateSlide: (patch: Partial<Slide>) => void;
  /** When true, only explicit children receive pointer events (e.g. so slide media can be clicked). */
  pointerThroughCanvas?: boolean;
}) {
  const editableTemplateId = slide.templateId?.startsWith('figma-') ? slide.templateId : null;
  const textSizeScale = slide.textStyle?.sizeScale ?? 0.76;
  const textFontFamily = slide.textStyle?.fontFamily;
  const textFontWeight = slide.textStyle?.fontWeight;
  const styledTextColor = slide.textStyle?.color ?? textColor;
  const styledSubTextColor = slide.textStyle?.color ?? subTextColor;
  const motionStyle = getMotionAnimation(
    slide.textStyle?.motionPreset,
    slide.textStyle?.motionIntensity ?? 1,
    slide.textStyle?.motionSpeed ?? 1,
  );
  const editableHostRef = useRef<HTMLDivElement>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [clipboardBlock, setClipboardBlock] = useState<TemplateTextBlock | null>(null);
  const [dragInfo, setDragInfo] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const [resizeInfo, setResizeInfo] = useState<{
    id: string;
    startClientX: number;
    startWpx: number;
    origMaxWidth: number;
    origFontSize: number;
  } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const dragInfoRef = useRef(dragInfo);
  useEffect(() => { dragInfoRef.current = dragInfo; }, [dragInfo]);
  const resizeInfoRef = useRef(resizeInfo);
  useEffect(() => { resizeInfoRef.current = resizeInfo; }, [resizeInfo]);
  const slideRef = useRef(slide);
  useEffect(() => { slideRef.current = slide; }, [slide]);

  /** Legacy welcome / title slides had no templateId → static canvas, no selection. Promote to figma-1 + blocks. */
  useEffect(() => {
    if (slide.templateId) return;
    if (slide.visualType !== 'title') return;
    if ((slide.templateTextBlocks ?? []).length > 0) return;
    const body = (slide.content || '').replace(/^#\s[^\n]+/m, '').trim();
    onUpdateSlide({
      templateId: 'figma-1',
      sceneMode: slide.sceneMode ?? 'slide',
      templateTextBlocks: createEditableTemplateBlocks('figma-1', slide.title || '', body),
    });
  }, [slide.templateId, slide.visualType, slide.templateTextBlocks, slide.title, slide.content, slide.sceneMode, onUpdateSlide]);

  useEffect(() => {
    if (!editableTemplateId) return;
    const body = slide.content.replace(/^#\s[^\n]+/, '').trim();
    const blocks = slide.templateTextBlocks ?? [];
    if (!blocks.length) {
      const seeded = createEditableTemplateBlocks(editableTemplateId, slide.title, body);
      if (!seeded.length) return;
      onUpdateSlide({ templateTextBlocks: seeded });
      return;
    }
    // Migrate old placeholder values to actual preset values.
    const migrated = blocks.map((b) => {
      if (b.id === 'title-1' && (b.text === 'Title' || b.text === 'Highlight')) return { ...b, text: slide.title || '' };
      if (b.id === 'body-1' && b.text === 'Description') return { ...b, text: body || '' };
      return b;
    });
    const changed = migrated.some((b, i) => b.text !== blocks[i]?.text);
    if (changed) onUpdateSlide({ templateTextBlocks: migrated });
  }, [editableTemplateId, slide.content, slide.templateTextBlocks, slide.title, onUpdateSlide]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!editableTemplateId) return;
      const target = e.target as HTMLElement | null;
      if (target && target.closest('[contenteditable="true"]')) return;
      const blocks = slide.templateTextBlocks ?? [];

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedBlockId) {
        e.preventDefault();
        onUpdateSlide({ templateTextBlocks: blocks.filter((b) => b.id !== selectedBlockId) });
        setSelectedBlockId(null);
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c' && selectedBlockId) {
        const found = blocks.find((b) => b.id === selectedBlockId);
        if (found) {
          e.preventDefault();
          setClipboardBlock(found);
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v' && clipboardBlock) {
        e.preventDefault();
        const next: TemplateTextBlock = {
          ...clipboardBlock,
          id: `block-${Date.now()}`,
          x: Math.min(86, clipboardBlock.x + 3),
          y: Math.min(86, clipboardBlock.y + 3),
        };
        onUpdateSlide({ templateTextBlocks: [...blocks, next] });
        setSelectedBlockId(next.id);
      }
    };

    const onWindowClick = () => setContextMenu(null);

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('click', onWindowClick);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('click', onWindowClick);
    };
  }, [clipboardBlock, editableTemplateId, onUpdateSlide, selectedBlockId, slide.templateTextBlocks]);

  const updateBlock = (id: string, patch: Partial<TemplateTextBlock>) => {
    onUpdateSlide({
      templateTextBlocks: (slide.templateTextBlocks ?? []).map((b) => (b.id === id ? { ...b, ...patch } : b)),
    });
  };

  const sendBlockToFront = (id: string) => {
    const blocks = slide.templateTextBlocks ?? [];
    const maxZ = blocks.reduce((acc, b) => Math.max(acc, b.zIndex ?? 0), 0);
    updateBlock(id, { zIndex: maxZ + 1 });
  };

  const sendBlockToBack = (id: string) => {
    const blocks = slide.templateTextBlocks ?? [];
    const minZ = blocks.reduce((acc, b) => Math.min(acc, b.zIndex ?? 0), 0);
    updateBlock(id, { zIndex: minZ - 1 });
  };

  useEffect(() => {
    if (!dragInfo && !resizeInfo) return;
    const onMove = (e: PointerEvent) => {
      const host = editableHostRef.current;
      if (!host) return;
      const rect = host.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;
      const blocks = slideRef.current.templateTextBlocks ?? [];
      const rz = resizeInfoRef.current;
      if (rz) {
        const dx = e.clientX - rz.startClientX;
        const newWpx = Math.max(40, rz.startWpx + dx);
        const newMaxWidthPct = Math.min(96, Math.max(10, (newWpx / rect.width) * 100));
        const scale = newWpx / rz.startWpx;
        const newFs = Math.max(7, Math.round(rz.origFontSize * scale * 1000) / 1000);
        onUpdateSlide({
          templateTextBlocks: blocks.map((b) => (b.id === rz.id ? { ...b, maxWidth: newMaxWidthPct, fontSize: newFs } : b)),
        });
        return;
      }
      const dg = dragInfoRef.current;
      if (!dg) return;
      const xPct = ((e.clientX - rect.left - dg.offsetX) / rect.width) * 100;
      const yPct = ((e.clientY - rect.top - dg.offsetY) / rect.height) * 100;
      onUpdateSlide({
        templateTextBlocks: blocks.map((b) => (b.id === dg.id ? { ...b, x: Math.max(0, Math.min(92, xPct)), y: Math.max(0, Math.min(92, yPct)) } : b)),
      });
    };
    const onUp = () => {
      setDragInfo(null);
      setResizeInfo(null);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [dragInfo, resizeInfo, onUpdateSlide]);

  if (editableTemplateId && (slide.templateTextBlocks ?? []).length > 0) {
    const editableSpecialRaw = renderSpecialTemplate(
      { ...slide, title: '', content: '' },
      styledTextColor,
      styledSubTextColor,
      textShadow,
    );
    const editableSpecial = editableSpecialRaw
      ? normalizePresetTree(
        editableSpecialRaw,
        0.56 * textSizeScale,
        0.84,
        { fontFamily: textFontFamily, fontWeight: textFontWeight, color: slide.textStyle?.color },
        motionStyle,
      )
      : null;
    const editableSpecialScale = getSpecialTemplateScale(slide.templateId);
    return (
      <div
        ref={editableHostRef}
        style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          height: '100%',
          pointerEvents: pointerThroughCanvas ? 'none' : 'auto',
        }}
      >
        {editableSpecial && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 1, overflow: 'hidden', pointerEvents: 'none' }}>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                transform: `scale(${editableSpecialScale})`,
                transformOrigin: 'center center',
              }}
            >
              {editableSpecial}
            </div>
          </div>
        )}
        {[...(slide.templateTextBlocks ?? [])]
          .sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0))
          .map((block) => (
          <div
            key={block.id}
            onPointerDown={(e) => {
              const target = e.target as HTMLElement;
              if (target.closest('[data-text-resize]')) return;
              if (target.closest('[contenteditable="true"]')) return;
              const host = editableHostRef.current;
              if (!host) return;
              const hostRect = host.getBoundingClientRect();
              const blockRect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
              setSelectedBlockId(block.id);
              setDragInfo({
                id: block.id,
                offsetX: e.clientX - blockRect.left,
                offsetY: e.clientY - blockRect.top,
              });
              if (hostRect.width < 1 || hostRect.height < 1) setDragInfo(null);
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              setSelectedBlockId(block.id);
              setContextMenu({ id: block.id, x: e.clientX, y: e.clientY });
            }}
            style={{
              position: 'absolute',
              left: `${block.x}%`,
              top: `${block.y}%`,
              transform: 'translate(0, 0)',
              zIndex: block.zIndex ?? 0,
              minWidth: 60,
              maxWidth: `${block.maxWidth ?? 40}%`,
              padding: '2px 4px',
              border: selectedBlockId === block.id ? '1px solid #5f9dff' : '1px dashed rgba(95,157,255,0.35)',
              borderRadius: 4,
              background: selectedBlockId === block.id ? 'rgba(14,21,36,0.08)' : 'transparent',
              cursor: 'move',
              userSelect: 'none',
              pointerEvents: 'auto',
            }}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedBlockId(block.id);
            }}
          >
            <div
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => updateBlock(block.id, { text: e.currentTarget.textContent || '' })}
              style={{
                fontSize: block.fontSize,
                fontFamily: textFontFamily ?? undefined,
                fontWeight: textFontWeight ?? block.fontWeight ?? 400,
                color: styledTextColor,
                lineHeight: 1.35,
                textShadow,
                outline: 'none',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                userSelect: 'text',
                cursor: 'text',
                transform: `scale(${textSizeScale})`,
                transformOrigin: 'left top',
                ...motionStyle,
              }}
            >
              {block.text}
            </div>
            {selectedBlockId === block.id ? (
              <div
                data-text-resize
                onPointerDown={(e) => {
                  e.stopPropagation();
                  const wrap = (e.currentTarget as HTMLElement).parentElement as HTMLDivElement | null;
                  if (!wrap) return;
                  const br = wrap.getBoundingClientRect();
                  setResizeInfo({
                    id: block.id,
                    startClientX: e.clientX,
                    startWpx: br.width,
                    origMaxWidth: block.maxWidth ?? 40,
                    origFontSize: block.fontSize,
                  });
                }}
                style={{
                  position: 'absolute',
                  right: -4,
                  bottom: -4,
                  width: 10,
                  height: 10,
                  background: '#5f9dff',
                  borderRadius: 2,
                  cursor: 'nwse-resize',
                  zIndex: 2,
                  border: '1px solid #0f1420',
                }}
              />
            ) : null}
          </div>
        ))}
        {contextMenu && (
          <div
            style={{
              position: 'fixed',
              left: contextMenu.x,
              top: contextMenu.y,
              zIndex: 99999,
              minWidth: 124,
              background: '#0f1420',
              border: '1px solid #3b4762',
              borderRadius: 6,
              boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              style={{ width: '100%', border: 'none', background: 'transparent', color: '#f5f7ff', textAlign: 'left', padding: '8px 10px', fontSize: 11, cursor: 'pointer' }}
              onClick={() => {
                sendBlockToFront(contextMenu.id);
                setContextMenu(null);
              }}
            >
              맨 앞으로
            </button>
            <button
              style={{ width: '100%', border: 'none', background: 'transparent', color: '#f5f7ff', textAlign: 'left', padding: '8px 10px', fontSize: 11, cursor: 'pointer', borderTop: '1px solid #2d374f' }}
              onClick={() => {
                sendBlockToBack(contextMenu.id);
                setContextMenu(null);
              }}
            >
              맨 뒤로
            </button>
          </div>
        )}
      </div>
    );
  }

  const specialRaw = renderSpecialTemplate(slide, styledTextColor, styledSubTextColor, textShadow);
  const special = specialRaw
    ? normalizePresetTree(
      specialRaw,
      0.68 * textSizeScale,
      0.84,
      { fontFamily: textFontFamily, fontWeight: textFontWeight, color: slide.textStyle?.color },
      motionStyle,
    )
    : specialRaw;

  if (special) {
    const specialScale = getSpecialTemplateScale(slide.templateId);
    return (
      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', overflow: 'hidden', pointerEvents: pointerThroughCanvas ? 'none' : 'auto' }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transform: `scale(${specialScale})`,
            transformOrigin: 'center center',
          }}
        >
          {special}
        </div>
      </div>
    );
  }

  const frameStyle = mode === 'wireframe'
    ? { border: '1px dashed rgba(255,255,255,0.55)', background: 'rgba(255,255,255,0.12)' }
    : { border: '1px solid rgba(255,255,255,0.35)', background: 'transparent' };

  if (slide.visualType === 'title') {
    return (
      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', pointerEvents: pointerThroughCanvas ? 'none' : 'auto', ...frameStyle, padding: 24 }}>
        <div style={{ fontSize: 30, fontWeight: 700, lineHeight: 1.15, color: textColor, textShadow, ...motionStyle }}>{slide.title || parsed.title}</div>
        <div style={{ fontSize: 14, marginTop: 8, color: subTextColor, textShadow, ...motionStyle }}>{(slide.content || '').split('\n').filter((x) => !x.startsWith('#')).join(' ').slice(0, 140)}</div>
      </div>
    );
  }

  if (slide.visualType === 'table') {
    const rows = parsed.tableRows.length ? parsed.tableRows : ['| Left | Right |', '| A | B |', '| C | D |'];
    return (
      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', pointerEvents: pointerThroughCanvas ? 'none' : 'auto', ...frameStyle, padding: 16 }}>
        <div style={{ fontSize: 19, fontWeight: 700, marginBottom: 8, ...motionStyle }}>{slide.title || parsed.title}</div>
        <div style={{ border: '1px solid rgba(255,255,255,0.45)', background: 'rgba(255,255,255,0.45)', backdropFilter: 'blur(1px)' }}>
          {rows.map((r, i) => {
            const cells = r.split('|').map((x) => x.trim()).filter(Boolean);
            return (
              <div key={`${r}-${i}`} style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(2, cells.length)}, minmax(0, 1fr))`, borderTop: i === 0 ? 'none' : '1px solid #eee' }}>
                {cells.map((c, ci) => (
                  <div key={`${c}-${ci}`} style={{ padding: '7px 9px', borderLeft: ci === 0 ? 'none' : '1px solid rgba(0,0,0,0.08)', fontSize: 12, ...motionStyle }}>
                    {c || `Cell ${ci + 1}`}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (slide.visualType === 'quote') {
    return (
      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', display: 'flex', alignItems: 'center', pointerEvents: pointerThroughCanvas ? 'none' : 'auto', ...frameStyle, padding: 24 }}>
        <div style={{ fontSize: 22, lineHeight: 1.35, fontStyle: 'italic', color: textColor, textShadow, ...motionStyle }}>
          {parsed.quote || (slide.content || '').replace(/^#+\s*/gm, '').slice(0, 180)}
        </div>
      </div>
    );
  }

  if (slide.visualType === 'image') {
    return (
      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', pointerEvents: pointerThroughCanvas ? 'none' : 'auto', ...frameStyle, padding: 14, display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: 12 }}>
        <div style={{ border: mode === 'wireframe' ? '2px dashed #c6c6c6' : '1px solid #ddd', background: '#f3f3f3' }} />
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.2, color: textColor, textShadow, ...motionStyle }}>{slide.title || parsed.title}</div>
          <div style={{ fontSize: 13, color: subTextColor, marginTop: 8, textShadow, ...motionStyle }}>
            {(slide.content || '').replace(/^#+\s*/gm, '').slice(0, 180)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', pointerEvents: pointerThroughCanvas ? 'none' : 'auto', ...frameStyle, padding: 16 }}>
      <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 10, color: textColor, textShadow, ...motionStyle }}>{slide.title || parsed.title}</div>
      <div style={{ fontSize: 13, color: subTextColor, lineHeight: 1.6, textShadow, ...motionStyle }}>
        {(parsed.bullets.length ? parsed.bullets : ['포인트 1', '포인트 2', '포인트 3']).map((b) => (
          <div key={b}>- {b}</div>
        ))}
      </div>
      {mode === 'render' && !parsed.bullets.length && (
        <div className="gen-prose" style={{ marginTop: 12, color: subTextColor, ...motionStyle }}>
          <ReactMarkdown>{slide.content || ''}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}
