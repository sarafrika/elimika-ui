'use client';

import { useState } from 'react';
import { PortfolioMediaPreview } from '@/app/dashboard/_components/skills-wallet/PortfolioMediaPreview';
import { portfolioMediaType } from '@/app/dashboard/_components/skills-wallet/portfolio';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import type { InstructorDocument } from '@/services/client';
import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';

export function CandidateCredentialViewer({
  documents,
  initialIndex,
  onClose,
}: {
  documents: InstructorDocument[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(initialIndex);
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const document = documents[index];
  if (!document) return null;

  const title = document.title || document.original_filename || 'Credential';
  const source = toAuthenticatedMediaUrl(document.file_url);
  const type = source
    ? portfolioMediaType(source, document.original_filename, document.mime_type)
    : 'other';

  return (
    <Dialog
      open
      onOpenChange={open => {
        if (!open) onClose();
      }}
    >
      <DialogContent className='flex h-[75dvh] max-h-[760px] w-[calc(100%-2rem)] max-w-3xl flex-col overflow-hidden sm:max-w-3xl'>
        <DialogHeader className='shrink-0 pr-6 text-left'>
          <DialogTitle className='break-words'>{title}</DialogTitle>
          <DialogDescription>
            Credential {index + 1} of {documents.length}
          </DialogDescription>
        </DialogHeader>
        <div className='bg-muted/20 min-h-0 flex-1 overflow-auto rounded-md border'>
          {!source || type === 'other' || failedSource === source ? (
            <EmptyState
              title='Preview unavailable'
              description={
                !source
                  ? 'This credential has no document attached.'
                  : 'This document could not be displayed inline.'
              }
            />
          ) : type === 'pdf' ? (
            <iframe
              key={source}
              src={source}
              title={title}
              className='h-full min-h-0 w-full border-0'
              onError={() => setFailedSource(source)}
            />
          ) : (
            <PortfolioMediaPreview
              key={source}
              url={source}
              title={title}
              name={document.original_filename}
              mime={document.mime_type}
            />
          )}
        </div>
        <div className='flex shrink-0 items-center justify-between gap-3'>
          <Button
            variant='outline'
            disabled={index === 0}
            onClick={() => setIndex(current => current - 1)}
          >
            Previous credential
          </Button>
          <Button
            variant='outline'
            disabled={index + 1 >= documents.length}
            onClick={() => setIndex(current => current + 1)}
          >
            Next credential
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
