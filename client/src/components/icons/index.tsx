import type { ImgHTMLAttributes } from 'react';

import iconAdd from '../../assets/icons/add.svg';
import iconArrowLeft from '../../assets/icons/arrow-left.svg';
import iconArrowRight from '../../assets/icons/arrow-right.svg';
import iconChevronRight from '../../assets/icons/chevron-right.svg';
import iconClose from '../../assets/icons/close.svg';
import iconHand from '../../assets/icons/hand.svg';
import iconImages from '../../assets/icons/images.svg';
import iconLink from '../../assets/icons/link-attach.svg';
import iconMic from '../../assets/icons/mic.svg';
import iconPause from '../../assets/icons/pause.svg';
import iconPlay from '../../assets/icons/play.svg';
import iconSend from '../../assets/icons/send.svg';
import iconSettings from '../../assets/icons/settings-grid.svg';
import iconTrash from '../../assets/icons/trash.svg';
import iconUpload from '../../assets/icons/upload.svg';
import iconVideo from '../../assets/icons/video.svg';
import iconWeb from '../../assets/icons/web-home.svg';

type IconProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  size?: number | string;
};
const UNIFIED_ICON_SIZE = 14;

function IconAsset({ src, size = UNIFIED_ICON_SIZE, style, alt = '', ...props }: IconProps & { src: string }) {
  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      style={{ width: size, height: size, objectFit: 'contain', ...style }}
      {...props}
    />
  );
}

export function IconImages(props: IconProps) { return <IconAsset src={iconImages} {...props} />; }
export function IconWeb(props: IconProps) { return <IconAsset src={iconWeb} {...props} />; }
export function IconArrowDown(props: IconProps) {
  // Some asset packs map arrow-down to a list icon.
  // Force a true down arrow by rotating the right-arrow asset.
  return <IconAsset src={iconArrowRight} style={{ transform: 'rotate(90deg)', ...props.style }} {...props} />;
}
export function IconArrowRight(props: IconProps) { return <IconAsset src={iconArrowRight} {...props} />; }
/** Compact › chevron (no stem) — section affordances, lists */
export function IconChevronRight(props: IconProps) { return <IconAsset src={iconChevronRight} {...props} />; }
export function IconChevronDown(props: IconProps) {
  return <IconAsset src={iconChevronRight} style={{ transform: 'rotate(90deg)', ...props.style }} {...props} />;
}
export function IconArrowLeft(props: IconProps) { return <IconAsset src={iconArrowLeft} {...props} />; }
export function IconSettings(props: IconProps) { return <IconAsset src={iconSettings} {...props} />; }
export function IconPlus(props: IconProps) { return <IconAsset src={iconAdd} {...props} />; }
export function IconClose(props: IconProps) { return <IconAsset src={iconClose} {...props} />; }
export function IconTrash(props: IconProps) { return <IconAsset src={iconTrash} {...props} />; }
export function IconPdf({ size = 20, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props as React.SVGProps<SVGSVGElement>}>
      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
      <polyline points="13 2 13 9 20 9" />
    </svg>
  );
}
export function IconLink(props: IconProps) { return <IconAsset src={iconLink} {...props} />; }
export function IconVideo(props: IconProps) { return <IconAsset src={iconVideo} {...props} />; }
export function IconComment({ size = 20, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props as React.SVGProps<SVGSVGElement>}>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}
export function IconMic(props: IconProps) { return <IconAsset src={iconMic} {...props} />; }
export function IconSend(props: IconProps) { return <IconAsset src={iconSend} {...props} />; }
export function IconUpload(props: IconProps) { return <IconAsset src={iconUpload} {...props} />; }
export function IconPlay(props: IconProps) { return <IconAsset src={iconPlay} {...props} />; }
export function IconPause(props: IconProps) { return <IconAsset src={iconPause} {...props} />; }
export function IconHand(props: IconProps) { return <IconAsset src={iconHand} {...props} />; }

export function IconEditPencil({ size = 20, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props as React.SVGProps<SVGSVGElement>}>
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  );
}

export function IconText({ size = 20, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props as React.SVGProps<SVGSVGElement>}>
      <polyline points="4 7 4 4 20 4 20 7" />
      <line x1="9" y1="20" x2="15" y2="20" />
      <line x1="12" y1="4" x2="12" y2="20" />
    </svg>
  );
}

export function IconShapes({ size = 20, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props as React.SVGProps<SVGSVGElement>}>
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}
