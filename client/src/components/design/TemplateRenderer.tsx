import { useState, useRef, useEffect, Children, isValidElement, cloneElement } from 'react';
import type { ReactNode, CSSProperties } from 'react';
import type { Slide, TemplateTextBlock } from '../../types';
import ReactMarkdown from 'react-markdown';

export function parseContentLines(content: string) {
  const lines = (content || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const title = lines.find((l) => l.startsWith('#'))?.replace(/^#+\s*/, '') || '';
  const bullets = lines.filter((l) => l.startsWith('- ')).map((l) => l.replace(/^- /, ''));
  const quote = lines.find((l) => l.startsWith('>'))?.replace(/^>\s*/, '') || '';
  const tableRows = lines.filter((l) => l.startsWith('|') && !l.includes('---'));
  return { title, bullets, quote, tableRows };
}

export function getSpecialTemplateScale(templateId?: string) {
  if (!templateId) return 1;

  const compactHeavyText = new Set([
    'figma-18', 'figma-19', 'figma-20', 'figma-21',
    'figma-29', 'figma-30', 'figma-31', 'figma-32', 'figma-33', 'figma-34',
  ]);
  const mediumText = new Set([
    'figma-1', 'figma-2', 'figma-3', 'figma-4', 'figma-5', 'figma-6', 'figma-7', 'figma-8',
    'figma-9', 'figma-10', 'figma-11', 'figma-12', 'figma-13', 'figma-14', 'figma-15', 'figma-16',
    'figma-17', 'figma-22', 'figma-23', 'figma-24', 'figma-25', 'figma-26', 'figma-27', 'figma-28', 'figma-35',
  ]);

  // Global normalization for preset typography so template titles
  // don't look oversized compared to the base slide typography.
  // Keep enough safe-area so bottom rows don't get clipped.
  if (compactHeavyText.has(templateId)) return 0.88;
  if (mediumText.has(templateId)) return 0.92;
  return 0.92;
}

export function scaleNumericStyle(value: unknown, factor: number) {
  if (typeof value === 'number') return Math.max(0, value * factor);
  if (typeof value === 'string' && /^-?\d+(\.\d+)?px$/.test(value.trim())) {
    const n = Number(value.replace('px', '').trim());
    return `${Math.max(0, n * factor)}px`;
  }
  return value;
}

export function getMotionAnimation(
  preset?: string,
  intensity = 1,
  speed = 1,
): CSSProperties {
  if (!preset || preset === 'none') return {};
  const safeIntensity = Math.max(0.1, Math.min(2.4, intensity || 1));
  const safeSpeed = Math.max(0.25, Math.min(2.5, speed || 1));
  return {
    animationName: `gen-motion-${preset}`,
    animationDuration: `${(2 / safeSpeed).toFixed(2)}s`,
    animationTimingFunction: 'ease-in-out',
    animationIterationCount: 'infinite',
    animationFillMode: 'both',
    ['--motion-intensity' as any]: safeIntensity,
  };
}

export function createEditableTemplateBlocks(
  templateId: string,
  title: string,
  body: string,
): TemplateTextBlock[] {
  if (templateId === 'figma-1') {
    return [
      { id: 'title-1', text: title || '', x: 6, y: 22, fontSize: 56, fontWeight: 700, maxWidth: 88, zIndex: 2 },
      { id: 'body-1', text: body || '', x: 6, y: 40, fontSize: 24, fontWeight: 400, maxWidth: 88, zIndex: 1 },
    ];
  }
  if (templateId === 'figma-6') {
    return [
      { id: 'title-1', text: title || '', x: 18, y: 45, fontSize: 38, fontWeight: 700, maxWidth: 34, zIndex: 2 },
      { id: 'body-1', text: body || '', x: 52, y: 41, fontSize: 14, fontWeight: 400, maxWidth: 34, zIndex: 1 },
    ];
  }
  // Generic fallback for other figma presets: keep values from preset only.
  return [
    { id: 'title-1', text: title || '', x: 11, y: 14, fontSize: 30, fontWeight: 700, maxWidth: 78, zIndex: 2 },
    { id: 'body-1', text: body || '', x: 11, y: 25, fontSize: 14, fontWeight: 400, maxWidth: 78, zIndex: 1 },
  ];
}

export function slideRailPreviewSubtitle(s: { content?: string; title?: string }): string {
  const lines = (s.content || '').split('\n').map((l) => l.trim()).filter(Boolean);
  const bodyLines = lines.filter((l) => !l.startsWith('#'));
  const t = bodyLines.join(' ').replace(/\s+/g, ' ').trim();
  if (t) return t.length > 72 ? `${t.slice(0, 69)}…` : t;
  return (s.title || '').slice(0, 56);
}

export function normalizePresetTree(
  node: ReactNode,
  textScale: number,
  spacingScale: number,
  typography?: { fontFamily?: string; fontWeight?: 300 | 500 | 700; color?: string },
  motion?: CSSProperties,
): ReactNode {
  if (!isValidElement(node)) return node;
  const element = node as any;
  const style = (element.props?.style ?? {}) as CSSProperties;
  const nextStyle: CSSProperties = { ...style };

  const textKeys: Array<keyof CSSProperties> = ['fontSize', 'lineHeight', 'letterSpacing'];
  const spaceKeys: Array<keyof CSSProperties> = [
    'margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
    'padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
    'gap', 'columnGap', 'rowGap',
  ];

  textKeys.forEach((k) => {
    if (nextStyle[k] !== undefined) nextStyle[k] = scaleNumericStyle(nextStyle[k], textScale) as any;
  });
  if (typography?.fontFamily && (nextStyle.fontSize !== undefined || nextStyle.lineHeight !== undefined)) {
    nextStyle.fontFamily = typography.fontFamily;
  }
  if (typography?.fontWeight && (nextStyle.fontSize !== undefined || nextStyle.lineHeight !== undefined)) {
    nextStyle.fontWeight = typography.fontWeight;
  }
  if (typography?.color && nextStyle.color !== undefined) {
    nextStyle.color = typography.color;
  }
  if (motion?.animationName && (nextStyle.fontSize !== undefined || nextStyle.lineHeight !== undefined)) {
    Object.assign(nextStyle, motion);
  }
  spaceKeys.forEach((k) => {
    if (nextStyle[k] !== undefined) nextStyle[k] = scaleNumericStyle(nextStyle[k], spacingScale) as any;
  });

  const children = element.props?.children;
  const normalizedChildren = children === undefined
    ? children
    : Children.map(children, (c) => normalizePresetTree(c, textScale, spacingScale, typography, motion));

  return cloneElement(element, { style: nextStyle }, normalizedChildren);
}

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
  dragInfoRef.current = dragInfo;
  const resizeInfoRef = useRef(resizeInfo);
  resizeInfoRef.current = resizeInfo;
  const slideRef = useRef(slide);
  slideRef.current = slide;

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

export function renderSpecialTemplate(slide: Slide, textColor: string, subTextColor: string, textShadow: string) {
  const id = slide.templateId;
  if (!id) return null;

  if (id === 'figma-1') {
    return (
      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', padding: '20% 6% 0' }}>
        <div style={{ fontSize: 62, fontWeight: 700, color: textColor, lineHeight: 1.05, textShadow }}>{slide.title}</div>
        <div style={{ marginTop: 16, fontSize: 34, color: subTextColor, textShadow }}>{slide.content.replace(/^#\s[^\n]+/, '').trim()}</div>
      </div>
    );
  }

  if (id === 'figma-2') {
    return (
      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', padding: '52% 6% 0' }}>
        <div style={{ fontSize: 72, fontWeight: 700, color: textColor, lineHeight: 1.05, textShadow }}>{slide.title}</div>
      </div>
    );
  }

  if (id === 'figma-3') {
    const subtitle = slide.content.replace(/^#\s[^\n]+/, '').trim();
    return (
      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', padding: '50% 6% 0' }}>
        <div style={{ fontSize: 72, fontWeight: 700, color: textColor, lineHeight: 1.05, textShadow }}>{slide.title}</div>
        <div style={{ marginTop: 16, fontSize: 34, color: subTextColor, textShadow }}>{subtitle}</div>
      </div>
    );
  }

  if (id === 'figma-4') {
    const subtitle = slide.content.replace(/^#\s[^\n]+/, '').trim();
    return (
      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 72, fontWeight: 700, color: textColor, lineHeight: 1.05, textShadow }}>{slide.title}</div>
        <div style={{ marginTop: 16, fontSize: 34, color: subTextColor, textShadow }}>{subtitle}</div>
      </div>
    );
  }

  if (id === 'figma-5') {
    const subtitle = slide.content.replace(/^#\s[^\n]+/, '').trim();
    return (
      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', padding: '70% 6% 0' }}>
        <div style={{ fontSize: 30, fontWeight: 700, color: textColor, textShadow }}>{subtitle}</div>
        <div style={{ marginTop: 10, fontSize: 74, fontWeight: 700, color: textColor, lineHeight: 1, textShadow }}>{slide.title}</div>
      </div>
    );
  }

  if (id === 'figma-6') {
    const body = slide.content.replace(/^#\s[^\n]+/, '').trim();
    return (
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          height: '100%',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          alignItems: 'center',
          columnGap: 24,
          padding: '0 10%',
        }}
      >
        <div
          style={{
            justifySelf: 'start',
            textAlign: 'left',
            fontSize: 62,
            fontWeight: 700,
            color: textColor,
            lineHeight: 1.08,
            textShadow,
          }}
        >
          {slide.title}
        </div>
        <div
          style={{
            justifySelf: 'end',
            maxWidth: 460,
            textAlign: 'left',
            fontSize: 22,
            color: subTextColor,
            lineHeight: 1.45,
            textShadow,
          }}
        >
          {body}
        </div>
      </div>
    );
  }

  if (id === 'figma-7') {
    return (
      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', display: 'grid', gridTemplateColumns: '1fr 1.25fr', gap: 26, padding: '16% 6% 0' }}>
        <div style={{ fontSize: 58, fontWeight: 700, color: textColor, textShadow }}>{slide.title}</div>
        <div style={{ display: 'grid', gap: 22 }}>
          {['First thing', 'Second thing', 'Third thing'].map((h) => (
            <div key={h}>
              <div style={{ fontSize: 42, fontWeight: 700, color: textColor, lineHeight: 1.1, textShadow }}>{h}</div>
              <div style={{ marginTop: 6, fontSize: 26, color: subTextColor, lineHeight: 1.35, textShadow }}>
                Add a quick description with enough context to understand what&apos;s up.
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (id === 'figma-8') {
    return (
      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 24, padding: '20% 6% 0' }}>
        <div style={{ fontSize: 58, fontWeight: 700, color: textColor, textShadow }}>{slide.title}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>
          {['First thing', 'Second thing', 'Third thing', 'Fourth thing'].map((h) => (
            <div key={h}>
              <div style={{ fontSize: 38, fontWeight: 700, color: textColor, lineHeight: 1.1, textShadow }}>{h}</div>
              <div style={{ marginTop: 6, fontSize: 24, color: subTextColor, lineHeight: 1.32, textShadow }}>
                Keep it short and sweet so it&apos;s easy to scan.
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (id === 'figma-9') {
    return (
      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', padding: '12% 6% 0' }}>
        <div style={{ fontSize: 54, fontWeight: 700, color: textColor, textShadow, marginBottom: 42 }}>{slide.title}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
          {['First thing', 'Second thing', 'Third thing', 'Fourth thing'].map((h) => (
            <div key={h}>
              <div style={{ fontSize: 42, fontWeight: 700, lineHeight: 1.08, color: textColor, textShadow }}>{h}</div>
              <div style={{ marginTop: 8, fontSize: 24, lineHeight: 1.33, color: subTextColor, textShadow }}>
                Keep it short and sweet, so they&apos;re easy to scan and remember.
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (id === 'figma-10') {
    return (
      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', padding: '10% 6% 0' }}>
        <div style={{ fontSize: 54, fontWeight: 700, color: textColor, textShadow, marginBottom: 30 }}>{slide.title}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {[
            ['Principle 1', 'This is what we believe.'],
            ['Principle 2', 'It’s how we make decisions.'],
            ['Principle 3', 'And what we aim to achieve.'],
          ].map(([h, p]) => (
            <div key={h} style={{ background: 'rgba(0,0,0,0.12)', borderRadius: 12, minHeight: 410, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 34, fontWeight: 700, color: textColor, textShadow }}>{h}</div>
              <div style={{ fontSize: 52, fontWeight: 700, lineHeight: 1.08, color: textColor, textShadow }}>{p}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (id === 'figma-11') {
    return (
      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 36, padding: '8% 8%', alignItems: 'stretch' }}>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'left' }}>
          <div style={{ fontSize: 56, fontWeight: 700, color: textColor, textShadow }}>{slide.title}</div>
          <div style={{ marginTop: 14, fontSize: 28, lineHeight: 1.35, color: subTextColor, textShadow }}>
            Add a quick description of each thing, with enough context to understand what&apos;s up.
          </div>
        </div>
        <div style={{ background: 'repeating-conic-gradient(#ececec 0% 25%, #dfdfdf 0% 50%) 50% / 44px 44px', borderRadius: 2, justifySelf: 'stretch', alignSelf: 'stretch' }} />
      </div>
    );
  }

  if (id === 'figma-12') {
    return (
      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 36, padding: '8% 8%', alignItems: 'stretch' }}>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'left' }}>
          <div>
            <div style={{ fontSize: 34, fontWeight: 700, color: textColor, textShadow }}>Subtitle</div>
            <div style={{ marginTop: 12, fontSize: 68, fontWeight: 700, lineHeight: 1, color: textColor, textShadow }}>{slide.title}</div>
          </div>
          <div style={{ marginTop: 36, fontSize: 28, lineHeight: 1.35, color: subTextColor, textShadow, maxWidth: 520 }}>
            Add a quick description of each thing, with enough context to understand what&apos;s up.
          </div>
        </div>
        <div style={{ background: 'repeating-conic-gradient(#ececec 0% 25%, #dfdfdf 0% 50%) 50% / 44px 44px', justifySelf: 'stretch', alignSelf: 'stretch' }} />
      </div>
    );
  }

  if (id === 'figma-13') {
    return (
      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 36, padding: '8% 8%', alignItems: 'stretch' }}>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'left' }}>
          <div>
            <div style={{ fontSize: 34, fontWeight: 700, color: textColor, textShadow }}>Subtitle</div>
            <div style={{ marginTop: 12, fontSize: 68, fontWeight: 700, lineHeight: 1, color: textColor, textShadow }}>{slide.title}</div>
          </div>
          <div style={{ marginTop: 36, fontSize: 28, lineHeight: 1.35, color: subTextColor, textShadow, maxWidth: 520 }}>
            Add a quick description of each thing, with enough context to understand what&apos;s up.
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: 12, alignSelf: 'stretch' }}>
          <div style={{ background: 'repeating-conic-gradient(#ececec 0% 25%, #dfdfdf 0% 50%) 50% / 44px 44px', minHeight: 220 }} />
          <div style={{ background: 'repeating-conic-gradient(#ececec 0% 25%, #dfdfdf 0% 50%) 50% / 44px 44px', minHeight: 220 }} />
        </div>
      </div>
    );
  }

  if (id === 'figma-14') {
    return (
      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', display: 'grid', gridTemplateRows: '1fr auto', overflow: 'hidden' }}>
        <div style={{ background: 'repeating-linear-gradient(180deg, #e9e9e9 0 64px, #dcdcdc 64px 128px)' }} />
        <div style={{ padding: '16px 24px', textAlign: 'center', fontSize: 46, fontWeight: 700, color: textColor, textShadow }}>{slide.title}</div>
      </div>
    );
  }

  if (id === 'figma-15' || id === 'figma-16') {
    return (
      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', padding: '10% 6% 0' }}>
        <div style={{ fontSize: 56, fontWeight: 700, color: textColor, textShadow, marginBottom: 24 }}>{slide.title}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>
          <div>
            <div style={{ height: 220, background: 'repeating-conic-gradient(#ececec 0% 25%, #dfdfdf 0% 50%) 50% / 44px 44px' }} />
            <div style={{ marginTop: 16, fontSize: 42, fontWeight: 700, color: textColor, textShadow }}>First thing</div>
            <div style={{ marginTop: 8, fontSize: 24, lineHeight: 1.35, color: subTextColor, textShadow }}>
              Add a quick description of each thing, with enough context.
            </div>
          </div>
          <div>
            <div style={{ height: 220, background: 'repeating-conic-gradient(#ececec 0% 25%, #dfdfdf 0% 50%) 50% / 44px 44px' }} />
            <div style={{ marginTop: 16, fontSize: 42, fontWeight: 700, color: textColor, textShadow }}>Second thing</div>
            <div style={{ marginTop: 8, fontSize: 24, lineHeight: 1.35, color: subTextColor, textShadow }}>
              Keep it short and sweet, so they&apos;re easy to scan and remember.
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (id === 'figma-17') {
    return (
      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', padding: '8% 8%' }}>
        <div style={{ fontSize: 56, fontWeight: 700, color: textColor, textShadow, marginBottom: 24, textAlign: 'left' }}>{slide.title}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18, alignItems: 'start' }}>
          {['First thing', 'Second thing', 'Third thing'].map((h) => (
            <div key={h} style={{ textAlign: 'left' }}>
              <div style={{ height: 210, background: 'repeating-conic-gradient(#ececec 0% 25%, #dfdfdf 0% 50%) 50% / 44px 44px' }} />
              <div style={{ marginTop: 14, fontSize: 36, fontWeight: 700, color: textColor, textShadow }}>{h}</div>
              <div style={{ marginTop: 6, fontSize: 22, lineHeight: 1.35, color: subTextColor, textShadow }}>
                Add a quick description with enough context to understand what&apos;s up.
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (id === 'figma-18') {
    return (
      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', padding: '22% 6% 0' }}>
        <div style={{ fontSize: 92, fontWeight: 700, color: textColor, textShadow, lineHeight: 1 }}>XX%</div>
        <div style={{ marginTop: 20, fontSize: 46, lineHeight: 1.3, color: subTextColor, textShadow, maxWidth: 980 }}>
          Highlight a key metric-like a goal, objective, or insight-that supports the narrative of your deck.
        </div>
        <div style={{ marginTop: 18, fontSize: 30, color: subTextColor, textShadow }}>Add a link to a relevant doc or dashboard.</div>
      </div>
    );
  }

  if (id === 'figma-19') {
    return (
      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 34, padding: '28% 6% 0' }}>
        <div style={{ fontSize: 56, fontWeight: 700, color: textColor, textShadow, alignSelf: 'center' }}>{slide.title}</div>
        <div style={{ display: 'grid', gap: 18 }}>
          {['Metric 1', 'Metric 2', 'Metric 3'].map((m) => (
            <div key={m} style={{ display: 'grid', gridTemplateColumns: '180px 1fr', alignItems: 'baseline', columnGap: 20 }}>
              <div style={{ fontSize: 70, fontWeight: 700, color: textColor, lineHeight: 1, textShadow }}>XX%</div>
              <div>
                <div style={{ fontSize: 46, fontWeight: 700, color: textColor, textShadow }}>{m}</div>
                <div style={{ marginTop: 4, fontSize: 24, color: subTextColor, textShadow }}>Add a description or highlight changes</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (id === 'figma-20') {
    return (
      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', padding: '12% 6% 0' }}>
        <div style={{ fontSize: 56, fontWeight: 700, color: textColor, textShadow, marginBottom: 74 }}>{slide.title}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 34 }}>
          {[1, 2, 3].map((n) => (
            <div key={n}>
              <div style={{ fontSize: 76, fontWeight: 700, color: textColor, lineHeight: 1, textShadow }}>XX%</div>
              <div style={{ marginTop: 10, fontSize: 26, lineHeight: 1.35, color: subTextColor, textShadow }}>
                Add a quick description of each thing, with enough context to understand what&apos;s up.
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (id === 'figma-21') {
    return (
      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 34, padding: '23% 6% 0' }}>
        <div>
          <div style={{ fontSize: 56, fontWeight: 700, color: textColor, textShadow }}>{slide.title}</div>
          <div style={{ marginTop: 18, fontSize: 32, lineHeight: 1.35, color: subTextColor, textShadow }}>
            Description about the data beside. Lorem ipsum dolor sit amet, consectetur adipiscing.
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 26 }}>
          {[['61%', 'Metric 1'], ['56%', 'Metric 2'], ['55%', 'Metric 3'], ['48%', 'Metric 4']].map(([v, m]) => (
            <div key={m}>
              <div style={{ fontSize: 84, fontWeight: 700, color: textColor, lineHeight: 1, textShadow }}>{v}</div>
              <div style={{ marginTop: 8, fontSize: 38, color: subTextColor, textShadow }}>{m}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (id === 'figma-22') {
    return (
      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', padding: '10% 6% 0' }}>
        <div style={{ fontSize: 54, fontWeight: 700, color: textColor, textShadow, marginBottom: 40 }}>{slide.title}</div>
        <div style={{ position: 'relative', height: 430 }}>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 184, height: 4, background: 'rgba(0,0,0,0.75)' }} />
          {[
            { x: 0.20, y: 20, title: 'H1 2025', body: 'Use this paragraph space to say a bit more.' },
            { x: 0.60, y: 38, title: 'H1 2025', body: 'If you only have a few milestones.' },
            { x: 0.00, y: 220, title: 'H2 2024', body: 'This slide is for mapping out dates.' },
            { x: 0.40, y: 220, title: 'H2 2025', body: 'If you need to squeeze in more milestones.' },
            { x: 0.80, y: 220, title: 'June 2024', body: 'We ran out of stuff to write here.' },
          ].map((p, idx) => (
            <div key={idx} style={{ position: 'absolute', left: `${p.x * 100}%`, top: p.y, width: 240 }}>
              <div style={{ fontSize: 40, fontWeight: 700, color: textColor, textShadow }}>{p.title}</div>
              <div style={{ marginTop: 8, fontSize: 24, lineHeight: 1.35, color: subTextColor, textShadow }}>{p.body}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (id === 'figma-23') {
    return (
      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 20, padding: '20% 6% 0' }}>
        <div>
          <div style={{ fontSize: 60, fontWeight: 700, color: textColor, textShadow }}>{slide.title}</div>
          <div style={{ marginTop: 12, fontSize: 34, lineHeight: 1.35, color: subTextColor, textShadow }}>
            Show how a few nested concepts relate to one another.
          </div>
        </div>
        <div style={{ position: 'relative', height: 520 }}>
          {[220, 180, 140, 100].map((r, i) => (
            <div key={r} style={{ position: 'absolute', left: '50%', top: i * 38, transform: 'translateX(-50%)', width: r * 2, height: r * 2, borderRadius: '50%', border: '3px solid #111' }} />
          ))}
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ position: 'absolute', left: '50%', top: 110 + i * 96, transform: 'translateX(-50%)', fontSize: 28, color: textColor }}>Label</div>
          ))}
        </div>
      </div>
    );
  }

  if (id === 'figma-24') {
    return (
      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 20, padding: '20% 6% 0' }}>
        <div>
          <div style={{ fontSize: 60, fontWeight: 700, color: textColor, textShadow }}>{slide.title}</div>
          <div style={{ marginTop: 12, fontSize: 34, lineHeight: 1.35, color: subTextColor, textShadow }}>
            Show where a few concepts live on 2 different scales.
          </div>
        </div>
        <div style={{ position: 'relative', height: 520 }}>
          <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 3, background: '#111' }} />
          <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 3, background: '#111' }} />
          {[
            { x: '26%', y: '26%' }, { x: '74%', y: '26%' }, { x: '26%', y: '74%' }, { x: '74%', y: '74%' },
          ].map((p, i) => (
            <div key={i} style={{ position: 'absolute', left: p.x, top: p.y, transform: 'translate(-50%, -50%)', width: i % 2 === 0 ? 98 : 122, height: i % 2 === 0 ? 98 : 122, borderRadius: '50%', background: 'rgba(0,0,0,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: textColor }}>
              Label
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (id === 'figma-25') {
    return (
      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 20, padding: '20% 6% 0' }}>
        <div>
          <div style={{ fontSize: 60, fontWeight: 700, color: textColor, textShadow }}>Venn diagram</div>
          <div style={{ marginTop: 12, fontSize: 34, lineHeight: 1.35, color: subTextColor, textShadow }}>
            Show how a few concepts overlap, and how they&apos;re unique.
          </div>
        </div>
        <div style={{ position: 'relative', height: 520 }}>
          <div style={{ position: 'absolute', left: 92, top: 34, width: 356, height: 356, borderRadius: '50%', border: '3px solid #111', background: 'rgba(255,255,255,0.35)' }} />
          <div style={{ position: 'absolute', left: 300, top: 34, width: 356, height: 356, borderRadius: '50%', border: '3px solid #111', background: 'rgba(0,0,0,0.92)' }} />
          <div style={{ position: 'absolute', left: 284, top: 188, fontSize: 28, color: '#111' }}>Label</div>
          <div style={{ position: 'absolute', left: 400, top: 188, fontSize: 28, color: '#111' }}>Label</div>
          <div style={{ position: 'absolute', left: 560, top: 188, fontSize: 28, color: '#f3f3f3' }}>Label</div>
        </div>
      </div>
    );
  }

  if (id === 'figma-26') {
    return (
      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 20, padding: '20% 6% 0' }}>
        <div>
          <div style={{ fontSize: 60, fontWeight: 700, color: textColor, textShadow }}>Top of funnel</div>
          <div style={{ marginTop: 12, fontSize: 34, lineHeight: 1.35, color: subTextColor, textShadow }}>
            Show how a few concepts relate sequentially, from top to bottom.
          </div>
        </div>
        <div style={{ position: 'relative', height: 520, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 520, height: 420, clipPath: 'polygon(0 0, 100% 0, 62% 100%, 38% 100%)', background: '#d0d0d0', position: 'relative', overflow: 'hidden' }}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} style={{ position: 'absolute', left: 0, right: 0, top: `${(i + 1) * 20}%`, height: 3, background: '#ececec' }} />
            ))}
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} style={{ position: 'absolute', left: '50%', top: `${9 + i * 20}%`, transform: 'translateX(-50%)', fontSize: 28, fontWeight: 600, color: '#111' }}>
                Label
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (id === 'figma-27' || id === 'figma-28') {
    const compact = id === 'figma-28';
    return (
      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', display: compact ? 'block' : 'grid', gridTemplateColumns: compact ? undefined : '1fr 1.2fr', gap: 30, padding: compact ? '8% 8%' : '8% 8%', alignItems: 'stretch' }}>
        {!compact && (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'left' }}>
            <div style={{ fontSize: 60, fontWeight: 700, color: textColor, textShadow }}>Desktop designs</div>
            <div style={{ marginTop: 12, fontSize: 34, lineHeight: 1.35, color: subTextColor, textShadow }}>
              Support your visuals with a bit of context, then link away to the designs.
            </div>
          </div>
        )}
        <div style={{ position: 'relative', height: compact ? 640 : 520, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ width: compact ? 1120 : 860, maxWidth: '100%', height: compact ? 540 : 430, borderRadius: '26px 26px 10px 10px', border: '8px solid #0f0f0f', borderBottomWidth: 10, background: '#dbdbdb', position: 'relative', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
            <div style={{ position: 'absolute', left: '50%', top: 0, transform: 'translateX(-50%)', width: 86, height: 24, borderRadius: '0 0 10px 10px', background: '#0f0f0f' }} />
            <div style={{ position: 'absolute', inset: 10, background: 'repeating-conic-gradient(#ececec 0% 25%, #dfdfdf 0% 50%) 50% / 44px 44px' }} />
          </div>
          <div style={{ position: 'absolute', bottom: 0, width: compact ? 1240 : 980, maxWidth: '108%', height: 34, borderRadius: 16, background: 'linear-gradient(180deg, #d6d6d6 0%, #b8b8b8 100%)', border: '1px solid #b0b0b0' }} />
        </div>
      </div>
    );
  }

  if (id === 'figma-29') {
    return (
      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 84, height: 84, borderRadius: '50%', background: 'repeating-conic-gradient(#ececec 0% 25%, #dfdfdf 0% 50%) 50% / 18px 18px', marginBottom: 28 }} />
        <div style={{ fontSize: 52, color: textColor, textShadow, maxWidth: 920, textAlign: 'center', lineHeight: 1.25 }}>
          “This is a stellar quote from a user or customer that really stands out.”
        </div>
        <div style={{ marginTop: 14, fontSize: 28, color: subTextColor, textShadow }}>Full Name · Location</div>
      </div>
    );
  }

  if (id === 'figma-30' || id === 'figma-31' || id === 'figma-32') {
    const count = id === 'figma-30' ? 3 : id === 'figma-31' ? 4 : 2;
    return (
      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', display: 'grid', gridTemplateColumns: `repeat(${count}, 1fr)`, gap: id === 'figma-31' ? 24 : 42, alignItems: 'center', padding: '0 6%' }}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div style={{ width: 84, height: 84, borderRadius: '50%', background: 'repeating-conic-gradient(#ececec 0% 25%, #dfdfdf 0% 50%) 50% / 18px 18px', margin: '0 auto 22px' }} />
            <div style={{ fontSize: id === 'figma-31' ? 40 : 46, color: textColor, textShadow, lineHeight: 1.25 }}>
              “The best quotes relate to your deck&apos;s overall narrative.”
            </div>
            <div style={{ marginTop: 12, fontSize: 28, color: subTextColor, textShadow }}>Full Name · Location</div>
          </div>
        ))}
      </div>
    );
  }

  if (id === 'figma-33') {
    return (
      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', padding: '18% 6% 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 44, marginBottom: 72 }}>
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={`top-${i}`} style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 54, lineHeight: 1.24, color: textColor, textShadow }}>
                “The best quotes relate to your deck&apos;s overall narrative.”
              </div>
              <div style={{ marginTop: 12, fontSize: 30, color: subTextColor, textShadow }}>Full Name · Location</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 44 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={`bottom-${i}`} style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 54, lineHeight: 1.24, color: textColor, textShadow }}>
                “The best quotes relate to your deck&apos;s overall narrative.”
              </div>
              <div style={{ marginTop: 12, fontSize: 30, color: subTextColor, textShadow }}>Full Name · Location</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (id === 'figma-34') {
    return (
      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 56, alignItems: 'center', padding: '0 8%' }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 54, lineHeight: 1.24, color: textColor, textShadow }}>
              “The best quotes relate to your deck&apos;s overall narrative.”
            </div>
            <div style={{ marginTop: 12, fontSize: 30, color: subTextColor, textShadow }}>Full Name · Location</div>
          </div>
        ))}
      </div>
    );
  }

  if (id === 'figma-35') {
    const topRow = 6;
    const bottomRow = 5;
    return (
      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', padding: '8% 5% 0' }}>
        <div style={{ fontSize: 64, fontWeight: 700, textAlign: 'center', color: textColor, textShadow }}>Meet the team</div>
        <div style={{ marginTop: 54, display: 'grid', gridTemplateColumns: `repeat(${topRow}, 1fr)`, gap: 26 }}>
          {Array.from({ length: topRow }).map((_, i) => (
            <div key={`t-${i}`} style={{ textAlign: 'center' }}>
              <div style={{ width: 86, height: 86, borderRadius: '50%', background: 'repeating-conic-gradient(#ececec 0% 25%, #dfdfdf 0% 50%) 50% / 18px 18px', margin: '0 auto 14px' }} />
              <div style={{ fontSize: 36, color: textColor, textShadow }}>Full Name</div>
              <div style={{ marginTop: 8, fontSize: 34, color: subTextColor, textShadow }}>Role</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 44, display: 'grid', gridTemplateColumns: `repeat(${bottomRow}, 1fr)`, gap: 34, padding: '0 8%' }}>
          {Array.from({ length: bottomRow }).map((_, i) => (
            <div key={`b-${i}`} style={{ textAlign: 'center' }}>
              <div style={{ width: 86, height: 86, borderRadius: '50%', background: 'repeating-conic-gradient(#ececec 0% 25%, #dfdfdf 0% 50%) 50% / 18px 18px', margin: '0 auto 14px' }} />
              <div style={{ fontSize: 36, color: textColor, textShadow }}>Full Name</div>
              <div style={{ marginTop: 8, fontSize: 34, color: subTextColor, textShadow }}>Role</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
