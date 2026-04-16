import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import * as pdfjsLib from 'pdfjs-dist';
import React, { useEffect, useRef, useState } from 'react';

// Set worker for pdfjs v5
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
}

interface PDFViewerProps {
  file: string; // URL or path to PDF
}

const PDFViewer: React.FC<PDFViewerProps> = ({ file }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);
  const pdfRef = useRef<PDFDocumentProxy | null>(null);

  useEffect(() => {
    if (!file) return;

    let cancelled = false;

    const renderPage = async (num: number, pdfDoc?: PDFDocumentProxy) => {
      const pdfToRender = pdfDoc || pdfRef.current;
      if (!pdfToRender || cancelled) return;

      const page: PDFPageProxy = await pdfToRender.getPage(num);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = canvasRef.current;
      if (!canvas || cancelled) return;

      const context = canvas.getContext('2d');
      if (!context) return;

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({ canvasContext: context, viewport }).promise;
    };

    const loadPDF = async () => {
      try {
        setError(null);
        setPageNumber(1);
        const pdf: PDFDocumentProxy = await pdfjsLib.getDocument(file).promise;
        if (cancelled) return;
        pdfRef.current = pdf;
        setNumPages(pdf.numPages);
        await renderPage(1, pdf);
      } catch (loadError) {
        if (cancelled) return;
        setError(loadError instanceof Error ? loadError.message : 'Failed to load PDF.');
      }
    };

    loadPDF();

    return () => {
      cancelled = true;
    };
  }, [file]);

  const renderCurrentPage = async (targetPage: number) => {
    const pdf = pdfRef.current;
    if (!pdf || !canvasRef.current) return;

    const page = await pdf.getPage(targetPage);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.height = viewport.height;
    canvas.width = viewport.width;
    await page.render({ canvasContext: context, viewport }).promise;
  };

  const nextPage = async () => {
    if (pageNumber < numPages) {
      const next = pageNumber + 1;
      setPageNumber(next);
      await renderCurrentPage(next);
    }
  };

  const prevPage = async () => {
    if (pageNumber > 1) {
      const prev = pageNumber - 1;
      setPageNumber(prev);
      await renderCurrentPage(prev);
    }
  };

  if (error) {
    return (
      <div className='space-y-3'>
        <p className='text-muted-foreground text-sm'>{error}</p>
        <a href={file} target='_blank' rel='noreferrer' className='text-primary text-sm underline'>
          Open PDF in new tab
        </a>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='overflow-auto rounded-xl border'>
        <canvas ref={canvasRef} className='mx-auto block max-w-full' />
      </div>
      <div className='mt-2 flex items-center justify-center gap-4'>
        <button type='button' onClick={prevPage} disabled={pageNumber === 1}>
          Previous
        </button>
        <span>
          {pageNumber} / {numPages}
        </span>
        <button type='button' onClick={nextPage} disabled={pageNumber === numPages}>
          Next
        </button>
      </div>
    </div>
  );
};

export default PDFViewer;
