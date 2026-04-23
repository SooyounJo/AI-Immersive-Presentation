import type { CSSProperties } from 'react';
import type { BackgroundPresetKind } from '../types';

function swatchStyle(kind: BackgroundPresetKind): CSSProperties {
  switch (kind) {
    case 'iridescence':
      return {
        background: 'conic-gradient(from 210deg at 38% 42%, #6366f1 0deg, #c084fc 95deg, #22d3ee 195deg, #fbcfe8 285deg, #818cf8 360deg)',
      };
    case 'particles': {
      const dots = [
        '12% 18%', '58% 12%', '82% 28%', '24% 48%', '71% 44%', '48% 62%',
        '88% 58%', '16% 72%', '44% 86%', '76% 78%', '32% 32%', '63% 68%',
      ];
      const layers = dots.map(
        (pos) =>
          `radial-gradient(circle at ${pos}, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.92) 1.2px, transparent 2.4px)`,
      );
      return {
        backgroundColor: '#050508',
        backgroundImage: layers.join(', '),
      };
    }
    case 'grainient':
      return {
        background: 'linear-gradient(122deg, #f9a8d4 0%, #c084fc 35%, #6366f1 72%, #312e81 100%)',
      };
    case 'darkVeil':
      return {
        background: 'linear-gradient(165deg, #020410 0%, #0a1628 38%, #143d6b 78%, #1c4f8c 100%)',
      };
    case 'solidBlack':
      return { background: '#0a0a0a' };
    case 'solidWhite':
      return { background: '#ffffff' };
    case 'customImage':
      return {
        background: 'linear-gradient(145deg, #e4e8ef 0%, #cdd5e0 55%, #b8c2d4 100%)',
      };
    default:
      return { background: '#2a2a2a' };
  }
}

function useLightLabel(kind: BackgroundPresetKind): boolean {
  return kind === 'solidWhite' || kind === 'customImage';
}

function labelStyleFor(kind: BackgroundPresetKind, lightUi: boolean): CSSProperties {
  const lightLabel = useLightLabel(kind);
  if (lightUi) {
    return {
      color: '#0f172a',
      background: 'rgba(255, 255, 255, 0.45)',
    };
  }
  return {
    color: lightLabel ? 'var(--gen-text)' : '#f8fafc',
    background: lightLabel ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.25)',
  };
}

export function BackgroundPresetTile({
  kind,
  label,
  selected,
  onClick,
  lightUi = false,
}: {
  kind: BackgroundPresetKind;
  label: string;
  selected: boolean;
  onClick: () => void;
  /** Morning / light panel: dark labels + no brightness hover washout */
  lightUi?: boolean;
}) {
  const tileClass = [
    'gen-bg-preset-tile',
    lightUi ? 'gen-bg-preset-tile--light' : '',
    selected ? 'gen-bg-preset-tile--selected' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type="button" onClick={onClick} title={label} className={tileClass}>
      <span className="gen-bg-preset-tile__swatch" style={swatchStyle(kind)} aria-hidden />
      {kind === 'customImage' && (
        <span className="gen-bg-preset-tile__frame" aria-hidden />
      )}
      <span className="gen-bg-preset-tile__label" style={labelStyleFor(kind, lightUi)}>
        {label}
      </span>
    </button>
  );
}
