import { Children, isValidElement, cloneElement } from 'react';
import type { ReactNode, CSSProperties, ReactElement } from 'react';
import type { TemplateTextBlock } from '@shared/types';

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
    ['--motion-intensity' as string]: safeIntensity,
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
  const element = node as ReactElement<{ style?: CSSProperties; children?: ReactNode }>;
  const style = (element.props?.style ?? {}) as CSSProperties;
  const nextStyle: CSSProperties = { ...style };

  const textKeys: Array<keyof CSSProperties> = ['fontSize', 'lineHeight', 'letterSpacing'];
  const spaceKeys: Array<keyof CSSProperties> = [
    'margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
    'padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
    'gap', 'columnGap', 'rowGap',
  ];

  textKeys.forEach((k) => {
    if (nextStyle[k] !== undefined) nextStyle[k] = scaleNumericStyle(nextStyle[k], textScale) as never;
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
    if (nextStyle[k] !== undefined) nextStyle[k] = scaleNumericStyle(nextStyle[k], spacingScale) as never;
  });

  const children = element.props?.children;
  const normalizedChildren = children === undefined
    ? children
    : Children.map(children, (c) => normalizePresetTree(c, textScale, spacingScale, typography, motion));

  return cloneElement(element, { style: nextStyle }, normalizedChildren);
}
