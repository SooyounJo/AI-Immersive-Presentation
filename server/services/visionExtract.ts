import OpenAI from 'openai';

let _client: OpenAI | null = null;
function getClient(): OpenAI {
  if (!_client) _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _client;
}

export interface ExtractedSlideStructure {
  title: string;
  /** Markdown preserving visual hierarchy & relationships */
  content: string;
  /** Short topic keywords */
  labels: string[];
  /** Concise voice narration (~15s, 60–120 chars Korean) */
  speakerNotes: string;
  /** Optional: brief description of visual elements that carry meaning */
  visualSummary?: string;
}

const EXTRACT_PROMPT = `당신은 발표 슬라이드 이미지를 분석해 **구조화된 Markdown**으로 변환하는 전문가입니다.

시각 위계와 관계를 그대로 보존해주세요:

1. **Visual hierarchy** — 제일 큰 제목 = #, 섹션 헤딩 = ##, 서브헤딩 = ###. 글자 크기·굵기·위치로 판단.
2. **Structural elements** — 불릿(-), 번호 리스트(1.), 표(| | |), 인용(>), 강조(**bold**, *italic*)를 **보이는 대로** 사용.
3. **Relationships** — 화살표(→), 단계, 인과 관계, 비교가 있으면 텍스트에 반영. 플로우는 "A → B → C" 형식으로.
4. **Spatial grouping** — 시각적으로 묶여있는 콘텐츠는 Markdown에서도 가깝게.
5. **No invention** — 이미지에 없는 내용을 추가하지 마세요. 요약하지 마세요. 보이는 그대로만.
6. **Diagrams / charts** — 장식적이면 생략, 의미를 담고 있으면 *[chart: 2020~2025 상승 추세]* 처럼 간결히 묘사.
7. **Language** — 슬라이드 언어를 따라주세요 (한국어 슬라이드면 한국어).

응답은 아래 JSON 형식만 — 다른 설명 금지:

{
  "title": "슬라이드의 핵심 제목 (가장 큰 텍스트 기반)",
  "content": "# 제목\\n\\n## 섹션\\n\\n- 불릿\\n- 불릿\\n\\n| 표 | 머리 |\\n...",
  "labels": ["짧은키워드1", "짧은키워드2"],
  "speakerNotes": "이 슬라이드를 청중에게 음성으로 전달할 때 할 말 (2-4문장, 15초, 한국어 60-120자). 화면 텍스트 낭독 금지 — 핵심만.",
  "visualSummary": "이미지에 있는 다이어그램/차트/관계에 대한 한 줄 요약 (해당 있을 때만)"
}`;

/**
 * Run GPT-4o vision on a slide image to extract structured Markdown.
 *
 * The returned content preserves visual hierarchy (headings, bullets, tables)
 * and relationships (arrows, sequences, groupings) from the original layout —
 * not just a flat OCR text dump.
 */
export async function extractSlideStructure(imageBuffer: Buffer, mimeType = 'image/png'): Promise<ExtractedSlideStructure> {
  const client = getClient();
  const base64 = imageBuffer.toString('base64');
  const dataUrl = `data:${mimeType};base64,${base64}`;

  const completion = await client.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    max_tokens: 2000,
    temperature: 0.2,
    messages: [
      {
        role: 'system',
        content: EXTRACT_PROMPT,
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: '이 슬라이드를 구조화된 Markdown JSON으로 추출해주세요.' },
          { type: 'image_url', image_url: { url: dataUrl, detail: 'high' } },
        ],
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? '{}';
  let parsed: Partial<ExtractedSlideStructure>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = { content: raw };
  }

  return {
    title: parsed.title?.trim() || 'Untitled',
    content: parsed.content?.trim() || '',
    labels: Array.isArray(parsed.labels) ? parsed.labels.slice(0, 8) : [],
    speakerNotes: parsed.speakerNotes?.trim() || '',
    visualSummary: parsed.visualSummary?.trim(),
  };
}
