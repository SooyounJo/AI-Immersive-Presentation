import type { Slide } from '@shared/types';
import { renderTextHeavyTemplate } from './TextHeavyTemplates';
import { renderVisualTemplate } from './VisualTemplates';

export function renderSpecialTemplate(slide: Slide, textColor: string, subTextColor: string, textShadow: string) {
  const id = slide.templateId;
  if (!id) return null;

  const textHeavyMatch = id.match(/^figma-(\d+)$/);
  if (textHeavyMatch) {
    const num = parseInt(textHeavyMatch[1], 10);
    if (num >= 1 && num <= 17) {
      return renderTextHeavyTemplate(slide, textColor, subTextColor, textShadow);
    }
    if (num >= 18 && num <= 35) {
      return renderVisualTemplate(slide, textColor, subTextColor, textShadow);
    }
  }

  return null;
}
