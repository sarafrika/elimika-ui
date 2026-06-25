'use client';

import { useMutation } from '@tanstack/react-query';
import { ExternalLink, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import type { CredentialDocument } from '@/services/admin/credential-review';
import {
  verifyCourseCreatorDocumentMutation,
  verifyDocumentMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';
import { DetailRow } from './DetailPanel';
import { PdfPreview } from './PdfPreview';
import { StatusBadge } from './StatusBadge';

function resolvePreview(document: CredentialDocument): string | undefined {
  return document.fileUrl ? toAuthenticatedMediaUrl(document.fileUrl) || document.fileUrl : undefined;
}

/** A single document card with preview, status, and a "Review & verify" action. */
export function CredentialDocumentCard({
  document,
  onReview,
  showOwner = false,
}: {
  document: CredentialDocument;
  onReview: () => void;
  showOwner?: boolean;
}) {
  const previewUrl = resolvePreview(document);
  return (
    <div className='flex flex-col overflow-hidden rounded-[16px] border border-border/70 bg-card shadow-sm'>
      {previewUrl ? (
        <PdfPreview documentUrl={previewUrl} documentTitle={document.documentTypeLabel} height={170} />
      ) : (
        <div className='flex h-[170px] items-center justify-center border-b border-border/60 bg-muted/20 text-sm text-muted-foreground'>
          No preview
        </div>
      )}
      <div className='flex flex-1 flex-col gap-3 p-4'>
        <div className='flex items-start justify-between gap-2'>
          <div className='min-w-0'>
            <p className='truncate text-sm font-medium text-foreground'>{document.documentTypeLabel}</p>
            <p className='truncate text-xs text-muted-foreground'>
              {showOwner ? document.ownerName : document.title}
            </p>
          </div>
          <StatusBadge tone={document.statusTone} label={document.statusLabel} />
        </div>
        <p className='text-xs text-muted-foreground'>
          {document.roleLabel} · {document.fileSize ?? 'Unknown size'}
          {document.uploadedAt ? ` · ${document.uploadedAt}` : ''}
        </p>
        <Button variant='outline' size='sm' className='mt-auto rounded-lg' onClick={onReview}>
          <ShieldCheck className='size-4' />
          Review &amp; verify
        </Button>
      </div>
    </div>
  );
}

/** Modal that previews a document and lets the admin verify it with optional notes. */
export function CredentialReviewDialog({
  document,
  verifierIdentity,
  onClose,
}: {
  document: CredentialDocument | null;
  verifierIdentity: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [notes, setNotes] = useState('');
  const instructorVerify = useMutation(verifyDocumentMutation());
  const creatorVerify = useMutation(verifyCourseCreatorDocumentMutation());
  const isPending = instructorVerify.isPending || creatorVerify.isPending;
  const previewUrl = document ? resolvePreview(document) : undefined;

  const handleVerify = async () => {
    if (!document?.ownerUuid || !document.documentUuid) {
      toast.error('Missing document identifiers.');
      return;
    }
    const trimmed = notes.trim() || undefined;
    try {
      if (document.role === 'instructor') {
        await instructorVerify.mutateAsync({
          path: { instructorUuid: document.ownerUuid, documentUuid: document.documentUuid },
          query: { verifiedBy: verifierIdentity, verificationNotes: trimmed },
        });
      } else {
        await creatorVerify.mutateAsync({
          path: { courseCreatorUuid: document.ownerUuid, documentUuid: document.documentUuid },
          query: { verifiedBy: verifierIdentity, verificationNotes: trimmed },
        });
      }
      toast.success('Document verified.');
      setNotes('');
      onClose();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to verify document.');
    }
  };

  return (
    <Dialog open={Boolean(document)} onOpenChange={open => (!open ? onClose() : undefined)}>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-2xl'>
        {document ? (
          <>
            <DialogHeader>
              <DialogTitle>{document.documentTypeLabel}</DialogTitle>
              <DialogDescription>
                {document.ownerName} · {document.roleLabel}
              </DialogDescription>
            </DialogHeader>

            {previewUrl ? (
              <div className='overflow-hidden rounded-[16px] border border-border/70'>
                <PdfPreview documentUrl={previewUrl} documentTitle={document.title} fullHeight />
              </div>
            ) : null}

            <div className='grid gap-3 sm:grid-cols-2'>
              <DetailRow
                label='Status'
                value={<StatusBadge tone={document.statusTone} label={document.statusLabel} />}
              />
              <DetailRow label='Document' value={document.title} />
              <DetailRow label='Uploaded' value={document.uploadedAt ?? 'Recently'} />
              <DetailRow label='Verified' value={document.verifiedAt ?? 'Not yet verified'} />
            </div>

            {document.notes ? (
              <div className='rounded-xl border border-dashed border-border/60 bg-muted/20 p-3 text-sm'>
                <p className='font-medium text-foreground'>Existing notes</p>
                <p className='text-muted-foreground'>{document.notes}</p>
              </div>
            ) : null}

            {!document.isVerified ? (
              <Textarea
                value={notes}
                onChange={event => setNotes(event.target.value)}
                placeholder='Add an audit note (optional) before verifying…'
                className='min-h-24 rounded-xl'
              />
            ) : null}

            <DialogFooter className='gap-2 sm:gap-2'>
              {previewUrl ? (
                <Button variant='outline' asChild>
                  <a href={previewUrl} target='_blank' rel='noreferrer'>
                    <ExternalLink className='size-4' />
                    Open file
                  </a>
                </Button>
              ) : null}
              <Button onClick={handleVerify} disabled={isPending || document.isVerified}>
                <ShieldCheck className='size-4' />
                {document.isVerified ? 'Already verified' : isPending ? 'Verifying…' : 'Verify document'}
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
