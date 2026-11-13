import { toCanvas } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { ThemeConfig } from './themes';

export interface ExportPdfOptions {
  contentElement: HTMLElement;
  fileName: string;
  themeConfig: ThemeConfig;
}

/**
 * Exports a markdown DOM element to a crisp, high-resolution multi-page PDF.
 * Uses html-to-image (native browser SVG foreignObject rendering engine)
 * which completely supports modern CSS specifications including Tailwind v4's
 * oklch() color spaces, eliminating html2canvas's "unsupported color function oklch" error.
 */
export async function exportMarkdownToPdf({
  contentElement,
  fileName,
  themeConfig,
}: ExportPdfOptions): Promise<void> {
  const clone = contentElement.cloneNode(true) as HTMLElement;

  const bgColor = themeConfig.variables['--md-bg'] || '#ffffff';
  const textColor = themeConfig.variables['--md-text'] || '#1e293b';
  const headingColor = themeConfig.variables['--md-heading'] || '#0f172a';
  const borderColor = themeConfig.variables['--md-border'] || '#e2e8f0';
  const codeBgColor = themeConfig.variables['--md-code-bg'] || '#f8fafc';
  const fontFamily = themeConfig.variables['--md-font-body'] || 'system-ui, -apple-system, sans-serif';

  // Apply explicit styling for the printed sheet
  clone.className = `markdown-content ${themeConfig.className || ''}`;
  clone.style.width = '820px';
  clone.style.maxWidth = '820px';
  clone.style.backgroundColor = bgColor;
  clone.style.color = textColor;
  clone.style.padding = '40px';
  clone.style.position = 'fixed';
  clone.style.top = '0';
  clone.style.left = '0';
  clone.style.zIndex = '-9999';
  clone.style.opacity = '1';
  clone.style.pointerEvents = 'none';
  clone.style.boxSizing = 'border-box';
  clone.style.fontFamily = fontFamily;

  // Enhance heading and block elements in the clone
  clone.querySelectorAll('*').forEach((node) => {
    const el = node as HTMLElement;
    if (el.tagName && /^H[1-6]$/.test(el.tagName)) {
      el.style.color = headingColor;
    }
    if (el.tagName === 'PRE' || el.tagName === 'CODE') {
      el.style.backgroundColor = codeBgColor;
      el.style.color = textColor;
      el.style.borderColor = borderColor;
    }
    if (el.tagName === 'TABLE' || el.tagName === 'TH' || el.tagName === 'TD') {
      el.style.borderColor = borderColor;
    }
  });

  // Remove any copy buttons or interactive overlays
  clone.querySelectorAll('button').forEach((btn) => {
    btn.remove();
  });

  document.body.appendChild(clone);

  try {
    // Small delay to allow any pending math/mermaid/diagram renders to settle
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Render using html-to-image
    const canvas = await toCanvas(clone, {
      backgroundColor: bgColor,
      width: 820,
      pixelRatio: 2, // 2x high-resolution output
      fontEmbedCSS: '', // Avoid cross-origin stylesheet CORS warnings
      cacheBust: false,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    // First page
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pdfHeight;

    // Multi-page handling
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;
    }

    const cleanBaseName = fileName.replace(/\.md$/i, '') || 'document';
    pdf.save(`${cleanBaseName}.pdf`);
  } finally {
    if (document.body.contains(clone)) {
      document.body.removeChild(clone);
    }
  }
}
