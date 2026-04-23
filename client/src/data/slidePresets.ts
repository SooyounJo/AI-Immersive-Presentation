import type { Slide } from '../types';

export type PresetCard = {
  id: string;
  title: string;
  subtitle: string;
  content: string;
  speakerNotes: string;
  visualType: Slide['visualType'];
  featured?: boolean;
  figmaUrl?: string;
};

export type StylePreset = {
  id: string;
  name: string;
  subtitle: string;
  chipBg: string;
  chipText: string;
  background: Slide['background'];
};

const FIGMA_PRESET_LINKS = [
  'https://www.figma.com/slides/QFww9MZHC4pB2BVcMxouJn/Untitled?node-id=1-42&t=zg1GkijcrX0P3381-4',
  'https://www.figma.com/slides/QFww9MZHC4pB2BVcMxouJn/Untitled?node-id=2-42&t=zg1GkijcrX0P3381-4',
  'https://www.figma.com/slides/QFww9MZHC4pB2BVcMxouJn/Untitled?node-id=2-51&t=zg1GkijcrX0P3381-0',
  'https://www.figma.com/slides/QFww9MZHC4pB2BVcMxouJn/Untitled?node-id=2-69&t=zg1GkijcrX0P3381-0',
  'https://www.figma.com/slides/QFww9MZHC4pB2BVcMxouJn/Untitled?node-id=2-80&t=zg1GkijcrX0P3381-4',
  'https://www.figma.com/slides/QFww9MZHC4pB2BVcMxouJn/Untitled?node-id=2-91&t=zg1GkijcrX0P3381-4',
  'https://www.figma.com/slides/QFww9MZHC4pB2BVcMxouJn/Untitled?node-id=2-107&t=zg1GkijcrX0P3381-4',
  'https://www.figma.com/slides/QFww9MZHC4pB2BVcMxouJn/Untitled?node-id=2-135&t=zg1GkijcrX0P3381-4',
  'https://www.figma.com/slides/QFww9MZHC4pB2BVcMxouJn/Untitled?node-id=2-163&t=zg1GkijcrX0P3381-4',
  'https://www.figma.com/slides/QFww9MZHC4pB2BVcMxouJn/Untitled?node-id=2-191&t=zg1GkijcrX0P3381-4',
  'https://www.figma.com/slides/QFww9MZHC4pB2BVcMxouJn/Untitled?node-id=2-219&t=zg1GkijcrX0P3381-4',
  'https://www.figma.com/slides/QFww9MZHC4pB2BVcMxouJn/Untitled?node-id=2-240&t=zg1GkijcrX0P3381-4',
  'https://www.figma.com/slides/QFww9MZHC4pB2BVcMxouJn/Untitled?node-id=2-254&t=zg1GkijcrX0P3381-4',
  'https://www.figma.com/slides/QFww9MZHC4pB2BVcMxouJn/Untitled?node-id=2-269&t=zg1GkijcrX0P3381-4',
  'https://www.figma.com/slides/QFww9MZHC4pB2BVcMxouJn/Untitled?node-id=2-281&t=zg1GkijcrX0P3381-4',
  'https://www.figma.com/slides/QFww9MZHC4pB2BVcMxouJn/Untitled?node-id=2-297&t=zg1GkijcrX0P3381-4',
  'https://www.figma.com/slides/QFww9MZHC4pB2BVcMxouJn/Untitled?node-id=2-324&t=zg1GkijcrX0P3381-4',
  'https://www.figma.com/slides/QFww9MZHC4pB2BVcMxouJn/Untitled?node-id=2-346&t=zg1GkijcrX0P3381-4',
  'https://www.figma.com/slides/QFww9MZHC4pB2BVcMxouJn/Untitled?node-id=2-368&t=zg1GkijcrX0P3381-4',
  'https://www.figma.com/slides/QFww9MZHC4pB2BVcMxouJn/Untitled?node-id=2-396&t=zg1GkijcrX0P3381-4',
  'https://www.figma.com/slides/QFww9MZHC4pB2BVcMxouJn/Untitled?node-id=2-429&t=zg1GkijcrX0P3381-4',
  'https://www.figma.com/slides/QFww9MZHC4pB2BVcMxouJn/Untitled?node-id=2-471&t=zg1GkijcrX0P3381-4',
  'https://www.figma.com/slides/QFww9MZHC4pB2BVcMxouJn/Untitled?node-id=2-511&t=zg1GkijcrX0P3381-4',
  'https://www.figma.com/slides/QFww9MZHC4pB2BVcMxouJn/Untitled?node-id=2-543&t=zg1GkijcrX0P3381-4',
  'https://www.figma.com/slides/QFww9MZHC4pB2BVcMxouJn/Untitled?node-id=2-591&t=zg1GkijcrX0P3381-4',
  'https://www.figma.com/slides/QFww9MZHC4pB2BVcMxouJn/Untitled?node-id=2-638&t=zg1GkijcrX0P3381-4',
  'https://www.figma.com/slides/QFww9MZHC4pB2BVcMxouJn/Untitled?node-id=2-672&t=zg1GkijcrX0P3381-4',
  'https://www.figma.com/slides/QFww9MZHC4pB2BVcMxouJn/Untitled?node-id=2-731&t=zg1GkijcrX0P3381-4',
  'https://www.figma.com/slides/QFww9MZHC4pB2BVcMxouJn/Untitled?node-id=2-743&t=zg1GkijcrX0P3381-4',
  'https://www.figma.com/slides/QFww9MZHC4pB2BVcMxouJn/Untitled?node-id=2-764&t=zg1GkijcrX0P3381-4',
  'https://www.figma.com/slides/QFww9MZHC4pB2BVcMxouJn/Untitled?node-id=2-797&t=zg1GkijcrX0P3381-4',
  'https://www.figma.com/slides/QFww9MZHC4pB2BVcMxouJn/Untitled?node-id=2-824&t=zg1GkijcrX0P3381-4',
  'https://www.figma.com/slides/QFww9MZHC4pB2BVcMxouJn/Untitled?node-id=2-844&t=zg1GkijcrX0P3381-4',
  'https://www.figma.com/slides/QFww9MZHC4pB2BVcMxouJn/Untitled?node-id=2-903&t=zg1GkijcrX0P3381-4',
];

const TEMPLATE_TITLES = [
  'Opening Cover', 'Agenda Overview', 'Section Divider', 'Problem Statement', 'Opportunity Snapshot',
  'User Insight', 'Market Landscape', 'Competitor Grid', 'Vision Slide', 'Product Concept',
  'Feature Breakdown', 'Use Case Story', 'Journey Map', 'Flow Diagram', 'Architecture View',
  'Data Highlight', 'KPI Dashboard', 'Roadmap', 'Milestone Plan', 'Execution Model',
  'Go-to-Market', 'Pricing Story', 'Business Model', 'Team Intro', 'Role Matrix',
  'Timeline Detail', 'Case Study', 'Demo Narrative', 'Risk & Mitigation', 'Financial Summary',
  'Partnership Plan', 'Launch Checklist', 'Closing Message', 'Q&A', 'Appendix',
];

const VISUAL_CYCLE: Slide['visualType'][] = ['title', 'bullets', 'bullets', 'quote', 'bullets', 'table', 'image'];

const FIRST_EIGHT_PRESETS: PresetCard[] = [
  {
    id: 'figma-1',
    title: 'Slide Deck Title',
    subtitle: 'This is just the beginning of something big.',
    content: '# Slide Deck Title\n\nThis is just the beginning of something big.',
    speakerNotes: '인트로 타이틀과 한 줄 메시지를 전달합니다.',
    visualType: 'title',
    featured: true,
    figmaUrl: FIGMA_PRESET_LINKS[0],
  },
  {
    id: 'figma-2',
    title: 'Section title',
    subtitle: 'Section title only',
    content: '# Section title',
    speakerNotes: '섹션 제목을 명확히 구분합니다.',
    visualType: 'title',
    figmaUrl: FIGMA_PRESET_LINKS[1],
  },
  {
    id: 'figma-3',
    title: 'Section Title',
    subtitle: 'Quick description about the section.',
    content: '# Section Title\n\nQuick description about the section.',
    speakerNotes: '섹션 제목과 짧은 설명을 전달합니다.',
    visualType: 'title',
    figmaUrl: FIGMA_PRESET_LINKS[2],
  },
  {
    id: 'figma-4',
    title: 'Section Title',
    subtitle: 'Quick description about the section.',
    content: '# Section Title\n\nQuick description about the section.',
    speakerNotes: '중앙 정렬된 섹션 타이틀 스타일입니다.',
    visualType: 'title',
    figmaUrl: FIGMA_PRESET_LINKS[3],
  },
  {
    id: 'figma-5',
    title: 'Section Title',
    subtitle: 'Quick description about the section.',
    content: '# Section Title\n\nQuick description about the section.',
    speakerNotes: '하단 앵커형 섹션 타이틀 스타일입니다.',
    visualType: 'title',
    figmaUrl: FIGMA_PRESET_LINKS[4],
  },
  {
    id: 'figma-6',
    title: 'Highlight',
    subtitle: 'Use this slide to highlight a single, important thing.',
    content: '# Highlight\n\nUse this slide to highlight a single, important thing. To keep it short and sweet, you might link away to relevant doc or file.',
    speakerNotes: '하이라이트 메시지를 좌우 구조로 강조합니다.',
    visualType: 'quote',
    figmaUrl: FIGMA_PRESET_LINKS[5],
  },
  {
    id: 'figma-7',
    title: 'Simple list',
    subtitle: 'First thing / Second thing / Third thing',
    content: '# Simple list\n\n## First thing\nAdd a quick description of each thing, with enough context to understand what’s up.\n\n## Second thing\nKeep ‘em short and sweet, so they’re easy to scan and remember.\n\n## Third thing\nIf you’ve got a bunch, add another row, or use multiple copies of this slide.',
    speakerNotes: '좌측 제목, 우측 3개 항목 리스트를 안내합니다.',
    visualType: 'bullets',
    figmaUrl: FIGMA_PRESET_LINKS[6],
  },
  {
    id: 'figma-8',
    title: 'Two columns',
    subtitle: 'First/Second/Third/Fourth thing',
    content: '# Two columns\n\n## First thing\nAdd a quick description.\n\n## Second thing\nKeep it short.\n\n## Third thing\nAdd another row if needed.\n\n## Fourth thing\nUse multiple copies of this slide.',
    speakerNotes: '2x2 카드형 정보 배치 템플릿입니다.',
    visualType: 'table',
    figmaUrl: FIGMA_PRESET_LINKS[7],
  },
];

const NEXT_EIGHT_PRESETS: PresetCard[] = [
  {
    id: 'figma-9',
    title: 'Simple list',
    subtitle: 'First thing · Second thing · Third thing · Fourth thing',
    content: '# Simple list\n\n## First thing\nAdd a quick description of each thing, with enough context.\n\n## Second thing\nKeep it short and sweet.\n\n## Third thing\nIf you’ve got a bunch, add another row.\n\n## Fourth thing\nKeep it short and sweet, so they are easy to scan.',
    speakerNotes: '4개 항목을 가로로 빠르게 비교하는 레이아웃입니다.',
    visualType: 'bullets',
    figmaUrl: FIGMA_PRESET_LINKS[8],
  },
  {
    id: 'figma-10',
    title: 'Principles',
    subtitle: 'Principle 1 · Principle 2 · Principle 3',
    content: '# Principles\n\n## Principle 1\nThis is what we believe.\n\n## Principle 2\nIt’s how we make decisions.\n\n## Principle 3\nAnd what we aim to achieve.',
    speakerNotes: '3개 원칙을 카드 형태로 강조합니다.',
    visualType: 'bullets',
    figmaUrl: FIGMA_PRESET_LINKS[9],
  },
  {
    id: 'figma-11',
    title: 'Header',
    subtitle: 'Header + image block',
    content: '# Header\n\nAdd a quick description of each thing, with enough context to understand what’s up.',
    speakerNotes: '좌측 텍스트, 우측 이미지 블록 레이아웃입니다.',
    visualType: 'image',
    figmaUrl: FIGMA_PRESET_LINKS[10],
  },
  {
    id: 'figma-12',
    title: 'Header',
    subtitle: 'Subtitle + Header + body + image',
    content: '# Header\n\nSubtitle\n\nAdd a quick description of each thing, with enough context to understand what’s up.',
    speakerNotes: '서브타이틀이 포함된 텍스트/이미지 조합입니다.',
    visualType: 'image',
    figmaUrl: FIGMA_PRESET_LINKS[11],
  },
  {
    id: 'figma-13',
    title: 'Header',
    subtitle: 'Subtitle + Header + double image strip',
    content: '# Header\n\nSubtitle\n\nAdd a quick description of each thing, with enough context to understand what’s up.',
    speakerNotes: '우측 이미지 블록이 2단으로 쌓인 구성입니다.',
    visualType: 'image',
    figmaUrl: FIGMA_PRESET_LINKS[12],
  },
  {
    id: 'figma-14',
    title: 'Add a caption',
    subtitle: 'Full-width image + caption',
    content: '# Add a caption\n\n이미지 중앙 캡션을 배치하는 레이아웃입니다.',
    speakerNotes: '전면 이미지 위 캡션 강조형 레이아웃입니다.',
    visualType: 'image',
    figmaUrl: FIGMA_PRESET_LINKS[13],
  },
  {
    id: 'figma-15',
    title: 'Image with description',
    subtitle: 'Two images + descriptions',
    content: '# Image with description\n\n## First thing\nAdd a quick description of each thing.\n\n## Second thing\nKeep it short and sweet.',
    speakerNotes: '2개 이미지와 설명을 나란히 배치합니다.',
    visualType: 'image',
    figmaUrl: FIGMA_PRESET_LINKS[14],
  },
  {
    id: 'figma-16',
    title: 'Image with description',
    subtitle: 'Two images + descriptions (variant)',
    content: '# Image with description\n\n## First thing\nAdd a quick description of each thing.\n\n## Second thing\nKeep it short and sweet.',
    speakerNotes: '이미지 설명형 변형 템플릿입니다.',
    visualType: 'image',
    figmaUrl: FIGMA_PRESET_LINKS[15],
  },
];

const THIRD_EIGHT_PRESETS: PresetCard[] = [
  {
    id: 'figma-17',
    title: 'Image with description',
    subtitle: 'Three images + descriptions',
    content: '# Image with description\n\n## First thing\nAdd a quick description.\n\n## Second thing\nKeep it short and sweet.\n\n## Third thing\nAdd another row if needed.',
    speakerNotes: '3개 이미지와 설명을 가로 정렬한 템플릿입니다.',
    visualType: 'image',
    figmaUrl: FIGMA_PRESET_LINKS[16],
  },
  {
    id: 'figma-18',
    title: 'XX%',
    subtitle: 'Single metric highlight',
    content: '# XX%\n\nHighlight a key metric like a goal, objective, or insight that supports the narrative of your deck.\n\nAdd a link to a relevant doc or dashboard.',
    speakerNotes: '핵심 지표 하나를 강조하는 레이아웃입니다.',
    visualType: 'quote',
    figmaUrl: FIGMA_PRESET_LINKS[17],
  },
  {
    id: 'figma-19',
    title: 'Key Metrics',
    subtitle: 'Metric 1/2/3 with values',
    content: '# Key Metrics\n\n## Metric 1\nXX%\n\n## Metric 2\nXX%\n\n## Metric 3\nXX%',
    speakerNotes: '좌측 제목, 우측 지표 3개를 수직으로 배치합니다.',
    visualType: 'table',
    figmaUrl: FIGMA_PRESET_LINKS[18],
  },
  {
    id: 'figma-20',
    title: '3 column metric',
    subtitle: 'Three metrics in columns',
    content: '# 3 column metric\n\n## XX%\nAdd a quick description.\n\n## XX%\nIf you’ve got a bunch, add another row.\n\n## XX%\nKeep it short and sweet.',
    speakerNotes: '3개 지표를 가로 3열로 보여주는 레이아웃입니다.',
    visualType: 'table',
    figmaUrl: FIGMA_PRESET_LINKS[19],
  },
  {
    id: 'figma-21',
    title: 'Metrics',
    subtitle: '2x2 metric grid with description',
    content: '# Metrics\n\nDescription about the data beside.\n\n## 61% Metric 1\n## 56% Metric 2\n## 55% Metric 3\n## 48% Metric 4',
    speakerNotes: '설명 텍스트 + 2x2 지표 그리드입니다.',
    visualType: 'table',
    figmaUrl: FIGMA_PRESET_LINKS[20],
  },
  {
    id: 'figma-22',
    title: 'Timeline',
    subtitle: 'Milestone timeline',
    content: '# Timeline\n\nH2 2024\nH2 2025\nJune 2024\nH1 2025',
    speakerNotes: '중앙 라인을 기준으로 타임라인 정보를 구성합니다.',
    visualType: 'table',
    figmaUrl: FIGMA_PRESET_LINKS[21],
  },
  {
    id: 'figma-23',
    title: 'Overlaps',
    subtitle: 'Nested circles diagram',
    content: '# Overlaps\n\nShow how a few nested concepts relate to one another.',
    speakerNotes: '중첩 원형 다이어그램 템플릿입니다.',
    visualType: 'quote',
    figmaUrl: FIGMA_PRESET_LINKS[22],
  },
  {
    id: 'figma-24',
    title: '2 × 2 Matrix',
    subtitle: 'Quadrant matrix',
    content: '# 2 × 2 Matrix\n\nShow where a few concepts live on 2 different scales.',
    speakerNotes: '2x2 매트릭스 다이어그램 템플릿입니다.',
    visualType: 'table',
    figmaUrl: FIGMA_PRESET_LINKS[23],
  },
];

const FOURTH_EIGHT_PRESETS: PresetCard[] = [
  {
    id: 'figma-25',
    title: 'Venn diagram',
    subtitle: 'Two overlapping concepts',
    content: '# Venn diagram\n\nShow how a few concepts overlap, and how they’re unique.',
    speakerNotes: '겹치는 두 개의 핵심 개념을 시각적으로 설명합니다.',
    visualType: 'quote',
    figmaUrl: FIGMA_PRESET_LINKS[24],
  },
  {
    id: 'figma-26',
    title: 'Top of funnel',
    subtitle: 'Sequential concept funnel',
    content: '# Top of funnel\n\nShow how a few concepts relate sequentially, from top to bottom.',
    speakerNotes: '상단에서 하단으로 이어지는 퍼널 구조를 보여줍니다.',
    visualType: 'table',
    figmaUrl: FIGMA_PRESET_LINKS[25],
  },
  {
    id: 'figma-27',
    title: 'Desktop designs',
    subtitle: 'Text + desktop mockup',
    content: '# Desktop designs\n\nSupport your visuals with a bit of context, then link away to the designs.',
    speakerNotes: '설명 텍스트와 데스크탑 시안을 함께 배치합니다.',
    visualType: 'image',
    figmaUrl: FIGMA_PRESET_LINKS[26],
  },
  {
    id: 'figma-28',
    title: 'Desktop showcase',
    subtitle: 'Full desktop mockup',
    content: '# Desktop showcase\n\nFocus on a single desktop visual without extra text.',
    speakerNotes: '데스크탑 시안을 전체 폭에 가깝게 강조합니다.',
    visualType: 'image',
    figmaUrl: FIGMA_PRESET_LINKS[27],
  },
  {
    id: 'figma-29',
    title: 'Single quote',
    subtitle: 'One centered testimonial',
    content: '# Single quote\n\n“The best quotes relate to your deck’s overall narrative.”',
    speakerNotes: '중앙의 단일 인용문으로 메시지를 강조합니다.',
    visualType: 'quote',
    figmaUrl: FIGMA_PRESET_LINKS[28],
  },
  {
    id: 'figma-30',
    title: 'Quote trio',
    subtitle: 'Three testimonials in columns',
    content: '# Quote trio\n\nUse three customer quotes to support your main narrative.',
    speakerNotes: '3열 인용문으로 사회적 증거를 배치합니다.',
    visualType: 'quote',
    figmaUrl: FIGMA_PRESET_LINKS[29],
  },
  {
    id: 'figma-31',
    title: 'Quote grid',
    subtitle: 'Four testimonials in a row',
    content: '# Quote grid\n\nUse four short quotes for balanced comparison.',
    speakerNotes: '4개 인용문을 균형 있게 나열한 템플릿입니다.',
    visualType: 'quote',
    figmaUrl: FIGMA_PRESET_LINKS[30],
  },
  {
    id: 'figma-32',
    title: 'Dual quotes',
    subtitle: 'Two featured testimonials',
    content: '# Dual quotes\n\nUse two strong quotes to reinforce your key claim.',
    speakerNotes: '양쪽에 2개의 대표 인용문을 배치합니다.',
    visualType: 'quote',
    figmaUrl: FIGMA_PRESET_LINKS[31],
  },
];

const FINAL_THREE_PRESETS: PresetCard[] = [
  {
    id: 'figma-33',
    title: 'Quote stack',
    subtitle: 'Two quotes on top, three below',
    content: '# Quote stack\n\nUse five short quotes in a 2 + 3 layout.',
    speakerNotes: '상단 2개, 하단 3개 인용문으로 신뢰도를 구성합니다.',
    visualType: 'quote',
    figmaUrl: FIGMA_PRESET_LINKS[32],
  },
  {
    id: 'figma-34',
    title: 'Quote trio',
    subtitle: 'Three centered testimonials',
    content: '# Quote trio\n\nUse three testimonials with balanced spacing.',
    speakerNotes: '3개 인용문을 균형 있게 중앙 배치합니다.',
    visualType: 'quote',
    figmaUrl: FIGMA_PRESET_LINKS[33],
  },
  {
    id: 'figma-35',
    title: 'Meet the team',
    subtitle: 'Team grid with names and roles',
    content: '# Meet the team\n\nIntroduce team members with a simple avatar grid.',
    speakerNotes: '팀 구성원을 이름과 역할 중심으로 소개합니다.',
    visualType: 'table',
    figmaUrl: FIGMA_PRESET_LINKS[34],
  },
];

const AUTO_PRESETS: PresetCard[] = FIGMA_PRESET_LINKS.slice(24).map((figmaUrl, offset) => {
  const index = offset + 24;
  const visualType = VISUAL_CYCLE[index % VISUAL_CYCLE.length];
  const title = TEMPLATE_TITLES[index] ?? `Template ${index + 1}`;
  const nodeId = /node-id=([^&]+)/.exec(figmaUrl)?.[1]?.replace('-', ':') ?? '';
  const baseContentByType: Record<Slide['visualType'], string> = {
    title: `# ${title}\n\n### 핵심 메시지를 한 문장으로 정리하세요.`,
    bullets: `## ${title}\n\n- 핵심 포인트 1\n- 핵심 포인트 2\n- 핵심 포인트 3`,
    table: `## ${title}\n\n| 항목 | 내용 |\n| --- | --- |\n| Metric A | 값 입력 |\n| Metric B | 값 입력 |`,
    quote: `## ${title}\n\n> 강하게 전달할 한 문장을 입력하세요.`,
    image: `## ${title}\n\n이미지와 설명을 함께 배치할 수 있는 템플릿입니다.`,
  };
  return {
    id: `figma-${index + 1}`,
    title,
    subtitle: `Figma node ${nodeId || index + 1}`,
    content: baseContentByType[visualType],
    speakerNotes: `${title} 슬라이드의 핵심 메시지를 15초 내외로 설명하세요.`,
    visualType,
    featured: index === 0,
    figmaUrl,
  };
});

export const PRESET_CARDS: PresetCard[] = [
  ...FIRST_EIGHT_PRESETS,
  ...NEXT_EIGHT_PRESETS,
  ...THIRD_EIGHT_PRESETS,
  ...FOURTH_EIGHT_PRESETS,
  ...FINAL_THREE_PRESETS,
  ...AUTO_PRESETS.filter((preset) => Number(preset.id.replace('figma-', '')) > 35),
];

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: 'clean-light',
    name: 'Clean Light',
    subtitle: '밝은 톤 · 기본 발표형',
    chipBg: '#f3f3f3',
    chipText: '#1e1e1e',
    background: undefined,
  },
  {
    id: 'dark-veil',
    name: 'Dark Veil',
    subtitle: '집중도 높은 다크 무드',
    chipBg: '#1b1f2e',
    chipText: '#f7f8ff',
    background: { kind: 'darkVeil', params: { speed: 0.5, warpAmount: 0.2, noiseIntensity: 0.02, hueShift: 0, scanlineIntensity: 0.05, scanlineFrequency: 1.5 } },
  },
  {
    id: 'soft-grain',
    name: 'Soft Grain',
    subtitle: '브랜디드 그라디언트',
    chipBg: '#d5d0ef',
    chipText: '#1d1637',
    background: { kind: 'grainient', params: { timeSpeed: 0.25, warpFrequency: 5, warpSpeed: 2, grainAmount: 0.1, contrast: 1.2, saturation: 1, zoom: 0.9 } },
  },
  {
    id: 'star-flow',
    name: 'Star Flow',
    subtitle: '입체 파티클 무드',
    chipBg: '#151925',
    chipText: '#f5f7ff',
    background: { kind: 'particles', params: { particleCount: 180, speed: 0.12, particleSpread: 10, particleBaseSize: 90 } },
  },
];
