/**
 * Ambient Gradient — state-to-visual mapping.
 *
 * State is discrete (logic), expression is continuous (rendering).
 * All numbers here are target values the renderer interpolates toward.
 *
 * Tune individual parameters without changing the renderer.
 */

export type GradientState =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'acting'
  | 'confirming'
  | 'warning';

export interface GradientVisual {
  /** Primary hue range (degrees, 0-360). Two values blend to suggest internal shift. */
  hueA: number;
  hueB: number;
  /** 0..1 — kept low for ambient feel */
  saturation: number;
  /** 0..1 — overall lightness (approaches 1 = near-white) */
  brightness: number;
  /** 0..1 — visibility of the light sources against base */
  contrast: number;
  /** 0.5..1.8 — how far light sources spread across the canvas */
  spread: number;
  /** 0..1.5 — tempo of drift + color shifting */
  speed: number;
  /** 0..1 — breathing amplitude of the lights */
  pulse: number;
  /** px — blur amount applied to the canvas (atmospheric softness) */
  softness: number;
  /** 0..1 — directional bias. 0 = omnidirectional, 1 = strongly biased */
  directionality: number;
  /** Direction angle in radians (used when directionality > 0) */
  direction: number;
  /** base background lightness 0..1 (usually ~0.99 to blend with white UI) */
  base: number;
}

/**
 * Palette philosophy — subtle, low-saturation tints.
 * Matches Genesis white/hairline aesthetic: mostly near-white, color hints peripherally.
 */
export const STATE_MAP: Record<GradientState, GradientVisual> = {
  idle: {
    // calm cool blue-gray — clearly visible presence
    hueA: 210,
    hueB: 248,
    saturation: 0.18,
    brightness: 0.91,
    contrast: 0.72,
    spread: 1.3,
    speed: 0.25,
    pulse: 0.32,
    softness: 85,
    directionality: 0,
    direction: 0,
    base: 0.975,
  },
  listening: {
    // attentive, slight cyan, directional toward right (source of voice)
    hueA: 198,
    hueB: 220,
    saturation: 0.16,
    brightness: 0.92,
    contrast: 0.52,
    spread: 0.95,
    speed: 0.38,
    pulse: 0.5,
    softness: 95,
    directionality: 0.35,
    direction: -Math.PI / 2, // upward — "leaning forward"
    base: 0.985,
  },
  thinking: {
    // fluid violet — internal activity
    hueA: 258,
    hueB: 295,
    saturation: 0.14,
    brightness: 0.93,
    contrast: 0.6,
    spread: 1.35,
    speed: 0.78,
    pulse: 0.65,
    softness: 88,
    directionality: 0,
    direction: 0,
    base: 0.985,
  },
  acting: {
    // focused teal, crisper edges
    hueA: 182,
    hueB: 202,
    saturation: 0.2,
    brightness: 0.9,
    contrast: 0.78,
    spread: 0.82,
    speed: 0.55,
    pulse: 0.55,
    softness: 72,
    directionality: 0.15,
    direction: 0,
    base: 0.97,
  },
  confirming: {
    // resolved, gentle warm white with soft green undertone
    hueA: 140,
    hueB: 160,
    saturation: 0.1,
    brightness: 0.96,
    contrast: 0.5,
    spread: 1.5,
    speed: 0.22,
    pulse: 0.28,
    softness: 118,
    directionality: 0,
    direction: 0,
    base: 0.995,
  },
  warning: {
    // compressed amber — tension but elegant, not alarming red
    hueA: 18,
    hueB: 38,
    saturation: 0.26,
    brightness: 0.88,
    contrast: 0.98,
    spread: 0.7,
    speed: 0.92,
    pulse: 0.85,
    softness: 62,
    directionality: 0.25,
    direction: Math.PI, // bias leftward
    base: 0.965,
  },
};

/**
 * Bridge from domain agent state → gradient state.
 * Keep this mapping here so the rest of the app only deals with its own vocab.
 */
import type { AgentMode } from '../../types';

export function mapAgentMode(mode: AgentMode): GradientState {
  switch (mode) {
    case 'idle':       return 'idle';
    case 'listening':  return 'listening';
    case 'qa':         return 'thinking';
    case 'presenting': return 'acting';
    case 'speaking':   return 'acting';
    default:           return 'idle';
  }
}
