'use client';

import { useEffect, useRef, useState } from 'react';
import { loadPdfjs, type PDFDocumentProxy, type PDFPageProxy } from '@/lib/pdfjs';
import { cn } from '@/lib/utils';
import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';

/**
 * Renders the first page of a PDF to a canvas. Card previews lazy-load via
 * IntersectionObserver so a long list of documents doesn't eagerly fetch every file.
 * Shared by the verification triage queue and the User-360 credentials section.
 */
export function PdfPreview({
  documentUrl,
  documentTitle,
  height = 190,
  fullHeight = false,
}: {
  documentUrl: string;
  documentTitle: string;
  /** Accepted for backwards-compat with older call sites; not rendered. */
  documentLabel?: string;
  height?: number;
  fullHeight?: boolean;
}) {
  const resolvedUrl = toAuthenticatedMediaUrl(documentUrl) || documentUrl;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [inView, setInView] = useState(fullHeight);

  useEffect(() => {
    if (fullHeight) return;
    const node = previewContainerRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [fullHeight]);

  useEffect(() => {
    if (!documentUrl || !inView) return;

    let cancelled = false;
    let pdfDoc: PDFDocumentProxy | null = null;

    const renderPage = async (pdf: PDFDocumentProxy) => {
      const page: PDFPageProxy = await pdf.getPage(1);
      const canvas = canvasRef.current;
      if (!canvas || cancelled) return;

      const viewport = page.getViewport({ scale: fullHeight ? 1.6 : 1.1 });
      const context = canvas.getContext('2d');
      if (!context) return;

      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = '100%';
      canvas.style.height = 'auto';

      await page.render({ canvasContext: context, canvas, viewport }).promise;
    };

    const load = async () => {
      try {
        setError(null);
        const pdfjsLib = await loadPdfjs();
        const pdf = await pdfjsLib.getDocument(resolvedUrl).promise;
        if (cancelled) return;
        pdfDoc = pdf;
        await renderPage(pdf);
      } catch (loadError) {
        if (cancelled) return;
        setError(loadError instanceof Error ? loadError.message : 'Preview unavailable.');
      }
    };

    void load();

    return () => {
      cancelled = true;
      pdfDoc?.destroy().catch(() => {});
    };
  }, [documentUrl, resolvedUrl, inView, fullHeight]);

  return (
    <div
      ref={previewContainerRef}
      className={cn(
        'relative overflow-hidden rounded-t-md border-b border-border/60 bg-muted/20 p-3',
        fullHeight ? 'h-auto' : 'overflow-hidden'
      )}
      style={!fullHeight ? { height } : undefined}
    >
      <div className='pointer-events-none absolute left-4 top-4 z-10 rounded-full border border-border/70 bg-background/85 px-3 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur'>
        {error ? 'Preview unavailable' : documentTitle}
      </div>
      <div className='h-full overflow-hidden rounded-sm border border-border/70 bg-background shadow-sm'>
        {error ? (
          <div className='flex h-full items-center justify-center px-4 text-center text-sm text-muted-foreground'>
            {error}
          </div>
        ) : (
          <canvas ref={canvasRef} className='block w-full' />
        )}
      </div>
    </div>
  );
}
