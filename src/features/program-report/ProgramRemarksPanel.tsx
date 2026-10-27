'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor-lazy';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Spinner from '@/components/ui/spinner';
import {
  addProgramRemarkMutation,
  getProgramReportQueryKey,
} from '@/services/client/@tanstack/react-query.gen';
import type { ProgramReport } from '@/services/client/types.gen';
import { RemarkBody } from './ProgramReportView';

const FIELDS = [
  { key: 'strengths', label: 'Strengths' },
  { key: 'improvements', label: 'Areas to improve' },
  { key: 'recommendations', label: 'Recommendations' },
] as const;

type Draft = Record<(typeof FIELDS)[number]['key'], string> & { nextReview: string };
const EMPTY: Draft = { strengths: '', improvements: '', recommendations: '', nextReview: '' };

const hasText = (html: string) => html.replace(/<[^>]*>/g, '').trim().length > 0;

/** Earlier remarks, newest first, and the form the class's default instructor adds one with. */
export function ProgramRemarksPanel({
  report,
  canWrite,
}: {
  report: ProgramReport;
  /** Only the default instructor of one of the learner's programme classes may add a remark. */
  canWrite: boolean;
}) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const add = useMutation({
    ...addProgramRemarkMutation(),
    onSuccess: () => {
      toast.success('Remarks saved');
      setDraft(EMPTY);
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

  return (
    <section className='space-y-4' aria-label='Progress remarks'>
      <div className='flex flex-wrap items-baseline justify-between gap-2'>
        <h3 className='text-base font-semibold'>Progress remarks</h3>
        <span className='text-muted-foreground text-xs'>
          Shown to the learner and their guardians. Earlier remarks are kept.
        </span>
      </div>
      {(report.remarks ?? []).length === 0 && (
        <p className='text-muted-foreground text-sm'>No remarks yet.</p>
      )}
      {(report.remarks ?? []).map(remark => (
        <div
          key={remark.uuid}
          data-testid='programme-remark'
          className='rounded-xl border p-4 text-sm'
        >
          <RemarkBody remark={remark} />
        </div>
      ))}
      {canWrite && (
        <div className='space-y-3 border-t pt-4'>
          <div className='grid gap-3 lg:grid-cols-3'>
            {FIELDS.map(field => (
              <div key={field.key} className='space-y-1.5'>
                <span className='text-sm font-medium'>{field.label}</span>
                <SimpleEditor
                  value={draft[field.key]}
                  onChange={value => setDraft(current => ({ ...current, [field.key]: value }))}
                />
              </div>
            ))}
          </div>
          <div className='flex flex-wrap items-end justify-between gap-3'>
            <div className='space-y-1.5'>
              <Label htmlFor='next-review'>Next review date</Label>
              <Input
                id='next-review'
                type='date'
                value={draft.nextReview}
                onChange={event =>
                  setDraft(current => ({ ...current, nextReview: event.target.value }))
                }
              />
            </div>
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
                    next_review_date: (draft.nextReview || undefined) as unknown as
                      | Date
                      | undefined,
                  },
                })
              }
            >
              {add.isPending && <Spinner />}Save remarks
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
