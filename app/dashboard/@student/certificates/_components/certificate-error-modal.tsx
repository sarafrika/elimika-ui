import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertTriangle } from 'lucide-react';

interface CertificateErrorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message?: string;
}

export function CertificateErrorModal({
  open,
  onOpenChange,
  message = 'The certificate could not be verified. Please check the number and try again.',
}: CertificateErrorModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-md text-center'>
        <DialogHeader className='flex flex-col items-center justify-center'>
          <div className='mb-4 flex justify-center'>
            <AlertTriangle className='h-12 w-12 text-destructive' />
          </div>
          <DialogTitle className='text-xl font-bold'>Verification Failed!</DialogTitle>
          <DialogDescription className='text-muted-foreground text-center font-bold'>
            {message}
          </DialogDescription>
          <DialogDescription className='text-muted-foreground text-center'>
            {'The certificate could not be verified. Please check the number and try again.'}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className='mt-6 flex justify-center'>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
