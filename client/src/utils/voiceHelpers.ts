export function getSlideVoiceText(speakerNotes?: string) {
  const text = (speakerNotes || '').trim();
  if (!text) return '';
  if (text === '이 슬라이드에서 발표자가 말할 내용을 입력하세요.') return '';
  return text;
}
