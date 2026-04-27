import { useState } from 'react';
import { usePresentationStore } from '../../stores/presentationStore';
import { useAssets } from '../../hooks/useAssets';
import { PRESET_CARDS } from '../../data/slidePresets';
import { IconChevronRight, IconChevronDown } from '../icons';
import { PRESET_FOLD_HEADER_STYLE, SECTION_CONTAINER_STYLE } from './constants';

export function GenTextSettings({ isNight }: { isNight: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [genTitle, setGenTitle] = useState('');
  const [genLabels, setGenLabels] = useState('');
  const [genContents, setGenContents] = useState('');

  const { assets } = useAssets();
  const { presentation, currentSlideIndex, addSlide } = usePresentationStore();
  const currentSlide = presentation?.slides[currentSlideIndex];

  const pickSmartPreset = (title: string, content: string, hasImageAsset: boolean) => {
    const plain = `${title} ${content}`.toLowerCase();
    if (hasImageAsset || /\b(image|photo|visual|gallery)\b/.test(plain)) {
      return PRESET_CARDS.find((p) => p.id === 'figma-15') ?? PRESET_CARDS[0];
    }
    const bulletCount = (content.match(/##\s/g) ?? []).length + (content.match(/-\s/g) ?? []).length;
    if (bulletCount >= 4) return PRESET_CARDS.find((p) => p.id === 'figma-8') ?? PRESET_CARDS[0];
    if (bulletCount >= 2) return PRESET_CARDS.find((p) => p.id === 'figma-7') ?? PRESET_CARDS[0];
    return PRESET_CARDS.find((p) => p.id === 'figma-3') ?? PRESET_CARDS[0];
  };

  const createSlideFromGenInputs = () => {
    const title = genTitle.trim();
    const contents = genContents.trim();
    const labels = genLabels
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
    if (!title && !contents && labels.length === 0) return;

    const hasImageAsset = assets.some((a) => a.type === 'image');
    const preset = pickSmartPreset(title, contents, hasImageAsset);
    const presetBody = (preset.content || '').replace(/^#\s[^\n]+/, '').trim();
    const mergedBody = contents || presetBody || '';
    const mergedTitle = title || preset.title;
    const content = `# ${mergedTitle}${mergedBody ? `\n\n${mergedBody}` : ''}`;

    addSlide({
      templateId: preset.id,
      title: mergedTitle,
      content,
      speakerNotes: preset.speakerNotes,
      visualType: preset.visualType,
      allowQA: true,
      sceneMode: 'slide',
      labels: labels.length ? labels : undefined,
      textStyle: currentSlide?.textStyle,
      background: currentSlide?.background,
    });
    setGenTitle('');
    setGenLabels('');
    setGenContents('');
  };

  const canApplyGenText = Boolean(
    genTitle.trim() || genContents.trim() || genLabels.split(',').some((x) => x.trim())
  );

  return (
    <div style={SECTION_CONTAINER_STYLE(isNight)}>
      <div style={PRESET_FOLD_HEADER_STYLE}>
        <div className="gen-label" style={{ marginBottom: 0, opacity: 0.8 }}>Gen Text</div>
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          style={{ border: 'none', background: 'transparent', color: 'var(--gen-text-sub)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
          title={isOpen ? 'Collapse' : 'Expand'}
        >
          {isOpen ? <IconChevronDown size={12} /> : <IconChevronRight size={12} />}
        </button>
      </div>
      {isOpen && (
        <div style={{ padding: 8, display: 'grid', gap: 6, borderTop: '1px solid var(--gen-border)' }}>
          <div style={{ border: '1px solid var(--gen-border)' }}>
            <input
              value={genTitle}
              onChange={(e) => setGenTitle(e.target.value)}
              placeholder="Title"
              style={{ width: '100%', border: 'none', padding: '8px 10px', fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ border: '1px solid var(--gen-border)' }}>
            <input
              value={genLabels}
              onChange={(e) => setGenLabels(e.target.value)}
              placeholder="Labels (comma-separated)"
              style={{ width: '100%', border: 'none', padding: '8px 10px', fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ border: '1px solid var(--gen-border)' }}>
            <input
              value={genContents}
              onChange={(e) => setGenContents(e.target.value)}
              placeholder="Contents"
              style={{ width: '100%', border: 'none', padding: '8px 10px', fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <button
            type="button"
            onClick={createSlideFromGenInputs}
            disabled={!canApplyGenText}
            className="gen-go-btn"
            style={{
              height: 32,
              border: 'none',
              background: 'var(--gen-btn-solid-bg)',
              color: 'var(--gen-btn-solid-text)',
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.06em',
              cursor: canApplyGenText ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: canApplyGenText ? 1 : 0.35,
            }}
            aria-label="Create slide from Gen Text"
          >
            GO
          </button>
        </div>
      )}
    </div>
  );
}
