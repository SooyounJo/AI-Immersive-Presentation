import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { usePresentationStore } from '../stores/presentationStore';

const EXPORT_ROOT_ID = 'design-slide-export-root';

function waitPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

/**
 * Renders each slide in the design canvas (in order), rasterizes with html2canvas, builds a multi-page PDF, and triggers download.
 */
export async function exportDesignPresentationToPdf(filenameBase: string): Promise<void> {
  const root = document.getElementById(EXPORT_ROOT_ID);
  if (!root) {
    throw new Error('슬라이드 캔버스를 찾을 수 없습니다. 디자인 모드에서 내보내기를 다시 시도해 주세요.');
  }

  const { presentation, goToSlide, currentSlideIndex } = usePresentationStore.getState();
  const slides = presentation?.slides ?? [];
  if (slides.length === 0) {
    throw new Error('내보낼 슬라이드가 없습니다.');
  }

  const prevIndex = currentSlideIndex;
  const pdfW = Math.max(1, root.clientWidth);
  const pdfH = Math.max(1, root.clientHeight);

  const pdf = new jsPDF({
    unit: 'px',
    format: [pdfW, pdfH],
    orientation: pdfW >= pdfH ? 'landscape' : 'portrait',
    hotfixes: ['px_scaling'],
  });

  try {
    for (let i = 0; i < slides.length; i += 1) {
      goToSlide(i);
      await waitPaint();
      await new Promise((r) => setTimeout(r, 380));

      const canvas = await html2canvas(root, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false,
        onclone: (clonedDoc) => {
          clonedDoc.querySelectorAll('[data-export-hide]').forEach((el) => {
            (el as HTMLElement).style.setProperty('display', 'none', 'important');
          });
          clonedDoc.querySelectorAll('[data-media-resize]').forEach((el) => {
            (el as HTMLElement).style.setProperty('display', 'none', 'important');
          });
        },
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.9);
      if (i > 0) {
        pdf.addPage([pdfW, pdfH], pdfW >= pdfH ? 'l' : 'p');
      }
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfW, pdfH, undefined, 'FAST');
    }
  } finally {
    goToSlide(prevIndex);
  }

  const safe = filenameBase.replace(/[^\w.\-가-힣]+/g, '_').replace(/_+/g, '_').slice(0, 96).trim() || 'presentation';
  pdf.save(`${safe}.pdf`);
}
