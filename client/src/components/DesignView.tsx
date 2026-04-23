import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import ReactMarkdown from 'react-markdown';
import { usePresentationStore } from '../stores/presentationStore';
import type { Slide, SlideLink, SlideMedia, SlideFile } from '../types';
import { ContextPanel } from './ContextPanel';
import { InsightsPanel } from './InsightsPanel';
import { SlideBackgroundLayer } from './backgrounds/OglBackgrounds';
import { API_HOST, projectApi } from '../api';
import { useProjectsStore } from '../stores/projectsStore';
import { uploadPdfPagesAsImages, pdfToStructuredSlides } from '../utils/pdfToImages';
import {
  IconArrowLeft, IconArrowRight, IconPlus, IconClose, IconTrash,
  IconLink, IconVideo, IconImages, IconComment, IconPdf, IconUpload,
} from './icons';

export function DesignView() {
  const { currentProjectId } = useProjectsStore();
  const {
    presentation,
    currentSlideIndex,
    goToSlide,
    nextSlide,
    prevSlide,
    updateMeta,
    updateSlide,
    addSlide,
    deleteSlide,
    moveSlide,
    addSlideLink,
    removeSlideLink,
    addSlideMedia,
    removeSlideMedia,
    removeSlideFile,
    appendSlides,
  } = usePresentationStore();

  const [section] = useState<'meta' | 'slides' | 'insights'>('slides');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [canvasMode, setCanvasMode] = useState<'preview' | 'slides'>('slides');
  const [presetOpen, setPresetOpen] = useState(false);
  const [presetSceneMode, setPresetSceneMode] = useState<'slide' | 'scene'>('slide');
  const [pdfProgress, setPdfProgress] = useState<string | null>(null);
  const pdfFileInputRef = useRef<HTMLInputElement>(null);
  const pdfImageOnlyInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      const res = await fetch(`${projectApi()}/presentation`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(presentation),
      });
      if (!res.ok) throw new Error('Save failed');
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (e) {
      console.error(e);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  const applyPreset = (preset: PresetCard) => {
    addSlide({
      title: preset.title,
      content: preset.content,
      speakerNotes: preset.speakerNotes,
      visualType: preset.visualType,
      sceneMode: presetSceneMode,
      allowQA: true,
    });
    setPresetOpen(false);
  };

  const presetSeenKey = useMemo(
    () => `presentation-agent:presetSeen:${currentProjectId ?? 'default'}`,
    [currentProjectId],
  );

  useEffect(() => {
    if (!presentation) return;
    const seen = typeof window !== 'undefined' ? window.localStorage.getItem(presetSeenKey) : '1';
    if (!seen) {
      setPresetOpen(true);
      if (typeof window !== 'undefined') window.localStorage.setItem(presetSeenKey, '1');
    }
  }, [presentation, presetSeenKey]);

  if (!presentation) {
    return (
      <div className="flex h-full min-h-0" style={{ background: '#d9d9d9' }}>
        <div className="w-[208px] shrink-0" style={{ background: '#efefef', borderRight: '1px solid #dfdfdf' }} />
        <div className="flex-1 min-w-0 flex items-center justify-center" style={{ background: '#efefef' }}>
          <div style={{ fontSize: 12, letterSpacing: '0.12em', color: '#666', textTransform: 'uppercase' }}>
            Loading design board...
          </div>
        </div>
        <div className="w-[320px] shrink-0" style={{ background: '#f4f3f5', borderLeft: '1px solid #e0e0e0' }} />
      </div>
    );
  }

  const slide = presentation.slides[currentSlideIndex];
  const totalSlides = presentation.slides.length;

  const handlePdfToSlides = async (file: File) => {
    try {
      setPdfProgress(`Reading ${file.name}...`);
      const pages = await pdfToStructuredSlides(file, {
        projectApiBase: projectApi(),
        onProgress: (done, total, lastTitle) => {
          setPdfProgress(lastTitle ? `Analyzing ${done}/${total} · "${lastTitle.slice(0, 30)}"` : `Analyzing ${done}/${total}...`);
        },
      });
      appendSlides(
        pages.map((p) => ({
          title: p.structure.title,
          content: p.structure.content,
          speakerNotes: p.structure.speakerNotes,
          labels: p.structure.labels,
          visualType: 'bullets' as const,
          allowQA: true,
          media: [{ url: `${API_HOST}${p.fileUrl}`, kind: 'image' as const, name: p.name }],
        })),
      );
      setPdfProgress(`Done: ${pages.length} slides created`);
      setTimeout(() => setPdfProgress(null), 2500);
    } catch (e: any) {
      setPdfProgress(`Error: ${e.message}`);
      setTimeout(() => setPdfProgress(null), 3500);
    }
  };

  const handlePdfToImagesOnly = async (file: File) => {
    try {
      setPdfProgress(`Rendering ${file.name}...`);
      const uploaded = await uploadPdfPagesAsImages(file, projectApi());
      const baseName = file.name.replace(/\.pdf$/i, '');
      appendSlides(
        uploaded.map((u, i) => ({
          title: `${baseName} · Page ${i + 1}`,
          content: '',
          speakerNotes: '',
          visualType: 'image' as const,
          allowQA: true,
          media: [{ url: `${API_HOST}${u.fileUrl}`, kind: 'image' as const, name: u.name }],
        })),
      );
      setPdfProgress(`Done: ${uploaded.length} image slides created`);
      setTimeout(() => setPdfProgress(null), 2500);
    } catch (e: any) {
      setPdfProgress(`Error: ${e.message}`);
      setTimeout(() => setPdfProgress(null), 3000);
    }
  };

  const handlePdfToSlidesInput = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    await handlePdfToSlides(e.target.files[0]);
    e.target.value = '';
  };

  const handlePdfImageOnlyInput = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    await handlePdfToImagesOnly(e.target.files[0]);
    e.target.value = '';
  };

  return (
    <div className="flex h-full min-h-0" style={{ background: '#d9d9d9' }}>
      <div className="w-[208px] shrink-0 min-h-0 flex flex-col overflow-hidden" style={{ background: '#efefef', borderRight: '1px solid #dfdfdf' }}>
        <div style={{ padding: '10px 12px', borderBottom: '1px solid #e2e2e2' }}>
          <div className="gen-label">Slides · {String(totalSlides).padStart(2, '0')}</div>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div style={{ padding: '8px', borderBottom: '1px solid #e2e2e2', background: '#f8f8f8' }}>
            <div className="gen-label" style={{ marginBottom: 6 }}>PDF → Slide</div>
            <button
              onClick={() => pdfFileInputRef.current?.click()}
              style={{ width: '100%', height: 28, border: '1px solid #d6d6d6', background: '#fff', fontSize: 10, cursor: 'pointer' }}
            >
              Import structured
            </button>
            <button
              onClick={() => pdfImageOnlyInputRef.current?.click()}
              style={{ width: '100%', height: 24, marginTop: 4, border: '1px solid #d6d6d6', background: '#fff', fontSize: 9, cursor: 'pointer' }}
            >
              Image only
            </button>
            <input
              ref={pdfFileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handlePdfToSlidesInput}
              className="hidden"
            />
            <input
              ref={pdfImageOnlyInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handlePdfImageOnlyInput}
              className="hidden"
            />
            {pdfProgress && <div style={{ fontSize: 9, marginTop: 5, color: '#666' }}>{pdfProgress}</div>}
          </div>
          <div style={{ padding: '8px', borderBottom: '1px solid #e2e2e2' }}>
            <div style={{ border: '1px solid #d6d6d6', background: '#f8f8f8' }}>
              <button
                onClick={() => setPresetOpen(true)}
                style={{ width: '100%', height: 28, border: 'none', background: '#fff', fontSize: 12, cursor: 'pointer' }}
              >
                New slide ▾
              </button>
            </div>
          </div>
          <div className="p-2">
          {presentation.slides.map((s, i) => (
            <div
              key={s.id}
              onClick={() => goToSlide(i)}
              style={{
                padding: 8,
                border: i === currentSlideIndex ? '2px solid #9fd1ff' : '1px solid #dadada',
                borderRadius: 10,
                marginBottom: 8,
                background: i === currentSlideIndex ? '#cfe8ff' : '#f2f2f2',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontSize: 12, marginBottom: 6, color: '#555' }}>{i + 1}</div>
              <div
                style={{
                  width: '100%',
                  aspectRatio: '16 / 9',
                  border: '1px solid #cfcfcf',
                  borderRadius: 6,
                  background: '#fff',
                  padding: 8,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-start',
                }}
              >
                <div className="gen-label">{s.sceneMode === 'scene' ? 'SCENE' : 'SLIDE'}</div>
                <div style={{ fontSize: 13, marginTop: 4, fontWeight: 600 }}>{s.title}</div>
                <div style={{ fontSize: 9, color: '#666', marginTop: 3 }} className="truncate">
                  {(s.content || '').replace(/[#>*`-]/g, '').slice(0, 40)}
                </div>
              </div>
              <div className="flex items-start justify-end gap-2" style={{ marginTop: 4 }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (presentation.slides.length > 1) deleteSlide(i);
                  }}
                  title="Delete slide"
                  style={{
                    border: 'none',
                    background: 'transparent',
                    fontSize: 18,
                    lineHeight: 1,
                    color: '#444',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  -
                </button>
              </div>
            </div>
          ))}
          </div>
          <div style={{ height: 10, borderTop: '1px solid #e3e3e3' }} />
        </div>
      </div>

      <div className="flex-1 min-w-0 flex flex-col" style={{ background: '#efefef' }}>
        <div
          className="px-4 py-2 flex items-center justify-between"
          style={{ borderBottom: '1px solid #e3e3e3', background: '#f3f3f3' }}
        >
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCanvasMode('preview')}
              style={{
                height: 25,
                padding: '0 11px',
                border: '1px solid #111',
                background: canvasMode === 'preview' ? '#fff' : '#fff',
                fontSize: 10,
                cursor: 'pointer',
              }}
            >
              Preview Mode
            </button>
            <button
              onClick={() => setCanvasMode('slides')}
              style={{
                height: 25,
                padding: '0 11px',
                border: '1px solid #111',
                background: canvasMode === 'slides' ? '#111' : '#fff',
                color: canvasMode === 'slides' ? '#fff' : '#111',
                fontSize: 10,
                cursor: 'pointer',
              }}
            >
              Slides Mode
            </button>
          </div>
          <div className="gen-label">{`< ${String(currentSlideIndex + 1).padStart(2, '0')}/${String(totalSlides).padStart(2, '0')} >`}</div>
        </div>

        <div className="p-2 min-h-0 overflow-hidden">
          {section === 'meta' ? (
            <MetaEditor presentation={presentation} onUpdate={updateMeta} />
          ) : section === 'insights' ? (
            <InsightsPanel />
          ) : (
            slide && (
              <>
                <SlideStagePanel slide={slide} currentSlideIndex={currentSlideIndex} totalSlides={totalSlides} canvasMode={canvasMode} />
                <div style={{ marginTop: 0, border: '1px solid #c6c6c6', borderTop: 'none', background: '#d7d7d7' }}>
                  <div style={{ height: 2, background: '#9a9a9a', position: 'relative' }}>
                    <div style={{ width: '44%', height: 2, background: '#707070' }} />
                    <span style={{ position: 'absolute', left: '44%', top: -4, width: 8, height: 8, borderRadius: '50%', background: '#707070' }} />
                  </div>
                  <div className="flex items-center justify-center gap-3" style={{ paddingTop: 4, paddingBottom: 4 }}>
                    <IconArrowLeft size={10} />
                    <span style={{ fontSize: 14, color: '#555' }}>Ⅱ</span>
                    <IconArrowRight size={10} />
                  </div>
                </div>
                <div style={{ background: '#d8d8d8', border: '1px solid #cfcfcf', borderTop: 'none', padding: 8, display: 'grid', gridTemplateColumns: '170px 1fr 62px', gap: 8 }}>
                  <div>
                    <div className="gen-label" style={{ marginBottom: 6 }}>보이스 선택</div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                      {['Voice1', 'Voice2', 'Voice3'].map((v) => (
                        <div key={v} style={{ textAlign: 'center' }}>
                          <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#efefef', border: '1px solid #d0d0d0', margin: '0 auto' }} />
                          <div style={{ fontSize: 9, marginTop: 2, color: '#555' }}>{v}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {['속도 조정', '높낮이', '끝음 처리'].map((x) => (
                        <button key={x} style={{ border: '1px solid #c7c7c7', background: '#e2e2e2', padding: '3px 6px', fontSize: 9, cursor: 'pointer' }}>{x}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="gen-label" style={{ marginBottom: 6 }}>Slide Note</div>
                    <textarea
                      className="gen-input"
                      rows={2}
                      value={slide.speakerNotes}
                      onChange={(e) => updateSlide(currentSlideIndex, { speakerNotes: e.target.value })}
                      placeholder="스크립트를 작성하세요"
                      style={{ background: '#efefef', minHeight: 44, padding: '8px 10px' }}
                    />
                  </div>
                  <button
                    onClick={handleSave}
                    disabled={saveStatus === 'saving'}
                    style={{
                      border: '1px solid #b9b9b9',
                      background: '#fff',
                      fontSize: 9,
                      lineHeight: 1.2,
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    {saveStatus === 'saving' ? 'Saving…' : 'Generate Voice'}
                  </button>
                </div>
              </>
            )
          )}
        </div>
      </div>

      <div className="w-[320px] shrink-0 min-h-0 overflow-hidden" style={{ borderLeft: '1px solid #e0e0e0', background: '#f4f3f5' }}>
        <ContextPanel />
      </div>

      {presetOpen && (
        <PresetPickerModal
          onClose={() => setPresetOpen(false)}
          onSelect={applyPreset}
        />
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- */

type PresetCard = {
  id: string;
  title: string;
  subtitle: string;
  content: string;
  speakerNotes: string;
  visualType: Slide['visualType'];
  featured?: boolean;
};

const PRESET_CARDS: PresetCard[] = [
  {
    id: 'title',
    title: 'Slide Deck Title',
    subtitle: 'This is the beginning of something big.',
    content: '# Slide Deck Title\n\n### This is the beginning of something big.',
    speakerNotes: '오늘 발표의 전체 방향과 핵심 가치를 간단하게 소개합니다.',
    visualType: 'title',
    featured: true,
  },
  {
    id: 'section-a',
    title: 'Section title',
    subtitle: 'Quick description about the section.',
    content: '## Section title\n\n- 핵심 포인트 1\n- 핵심 포인트 2\n- 핵심 포인트 3',
    speakerNotes: '이 섹션에서 무엇을 다룰지 20초 안에 안내합니다.',
    visualType: 'bullets',
  },
  {
    id: 'section-b',
    title: 'Section Title',
    subtitle: 'Quick description about the section.',
    content: '## Section Title\n\n내용을 작성하세요.',
    speakerNotes: '핵심 메시지를 짧고 명확하게 전달합니다.',
    visualType: 'bullets',
  },
  {
    id: 'section-c',
    title: 'Section Title',
    subtitle: 'Quick description about the section.',
    content: '## Section Title\n\n### Supporting point\n\n- 데이터 1\n- 데이터 2',
    speakerNotes: '보조 근거를 예시와 함께 설명합니다.',
    visualType: 'bullets',
  },
  {
    id: 'highlight',
    title: 'Highlight',
    subtitle: 'Use this slide to highlight a single important thing.',
    content: '## Highlight\n\n> 가장 중요한 메시지 하나를 명확하게 강조합니다.',
    speakerNotes: '청중이 기억해야 할 단 하나의 포인트를 강조합니다.',
    visualType: 'quote',
  },
  {
    id: 'simple-list',
    title: 'Simple list',
    subtitle: 'First thing · Second thing · Third thing',
    content: '## Simple list\n\n- First thing\n- Second thing\n- Third thing\n- Fourth thing',
    speakerNotes: '항목형 리스트로 핵심을 빠르게 정리합니다.',
    visualType: 'bullets',
  },
  {
    id: 'two-columns',
    title: 'Two columns',
    subtitle: 'Compare two grouped messages.',
    content: '## Two columns\n\n| Left | Right |\n| --- | --- |\n| First | Second |\n| Third | Fourth |',
    speakerNotes: '두 축 비교 구조로 내용을 설명합니다.',
    visualType: 'table',
  },
  {
    id: 'principles',
    title: 'Principles',
    subtitle: 'Principle 1 · Principle 2 · Principle 3',
    content: '## Principles\n\n- Principle 1: This is what we believe\n- Principle 2: It is how we decide\n- Principle 3: It is what we aim to achieve',
    speakerNotes: '원칙 3가지를 순서대로 소개합니다.',
    visualType: 'bullets',
  },
  {
    id: 'header-image',
    title: 'Header',
    subtitle: 'Header + image block layout',
    content: '## Header\n\n서브 설명 문구를 여기에 작성하세요.',
    speakerNotes: '헤더 중심 슬라이드입니다.',
    visualType: 'image',
  },
  {
    id: 'image-with-description',
    title: 'Image with description',
    subtitle: '이미지와 설명 2~3개를 함께 배치',
    content: '## Image with description\n\n- First thing\n- Second thing\n- Third thing',
    speakerNotes: '이미지 기반 설명형 슬라이드입니다.',
    visualType: 'image',
  },
  {
    id: 'key-metrics',
    title: 'Key Metrics',
    subtitle: 'XX% · Metric 1/2/3',
    content: '## Key Metrics\n\n| Metric | Value |\n| --- | --- |\n| Metric 1 | XX% |\n| Metric 2 | XX% |\n| Metric 3 | XX% |',
    speakerNotes: '핵심 수치 지표를 강조합니다.',
    visualType: 'table',
  },
  {
    id: 'timeline',
    title: 'Timeline',
    subtitle: '연도별 주요 이벤트',
    content: '## Timeline\n\n- 2022: Event A\n- 2023: Event B\n- 2024: Event C\n- 2025: Event D',
    speakerNotes: '시간 순 흐름을 설명합니다.',
    visualType: 'bullets',
  },
  {
    id: 'venn',
    title: 'Venn diagram',
    subtitle: '두 영역의 교집합 강조',
    content: '## Venn diagram\n\n교집합에서 만들어지는 핵심 가치를 설명하세요.',
    speakerNotes: '중첩되는 영역의 의미를 강조합니다.',
    visualType: 'quote',
  },
  {
    id: 'funnel',
    title: 'Top of funnel',
    subtitle: '단계별 전환 구조',
    content: '## Top of funnel\n\n- Awareness\n- Consideration\n- Conversion\n- Retention',
    speakerNotes: '퍼널 구조를 단계별로 안내합니다.',
    visualType: 'bullets',
  },
  {
    id: 'testimonials',
    title: 'Testimonials',
    subtitle: '고객 인용문 카드',
    content: '## Testimonials\n\n> “The best product we use for users overall.”\n\n> “Great value and fast execution.”',
    speakerNotes: '고객 피드백으로 신뢰도를 높입니다.',
    visualType: 'quote',
  },
  {
    id: 'meet-the-team',
    title: 'Meet the team',
    subtitle: '팀 소개 슬라이드',
    content: '## Meet the team\n\n- Name 1 · Role\n- Name 2 · Role\n- Name 3 · Role\n- Name 4 · Role',
    speakerNotes: '팀 구성과 역할을 소개합니다.',
    visualType: 'bullets',
  },
];

function parseContentLines(content: string) {
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

function TemplatePreview({ preset }: { preset: PresetCard }) {
  return (
    <div style={{ border: '1px solid #d8d8d8', background: '#fff', padding: 8, borderRadius: 6, marginBottom: 8, aspectRatio: '16 / 9' }}>
      {preset.visualType === 'title' && (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 4 }}>{preset.title}</div>
          <div style={{ fontSize: 8, color: '#666' }}>{preset.subtitle}</div>
        </div>
      )}
      {preset.visualType === 'bullets' && (
        <div style={{ height: '100%' }}>
          <div style={{ fontSize: 9, fontWeight: 700, marginBottom: 4 }}>{preset.title}</div>
          <div style={{ fontSize: 8, color: '#555', lineHeight: 1.5 }}>
            <div>- Point 1</div>
            <div>- Point 2</div>
            <div>- Point 3</div>
          </div>
        </div>
      )}
      {preset.visualType === 'table' && (
        <div style={{ height: '100%' }}>
          <div style={{ fontSize: 9, fontWeight: 700, marginBottom: 4 }}>{preset.title}</div>
          <div style={{ border: '1px solid #ddd', fontSize: 7 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid #eee' }}>
              <div style={{ padding: 2, borderRight: '1px solid #eee' }}>Left</div>
              <div style={{ padding: 2 }}>Right</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
              <div style={{ padding: 2, borderRight: '1px solid #eee' }}>A</div>
              <div style={{ padding: 2 }}>B</div>
            </div>
          </div>
        </div>
      )}
      {preset.visualType === 'quote' && (
        <div style={{ height: '100%', display: 'flex', alignItems: 'center' }}>
          <div style={{ fontSize: 8, fontStyle: 'italic', color: '#444' }}>"{preset.subtitle}"</div>
        </div>
      )}
      {preset.visualType === 'image' && (
        <div style={{ height: '100%', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 5 }}>
          <div style={{ border: '1px dashed #ccc', background: '#f7f7f7' }} />
          <div>
            <div style={{ fontSize: 8, fontWeight: 700 }}>{preset.title}</div>
            <div style={{ fontSize: 7, color: '#666', marginTop: 3 }}>Description</div>
          </div>
        </div>
      )}
    </div>
  );
}

function PresetPickerModal({
  onClose,
  onSelect,
}: {
  onClose: () => void;
  onSelect: (preset: PresetCard) => void;
}) {
  const recents = PRESET_CARDS.slice(0, 2);
  const basic = PRESET_CARDS.slice(2, 8);
  const advanced = PRESET_CARDS.slice(8);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(1060px, 96vw)',
          maxHeight: '90vh',
          overflow: 'auto',
          background: '#f1f1f2',
          borderRadius: 14,
          padding: 12,
          border: '1px solid #d8d8d8',
        }}
      >
        <TemplateSection title="Recents" presets={recents} onSelect={onSelect} />
        <TemplateSection title="Basic" presets={basic} onSelect={onSelect} />
        <TemplateSection title="Vibes" presets={advanced} onSelect={onSelect} />
      </div>
    </div>
  );
}

function TemplateSection({
  title,
  presets,
  onSelect,
}: {
  title: string;
  presets: PresetCard[];
  onSelect: (preset: PresetCard) => void;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div className="gen-label" style={{ padding: '6px 2px' }}>{title}</div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 10,
        }}
      >
        {presets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => onSelect(preset)}
            style={{
              minHeight: 110,
              textAlign: 'left',
              border: '1px solid #dbdbdb',
              borderRadius: 8,
              background: preset.featured ? '#8d8d8e' : '#f7f7f7',
              color: preset.featured ? '#fff' : '#171717',
              padding: 12,
              cursor: 'pointer',
            }}
          >
            <TemplatePreview preset={preset} />
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{preset.title}</div>
            <div style={{ fontSize: 10, opacity: 0.75 }}>{preset.subtitle}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */

function SlideStagePanel({
  slide,
  currentSlideIndex,
  totalSlides,
  canvasMode,
}: {
  slide: Slide;
  currentSlideIndex: number;
  totalSlides: number;
  canvasMode: 'preview' | 'slides';
}) {
  const parsed = parseContentLines(slide.content || '');
  const viewMode = canvasMode === 'slides' ? 'wireframe' : 'render';
  return (
    <div style={{ border: '1px solid #dcdcdc', background: '#fff', padding: 10 }}>
      <div
        style={{
          width: '100%',
          height: 'min(62vh, calc((100vw - 620px) * 9 / 16))',
          minHeight: 340,
          maxHeight: 620,
          border: '1px solid #d7d7d7',
          background: '#ececec',
          padding: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div className="gen-label" style={{ position: 'absolute', top: 8, left: 10, zIndex: 2 }}>
          {canvasMode === 'preview' ? 'Preview' : 'Slide Canvas'} · {String(currentSlideIndex + 1).padStart(2, '0')} / {String(totalSlides).padStart(2, '0')}
        </div>
        <div
          style={{
            height: 'calc(100% - 24px)',
            aspectRatio: '16 / 9',
            maxWidth: '100%',
            width: 'auto',
            background: '#f7f7f7',
            border: '1px solid #d1d1d1',
            display: 'flex',
            flexDirection: 'column',
            padding: 6,
            overflow: 'hidden',
            marginTop: 18,
          }}
        >
          <div style={{ flex: 1, width: '100%', background: '#ffffff', border: '1px solid #e4e4e4', padding: 10, overflow: 'auto', position: 'relative' }}>
            {canvasMode === 'preview' && slide.background?.kind ? (
              <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
                <SlideBackgroundLayer kind={slide.background.kind} params={slide.background.params} />
              </div>
            ) : null}
            {canvasMode === 'preview' && slide.media?.[0]?.kind === 'image' ? (
              <img
                src={slide.media[0].url}
                alt={slide.media[0].name || ''}
                style={{ width: '100%', maxHeight: 240, objectFit: 'contain', marginBottom: 12, border: '1px solid #ececec', position: 'relative', zIndex: 1 }}
              />
            ) : null}
            <SlideTemplateCanvas slide={slide} parsed={parsed} mode={viewMode} />
          </div>
        </div>
      </div>
    </div>
  );
}

function SlideTemplateCanvas({
  slide,
  parsed,
  mode,
}: {
  slide: Slide;
  parsed: { title: string; bullets: string[]; quote: string; tableRows: string[] };
  mode: 'wireframe' | 'render';
}) {
  const frameStyle = mode === 'wireframe'
    ? { border: '1px dashed #cfcfcf', background: 'rgba(255,255,255,0.7)' }
    : { border: '1px solid rgba(255,255,255,0.35)', background: 'transparent' };

  if (slide.visualType === 'title') {
    return (
      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', ...frameStyle, padding: 28 }}>
        <div style={{ fontSize: 36, fontWeight: 700, lineHeight: 1.15, color: '#111', textShadow: '0 1px 2px rgba(255,255,255,0.45)' }}>{parsed.title || slide.title}</div>
        <div style={{ fontSize: 16, marginTop: 10, color: '#2f2f2f', textShadow: '0 1px 2px rgba(255,255,255,0.4)' }}>{(slide.content || '').split('\n').filter((x) => !x.startsWith('#')).join(' ').slice(0, 140)}</div>
      </div>
    );
  }

  if (slide.visualType === 'table') {
    const rows = parsed.tableRows.length ? parsed.tableRows : ['| Left | Right |', '| A | B |', '| C | D |'];
    return (
      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', ...frameStyle, padding: 18 }}>
        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}>{parsed.title || slide.title}</div>
        <div style={{ border: '1px solid rgba(255,255,255,0.45)', background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(1px)' }}>
          {rows.map((r, i) => {
            const cells = r.split('|').map((x) => x.trim()).filter(Boolean);
            return (
              <div key={`${r}-${i}`} style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(2, cells.length)}, minmax(0, 1fr))`, borderTop: i === 0 ? 'none' : '1px solid #eee' }}>
                {cells.map((c, ci) => (
                  <div key={`${c}-${ci}`} style={{ padding: '8px 10px', borderLeft: ci === 0 ? 'none' : '1px solid rgba(0,0,0,0.08)', fontSize: 13 }}>
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
      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', display: 'flex', alignItems: 'center', ...frameStyle, padding: 28 }}>
        <div style={{ fontSize: 28, lineHeight: 1.35, fontStyle: 'italic', color: '#222', textShadow: '0 1px 2px rgba(255,255,255,0.4)' }}>
          {parsed.quote || (slide.content || '').replace(/^#+\s*/gm, '').slice(0, 180)}
        </div>
      </div>
    );
  }

  if (slide.visualType === 'image') {
    return (
      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', ...frameStyle, padding: 16, display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: 14 }}>
        <div style={{ border: mode === 'wireframe' ? '2px dashed #c6c6c6' : '1px solid #ddd', background: '#f3f3f3' }} />
        <div>
          <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.2, color: '#111', textShadow: '0 1px 2px rgba(255,255,255,0.4)' }}>{parsed.title || slide.title}</div>
          <div style={{ fontSize: 14, color: '#2f2f2f', marginTop: 10, textShadow: '0 1px 2px rgba(255,255,255,0.35)' }}>
            {(slide.content || '').replace(/^#+\s*/gm, '').slice(0, 180)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', ...frameStyle, padding: 18 }}>
      <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 12, color: '#111', textShadow: '0 1px 2px rgba(255,255,255,0.4)' }}>{parsed.title || slide.title}</div>
      <div style={{ fontSize: 15, color: '#252525', lineHeight: 1.6, textShadow: '0 1px 1px rgba(255,255,255,0.32)' }}>
        {(parsed.bullets.length ? parsed.bullets : ['포인트 1', '포인트 2', '포인트 3']).map((b) => (
          <div key={b}>- {b}</div>
        ))}
      </div>
      {mode === 'render' && !parsed.bullets.length && (
        <div className="gen-prose" style={{ marginTop: 12 }}>
          <ReactMarkdown>{slide.content || ''}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- */

function SectionBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex-1"
      style={{
        padding: '10px',
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        background: active ? 'var(--gen-black)' : 'transparent',
        color: active ? 'var(--gen-white)' : 'var(--gen-text-sub)',
        border: 'none',
        cursor: 'pointer',
        transition: 'all var(--gen-fast)',
      }}
    >
      {label}
    </button>
  );
}

function MetaEditor({
  presentation,
  onUpdate,
}: {
  presentation: { title: string; systemPrompt: string; knowledge: string };
  onUpdate: (patch: any) => void;
}) {
  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h2 className="gen-display" style={{ fontSize: 36, marginBottom: 4 }}>Presentation Settings</h2>
        <div style={{ width: 48, height: 1, background: 'var(--gen-black)' }} />
      </div>

      <Field label="Title">
        <input
          className="gen-input"
          value={presentation.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
        />
      </Field>

      <Field label="System Prompt">
        <textarea
          className="gen-input"
          rows={5}
          value={presentation.systemPrompt}
          onChange={(e) => onUpdate({ systemPrompt: e.target.value })}
        />
      </Field>

      <Field label="Knowledge (Q&amp;A reference)">
        <textarea
          className="gen-input"
          rows={10}
          style={{ fontFamily: 'monospace' }}
          value={presentation.knowledge}
          onChange={(e) => onUpdate({ knowledge: e.target.value })}
        />
        <p style={{ fontSize: 11, color: 'var(--gen-text-mute)', marginTop: 6 }}>
          Assets from the right panel are automatically linked to context.
        </p>
      </Field>
    </div>
  );
}

/* ---------------------------------------------------------------- */

function SlideEditor({
  slide,
  index,
  onChange,
  onDelete,
  onAddLink,
  onRemoveLink,
  onAddMedia,
  onRemoveMedia,
  onRemoveFile,
}: {
  slide: Slide;
  index: number;
  onChange: (patch: Partial<Slide>) => void;
  onDelete: () => void;
  onAddLink: (link: SlideLink) => void;
  onRemoveLink: (url: string) => void;
  onAddMedia: (m: SlideMedia) => void;
  onRemoveMedia: (url: string) => void;
  onRemoveFile: (url: string) => void;
}) {
  const isScene = slide.sceneMode === 'scene';
  const [newLink, setNewLink] = useState('');
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [labelInput, setLabelInput] = useState('');

  const addLabel = () => {
    const v = labelInput.trim();
    if (!v) return;
    const existing = slide.labels ?? [];
    if (!existing.includes(v)) onChange({ labels: [...existing, v] });
    setLabelInput('');
  };
  const removeLabel = (label: string) => {
    onChange({ labels: (slide.labels ?? []).filter((l) => l !== label) });
  };

  const submitLink = () => {
    const url = newLink.trim();
    if (!url) return;
    onAddLink({ url, label: newLinkLabel.trim() || undefined });
    setNewLink('');
    setNewLinkLabel('');
  };

  return (
    <div className="max-w-2xl space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <div className="gen-label mb-2">Slide {String(index + 1).padStart(2, '0')}</div>
          <h2 className="gen-display" style={{ fontSize: 36 }}>Edit Slide</h2>
          <div style={{ width: 48, height: 1, background: 'var(--gen-black)', marginTop: 8 }} />
        </div>
        <button
          onClick={() => { if (confirm('Delete this slide?')) onDelete(); }}
          className="gen-btn gen-btn-ghost flex items-center gap-1.5"
          style={{ fontSize: 10, color: 'var(--gen-text-sub)' }}
        >
          <IconTrash size={12} />
          Delete
        </button>
      </div>

      {/* Mode toggle */}
      <div style={{ padding: 20, background: 'rgba(250,250,250,0.7)', border: '1px solid var(--gen-border)' }}>
        <div className="gen-label mb-3">Mode</div>
        <div className="flex" style={{ border: '1px solid var(--gen-border)' }}>
          <ModeBtn active={!isScene} onClick={() => onChange({ sceneMode: 'slide' })} label="Slide Mode" subtitle="User controls progression" />
          <ModeBtn active={isScene} onClick={() => onChange({ sceneMode: 'scene' })} label="Scene Mode" subtitle="Autonomous · Interruptible" divider />
        </div>
        {isScene && (
          <div className="mt-4">
            <div className="gen-label mb-2">Auto-advance (ms · 0 = after TTS)</div>
            <input
              type="number"
              value={slide.autoAdvanceMs ?? 0}
              onChange={(e) => onChange({ autoAdvanceMs: Number(e.target.value) || 0 })}
              className="gen-input"
            />
          </div>
        )}
      </div>

      <Field label="Title">
        <input className="gen-input" value={slide.title} onChange={(e) => onChange({ title: e.target.value })} />
      </Field>

      {/* Labels — for agent navigation */}
      <Field label="Topic Labels · agent navigation cues">
        <div className="flex flex-wrap gap-1.5 mb-2">
          {(slide.labels ?? []).map((l) => (
            <span
              key={l}
              style={{
                fontSize: 10,
                letterSpacing: '0.08em',
                padding: '4px 10px 4px 12px',
                border: '1px solid var(--gen-black)',
                color: 'var(--gen-text)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {l}
              <button
                onClick={() => removeLabel(l)}
                style={{ background: 'none', border: 'none', color: 'var(--gen-text-sub)', cursor: 'pointer', padding: 0, display: 'flex' }}
              >
                <IconClose size={10} />
              </button>
            </span>
          ))}
        </div>
        <div className="flex" style={{ border: '1px solid var(--gen-border)' }}>
          <input
            className="gen-input"
            style={{ border: 'none' }}
            value={labelInput}
            onChange={(e) => setLabelInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addLabel(); } }}
            placeholder="Add topic keyword, press Enter…"
          />
          <button onClick={addLabel} className="gen-btn gen-btn-primary" style={{ padding: '0 18px', fontSize: 10, border: 'none' }}>
            Add
          </button>
        </div>
        <p style={{ fontSize: 11, color: 'var(--gen-text-mute)', marginTop: 6 }}>
          Short keywords help the agent decide when to navigate here during Q&amp;A.
        </p>
      </Field>

      <Field label="Screen Content · Markdown · visible to audience">
        <textarea
          className="gen-input"
          rows={10}
          style={{ fontFamily: 'monospace' }}
          value={slide.content}
          onChange={(e) => onChange({ content: e.target.value })}
          placeholder="Rich text the audience can read. Markdown: ## headings, - bullets, **bold**…"
        />
        <p style={{ fontSize: 11, color: 'var(--gen-text-mute)', marginTop: 6, lineHeight: 1.5 }}>
          This shows on screen. Keep it as dense as needed — audience reads it themselves.
        </p>
      </Field>

      <Field label="Voice Script · what the agent says aloud">
        <textarea
          className="gen-input"
          rows={6}
          value={slide.speakerNotes}
          onChange={(e) => onChange({ speakerNotes: e.target.value })}
          placeholder="The essence of this slide, in 2–4 sentences. ~15 seconds spoken."
        />
        <p style={{ fontSize: 11, color: 'var(--gen-text-mute)', marginTop: 6, lineHeight: 1.5 }}>
          Agent narrates meaning, not the screen text. Brief &amp; conversational.<br />
          Target: <strong style={{ color: 'var(--gen-text-sub)' }}>60–120 Korean chars</strong> · <strong style={{ color: 'var(--gen-text-sub)' }}>≤15 s</strong>.
        </p>
      </Field>

      {/* Comment — author-only */}
      <Field label="Comment · private · author only">
        <textarea
          className="gen-input"
          rows={3}
          value={slide.comment ?? ''}
          onChange={(e) => onChange({ comment: e.target.value })}
          placeholder="Internal notes about this slide — not shown to audience or agent."
        />
      </Field>

      {/* Links */}
      <Field label="Links">
        <div className="space-y-2 mb-2">
          {(slide.links ?? []).map((l) => (
            <div
              key={l.url}
              className="flex items-center justify-between gap-2 px-3 py-2"
              style={{ border: '1px solid var(--gen-border)', background: 'var(--gen-white)' }}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <IconLink size={12} />
                <div className="min-w-0 flex-1">
                  {l.label && <div style={{ fontSize: 11, fontWeight: 400 }}>{l.label}</div>}
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noopener"
                    className="truncate block"
                    style={{ fontSize: 10, color: 'var(--gen-text-sub)', letterSpacing: '0.04em' }}
                  >
                    {l.url}
                  </a>
                </div>
              </div>
              <button
                onClick={() => onRemoveLink(l.url)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gen-text-sub)', display: 'flex' }}
              >
                <IconClose size={12} />
              </button>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <div className="flex" style={{ border: '1px solid var(--gen-border)' }}>
            <input
              className="gen-input"
              style={{ border: 'none', flex: 2 }}
              value={newLink}
              onChange={(e) => setNewLink(e.target.value)}
              placeholder="https://..."
            />
            <input
              className="gen-input"
              style={{ border: 'none', borderLeft: '1px solid var(--gen-border)', flex: 1 }}
              value={newLinkLabel}
              onChange={(e) => setNewLinkLabel(e.target.value)}
              placeholder="Label (optional)"
            />
            <button onClick={submitLink} className="gen-btn gen-btn-primary" style={{ padding: '0 18px', fontSize: 10, border: 'none' }}>
              Add
            </button>
          </div>
        </div>
      </Field>

      {/* Media attachments */}
      <Field label="Media · image / video">
        {(slide.media ?? []).length === 0 ? (
          <p style={{ fontSize: 11, color: 'var(--gen-text-mute)' }}>
            Upload an image or video in the right panel, then press <IconPlus size={10} className="inline align-middle" /> to attach.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2 mb-2">
            {(slide.media ?? []).map((m) => (
              <div
                key={m.url}
                className="relative group"
                style={{ border: '1px solid var(--gen-border)', background: 'var(--gen-white)', aspectRatio: '16 / 10', overflow: 'hidden' }}
              >
                {m.kind === 'image' ? (
                  <img src={m.url} alt={m.name || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000' }}>
                    <video src={m.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                    <div style={{ position: 'absolute', bottom: 6, left: 6, fontSize: 9, letterSpacing: '0.14em', color: '#fff', background: 'rgba(0,0,0,0.5)', padding: '2px 6px' }}>
                      VIDEO
                    </div>
                  </div>
                )}
                <button
                  onClick={() => onRemoveMedia(m.url)}
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    width: 22,
                    height: 22,
                    background: 'rgba(255,255,255,0.9)',
                    border: '1px solid var(--gen-border)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--gen-text)',
                    opacity: 0,
                    transition: 'opacity var(--gen-fast)',
                  }}
                  className="group-hover:opacity-100"
                  title="Remove"
                >
                  <IconClose size={11} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Field>

      {/* Files */}
      <Field label="Files · PDF / documents">
        {(slide.files ?? []).length === 0 ? (
          <p style={{ fontSize: 11, color: 'var(--gen-text-mute)' }}>
            Upload a PDF in the right panel, then press <IconPlus size={10} className="inline align-middle" /> on the asset card to attach.
          </p>
        ) : (
          <div className="space-y-2">
            {(slide.files ?? []).map((f) => (
              <div
                key={f.url}
                className="flex items-center justify-between gap-3 px-3 py-2"
                style={{ border: '1px solid var(--gen-border)', background: 'var(--gen-white)' }}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <IconPdf size={14} />
                  <div className="min-w-0 flex-1">
                    <div style={{ fontSize: 12, fontWeight: 400 }} className="truncate">{f.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--gen-text-mute)', letterSpacing: '0.08em' }}>
                      {f.kind.toUpperCase()}{f.size ? ` · ${(f.size / 1024).toFixed(0)} KB` : ''}
                    </div>
                  </div>
                </div>
                <a
                  href={f.url}
                  target="_blank"
                  rel="noopener"
                  style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gen-text-sub)', textDecoration: 'none' }}
                >
                  Open
                </a>
                <button
                  onClick={() => onRemoveFile(f.url)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gen-text-sub)', display: 'flex' }}
                >
                  <IconClose size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Field>

      <div className="flex gap-8 items-end">
        <Field label="Visual Type">
          <select
            className="gen-input"
            style={{ width: 200 }}
            value={slide.visualType}
            onChange={(e) => onChange({ visualType: e.target.value as Slide['visualType'] })}
          >
            <option value="title">Title</option>
            <option value="bullets">Bullets</option>
            <option value="table">Table</option>
            <option value="quote">Quote</option>
            <option value="image">Image</option>
          </select>
        </Field>
        <label className="flex items-center gap-2 cursor-pointer pb-3">
          <input
            type="checkbox"
            checked={slide.allowQA}
            onChange={(e) => onChange({ allowQA: e.target.checked })}
            style={{ width: 16, height: 16, accentColor: 'var(--gen-black)' }}
          />
          <span className="gen-label">Allow Q&amp;A</span>
        </label>
      </div>
    </div>
  );
}

function ModeBtn({
  active, onClick, label, subtitle, divider,
}: { active: boolean; onClick: () => void; label: string; subtitle: string; divider?: boolean }) {
  return (
    <button
      onClick={onClick}
      className="flex-1"
      style={{
        padding: '14px',
        background: active ? 'var(--gen-black)' : 'var(--gen-white)',
        color: active ? 'var(--gen-white)' : 'var(--gen-text)',
        border: 'none',
        borderLeft: divider ? '1px solid var(--gen-border)' : 'none',
        cursor: 'pointer',
        transition: 'all var(--gen-fast)',
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{ fontSize: 10, marginTop: 4, opacity: 0.7 }}>{subtitle}</div>
    </button>
  );
}

function Field({ label, children }: { label: string | React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="gen-label mb-2">{label}</div>
      {children}
    </div>
  );
}
