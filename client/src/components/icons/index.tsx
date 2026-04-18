/**
 * One UI Design Kit inspired icon set — recreated as SVGs from Figma nodes:
 *   Images       799:2044
 *   Web          340:8897
 *   ArrowDown    340:8893
 *   ArrowRight   340:8891
 *   Settings     340:8610
 *
 * All icons: 24×24 viewBox, strokeWidth 1.5, currentColor — theme-aware.
 */
import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number | string };

function base(size: number | string = 24, props: SVGProps<SVGSVGElement> = {}): SVGProps<SVGSVGElement> {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    ...props,
  };
}

export function IconImages({ size, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      {/* Back image */}
      <rect x="7" y="3" width="14" height="14" rx="1.5" />
      {/* Small sun + mountain inside */}
      <circle cx="11" cy="7.5" r="1" />
      <path d="M21 13 L16 9 L11 14" />
      {/* Front image (offset) */}
      <rect x="3" y="7" width="14" height="14" rx="1.5" fill="currentColor" fillOpacity="0.08" />
    </svg>
  );
}

export function IconWeb({ size, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12 H20.5" />
      <path d="M12 3.5 C15 7 15 17 12 20.5 C9 17 9 7 12 3.5 Z" />
      <path d="M4.5 8 H19.5 M4.5 16 H19.5" opacity="0.7" />
    </svg>
  );
}

export function IconArrowDown({ size, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M6 9 L12 15 L18 9" />
    </svg>
  );
}

export function IconArrowRight({ size, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M9 6 L15 12 L9 18" />
    </svg>
  );
}

export function IconArrowLeft({ size, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M15 6 L9 12 L15 18" />
    </svg>
  );
}

export function IconSettings({ size, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      {/* Gear outer shape — 8 teeth */}
      <path d="M19.14 12.94c.04-.3.06-.62.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.61-.22l-2.39.96a7 7 0 0 0-1.62-.94l-.36-2.54a.48.48 0 0 0-.48-.42h-3.84a.48.48 0 0 0-.48.42l-.36 2.54a7 7 0 0 0-1.62.94l-2.39-.96a.5.5 0 0 0-.61.22L2.74 8.84a.5.5 0 0 0 .12.64l2.03 1.58c-.05.3-.07.62-.07.94 0 .32.02.64.07.94l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32a.5.5 0 0 0 .61.22l2.39-.96c.5.38 1.04.7 1.62.94l.36 2.54a.48.48 0 0 0 .48.42h3.84a.48.48 0 0 0 .48-.42l.36-2.54a7 7 0 0 0 1.62-.94l2.39.96a.5.5 0 0 0 .61-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

/* Additional utility icons for the design tab (kept consistent) */

export function IconPlus({ size, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M12 5 V19 M5 12 H19" />
    </svg>
  );
}

export function IconClose({ size, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M6 6 L18 18 M18 6 L6 18" />
    </svg>
  );
}

export function IconTrash({ size, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M4 7 H20" />
      <path d="M10 4 H14 A1 1 0 0 1 15 5 V7 H9 V5 A1 1 0 0 1 10 4 Z" />
      <path d="M6 7 L7 20 A1 1 0 0 0 8 21 H16 A1 1 0 0 0 17 20 L18 7" />
      <path d="M10 11 V17 M14 11 V17" />
    </svg>
  );
}

export function IconPdf({ size, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M6 3 H14 L19 8 V21 H6 Z" />
      <path d="M14 3 V8 H19" />
      <text x="8" y="17" fontSize="5" fontWeight="600" fontFamily="Inter" fill="currentColor" stroke="none">PDF</text>
    </svg>
  );
}

export function IconLink({ size, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M10 14 L14 10" />
      <path d="M9 7 L11 5 A3 3 0 0 1 15 5 L17 7 A3 3 0 0 1 17 11 L15 13" />
      <path d="M15 17 L13 19 A3 3 0 0 1 9 19 L7 17 A3 3 0 0 1 7 13 L9 11" />
    </svg>
  );
}

export function IconVideo({ size, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <rect x="3" y="6" width="13" height="12" rx="1.5" />
      <path d="M16 10 L21 7 V17 L16 14 Z" />
    </svg>
  );
}

export function IconComment({ size, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M4 5 H20 A1 1 0 0 1 21 6 V16 A1 1 0 0 1 20 17 H12 L7 21 V17 H4 A1 1 0 0 1 3 16 V6 A1 1 0 0 1 4 5 Z" />
      <path d="M8 10 H16 M8 13 H13" opacity="0.7" />
    </svg>
  );
}

export function IconMic({ size, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <rect x="9" y="3" width="6" height="12" rx="3" />
      <path d="M5 11 A7 7 0 0 0 19 11" />
      <path d="M12 18 V21 M9 21 H15" />
    </svg>
  );
}

export function IconSend({ size, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M3.5 20.5 L21 12 L3.5 3.5 L6 12 L3.5 20.5 Z" />
      <path d="M6 12 H21" />
    </svg>
  );
}

export function IconUpload({ size, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M12 16 V4" />
      <path d="M7 9 L12 4 L17 9" />
      <path d="M4 16 V19 A1 1 0 0 0 5 20 H19 A1 1 0 0 0 20 19 V16" />
    </svg>
  );
}

export function IconPlay({ size, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M7 4 L20 12 L7 20 Z" fill="currentColor" />
    </svg>
  );
}

export function IconPause({ size, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <rect x="6" y="4" width="4" height="16" fill="currentColor" />
      <rect x="14" y="4" width="4" height="16" fill="currentColor" />
    </svg>
  );
}

export function IconHand({ size, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      {/* Simple open palm — 4 fingers + thumb */}
      <path d="M8 12 V6 A1.3 1.3 0 0 1 10.6 6 V11" />
      <path d="M10.6 11 V4.5 A1.3 1.3 0 0 1 13.2 4.5 V11" />
      <path d="M13.2 11 V4.8 A1.3 1.3 0 0 1 15.8 4.8 V11" />
      <path d="M15.8 11 V7 A1.3 1.3 0 0 1 18.4 7 V14" />
      {/* Palm / wrist curve */}
      <path d="M8 12 C8 10 6.5 10 6 11 L5 14 C5 17.5 8 21 12 21 C15.5 21 18.4 18.5 18.4 14" />
    </svg>
  );
}
