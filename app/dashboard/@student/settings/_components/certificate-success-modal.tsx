import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Certificate } from '@/services/client';
import { CheckCircle2, Download, Shield } from 'lucide-react';

interface CertificateSuccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  certificate?: Certificate | null;
}

export function CertificateSuccessModal({
  open,
  onOpenChange,
  certificate,
}: CertificateSuccessModalProps) {
  if (!certificate) return null;

  const formattedCompletion = certificate.completion_date
    ? new Date(certificate.completion_date).toLocaleDateString()
    : '—';
  const formattedIssued = certificate.issued_date
    ? new Date(certificate.issued_date).toLocaleDateString()
    : '—';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-md text-center'>
        <DialogHeader className='flex flex-col items-center justify-center'>
          <div className='mb-4 flex justify-center'>
            <CheckCircle2 className='text-success h-12 w-12' />
          </div>
          <DialogTitle className='text-xl font-bold'>Certificate verified</DialogTitle>
          <DialogDescription className='text-muted-foreground'>
            This certificate is valid and ready for presentation.
          </DialogDescription>
        </DialogHeader>

        <div className='mt-4 space-y-2 text-sm'>
          <p className='text-lg font-semibold'>{certificate.certificate_type ?? 'Certificate'}</p>
          <p className='text-muted-foreground'>
            Number: {certificate.certificate_number ?? 'Unavailable'}
          </p>
          <p className='text-muted-foreground'>
            Grade: {certificate.final_grade ?? '—'}{' '}
            {certificate.grade_letter ? `(${certificate.grade_letter})` : ''}
          </p>
          <p className='text-muted-foreground'>Completed: {formattedCompletion}</p>
          <p className='text-muted-foreground'>Issued: {formattedIssued}</p>
        </div>

        <DialogFooter className='mt-6 flex justify-center gap-2'>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            disabled={!certificate.certificate_url}
            asChild={Boolean(certificate.certificate_url)}
          >
            {certificate.certificate_url ? (
              <a href={certificate.certificate_url} target='_blank' rel='noreferrer'>
                <Download className='mr-2 h-4 w-4' />
                Download
              </a>
            ) : (
              <>
                <Shield className='mr-2 h-4 w-4' />
                No file
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
