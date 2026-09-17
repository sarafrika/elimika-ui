'use client';

import { useEffect, useRef, useState } from 'react';
import { loadPdfjs, type PDFDocumentProxy } from '@/lib/pdfjs';
import { cn } from '@/lib/utils';
import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';

interface DocumentPreviewProps {
  documentUrl: string;
  documentTitle: string;
  /** Kept so older call sites keep compiling; not rendered. */
  documentLabel?: string;
  height?: number;
  /** Render at reading size instead of a fixed-height card preview. */
  fullHeight?: boolean;
  className?: string;
}

/**
 * First page of a PDF, drawn to a canvas. Card previews wait until they scroll into
 * view, so a list of documents does not fetch every file at once.
 */
export function DocumentPreview({
  documentUrl,
  documentTitle,
  height = 190,
  fullHeight = false,
  className,
}: DocumentPreviewProps) {
  const resolvedUrl = toAuthenticatedMediaUrl(documentUrl) || documentUrl;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [inView, setInView] = useState(fullHeight);

  useEffect(() => {
    if (fullHeight) return;
    const node = containerRef.current;
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
    let document: PDFDocumentProxy | null = null;

    const load = async () => {
      try {
        setError(null);
        const pdfjs = await loadPdfjs();
        const pdf = await pdfjs.getDocument(resolvedUrl).promise;
        if (cancelled) return;
        document = pdf;

        const page = await pdf.getPage(1);
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
      } catch (renderError) {
        if (cancelled) return;
        setError(renderError instanceof Error ? renderError.message : 'Preview unavailable.');
      }
    };

    void load();

    return () => {
      cancelled = true;
      document?.destroy().catch(() => {});
    };
  }, [documentUrl, resolvedUrl, inView, fullHeight]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'border-border/60 bg-muted/20 relative overflow-hidden rounded-t-md border-b p-3',
        className
      )}
      style={fullHeight ? undefined : { height }}
    >
      <div className='border-border/70 bg-background/85 text-foreground pointer-events-none absolute top-4 left-4 z-10 rounded-sm border px-2.5 py-1 text-xs font-medium backdrop-blur'>
        {error ? 'Preview unavailable' : documentTitle}
      </div>
      <div className='border-border/70 bg-background h-full overflow-hidden rounded-sm border'>
        {error ? (
          <div className='text-muted-foreground flex h-full items-center justify-center px-4 text-center text-sm'>
            {error}
          </div>
        ) : (
          <canvas ref={canvasRef} className='block w-full' />
        )}
      </div>
    </div>
  );
}
