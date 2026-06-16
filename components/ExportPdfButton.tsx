'use client';

import { useState, type RefObject } from 'react';

type Props = {
  /** Element whose rendered content is captured into the PDF. */
  targetRef: RefObject<HTMLElement | null>;
  /** File name (without extension) for the downloaded PDF. */
  fileName: string;
  className?: string;
};

/** Captures the referenced element and downloads it as a multi-page A4 PDF.
 * Buttons (and anything marked `data-export-ignore`) are omitted from the capture
 * so the exported document shows only the read-only calculation content. */
export function ExportPdfButton({ targetRef, fileName, className }: Props) {
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    const node = targetRef.current;
    if (!node || exporting) return;
    setExporting(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas-pro'),
        import('jspdf'),
      ]);

      const pageBg = getComputedStyle(document.body).backgroundColor || '#ffffff';

      // Measured top/bottom of every atomic section, relative to the captured node, in
      // CSS pixels. Filled in from the cloned DOM so the measurements match exactly what
      // html2canvas paints (e.g. with collapsed <details> forced open).
      let blockRects: Array<{ top: number; bottom: number }> = [];
      let measuredWidth = node.offsetWidth;

      const canvas = await html2canvas(node, {
        scale: 2,
        backgroundColor: pageBg,
        useCORS: true,
        ignoreElements: (el) =>
          el.tagName === 'BUTTON' || el.getAttribute('data-export-ignore') === 'true',
        onclone: (_doc, clonedNode) => {
          // Expand any collapsed details so their content is contained by the card
          // (otherwise html2canvas paints it overflowing outside the section border).
          clonedNode.querySelectorAll('details').forEach((d) => (d.open = true));
          const rootTop = clonedNode.getBoundingClientRect().top;
          measuredWidth = clonedNode.offsetWidth;
          blockRects = Array.from(clonedNode.querySelectorAll('[data-pdf-block]')).map((el) => {
            const r = el.getBoundingClientRect();
            return { top: r.top - rootTop, bottom: r.bottom - rootTop };
          });
        },
      });

      const pdf = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 24;
      const usableWidth = pageWidth - margin * 2;
      const usableHeight = pageHeight - margin * 2;

      // Convert measured CSS-pixel block bounds into canvas pixels.
      const scaleFactor = canvas.width / measuredWidth;
      const blocks = blockRects
        .map((b) => ({ top: b.top * scaleFactor, bottom: b.bottom * scaleFactor }))
        .sort((a, b) => a.top - b.top);

      const pageHeightPx = (canvas.width * usableHeight) / usableWidth;
      const EPS = 1;

      // A cut at y is clean only if no section straddles it (in either column).
      const isCleanCut = (y: number) =>
        !blocks.some((b) => b.top + EPS < y && y < b.bottom - EPS);

      // Build slice boundaries, preferring section edges so no section is split across
      // pages. When a section is taller than a page, it gets its own slice (extended to
      // the next clean break) and is later scaled down to fit, rather than being split.
      const slices: Array<{ start: number; end: number }> = [];
      let start = 0;
      while (start < canvas.height - EPS) {
        const limit = start + pageHeightPx;
        if (limit >= canvas.height - EPS) {
          slices.push({ start, end: canvas.height });
          break;
        }
        // Largest clean cut that fits within one page.
        let best = -1;
        for (const b of blocks) {
          if (b.bottom > start + EPS && b.bottom <= limit + EPS && isCleanCut(b.bottom)) {
            best = Math.max(best, b.bottom);
          }
        }
        if (best > start + EPS) {
          slices.push({ start, end: best });
          start = best;
          continue;
        }
        // Nothing fits: the content from `start` is taller than a page. Extend to the
        // next clean break (or the end) so the whole oversized section stays in one slice.
        let next = canvas.height;
        for (const b of blocks) {
          if (b.bottom > limit + EPS && isCleanCut(b.bottom)) {
            next = Math.min(next, b.bottom);
          }
        }
        slices.push({ start, end: next });
        start = next;
      }

      slices.forEach((slice, index) => {
        const sliceHeight = slice.end - slice.start;
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = Math.round(sliceHeight);
        const ctx = pageCanvas.getContext('2d');
        if (!ctx) return;
        ctx.fillStyle = pageBg;
        ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        ctx.drawImage(
          canvas,
          0,
          slice.start,
          canvas.width,
          sliceHeight,
          0,
          0,
          canvas.width,
          sliceHeight,
        );
        const sliceData = pageCanvas.toDataURL('image/png');
        // Fit to width by default; if the slice is taller than a page (an oversized
        // section), scale it down to fit the height and center it horizontally.
        let drawWidth = usableWidth;
        let drawHeight = (sliceHeight * usableWidth) / canvas.width;
        if (drawHeight > usableHeight) {
          drawWidth = (drawWidth * usableHeight) / drawHeight;
          drawHeight = usableHeight;
        }
        const x = margin + (usableWidth - drawWidth) / 2;
        if (index > 0) pdf.addPage();
        pdf.addImage(sliceData, 'PNG', x, margin, drawWidth, drawHeight);
      });

      pdf.save(`${fileName}.pdf`);
    } catch (err) {
      console.error('PDF export failed', err);
      alert('Greška pri izvozu PDF-a.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <button
      type="button"
      className={className ?? 'secondary'}
      onClick={handleExport}
      disabled={exporting}
    >
      {exporting ? 'Skidam…' : 'Skini PDF'}
    </button>
  );
}
