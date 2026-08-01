'use client';

import { BookOpen, ChevronRight } from 'lucide-react';

import { useEffect, useRef, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { loadPdfjs, type PDFDocumentProxy, type PDFPageProxy } from '@/lib/pdfjs';
import { cn } from '@/lib/utils';
import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';

import { PdfPreview } from '../../../app/dashboard/admin/_components/ui/PdfPreview';
import type { CredentialItem } from '../data';
import { CredentialDetailGrid } from './CredentialDetailGrid';

type CredentialCertificateCardProps = {
  item: CredentialItem;
  ownerName: string;
  onDelete?: (item: CredentialItem) => void;
  isDeleting?: boolean;
};

function getStatusTone(status: string) {
  const normalized = status.toLowerCase();

  if (normalized.includes('verified')) {
    return {
      badgeClass: 'border-success/20 bg-success/10 text-success',
      iconClass: 'text-success',
    };
  }

  if (normalized.includes('reject')) {
    return {
      badgeClass: 'border-destructive/20 bg-destructive/10 text-destructive',
      iconClass: 'text-destructive',
    };
  }

  if (normalized.includes('pending') || normalized.includes('review')) {
    return {
      badgeClass: 'border-warning/20 bg-warning/10 text-warning-foreground',
      iconClass: 'text-warning',
    };
  }

  return {
    badgeClass: 'border-border/70 bg-background/80 text-muted-foreground',
    iconClass: 'text-muted-foreground',
  };
}

export function GeneralPdfPreview({
  documentUrl,
  documentLabel,
}: {
  documentUrl: string;
  documentLabel: string;
}) {
  const resolvedUrl = toAuthenticatedMediaUrl(documentUrl) || documentUrl;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    if (!documentUrl || !inView) return;

    let cancelled = false;
    let pdfDoc: PDFDocumentProxy | null = null;

    const renderPage = async (pdf: PDFDocumentProxy) => {
      const page: PDFPageProxy = await pdf.getPage(1);
      const canvas = canvasRef.current;
      if (!canvas || cancelled) return;

      const viewport = page.getViewport({ scale: 1.15 });
      const context = canvas.getContext('2d');
      if (!context) return;

      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = '100%';
      canvas.style.height = 'auto';

      const renderParams: Parameters<PDFPageProxy['render']>[0] = {
        canvasContext: context,
        canvas,
        viewport,
      };

      await page.render(renderParams).promise;
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
        setError(loadError instanceof Error ? loadError.message : 'PDF preview unavailable.');
      }
    };

    void load();

    return () => {
      cancelled = true;
      pdfDoc?.destroy().catch(() => {});
    };
  }, [resolvedUrl, inView, documentUrl]);

  return (
    <div
      ref={containerRef}
      className='relative h-[180px] overflow-hidden rounded-t-[16px] border-b bg-[linear-gradient(180deg,color-mix(in_srgb,var(--background)_96%,white_4%),color-mix(in_srgb,var(--background)_88%,var(--el-accent-azure)_12%))] p-3'
    >
      <div className='pointer-events-none absolute inset-x-0 top-0 h-18 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--background)_92%,white_8%),transparent)]' />
      <div className='pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,transparent,color-mix(in_srgb,var(--background)_94%,white_6%))]' />
      <div className='border-border/40 bg-background/85 text-foreground pointer-events-none absolute top-4 left-4 z-10 rounded-full border px-3 py-1 text-xs font-medium shadow-sm backdrop-blur'>
        {error ? 'Preview unavailable' : documentLabel}
      </div>
      <div className='border-border/70 bg-background h-full overflow-hidden rounded-[12px] border shadow-[0_18px_40px_-28px_rgba(26,56,126,0.35)]'>
        {error ? (
          <div className='flex h-full flex-col items-center justify-center gap-2 px-4 text-center'>
            <BookOpen className='text-muted-foreground/50 size-8' strokeWidth={1.5} />
            <p className='text-muted-foreground text-xs'>Preview unavailable</p>
          </div>
        ) : (
          <canvas ref={canvasRef} className='block w-full' />
        )}
      </div>
    </div>
  );
}

function CertificatePreview({
  ownerName,
  issuer,
  certificateNumber,
  item,
}: {
  ownerName: string;
  issuer: string;
  certificateNumber: string | undefined;
  item: CredentialItem;
}) {
  return (
    <div className='relative overflow-hidden rounded-t-[16px] border-b bg-[linear-gradient(180deg,color-mix(in_srgb,var(--background)_96%,white_4%),color-mix(in_srgb,var(--background)_88%,var(--el-accent-azure)_12%))] p-4'>
      <div className='flex items-start justify-between gap-4'>
        <div>
          <p className='text-foreground text-xl font-semibold'>{certificateNumber}</p>
          <div className='mt-2 flex flex-wrap items-center gap-2 text-sm'>
            <p className='text-muted-foreground text-xs'>{'Elimika'}</p>
            <span className='text-muted-foreground'>|</span>
            <span className='text-muted-foreground text-[12px]'>{item.issueLabel}</span>
          </div>
        </div>
      </div>

      <div className='space-y-3 pt-2'>
        <span className='text-primary/80 font-semibold'>{item.title}</span>
      </div>

      {/* User avatar inside same card */}
      <div className='mt-3 flex items-center gap-3 border-t pt-2'>
        <div className='border-primary/15 bg-background/85 h-12 w-12 overflow-hidden rounded-full border shadow-sm'>
          {item?.profile_image ? (
            <img src={item.profile_image} alt={ownerName} className='h-full w-full object-cover' />
          ) : (
            <div className='text-primary flex h-full w-full items-center justify-center text-sm font-semibold'>
              {ownerName?.charAt(0)?.toUpperCase()}
            </div>
          )}
        </div>

        <div>
          <div className='text-foreground text-sm font-semibold'>{ownerName}</div>
          <div className='text-muted-foreground text-xs'>Certificate Holder</div>
        </div>
      </div>
    </div>
  );
}

export function CredentialCertificateCard({
  item,
  ownerName,
  onDelete,
  isDeleting,
}: CredentialCertificateCardProps) {
  const StatusIcon = item.statusIcon;
  const statusTone = getStatusTone(item.status);
  const [viewerOpen, setViewerOpen] = useState(false);

  return (
    <Card className='border-border/40 bg-card/95 gap-0 overflow-hidden rounded-[16px] py-0 shadow-sm'>
      {item.documentUrl ? (
        <GeneralPdfPreview documentUrl={item.documentUrl} documentLabel={item.documentLabel} />
      ) : (
        <CertificatePreview
          ownerName={ownerName}
          issuer={item.issuer}
          certificateNumber={item.certificateNumber}
          item={item}
        />
      )}

      <div className={cn('space-y-3 px-4 py-3', item.documentUrl ? 'pt-4' : '')}>
        <div className='space-y-1.5'>
          {item.recordSummary ? (
            <h3 className='text-foreground text-[17px] leading-snug font-semibold tracking-tight'>
              {item.recordSummary}
            </h3>
          ) : null}

          <div className='flex flex-wrap items-center gap-2 text-sm'>
            {/* <span className="font-semibold text-primary/80">{item.title}</span>
            <span className="text-muted-foreground">|</span> */}
            <span className='text-muted-foreground text-[13px]'>{item.completionLabel}</span>

            <Badge
              variant='secondary'
              className='bg-primary/8 text-primary rounded-md px-2 py-0.5 text-[11px]'
            >
              {item.level}
            </Badge>
          </div>
        </div>

        <CredentialDetailGrid details={item.details} />

        <div className='flex flex-wrap gap-2'>
          <Badge
            variant='outline'
            className={cn('min-h-8 rounded-md px-2.5 text-xs font-medium', statusTone.badgeClass)}
          >
            <StatusIcon className={cn('size-3.5', statusTone.iconClass)} />
            {item.status}
          </Badge>

          {item.documentUrl ? (
            <Button
              type='button'
              variant='outline'
              className='border-border/50 bg-background/80 min-h-8 rounded-md px-3 text-xs'
              onClick={() => setViewerOpen(true)}
              disabled={!item.documentUrl}
            >
              {item.actionLabel}
              <ChevronRight className='size-3.5' />
            </Button>
          ) : (
            <Button
              variant='outline'
              className='border-border/50 bg-background/80 min-h-8 rounded-md px-3 text-xs'
            >
              {item.actionLabel}
              <ChevronRight className='size-3.5' />
            </Button>
          )}

          {onDelete ? (
            <Button
              type='button'
              variant='destructive'
              className='min-h-8 rounded-md px-3 text-xs'
              onClick={() => onDelete(item)}
              disabled={isDeleting}
            >
              Remove
            </Button>
          ) : null}
        </div>
      </div>

      {/* Viewer */}
      <Sheet open={viewerOpen} onOpenChange={setViewerOpen}>
        <SheetContent
          side='right'
          className='flex w-full flex-col overflow-y-auto p-0 sm:max-w-[680px]'
        >
          <SheetHeader className='border-border/70 border-b px-5 py-4 text-left'>
            <SheetTitle className='text-lg'>{item.documentLabel}</SheetTitle>
            <SheetDescription className='space-y-0.5 text-xs'>
              <p className='text-foreground font-medium'>{ownerName}</p>
              {item.recordSummary && (
                <p className='text-muted-foreground leading-snug'>{item.recordSummary}</p>
              )}
            </SheetDescription>
          </SheetHeader>

          {item.documentUrl ? (
            <div className='flex-1 space-y-4 overflow-y-auto px-5 py-4'>
              <div className='bg-card overflow-hidden rounded-[14px] border shadow-sm'>
                <PdfPreview
                  documentUrl={item.documentUrl}
                  documentLabel={item.documentLabel}
                  documentTitle={item.documentLabel}
                  fullHeight
                />
              </div>
            </div>
          ) : (
            <div className='text-muted-foreground flex flex-1 items-center justify-center p-5 text-center text-xs'>
              No document URL available for this credential.
            </div>
          )}
        </SheetContent>
      </Sheet>
    </Card>
  );
}
