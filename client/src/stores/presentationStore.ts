import { create } from 'zustand';
import type { Presentation, Slide, SlideMedia, SlideLink, SlideFile, ChatMessage, AgentMode, SlideAnnotation } from '@shared/types';

export type AppMode = 'present' | 'design';
export type UiThemeMode = 'morning' | 'night';
export type PresentTool = 'pointer' | 'draw' | 'text' | 'comment';

const APP_MODE_KEY = 'presentation-agent:appMode';
const UI_THEME_KEY = 'voix:designTheme';

function readInitialAppMode(): AppMode {
  if (typeof window === 'undefined') return 'design';
  const saved = window.localStorage.getItem(APP_MODE_KEY);
  return saved === 'present' || saved === 'design' ? saved : 'design';
}

function readUiThemeMode(): UiThemeMode {
  if (typeof window === 'undefined') return 'night';
  const saved = window.localStorage.getItem(UI_THEME_KEY);
  return saved === 'morning' || saved === 'night' ? saved : 'night';
}

export interface InterruptContext {
  slideTitle: string;
  /** What the agent was saying when interrupted (full or partial narration). */
  spokenText: string;
}

interface PresentationState {
  presentation: Presentation | null;
  currentSlideIndex: number;
  agentMode: AgentMode;
  appMode: AppMode;
  activePresentTool: PresentTool;
  setActivePresentTool: (tool: PresentTool) => void;
  /** Shared with DesignView — presentation chrome follows the same light/dark mood. */
  uiThemeMode: UiThemeMode;
  setUiThemeMode: (mode: UiThemeMode) => void;
  chatMessages: ChatMessage[];
  isLoading: boolean;
  streamingText: string;

  /** True while the auto-advance presentation loop is active */
  isPlaying: boolean;
  /**
   * Monotonically increasing token — when it increments,
   * any in-flight playback loop should abort on its next checkpoint.
   */
  playbackCancelToken: number;
  setIsPlaying: (v: boolean) => void;
  cancelPlayback: () => void;

  /** Context captured at the moment the user raised their hand. */
  interruptContext: InterruptContext | null;
  setInterruptContext: (ctx: InterruptContext | null) => void;

  /** Whether the slide-overlay agent orb is visible. */
  agentVisible: boolean;
  /** Whether the right-side dialogue drawer is open. */
  dialogueOpen: boolean;
  toggleAgent: () => void;
  toggleDialogue: () => void;

  setPresentation: (p: Presentation) => void;
  nextSlide: () => void;
  prevSlide: () => void;
  goToSlide: (index: number) => void;
  setAgentMode: (mode: AgentMode) => void;
  setAppMode: (mode: AppMode) => void;
  addMessage: (msg: ChatMessage) => void;
  setLoading: (loading: boolean) => void;
  setStreamingText: (text: string) => void;
  appendStreamingText: (chunk: string) => void;
  currentSlide: () => Slide | null;

  // Design actions
  updateMeta: (patch: Partial<Pick<Presentation, 'title' | 'systemPrompt' | 'knowledge'>>) => void;
  updateSlide: (index: number, patch: Partial<Slide>) => void;
  addSlide: (partial?: Partial<Slide>) => void;
  deleteSlide: (index: number) => void;
  moveSlide: (from: number, to: number) => void;
  setSlides: (slides: Slide[]) => void;

  // Slide-level media / link / comment helpers
  addSlideAnnotation: (index: number, annotation: SlideAnnotation) => void;
  updateSlideAnnotation: (index: number, annotationId: string, patch: Partial<SlideAnnotation>) => void;
  removeSlideAnnotation: (index: number, annotationId: string) => void;
  addSlideMedia: (index: number, media: SlideMedia) => void;
  removeSlideMedia: (index: number, mediaUrl: string) => void;
  addSlideLink: (index: number, link: SlideLink) => void;
  removeSlideLink: (index: number, linkUrl: string) => void;
  addSlideFile: (index: number, file: SlideFile) => void;
  removeSlideFile: (index: number, fileUrl: string) => void;

  // Bulk import — append many slides at once (used by PDF-to-slides)
  appendSlides: (slides: Partial<Slide>[]) => void;
}

export const usePresentationStore = create<PresentationState>((set, get) => ({
  presentation: null,
  currentSlideIndex: 0,
  agentMode: 'idle',
  appMode: readInitialAppMode(),
  activePresentTool: 'pointer',
  setActivePresentTool: (tool) => set({ activePresentTool: tool }),
  uiThemeMode: readUiThemeMode(),
  setUiThemeMode: (mode) => {
    if (typeof window !== 'undefined') window.localStorage.setItem(UI_THEME_KEY, mode);
    set({ uiThemeMode: mode });
  },
  chatMessages: [],
  isLoading: false,
  streamingText: '',

  isPlaying: false,
  playbackCancelToken: 0,
  setIsPlaying: (v) => set({ isPlaying: v }),
  cancelPlayback: () => set((s) => ({ isPlaying: false, playbackCancelToken: s.playbackCancelToken + 1 })),

  interruptContext: null,
  setInterruptContext: (ctx) => set({ interruptContext: ctx }),

  agentVisible: true,
  dialogueOpen: false,
  toggleAgent: () => set((s) => ({ agentVisible: !s.agentVisible })),
  toggleDialogue: () => set((s) => ({ dialogueOpen: !s.dialogueOpen })),

  setPresentation: (p) => set({ presentation: p }),
  nextSlide: () => {
    const { currentSlideIndex, presentation } = get();
    if (presentation && currentSlideIndex < presentation.slides.length - 1) {
      set({ currentSlideIndex: currentSlideIndex + 1, chatMessages: [], streamingText: '' });
    }
  },
  prevSlide: () => {
    const { currentSlideIndex } = get();
    if (currentSlideIndex > 0) {
      set({ currentSlideIndex: currentSlideIndex - 1, chatMessages: [], streamingText: '' });
    }
  },
  goToSlide: (index) => set({ currentSlideIndex: index, chatMessages: [], streamingText: '' }),
  setAgentMode: (mode) => set({ agentMode: mode }),
  setAppMode: (mode) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(APP_MODE_KEY, mode);
    }
    set({ appMode: mode });
  },
  addMessage: (msg) => set((s) => ({ chatMessages: [...s.chatMessages, msg] })),
  setLoading: (loading) => set({ isLoading: loading }),
  setStreamingText: (text) => set({ streamingText: text }),
  appendStreamingText: (chunk) => set((s) => ({ streamingText: s.streamingText + chunk })),
  currentSlide: () => {
    const { presentation, currentSlideIndex } = get();
    return presentation?.slides[currentSlideIndex] ?? null;
  },

  updateMeta: (patch) => set((s) => s.presentation
    ? { presentation: { ...s.presentation, ...patch } }
    : s),
  updateSlide: (index, patch) => set((s) => {
    if (!s.presentation) return s;
    const slides = s.presentation.slides.map((sl, i) => i === index ? { ...sl, ...patch } : sl);
    return { presentation: { ...s.presentation, slides } };
  }),
  addSlide: (partial) => set((s) => {
    if (!s.presentation) return s;
    const newId = Math.max(0, ...s.presentation.slides.map(x => x.id)) + 1;
    const newSlide: Slide = {
      id: newId,
      title: '새 슬라이드',
      content: '## 새 슬라이드\n\n내용을 작성하세요.',
      speakerNotes: '이 슬라이드에서 발표자가 말할 내용을 입력하세요.',
      visualType: 'bullets',
      allowQA: true,
      ...partial,
    };
    const slides = [...s.presentation.slides, newSlide];
    return {
      presentation: { ...s.presentation, slides },
      currentSlideIndex: slides.length - 1,
      chatMessages: [],
      streamingText: '',
    };
  }),
  deleteSlide: (index) => set((s) => {
    if (!s.presentation || s.presentation.slides.length <= 1) return s;
    const slides = s.presentation.slides.filter((_, i) => i !== index);
    const newIndex = Math.min(s.currentSlideIndex, slides.length - 1);
    return { presentation: { ...s.presentation, slides }, currentSlideIndex: newIndex };
  }),
  moveSlide: (from, to) => set((s) => {
    if (!s.presentation) return s;
    const slides = [...s.presentation.slides];
    if (to < 0 || to >= slides.length) return s;
    const [moved] = slides.splice(from, 1);
    slides.splice(to, 0, moved);
    return { presentation: { ...s.presentation, slides } };
  }),
  setSlides: (slides) => set((s) => s.presentation
    ? { presentation: { ...s.presentation, slides } }
    : s),

  addSlideAnnotation: (index, annotation) => set((s) => {
    if (!s.presentation) return s;
    const slides = s.presentation.slides.map((sl, i) => {
      if (i !== index) return sl;
      const existing = sl.annotations ?? [];
      return { ...sl, annotations: [...existing, annotation] };
    });
    return { presentation: { ...s.presentation, slides } };
  }),
  updateSlideAnnotation: (index, annotationId, patch) => set((s) => {
    if (!s.presentation) return s;
    const slides = s.presentation.slides.map((sl, i) => {
      if (i !== index) return sl;
      const existing = sl.annotations ?? [];
      return {
        ...sl,
        annotations: existing.map((a) => (a.id === annotationId ? { ...a, ...patch } : a)),
      };
    });
    return { presentation: { ...s.presentation, slides } };
  }),
  removeSlideAnnotation: (index, annotationId) => set((s) => {
    if (!s.presentation) return s;
    const slides = s.presentation.slides.map((sl, i) => {
      if (i !== index) return sl;
      const existing = sl.annotations ?? [];
      return { ...sl, annotations: existing.filter((a) => a.id !== annotationId) };
    });
    return { presentation: { ...s.presentation, slides } };
  }),

  addSlideMedia: (index, media) => set((s) => {
    if (!s.presentation) return s;
    const slides = s.presentation.slides.map((sl, i) => {
      if (i !== index) return sl;
      const existing = sl.media ?? [];
      // Avoid duplicates
      if (existing.some((m) => m.url === media.url)) return sl;
      return { ...sl, media: [...existing, media] };
    });
    return { presentation: { ...s.presentation, slides } };
  }),
  removeSlideMedia: (index, mediaUrl) => set((s) => {
    if (!s.presentation) return s;
    const slides = s.presentation.slides.map((sl, i) =>
      i === index ? { ...sl, media: (sl.media ?? []).filter((m) => m.url !== mediaUrl) } : sl,
    );
    return { presentation: { ...s.presentation, slides } };
  }),
  addSlideLink: (index, link) => set((s) => {
    if (!s.presentation) return s;
    const slides = s.presentation.slides.map((sl, i) => {
      if (i !== index) return sl;
      const existing = sl.links ?? [];
      if (existing.some((l) => l.url === link.url)) return sl;
      return { ...sl, links: [...existing, link] };
    });
    return { presentation: { ...s.presentation, slides } };
  }),
  removeSlideLink: (index, linkUrl) => set((s) => {
    if (!s.presentation) return s;
    const slides = s.presentation.slides.map((sl, i) =>
      i === index ? { ...sl, links: (sl.links ?? []).filter((l) => l.url !== linkUrl) } : sl,
    );
    return { presentation: { ...s.presentation, slides } };
  }),
  addSlideFile: (index, file) => set((s) => {
    if (!s.presentation) return s;
    const slides = s.presentation.slides.map((sl, i) => {
      if (i !== index) return sl;
      const existing = sl.files ?? [];
      if (existing.some((f) => f.url === file.url)) return sl;
      return { ...sl, files: [...existing, file] };
    });
    return { presentation: { ...s.presentation, slides } };
  }),
  removeSlideFile: (index, fileUrl) => set((s) => {
    if (!s.presentation) return s;
    const slides = s.presentation.slides.map((sl, i) =>
      i === index ? { ...sl, files: (sl.files ?? []).filter((f) => f.url !== fileUrl) } : sl,
    );
    return { presentation: { ...s.presentation, slides } };
  }),
  appendSlides: (partials) => set((s) => {
    if (!s.presentation) return s;
    let nextId = Math.max(0, ...s.presentation.slides.map((x) => x.id)) + 1;
    const newSlides: Slide[] = partials.map((p) => ({
      id: nextId++,
      title: p.title ?? '새 슬라이드',
      content: p.content ?? '',
      speakerNotes: p.speakerNotes ?? '',
      visualType: p.visualType ?? 'image',
      allowQA: p.allowQA ?? true,
      ...p,
    }));
    return { presentation: { ...s.presentation, slides: [...s.presentation.slides, ...newSlides] } };
  }),
}));
