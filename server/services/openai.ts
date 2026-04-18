import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface SlideContext {
  title: string;
  content: string;
  speakerNotes: string;
  allowQA: boolean;
  labels?: string[];
}

interface SlideSummary {
  index: number;      // 0-based
  title: string;
  labels?: string[];
}

interface AgentRequest {
  mode: 'present' | 'qa';
  systemPrompt: string;
  knowledge: string;
  currentSlide: SlideContext;
  userMessage?: string;
  conversationHistory: { role: 'user' | 'assistant'; content: string }[];
  // Optional flow context
  presentationTitle?: string;
  slideIndex?: number;
  totalSlides?: number;
  isOpening?: boolean;
  isClosing?: boolean;
  /** Full slide structure so the agent can reference any slide by number or topic. */
  slideList?: SlideSummary[];
  /**
   * When present, this Q&A call is an interrupt mid-presentation.
   * spokenText = the narration the agent was delivering when the user cut in.
   */
  interruptContext?: { slideTitle: string; spokenText: string } | null;
}

export async function* streamAgentResponse(request: AgentRequest) {
  const {
    mode, systemPrompt, knowledge, currentSlide, userMessage, conversationHistory,
    presentationTitle, slideIndex, totalSlides, isOpening, isClosing,
    slideList, interruptContext,
  } = request;

  let systemContent = `${systemPrompt}\n\n`;

  // ── Presentation-level meta so the agent always knows the structure ──
  if (presentationTitle || totalSlides) {
    systemContent += `## 프레젠테이션 메타\n`;
    if (presentationTitle) systemContent += `제목: "${presentationTitle}"\n`;
    if (totalSlides !== undefined) systemContent += `총 슬라이드 수: ${totalSlides}장\n`;
    if (slideIndex !== undefined && totalSlides !== undefined) {
      systemContent += `현재 위치: ${slideIndex + 1} / ${totalSlides}\n`;
    }
    systemContent += `\n`;
  }

  // ── Full slide structure so agent can reference any slide ──
  if (slideList && slideList.length) {
    systemContent += `## 전체 슬라이드 목차 (청중 질문 시 이 목록을 근거로 답변)\n`;
    for (const s of slideList) {
      const marker = slideIndex === s.index ? '▶' : ' ';
      const labels = s.labels?.length ? ` [${s.labels.join(', ')}]` : '';
      systemContent += `${marker} ${String(s.index + 1).padStart(2, '0')}. ${s.title}${labels}\n`;
    }
    systemContent += `\n`;
  }

  systemContent += `## 도메인 지식 (참조용 — 절대 그대로 읽지 말 것)\n${knowledge}\n\n`;
  systemContent += `## 현재 슬라이드\n`;
  systemContent += `제목: ${currentSlide.title}\n`;
  systemContent += `화면에 표시된 텍스트 (청중이 이미 읽고 있음):\n${currentSlide.content}\n\n`;
  systemContent += `음성 스크립트 가이드:\n${currentSlide.speakerNotes}\n\n`;
  if (currentSlide.labels?.length) {
    systemContent += `주제 라벨: ${currentSlide.labels.join(', ')}\n\n`;
  }

  /**
   * CRITICAL — visual vs voice separation.
   * Screen delivers the full reference text; voice delivers ESSENCE only.
   * The audience can read the screen themselves — the agent should never
   * duplicate what is already visible. Instead, narrate the meaning.
   */
  const voiceRules = `
## 음성 출력 원칙 (반드시 준수)
- 당신은 청중에게 "말하는" 발표자입니다. 화면을 읽어주는 사람이 아닙니다.
- 청중은 이미 화면의 텍스트를 눈으로 읽고 있습니다. 같은 문장을 다시 말하면 시간 낭비입니다.
- 화면 텍스트를 절대 문장 그대로 반복하지 마세요. 대신 "왜 중요한가"를 전달하세요.
- **길이 제한**: 슬라이드당 2–4 문장, 총 15초 이내로 말할 분량. 한국어 기준 약 60–120자.
- 불릿 목록을 하나씩 읽지 마세요. 전체를 관통하는 하나의 핵심 메시지로 압축하세요.
- 숫자나 표의 수치를 나열하지 마세요. 가장 중요한 하나만 강조하세요.
- 구어체로, 호흡이 자연스럽게, 문어체/리포트 톤 금지.
- 마크다운·불릿 기호·제목 기호를 출력에 포함하지 마세요 (TTS로 읽힙니다).
- 도입부 인사("안녕하세요", "이번 슬라이드에서는") 반복 금지. 바로 내용으로.
`;

  if (mode === 'present') {
    systemContent += voiceRules;

    if (isOpening) {
      systemContent += `
## 지금 할 일 — 프레젠테이션의 첫 순간
당신이 가장 먼저 청중에게 말을 거는 순간입니다. 다음을 수행하세요:
1. 청중과 청자들에게 짧고 품위 있게 환영 인사를 전합니다 (한 문장).
2. 오늘 프레젠테이션 제목("${presentationTitle ?? ''}")과 주제를 한 문장으로 프레임합니다.
3. 바로 이 첫 슬라이드의 핵심 메시지로 자연스럽게 이어갑니다.
분량은 전체 3–4 문장, 20초 이내. 진부한 클리셰는 피하고, 첫 인상을 만드는 톤으로.
화면 텍스트를 그대로 읽지 마세요.
`;
    } else if (isClosing) {
      systemContent += `
## 지금 할 일 — 프레젠테이션의 마지막 슬라이드
이 슬라이드의 메시지를 전달한 후, 간결한 마무리를 덧붙이세요:
- 오늘 전체를 관통하는 핵심 한 줄
- 청중에게 다음 행동을 제안하거나 질문을 초대
분량은 3–4 문장, 20초 이내.
`;
    } else {
      systemContent += `
## 지금 할 일 — 중간 슬라이드 (${slideIndex !== undefined ? slideIndex + 1 : '?'} / ${totalSlides ?? '?'})
이 슬라이드의 핵심 메시지 하나를 골라, 청중에게 15초 이내로 전달하세요.
"음성 스크립트 가이드"는 방향일 뿐 — 그대로 읽지 말고 요약/재구성하세요.
화면에 이미 있는 텍스트는 반복하지 마세요.
인사말이나 도입부 없이 바로 내용부터 시작하세요.
`;
    }
  } else {
    systemContent += voiceRules;

    if (interruptContext) {
      systemContent += `
## 상황: 발표 도중 인터럽트 (청중이 손을 들었음)
당신은 방금 이 내용을 말하던 중이었습니다:
"${interruptContext.spokenText}"

지금 청중이 **말을 끊고** 질문/코멘트를 했습니다. 대응 원칙:
1. **자연스럽게 전환**하세요. 예: "좋은 질문이에요", "그 부분 궁금하시죠", "맞아요, 그게 핵심인데". 사과("죄송합니다") 금지.
2. 질문 자체에 **집중해서 답**하세요 — 간결하게 2–4 문장.
3. 답 끝에 **상황에 맞게** 선택:
   - 질문이 주제에서 벗어났다면 새로운 대화를 그대로 따라가세요.
   - 질문이 방금 하던 이야기와 연결된다면, 짧은 브릿지로 원래 맥락으로 되돌아가세요 ("다시 본론으로 돌아오면…").
   - 억지로 원래 내레이션을 이어붙이지 마세요 — 대화가 자연스럽게 흘러가게.
4. 청중과 **즉흥적으로 대화하는 느낌**을 살리세요. 리포트/대본 톤 금지. 호흡과 감탄사 OK.
5. 전체 길이: 30초 이내 (한국어 90–180자).
`;
    } else {
      systemContent += `
## 지금 할 일 — 일반 Q&A
청중의 질문에 답변합니다. 도메인 지식과 현재 슬라이드를 근거로 답하세요.
답변도 음성으로 재생됩니다 — 간결하게 (3–5 문장, 30초 이내).
모르면 솔직히 모른다고 하세요. 추측하지 마세요.
`;
    }
  }

  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemContent },
    ...conversationHistory.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
  ];

  if (mode === 'present') {
    messages.push({ role: 'user', content: '이 슬라이드에 대해 발표해주세요.' });
  } else if (userMessage) {
    messages.push({ role: 'user', content: userMessage });
  }

  const stream = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages,
    stream: true,
    temperature: 0.7,
    max_tokens: 1000,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      yield content;
    }
  }
}
