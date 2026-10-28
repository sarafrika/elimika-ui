'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor-lazy';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import Spinner from '@/components/ui/spinner';
import {
  addProgramRemarkMutation,
  getProgramReportQueryKey,
} from '@/services/client/@tanstack/react-query.gen';
import type { ProgramReport } from '@/services/client/types.gen';
import { percent, shortDate } from './use-program-report';

const FIELDS = [
  { key: 'strengths', label: 'Strengths', hint: 'What the learner does well' },
  {
    key: 'improvements',
    label: 'Areas to improve',
    hint: 'What to work on before the next review',
  },
  {
    key: 'recommendations',
    label: 'Recommendations',
    hint: 'Practice, classes or activities to try',
  },
] as const;

type Draft = Record<(typeof FIELDS)[number]['key'], string> & { nextReview: string };
const EMPTY: Draft = { strengths: '', improvements: '', recommendations: '', nextReview: '' };

const hasText = (html: string) => html.replace(/<[^>]*>/g, '').trim().length > 0;

/** The class instructor's "Write remarks" Sheet; a saved remark is appended, never edited. */
export function ProgramRemarksSheet({
  report,
  learnerName,
  open,
  onOpenChange,
  onSaved,
}: {
  report: ProgramReport;
  learnerName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const add = useMutation({
    ...addProgramRemarkMutation(),
    onSuccess: () => {
      toast.success('Remarks saved');
      setDraft(EMPTY);
      onOpenChange(false);
      onSaved?.();
      void queryClient.invalidateQueries({
        queryKey: [
          { _id: getProgramReportQueryKey({ path: { programUuid: '', studentUuid: '' } })[0]._id },
        ],
      });
    },
    onError: cause =>
      toast.error(cause instanceof Error ? cause.message : 'Unable to save remarks'),
  });
  const filled = FIELDS.some(field => hasText(draft[field.key]));
  const name = learnerName ?? 'Learner';
  const first = name.split(/\s+/)[0];
  const last = [...(report.remarks ?? [])].sort(
    (a, b) => new Date(b.created_date ?? 0).getTime() - new Date(a.created_date ?? 0).getTime()
  )[0];
  const skills = report.skills ?? [];
  const achieved = skills.filter(skill => skill.counts_as_achieved).length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='w-full sm:max-w-[760px]' aria-label='Program remarks'>
        <SheetHeader className='shrink-0 border-b pr-12'>
          <SheetTitle>{name} · Program remarks</SheetTitle>
          <SheetDescription>
            {report.program_title}. Saved remarks are added to the report and can&apos;t be edited;
            write a new one to update.
          </SheetDescription>
        </SheetHeader>
        <div className='flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-5'>
          <p role='note' className='bg-muted/50 rounded-md px-3 py-2 text-sm'>
            {last ? `Your last remark was on ${shortDate(last.created_date)}. ` : ''}
            Program mark {percent(report.final_grade)}
            {report.final_grade_provisional !== false ? ' (provisional)' : ''} ·{' '}
            {report.mandatory_passed ?? 0} of {report.mandatory_total ?? 0} mandatory courses passed
            · {achieved} of {skills.length} skills achieved.
          </p>
          {FIELDS.map(field => (
            <div key={field.key} className='flex flex-col gap-1.5' data-field={field.key}>
              <span className='text-sm font-medium'>{field.label}</span>
              <span className='text-muted-foreground text-xs'>{field.hint}</span>
              <SimpleEditor
                value={draft[field.key]}
                onChange={value => setDraft(current => ({ ...current, [field.key]: value }))}
              />
            </div>
          ))}
          <div className='flex flex-col gap-1.5'>
            <Label htmlFor='next-review'>Next review date</Label>
            <Input
              id='next-review'
              type='date'
              className='max-w-[220px]'
              value={draft.nextReview}
              onChange={event =>
                setDraft(current => ({ ...current, nextReview: event.target.value }))
              }
            />
          </div>
          <p className='text-muted-foreground text-xs'>
            {first} and guardians who can see academics will see this remark with your name and
            today&apos;s date.
          </p>
        </div>
        <SheetFooter className='shrink-0 flex-row justify-end border-t'>
          <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type='button'
            disabled={!filled || add.isPending}
            onClick={() =>
              add.mutate({
                path: {
                  programUuid: report.program_uuid ?? '',
                  studentUuid: report.student_uuid ?? '',
                },
                body: {
                  strengths: hasText(draft.strengths) ? draft.strengths : undefined,
                  improvements: hasText(draft.improvements) ? draft.improvements : undefined,
                  recommendations: hasText(draft.recommendations)
                    ? draft.recommendations
                    : undefined,
                  // The API takes a plain ISO date; the generated type says Date.
                  next_review_date: (draft.nextReview || undefined) as unknown as Date | undefined,
                },
              })
            }
          >
            {add.isPending && <Spinner />}Save remarks
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
