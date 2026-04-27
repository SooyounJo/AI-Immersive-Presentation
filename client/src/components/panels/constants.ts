import type { CSSProperties } from 'react';
import type { BackgroundPresetKind } from '@shared/types';

export type BgPaletteItem = { name: string; color: string; params: Record<string, number> };

/** Collapsed accordion row — same dimensions for Background / Gen Text / Text Style */
export const PRESET_FOLD_HEADER_STYLE: CSSProperties = {
  padding: '8px 12px',
  minHeight: 44,
  width: '100%',
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

export const SECTION_CONTAINER_STYLE = (isNight: boolean): CSSProperties => ({
  border: '1px solid var(--gen-border)',
  background: isNight ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.65)',
  backdropFilter: 'blur(8px)',
  borderRadius: 4,
  overflow: 'hidden',
  transition: 'all var(--gen-fast)',
  width: '100%',
  boxSizing: 'border-box',
});

export const BACKGROUND_PRESETS: Array<{
  kind: BackgroundPresetKind;
  label: string;
  params: Array<{ key: string; label: string; min: number; max: number; step: number }>;
  defaults: Record<string, number>;
}> = [
  {
    kind: 'iridescence',
    label: 'Iridescence',
    params: [
      { key: 'speed', label: 'Speed', min: 0, max: 2, step: 0.05 },
      { key: 'amplitude', label: 'Amplitude', min: 0, max: 0.6, step: 0.01 },
      { key: 'colorR', label: 'Red', min: 0, max: 1, step: 0.01 },
      { key: 'colorB', label: 'Blue', min: 0, max: 1, step: 0.01 },
    ],
    defaults: { speed: 1, amplitude: 0.1, colorR: 0.5, colorG: 0.6, colorB: 0.8 },
  },
  {
    kind: 'particles',
    label: 'Particles',
    params: [
      { key: 'particleCount', label: 'Count', min: 40, max: 400, step: 10 },
      { key: 'speed', label: 'Speed', min: 0.02, max: 0.8, step: 0.01 },
      { key: 'particleSpread', label: 'Spread', min: 3, max: 20, step: 0.5 },
      { key: 'particleBaseSize', label: 'Size', min: 20, max: 180, step: 5 },
    ],
    defaults: { particleCount: 180, speed: 0.12, particleSpread: 10, particleBaseSize: 90, colorR: 1, colorG: 1, colorB: 1 },
  },
  {
    kind: 'grainient',
    label: 'Grainient',
    params: [
      { key: 'timeSpeed', label: 'Speed', min: 0, max: 1, step: 0.01 },
      { key: 'warpFrequency', label: 'Warp Freq', min: 1, max: 10, step: 0.1 },
      { key: 'grainAmount', label: 'Grain', min: 0, max: 0.4, step: 0.01 },
      { key: 'contrast', label: 'Contrast', min: 0.5, max: 2.5, step: 0.05 },
    ],
    defaults: { timeSpeed: 0.62, warpFrequency: 6.8, warpSpeed: 2.8, grainAmount: 0.11, contrast: 1.25, saturation: 1, zoom: 0.9, colorR: 1, colorG: 1, colorB: 1 },
  },
  {
    kind: 'darkVeil',
    label: 'Dark Veil',
    params: [
      { key: 'speed', label: 'Speed', min: 0, max: 2, step: 0.05 },
      { key: 'warpAmount', label: 'Warp', min: 0, max: 2, step: 0.05 },
      { key: 'noiseIntensity', label: 'Noise', min: 0, max: 0.4, step: 0.01 },
      { key: 'hueShift', label: 'Hue', min: -180, max: 180, step: 1 },
    ],
    defaults: { speed: 0.7, warpAmount: 0.32, noiseIntensity: 0.02, hueShift: -8, scanlineIntensity: 0.05, scanlineFrequency: 1.45 },
  },
];

export const BG_PALETTES: Partial<Record<BackgroundPresetKind, BgPaletteItem[]>> = {
  darkVeil: [
    { name: 'Steel Blue', color: '#4a78cf', params: { hueShift: -8, colorR: 0.95, colorG: 0.98, colorB: 1.1 } },
    { name: 'Cyan Blue', color: '#3ca4ff', params: { hueShift: 12, colorR: 0.85, colorG: 1.0, colorB: 1.15 } },
    { name: 'Graphite', color: '#5a6372', params: { hueShift: -35, colorR: 0.78, colorG: 0.82, colorB: 0.9 } },
    { name: 'Night Navy', color: '#253a6f', params: { hueShift: -20, colorR: 0.88, colorG: 0.9, colorB: 1.08 } },
  ],
  grainient: [
    { name: 'Blue Gray', color: '#7e93bf', params: { colorR: 0.78, colorG: 0.86, colorB: 1.02 } },
    { name: 'Cool Blue', color: '#6ea5ff', params: { colorR: 0.72, colorG: 0.88, colorB: 1.12 } },
    { name: 'Neutral Gray', color: '#8a8f9d', params: { colorR: 0.82, colorG: 0.82, colorB: 0.86 } },
    { name: 'Deep Navy', color: '#3e517f', params: { colorR: 0.68, colorG: 0.78, colorB: 1.02 } },
  ],
  particles: [
    { name: 'Pure White', color: '#ffffff', params: { colorR: 1, colorG: 1, colorB: 1 } },
    { name: 'Ice Blue', color: '#b8d7ff', params: { colorR: 0.72, colorG: 0.84, colorB: 1 } },
    { name: 'Soft Gray', color: '#b9bec7', params: { colorR: 0.73, colorG: 0.75, colorB: 0.78 } },
    { name: 'Sky Blue', color: '#6aa9ff', params: { colorR: 0.42, colorG: 0.66, colorB: 1 } },
  ],
  iridescence: [
    { name: 'Ocean', color: '#4d83e6', params: { colorR: 0.38, colorG: 0.52, colorB: 0.92 } },
    { name: 'Arctic', color: '#73bbff', params: { colorR: 0.46, colorG: 0.74, colorB: 1 } },
    { name: 'Indigo', color: '#5f67d9', params: { colorR: 0.42, colorG: 0.46, colorB: 0.86 } },
    { name: 'Slate', color: '#8792a5', params: { colorR: 0.58, colorG: 0.62, colorB: 0.72 } },
  ],
};

export const MOTION_PRESETS: Array<{ id: string; label: string }> = [
  { id: 'none', label: 'None' },
  { id: 'vibrate', label: 'Vibration' },
  { id: 'bounce', label: 'Bounce' },
  { id: 'pulse', label: 'Pulse' },
  { id: 'float', label: 'Float' },
  { id: 'wave', label: 'Wave' },
  { id: 'swing', label: 'Swing' },
  { id: 'jello', label: 'Jello' },
  { id: 'wobble', label: 'Wobble' },
  { id: 'shakeX', label: 'Horizontal Shake' },
  { id: 'shakeY', label: 'Vertical Shake' },
  { id: 'flipX', label: 'Flip X' },
  { id: 'flipY', label: 'Flip Y' },
  { id: 'tilt', label: 'Tilt' },
  { id: 'zoomInOut', label: 'Zoom In/Out' },
  { id: 'breath', label: 'Breathing' },
  { id: 'flicker', label: 'Blinking' },
  { id: 'heartbeat', label: 'Heartbeat' },
  { id: 'rubberBand', label: 'Rubber Band' },
  { id: 'roll', label: 'Roll' },
];

export const sizeOptions = [
  { label: '14px', scale: 0.72 },
  { label: '16px', scale: 0.82 },
  { label: '18px', scale: 0.92 },
  { label: '20px', scale: 1.0 },
];

export const fontOptions = ['Pretendard', 'Inter', 'Noto Sans KR', 'SUIT', 'IBM Plex Sans KR'];

export const fontWeightOptions: Array<{ label: 'Light' | 'Medium' | 'Bold'; value: 300 | 500 | 700 }> = [
  { label: 'Light', value: 300 },
  { label: 'Medium', value: 500 },
  { label: 'Bold', value: 700 },
];

export const hyundaiPalette = ['#FFFFFF', '#002C5F', '#005BAC', '#4A90E2', '#00AAD2', '#0B1F3A', '#111111', '#2D2D2D', '#6B7280', '#D9DDE3'];

export const ALL_BUNDLED_ASSET_FILES = [
  'hyundai-logo-primary.svg',
  'hyundai-logo-white.svg',
  'icon-home-outline.svg',
  'icon-home-filled.svg',
  'icon-arrow-left.svg',
  'icon-arrow-right.svg',
  'icon-voice-wave.svg',
  'icon-export.svg',
  'icon-edit-pencil.svg',
  'brand-symbol-h.svg',
];
