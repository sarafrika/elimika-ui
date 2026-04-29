'use client';

import { ChevronRight } from 'lucide-react';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import * as pdfjsLib from 'pdfjs-dist';
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
import { cn } from '@/lib/utils';
import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';

import { PdfPreview } from '../../../app/dashboard/@admin/verifications/_components/DocumentsVerificationPage';
import type { CredentialItem } from '../data';
import { CredentialDetailGrid } from './CredentialDetailGrid';

type CredentialCertificateCardProps = {
  item: CredentialItem;
  ownerName: string;
  onDelete?: (item: CredentialItem) => void;
  isDeleting?: boolean;
};

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
}

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
      badgeClass:
        'border-[color-mix(in_srgb,var(--el-accent-amber)_32%,white)] bg-[color-mix(in_srgb,var(--el-accent-amber)_16%,white)] text-[color-mix(in_srgb,var(--el-accent-amber)_90%,black)]',
      iconClass: 'text-[color-mix(in_srgb,var(--el-accent-amber)_92%,var(--foreground))]',
    };
  }

  return {
    badgeClass: 'border-border/70 bg-background/80 text-muted-foreground',
    iconClass: 'text-muted-foreground',
  };
}

export function GeneralPdfPreview({ documentUrl, documentLabel }: { documentUrl: string; documentLabel: string }) {
  const resolvedUrl = toAuthenticatedMediaUrl(documentUrl) || documentUrl;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!documentUrl) return;

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
      pdfDoc?.destroy().catch(() => { });
    };
  }, [resolvedUrl]);

  return (
    <div className='relative h-[180px] overflow-hidden rounded-t-[16px] border-b bg-[linear-gradient(180deg,color-mix(in_srgb,var(--background)_96%,white_4%),color-mix(in_srgb,var(--background)_88%,var(--el-accent-azure)_12%))] p-3'>
      <div className='pointer-events-none absolute inset-x-0 top-0 h-18 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--background)_92%,white_8%),transparent)]' />
      <div className='pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,transparent,color-mix(in_srgb,var(--background)_94%,white_6%))]' />
      <div className='pointer-events-none absolute top-4 left-4 z-10 rounded-full border border-white/80 bg-background/85 px-3 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur'>
        {error ? 'Preview unavailable' : documentLabel}
      </div>
      <div className='h-full overflow-hidden rounded-[12px] border border-border/70 bg-background shadow-[0_18px_40px_-28px_rgba(26,56,126,0.35)]'>
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

function CertificatePreview({
  ownerName,
  issuer,
  documentLabel,
}: {
  ownerName: string;
  issuer: string;
  documentLabel: string;
}) {
  return (
    <div className='relative overflow-hidden rounded-t-[16px] border-b bg-[linear-gradient(180deg,color-mix(in_srgb,var(--background)_96%,white_4%),color-mix(in_srgb,var(--background)_88%,var(--el-accent-azure)_12%))] p-4'>
      <div className='rounded-[12px] border border-[color-mix(in_srgb,var(--border)_85%,white)] bg-white/95 p-4 shadow-[0_18px_40px_-28px_rgba(26,56,126,0.55)]'>
        <div className='flex items-start justify-between gap-4 border-b pb-3'>
          <div>
            <p className='text-foreground text-xl font-semibold'>{documentLabel}</p>
            <p className='text-muted-foreground text-xs'>{issuer} credential authority</p>
          </div>
          <div className='h-14 w-11 rounded-sm border-2 border-[color-mix(in_srgb,var(--primary)_35%,white)] bg-[linear-gradient(180deg,white,color-mix(in_srgb,var(--el-accent-azure)_18%,white))]' />
        </div>
        <div className='space-y-3 pt-4'>
          <div className='h-2.5 w-28 rounded-full bg-[color-mix(in_srgb,var(--primary)_12%,white)]' />
          <div className='text-foreground text-2xl font-semibold'>{ownerName}</div>
          <div className='h-2 w-40 rounded-full bg-muted' />
          <div className='h-2 w-32 rounded-full bg-muted/75' />
        </div>
      </div>
      <div className='absolute right-5 bottom-5 h-14 w-14 rounded-full border border-[color-mix(in_srgb,var(--primary)_18%,white)] bg-white/85 shadow-sm' />
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
    <Card className='gap-0 overflow-hidden rounded-[18px] border-white/60 bg-card/95 py-0 shadow-sm'>
      {item.documentUrl ? (
        <GeneralPdfPreview documentUrl={item.documentUrl} documentLabel={item.documentLabel} />
      ) : (
        <CertificatePreview ownerName={ownerName} issuer={item.issuer} documentLabel={item.documentLabel} />
      )}

      <div className={cn('space-y-4 px-5 py-4', item.documentUrl ? 'pt-5' : '')}>
        <div className='space-y-2'>
          {item.recordSummary ? (
            <h3 className='text-foreground text-[20px] font-semibold tracking-tight'>
              {item.recordSummary}
            </h3>) : null}

          <div className='flex flex-wrap items-center gap-3 text-base'>
            <span className='text-[16px] font-semibold text-[color-mix(in_srgb,var(--primary)_62%,var(--el-accent-amber))]'>
              {item.title}
            </span>
            <span className='text-muted-foreground'>|</span>
            <span className='text-muted-foreground text-sm'>{item.stage}</span>
            <Badge
              variant='secondary'
              className='rounded-lg bg-[color-mix(in_srgb,var(--primary)_8%,white)] px-3 py-1 text-primary'
            >
              {item.level}
            </Badge>
          </div>
        </div>

        <CredentialDetailGrid details={item.details} />

        <div className='flex flex-wrap gap-2'>
          <Badge
            variant='outline'
            className={cn(
              'min-h-10 rounded-lg px-3 text-sm font-medium',
              statusTone.badgeClass
            )}
          >
            <StatusIcon className={cn('size-4', statusTone.iconClass)} />
            {item.status}
          </Badge>
          {item.documentUrl ? (
            <Button
              type='button'
              variant='outline'
              className='min-h-10 rounded-lg border-white/70 bg-background/80 px-4'
              onClick={() => setViewerOpen(true)}
              disabled={!item.documentUrl}
            >
              {item.actionLabel}
              <ChevronRight className='size-4' />
            </Button>
          ) : (
            <Button variant='outline' className='min-h-10 rounded-lg border-white/70 bg-background/80 px-4'>
              {item.actionLabel}
              <ChevronRight className='size-4' />
            </Button>
          )}
          {onDelete ? (
            <Button
              type='button'
              variant='destructive'
              className='min-h-10 rounded-lg px-4'
              onClick={() => onDelete(item)}
              disabled={isDeleting}
            >
              Remove
            </Button>
          ) : null}
        </div>
      </div>


      {/* Full-height document viewer sheet */}
      <Sheet open={viewerOpen} onOpenChange={setViewerOpen}>
        <SheetContent
          side='right'
          className='flex w-full flex-col overflow-y-auto p-0 sm:max-w-[720px]'
        >
          <SheetHeader className='border-border/70 border-b px-6 py-5 text-left'>
            <SheetTitle className='text-xl'>{item.documentLabel}</SheetTitle>
            <SheetDescription>
              {item.recordSummary ? `${item.recordSummary} · ` : ''}{ownerName}
            </SheetDescription>
          </SheetHeader>

          {item.documentUrl ? (
            <div className='flex-1 space-y-5 overflow-y-auto px-6 py-5'>
              <div className='overflow-hidden rounded-[18px] border bg-card shadow-sm'>
                <PdfPreview
                  documentUrl={item.documentUrl}
                  documentLabel={item.documentLabel}
                  documentTitle={item.documentLabel}
                  fullHeight
                />
              </div>
            </div>
          ) : (
            <div className='flex flex-1 items-center justify-center p-6 text-center text-sm text-muted-foreground'>
              No document URL available for this credential.
            </div>
          )}
        </SheetContent>
      </Sheet>


    </Card >
  );
}
