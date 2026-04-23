export type SceneMode = 'slide' | 'scene';

export interface SlideMedia {
  /** Server-relative or absolute URL */
  url: string;
  /** 'image' | 'video' — inferred from source when added */
  kind: 'image' | 'video';
  /** Display name (filename) */
  name?: string;
  /** Design mode: box as % of slide stage (top-left origin) */
  layout?: { x: number; y: number; w: number; h: number };
}

export interface SlideLink {
  url: string;
  label?: string;
}

export interface SlideFile {
  /** Served URL — usually /api/assets/file/... */
  url: string;
  name: string;
  /** Document type hint for icon / open behavior */
  kind: 'pdf' | 'doc' | 'other';
  mimeType?: string;
  /** Bytes — optional metadata for display */
  size?: number;
}

export type BackgroundPresetKind =
  | 'darkVeil'
  | 'grainient'
  | 'particles'
  | 'iridescence'
  | 'solidBlack'
  | 'solidWhite'
  | 'customImage';

export interface SlideBackground {
  kind: BackgroundPresetKind;
  params?: Record<string, number | boolean | string>;
}

export interface TemplateTextBlock {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontWeight?: number;
  maxWidth?: number;
  zIndex?: number;
}

export interface SlideTextStyle {
  /** User-selected scale within a safe visual range */
  sizeScale?: number;
  fontFamily?: string;
  fontWeight?: 300 | 500 | 700;
  color?: string;
  motionPreset?: string;
  motionIntensity?: number;
  motionSpeed?: number;
}

export interface SlideAnnotation {
  id: string;
  type: 'draw' | 'text' | 'comment' | 'image';
  x: number;
  y: number;
  /** For draw: array of points in percentage relative to slide width/height */
  points?: { x: number; y: number }[];
  /** For text and comment */
  text?: string;
  /** For image */
  url?: string;
  width?: number;
  height?: number;
  color?: string;
}

export interface Slide {
  id: number;
  templateId?: string;
  title: string;
  content: string;
  speakerNotes: string;
  visualType: 'title' | 'bullets' | 'table' | 'quote' | 'image';
  allowQA: boolean;
  sceneMode?: SceneMode;
  autoAdvanceMs?: number;
  linkedAssetIds?: string[];

  /** Private comment (not shown to audience, only for slide author) */
  comment?: string;
  /** External links the agent can reference or that render as chips */
  links?: SlideLink[];
  /** Media attachments displayed full-bleed behind content, or inline */
  media?: SlideMedia[];
  /** Files (PDF, doc) attached to this slide — rendered as chips */
  files?: SlideFile[];
  /** Animated background preset config */
  background?: SlideBackground;
  /** Draggable/editable preset text blocks */
  templateTextBlocks?: TemplateTextBlock[];
  /** Preset text style controls from right panel */
  textStyle?: SlideTextStyle;
  /** Short topic labels used by the agent to decide when to navigate here. */
  labels?: string[];
  /** Presentation annotations: freehand drawings, text boxes, comments, images */
  annotations?: SlideAnnotation[];
}

export type AssetType = 'pdf' | 'image' | 'figma' | 'url' | 'note' | 'video';

export interface Asset {
  id: string;
  type: AssetType;
  name: string;
  createdAt: number;
  url?: string;
  fileUrl?: string;
  extractedText?: string;
  note?: string;
  metadata?: {
    pageCount?: number;
    mimeType?: string;
    size?: number;
    figmaFileKey?: string;
    figmaNodeId?: string;
  };
}

export interface AgentSettings {
  voice: string;
  speakingRate: number;
  pitch: number;
  autonomousMode: boolean;
  autoAdvance: boolean;
  interruptSensitivity: 'low' | 'medium' | 'high';
  resumeStrategy: 'continue' | 'recap' | 'next';
}

export interface Presentation {
  title: string;
  systemPrompt: string;
  knowledge: string;
  slides: Slide[];
  assets?: Asset[];
  agentSettings?: AgentSettings;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export type AgentMode = 'idle' | 'presenting' | 'qa' | 'listening' | 'speaking';
