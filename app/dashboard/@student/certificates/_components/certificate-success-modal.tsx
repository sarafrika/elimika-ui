import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { certificatePDF } from '@/lib/certificate';
import { CheckCircle2, Download } from 'lucide-react';
import pdfMake from 'pdfmake/build/pdfmake';

interface CertificateSuccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: any;
}

export function CertificateSuccessModal({
  open,
  onOpenChange,
  data,
}: CertificateSuccessModalProps) {
  if (!data) return null;

  const handleDownload = () => {
    const docDef = certificatePDF({
      studentName: data.student_name || 'Student',
      courseTitle: data.course_title || 'Course',
      issuer: 'Sarafrika Learning',
      grade: data.grade_letter || '-',
      creditsEarned: data.credits || 0,
      completionDate: data.completion_date,
      signature: 'Instructor Signature',
      certificateNumber: data.certificate_number,
      certificateType: data.certificate_type,
      id: '',
      uuid: '',
    });

    pdfMake.createPdf(docDef).download(`${data.certificate_number}.pdf`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-md text-center'>
        <DialogHeader className='flex flex-col items-center justify-center'>
          <div className='mb-4 flex justify-center'>
            <CheckCircle2 className='h-12 w-12 text-green-500' />
          </div>
          <DialogTitle className='text-xl font-bold'>Certificate Verified</DialogTitle>
          <DialogDescription className='text-muted-foreground'>
            The certificate below has been successfully verified.
          </DialogDescription>
        </DialogHeader>

        <div className='mt-4 space-y-2'>
          <p className='text-lg font-semibold'>{data.student_name}</p>
          <p className='text-muted-foreground text-sm'>has successfully completed</p>
          <p className='font-semibold'>{data.course_title}</p>
          <p className='text-muted-foreground text-xs'>
            Grade: {data.grade_letter} • {data.final_grade}% • {data.validity_status}
          </p>
          <p className='text-muted-foreground text-xs'>
            Completed on: {new Date(data.completion_date).toLocaleDateString()}
          </p>
        </div>

        <DialogFooter className='mt-6 flex justify-center gap-2'>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleDownload}>
            <Download className='mr-2 h-4 w-4' /> Download PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
