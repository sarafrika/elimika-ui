'use client';

import { Printer } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { ProgramReport } from '@/services/client/types.gen';
import { ProgramReportPaper } from './ProgramReportPrint';

/** What prints, previewed in a Sheet; "Print report" opens the print route and its dialog. */
export function ProgramReportPreviewSheet({
  open,
  onOpenChange,
  report,
  learnerName,
  printHref,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: ProgramReport;
  learnerName?: string;
  printHref: string;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='w-full sm:max-w-[860px]'>
        <SheetHeader className='shrink-0 border-b pr-12'>
          <SheetTitle>Preview program report</SheetTitle>
          <SheetDescription>
            This is what prints. Drafts and unsubmitted scores are never included.
          </SheetDescription>
        </SheetHeader>
        <div className='min-h-0 flex-1 overflow-y-auto p-5' data-testid='programme-report-preview'>
          <ProgramReportPaper
            report={report}
            learnerName={learnerName ?? 'Learner'}
            className='rounded-md border p-6'
          />
        </div>
        <SheetFooter className='shrink-0 flex-row justify-end border-t'>
          <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button asChild>
            <Link href={`${printHref}?print=1`} target='_blank' rel='noopener'>
              <Printer className='size-4' /> Print report
            </Link>
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
